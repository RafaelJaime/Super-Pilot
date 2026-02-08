# Super Pilot

AI copilot plugin for [Super Productivity](https://super-productivity.com). Adds an AI-powered chat agent that can manage your tasks, projects, and tags, plus inline text actions on any input field.

## Features

### Chat Agent
A side-panel chat that connects to any OpenAI-compatible API (OpenAI, Anthropic, Groq, OpenRouter, Gemini, Ollama, etc.) with tool-calling capabilities:

- **Get tasks** — list all, archived, or current context tasks
- **Create tasks** — add new tasks with title and notes
- **Update tasks** — modify title, notes, or mark as done
- **Get/create projects** — list all projects or create new ones
- **Get/create tags** — list all tags or create new ones

The agent uses function calling to interact with Super Productivity's data in real time.

### Inline Text Actions
An AI button appears on text inputs and textareas throughout Super Productivity:

- **Generate description** — create actionable task descriptions
- **Improve text** — rewrite for clarity and professionalism
- **Summarize** — condense text to key points
- **Custom prompt** — send any instruction to the AI

## Installation

1. Download or clone this repository
2. In Super Productivity, go to **Settings > Plugins > Load Plugin from Folder**
3. Select the project folder
4. Open the Super Pilot side panel and configure your API connection

## Configuration

Open the settings panel (gear icon) and set:

- **API URL** — endpoint for your provider (presets available for popular providers)
- **API Key** — your API key (stored in localStorage only)
- **Model** — model name (e.g. `gpt-4o`, `claude-sonnet-4-5-20250929`, `llama-3.3-70b-versatile`)
- **System Prompt** — optional custom base instructions

## Project Structure

```
├── manifest.json       # Plugin metadata
├── plugin.js           # Inline text actions (runs in app context)
├── index.html          # Built output (do NOT edit directly)
├── icon.svg            # Plugin icon
├── build.sh            # Assembles src/ modules into index.html
└── src/
    ├── base.html       # HTML template with placeholders
    ├── base.css        # Global styles
    ├── settings/       # Settings panel (html, css, js)
    ├── chat/           # Chat agent (html, css, js)
    └── input/          # Input bar (html, css, js)
```

## Development

Edit source files in `src/`, then rebuild:

```bash
bash build.sh
```

This inlines all CSS and JS into `index.html` (required by Super Productivity's CSP).

## Requirements

- Super Productivity **v14.0.0** or later
- An API key for any OpenAI-compatible provider

## License

MIT
