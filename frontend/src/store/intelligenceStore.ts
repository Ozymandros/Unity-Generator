import { defineStore } from "pinia";
import { type ProviderCapabilities, type ModelEntry, getAllConfig } from "@/api/client";

export const useIntelligenceStore = defineStore("intelligence", {
  state: () => ({
    providers: [] as ProviderCapabilities[],
    models: {} as Record<string, ModelEntry[]>,
    prompts: {} as Record<string, string>,
    keys: {} as Record<string, string>,
    preferences: {} as Record<string, string>,
    isLoaded: false,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getProvidersByModality: (state) => (modality: string) => {
      return state.providers.filter((p) => p.modalities.includes(modality));
    },
    getModelsByProvider: (state) => (provider: string, modality?: string) => {
      const providerModels = state.models[provider] || [];
      if (!modality) return providerModels;
      return providerModels.filter((m) => m.modality === modality);
    },
    getPreference: (state) => (key: string) => {
      return state.preferences[key] || "";
    },
    /**
     * Preferred engine (provider + model) for a modality, with correct-on-read:
     * if the stored model is not in the provider's list, returns the same provider
     * with the first available model or empty string.
     */
    getPreferredEngine: (state) => (modality: string): { provider: string; model: string } => {
      const provider = (state.preferences[`preferred_${modality}_provider`] || "").trim();
      const model = (state.preferences[`preferred_${modality}_model`] || "").trim();
      if (!provider) return { provider: "", model: "" };
      const providerModels = state.models[provider] || [];
      const allowed = providerModels.filter((m) => m.modality === modality);
      const valid = allowed.some((m) => m.value === model);
      if (valid) return { provider, model };
      return { provider, model: allowed.length ? allowed[0].value : "" };
    },
    isKeyConfigured: (state) => (serviceName: string) => {
      return !!state.keys[serviceName];
    }
  },

  actions: {
    async load(force = false) {
      if (this.isLoaded && !force) return;

      this.loading = true;
      this.error = null;
      try {
        const data = await getAllConfig();
        this.providers = data.providers || [];
        this.models = (data.models as Record<string, ModelEntry[]>) || {};
        this.prompts = (data.prompts as Record<string, string>) || {};
        this.keys = (data.keys as Record<string, string>) || {};
        this.preferences = (data.data as Record<string, string>) || {};
        this.isLoaded = true;
      } catch (e: unknown) {
        this.error = (e as Error).message || "Failed to load intelligence configuration";
        console.error("IntelligenceStore load failed:", e);
      } finally {
        this.loading = false;
      }
    },

    async refresh() {
      return this.load(true);
    },

    setPreference(key: string, value: string) {
      this.preferences[key] = value;
    }
  },
});
