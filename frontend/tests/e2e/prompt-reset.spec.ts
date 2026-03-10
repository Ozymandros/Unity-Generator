import { test, expect, type Route } from "@playwright/test";

const BACKEND_PORT = process.env.BACKEND_PORT || "8000";
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

const ENDPOINTS = {
  HEALTH: `${BACKEND_URL}/health`,
  MANAGEMENT_ALL: `${BACKEND_URL}/api/management/all`,
  PROMPTS_RESET: `${BACKEND_URL}/api/management/system-prompts/reset`,
} as const;

function createSuccessResponse(data: unknown) {
  return {
    success: true,
    date: new Date().toISOString(),
    error: null,
    data,
  };
}

test.beforeEach(async ({ page }) => {
  // Make the app use the test backend URL
  await page.addInitScript((url) => {
    localStorage.setItem("backendUrl", url);
  }, BACKEND_URL);

  // Health
  await page.route(ENDPOINTS.HEALTH, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "ok" }) });
  });

  // Initial discovery payload uses custom prompts so we can detect reset
  const discoveryPayload = {
    providers: [],
    models: {},
    prompts: {
      code: "CUSTOM CODE PROMPT",
      text: "CUSTOM TEXT PROMPT",
      image: "CUSTOM IMAGE PROMPT",
      audio: "CUSTOM AUDIO PROMPT",
      music: "CUSTOM MUSIC PROMPT",
      sprite: "CUSTOM SPRITE PROMPT",
    },
    keys: [],
    preferences: {},
  };

  await page.route(ENDPOINTS.MANAGEMENT_ALL, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(discoveryPayload) });
  });
});

test("resets prompts to backend defaults when clicking Reset to defaults", async ({ page }) => {
  // Prepare the reset endpoint to return the canonical defaults
  const defaults = {
    code: "You are an expert Unity C# developer. Generate clean, efficient, and well-commented code.",
    text: "You are a helpful assistant providing concise and accurate information.",
    image: "You are a creative prompt engineer for image generation AI.",
    audio: "You are an expert at generating high-quality speech and sound effects.",
    music: "You are a talented AI composer creating atmospheric game music.",
    sprite: "You are a skilled pixel artist creating 2D game assets.",
  };

  await page.route(ENDPOINTS.PROMPTS_RESET, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createSuccessResponse(defaults)),
    });
  });

  await page.goto("/");

  // Open Settings and select Prompts tab
  await page.locator('[data-testid="nav-Settings"]').click();
  await expect(page.getByRole("heading", { name: "Configuration" })).toBeVisible({ timeout: 30000 });
  await page.getByRole("tab", { name: "Prompts" }).click();

  // Verify initial custom prompt is visible (one of them)
  await expect(page.getByText("System Prompts")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("textarea").filter({ hasText: "CUSTOM CODE PROMPT" }).first()).toBeVisible({ timeout: 30000 });

  // Click Reset button and confirm dialog
  await page.getByRole("button", { name: "Reset to defaults" }).click();
  // Confirmation shown
  await expect(page.getByText("Reset all prompts?")).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();

  // After reset, at least one textarea should contain the default code prompt
  await expect(page.locator("textarea").first()).toHaveValue(defaults.code, { timeout: 30000 });
});
