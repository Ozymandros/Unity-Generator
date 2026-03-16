import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { SettingsPanel } from "@/components/SettingsPanel";
import * as client from "@/api/client";
import { createVuetify } from 'vuetify';
import i18n from "@/i18n";

const vuetify = createVuetify();

vi.mock("../../api/client");

describe("SettingsPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'backendUrl') return "http://127.0.0.1:35421";
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    vi.mocked(client.getPref).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { key: "environment", value: "openai" },
    });

    vi.mocked(client.listProviders).mockResolvedValue([]);
    vi.mocked(client.listApiKeys).mockResolvedValue({});
    vi.mocked(client.listSystemPrompts).mockResolvedValue({});
  });

  const mountPanel = () => mount(SettingsPanel, {
    global: {
      plugins: [vuetify, i18n],
      stubs: {
        // Stubbing sub-components to focus on the shell
        GeneralSettings: true,
        ProviderManagement: true,
        ModelManagement: true,
        PromptManagement: true,
        GlobalKeyManagement: true
      }
    }
  });

  it("renders navigation tabs", async () => {
    const wrapper = mountPanel();
    await flushPromises();

    const tabs = wrapper.findAll(".v-tab");
    expect(tabs.length).toBe(5);
    const titles = tabs.map(t => t.text());
    expect(titles).toContain("General");
    expect(titles).toContain("Providers");
    expect(titles).toContain("Models");
  });

  it("switches sections when tabs are clicked", async () => {
    const wrapper = mountPanel();
    await flushPromises();

    const tabs = wrapper.findAll(".v-tab");

    // Initially the "General" tab (index 0) should be selected
    expect(tabs[0].attributes("aria-selected")).toBe("true");

    // Click on Providers tab (tab 1)
    const providerTab = tabs[1];
    await providerTab.trigger("click");
    await flushPromises();

    // After click, Providers tab should be selected
    expect(tabs[1].attributes("aria-selected")).toBe("true");
  });
});
