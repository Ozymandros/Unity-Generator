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
    vi.mocked(client.getApiKeys).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { keys: {} },
    });
  });

  it("renders all API key inputs", async () => {
    const wrapper = mount(SettingsPanel);
    await flushPromises();

    // Check for key input fields (password type)
    const passwordInputs = wrapper.findAll('input[type="password"]');
    expect(passwordInputs.length).toBe(10); // 10 API key fields (added Google and Anthropic)

    // Check for preference inputs (selects)
    const selects = wrapper.findAll("select");
    expect(selects.length).toBe(3); // LLM, Image, Audio preferences

    // Check for textarea inputs (System Prompts)
    const textareas = wrapper.findAll("textarea");
    expect(textareas.length).toBe(5); // Code, Text, Image, Audio, Sprites

    expect(wrapper.find("button.primary").text()).toBe("Save");
  });

  it("loads preferences on mount", async () => {
    mount(SettingsPanel);
    await flushPromises();

    expect(client.getPref).toHaveBeenCalledWith("preferred_llm_provider");
    expect(client.getPref).toHaveBeenCalledWith("preferred_image_provider");
    expect(client.getPref).toHaveBeenCalledWith("preferred_audio_provider");
    expect(client.getPref).toHaveBeenCalledWith("default_code_system_prompt");
    expect(client.getPref).toHaveBeenCalledWith("default_text_system_prompt");
    expect(client.getPref).toHaveBeenCalledWith("default_image_system_prompt");
    expect(client.getPref).toHaveBeenCalledWith("default_audio_system_prompt");
    expect(client.getPref).toHaveBeenCalledWith("default_sprite_system_prompt");
  });

  it("loads api keys on mount", async () => {
    vi.mocked(client.getApiKeys).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: {
        keys: {
          google_api_key: "google-key-123",
          openai_api_key: "openai-key-456",
        },
      },
    });

    const wrapper = mount(SettingsPanel);
    await flushPromises();

    expect(client.getApiKeys).toHaveBeenCalled();
    const passwordInputs = wrapper.findAll('input[type="password"]');
    expect((passwordInputs[0].element as HTMLInputElement).value).toBe("google-key-123");
    expect((passwordInputs[2].element as HTMLInputElement).value).toBe("openai-key-456");
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
    expect(client.setPref).toHaveBeenCalledTimes(8); // 3 providers + 5 system prompts
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
