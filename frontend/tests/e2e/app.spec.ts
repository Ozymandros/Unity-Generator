import { test, expect, type Page, type Route } from "@playwright/test";

const BACKEND_URL = "http://127.0.0.1:8000";

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
  GENERATE_UNITY_PROJECT: `${BACKEND_URL}/generate/unity-project`,
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

  // Mock all API endpoints with default success responses
  await setupRouteHandler(page, ENDPOINTS.PREFS_WILDCARD, { key: "test", value: null });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_CODE, { content: "public class PlayerController {}" });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_TEXT, { content: "NPC: Welcome, traveler." });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_IMAGE, { image: "fake-image-base64" });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_AUDIO, { audio_url: "https://example.com/audio.mp3" });
  await setupRouteHandler(page, ENDPOINTS.GENERATE_UNITY_PROJECT, {
    project_path: "C:/Projects/Unity-Generator/output/TestProject",
  });
  await setupRouteHandler(page, ENDPOINTS.OUTPUT_LATEST, {
    path: "C:/Projects/Unity-Generator/output/TestProject",
  });
});

test("shows backend status and generates code", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Backend: online")).toBeVisible();

  await page.getByRole("button", { name: "Code" }).click();
  // Use first textarea for prompt input
  await page.locator("textarea").first().fill("Create a player controller");
  
  // Click generate and wait for the status message to update
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible();
  
  // Check that result textarea contains the generated code
  await expect(page.locator("textarea").last()).toHaveValue(/PlayerController/);
});

test("generates text", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Text" }).click();
  await page.locator("textarea").first().fill("Write a greeting");
  
  // Click generate and wait for the status message to update
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Text generated.")).toBeVisible();
  
  await expect(page.locator("textarea").last()).toHaveValue(/Welcome/);
});

test("generates image", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Image" }).click();
  await page.locator("textarea").first().fill("A hero portrait");
  
  // Click generate and wait for the status message to update
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Image request complete.")).toBeVisible();
  
  // ImagePanel displays the full JSON response
  await expect(page.locator("textarea").last()).toHaveValue(/fake-image-base64/);
});

test("generates audio", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Audio" }).click();
  await page.locator("textarea").first().fill("A battle cry");
  
  // Click generate and wait for the status message to update
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Audio request complete.")).toBeVisible();
  
  // AudioPanel displays the full JSON response
  await expect(page.locator("textarea").last()).toHaveValue(/audio\.mp3/);
});

test("generates unity project", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Unity Project" }).click();
  // Fill project name input and first textarea (code prompt)
  await page.locator("input").first().fill("TestProject");
  await page.locator("textarea").first().fill("Create player");
  
  // Click generate and wait for the status message to update
  await page.getByRole("button", { name: "Generate Project" }).click();
  await expect(page.getByText("Unity project generated.")).toBeVisible();
  
  // UnityProjectPanel displays the full JSON response
  await expect(page.locator("textarea").last()).toHaveValue(/output/);
});

test("saves settings", async ({ page }) => {
  await setupRouteHandler(page, ENDPOINTS.CONFIG_KEYS, { saved: ["openai"] });
  await setupRouteHandler(page, ENDPOINTS.PREFS, { key: "test" });

  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved locally")).toBeVisible();
});

test("shows error on API failure", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    await mockApiError(route, "API rate limit exceeded");
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Code" }).click();
  await page.locator("textarea").first().fill("Test prompt");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("API rate limit exceeded")).toBeVisible();
});

test("navigates between all tabs", async ({ page }) => {
  await page.goto("/");

  // Check all tabs can be clicked and show correct content
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "Code" }).click();
  await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible();

  await page.getByRole("button", { name: "Text" }).click();
  await expect(page.getByRole("heading", { name: "Text Generation" })).toBeVisible();

  await page.getByRole("button", { name: "Image" }).click();
  await expect(page.getByRole("heading", { name: "Image Generation" })).toBeVisible();

  await page.getByRole("button", { name: "Audio" }).click();
  await expect(page.getByRole("heading", { name: "Audio Generation" })).toBeVisible();

  await page.getByRole("button", { name: "Unity Project" }).click();
  await expect(page.getByRole("heading", { name: "Unity Project Output" })).toBeVisible();
});

