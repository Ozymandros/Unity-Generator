# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:import-analysis] Failed to resolve import \"@tauri-apps/api/shell\" from \"src/components/UnityProjectPanel.vue\". Does the file exist?"
  - generic [ref=e5]: C:/Projects/Unity-Generator/frontend/src/components/UnityProjectPanel.vue:92:36
  - generic [ref=e6]: "85 | } 86 | try { 87 | const { open } = await import(\"@tauri-apps/api/shell\"); | ^ 88 | await open(path); 89 | status.value = \"Opened output folder.\";"
  - generic [ref=e7]: at TransformPluginContext._formatLog (file:///C:/Projects/Unity-Generator/frontend/node_modules/.pnpm/vite@7.3.1_@types+node@25.2.2/node_modules/vite/dist/node/chunks/config.js:28999:43) at TransformPluginContext.error (file:///C:/Projects/Unity-Generator/frontend/node_modules/.pnpm/vite@7.3.1_@types+node@25.2.2/node_modules/vite/dist/node/chunks/config.js:28996:14) at normalizeUrl (file:///C:/Projects/Unity-Generator/frontend/node_modules/.pnpm/vite@7.3.1_@types+node@25.2.2/node_modules/vite/dist/node/chunks/config.js:27119:18) at process.processTicksAndRejections (node:internal/process/task_queues:103:5) at async file:///C:/Projects/Unity-Generator/frontend/node_modules/.pnpm/vite@7.3.1_@types+node@25.2.2/node_modules/vite/dist/node/chunks/config.js:27177:32 at async Promise.all (index 4) at async TransformPluginContext.transform (file:///C:/Projects/Unity-Generator/frontend/node_modules/.pnpm/vite@7.3.1_@types+node@25.2.2/node_modules/vite/dist/node/chunks/config.js:27145:4) at async EnvironmentPluginContainer.transform (file:///C:/Projects/Unity-Generator/frontend/node_modules/.pnpm/vite@7.3.1_@types+node@25.2.2/node_modules/vite/dist/node/chunks/config.js:28797:14) at async loadAndTransform (file:///C:/Projects/Unity-Generator/frontend/node_modules/.pnpm/vite@7.3.1_@types+node@25.2.2/node_modules/vite/dist/node/chunks/config.js:22670:26)
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.ts
    - text: .
```