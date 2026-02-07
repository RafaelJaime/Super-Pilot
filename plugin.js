(function () {
  'use strict';

  const STORAGE_KEY = 'super-pilot-config';
  const ATTR_MARKER = 'data-super-pilot';

  const DEFAULT_SYSTEM_PROMPT = `You are Super Pilot, an AI assistant embedded in Super Productivity.
Your role is to help the user manage their tasks efficiently.

Rules:
- Be concise and direct. No preambles or unnecessary explanations.
- Use Markdown formatting when useful (lists, bold, etc.).
- When asked for a task description, include clear actionable steps.
- Match the language of the input text (reply in the same language the user writes in).
- Do not make up data or dates. Work with the context you have.
- Focus on productivity, clarity, and getting things done.`;

  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .sp-ai-btn {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      width: 26px;
      height: 26px;
      border: none;
      border-radius: 50%;
      background: var(--c-primary, #6366f1);
      color: #fff;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: opacity .15s, transform .15s;
      z-index: 1000;
      padding: 0;
    }
    .sp-ai-btn:hover { opacity: 1; transform: translateY(-50%) scale(1.1); }
    .sp-ai-btn svg { width: 16px; height: 16px; fill: currentColor; }

    .sp-ai-menu {
      position: fixed;
      z-index: 10001;
      background: var(--card-bg, #1e1e2e);
      border: 1px solid var(--border-color, #333);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,.3);
      padding: 4px 0;
      min-width: 200px;
      font-family: var(--font-primary-stack, sans-serif);
      color: var(--text-color, #cdd6f4);
    }
    .sp-ai-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      cursor: pointer;
      font-size: 13px;
      transition: background .1s;
      border: none;
      background: none;
      color: inherit;
      width: 100%;
      text-align: left;
    }
    .sp-ai-menu-item:hover { background: var(--c-primary-alpha-15, rgba(99,102,241,.15)); }
    .sp-ai-menu-item .sp-ai-ico { font-size: 15px; width: 20px; text-align: center; }
    .sp-ai-menu-sep { height: 1px; background: var(--border-color, #333); margin: 4px 0; }

    .sp-ai-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
    }

    .sp-ai-loading {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      width: 26px;
      height: 26px;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sp-ai-loading::after {
      content: '';
      width: 16px;
      height: 16px;
      border: 2px solid var(--c-primary, #6366f1);
      border-top-color: transparent;
      border-radius: 50%;
      animation: sp-spin .6s linear infinite;
    }
    @keyframes sp-spin { to { transform: rotate(360deg); } }

    .sp-ai-prompt-dialog {
      position: fixed;
      z-index: 10002;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--card-bg, #1e1e2e);
      border: 1px solid var(--border-color, #333);
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,.4);
      padding: 20px;
      min-width: 360px;
      font-family: var(--font-primary-stack, sans-serif);
      color: var(--text-color, #cdd6f4);
    }
    .sp-ai-prompt-dialog h3 { margin: 0 0 12px; font-size: 15px; }
    .sp-ai-prompt-dialog textarea {
      width: 100%;
      min-height: 80px;
      background: var(--bg, #11111b);
      color: var(--text-color, #cdd6f4);
      border: 1px solid var(--border-color, #333);
      border-radius: 6px;
      padding: 8px;
      font-size: 13px;
      resize: vertical;
      box-sizing: border-box;
    }
    .sp-ai-prompt-dialog .sp-ai-prompt-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }
    .sp-ai-prompt-dialog button {
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid var(--border-color, #333);
      background: var(--bg, #11111b);
      color: var(--text-color, #cdd6f4);
      cursor: pointer;
      font-size: 13px;
    }
    .sp-ai-prompt-dialog button.sp-primary {
      background: var(--c-primary, #6366f1);
      color: #fff;
      border-color: transparent;
    }
  `;
  document.head.appendChild(style);

  // ── AI sparkle icon SVG ─────────────────────────────────────────────
  const SPARKLE_SVG = `<svg viewBox="0 0 24 24"><path d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z"/></svg>`;

  // ── Menu actions ────────────────────────────────────────────────────
  const ACTIONS = [
    { id: 'generate', label: 'Generate description', icon: '📝', prompt: 'Generate a detailed description with actionable steps for the following task. Reply only with the description, no preamble:' },
    { id: 'improve', label: 'Improve text', icon: '✨', prompt: 'Improve and rewrite the following text to be clearer and more professional. Reply only with the improved text:' },
    { id: 'summarize', label: 'Summarize', icon: '📋', prompt: 'Summarize the following text concisely while keeping the key points. Reply only with the summary:' },
    { id: 'sep' },
    { id: 'custom', label: 'Custom prompt...', icon: '💬', prompt: null },
  ];

  // ── API call ────────────────────────────────────────────────────────
  async function callAI(systemPrompt, userContent) {
    const config = getConfig();
    if (!config.apiUrl || !config.apiKey || !config.model) {
      if (typeof PluginAPI !== 'undefined') {
        PluginAPI.showSnack({ msg: 'Super Pilot: Configure the API in the plugin panel', type: 'WARNING' });
      }
      throw new Error('API not configured');
    }

    const url = config.apiUrl.replace(/\/+$/, '') + '/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
          { role: 'user', content: `${systemPrompt}\n\n${userContent}` },
        ],
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  // ── Set value on input/textarea (Angular-compatible) ────────────────
  function setNativeValue(el, value) {
    const descriptor =
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value') ||
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ── Close any open menu ─────────────────────────────────────────────
  function closeMenu() {
    document.querySelectorAll('.sp-ai-menu, .sp-ai-overlay, .sp-ai-prompt-dialog').forEach(el => el.remove());
  }

  // ── Show custom prompt dialog ───────────────────────────────────────
  function showPromptDialog(inputEl) {
    closeMenu();

    const overlay = document.createElement('div');
    overlay.className = 'sp-ai-overlay';
    overlay.addEventListener('click', () => { overlay.remove(); dialog.remove(); });

    const dialog = document.createElement('div');
    dialog.className = 'sp-ai-prompt-dialog';
    dialog.innerHTML = `
      <h3>Prompt personalizado</h3>
      <textarea placeholder="Escribe tu instrucción para la IA..." autofocus></textarea>
      <div class="sp-ai-prompt-actions">
        <button class="sp-cancel">Cancelar</button>
        <button class="sp-primary sp-send">Enviar</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    const ta = dialog.querySelector('textarea');
    ta.focus();

    dialog.querySelector('.sp-cancel').addEventListener('click', () => { overlay.remove(); dialog.remove(); });
    dialog.querySelector('.sp-send').addEventListener('click', () => {
      const prompt = ta.value.trim();
      if (prompt) {
        overlay.remove();
        dialog.remove();
        executeAction(inputEl, prompt);
      }
    });

    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        dialog.querySelector('.sp-send').click();
      }
    });
  }

  // ── Execute AI action on an input ───────────────────────────────────
  async function executeAction(inputEl, actionPrompt) {
    const currentText = inputEl.value || '';
    const btn = inputEl.parentElement?.querySelector('.sp-ai-btn');

    if (btn) {
      btn.style.display = 'none';
      const loader = document.createElement('div');
      loader.className = 'sp-ai-loading';
      btn.parentElement.appendChild(loader);

      try {
        const result = await callAI(actionPrompt, currentText || '(campo vacío)');
        setNativeValue(inputEl, result);
        inputEl.focus();
      } catch (err) {
        if (typeof PluginAPI !== 'undefined') {
          PluginAPI.showSnack({ msg: `Super Pilot: ${err.message}`, type: 'ERROR' });
        }
      } finally {
        loader.remove();
        btn.style.display = '';
      }
    } else {
      try {
        const result = await callAI(actionPrompt, currentText || '(campo vacío)');
        setNativeValue(inputEl, result);
        inputEl.focus();
      } catch (err) {
        if (typeof PluginAPI !== 'undefined') {
          PluginAPI.showSnack({ msg: `Super Pilot: ${err.message}`, type: 'ERROR' });
        }
      }
    }
  }

  // ── Show action menu ────────────────────────────────────────────────
  function showMenu(inputEl, anchorEl) {
    closeMenu();

    const overlay = document.createElement('div');
    overlay.className = 'sp-ai-overlay';
    overlay.addEventListener('click', closeMenu);

    const menu = document.createElement('div');
    menu.className = 'sp-ai-menu';

    ACTIONS.forEach(action => {
      if (action.id === 'sep') {
        const sep = document.createElement('div');
        sep.className = 'sp-ai-menu-sep';
        menu.appendChild(sep);
        return;
      }

      const item = document.createElement('button');
      item.className = 'sp-ai-menu-item';
      item.innerHTML = `<span class="sp-ai-ico">${action.icon}</span><span>${action.label}</span>`;
      item.addEventListener('click', () => {
        closeMenu();
        if (action.id === 'custom') {
          showPromptDialog(inputEl);
        } else {
          executeAction(inputEl, action.prompt);
        }
      });
      menu.appendChild(item);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(menu);

    // Position menu near anchor button
    const rect = anchorEl.getBoundingClientRect();
    let top = rect.bottom + 4;
    let left = rect.right - 200;

    if (left < 8) left = 8;
    if (top + 300 > window.innerHeight) top = rect.top - 300;

    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
  }

  // ── Inject AI button next to an input/textarea ──────────────────────
  function injectButton(el) {
    if (el.getAttribute(ATTR_MARKER)) return;
    if (el.type === 'hidden' || el.type === 'checkbox' || el.type === 'radio' || el.type === 'submit' || el.type === 'button' || el.type === 'file' || el.type === 'color' || el.type === 'range' || el.type === 'date' || el.type === 'number') return;
    if (el.readOnly || el.disabled) return;
    if (el.closest('.sp-ai-prompt-dialog')) return;

    el.setAttribute(ATTR_MARKER, '1');

    // Ensure parent has relative positioning for absolute button
    const parent = el.parentElement;
    if (parent) {
      const pos = getComputedStyle(parent).position;
      if (pos === 'static') {
        parent.style.position = 'relative';
      }
    }
  }

  // ── Scan and observe DOM ────────────────────────────────────────────
  function scanForInputs(root) {
    const els = (root || document).querySelectorAll('input:not([data-super-pilot]), textarea:not([data-super-pilot])');
    els.forEach(injectButton);
  }

  // Initial scan
  scanForInputs();

  // Observe for dynamically added inputs
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches?.('input, textarea')) {
          injectButton(node);
        }
        if (node.querySelectorAll) {
          scanForInputs(node);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ── Register side panel button ────────────────────────────────────
  if (typeof PluginAPI !== 'undefined') {
    PluginAPI.registerSidePanelButton({
      label: 'Super Pilot',
      icon: 'smart_toy',
      onClick: () => {}
    });
  }
})();
