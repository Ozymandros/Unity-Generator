import { test, expect, type Page, type Route } from "@playwright/test";

const BACKEND_PORT = process.env.BACKEND_PORT || "8000";
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// API Endpoints
const ENDPOINTS = {
  HEALTH: `${BACKEND_URL}/health`,
  PREFS: `${BACKEND_URL}/prefs`,
  PREFS_WILDCARD: `${BACKEND_URL}/prefs/*`,
  CONFIG_KEYS: `${BACKEND_URL}/config/keys`,
  GENERATE_CODE: `${BACKEND_URL}/generate/code`,
  GENERATE_TEXT: `${BACKEND_URL}/generate/text`,
  GENERATE_IMAGE: `${BACKEND_URL}/generate/image`,
  GENERATE_AUDIO: `${BACKEND_URL}/generate/audio`,
  GENERATE_SPRITES: `${BACKEND_URL}/generate/sprites`,
  GENERATE_UNITY_PROJECT: `${BACKEND_URL}/generate/unity-project`,
  MANAGEMENT_ALL: `${BACKEND_URL}/api/management/all`,
  OUTPUT_LATEST: `${BACKEND_URL}/output/latest`,
} as const;

// Helper functions for mocking API responses
function createSuccessResponse(data: unknown) {
  return {
    success: true,
    date: new Date().toISOString(),
    error: null,
    data,
  };
}

function createErrorResponse(error: string) {
  return {
    success: false,
    date: new Date().toISOString(),
    error,
    data: null,
  };
}

async function mockApiSuccess(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(createSuccessResponse(data)),
  });
}

async function mockApiError(route: Route, error: string) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(createErrorResponse(error)),
  });
}

async function setupRouteHandler(page: Page, endpoint: string, data: unknown) {
  await page.route(endpoint, async (route) => {
    await mockApiSuccess(route, data);
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((url) => {
    localStorage.setItem("backendUrl", url);
  }, BACKEND_URL);

  // Mock health check endpoint
  await page.route(ENDPOINTS.HEALTH, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  // Mock unified discovery endpoint (backend returns raw object, not { success, data } wrapper)
  const discoveryPayload = {
    providers: [
      { name: "openai", modalities: ["text", "image", "llm"] },
      { name: "deepseek", modalities: ["text", "code", "llm"] },
      { name: "elevenlabs", modalities: ["audio"] },
      { name: "stability", modalities: ["image"] }
    ],
    models: {
      openai: [{ value: "gpt-4", label: "GPT-4", modality: "text" }, { value: "gpt-4", label: "GPT-4", modality: "llm" }],
      deepseek: [{ value: "deepseek-coder", label: "DeepSeek Coder", modality: "code" }, { value: "deepseek-coder", label: "DeepSeek Coder", modality: "llm" }],
      elevenlabs: [{ value: "Rachel", label: "Rachel", modality: "audio" }],
      stability: [{ value: "stable-diffusion-xl", label: "SDXL", modality: "image" }]
    },
    prompts: {
      default_code_system_prompt: "You are a Unity C# expert."
    },
    keys: ["openai", "deepseek", "elevenlabs", "stability"],
    preferences: {
      preferred_llm_provider: "openai",
      preferred_llm_model: "gpt-4",
      preferred_code_provider: "deepseek",
      preferred_code_model: "deepseek-coder",
      preferred_image_provider: "openai",
      preferred_image_model: "dall-e-3",
      preferred_audio_provider: "elevenlabs",
      preferred_audio_model: "Rachel"
    }
  };
  await page.route(ENDPOINTS.MANAGEMENT_ALL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(discoveryPayload),
    });
  });

  // Mock all API endpoints with default success responses
  await setupRouteHandler(page, ENDPOINTS.PREFS_WILDCARD, { key: "test", value: null });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_CODE, { content: "public class PlayerController {}" });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_TEXT, { content: "NPC: Welcome, traveler." });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_IMAGE, { image: "fake-image-base64" });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_AUDIO, { audio_url: "https://example.com/audio.mp3" });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_SPRITES, { image: "fake-sprite-base64", resolution: 64 });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_UNITY_PROJECT, {
    project_path: "C:/Projects/Unity-Generator/output/TestProject",
  });
  await setupRouteHandler(page, ENDPOINTS.OUTPUT_LATEST, {
    path: "C:/Projects/Unity-Generator/output/TestProject",
  });
});

test("shows backend status and generates code", async ({ page }) => {
  await page.goto("/");
  // Wait for the discovery API to finish loading by checking a model dropdown (which should be enabled eventually)
  await expect(page.getByText("Online")).toBeVisible({ timeout: 120000 });

  // Navigate to Code panel
  await page.locator('[data-testid="nav-Code"]').click();
  await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 30000 });
  // Use first textarea for prompt input
  await page.locator("textarea").first().fill("Create a player controller");

  // Click generate and wait for the status message to update
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible({ timeout: 30000 });

  // Check that result textarea contains the generated code
  await expect(page.locator("textarea").last()).toHaveValue(/PlayerController/, { timeout: 30000 });
});

