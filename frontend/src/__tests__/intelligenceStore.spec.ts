import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import * as client from "@/api/client";
import { type DiscoveryResponse } from "@/api/client";

vi.mock("@/api/client", () => ({
  getAllConfig: vi.fn(),
  setPref: vi.fn(),
}));

describe("IntelligenceStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("initializes with default state", () => {
    const store = useIntelligenceStore();
    expect(store.isLoaded).toBe(false);
    expect(store.providers).toEqual([]);
    expect(store.loading).toBe(false);
  });

  it("loads configuration from API", async () => {
    const mockData = {
      success: true,
      date: new Date().toISOString(),
      error: null,
      preferences: { "preferred_llm_provider": "openai" },
      providers: [{ name: "openai", modalities: ["llm"] }],
      models: { openai: [{ value: "gpt-4", label: "GPT-4", modality: "llm" }] },
      prompts: { "default": "You are a bot" },
      keys: { "openai": "sk-test-key" },
    };

    vi.mocked(client.getAllConfig).mockResolvedValue(mockData as unknown as DiscoveryResponse);

    const store = useIntelligenceStore();
    await store.load();

    expect(store.isLoaded).toBe(true);
    expect(store.providers).toHaveLength(1);
    expect(store.getPreference("preferred_llm_provider")).toBe("openai");
    expect(store.isKeyConfigured("openai")).toBe(true);
  });

  it("filters providers by modality", async () => {
    const mockData = {
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: {},
      providers: [
        { name: "openai", modalities: ["llm"] },
        { name: "stability", modalities: ["image"] },
      ],
      models: {},
      prompts: {},
      keys: {},
    };

    vi.mocked(client.getAllConfig).mockResolvedValue(mockData as unknown as DiscoveryResponse);

    const store = useIntelligenceStore();
    await store.load();

    const llmProviders = store.getProvidersByModality("llm");
    expect(llmProviders).toHaveLength(1);
    expect(llmProviders[0].name).toBe("openai");

    const imgProviders = store.getProvidersByModality("image");
    expect(imgProviders).toHaveLength(1);
    expect(imgProviders[0].name).toBe("stability");

    const musicProviders = store.getProvidersByModality("music");
    expect(musicProviders).toHaveLength(0); // Should be empty with current mock
  });

  it("handles errors during load", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(client.getAllConfig).mockRejectedValue(new Error("Network Error"));

    const store = useIntelligenceStore();
    await store.load();

    expect(store.loading).toBe(false);
    expect(store.error).toBe("Network Error");
    expect(store.isLoaded).toBe(false);
    consoleError.mockRestore();
  });

  it("getPreferredEngine returns provider and model with correct-on-read", async () => {
    const mockData = {
      success: true,
      date: new Date().toISOString(),
      error: null,
      preferences: {
        preferred_llm_provider: "openai",
        preferred_llm_model: "gpt-4",
      },
      providers: [{ name: "openai", modalities: ["llm"] }],
      models: {
        openai: [
          { value: "gpt-4", label: "GPT-4", modality: "llm" },
          { value: "gpt-4o", label: "GPT-4o", modality: "llm" },
        ],
      },
      prompts: {},
      keys: {},
    };
    vi.mocked(client.getAllConfig).mockResolvedValue(mockData as unknown as DiscoveryResponse);

    const store = useIntelligenceStore();
    await store.load();

    const valid = store.getPreferredEngine("llm");
    expect(valid).toEqual({ provider: "openai", model: "gpt-4" });

    // Correct-on-read: stored model not in list -> return first allowed model
    store.preferences.preferred_llm_model = "deleted-model";
    const corrected = store.getPreferredEngine("llm");
    expect(corrected.provider).toBe("openai");
    expect(corrected.model).toBe("gpt-4");
  });
});
