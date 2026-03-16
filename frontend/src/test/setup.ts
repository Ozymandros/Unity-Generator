import { vi, beforeAll, afterEach, afterAll } from "vitest";

// MSW setup for global network mocking

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Enforce strict mocking of all filesystem and network dependencies
// Mock Node.js 'fs' module globally to throw on any access
try {
  vi.mock("fs", () => ({
    readFile: () => {
      throw new Error(
        "fs.readFile is forbidden in tests. Use a mock or in-memory data.",
      );
    },
    readFileSync: () => {
      throw new Error(
        "fs.readFileSync is forbidden in tests. Use a mock or in-memory data.",
      );
    },
    writeFile: () => {
      throw new Error(
        "fs.writeFile is forbidden in tests. Use a mock or in-memory data.",
      );
    },
    writeFileSync: () => {
      throw new Error(
        "fs.writeFileSync is forbidden in tests. Use a mock or in-memory data.",
      );
    },
    existsSync: () => false,
    mkdirSync: () => {
      throw new Error(
        "fs.mkdirSync is forbidden in tests. Use a mock or in-memory data.",
      );
    },
    ...Object.fromEntries(
      [
        "appendFile",
        "appendFileSync",
        "unlink",
        "unlinkSync",
        "readdir",
        "readdirSync",
        "stat",
        "statSync",
        "createReadStream",
        "createWriteStream",
      ].map(fn => [
        fn,
        () => {
          throw new Error(
            `fs.${fn} is forbidden in tests. Use a mock or in-memory data.`,
          );
        },
      ]),
    ),
  }));
} catch {
  // Ignore if not running in Node.js or already mocked
}

// Mock fetch to always throw if not handled by msw
if (typeof globalThis.fetch !== "undefined") {
  globalThis.fetch = vi.fn(() =>
    Promise.reject(
      new Error("fetch is forbidden in tests unless explicitly mocked."),
    ),
  );
}

const server = setupServer(
  http.all("*", ({ request }) => {
    return HttpResponse.json(
      { error: "Network access blocked in tests", url: request.url },
      { status: 503 },
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia (not implemented in jsdom)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Assign to globalThis and window with correct type
Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserver,
  configurable: true,
});
Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserver,
  configurable: true,
});

// Mock localStorage if needed globally
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Mock Electron shell for tests
vi.mock("electron", () => ({
  shell: {
    openPath: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock vue-router since some components import it but the project uses tab navigation
vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: { value: { query: {}, params: {} } }
  }),
  useRoute: () => ({
    query: {},
    params: {},
    path: "/",
    name: "home"
  })
}));

// Optionally, mock fetch to throw if not handled by msw (defensive)
// Already enforced above
