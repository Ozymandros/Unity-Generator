import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as client from "@/api/client";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import UnityUIPanel from "@/components/UnityUIPanel/UnityUIPanel.vue";

vi.mock("../../api/client");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSuccessResponse(content = "// Generated UI code") {
  return {
    success: true,
    date: new Date().toISOString(),
    error: null,
    data: { content, files: [], metadata: { steps: [] } },
  };
}

function makeErrorResponse(error = "Generation failed") {
  return {
    success: false,
    date: new Date().toISOString(),
    error,
    data: null,
  };
}

function setupStore() {
  const store = useIntelligenceStore();
  store.$patch((state) => {
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
        modalities: ["llm", "text"],
        default_models: {},
        extra: {},
      },
    ];
    state.models = {
      openai: [{ value: "gpt-4o-mini", label: "GPT-4o Mini", modality: "llm" }],
    };
    state.preferences = {
      preferred_llm_provider: "openai",
      preferred_llm_model: "gpt-4o-mini",
    };
  });
  store.load = vi.fn().mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UnityUIPanel", () => {
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
    setupStore();
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it("renders the panel title and subtitle", () => {
    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    expect(wrapper.text()).toContain("Unity UI Elements");
    expect(wrapper.text()).toContain("Generate Unity UI prefabs");
  });

  it("renders quick action chips", () => {
    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    expect(wrapper.text()).toContain("Health Bar");
    expect(wrapper.text()).toContain("Button");
    expect(wrapper.text()).toContain("Dialogue Box");
    expect(wrapper.text()).toContain("Inventory Slot");
    expect(wrapper.text()).toContain("HUD Layout");
  });

  it("renders the generate button", () => {
    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    const btn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("generate"));
    expect(btn).toBeTruthy();
  });

  it("generate button is disabled when prompt is empty", async () => {
    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();
    const btn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("generate ui"));
    expect(btn?.attributes("disabled")).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Quick actions
  // -------------------------------------------------------------------------

  it("clicking a quick action chip injects its prompt", async () => {
    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    const chip = wrapper.findAll(".v-chip").find((c) => c.text().includes("Health Bar"));
    if (!chip) throw new Error("Health Bar chip not found");
    await chip.trigger("click");
    await flushPromises();

    // script setup auto-unwraps refs — access prompt directly on vm
    const vm = wrapper.vm as unknown as { prompt: string };
    expect(vm.prompt).toContain("health bar");
  });

  // -------------------------------------------------------------------------
  // Generation — success
  // -------------------------------------------------------------------------

  it("calls generateUnityUI with correct payload on submit", async () => {
    const spy = vi.spyOn(client, "generateUnityUI").mockResolvedValue(makeSuccessResponse());

    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    // Set prompt via SmartField
    const fields = wrapper.findAllComponents({ name: "SmartField" });
    const promptField = fields.find((f) => f.props("label") === "UI Element Description");
    if (!promptField) throw new Error("Prompt SmartField not found");
    promptField.vm.$emit("update:modelValue", "Create a health bar");
    await flushPromises();

    const btn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("generate ui"));
    if (!btn) throw new Error("Generate button not found");
    await btn.trigger("click");
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Create a health bar" })
    );
  });

  it("displays result content after successful generation", async () => {
    vi.spyOn(client, "generateUnityUI").mockResolvedValue(
      makeSuccessResponse("public class HealthBar : MonoBehaviour {}")
    );

    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    const fields = wrapper.findAllComponents({ name: "SmartField" });
    const promptField = fields.find((f) => f.props("label") === "UI Element Description");
    promptField?.vm.$emit("update:modelValue", "Create a health bar");
    await flushPromises();

    const btn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("generate ui"));
    await btn?.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("HealthBar");
  });

  it("shows success status message after generation", async () => {
    vi.spyOn(client, "generateUnityUI").mockResolvedValue(makeSuccessResponse());

    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    const fields = wrapper.findAllComponents({ name: "SmartField" });
    const promptField = fields.find((f) => f.props("label") === "UI Element Description");
    promptField?.vm.$emit("update:modelValue", "Create a button");
    await flushPromises();

    const btn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("generate ui"));
    await btn?.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("generated successfully");
  });

  // -------------------------------------------------------------------------
  // Generation — error
  // -------------------------------------------------------------------------

  it("shows error status when API returns success=false", async () => {
    vi.spyOn(client, "generateUnityUI").mockResolvedValue(makeErrorResponse("LLM timeout"));

    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    const fields = wrapper.findAllComponents({ name: "SmartField" });
    const promptField = fields.find((f) => f.props("label") === "UI Element Description");
    promptField?.vm.$emit("update:modelValue", "Create a HUD");
    await flushPromises();

    const btn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("generate ui"));
    await btn?.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("LLM timeout");
  });

  it("shows error status when API throws a network error", async () => {
    vi.spyOn(client, "generateUnityUI").mockRejectedValue(new Error("Backend not running"));

    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    const fields = wrapper.findAllComponents({ name: "SmartField" });
    const promptField = fields.find((f) => f.props("label") === "UI Element Description");
    promptField?.vm.$emit("update:modelValue", "Create a HUD");
    await flushPromises();

    const btn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("generate ui"));
    await btn?.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Backend not running");
  });

  it("shows error when prompt is empty and run() is called directly", async () => {
    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    // Access exposed composable state — script setup auto-unwraps refs on vm
    const vm = wrapper.vm as unknown as Record<string, unknown>;
    const run = vm.run as () => Promise<void>;
    await run();

    expect(vm.tone).toBe("error");
    expect(vm.status as string).toContain("empty");
  });

  // -------------------------------------------------------------------------
  // UI system / element type interaction
  // -------------------------------------------------------------------------

  it("passes ui_system to the API call", async () => {
    const spy = vi.spyOn(client, "generateUnityUI").mockResolvedValue(makeSuccessResponse());

    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    const vm = wrapper.vm as unknown as Record<string, unknown>;
    // script setup exposes unwrapped ref values — assign directly
    (vm as { uiSystem: string }).uiSystem = "uitoolkit";
    (vm as { prompt: string }).prompt = "Create a settings menu";
    await flushPromises();

    const run = vm.run as () => Promise<void>;
    await run();
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ui_system: "uitoolkit" }));
  });

  it("passes include_animations flag to the API call", async () => {
    const spy = vi.spyOn(client, "generateUnityUI").mockResolvedValue(makeSuccessResponse());

    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    const vm = wrapper.vm as unknown as Record<string, unknown>;
    (vm as { includeAnimations: boolean }).includeAnimations = true;
    (vm as { prompt: string }).prompt = "Create an animated button";
    await flushPromises();

    const run = vm.run as () => Promise<void>;
    await run();
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ include_animations: true }));
  });

  it("clears previous result when a new generation starts", async () => {
    vi.spyOn(client, "generateUnityUI")
      .mockResolvedValueOnce(makeSuccessResponse("First result"))
      .mockResolvedValueOnce(makeSuccessResponse("Second result"));

    const wrapper = mount(UnityUIPanel, { global: { plugins: [vuetify] } });
    await flushPromises();

    const vm = wrapper.vm as unknown as Record<string, unknown>;
    const run = vm.run as () => Promise<void>;

    (vm as { prompt: string }).prompt = "First prompt";
    await run();
    await flushPromises();

    (vm as { prompt: string }).prompt = "Second prompt";
    await run();
    await flushPromises();

    expect(wrapper.text()).toContain("Second result");
    expect(wrapper.text()).not.toContain("First result");
  });
});

