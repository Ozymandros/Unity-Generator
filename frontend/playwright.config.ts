import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "pnpm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
  // Exclude frontend unit tests from Playwright
  exclude: ["../src/**/*.test.ts", "../src/**/*.spec.ts", "../src/**/*.test.js", "../src/**/*.spec.js"],
});
