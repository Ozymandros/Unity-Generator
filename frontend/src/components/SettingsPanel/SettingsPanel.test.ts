import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { SettingsPanel } from "@/components/SettingsPanel";
import * as client from "@/api/client";
import { createVuetify } from 'vuetify';

const vuetify = createVuetify();

vi.mock("../../api/client");
vi.mock("@tauri-apps/api/shell", () => ({
  open: vi.fn(),
}));

describe("SettingsPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'backendUrl') return "http://127.0.0.1:8000";
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
      plugins: [vuetify],
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

    // Initially should show General (tab 0)
    expect((wrapper.vm as any).activeTab).toBe(0);

    // Click on Providers tab (tab 1)
    const providerTab = wrapper.findAll(".v-tab")[1];
    await providerTab.trigger("click");
    
    expect((wrapper.vm as any).activeTab).toBe(1);
  });
});