// ---------------------------------------------------------------------------
// unityUIPrompts constants
// ---------------------------------------------------------------------------

describe("unityUIPrompts constants", () => {
  it("UI_QUICK_ACTIONS has at least 5 entries", async () => {
    const { UI_QUICK_ACTIONS } = await import("@/constants/unityUIPrompts");
    expect(UI_QUICK_ACTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it("every quick action has required fields", async () => {
    const { UI_QUICK_ACTIONS } = await import("@/constants/unityUIPrompts");
    for (const action of UI_QUICK_ACTIONS) {
      expect(action.label).toBeTruthy();
      expect(action.icon).toBeTruthy();
      expect(action.elementType).toBeTruthy();
      expect(action.prompt.length).toBeGreaterThan(20);
    }
  });

  it("UI_EXAMPLE_PROMPTS has at least 5 entries", async () => {
    const { UI_EXAMPLE_PROMPTS } = await import("@/constants/unityUIPrompts");
    expect(UI_EXAMPLE_PROMPTS.length).toBeGreaterThanOrEqual(5);
  });

  it("getTemplatePrompt returns empty string for custom type", async () => {
    const { getTemplatePrompt } = await import("@/constants/unityUIPrompts");
    expect(getTemplatePrompt("custom", "ugui")).toBe("");
  });

  it("getTemplatePrompt returns a non-empty string for known types", async () => {
    const { getTemplatePrompt } = await import("@/constants/unityUIPrompts");
    const prompt = getTemplatePrompt("health_bar", "ugui");
    expect(prompt.length).toBeGreaterThan(20);
  });

  it("getTemplatePrompt adapts prompt for uitoolkit", async () => {
    const { getTemplatePrompt } = await import("@/constants/unityUIPrompts");
    const ugui = getTemplatePrompt("health_bar", "ugui");
    const toolkit = getTemplatePrompt("health_bar", "uitoolkit");
    // Toolkit version should mention UI Toolkit
    expect(toolkit).toContain("UI Toolkit");
    // They should differ
    expect(ugui).not.toBe(toolkit);
  });
});
