      const STORAGE_KEY = 'super-pilot-config';
      const DEFAULT_SYSTEM_PROMPT = `You are Super Pilot, an AI agent embedded in Super Productivity.
You can manage tasks, projects, and tags using the available tools.

Rules:
- Be concise and direct. No preambles or unnecessary explanations.
- Use Markdown formatting when useful (lists, bold, etc.).
- Match the language of the input text (reply in the same language the user writes in).
- Do not make up data or dates. Work with the context you have.
- Focus on productivity, clarity, and getting things done.
- When the user asks about their tasks, projects, or tags, USE the tools to fetch real data.
- When asked to create or update items, USE the corresponding tools.
- Always confirm actions with a brief summary of what was done.
- When creating tasks, generate a short descriptive title. NEVER put the user's raw input as the title. Place any details, context, or the user's original text in the notes/description field instead.`;

      // ── Settings Elements ──
      const settingsView = document.getElementById('settingsView');
      const settingsToggle = document.getElementById('settingsToggle');
      const statusEl = document.getElementById('status');

      const fields = {
        apiUrl: document.getElementById('apiUrl'),
        apiKey: document.getElementById('apiKey'),
        model: document.getElementById('model'),
        systemPrompt: document.getElementById('systemPrompt'),
      };

      let isSettingsOpen = false;

      // ── Settings toggle ───────────────────────────────
      settingsToggle.addEventListener('click', () => {
        isSettingsOpen = !isSettingsOpen;
        settingsView.classList.toggle('visible', isSettingsOpen);
        chatView.classList.toggle('hidden', isSettingsOpen);
        settingsToggle.classList.toggle('active', isSettingsOpen);
      });

      // ── Config helpers ────────────────────────────────
      function getConfig() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
      }

      function loadConfig() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          const config = JSON.parse(raw);
          if (config.apiUrl) fields.apiUrl.value = config.apiUrl;
          if (config.apiKey) fields.apiKey.value = config.apiKey;
          if (config.model) fields.model.value = config.model;
          if (config.systemPrompt) fields.systemPrompt.value = config.systemPrompt;
        } catch {}
      }

      function saveConfigFromForm() {
        const config = {
          apiUrl: fields.apiUrl.value.trim(),
          apiKey: fields.apiKey.value.trim(),
          model: fields.model.value.trim(),
          systemPrompt: fields.systemPrompt.value.trim(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        if (typeof PluginAPI !== 'undefined') {
          PluginAPI.persistDataSynced(JSON.stringify(config));
        }
        showStatus('Configuration saved', 'success');
      }

      async function testConnection() {
        const config = {
          apiUrl: fields.apiUrl.value.trim(),
          apiKey: fields.apiKey.value.trim(),
          model: fields.model.value.trim(),
        };
        if (!config.apiUrl || !config.apiKey || !config.model) {
          showStatus('Please fill in all fields first', 'error');
          return;
        }
        showStatus('Testing connection...', 'success');
        try {
          const url = config.apiUrl.replace(/\/+$/, '') + '/chat/completions';
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: 'user', content: 'Reply only with: OK' }],
              max_tokens: 10,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content || '';
            showStatus(`Connection successful. Response: "${reply}"`, 'success');
          } else {
            const err = await res.text();
            showStatus(`Error ${res.status}: ${err.substring(0, 200)}`, 'error');
          }
        } catch (err) {
          showStatus(`Connection error: ${err.message}`, 'error');
        }
      }

      function showStatus(msg, type) {
        statusEl.textContent = msg;
        statusEl.className = 'status ' + type;
      }

      function openSettings() {
        isSettingsOpen = true;
        settingsView.classList.add('visible');
        chatView.classList.add('hidden');
        settingsToggle.classList.add('active');
      }

      // ── Settings event listeners ──────────────────────
      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          fields.apiUrl.value = btn.dataset.url;
          fields.model.value = btn.dataset.model;
        });
      });

      document.getElementById('saveBtn').addEventListener('click', saveConfigFromForm);
      document.getElementById('testBtn').addEventListener('click', testConnection);

      // ── Init config ───────────────────────────────────
      loadConfig();
      if (typeof PluginAPI !== 'undefined') {
        try {
          const synced = PluginAPI.loadSyncedData();
          if (synced && !localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, synced);
            loadConfig();
          }
        } catch {}
      }
