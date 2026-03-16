import { describe, expect, it, beforeEach, vi } from "vitest";
import { shallowMount, flushPromises, type VueWrapper } from "@vue/test-utils";
import UnityPhysicsPanel from "@/components/UnityPhysicsPanel/UnityPhysicsPanel.vue";
import * as client from "@/api/client";
import { createPinia, setActivePinia, type Pinia } from "pinia";

vi.mock("@/api/client");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Emit an update:modelValue event on a SmartField stub identified by label.
 *
 * @param wrapper - The mounted component wrapper.
 * @param label - The label attribute value of the target smart-field-stub.
 * @param value - The new value to emit.
 */
function emitUpdate(wrapper: VueWrapper<unknown>, label: string, value: unknown): void {
  const field = wrapper.find(`smart-field-stub[label="${label}"]`);
  const el = field.element as unknown as {
    __vueParentComponent: { emit: (name: string, val: unknown) => void };
  };
  el.__vueParentComponent.emit("update:modelValue", value);
}

/**
 * Get the status text from the status-banner-stub.
 *
 * @param wrapper - The mounted component wrapper.
 * @returns The status attribute string, or empty string if not present.
 */
function getStatus(wrapper: VueWrapper<unknown>): string {
  return wrapper.find("status-banner-stub").attributes("status") ?? "";
}

/**
 * Get the tone attribute from the status-banner-stub.
 *
 * @param wrapper - The mounted component wrapper.
 * @returns The tone attribute string, or empty string if not present.
 */
function getTone(wrapper: VueWrapper<unknown>): string {
  return wrapper.find("status-banner-stub").attributes("tone") ?? "";
}

// ---------------------------------------------------------------------------
// Shared mount options
// ---------------------------------------------------------------------------

const STUBS = {
  "v-btn": true,
  "v-expansion-panels": true,
  "v-expansion-panel": true,
  "v-checkbox": true,
  "v-chip-group": true,
  "v-chip": true,
};

function mountPanel(pinia: Pinia) {
  return shallowMount(UnityPhysicsPanel, {
    global: { plugins: [pinia], stubs: STUBS },
  });
}

// ---------------------------------------------------------------------------
// Mock discovery response (no providers needed for most tests)
// ---------------------------------------------------------------------------

const MOCK_CONFIG = {
  success: true,
  date: new Date().toISOString(),
  error: null,
  providers: [
    {
      name: "openai",
      api_key_name: "openai_api_key",
      base_url: null,
      openai_compatible: true,
      requires_api_key: true,
      supports_vision: false,
      supports_streaming: false,
      supports_function_calling: true,
      supports_tool_use: true,
      modalities: ["llm"],
      default_models: {},
      extra: {},
    },
  ],
  models: {
    openai: [{ value: "gpt-4o-mini", label: "GPT-4o Mini", modality: "llm" }],
  },
  prompts: {},
  keys: {} as Record<string, string>,
  data: {
    preferred_llm_provider: "openai",
    preferred_llm_model: "gpt-4o-mini",
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UnityPhysicsPanel", () => {
  let pinia: Pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.resetAllMocks();
    vi.mocked(client.getAllConfig).mockResolvedValue(MOCK_CONFIG);
  });

  it("renders SmartField stubs and a generate button", () => {
    const wrapper = mountPanel(pinia);
    expect(wrapper.findAll("smart-field-stub").length).toBeGreaterThan(0);
    expect(wrapper.find("v-btn-stub").exists()).toBe(true);
  });

  it("calls generateUnityPhysics with correct payload on generate click", async () => {
    vi.mocked(client.generateUnityPhysics).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "// PhysX setup", files: [] },
    });

    const wrapper = mountPanel(pinia);
    await flushPromises();

    emitUpdate(wrapper, "Physics Description", "Set up a bouncy ball");
    emitUpdate(wrapper, "Physics Backend", "physx");
    emitUpdate(wrapper, "Simulation Mode", "fixed_update");

    const btns = wrapper.findAll("v-btn-stub");
    await btns[btns.length - 1].trigger("click");
    await flushPromises();

    expect(client.generateUnityPhysics).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Set up a bouncy ball",
        physics_backend: "physx",
        simulation_mode: "fixed_update",
      })
    );
  });

  it("shows success status after generation", async () => {
    vi.mocked(client.generateUnityPhysics).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "// PhysX setup", files: [] },
    });

    const wrapper = mountPanel(pinia);
    await flushPromises();

    emitUpdate(wrapper, "Physics Description", "Bouncy ball");

    const btns = wrapper.findAll("v-btn-stub");
    await btns[btns.length - 1].trigger("click");
    await flushPromises();

    expect(getStatus(wrapper)).toContain("generated successfully");
    expect(getTone(wrapper)).toBe("ok");
  });

  it("shows error status when API returns failure", async () => {
    vi.mocked(client.generateUnityPhysics).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Physics generation failed",
      data: null,
    });

    const wrapper = mountPanel(pinia);
    await flushPromises();

    emitUpdate(wrapper, "Physics Description", "Test prompt");

    const btns = wrapper.findAll("v-btn-stub");
    await btns[btns.length - 1].trigger("click");
    await flushPromises();

    expect(getStatus(wrapper)).toContain("Physics generation failed");
    expect(getTone(wrapper)).toBe("error");
  });

  it("shows error status when API throws", async () => {
    vi.mocked(client.generateUnityPhysics).mockRejectedValue(new Error("Network error"));

    const wrapper = mountPanel(pinia);
    await flushPromises();

    emitUpdate(wrapper, "Physics Description", "Test prompt");

    const btns = wrapper.findAll("v-btn-stub");
    await btns[btns.length - 1].trigger("click");
    await flushPromises();

    expect(getStatus(wrapper)).toContain("Network error");
    expect(getTone(wrapper)).toBe("error");
  });

  it("does not call API when prompt is empty", async () => {
    const wrapper = mountPanel(pinia);
    await flushPromises();

    // Leave prompt empty — button should be disabled, but also test the guard
    const btns = wrapper.findAll("v-btn-stub");
    await btns[btns.length - 1].trigger("click");
    await flushPromises();

    expect(client.generateUnityPhysics).not.toHaveBeenCalled();
  });

  it("passes gravity_preset when set", async () => {
    vi.mocked(client.generateUnityPhysics).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "// zero-g", files: [] },
    });

    const wrapper = mountPanel(pinia);
    await flushPromises();

    emitUpdate(wrapper, "Physics Description", "Floating asteroid");
    emitUpdate(wrapper, "Gravity Preset", "zero_g");

    const btns = wrapper.findAll("v-btn-stub");
    await btns[btns.length - 1].trigger("click");
    await flushPromises();

    expect(client.generateUnityPhysics).toHaveBeenCalledWith(
      expect.objectContaining({ gravity_preset: "zero_g" })
    );
  });
});
