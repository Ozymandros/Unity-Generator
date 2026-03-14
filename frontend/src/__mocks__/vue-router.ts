import { vi } from "vitest";

/**
 * Manual mock for vue-router module.
 * 
 * This project uses tab-based navigation via setActive() instead of vue-router,
 * but some components (like ImagePanel) were implemented with vue-router imports.
 * This mock allows tests to run without installing vue-router.
 */

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: { value: { query: {}, params: {}, path: "/", name: "home" } }
}));

export const useRoute = vi.fn(() => ({
  query: {},
  params: {},
  path: "/",
  name: "home",
  fullPath: "/",
  hash: "",
  matched: [],
  meta: {},
  redirectedFrom: undefined
}));

export const createRouter = vi.fn();
export const createWebHistory = vi.fn();
export const createMemoryHistory = vi.fn();
