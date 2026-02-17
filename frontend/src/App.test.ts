import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import App from "./App.vue";
import * as client from "./api/client";

vi.mock("./api/client");
vi.mock("@tauri-apps/api/shell", () => ({
  open: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => "http://127.0.0.1:8000"),
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

  it("renders app header", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({ status: "ok" });

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.find("h1").text()).toBe("Unity Generator");
  });

  it("shows online status when backend is healthy", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({ status: "ok" });

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.find(".status.online").exists()).toBe(true);
    expect(wrapper.text()).toContain("Backend: online");
  });

  it("shows offline status when backend is unavailable", async () => {
    vi.mocked(client.healthCheck).mockRejectedValue(new Error("Connection refused"));

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.find(".status.offline").exists()).toBe(true);
    expect(wrapper.text()).toContain("Backend: offline");
  });

  it("shows all navigation tabs", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({ status: "ok" });

    const wrapper = mount(App);
    await flushPromises();

    const buttons = wrapper.findAll("nav button");
    expect(buttons.length).toBe(8);
    expect(buttons.map((b) => b.text())).toEqual([
      "Scenes",
      "Settings",
      "Code",
      "Text",
      "Image",
      "Sprites",
      "Audio",
      "Unity Project",
    ]);
  });

  it("switches tabs on click", async () => {
    vi.mocked(client.healthCheck).mockResolvedValue({ status: "ok" });

    const wrapper = mount(App);
    await flushPromises();

    const codeButton = wrapper.findAll("nav button")[2];
    await codeButton.trigger("click");

    expect(codeButton.classes()).toContain("active");
    expect(wrapper.find("h2").text()).toContain("Unity C# Code");
  });
});