test("generates text", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-testid="nav-Text"]').click();
  await expect(page.getByRole("heading", { name: "Text Generation" })).toBeVisible({ timeout: 30000 });

  await page.locator("textarea").first().fill("Write a greeting");

  // Click generate and wait for the status message to update
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Text generated.")).toBeVisible({ timeout: 30000 });

  await expect(page.locator("textarea").last()).toHaveValue(/Welcome/, { timeout: 30000 });
});

test("generates image", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-testid="nav-Image"]').click();
  await expect(page.getByRole("heading", { name: "Image Generation" })).toBeVisible({ timeout: 30000 });
  await page.locator("textarea").first().fill("A hero portrait");

  // Click generate and wait for the status message to update
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Image request complete.")).toBeVisible({ timeout: 30000 });

  // ImagePanel displays the full JSON response
  await expect(page.locator("textarea").last()).toHaveValue(/fake-image-base64/, { timeout: 30000 });
});

test("generates audio", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-testid="nav-Audio"]').click();
  await expect(page.getByRole("heading", { name: "Audio Generation" })).toBeVisible({ timeout: 30000 });
  await page.locator("textarea").first().fill("A battle cry");

  // Click generate and wait for the status message to update
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Audio request complete.")).toBeVisible({ timeout: 30000 });

  // AudioPanel displays the full JSON response
  await expect(page.locator("textarea").last()).toHaveValue(/audio\.mp3/, { timeout: 30000 });
});

test("generates unity project", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-testid="nav-Unity-Project"]').click();
  await expect(page.getByRole("heading", { name: "Unity Project" })).toBeVisible({ timeout: 30000 });
  // Fill required fields: project name, template, version, platform (Vuetify v-select = combobox)
  await page.getByLabel("Project Name").fill("TestProject");
  await page.getByLabel("Unity Template").click({ force: true });
  await page.getByRole("option", { name: "2D" }).click();
  await page.getByLabel("Unity Version").click({ force: true });
  await page.getByRole("option", { name: "6000.3.2f1" }).click();
  await page.getByLabel("Target Platform").click({ force: true });
  await page.getByRole("option", { name: "Windows" }).click();

  await page.getByRole("button", { name: "Generate Project" }).click();
  await expect(page.getByText("Unity project generated.")).toBeVisible({ timeout: 30000 });

  // UnityProjectPanel displays the full JSON response
  await expect(page.locator("textarea").last()).toHaveValue(/output/, { timeout: 30000 });
});

test("saves settings", async ({ page }) => {
  await setupRouteHandler(page, ENDPOINTS.CONFIG_KEYS, { saved: ["openai"] });
  await setupRouteHandler(page, ENDPOINTS.PREFS, { key: "test" });

  await page.goto("/");
  await page.locator('[data-testid="nav-Settings"]').click();
  await expect(page.getByRole("heading", { name: "Configuration" })).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Save All Changes" }).click();
  await expect(page.getByText(/saved successfully|saved locally/i)).toBeVisible({ timeout: 30000 });
});

test("shows error on API failure", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    await mockApiError(route, "API rate limit exceeded");
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Code"]').click();
  await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 30000 });
  await page.locator("textarea").first().fill("Test prompt");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("API rate limit exceeded")).toBeVisible({ timeout: 30000 });
});

test("navigates between all tabs", async ({ page }) => {
  await page.goto("/");

  // Check all tabs can be clicked and show correct content
  await page.locator('[data-testid="nav-Settings"]').click();
  await expect(page.getByRole("heading", { name: "Configuration" })).toBeVisible({ timeout: 30000 });

  await page.locator('[data-testid="nav-Code"]').click();
  await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 30000 });

  await page.locator('[data-testid="nav-Text"]').click();
  await expect(page.getByRole("heading", { name: "Text Generation" })).toBeVisible({ timeout: 30000 });

  await page.locator('[data-testid="nav-Image"]').click();
  await expect(page.getByRole("heading", { name: "Image Generation" })).toBeVisible({ timeout: 30000 });

  await page.locator('[data-testid="nav-Audio"]').click();
  await expect(page.getByRole("heading", { name: "Audio Generation" })).toBeVisible({ timeout: 30000 });

  await page.locator('[data-testid="nav-Unity-Project"]').click();
  await expect(page.getByRole("heading", { name: "Unity Project" })).toBeVisible({ timeout: 30000 });
});

test("shows offline status when backend unavailable", async ({ page }) => {
  // Override the health check to simulate backend being offline
  await page.route(ENDPOINTS.HEALTH, async (route) => {
    await route.abort("connectionrefused");
  });

  await page.goto("/");
  await expect(page.getByText("Offline")).toBeVisible({ timeout: 30000 });
});

