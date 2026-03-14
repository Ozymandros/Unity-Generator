import { defineConfig } from "@playwright/test";

const port = process.env.PORT || process.env.VITE_PORT || "5173";
const backendPort = process.env.BACKEND_PORT || "8000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  expect: {
    timeout: 30000,
  },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1280, height: 720 },
    navigationTimeout: 30000,
    // Capture artifacts on CI failures to aid debugging
    trace: process.env.CI ? 'retain-on-failure' : 'off',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
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
  // Exclude smoke tests — they require a live backend on port 35421 and must be run manually
  testIgnore: ["**/src/**/*.test.ts", "**/src/**/*.spec.ts", "**/src/**/*.test.js", "**/src/**/*.spec.js", "**/smoke.spec.ts"],
});
