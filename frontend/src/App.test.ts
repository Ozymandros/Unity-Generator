import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import App from "./App.vue";
import * as client from "./api/client";
import { createVuetify } from 'vuetify';

const vuetify = createVuetify();

vi.mock("./api/client");
vi.mock("@tauri-apps/api/shell", () => ({
  open: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'backendUrl') return "http://127.0.0.1:8000";
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    // Mock getPref for SettingsPanel
    vi.mocked(client.getPref).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { key: "test", value: null },
    });
  });

  const mountApp = () => mount(App, {
    global: {
      plugins: [vuetify],
    }
  });

  it("renders app header", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({ status: "ok" });

    const wrapper = mountApp();
    await flushPromises();

    expect(wrapper.find("h1").text()).toBe("Antigravity");
  });

  it("shows online status when backend is healthy", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({ status: "ok" });

    const wrapper = mountApp();
    await flushPromises();

    expect(wrapper.text()).toContain("Online");
  });

  it("shows offline status when backend is unavailable", async () => {
    vi.mocked(client.healthCheck).mockRejectedValue(new Error("Connection refused"));

    const wrapper = mountApp();
    await flushPromises();

    expect(wrapper.text()).toContain("Offline");
  });

  it("shows all navigation tabs", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({ status: "ok" });

    const wrapper = mountApp();
    await flushPromises();

    // In Vuetify, list items have the title in a specific class or we can check the text of all items
    const items = wrapper.findAll(".nav-item");
    expect(items.length).toBe(8); // Settings, Scenes, Code, Text, Image, Sprites, Audio, Unity Project
    const titles = items.map(item => item.text());
    expect(titles).toContain("Settings");
    expect(titles).toContain("Code");
    expect(titles).not.toContain("Management");
  });

  it("switches tabs on click", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({ status: "ok" });

    const wrapper = mountApp();
    await flushPromises();

    // Click on Code tab
    const codeTab = wrapper.findAll(".nav-item").find(item => item.text().includes("Code"));
    await codeTab?.trigger("click");
    await flushPromises();

    expect(wrapper.find(".v-list-item--active").text()).toContain("Code");
    expect(wrapper.text()).toContain("Unity C# Code");
  });
});
