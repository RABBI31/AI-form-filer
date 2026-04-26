/**
 * AIClient — analyses form field metadata and determines the best field type
 * using heuristic rules (no external AI API required).
 *
 * The detection logic mirrors the system prompt's supported field types and
 * uses label text, input name, type attribute, placeholder, and autocomplete
 * hints to classify each field.
 */

const AIClient = (() => {
  // ── Pattern map: regex → fieldType ────────────────────────────────────
  // Order matters — more specific patterns come first.
  const patterns = [
    { re: /e[-_]?mail/i,                           type: 'email'        },
    { re: /password|passwd|pwd/i,                   type: 'password'     },
    { re: /first[-_\s]?name|fname|given[-_\s]?name/i, type: 'first_name' },
    { re: /last[-_\s]?name|lname|surname|family[-_\s]?name/i, type: 'last_name' },
    { re: /full[-_\s]?name|your[-_\s]?name/i,      type: 'name'         },
    { re: /user[-_\s]?name|login/i,                 type: 'username'     },
    { re: /phone|tel|mobile|cell/i,                 type: 'phone'        },
    { re: /employee[-_\s]?id|emp[-_\s]?id/i,       type: 'employee_id'  },
    { re: /company|org(aniz|anis)ation/i,           type: 'company_name' },
    { re: /salary|income|wage|pay/i,                type: 'salary'       },
    { re: /\bage\b/i,                               type: 'age'          },
    { re: /date[-_\s]?of[-_\s]?birth|dob|birth[-_\s]?date|date/i, type: 'date' },
    { re: /city|town/i,                             type: 'city'         },
    { re: /country|nation/i,                        type: 'country'      },
    { re: /address|street/i,                        type: 'address'      },
    { re: /zip|postal/i,                            type: 'number'       },
    { re: /name/i,                                  type: 'name'         },
    { re: /number|amount|qty|quantity/i,            type: 'number'       },
  ];

  // ── Autocomplete → fieldType mapping ──────────────────────────────────
  const autoCompleteMap = {
    'given-name':           'first_name',
    'family-name':          'last_name',
    'name':                 'name',
    'email':                'email',
    'username':             'username',
    'new-password':         'password',
    'current-password':     'password',
    'tel':                  'phone',
    'tel-national':         'phone',
    'street-address':       'address',
    'address-line1':        'address',
    'address-line2':        'address',
    'address-level2':       'city',
    'country-name':         'country',
    'country':              'country',
    'postal-code':          'number',
    'organization':         'company_name',
    'bday':                 'date',
  };

  // ── Input type → fieldType fallback ───────────────────────────────────
  const inputTypeMap = {
    'email':    'email',
    'password': 'password',
    'tel':      'phone',
    'number':   'number',
    'date':     'date',
    'url':      'text',
    'checkbox': 'checkbox',
    'radio':    'radio',
  };

  /**
   * Analyse a single field's metadata and return { fieldType, fakeValue }.
   *
   * @param {Object} meta
   *   @param {string}  meta.tagName       — 'INPUT' | 'SELECT' | 'TEXTAREA'
   *   @param {string}  meta.type          — input type attribute
   *   @param {string}  meta.name          — input name attribute
   *   @param {string}  meta.id            — input id attribute
   *   @param {string}  meta.placeholder   — placeholder text
   *   @param {string}  meta.label         — associated <label> text
   *   @param {string}  meta.autocomplete  — autocomplete attribute
   *   @param {Array}   meta.options       — select/radio options [{value, text}]
   * @returns {{ fieldType: string, fakeValue: string|number|boolean }}
   */
  function analyse(meta) {
    const {
      tagName = '',
      type = 'text',
      name = '',
      id = '',
      placeholder = '',
      label = '',
      autocomplete = '',
      options = [],
    } = meta;

    let fieldType = null;

    // 1. Textarea shortcut
    if (tagName.toUpperCase() === 'TEXTAREA') {
      fieldType = 'textarea';
    }

    // 2. Select shortcut
    if (!fieldType && tagName.toUpperCase() === 'SELECT') {
      fieldType = 'select';
    }

    // 3. Autocomplete attribute (very reliable)
    if (!fieldType && autocomplete) {
      fieldType = autoCompleteMap[autocomplete.trim().toLowerCase()] || null;
    }

    // 4. Pattern matching against combined context string
    if (!fieldType) {
      const context = `${label} ${name} ${id} ${placeholder}`;
      for (const { re, type: t } of patterns) {
        if (re.test(context)) {
          fieldType = t;
          break;
        }
      }
    }

    // 5. Fallback to input type
    if (!fieldType) {
      fieldType = inputTypeMap[type.toLowerCase()] || 'text';
    }

    // 6. Build context string for the generator
    const context = `${label} ${name} ${id} ${placeholder}`;

    // 7. Generate the fake value
    const fakeValue = window.FakeGenerator
      ? window.FakeGenerator.generate(fieldType, context, options)
      : '';

    return { fieldType, fakeValue };
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { analyse };
})();

if (typeof window !== 'undefined') {
  window.AIClient = AIClient;
}
