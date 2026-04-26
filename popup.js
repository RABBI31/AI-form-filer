/**
 * Popup script — sends messages to the active tab's content script
 * and renders results in the popup UI.
 */
(() => {
  'use strict';

  const btnFill   = document.getElementById('btn-fill');
  const btnClear  = document.getElementById('btn-clear');
  const btnDetect = document.getElementById('btn-detect');
  const statusEl  = document.getElementById('status');
  const panelEl   = document.getElementById('panel-fields');
  const listEl    = document.getElementById('field-list');
  const emptyEl   = document.getElementById('empty-state');

  // ── Helpers ──────────────────────────────────────────────────────────

  function showStatus(type, msg) {
    statusEl.className = `status-bar visible ${type}`;
    statusEl.textContent = msg;
    setTimeout(() => { statusEl.classList.remove('visible'); }, 4000);
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    if (loading) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = '<div class="spinner"></div> Working…';
    } else if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
    }
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function sendToTab(action) {
    const tab = await getActiveTab();
    if (!tab || !tab.id) throw new Error('No active tab found');
    return chrome.tabs.sendMessage(tab.id, { action });
  }

  function renderFields(fields) {
    listEl.innerHTML = '';
    if (!fields || fields.length === 0) {
      emptyEl.style.display = '';
      panelEl.style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';
    panelEl.style.display = '';

    fields.forEach(f => {
      const item = document.createElement('div');
      item.className = 'field-item';
      item.innerHTML = `
        <span class="field-label" title="${f.label}">${f.label}</span>
        <span class="field-badge">${f.fieldType}</span>
      `;
      listEl.appendChild(item);
    });
  }

  // ── Button Handlers ──────────────────────────────────────────────────

  btnFill.addEventListener('click', async () => {
    setLoading(btnFill, true);
    try {
      const res = await sendToTab('fill');
      if (res.success) {
        showStatus('success', `✓ Filled ${res.filled} field${res.filled !== 1 ? 's' : ''} successfully`);
        renderFields(res.summary);
      } else {
        showStatus('error', `✕ ${res.error}`);
      }
    } catch (err) {
      showStatus('error', '✕ Could not reach page — try refreshing');
    }
    setLoading(btnFill, false);
  });

  btnClear.addEventListener('click', async () => {
    setLoading(btnClear, true);
    try {
      const res = await sendToTab('clear');
      if (res.success) {
        showStatus('info', `Cleared ${res.cleared} field${res.cleared !== 1 ? 's' : ''}`);
        panelEl.style.display = 'none';
        emptyEl.style.display = '';
      } else {
        showStatus('error', `✕ ${res.error}`);
      }
    } catch (err) {
      showStatus('error', '✕ Could not reach page — try refreshing');
    }
    setLoading(btnClear, false);
  });

  btnDetect.addEventListener('click', async () => {
    setLoading(btnDetect, true);
    try {
      const res = await sendToTab('detect');
      if (res.success) {
        showStatus('success', `Found ${res.count} field${res.count !== 1 ? 's' : ''} on the page`);
        renderFields(res.fields);
      } else {
        showStatus('error', `✕ ${res.error}`);
      }
    } catch (err) {
      showStatus('error', '✕ Could not reach page — try refreshing');
    }
    setLoading(btnDetect, false);
  });
})();
