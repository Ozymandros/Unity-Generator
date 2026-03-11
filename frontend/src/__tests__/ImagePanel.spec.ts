import { mount, flushPromises } from "@vue/test-utils";
import { ImagePanel } from "@/components/ImagePanel";
import * as client from "@/api/client";
import { createPinia, setActivePinia } from "pinia";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { createVuetify } from "vuetify";

vi.mock("../../api/client");


describe("ImagePanel", () => {
  let vuetify: ReturnType<typeof createVuetify>;
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
    vuetify = createVuetify();
    vi.spyOn(client, "getPref").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { key: "test", value: null },
    });

    // Patch intelligenceStore with mock data
    const store = useIntelligenceStore();
    store.$patch(state => {
      state.providers = [
        {
          name: 'openai',
          api_key_name: null,
          base_url: null,
          openai_compatible: false,
          requires_api_key: false,
          supports_vision: false,
          supports_streaming: false,
          supports_function_calling: false,
          supports_tool_use: false,
          modalities: ['text', 'image'],
          default_models: {},
          extra: {}
        },
        {
          name: 'stability',
          api_key_name: null,
          base_url: null,
          openai_compatible: false,
          requires_api_key: false,
          supports_vision: false,
          supports_streaming: false,
          supports_function_calling: false,
          supports_tool_use: false,
          modalities: ['image'],
          default_models: {},
          extra: {}
        }
      ];
      state.models = {
        openai: [{ value: 'dall-e-3', label: 'DALL-E 3', modality: 'image' }],
        stability: [{ value: 'stable-diffusion', label: 'Stable Diffusion', modality: 'image' }]
      };
      state.preferences = {
        preferred_image_provider: 'openai',
        preferred_image_model: 'dall-e-3',
      };
    });
    store.load = vi.fn().mockResolvedValue(undefined);
  });

  it("renders form fields", () => {
    const wrapper = mount(ImagePanel, { global: { plugins: [vuetify] } });
    expect(wrapper.html()).toContain("Prompt");
    expect(wrapper.html().toLowerCase()).toContain("generate");
  });

  it("calls generateImage API on button click", async () => {
    vi.spyOn(client, "generateImage").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { image: "base64-image-data" },
    });

    const wrapper = mount(ImagePanel, { global: { plugins: [vuetify] } });
    // Find SmartField for prompt and set value
    const fields = wrapper.findAllComponents({ name: 'SmartField' });
    const setField = (label: string, value: unknown) => {
      const field = fields.find(f => f.props('label') === label);
      if (!field) throw new Error(`SmartField with label ${label} not found`);
      return field.vm.$emit('update:modelValue', value);
    };
    setField('Prompt', 'A fantasy landscape');
    setField('Provider', 'stability');
    setField('Aspect Ratio', '16:9');
    setField('Quality', 'hd');

    const btn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('generate'));
    if (!btn) throw new Error('Generate button not found');
    await btn.trigger("click");
    await flushPromises();

    expect(client.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({ 
        prompt: "A fantasy landscape",
        provider: "stability",
        options: expect.objectContaining({ 
          aspect_ratio: "16:9",
          quality: "hd"
        })
      })
    );
  });

  it("displays result on success", async () => {
    vi.spyOn(client, "generateImage").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { image: "generated-image-base64" },
    });

    const wrapper = mount(ImagePanel, { global: { plugins: [vuetify] } });
    const fields = wrapper.findAllComponents({ name: 'SmartField' });
    const setField = (label: string, value: string | number | boolean) => {
      const field = fields.find(f => f.props('label') === label);
      if (!field) throw new Error(`SmartField with label ${label} not found`);
      return field.vm.$emit('update:modelValue', value);
    };
    setField('Prompt', 'Hero portrait');
    const btn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('generate'));
    if (!btn) throw new Error('Generate button not found');
    await btn.trigger("click");
    await flushPromises();

    expect(wrapper.html()).toContain("generated-image-base64");
  });

  it("shows error status on failure", async () => {
    vi.spyOn(client, "generateImage").mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Image generation failed",
      data: null,
    });

    const wrapper = mount(ImagePanel, { global: { plugins: [vuetify] } });
    const fields = wrapper.findAllComponents({ name: 'SmartField' });
    const setField = (label: string, value: string | number | boolean) => {
      const field = fields.find(f => f.props('label') === label);
      if (!field) throw new Error(`SmartField with label ${label} not found`);
      return field.vm.$emit('update:modelValue', value);
    };
    setField('Prompt', 'Test');
    const btn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('generate'));
    if (!btn) throw new Error('Generate button not found');
    await btn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Image generation failed");
  });
});
import { describe, expect, it, beforeEach } from "vitest";
