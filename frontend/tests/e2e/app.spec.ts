import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("backendUrl", "http://127.0.0.1:8000");
  });

  await page.route("http://127.0.0.1:8000/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await page.route("http://127.0.0.1:8000/prefs/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { key: "test", value: null },
      }),
    });
  });

  await page.route("http://127.0.0.1:8000/generate/code", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { content: "public class PlayerController {}" },
      }),
    });
  });

  await page.route("http://127.0.0.1:8000/generate/text", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { content: "NPC: Welcome, traveler." },
      }),
    });
  });

  await page.route("http://127.0.0.1:8000/generate/image", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { image: "fake-image-base64" },
      }),
    });
  });

  await page.route("http://127.0.0.1:8000/generate/audio", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { audio_url: "https://example.com/audio.mp3" },
      }),
    });
  });

  await page.route("http://127.0.0.1:8000/generate/unity-project", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { project_path: "C:/Projects/Unity-Generator/output/TestProject" },
      }),
    });
  });

  await page.route("http://127.0.0.1:8000/output/latest", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { path: "C:/Projects/Unity-Generator/output/TestProject" },
      }),
    });
  });
});

test("shows backend status and generates code", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Backend: online")).toBeVisible();

  await page.getByRole("button", { name: "Code" }).click();
  // Use first textarea for prompt input
  await page.locator("textarea").first().fill("Create a player controller");
  await page.getByRole("button", { name: "Generate" }).click();
  // Check that result textarea contains the generated code
  await expect(page.locator("textarea").last()).toContainText("PlayerController");
});

test("generates text", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Text" }).click();
  await page.locator("textarea").first().fill("Write a greeting");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.locator("textarea").last()).toContainText("Welcome");
});

test("generates image", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Image" }).click();
  await page.locator("textarea").first().fill("A hero portrait");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.locator("textarea").last()).toContainText("fake-image-base64");
});

test("generates audio", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Audio" }).click();
  await page.locator("textarea").first().fill("A battle cry");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.locator("textarea").last()).toContainText("audio.mp3");
});

test("generates unity project", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Unity Project" }).click();
  // Fill project name input and first textarea (code prompt)
  await page.locator("input").first().fill("TestProject");
  await page.locator("textarea").first().fill("Create player");
  await page.getByRole("button", { name: "Generate Project" }).click();
  await expect(page.locator("textarea").last()).toContainText("output");
});

test("saves settings", async ({ page }) => {
  await page.route("http://127.0.0.1:8000/config/keys", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { saved: ["openai"] },
      }),
    });
  });

  await page.route("http://127.0.0.1:8000/prefs", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { key: "test" },
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved locally")).toBeVisible();
});

test("shows error on API failure", async ({ page }) => {
  await page.route("http://127.0.0.1:8000/generate/code", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        date: new Date().toISOString(),
        error: "API rate limit exceeded",
        data: null,
      }),
    });
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
  await page.route("http://127.0.0.1:8000/health", async (route) => {
    await route.abort("connectionrefused");
  });

  await page.goto("/");
  await expect(page.getByText("Backend: offline")).toBeVisible();
});
