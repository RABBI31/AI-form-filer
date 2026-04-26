(() => {
  'use strict';

  // ── Custom Select Detection ──────────────────────────────────────────
  const CUSTOM_SELECT_SELECTORS = [
    '.v-select', '.v-autocomplete', '.v-combobox', '.v-select__slot',
    '[role="combobox"]', '[role="listbox"]',
    '.MuiSelect-root', '.MuiAutocomplete-root',
    '.ant-select', '.el-select', '.multiselect',
    '[data-headlessui-state]', '.choices',
    '.select2-container', '.ss-main', '.ts-wrapper',
  ].join(', ');

  const DROPDOWN_ITEM_SELECTORS = [
    '.v-list-item', '.v-list-item__title',
    '.menuable__content__active .v-list-item',
    '.v-overlay--active .v-list-item', '.v-menu .v-list-item',
    '.MuiMenu-list li', '.MuiMenuItem-root', '.MuiAutocomplete-option',
    '.ant-select-dropdown .ant-select-item', '.ant-select-item-option',
    '.el-select-dropdown__item',
    '[role="option"]', '[role="listbox"] [role="option"]',
    '.dropdown-item', '.dropdown-menu li', '.select-option', '.option',
  ].join(', ');

  /**
   * Selectors for modal / dialog containers.
   * When a modal is open, we only fill fields INSIDE the modal.
   */
  const MODAL_SELECTORS = [
    '.v-dialog--active',           // Vuetify v2
    '.v-dialog .v-card',           // Vuetify v2 card dialog
    '.v-overlay--active .v-card',  // Vuetify v3
    '.v-overlay--active .v-dialog',
    '[role="dialog"]',
    '.modal.show',                 // Bootstrap
    '.modal-dialog',
    '.MuiDialog-root',             // Material UI
    '.MuiModal-root',
    '.ant-modal-wrap',             // Ant Design
    '.el-dialog',                  // Element UI
    '.modal-content',
    '.dialog',
  ].join(', ');

  /**
   * Custom date picker selectors — these use <input type="text">
   * but should be treated as date fields and filled with dates.
   */
  const DATE_PICKER_SELECTORS = [
    '.v-date-picker',
    '.v-picker--date',
    '.MuiDatePicker-root',
    '.ant-picker-date',
    '.el-date-editor',
    '[data-datepicker]',
  ].join(', ');

  // ── Scope Detection ──────────────────────────────────────────────────

  /**
   * If a modal/dialog is open, return that container so we only fill
   * fields inside it. Otherwise return document.body (whole page).
   */
  function getActiveScope() {
    // Check for visible modals/dialogs
    const modals = document.querySelectorAll(MODAL_SELECTORS);
    for (const modal of modals) {
      const s = window.getComputedStyle(modal);
      if (s.display !== 'none' && s.visibility !== 'hidden' && modal.offsetParent !== null) {
        return modal;
      }
    }

    // Vuetify v3 — dialogs render inside .v-overlay containers
    const overlays = document.querySelectorAll('.v-overlay--active');
    for (const overlay of overlays) {
      // Skip overlays that are just menus (for dropdowns), only target dialogs
      const dialog = overlay.querySelector('.v-dialog, [role="dialog"], .v-card');
      if (dialog) return overlay;
    }

    return document.body;
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  function getLabelText(el) {
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) return label.innerText.trim();
    }
    const parent = el.closest('label');
    if (parent) {
      const clone = parent.cloneNode(true);
      clone.querySelectorAll('input, select, textarea').forEach(c => c.remove());
      return clone.innerText.trim();
    }
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
    if (el.getAttribute('aria-labelledby')) {
      const lbl = document.getElementById(el.getAttribute('aria-labelledby'));
      if (lbl) return lbl.innerText.trim();
    }
    const fieldWrap = el.closest('.v-input, .v-field, .v-text-field, .v-select, .v-autocomplete');
    if (fieldWrap) {
      const vLabel = fieldWrap.querySelector('.v-label, label');
      if (vLabel) return vLabel.innerText.trim();
    }
    const prev = el.previousElementSibling;
    if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN')) {
      return prev.innerText.trim();
    }
    return '';
  }

  function getCustomSelectLabel(container) {
    const vLabel = container.querySelector('.v-label, label, .v-input__slot label');
    if (vLabel) return vLabel.innerText.trim();
    if (container.getAttribute('aria-label')) return container.getAttribute('aria-label').trim();
    const prev = container.previousElementSibling;
    if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.classList.contains('v-label'))) {
      return prev.innerText.trim();
    }
    const wrapper = container.closest('.v-input, .form-group, .field-group');
    if (wrapper) {
      const lbl = wrapper.querySelector('label, .v-label, .form-label, legend');
      if (lbl) return lbl.innerText.trim();
    }
    return '';
  }

  function getOptions(el) {
    if (el.tagName === 'SELECT') {
      return Array.from(el.options).map(o => ({ value: o.value, text: o.textContent.trim() }));
    }
    if (el.type === 'radio' && el.name) {
      return Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`))
        .map(r => ({ value: r.value, text: getLabelText(r) || r.value }));
    }
    return [];
  }

  function extractMetadata(el) {
    return {
      tagName: el.tagName, type: el.type || '', name: el.name || '',
      id: el.id || '', placeholder: el.placeholder || '',
      label: getLabelText(el), autocomplete: el.getAttribute('autocomplete') || '',
      options: getOptions(el),
    };
  }

  function dispatchEvents(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function setNativeValue(el, value) {
    const descriptor =
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value') ||
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(el, value);
    else el.value = value;
  }

  function isInsideCustomSelect(el) {
    return !!el.closest(CUSTOM_SELECT_SELECTORS);
  }

  /**
   * Detect if a field is a date picker input (text input but used for dates).
   */
  function isDatePickerInput(el) {
    // Inside a known date picker wrapper
    if (el.closest(DATE_PICKER_SELECTORS)) return true;
    // Vuetify — check the wrapper's classes / label for date hints
    const wrapper = el.closest('.v-input, .v-text-field');
    if (wrapper) {
      const label = (wrapper.querySelector('.v-label, label') || {}).textContent || '';
      if (/date/i.test(label)) return true;
    }
    // Check the field's own attributes
    const context = `${el.name} ${el.id} ${el.placeholder} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
    if (/date|dob|birth/i.test(context)) return true;
    return false;
  }

  /**
   * Generate a random date string in YYYY-MM-DD format.
   */
  function generateDate() {
    const year = 2020 + Math.floor(Math.random() * 6);  // 2020-2025
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /**
   * Try to set a value on a Vuetify component via its Vue instance.
   * Works for both Vue 2 (__vue__) and Vue 3 (__vue_app__).
   */
  function trySetVueModel(el, value) {
    // Walk up to find the Vue component instance
    let node = el;
    for (let i = 0; i < 10 && node; i++) {
      // Vue 2
      if (node.__vue__) {
        const vm = node.__vue__;
        // Try common model prop names
        if (vm.$emit) {
          vm.$emit('input', value);
          vm.$emit('change', value);
          vm.$emit('update:modelValue', value); // Vue 3 style
        }
        if (typeof vm.inputValue !== 'undefined') vm.inputValue = value;
        if (typeof vm.lazyValue !== 'undefined') vm.lazyValue = value;
        if (typeof vm.internalValue !== 'undefined') vm.internalValue = value;
        return true;
      }
      // Vue 3 — check for __vueParentComponent
      if (node.__vueParentComponent) {
        const comp = node.__vueParentComponent;
        if (comp.emit) {
          comp.emit('update:modelValue', value);
          comp.emit('input', value);
          comp.emit('change', value);
        }
        if (comp.props && typeof comp.props.modelValue !== 'undefined') {
          comp.props.modelValue = value;
        }
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  // ── Field Discovery (scoped) ─────────────────────────────────────────

  function discoverNativeFields(scope) {
    const sel = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="file"]), select, textarea';
    return Array.from(scope.querySelectorAll(sel)).filter(el => {
      const s = window.getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || !el.offsetParent || el.disabled) return false;
      // Allow readonly date pickers through — they need special handling
      if (el.readOnly && !isDatePickerInput(el)) return false;
      if (el.tagName === 'INPUT' && isInsideCustomSelect(el)) return false;
      return true;
    });
  }

  function discoverCustomSelects(scope) {
    const all = scope.querySelectorAll(CUSTOM_SELECT_SELECTORS);
    const seen = new Set();
    const results = [];
    all.forEach(el => {
      const s = window.getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || !el.offsetParent) return;
      for (const parent of results) { if (parent.contains(el)) return; }
      if (seen.has(el)) return;
      let dominated = false;
      for (const other of results) { if (other.contains(el)) { dominated = true; break; } }
      if (dominated) return;
      seen.add(el);
      results.push(el);
    });
    return results;
  }

  // ── Custom Select Filling ────────────────────────────────────────────

  function fillCustomSelect(container) {
    return new Promise((resolve) => {
      const activator =
        container.querySelector('.v-input__slot') ||
        container.querySelector('.v-field') ||
        container.querySelector('.v-select__slot') ||
        container.querySelector('[role="combobox"]') ||
        container.querySelector('.v-field__input') ||
        container.querySelector('input') ||
        container;

      // Only fire one click — duplicate clicks can bubble up and hit submit buttons
      activator.click();

      const innerInput = container.querySelector('input');
      if (innerInput) {
        innerInput.focus();
        innerInput.dispatchEvent(new Event('focus', { bubbles: true }));
      }

      let attempts = 0;
      const maxAttempts = 15;
      const checkInterval = setInterval(() => {
        attempts++;
        const options = document.querySelectorAll(DROPDOWN_ITEM_SELECTORS);
        const visibleOptions = Array.from(options).filter(opt => {
          const s = window.getComputedStyle(opt);
          return s.display !== 'none' && s.visibility !== 'hidden' && opt.offsetParent !== null;
        });

        if (visibleOptions.length > 0) {
          clearInterval(checkInterval);
          const validOptions = visibleOptions.filter(opt => {
            const text = opt.textContent.trim().toLowerCase();
            return !opt.classList.contains('v-list-item--disabled') &&
                   !opt.hasAttribute('disabled') &&
                   !opt.getAttribute('aria-disabled') &&
                   text !== '' &&
                   !text.startsWith('select') &&
                   !text.startsWith('choose') &&
                   !text.startsWith('--') &&
                   !text.startsWith('no data');
          });

          const pickFrom = validOptions.length > 0 ? validOptions : visibleOptions;
          const chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)];

          // Only fire one click — duplicate clicks cause auto-submit
          chosen.scrollIntoView({ block: 'nearest' });
          chosen.click();

          container.style.transition = 'box-shadow 0.3s ease';
          container.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.5)';
          setTimeout(() => { container.style.boxShadow = ''; }, 1500);

          resolve(chosen.textContent.trim());
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
    });
  }

  /**
   * Fill a date picker input with a generated date value.
   * Handles Vuetify readonly inputs by temporarily removing readonly,
   * and also tries setting the Vue model directly.
   */
  function fillDatePicker(el) {
    const dateStr = generateDate();
    const wasReadonly = el.readOnly;

    // 1. Temporarily remove readonly so we can set the value
    if (wasReadonly) {
      el.readOnly = false;
      el.removeAttribute('readonly');
    }

    // 2. Set value via native setter
    setNativeValue(el, dateStr);
    dispatchEvents(el);

    // 3. Try setting via Vue model (Vuetify uses v-model binding)
    trySetVueModel(el, dateStr);

    // 4. Also set via attribute for frameworks that read from DOM
    el.setAttribute('value', dateStr);

    // 5. Dispatch additional events frameworks might listen to
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    // 6. Restore readonly after a delay (let Vue process the change first)
    if (wasReadonly) {
      setTimeout(() => {
        el.readOnly = true;
        el.setAttribute('readonly', '');
      }, 500);
    }

    return dateStr;
  }

  // ── Core Fill/Clear/Detect ───────────────────────────────────────────

  async function fillAllFields() {
    const scope = getActiveScope();
    const nativeFields = discoverNativeFields(scope);
    const customSelects = discoverCustomSelects(scope);
    const processedRadios = new Set();
    const summary = [];

    // 1. Fill native fields
    nativeFields.forEach(el => {
      if (el.type === 'radio') {
        if (processedRadios.has(el.name)) return;
        processedRadios.add(el.name);
      }

      // Check if this is a date picker input
      if (el.tagName === 'INPUT' && isDatePickerInput(el)) {
        const dateVal = fillDatePicker(el);
        el.style.transition = 'box-shadow 0.3s ease';
        el.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.5)';
        setTimeout(() => { el.style.boxShadow = ''; }, 1500);
        summary.push({
          label: getLabelText(el) || el.name || el.id || '(date field)',
          fieldType: 'date',
          fakeValue: dateVal,
        });
        return;
      }

      const meta = extractMetadata(el);
      const { fieldType, fakeValue } = window.AIClient.analyse(meta);

      if (el.type === 'checkbox') {
        el.checked = !!fakeValue; dispatchEvents(el);
      } else if (el.type === 'radio') {
        const t = document.querySelector(
          `input[type="radio"][name="${CSS.escape(el.name)}"][value="${CSS.escape(String(fakeValue))}"]`
        );
        if (t) { t.checked = true; dispatchEvents(t); }
      } else {
        setNativeValue(el, String(fakeValue)); dispatchEvents(el);
      }

      el.style.transition = 'box-shadow 0.3s ease';
      el.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.5)';
      setTimeout(() => { el.style.boxShadow = ''; }, 1500);
      summary.push({
        label: meta.label || meta.name || meta.id || '(unnamed)',
        fieldType,
        fakeValue,
      });
    });

    // 2. Fill custom selects
    for (const container of customSelects) {
      const label = getCustomSelectLabel(container);
      try {
        const selectedText = await fillCustomSelect(container);
        summary.push({
          label: label || '(custom select)',
          fieldType: 'select',
          fakeValue: selectedText || '(selected)',
        });
      } catch (err) {
        summary.push({
          label: label || '(custom select)',
          fieldType: 'select',
          fakeValue: '(failed: ' + err.message + ')',
        });
      }
    }

    return summary;
  }

  function clearAllFields() {
    const scope = getActiveScope();
    const fields = discoverNativeFields(scope);
    fields.forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else setNativeValue(el, '');
      dispatchEvents(el);
    });

    const customSelects = discoverCustomSelects(scope);
    customSelects.forEach(container => {
      const clearBtn =
        container.querySelector('.v-icon--clickable') ||
        container.querySelector('.mdi-close') ||
        container.querySelector('[aria-label="Clear"]') ||
        container.querySelector('.v-field__clearable button');
      if (clearBtn) clearBtn.click();
      const innerInput = container.querySelector('input');
      if (innerInput) {
        setNativeValue(innerInput, '');
        dispatchEvents(innerInput);
      }
    });

    return fields.length + customSelects.length;
  }

  function detectAllFields() {
    const scope = getActiveScope();
    const nativeFields = discoverNativeFields(scope).map(el => {
      const meta = extractMetadata(el);
      let fieldType;
      if (el.tagName === 'INPUT' && isDatePickerInput(el)) {
        fieldType = 'date';
      } else {
        fieldType = window.AIClient.analyse(meta).fieldType;
      }
      return {
        label: meta.label || meta.name || meta.id || '(unnamed)',
        fieldType,
        tagName: meta.tagName,
        type: meta.type,
      };
    });

    const customSelectFields = discoverCustomSelects(scope).map(container => ({
      label: getCustomSelectLabel(container) || '(custom select)',
      fieldType: 'select',
      tagName: 'CUSTOM-SELECT',
      type: 'select',
    }));

    return [...nativeFields, ...customSelectFields];
  }

  // ── Message Listener ─────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'fill') {
      fillAllFields()
        .then(summary => sendResponse({ success: true, filled: summary.length, summary }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
    try {
      if (msg.action === 'clear') {
        sendResponse({ success: true, cleared: clearAllFields() });
      } else if (msg.action === 'detect') {
        const fields = detectAllFields();
        sendResponse({ success: true, count: fields.length, fields });
      }
    } catch (err) { sendResponse({ success: false, error: err.message }); }
    return true;
  });
})();
