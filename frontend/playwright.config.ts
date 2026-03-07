import { defineConfig } from "@playwright/test";

const port = process.env.PORT || process.env.VITE_PORT || "5173";
const backendPort = process.env.BACKEND_PORT || "8000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  expect: {
    timeout: 30000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1280, height: 720 },
    navigationTimeout: 30000,
  },
  ...(process.env.CI ? {} : {
    webServer: [
      {
        command: `cd ../backend && python -m uvicorn app.main:app --reload --port ${backendPort}`,
        url: `http://127.0.0.1:${backendPort}/health`,
        reuseExistingServer: true,
        timeout: 180000,
        stdout: "pipe",
        stderr: "pipe",
      },
      {
        command: `npx vite --host 127.0.0.1 --port ${port}`,
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: true,
        timeout: 180000,
        stdout: "pipe",
        stderr: "pipe",
      },
    ],
  }),
  // Exclude frontend unit tests from Playwright (testDir is ./tests/e2e, ignore src unit specs)
  testIgnore: ["**/src/**/*.test.ts", "**/src/**/*.spec.ts", "**/src/**/*.test.js", "**/src/**/*.spec.js"],
});
