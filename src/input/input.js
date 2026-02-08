      // ── Input Elements ──
      const chatInput = document.getElementById('chatInput');
      const sendBtn = document.getElementById('sendBtn');

      // ── Auto-resize textarea ──────────────────────────
      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
      });

      // ── Send message ──────────────────────────────────
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      sendBtn.addEventListener('click', sendMessage);

      async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        const config = getConfig();
        if (!config.apiUrl || !config.apiKey || !config.model) {
          if (emptyState) emptyState.style.display = 'none';
          addMessage('user', text);
          chatInput.value = '';
          chatInput.style.height = 'auto';
          const errEl = addMessage('assistant', '');
          errEl.innerHTML = 'API not configured yet. <button class="go-settings-btn">Open Settings</button>';
          errEl.querySelector('.go-settings-btn').addEventListener('click', openSettings);
          messagesEl.scrollTop = messagesEl.scrollHeight;
          return;
        }

        if (emptyState) emptyState.style.display = 'none';

        addMessage('user', text);
        chatHistory.push({ role: 'user', content: text });
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;

        const typingEl = addMessage('assistant', '', true);

        try {
          await agentLoop(config, typingEl);
        } catch (err) {
          typingEl.classList.remove('typing');
          typingEl.innerHTML = `<span style="color:#f38ba8">${escapeHtml(err.message)}</span>`;
        } finally {
          sendBtn.disabled = false;
          chatInput.focus();
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }
