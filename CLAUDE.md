# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Super Productivity plugin** project. Super Productivity is a task management app, and this plugin extends its functionality via the Plugin API (`PluginAPI` global object).

## Plugin Structure

```
├── manifest.json      # Plugin metadata (required)
├── plugin.js          # Main JS executed on activation and app start
├── index.html         # UI interface (optional, requires iFrame:true in manifest)
└── icon.svg           # Plugin icon (optional)
```

## Key Constraints

- **Iframe plugins must inline everything**: All CSS and JS must be inside `index.html`. External stylesheets and scripts are blocked by CSP.
- **Registration methods (`registerHeaderButton`, `registerMenuEntry`, `registerSidePanelButton`, `registerShortcut`, `registerHook`) are only available in `plugin.js`**, not in iframe context.
- **manifest.json `manifestVersion` must be `1`**.
- Plugins run sandboxed: no direct file system access, only through `PluginAPI`.
- Use theme CSS variables (`--c-primary`, `--bg`, `--text-color`, `--card-bg`, etc.) to match the app's look.
- `console.log` calls should be minimal in production code.

## PluginAPI Quick Reference

### Data
- `getTasks()`, `getArchivedTasks()`, `getCurrentContextTasks()`
- `addTask(task)`, `updateTask(taskId, updates)`
- `getAllProjects()`, `addProject(project)`, `updateProject(projectId, updates)`
- `getAllTags()`, `addTag(tag)`, `updateTag(tagId, updates)`
- Counters: `getCounter(id)`, `setCounter(id, value)`, `incrementCounter(id)`, `decrementCounter(id)`, `deleteCounter(id)`
- SimpleCounter CRUD: `getAllSimpleCounters()`, `getSimpleCounter(id)`, `updateSimpleCounter(id, updates)`, `deleteSimpleCounter(id)`, etc.

### UI
- `showSnack({ msg, type, ico?, actionStr?, actionFn? })` — types: SUCCESS, ERROR, INFO, WARNING
- `notify({ title, body, ico })` — system notification
- `openDialog({ title, content, okBtnLabel, cancelBtnLabel })`

### Registration (plugin.js only)
- `registerHeaderButton({ id?, label, icon, onClick })`
- `registerMenuEntry({ label, icon, onClick })`
- `registerSidePanelButton({ label, icon, onClick })`
- `registerShortcut({ keys, label, action })`
- `registerHook(hookName, callback)` — hooks: `taskComplete`, `taskUpdate`, `taskDelete`, `currentTaskChange`, `finishDay`, `languageChange`, `persistedDataUpdate`, `action`

### Persistence
- `persistDataSynced(jsonString)` / `loadSyncedData()` — synced storage
- `localStorage` — local-only storage

## Testing

- Use "Load Plugin from Folder" in Super Productivity to load the plugin locally.
- Use https://test-app.super-productivity.com/ for testing (never test on real data).
- Open DevTools (`Ctrl+Shift+I`) to see console output and errors.

## UI Kit (iframe plugins)

Theme variables and a CSS reset are auto-injected. Disable with `"uiKit": false` in manifest.

Button variants: default `<button>`, `.btn-primary`, `.btn-outline`.
Card: `.card`, `.card.card-clickable`.
Utilities: `.text-muted`, `.text-primary`, `.page-fade`.
