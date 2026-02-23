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
      providers: [{ name: "openai", modalities: ["llm"] }],
      models: { openai: [{ value: "gpt-4", label: "GPT-4", modality: "llm" }] },
      prompts: { "default": "You are a bot" },
      keys: ["openai"],
      preferences: { "preferred_llm_provider": "openai" },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      providers: [
        { name: "openai", modalities: ["llm"] },
        { name: "stability", modalities: ["image"] },
      ],
      models: {},
      prompts: {},
      keys: [],
      preferences: {},
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    vi.mocked(client.getAllConfig).mockRejectedValue(new Error("Network Error"));

    const store = useIntelligenceStore();
    await store.load();

    expect(store.loading).toBe(false);
    expect(store.error).toBe("Network Error");
    expect(store.isLoaded).toBe(false);
  });
});