test("shows offline status when backend unavailable", async ({ page }) => {
  // Override the health check to simulate backend being offline
  await page.route(ENDPOINTS.HEALTH, async (route) => {
    await route.abort("connectionrefused");
  });

  await page.goto("/");
  await expect(page.getByText("Backend: offline")).toBeVisible();
});

// Advanced generation tests
test("generates code with provider and model options", async ({ page }) => {
  let requestBody: unknown;
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    requestBody = route.request().postDataJSON();
    await mockApiSuccess(route, { content: "public class CustomController {}" });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Code" }).click();
  await page.locator("textarea").first().fill("Create a controller");
  await page.getByPlaceholder("openai | deepseek | openrouter | groq").fill("deepseek");
  await page.getByPlaceholder("gpt-4o-mini").fill("deepseek-coder");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible();

  // Verify the request included provider and model
  expect(requestBody).toMatchObject({
    prompt: "Create a controller",
    provider: "deepseek",
    options: { model: "deepseek-coder" },
  });
});

test("generates code multiple times with different prompts", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Code" }).click();

  // First generation
  await page.locator("textarea").first().fill("Create a player class");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible();
  await expect(page.locator("textarea").last()).toHaveValue(/PlayerController/);

  // Second generation with different prompt
  await page.locator("textarea").first().fill("Create an enemy class");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible();
  await expect(page.locator("textarea").last()).toHaveValue(/PlayerController/);
});

test("components reset when navigating between tabs", async ({ page }) => {
  await page.goto("/");
  
  // Fill code panel
  await page.getByRole("button", { name: "Code" }).click();
  await page.locator("textarea").first().fill("Create a player controller");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible();
  
  // Navigate to text panel
  await page.getByRole("button", { name: "Text" }).click();
  
  // Navigate back to code panel - components are unmounted/remounted so state resets
  await page.getByRole("button", { name: "Code" }).click();
  
  // Input should be empty after navigating away and back
  await expect(page.locator("textarea").first()).toHaveValue("");
  
  // Result should also be empty
  await expect(page.locator("textarea").last()).toHaveValue("");
});

