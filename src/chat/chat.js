      // ── PluginAPI Tool Definitions (OpenAI function calling format) ──
      const AGENT_TOOLS = [
        {
          type: 'function',
          function: {
            name: 'getTasks',
            description: 'Get all tasks from Super Productivity',
            parameters: { type: 'object', properties: {}, required: [] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'getArchivedTasks',
            description: 'Get all archived/completed tasks',
            parameters: { type: 'object', properties: {}, required: [] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'getCurrentContextTasks',
            description: 'Get tasks in the current context/project',
            parameters: { type: 'object', properties: {}, required: [] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'addTask',
            description: 'Create a new task',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Task title' },
                notes: { type: 'string', description: 'Task notes/description (optional)' }
              },
              required: ['title']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'updateTask',
            description: 'Update an existing task by ID',
            parameters: {
              type: 'object',
              properties: {
                taskId: { type: 'string', description: 'The task ID to update' },
                updates: {
                  type: 'object',
                  description: 'Fields to update (e.g. title, notes, isDone)',
                  properties: {
                    title: { type: 'string' },
                    notes: { type: 'string' },
                    isDone: { type: 'boolean' }
                  }
                }
              },
              required: ['taskId', 'updates']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'getAllProjects',
            description: 'Get all projects',
            parameters: { type: 'object', properties: {}, required: [] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'addProject',
            description: 'Create a new project',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Project title' }
              },
              required: ['title']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'getAllTags',
            description: 'Get all tags',
            parameters: { type: 'object', properties: {}, required: [] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'addTag',
            description: 'Create a new tag',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Tag name' }
              },
              required: ['title']
            }
          }
        }
      ];

      // ── Execute a PluginAPI tool call ──
      function executeToolCall(name, args) {
        if (typeof PluginAPI === 'undefined') {
          return { error: 'PluginAPI is not available' };
        }
        try {
          switch (name) {
            case 'getTasks':
              return PluginAPI.getTasks();
            case 'getArchivedTasks':
              return PluginAPI.getArchivedTasks();
            case 'getCurrentContextTasks':
              return PluginAPI.getCurrentContextTasks();
            case 'addTask':
              return PluginAPI.addTask({ title: args.title, notes: args.notes || '' });
            case 'updateTask':
              return PluginAPI.updateTask(args.taskId, args.updates);
            case 'getAllProjects':
              return PluginAPI.getAllProjects();
            case 'addProject':
              return PluginAPI.addProject({ title: args.title });
            case 'getAllTags':
              return PluginAPI.getAllTags();
            case 'addTag':
              return PluginAPI.addTag({ title: args.title });
            default:
              return { error: `Unknown tool: ${name}` };
          }
        } catch (err) {
          return { error: err.message };
        }
      }

      // ── Chat Elements ──
      const chatView = document.getElementById('chatView');
      const messagesEl = document.getElementById('messages');
      const emptyState = document.getElementById('emptyState');

      let chatHistory = [];

      // ── Agentic loop: calls API, executes tools, repeats until text response ──
      async function agentLoop(config, typingEl) {
        const url = config.apiUrl.replace(/\/+$/, '') + '/chat/completions';
        const MAX_ITERATIONS = 10;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
          const body = {
            model: config.model,
            messages: [
              { role: 'system', content: config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
              ...chatHistory,
            ],
            max_tokens: 2048,
            tools: AGENT_TOOLS,
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const err = await res.text();
            throw new Error(`API error ${res.status}: ${err.substring(0, 200)}`);
          }

          const data = await res.json();
          const choice = data.choices?.[0];
          const message = choice?.message;

          if (!message) throw new Error('Empty response from API');

          // If the model wants to call tools
          if (message.tool_calls && message.tool_calls.length > 0) {
            // Add the assistant message with tool_calls to history
            chatHistory.push({
              role: 'assistant',
              content: message.content || null,
              tool_calls: message.tool_calls,
            });

            // Show tool activity in the typing indicator
            const toolNames = message.tool_calls.map(tc => tc.function.name).join(', ');
            typingEl.innerHTML = `<span style="color:var(--text-muted,#a6adc8);font-size:11px">⚙ ${escapeHtml(toolNames)}...</span>`;

            // Execute each tool call and add results to history
            for (const toolCall of message.tool_calls) {
              const fnName = toolCall.function.name;
              let args = {};
              try {
                args = JSON.parse(toolCall.function.arguments || '{}');
              } catch {}

              const result = executeToolCall(fnName, args);
              let resultStr;
              try {
                resultStr = JSON.stringify(result, null, 2);
                // Truncate very large results to avoid token limits
                if (resultStr.length > 8000) {
                  const parsed = Array.isArray(result) ? result : [result];
                  resultStr = JSON.stringify(
                    parsed.slice(0, 20).map(item => ({
                      id: item.id,
                      title: item.title,
                      isDone: item.isDone,
                      notes: item.notes ? item.notes.substring(0, 100) : undefined,
                    })),
                    null, 2
                  ) + `\n... (${parsed.length} total items, showing first 20)`;
                }
              } catch {
                resultStr = String(result);
              }

              chatHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: resultStr,
              });
            }

            // Continue the loop — call the API again with tool results
            continue;
          }

          // No tool calls — this is the final text response
          const reply = message.content?.trim() || '(empty response)';
          chatHistory.push({ role: 'assistant', content: reply });
          typingEl.classList.remove('typing');
          typingEl.innerHTML = escapeHtml(reply) + `<span class="model-tag">${config.model}</span>`;
          return;
        }

        // Max iterations reached
        typingEl.classList.remove('typing');
        typingEl.innerHTML = escapeHtml('Agent stopped after maximum iterations.');
      }

      function addMessage(role, text, typing = false) {
        const el = document.createElement('div');
        el.className = `msg ${role}` + (typing ? ' typing' : '');
        if (text) el.textContent = text;
        messagesEl.appendChild(el);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return el;
      }

      function escapeHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      }
