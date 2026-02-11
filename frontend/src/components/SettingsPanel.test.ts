import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import SettingsPanel from "./SettingsPanel.vue";
import * as client from "../api/client";

vi.mock("../api/client");

describe("SettingsPanel", () => {
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

    vi.mocked(client.getPref).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { key: "test", value: null },
    });
  });

  it("renders all API key inputs", async () => {
    const wrapper = mount(SettingsPanel);
    await flushPromises();

    // Check for key input fields (password type)
    const passwordInputs = wrapper.findAll('input[type="password"]');
    expect(passwordInputs.length).toBe(8); // 8 API key fields

    // Check for preference inputs (selects)
    const selects = wrapper.findAll("select");
    expect(selects.length).toBe(3); // LLM, Image, Audio preferences

    expect(wrapper.find("button.primary").text()).toBe("Save");
  });

  it("loads preferences on mount", async () => {
    mount(SettingsPanel);
    await flushPromises();

    expect(client.getPref).toHaveBeenCalledWith("preferred_llm_provider");
    expect(client.getPref).toHaveBeenCalledWith("preferred_image_provider");
    expect(client.getPref).toHaveBeenCalledWith("preferred_audio_provider");
  });

  it("saves keys and preferences on button click", async () => {
    vi.mocked(client.saveApiKeys).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { saved: ["openai"] },
    });
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

    expect(client.saveApiKeys).toHaveBeenCalled();
    expect(client.setPref).toHaveBeenCalledTimes(3);
    expect(wrapper.text()).toContain("Saved locally");
  });

  it("displays error on save failure", async () => {
    vi.mocked(client.saveApiKeys).mockResolvedValue({
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
});
