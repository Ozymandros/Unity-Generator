import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { SettingsPanel } from "@/components/SettingsPanel";
import * as client from "@/api/client";

vi.mock("../../api/client");

describe("SettingsPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'backend_url') return "http://127.0.0.1:8000";
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

    vi.mocked(client.getPref).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { key: "test", value: "openai" },
    });
  });

  it("renders preference selects and dashboard link", async () => {
    const wrapper = mount(SettingsPanel);
    await flushPromises();

    // Check for preference inputs (selects)
    const selects = wrapper.findAll("select");
    expect(selects.length).toBe(4); // LLM, Image, Voice, Music

    // Check for the dashboard link button
    const dashboardBtn = wrapper.find("button.secondary");
    expect(dashboardBtn.text()).toContain("Go to Management Dashboard");

    expect(wrapper.find("button.primary").text()).toBe("Save Preferences");
  });

  it("loads preferences on mount", async () => {
    mount(SettingsPanel);
    await flushPromises();

    expect(client.getPref).toHaveBeenCalledWith("preferred_llm_provider");
    expect(client.getPref).toHaveBeenCalledWith("preferred_image_provider");
    expect(client.getPref).toHaveBeenCalledWith("preferred_audio_provider");
    expect(client.getPref).toHaveBeenCalledWith("preferred_music_provider");
  });

  it("saves preferences on button click", async () => {
    vi.mocked(client.setPref).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { key: "test" },
    });

    const wrapper = mount(SettingsPanel);
    await flushPromises();

    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.setPref).toHaveBeenCalledTimes(4); // 4 provider preferences
    expect(wrapper.text()).toContain("Preferences saved locally");
  });

  it("displays error on save failure", async () => {
    vi.mocked(client.setPref).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Network error",
      data: null,
    });

    const wrapper = mount(SettingsPanel);
    await flushPromises();

    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Network error");
  });
  
  it("emits switch-tab when dashboard button is clicked", async () => {
    const wrapper = mount(SettingsPanel);
    await flushPromises();

    await wrapper.find("button.secondary").trigger("click");
    
    expect(wrapper.emitted("switch-tab")).toBeTruthy();
    expect(wrapper.emitted("switch-tab")![0]).toEqual(["Management"]);
  });
});
