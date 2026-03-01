import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import App from "@/App.vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";

const pinia = createPinia();
const vuetify = createVuetify({ components, directives });

// Mock the store module so we control its return value (no real Pinia store in this describe)
vi.mock("@/store/intelligenceStore", () => ({
  useIntelligenceStore: vi.fn(),
}));

// Mock healthCheck so we can control online/offline in tests
vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    healthCheck: vi.fn(),
  };
});

import { useIntelligenceStore } from "@/store/intelligenceStore";
import { createPinia } from "pinia";
import { healthCheck } from "@/api/client";
import type { ProviderCapabilities, ModelEntry } from "@/api/client";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Minimal store shape used by App and child panels; typed so the mock stays safe. */
function createMockIntelligenceStore() {
  const providers: ProviderCapabilities[] = [
    {
      name: "openai",
      api_key_name: null,
      base_url: null,
      openai_compatible: true,
      requires_api_key: false,
      supports_vision: false,
      supports_streaming: false,
      supports_function_calling: false,
      supports_tool_use: false,
      modalities: ["text", "image", "llm"],
      default_models: {},
      extra: {},
    },
    {
      name: "anthropic",
      api_key_name: null,
      base_url: null,
      openai_compatible: true,
      requires_api_key: false,
      supports_vision: false,
      supports_streaming: false,
      supports_function_calling: false,
      supports_tool_use: false,
      modalities: ["text", "llm"],
      default_models: {},
      extra: {},
    },
  ];
  const preferences: Record<string, string> = {
    preferred_llm_provider: "openai",
    preferred_llm_model: "gpt-4o-mini",
    default_text_system_prompt: "You are a helpful assistant.",
  };
  const models: Record<string, ModelEntry[]> = {
    openai: [{ value: "gpt-4o-mini", modality: "llm", label: "GPT-4o mini" }],
  };

  const getPreferredEngine = (modality: string) => {
    const provider = preferences[`preferred_${modality}_provider`] ?? "";
    const model = preferences[`preferred_${modality}_model`] ?? "";
    const providerModels = models[provider] ?? [];
    const allowed = providerModels.filter((m) => m.modality === modality);
    const valid = allowed.some((m) => m.value === model);
    if (valid) return { provider, model };
    return { provider, model: allowed.length ? allowed[0].value : "" };
  };

  return {
    providers,
    preferences,
    models,
    load: vi.fn().mockResolvedValue(undefined),
    getPreference: vi.fn((key: string) => preferences[key] ?? ""),
    getPreferredEngine: vi.fn(getPreferredEngine),
    getProvidersByModality: vi.fn((modality: string) =>
      providers.filter((p) => p.modalities.includes(modality)),
    ),
    getModelsByProvider: vi.fn((_provider: string, _modality?: string) =>
      models.openai ?? [],
    ),
    isKeyConfigured: vi.fn(() => false),
  };
}

describe("App", () => {
  beforeEach(() => {
    const mockStore = createMockIntelligenceStore();
    // Cast: test double has only the store surface used by App/panels; Pinia internals are unused here.
    vi.mocked(useIntelligenceStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useIntelligenceStore>,
    );
    vi.mocked(healthCheck).mockRejectedValue(new Error("Network error"));
  });

  it("renders app header", async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify, pinia],
      },
    });
    expect(wrapper.text()).toContain("Unity Generator");
  });

  it("shows online status when backend is healthy", async () => {
    vi.mocked(healthCheck).mockResolvedValue({ status: "ok" });
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify],
      },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("Online");
  });

  it("shows offline status when backend is unavailable", async () => {
    vi.mocked(healthCheck).mockRejectedValue(new Error("Network error"));
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify],
      },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("Offline");
  });

  it("shows all navigation tabs", async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify],
      },
    });
    expect(wrapper.text()).toContain("Settings");
    expect(wrapper.text()).toContain("Code");
    expect(wrapper.text()).not.toContain("Management");
  });

  it("switches tabs on click", async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify],
      },
    });
    const navItems = wrapper.findAll(".nav-item");
    const codeTab = navItems.find(item => item.text() === "Code");
    expect(codeTab).toBeTruthy(); // Optional: check it exists
    await codeTab!.trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Unity C# Code");
  });
});
