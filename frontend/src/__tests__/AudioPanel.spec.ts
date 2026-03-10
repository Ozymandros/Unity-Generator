import { describe, expect, it, beforeEach } from "vitest";
import { shallowMount, flushPromises, VueWrapper } from "@vue/test-utils";
import AudioPanel from "@/components/AudioPanel";
import * as client from "@/api/client";
import { createPinia, setActivePinia, type Pinia } from "pinia";

vi.mock("@/api/client");

const emitUpdate = async (wrapper: VueWrapper<unknown>, selector: string, value: unknown) => {
  const field = wrapper.find(selector);
  const element = field.element as unknown as { __vueParentComponent: { emit: (name: string, val: unknown) => void } };
  await element.__vueParentComponent.emit("update:modelValue", value);
};

describe("AudioPanel", () => {
  let pinia: Pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.resetAllMocks();

    // Mock discovery API
    vi.mocked(client.getAllConfig).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      providers: [{
        name: "elevenlabs",
        api_key_name: "elevenlabs_api_key",
        base_url: null,
        openai_compatible: false,
        requires_api_key: true,
        supports_vision: false,
        supports_streaming: false,
        supports_function_calling: false,
        supports_tool_use: false,
        modalities: ["audio"],
        default_models: {},
        extra: {}
      }],
      models: {
        elevenlabs: [{ value: "Rachel", label: "Rachel", modality: "audio" }]
      },
      prompts: {},
      keys: {} as Record<string, string>,
      data: {
        preferred_audio_provider: "elevenlabs",
        preferred_audio_model: "Rachel"
      }
    });
  });

  it("renders form fields", () => {
    const wrapper = shallowMount(AudioPanel, {
      global: { 
        plugins: [pinia],
        stubs: {
          'v-btn': true,
          'v-expansion-panels': true,
          'v-expansion-panel': true
        }
      }
    });
    // With shallowMount, we check for stubs or child components
    expect(wrapper.findAll("smart-field-stub").length).toBeGreaterThan(0);
    expect(wrapper.find("v-btn-stub").exists()).toBe(true);
  });

  it("calls generateAudio API on button click", async () => {
    vi.mocked(client.generateAudio).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { audio_url: "https://example.com/audio.mp3" },
    });

    const wrapper = shallowMount(AudioPanel, {
      global: { 
        plugins: [pinia],
        stubs: {
          'v-btn': true,
          'v-expansion-panels': true,
          'v-expansion-panel': true
        }
      }
    });

    // We need to wait for onMounted store.load()
    await flushPromises();

    // Set prompt
    await emitUpdate(wrapper, 'smart-field-stub[label="Speech Prompt"]', "A battle cry");

    // Select provider
    await emitUpdate(wrapper, 'smart-field-stub[label="Provider"]', "elevenlabs");

    // Select voice
    await emitUpdate(wrapper, 'smart-field-stub[label="Voice (optional)"]', "Rachel");

    // Click Generate
    const btns = wrapper.findAll("v-btn-stub");
    await btns[btns.length - 1].trigger("click");
    await flushPromises();

    expect(client.generateAudio).toHaveBeenCalledWith(
      expect.objectContaining({ 
        prompt: "A battle cry",
        provider: "elevenlabs",
        options: expect.objectContaining({ voice_id: "Rachel" })
      })
    );
  });

  it("displays result on success", async () => {
    vi.mocked(client.generateAudio).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { audio_url: "https://example.com/output.mp3" },
    });

    const wrapper = shallowMount(AudioPanel, {
      global: { 
        plugins: [pinia],
        stubs: {
          'v-btn': true,
          'v-expansion-panels': true,
          'v-expansion-panel': true
        }
      }
    });

    await flushPromises();

    await emitUpdate(wrapper, 'smart-field-stub[label="Speech Prompt"]', "Sound effect");
    const btns = wrapper.findAll("v-btn-stub");
    await btns[btns.length - 1].trigger("click");
    await flushPromises();

    const resultField = wrapper.find('smart-field-stub[label="Result (JSON)"]');
    expect(resultField.attributes("modelvalue")).toContain("output.mp3");
  });

  it("shows error status on failure", async () => {
    vi.mocked(client.generateAudio).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Audio generation failed",
      data: null,
    });

    const wrapper = shallowMount(AudioPanel, {
      global: { 
        plugins: [pinia],
        stubs: {
          'v-btn': true,
          'v-expansion-panels': true,
          'v-expansion-panel': true
        }
      }
    });

    await flushPromises();

    await emitUpdate(wrapper, 'smart-field-stub[label="Speech Prompt"]', "Test");
    const btns = wrapper.findAll("v-btn-stub");
    await btns[btns.length - 1].trigger("click");
    await flushPromises();

    expect(wrapper.find("status-banner-stub").attributes("status")).toContain("Audio generation failed");
  });
});
