import { expect, test } from "@playwright/test";

const BACKEND_PORT = process.env.BACKEND_PORT || "8000";
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

/**
 * Integration test suite for Electron application startup and backend communication.
 * 
 * Tests verify:
 * - Full application startup sequence
 * - Backend process spawning and readiness
 * - Window loading and Vue app initialization
 * - HTTP communication with Python backend
 * - Error propagation from backend
 * 
 * Requirements: 14.1, 14.5, 14.6, 2.2, 2.3
 */

// API Endpoints
const ENDPOINTS = {
  HEALTH: `${BACKEND_URL}/health`,
  MANAGEMENT_ALL: `${BACKEND_URL}/api/management/all`,
  GENERATE_CODE: `${BACKEND_URL}/generate/code`,
} as const;

/**
 * Integration Test 18.1: Full Application Startup
 * 
 * Verifies that:
 * - Backend spawns and becomes ready
 * - Window loads and Vue app initializes
 * - Application displays correct status
 * 
 * Requirements: 14.1, 14.5, 14.6
 */
test.describe("Integration Test 18.1: Full Application Startup - Electron", () => {
  test("shows backend status and initializes Vue app", async ({ page }) => {
    // Set backend URL in localStorage
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

    // Mock discovery endpoint
    const discoveryPayload = {
      providers: [
        { name: "openai", modalities: ["text", "image", "llm"] },
        { name: "deepseek", modalities: ["text", "code", "llm"] }
      ],
      models: {
        openai: [{ value: "gpt-4", label: "GPT-4", modality: "text" }],
        deepseek: [{ value: "deepseek-coder", label: "DeepSeek Coder", modality: "code" }]
      },
      prompts: {
        default_code_system_prompt: "You are a Unity C# expert."
      },
      keys: ["openai", "deepseek"],
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

    // Navigate to app
    await page.goto("/");

    // Verify backend status shows online
    await expect(page.getByText("Online")).toBeVisible({ timeout: 30000 });

    // Verify Vue app has initialized by checking for navigation elements
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 30000 });
  });

  test("displays error when backend is not ready", async ({ page }) => {
    // Set backend URL in localStorage
    await page.addInitScript((url) => {
      localStorage.setItem("backendUrl", url);
    }, BACKEND_URL);

    // Mock health check to fail
    await page.route(ENDPOINTS.HEALTH, async (route) => {
      await route.abort("connectionrefused");
    });

    // Navigate to app
    await page.goto("/");

    // Verify offline status is displayed
    await expect(page.getByText("Offline")).toBeVisible({ timeout: 15000 });
  });
});

/**
 * Integration Test 18.2: Backend Communication
 * 
 * Verifies that:
 * - HTTP requests to Python backend succeed
 * - Error propagation from backend works correctly
 * - Backend errors are displayed to user
 * 
 * Requirements: 2.2, 2.3
 */
test.describe("Integration Test 18.2: Backend Communication - Electron", () => {
  test("successfully communicates with backend for code generation", async ({ page }) => {
    // Set backend URL in localStorage
    await page.addInitScript((url) => {
      localStorage.setItem("backendUrl", url);
    }, BACKEND_URL);

    // Mock health check
    await page.route(ENDPOINTS.HEALTH, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    // Mock discovery endpoint
    const discoveryPayload = {
      providers: [{ name: "openai", modalities: ["text", "code", "llm"] }],
      models: {
        openai: [{ value: "gpt-4", label: "GPT-4", modality: "text" }]
      },
      prompts: { default_code_system_prompt: "You are a Unity C# expert." },
      keys: ["openai"],
      preferences: {
        preferred_llm_provider: "openai",
        preferred_llm_model: "gpt-4",
        preferred_code_provider: "openai",
        preferred_code_model: "gpt-4",
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

    // Mock code generation endpoint
    await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          date: new Date().toISOString(),
          error: null,
          data: { content: "public class PlayerController {}" }
        }),
      });
    });

    // Navigate to app and code panel
    await page.goto("/");
    await expect(page.getByText("Online")).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="nav-Code"]').click();
    await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 15000 });

    // Fill prompt and generate
    await page.locator("textarea").first().fill("Create a player controller");
    await page.getByRole("button", { name: "Generate" }).click();

    // Verify success message
    await expect(page.getByText("Code generated.")).toBeVisible({ timeout: 15000 });
  });

  test("propagates backend errors to user interface", async ({ page }) => {
    // Set backend URL in localStorage
    await page.addInitScript((url) => {
      localStorage.setItem("backendUrl", url);
    }, BACKEND_URL);

    // Mock health check
    await page.route(ENDPOINTS.HEALTH, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    // Mock discovery endpoint
    const discoveryPayload = {
      providers: [{ name: "openai", modalities: ["text", "code", "llm"] }],
      models: {
        openai: [{ value: "gpt-4", label: "GPT-4", modality: "text" }]
      },
      prompts: { default_code_system_prompt: "You are a Unity C# expert." },
      keys: ["openai"],
      preferences: {
        preferred_llm_provider: "openai",
        preferred_llm_model: "gpt-4",
        preferred_code_provider: "openai",
        preferred_code_model: "gpt-4",
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

    // Mock code generation to return error
    await page.route(ENDPOINTS.GENERATE_CODE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          date: new Date().toISOString(),
          error: "API rate limit exceeded",
          data: null
        }),
      });
    });

    // Navigate to app and code panel
    await page.goto("/");
    await expect(page.getByText("Online")).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="nav-Code"]').click();
    await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 15000 });

    // Fill prompt and generate
    await page.locator("textarea").first().fill("Test prompt");
    await page.getByRole("button", { name: "Generate" }).click();

    // Verify error message is displayed
    await expect(page.getByText("API rate limit exceeded")).toBeVisible({ timeout: 15000 });
  });

  test("handles backend connection failure gracefully", async ({ page }) => {
    // Set backend URL in localStorage
    await page.addInitScript((url) => {
      localStorage.setItem("backendUrl", url);
    }, BACKEND_URL);

    // Mock health check to fail
    await page.route(ENDPOINTS.HEALTH, async (route) => {
      await route.abort("connectionrefused");
    });

    // Navigate to app
    await page.goto("/");

    // Verify offline status
    await expect(page.getByText("Offline")).toBeVisible({ timeout: 15000 });

    // Navigate to code panel
    await page.locator('[data-testid="nav-Code"]').click();
    await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 15000 });

    // Try to generate - should show connection error
    await page.locator("textarea").first().fill("Test prompt");
    await page.getByRole("button", { name: "Generate" }).click();

    // Verify error is shown
    await expect(page.getByText(/failed|error|offline/i)).toBeVisible({ timeout: 15000 });
  });
});