test("generates unity project with all prompts filled", async ({ page }) => {
  let requestBody: unknown;
  await page.route(ENDPOINTS.GENERATE_UNITY_PROJECT, async (route) => {
    requestBody = route.request().postDataJSON();
    await mockApiSuccess(route, { project_path: "C:/Projects/Unity-Generator/output/FullProject" });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Unity Project" }).click();
  
  // Fill all inputs
  await page.locator("input").first().fill("FullTestProject");
  const textareas = await page.locator("textarea").all();
  await textareas[0].fill("Create player and enemy scripts");
  await textareas[1].fill("Generate NPC dialogue");
  await textareas[2].fill("Generate character sprites");
  await textareas[3].fill("Generate background music");
  
  await page.getByRole("button", { name: "Generate Project" }).click();
  await expect(page.getByText("Unity project generated.")).toBeVisible();

  // Verify all prompts were sent
  expect(requestBody).toMatchObject({
    project_name: "FullTestProject",
    code_prompt: "Create player and enemy scripts",
    text_prompt: "Generate NPC dialogue",
    image_prompt: "Generate character sprites",
    audio_prompt: "Generate background music",
  });
});

test("generates unity project with provider overrides", async ({ page }) => {
  let requestBody: unknown;
  await page.route(ENDPOINTS.GENERATE_UNITY_PROJECT, async (route) => {
    requestBody = route.request().postDataJSON();
    await mockApiSuccess(route, { project_path: "C:/Projects/Unity-Generator/output/CustomProject" });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Unity Project" }).click();
  
  await page.locator("input").first().fill("CustomProject");
  await page.locator("textarea").first().fill("Generate code");
  
  // Fill provider overrides (need to find them by their placeholders)
  const codeProviderInput = page.getByPlaceholder("openai | deepseek | openrouter | groq").first();
  await codeProviderInput.fill("deepseek");
  
  await page.getByRole("button", { name: "Generate Project" }).click();
  await expect(page.getByText("Unity project generated.")).toBeVisible();

  // Verify provider override was sent
  expect(requestBody).toMatchObject({
    project_name: "CustomProject",
    code_prompt: "Generate code",
    provider_overrides: expect.objectContaining({
      code: "deepseek",
    }),
  });
});

// Error handling tests
test("handles network error gracefully", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    await route.abort("failed");
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Code" }).click();
  await page.locator("textarea").first().fill("Test prompt");
  await page.getByRole("button", { name: "Generate" }).click();
  
  // Should show some error indication (the component catches and displays errors)
  await expect(page.getByText(/failed|error/i)).toBeVisible({ timeout: 10000 });
});

test("handles different error messages for different generators", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_TEXT, async (route) => {
    await mockApiError(route, "Text generation service unavailable");
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Text" }).click();
  await page.locator("textarea").first().fill("Test");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Text generation service unavailable")).toBeVisible();
});

test("shows error when image generation fails", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_IMAGE, async (route) => {
    await mockApiError(route, "Image quota exceeded");
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Image" }).click();
  await page.locator("textarea").first().fill("Generate image");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Image quota exceeded")).toBeVisible();
});

test("shows error when audio generation fails", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_AUDIO, async (route) => {
    await mockApiError(route, "Invalid voice ID");
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Audio" }).click();
  await page.locator("textarea").first().fill("Generate audio");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Invalid voice ID")).toBeVisible();
});

test("shows error when unity project generation fails", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_UNITY_PROJECT, async (route) => {
    await mockApiError(route, "Project directory already exists");
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Unity Project" }).click();
  await page.locator("input").first().fill("ExistingProject");
  await page.locator("textarea").first().fill("Create project");
  await page.getByRole("button", { name: "Generate Project" }).click();
  await expect(page.getByText("Project directory already exists")).toBeVisible();
});

// Settings tests
test("fills and saves API keys in settings", async ({ page }) => {
  let savedKeys: unknown;
  await page.route(ENDPOINTS.CONFIG_KEYS, async (route) => {
    savedKeys = route.request().postDataJSON();
    await mockApiSuccess(route, { saved: ["openai", "stability"] });
  });
  
  // Mock the setPref calls for preferred providers
  await page.route(ENDPOINTS.PREFS, async (route) => {
    await mockApiSuccess(route, { key: "test" });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  
  // Fill API keys by selecting password inputs
  const passwordInputs = await page.locator("input[type='password']").all();
  if (passwordInputs.length >= 2) {
    await passwordInputs[0].fill("sk-test-openai-key"); // OpenAI key
    await passwordInputs[4].fill("sk-test-stability-key"); // Stability key
  }
  
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved locally.")).toBeVisible();

  // Verify keys were sent (wrapped in a keys object)
  expect(savedKeys).toMatchObject({
    keys: {
      openai_api_key: "sk-test-openai-key",
      stability_api_key: "sk-test-stability-key",
    },
  });
});

// UI state tests
test("shows generating status during API call", async ({ page }) => {
  // Add delay to the mock response
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    await page.waitForTimeout(500); // Simulate slow response
    await mockApiSuccess(route, { content: "public class Test {}" });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Code" }).click();
  await page.locator("textarea").first().fill("Test");
  await page.getByRole("button", { name: "Generate" }).click();
  
  // Should show "Generating" status immediately
  await expect(page.getByText("Generating code...")).toBeVisible();
  
  // Eventually shows success
  await expect(page.getByText("Code generated.")).toBeVisible();
});

test("backend status updates on page load", async ({ page }) => {
  await page.goto("/");
  
  // Should check backend status on mount
  await expect(page.getByText("Backend: online")).toBeVisible();
});

test("handles empty response data gracefully", async ({ page }) => {
  await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
    await mockApiSuccess(route, { content: "" });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Code" }).click();
  await page.locator("textarea").first().fill("Test");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Code generated.")).toBeVisible();
  
  // Result should be empty but not crash
  await expect(page.locator("textarea").last()).toHaveValue("");
});
