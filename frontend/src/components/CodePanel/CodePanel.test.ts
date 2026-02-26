import { describe, it, expect, beforeEach, vi } from "vitest";

import CodePanel from "./CodePanel.vue";
import { mount } from "@vue/test-utils";
import * as client from "@/api/client";

import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import { useIntelligenceStore } from "@/store/intelligenceStore";

vi.mock("../../api/client");

describe("CodePanel", () => {
  let vuetify: ReturnType<typeof createVuetify>;
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
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
          extra: {}
        }
      ];
      state.models = {
        openai: [{ value: "gpt-4o", modality: "llm", label: "GPT-4o" }],
      };
      state.preferences = {
        preferred_llm_provider: "openai",
        preferred_llm_model: "gpt-4o-mini",
        default_text_system_prompt: "You are a helpful assistant.",
        // ...other required fields...
      };
    });
    store.load = vi.fn().mockResolvedValue(undefined);
    vuetify = createVuetify();
    vi.spyOn(client, "getPref").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { key: "default_code_system_prompt", value: "Mock System Prompt" },
    });
    vi.spyOn(client, "getAllConfig").mockResolvedValue({
      providers: [
        {
          name: "openai",
          modalities: ["llm", "image"],
          api_key_name: "OPENAI_API_KEY",
          base_url: "https://api.openai.com/v1",
          openai_compatible: true,
          requires_api_key: true,
          supports_vision: false,
          supports_streaming: false,
          supports_function_calling: false,
          supports_tool_use: false,
          default_models: {},
          extra: {},
        },
      ],
      models: {
        openai: [
          { value: "gpt-4o", modality: "llm", label: "GPT-4o" },
          { value: "sprite-model", modality: "image", label: "Sprite Model" },
        ],
      },
      prompts: {},
      keys: [],
      preferences: {},
    });
  });

  it("renders form fields", () => {
    const wrapper = mount(CodePanel, { global: { plugins: [vuetify] } });
    expect(wrapper.find("textarea").exists()).toBe(true);
    expect(wrapper.findAll("select").length).toBeGreaterThanOrEqual(2);
    const button = wrapper
      .findAll("button.v-btn")
      .find(btn => btn.text().includes("Generate Code"));
    expect(button).toBeTruthy();
  });

  it("calls generateCode API on button click", async () => {
    vi.spyOn(client, "generateCode").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "public class Test {}" },
    });

    const wrapper = mount(CodePanel, { global: { plugins: [vuetify] } });
    await wrapper.find("textarea").setValue("Create a test class");
    const button = wrapper
      .findAll("button.v-btn")
      .find(btn => btn.text().includes("Generate Code"));
    expect(button).toBeTruthy();
    await button!.trigger("click");
    await wrapper.vm.$nextTick();

    expect(client.generateCode).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Create a test class" }),
    );
  });

  it("displays result on success", async () => {
    vi.spyOn(client, "generateCode").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "class PlayerController {}" },
    });

    const wrapper = mount(CodePanel, { global: { plugins: [vuetify] } });
    await wrapper.find("textarea").setValue("Create player controller");
    const button = wrapper
      .findAll("button.v-btn")
      .find(btn => btn.text().includes("Generate Code"));
    expect(button).toBeTruthy();
    await button!.trigger("click");
    await wrapper.vm.$nextTick();

    const resultTextarea = wrapper.findAll("textarea")[2];
    expect((resultTextarea.element as HTMLTextAreaElement).value).toContain(
      "PlayerController",
    );
  });

  it("shows error status on failure", async () => {
    vi.mocked(client.generateCode).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "API rate limited",
      data: null,
    });

    const wrapper = mount(CodePanel, { global: { plugins: [vuetify] } });
    await wrapper.find("textarea").setValue("Test prompt");
    const button = wrapper
      .findAll("button.v-btn")
      .find(btn => btn.text().includes("Generate Code"));
    expect(button).toBeTruthy();
    await button!.trigger("click");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("API rate limited");
  });
});
