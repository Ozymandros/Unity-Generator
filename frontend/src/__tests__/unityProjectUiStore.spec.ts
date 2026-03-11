import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useUnityProjectUiStore } from "@/store/unityProjectUiStore";

describe("UnityProjectUiStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("initializes with defaults when storage empty", () => {
    const store = useUnityProjectUiStore();
    expect(store.settings.timeout).toBe(300);
    expect(store.settings.sceneName).toBe("MainScene");
    expect(store.lastProjectPath).toBe("");
  });

  it("persists and hydrates state from localStorage", () => {
    const store = useUnityProjectUiStore();
    store.$patch({
      lastProjectPath: "C:/output/MyProject",
      settings: { ...store.settings, version: "6000.3.2f1", installPackages: true, packages: "com.unity.textmeshpro" },
    });
    store.persistToStorage();

    const store2 = useUnityProjectUiStore();
    store2.hydrateFromStorage();
    expect(store2.lastProjectPath).toBe("C:/output/MyProject");
    expect(store2.settings.version).toBe("6000.3.2f1");
    expect(store2.settings.installPackages).toBe(true);
  });

  it("reset() returns state to defaults and persists", () => {
    const store = useUnityProjectUiStore();
    store.$patch({
      result: "{ \"ok\": true }",
      lastProjectPath: "C:/output/X",
      settings: { ...store.settings, template: "3D", platform: "Windows" },
    });
    store.persistToStorage();

    store.reset();
    expect(store.result).toBe("");
    expect(store.lastProjectPath).toBe("");
    expect(store.settings.template).toBe("");
    expect(store.settings.platform).toBe("");
  });
});

