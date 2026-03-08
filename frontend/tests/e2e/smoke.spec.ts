/**
 * Smoke Tests: Critical Path Verification
 * 
 * These tests verify the most critical functionality:
 * - Application window opens
 * - Frontend loads successfully
 * - Backend is reachable
 * - Backend can access its dependencies
 * 
 * Run these first to ensure basic functionality before running full test suite.
 */

import { expect, test } from "@playwright/test";

const BACKEND_PORT = process.env.BACKEND_PORT || "8000";
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

const ENDPOINTS = {
  HEALTH: `${BACKEND_URL}/health`,
  MANAGEMENT_ALL: `${BACKEND_URL}/api/management/all`,
} as const;

test.describe("Smoke Tests: Critical Path", () => {
  /**
   * Smoke Test 1: Window Opens
   * 
   * Verifies that the Electron window opens and the frontend loads.
   * This is the most basic test - if this fails, nothing else will work.
   */
  test("window opens and frontend loads", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Verify the page loaded by checking for the app container
    await expect(page.locator("#app")).toBeVisible({ timeout: 10000 });

    // Verify Vue app initialized by checking for navigation
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 10000 });

    // Verify at least one navigation item is present
    await expect(page.locator('[data-testid^="nav-"]').first()).toBeVisible({ timeout: 10000 });
  });

  /**
   * Smoke Test 2: Backend Health Check
   * 
   * Verifies that the frontend can reach the backend health endpoint.
   * This confirms the backend process is running and accepting HTTP requests.
   */
  test("frontend can reach backend health endpoint", async ({ page }) => {
    // Set backend URL in localStorage
    await page.addInitScript((url) => {
      localStorage.setItem("backendUrl", url);
    }, BACKEND_URL);

    // Don't mock - let the real backend respond
    // This is a smoke test, we want to verify real connectivity

    // Navigate to app
    await page.goto("/");

    // Wait for backend status to update
    // The app checks /health on mount
    await page.waitForTimeout(2000);

    // Verify backend status shows "Online" or check for the status indicator
    // The app should show "Online" if backend is reachable
    const statusText = await page.locator("text=/Online|Offline/").first().textContent({ timeout: 10000 });
    
    // If we see "Online", backend is reachable
    expect(statusText).toContain("Online");
  });

  /**
   * Smoke Test 3: Backend Discovery Endpoint
   * 
   * Verifies that the backend can respond to the discovery endpoint.
   * This confirms the backend can access its configuration and dependencies.
   */
  test("backend discovery endpoint responds", async ({ page }) => {
    // Set backend URL in localStorage
    await page.addInitScript((url) => {
      localStorage.setItem("backendUrl", url);
    }, BACKEND_URL);

    // Navigate to app
    await page.goto("/");

    // Wait for the app to call the discovery endpoint
    // The app calls /api/management/all on mount
    await page.waitForTimeout(3000);

    // Check if provider dropdowns are populated (indicates discovery succeeded)
    // Navigate to Code panel to check
    await page.locator('[data-testid="nav-Code"]').click();
    await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 10000 });

    // If discovery succeeded, the provider dropdown should have options
    // Click the provider dropdown
    await page.getByRole("combobox", { name: "Provider" }).first().click({ force: true });

    // Check if at least one provider option is available
    const options = await page.getByRole("option").count();
    expect(options).toBeGreaterThan(0);
  });

  /**
   * Smoke Test 4: End-to-End Request Flow
   * 
   * Verifies the complete request flow from frontend to backend.
   * This is a minimal integration test to ensure the full stack works.
   */
  test("complete request flow works (FE -> BE)", async ({ page }) => {
    // Set backend URL in localStorage
    await page.addInitScript((url) => {
      localStorage.setItem("backendUrl", url);
    }, BACKEND_URL);

    // Navigate to app
    await page.goto("/");

    // Wait for backend to be online
    await expect(page.getByText("Online")).toBeVisible({ timeout: 15000 });

    // Navigate to Code panel
    await page.locator('[data-testid="nav-Code"]').click();
    await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 10000 });

    // Fill a simple prompt
    await page.locator("textarea").first().fill("Create a simple test class");

    // Click generate
    await page.getByRole("button", { name: "Generate" }).click();

    // Wait for either success or error message
    // We don't care about the actual result, just that the request completed
    await expect(
      page.locator("text=/Code generated|Error|failed|API/i").first()
    ).toBeVisible({ timeout: 30000 });

    // If we got here, the request flow works (even if it failed due to missing API keys)
  });

  /**
   * Smoke Test 5: Window Dimensions and Visibility
   * 
   * Verifies that the window has correct dimensions and is visible.
   */
  test("window has correct dimensions", async ({ page }) => {
    await page.goto("/");

    // Check viewport size (should match our config)
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(1280);
    expect(viewport?.height).toBeGreaterThanOrEqual(720);

    // Verify the app is not hidden or minimized
    await expect(page.locator("#app")).toBeVisible({ timeout: 10000 });
  });

  /**
   * Smoke Test 6: Navigation Works
   * 
   * Verifies that basic navigation between panels works.
   */
  test("navigation between panels works", async ({ page }) => {
    await page.goto("/");

    // Navigate to Settings
    await page.locator('[data-testid="nav-Settings"]').click();
    await expect(page.getByRole("heading", { name: "Configuration" })).toBeVisible({ timeout: 10000 });

    // Navigate to Code
    await page.locator('[data-testid="nav-Code"]').click();
    await expect(page.getByRole("heading", { name: "Unity C# Code" })).toBeVisible({ timeout: 10000 });

    // Navigate to Text
    await page.locator('[data-testid="nav-Text"]').click();
    await expect(page.getByRole("heading", { name: "Text Generation" })).toBeVisible({ timeout: 10000 });

    // If we got here, navigation works
  });
});

/**
 * Smoke Tests: Backend Health (Direct API Calls)
 * 
 * These tests directly call the backend API without going through the frontend.
 * This helps isolate backend issues from frontend issues.
 */
test.describe("Smoke Tests: Backend API Direct", () => {
  /**
   * Direct API Test 1: Health Endpoint
   * 
   * Directly calls the backend health endpoint to verify it's responding.
   */
  test("backend health endpoint responds directly", async ({ request }) => {
    const response = await request.get(ENDPOINTS.HEALTH);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(body.status).toBe("ok");
  });

  /**
   * Direct API Test 2: Discovery Endpoint
   * 
   * Directly calls the backend discovery endpoint to verify it can access its config.
   */
  test("backend discovery endpoint responds directly", async ({ request }) => {
    const response = await request.get(ENDPOINTS.MANAGEMENT_ALL);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    
    // Verify the response has the expected structure
    expect(body).toHaveProperty("providers");
    expect(body).toHaveProperty("models");
    expect(body).toHaveProperty("keys");
    expect(body).toHaveProperty("preferences");
    
    // Verify providers is an array
    expect(Array.isArray(body.providers)).toBeTruthy();
  });

  /**
   * Direct API Test 3: Backend Response Time
   * 
   * Verifies that the backend responds within a reasonable time.
   */
  test("backend responds within reasonable time", async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(ENDPOINTS.HEALTH);
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    expect(response.ok()).toBeTruthy();
    
    // Backend should respond within 5 seconds
    expect(responseTime).toBeLessThan(5000);
  });
});