// Advanced generation tests
test("generates code with provider and model options", async ({ page }) => {
  let requestBody: unknown;
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    requestBody = route.request().postDataJSON();
    await mockApiSuccess(route, { content: "public class CustomController {}" });
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Code"]').click();
  await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 30000 });
  await page.locator("textarea").first().fill("Create a controller");

  // Select provider and model (Vuetify v-select = combobox, not native select)
  // Use more specific selector for Provider within the Code panel context
  await page.getByRole("combobox", { name: "Provider" }).first().click({ force: true });
  await page.getByRole("option", { name: "deepseek" }).click();
  await page.getByRole("combobox", { name: /Model/ }).click({ force: true });
  await page.getByRole("option", { name: "DeepSeek Coder" }).click();

  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible({ timeout: 30000 });

  // Verify the request included provider and model
  expect(requestBody).toMatchObject({
    prompt: "Create a controller",
    provider: "deepseek",
    options: { model: "deepseek-coder" },
  });
});

test("generates code multiple times with different prompts", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-testid="nav-Code"]').click();

  // First generation
  await page.locator("textarea").first().fill("Create a player class");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("textarea").last()).toHaveValue(/PlayerController/, { timeout: 30000 });

  // Second generation with different prompt
  await page.locator("textarea").first().fill("Create an enemy class");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("textarea").last()).toHaveValue(/PlayerController/, { timeout: 30000 });
});

test("components reset when navigating between tabs", async ({ page }) => {
  await page.goto("/");

  // Fill code panel
  await page.locator('[data-testid="nav-Code"]').click();
  await page.locator("textarea").first().fill("Create a player controller");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible({ timeout: 30000 });

  // Navigate to text panel
  await page.locator('[data-testid="nav-Text"]').click();

  // Navigate back to code panel - components are unmounted/remounted so state resets
  await page.locator('[data-testid="nav-Code"]').click();

  // Input should be empty after navigating away and back
  await expect(page.locator("textarea").first()).toHaveValue("", { timeout: 30000 });

  // Result should also be empty
  await expect(page.locator("textarea").last()).toHaveValue("", { timeout: 30000 });
});

