import { defineStore } from "pinia";
import { type ProviderCapabilities, type ModelEntry, getAllConfig } from "@/api/client";

export const useIntelligenceStore = defineStore("intelligence", {
  state: () => ({
    providers: [] as ProviderCapabilities[],
    models: {} as Record<string, ModelEntry[]>,
    prompts: {} as Record<string, string>,
    keys: [] as string[],
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
    isKeyConfigured: (state) => (serviceName: string) => {
      return state.keys.includes(serviceName);
    }
  },

  actions: {
    async load(force = false) {
      if (this.isLoaded && !force) return;

      this.loading = true;
      this.error = null;
      try {
        const data = await getAllConfig();
        this.providers = data.providers;
        this.models = data.models;
        this.prompts = data.prompts;
        this.keys = data.keys;
        this.preferences = data.preferences;
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
