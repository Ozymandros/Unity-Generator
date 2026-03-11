import { describe, expect, it, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { TextPanel } from "@/components/TextPanel";
import * as client from "@/api/client";
import { setActivePinia, createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { useIntelligenceStore } from "@/store/intelligenceStore"; // <-- add this import

vi.mock("../../api/client");

describe("TextPanel", () => {
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

    // Patch the store with required state
    const store = useIntelligenceStore();
    store.$patch(state => {
      state.providers = [
        {
          name: "openai",
          api_key_name: null,
          base_url: null,
          openai_compatible: false,
          requires_api_key: false,
          supports_vision: false,
          supports_streaming: false,
          supports_function_calling: false,
          supports_tool_use: false,
          modalities: ["text", "image"],
          default_models: {},
          extra: {},
        },
      ];
      state.models = {
        openai: [
          { value: "gpt-4o-mini", label: "GPT-4o Mini", modality: "text" },
        ],
      };
      state.preferences = {
        preferred_llm_provider: "openai",
        preferred_llm_model: "gpt-4o-mini",
        default_text_system_prompt: "You are a helpful assistant.",
        // add any other required preference keys here
      };
    });
    store.load = vi.fn().mockResolvedValue(undefined);
  });

  it("renders form fields", () => {
    const wrapper = mount(TextPanel, {
      global: { plugins: [vuetify], stubs: { SmartField: true } },
    });
    // Check SmartField components by label prop
    const fields = wrapper.findAllComponents({ name: "SmartField" });
    const labels = fields.map(f => f.props("label"));
    expect(labels).toContain("Prompt");
    expect(labels).toContain("Provider");
    expect(labels).toContain("Model");
    expect(labels).toContain("Temperature");
    expect(labels).toContain("Length");
    // Button is stubbed, so just check it exists
    expect(wrapper.html().toLowerCase()).toContain("generate");
  });

  it("calls generateText API on button click", async () => {
    vi.spyOn(client, "generateText").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "Generated text content" },
    });

    const wrapper = mount(TextPanel, {
      global: { plugins: [vuetify] },
    });
    // Find SmartField components by label
    const fields = wrapper.findAllComponents({ name: "SmartField" });
    const setField = (label: string, value: string | number | boolean) => {
      const field = fields.find(f => f.props("label") === label);
      if (!field) throw new Error(`SmartField with label ${label} not found`);
      return field.vm.$emit("update:modelValue", value);
    };
    setField("Prompt", "Write a greeting");
    setField("Provider", "openai");
    setField("Model", "gpt-4o-mini");
    setField("Temperature", 1.0);
    setField("Length", 1024);

    // Find and click the generate button
    const btn = wrapper
      .findAll("button")
      .find(b => b.text().toLowerCase().includes("generate"));
    if (!btn) throw new Error("Generate button not found");
    await btn.trigger("click");
    await flushPromises();

    expect(client.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Write a greeting",
        provider: "openai",
        options: expect.objectContaining({
          model: "gpt-4o-mini",
          temperature: 1.0,
          max_tokens: 1024,
        }),
      }),
    );
  });

  it("displays result on success", async () => {
    vi.spyOn(client, "generateText").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "Hello, adventurer!" },
    });

    const wrapper = mount(TextPanel, {
      global: { plugins: [vuetify] },
    });
    const fields = wrapper.findAllComponents({ name: "SmartField" });
    const setField = (label: string, value: string | number | boolean) => {
      const field = fields.find(f => f.props("label") === label);
      if (!field) throw new Error(`SmartField with label ${label} not found`);
      return field.vm.$emit("update:modelValue", value);
    };
    setField("Prompt", "Greeting");
    const btn = wrapper
      .findAll("button")
      .find(b => b.text().toLowerCase().includes("generate"));
    if (!btn) throw new Error("Generate button not found");
    await btn.trigger("click");
    await flushPromises();

    // Find the result SmartField
    const resultField = fields.find(f => f.props("label") === "Result");
    expect(resultField?.props("modelValue") ?? "").toContain(
      "Hello, adventurer!",
    );
  });

  it("shows error status on failure", async () => {
    vi.spyOn(client, "generateText").mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Service unavailable",
      data: null,
    });

    const wrapper = mount(TextPanel, {
      global: { plugins: [vuetify] },
    });
    const fields = wrapper.findAllComponents({ name: "SmartField" });
    const setField = (label: string, value: string | number | boolean) => {
      const field = fields.find(f => f.props("label") === label);
      if (!field) throw new Error(`SmartField with label ${label} not found`);
      return field.vm.$emit("update:modelValue", value);
    };
    setField("Prompt", "Test");
    const btn = wrapper
      .findAll("button")
      .find(b => b.text().toLowerCase().includes("generate"));
    if (!btn) throw new Error("Generate button not found");
    await btn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Service unavailable");
  });
});