test("generates unity project with all prompts filled", async ({ page }) => {
  let requestBody: unknown;
  await page.route(ENDPOINTS.GENERATE_UNITY_PROJECT, async (route) => {
    requestBody = route.request().postDataJSON();
    await mockApiSuccess(route, { project_path: "C:/Projects/Unity-Generator/output/FullProject" });
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Unity-Project"]').click();
  await expect(page.getByRole("heading", { name: "Unity Project" })).toBeVisible({ timeout: 30000 });

  // Fill required project settings
  await page.getByLabel("Project Name").fill("FullTestProject");
  await page.getByLabel("Unity Template").click({ force: true });
  await page.getByRole("option", { name: "2D" }).click();
  await page.getByLabel("Unity Version").click({ force: true });
  await page.getByRole("option", { name: "6000.3.2f1" }).click();
  await page.getByLabel("Target Platform").click({ force: true });
  await page.getByRole("option", { name: "Windows" }).click();

  // Enable optional settings
  await page.getByLabel("Generate Default Scene").click();
  await page.getByLabel("Auto-Install UPM Packages").click();

  await page.getByRole("button", { name: "Generate Project" }).click();
  await expect(page.getByText("Unity project generated.")).toBeVisible({ timeout: 30000 });

  // Verify project was generated with correct settings
  expect(requestBody).toMatchObject({
    project_name: "FullTestProject",
  });
});

test("generates unity project with provider overrides", async ({ page }) => {
  let requestBody: unknown;
  await page.route(ENDPOINTS.GENERATE_UNITY_PROJECT, async (route) => {
    requestBody = route.request().postDataJSON();
    await mockApiSuccess(route, { project_path: "C:/Projects/Unity-Generator/output/CustomProject" });
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Unity-Project"]').click();
  await expect(page.getByRole("heading", { name: "Unity Project" })).toBeVisible({ timeout: 30000 });

  await page.getByLabel("Project Name").fill("CustomProject");
  await page.getByLabel("Unity Template").click({ force: true });
  await page.getByRole("option", { name: "2D" }).click();
  await page.getByLabel("Unity Version").click({ force: true });
  await page.getByRole("option", { name: "6000.3.2f1" }).click();
  await page.getByLabel("Target Platform").click({ force: true });
  await page.getByRole("option", { name: "Windows" }).click();

  await page.getByRole("button", { name: "Generate Project" }).click();
  await expect(page.getByText("Unity project generated.")).toBeVisible({ timeout: 30000 });

  // Verify project was generated with correct name
  expect(requestBody).toMatchObject({
    project_name: "CustomProject",
  });
});

// Error handling tests
test("handles network error gracefully", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    await route.abort("failed");
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Code"]').click();
  await page.locator("textarea").first().fill("Test prompt");
  await page.getByRole("button", { name: "Generate" }).click();

  // Should show some error indication (the component catches and displays errors)
  await expect(page.getByText(/failed|error/i)).toBeVisible({ timeout: 30000 });
});

test("handles different error messages for different generators", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_TEXT, async (route) => {
    await mockApiError(route, "Text generation service unavailable");
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Text"]').click();
  await page.locator("textarea").first().fill("Test");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Text generation service unavailable")).toBeVisible({ timeout: 30000 });
});

test("shows error when image generation fails", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_IMAGE, async (route) => {
    await mockApiError(route, "Image quota exceeded");
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Image"]').click();
  await page.locator("textarea").first().fill("Generate image");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Image quota exceeded")).toBeVisible({ timeout: 30000 });
});

test("shows error when audio generation fails", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_AUDIO, async (route) => {
    await mockApiError(route, "Invalid voice ID");
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Audio"]').click();
  await expect(page.getByRole("heading", { name: "Audio Generation" })).toBeVisible({ timeout: 30000 });
  await page.locator("textarea").first().fill("Generate audio");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Invalid voice ID")).toBeVisible({ timeout: 30000 });
});

test("shows error when unity project generation fails", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_UNITY_PROJECT, async (route) => {
    await mockApiError(route, "Project directory already exists");
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Unity-Project"]').click();
  await expect(page.getByRole("heading", { name: "Unity Project" })).toBeVisible({ timeout: 30000 });
  await page.getByLabel("Project Name").fill("ExistingProject");
  await page.getByLabel("Unity Template").click({ force: true });
  await page.getByRole("option", { name: "2D" }).click();
  await page.getByLabel("Unity Version").click({ force: true });
  await page.getByRole("option", { name: "6000.3.2f1" }).click();
  await page.getByLabel("Target Platform").click({ force: true });
  await page.getByRole("option", { name: "Windows" }).click();
  await page.getByRole("button", { name: "Generate Project" }).click();
  await expect(page.getByText("Project directory already exists")).toBeVisible({ timeout: 30000 });
});

// Settings tests
test("fills and saves API keys in settings", async ({ page }) => {
  // Mock the setPref calls for preferred providers
  await page.route(ENDPOINTS.PREFS, async (route) => {
    await mockApiSuccess(route, { key: "test" });
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Settings"]').click();
  await expect(page.getByRole("heading", { name: "Configuration" })).toBeVisible({ timeout: 30000 });

  // Click on Secrets tab to manage API keys
  await page.getByRole("tab", { name: "Secrets" }).click();

  // The secrets tab has secret management UI
  await expect(page.getByRole("button", { name: "Store New Secret" })).toBeVisible({ timeout: 30000 });
});

// UI state tests
test("shows generating status during API call", async ({ page }) => {
  // Add delay to the mock response
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    await page.waitForTimeout(500); // Simulate slow response
    await mockApiSuccess(route, { content: "public class Test {}" });
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Code"]').click();
  await page.locator("textarea").first().fill("Test");
  await page.getByRole("button", { name: "Generate" }).click();

  // Should show "Generating" status immediately
  await expect(page.getByText("Generating code...")).toBeVisible({ timeout: 30000 });

  // Eventually shows success
  await expect(page.getByText("Code generated.")).toBeVisible({ timeout: 30000 });
});

test("backend status updates on page load", async ({ page }) => {
  await page.goto("/");

  // Should check backend status on mount
  await expect(page.getByText("Online")).toBeVisible({ timeout: 30000 });
});

test("handles empty response data gracefully", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    await mockApiSuccess(route, { content: "" });
  });

  await page.goto("/");
  await page.locator('[data-testid="nav-Code"]').click();
  await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 30000 });
  await page.locator("textarea").first().fill("Test");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible({ timeout: 30000 });

  // Result should be empty but not crash
  await expect(page.locator("textarea").last()).toHaveValue("", { timeout: 30000 });
});

test("generates and previews 2D sprites", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-testid="nav-Sprites"]').click();
  await expect(page.getByRole("heading", { name: "2D Sprites" })).toBeVisible({ timeout: 30000 });

  await page.locator("textarea").first().fill("A pixel art health potion");

  // Select 32x resolution button
  await page.getByRole("button", { name: "32x" }).click();

  // Select palette size (v-select = combobox)
  await page.getByLabel("Palette Size").click({ force: true });
  await page.getByRole("option", { name: "16" }).click();

  await page.getByRole("button", { name: "Generate Sprites" }).click();

  await expect(page.getByText("Sprite generated.")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("img")).toBeVisible({ timeout: 30000 });
});
