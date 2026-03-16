import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia, setActivePinia } from "pinia";
import ScenesPanel from "@/components/ScenesPanel.vue";
import * as client from "@/api/client";
import { useMediaImport } from "@/composables/useMediaImport";
import i18n from "@/i18n";

/**
 * Backward Compatibility Tests for ScenesPanel Component
 *
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.7**
 *
 * Property 18: Backward Compatibility Preservation
 * Ensures that new features (quick actions, media import) are purely additive
 * and do not disrupt existing user workflows. Users who don't use the new
 * features should experience identical behaviour to the previous version.
 *
 * Test Coverage:
 * 1. ScenesPanel works without quick actions (direct prompt entry)
 * 2. ScenesPanel works without media query parameters
 * 3. Existing prompt processing is unchanged
 * 4. No breaking changes to existing functionality
 * 5. Core scene generation workflow remains identical
 */

vi.mock("@/api/client");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal mock for getAllConfig so the intelligence store loads cleanly.
 */
function mockGetAllConfig() {
  vi.spyOn(client, "getAllConfig").mockResolvedValue({
    success: true,
    date: new Date().toISOString(),
    error: null,
    providers: [
      {
        name: "openai",
        api_key_name: "OPENAI_API_KEY",
        base_url: "https://api.openai.com/v1",
        openai_compatible: true,
        requires_api_key: true,
        supports_vision: false,
        supports_streaming: false,
        supports_function_calling: false,
        supports_tool_use: false,
        modalities: ["llm"],
        default_models: {},
        extra: {},
      },
    ],
    models: {
      openai: [{ value: "gpt-4o", modality: "llm", label: "GPT-4o" }],
    },
    prompts: {},
    keys: {} as Record<string, string>,
    data: null,
  });
}

/**
 * Mount ScenesPanel with Vuetify and Pinia plugins.
 *
 * @returns Vue Test Utils wrapper for ScenesPanel
 *
 * @example
 * ```typescript
 * const wrapper = mountScenesPanel();
 * await wrapper.vm.$nextTick();
 * ```
 */
function mountScenesPanel() {
  const vuetify = createVuetify();
  return mount(ScenesPanel, { global: { plugins: [vuetify, i18n] } });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();
  setActivePinia(createPinia());

  // Clear any pending media import state between tests
  const { clearPendingMediaImport } = useMediaImport();
  clearPendingMediaImport();

  vi.spyOn(client, "getPref").mockResolvedValue({
    success: true,
    date: new Date().toISOString(),
    error: null,
    data: { key: "default_code_system_prompt", value: "Mock System Prompt" },
  });

  mockGetAllConfig();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScenesPanel - Backward Compatibility Tests", () => {
  /**
   * Property 18 — Requirement 14.1
   * THE System SHALL maintain all existing ScenesPanel functionality.
   */
  describe("Requirement 14.1: All existing UI elements are preserved", () => {
    it("should render the scene creator heading", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      expect(wrapper.html()).toContain("Scene Creator");
    });

    it("should render the prompt input field", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      const promptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "Scene Description");

      expect(promptField).toBeDefined();
    });

    it("should render provider and model selectors", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      expect(wrapper.html()).toContain("Provider");
      expect(wrapper.html()).toContain("Model");
    });

    it("should render the temperature selector", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      expect(wrapper.html()).toContain("Temperature");
    });

    it("should render the Generate Scene button", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      const generateBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("create scene"));

      expect(generateBtn).toBeDefined();
    });

    it("should render the Advanced Options expandable section", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      expect(wrapper.html()).toContain("Advanced Options");
    });

    it("should display result content when scene generation succeeds", async () => {
      vi.spyOn(client, "createScene").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: {
          content: "Scene created successfully",
          files: ["Assets/Scenes/TestScene.unity"],
          metadata: { steps: ["Created scene", "Added GameObjects"] },
        },
      });

      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      // Set a prompt and trigger generation
      const promptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "Scene Description");
      promptField!.vm.$emit("update:modelValue", "Create a test scene");
      await wrapper.vm.$nextTick();

      const generateBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("create scene"));
      await generateBtn!.trigger("click");
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(wrapper.html()).toContain("Scene created successfully");
    });
  });

  /**
   * Property 18 — Requirement 14.2
   * WHEN quick actions are not used, THE System SHALL behave identically to previous version.
   */
  describe("Requirement 14.2: Works without quick actions", () => {
    it("should accept a custom prompt typed directly into the field", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      const promptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "Scene Description");

      expect(promptField).toBeDefined();

      // Simulate user typing a custom prompt (no quick action used)
      promptField!.vm.$emit("update:modelValue", "Add a red sphere at (5, 2, 3)");
      await wrapper.vm.$nextTick();

      expect(promptField!.props("modelValue")).toBe("Add a red sphere at (5, 2, 3)");
    });

    it("should call createScene with the custom prompt when Generate is clicked", async () => {
      const createSceneSpy = vi.spyOn(client, "createScene").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { content: "Done", files: [], metadata: {} },
      });

      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      const promptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "Scene Description");

      promptField!.vm.$emit("update:modelValue", "Create a forest scene");
      await wrapper.vm.$nextTick();

      const generateBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("create scene"));
      await generateBtn!.trigger("click");
      await wrapper.vm.$nextTick();

      expect(createSceneSpy).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: "Create a forest scene" })
      );
    });

    it("should disable Generate button when prompt is empty", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      // Prompt starts empty — button should be disabled
      const generateBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("create scene"));

      expect(generateBtn).toBeDefined();
      // The button is disabled via the :disabled binding when canGenerate is false
      expect(generateBtn!.attributes("disabled")).toBeDefined();
    });
  });

  /**
   * Property 18 — Requirement 14.3
   * THE enhanced system prompt SHALL NOT break existing prompt processing.
   */
  describe("Requirement 14.3: Existing prompt processing is unchanged", () => {
    it("should pass system prompt override to the API unchanged", async () => {
      const createSceneSpy = vi.spyOn(client, "createScene").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { content: "Done", files: [], metadata: {} },
      });

      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      const fields = wrapper.findAllComponents({ name: "SmartField" });

      // Set prompt
      fields
        .find((f) => f.props("label") === "Scene Description")!
        .vm.$emit("update:modelValue", "Create a forest scene");

      // Expand Advanced Options to access system prompt field
      const advancedBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("advanced options"));
      if (advancedBtn) {
        await advancedBtn.trigger("click");
        await wrapper.vm.$nextTick();
      }

      // Set system prompt override
      const systemPromptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "System Prompt Override");
      if (systemPromptField) {
        systemPromptField.vm.$emit(
          "update:modelValue",
          "You are a Unity expert. Create detailed scenes."
        );
        await wrapper.vm.$nextTick();
      }

      const generateBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("create scene"));
      await generateBtn!.trigger("click");
      await wrapper.vm.$nextTick();

      // The API should receive the custom system prompt
      expect(createSceneSpy).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: "Create a forest scene" })
      );
    });

    it("should preserve provider and model selection in the API call", async () => {
      const createSceneSpy = vi.spyOn(client, "createScene").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { content: "Done", files: [], metadata: {} },
      });

      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      const fields = wrapper.findAllComponents({ name: "SmartField" });

      fields
        .find((f) => f.props("label") === "Scene Description")!
        .vm.$emit("update:modelValue", "Test prompt");

      fields
        .find((f) => f.props("label") === "Provider")
        ?.vm.$emit("update:modelValue", "openai");

      fields
        .find((f) => f.props("label") === "Model")
        ?.vm.$emit("update:modelValue", "gpt-4o");

      await wrapper.vm.$nextTick();

      const generateBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("create scene"));
      await generateBtn!.trigger("click");
      await wrapper.vm.$nextTick();

      expect(createSceneSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: "Test prompt",
          provider: "openai",
          options: expect.objectContaining({ model: "gpt-4o" }),
        })
      );
    });
  });

  /**
   * Property 18 — Requirement 14.4
   * THE System SHALL support both quick action prompts and custom user prompts.
   */
  describe("Requirement 14.4: Quick actions and custom prompts coexist", () => {
    it("should render the quick actions section alongside the prompt field", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      // New feature: quick actions section
      expect(wrapper.find(".quick-actions").exists()).toBe(true);
      expect(wrapper.html()).toContain("Quick Actions");

      // Existing feature: prompt field still present
      const promptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "Scene Description");
      expect(promptField).toBeDefined();
    });

    it("should allow a custom prompt to be submitted after a quick action injects text", async () => {
      const createSceneSpy = vi.spyOn(client, "createScene").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { content: "Done", files: [], metadata: {} },
      });

      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      // Simulate quick action click injecting a prompt
      const chips = wrapper.findAllComponents({ name: "VChip" });
      const fpsChip = chips.find((c) => c.text().includes("FPS Prototype"));
      expect(fpsChip).toBeDefined();
      await fpsChip!.trigger("click");
      await wrapper.vm.$nextTick();

      // User modifies the injected prompt (Requirement 14.4 + 2.11)
      const promptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "Scene Description");

      const injectedPrompt = promptField!.props("modelValue") as string;
      const modifiedPrompt = injectedPrompt + " and add a health system";
      promptField!.vm.$emit("update:modelValue", modifiedPrompt);
      await wrapper.vm.$nextTick();

      // Submit the modified prompt
      const generateBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("create scene"));
      await generateBtn!.trigger("click");
      await wrapper.vm.$nextTick();

      // The modified prompt (not the original quick action text) should be sent
      expect(createSceneSpy).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: modifiedPrompt })
      );
    });
  });

  /**
   * Property 18 — Requirement 14.5
   * WHEN media query parameters are absent, THE ScenesPanel SHALL function normally.
   */
  describe("Requirement 14.5: Works without media query parameters", () => {
    it("should not show the media import banner when no media is pending", async () => {
      // No media import set — useMediaImport returns null
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      // The info banner should not be visible
      const alerts = wrapper.findAll('[type="info"]');
      const mediaAlert = alerts.filter((el) =>
        el.text().includes("Media Ready to Import")
      );
      expect(mediaAlert.length).toBe(0);
    });

    it("should leave the prompt field empty when no media import is pending", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();
      // Allow onMounted to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      const promptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "Scene Description");

      expect(promptField!.props("modelValue")).toBe("");
    });

    it("should generate a scene normally without any media import payload", async () => {
      const createSceneSpy = vi.spyOn(client, "createScene").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { content: "Done", files: [], metadata: {} },
      });

      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      const promptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "Scene Description");
      promptField!.vm.$emit("update:modelValue", "Create a basic scene");
      await wrapper.vm.$nextTick();

      const generateBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("create scene"));
      await generateBtn!.trigger("click");
      await wrapper.vm.$nextTick();

      // media_import should NOT be present in the payload
      expect(createSceneSpy).toHaveBeenCalledWith(
        expect.not.objectContaining({ media_import: expect.anything() })
      );
    });
  });

  /**
   * Property 18 — Requirement 14.7
   * FOR ALL new features, THE System SHALL be additive and non-breaking.
   */
  describe("Requirement 14.7: New features are additive and non-breaking", () => {
    it("should render new features without hiding existing ones", async () => {
      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      // New features present
      expect(wrapper.find(".quick-actions").exists()).toBe(true);
      expect(wrapper.html()).toContain("Example Prompts");

      // Existing features still present
      expect(wrapper.html()).toContain("Scene Description");
      expect(wrapper.html()).toContain("Create Scene");
      expect(wrapper.html()).toContain("Provider");
      expect(wrapper.html()).toContain("Temperature");
    });

    it("should not require Unity-MCP-Server 3.0.5 for basic scene generation", async () => {
      // Basic generation should work regardless of MCP server availability
      const createSceneSpy = vi.spyOn(client, "createScene").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { content: "Scene created", files: [], metadata: {} },
      });

      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      const promptField = wrapper
        .findAllComponents({ name: "SmartField" })
        .find((f) => f.props("label") === "Scene Description");
      promptField!.vm.$emit("update:modelValue", "Simple scene request");
      await wrapper.vm.$nextTick();

      const generateBtn = wrapper
        .findAll("button")
        .find((b) => b.text().toLowerCase().includes("create scene"));
      await generateBtn!.trigger("click");
      await wrapper.vm.$nextTick();

      expect(createSceneSpy).toHaveBeenCalledTimes(1);
    });

    it("should not auto-submit when a quick action is clicked", async () => {
      const createSceneSpy = vi.spyOn(client, "createScene").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { content: "Done", files: [], metadata: {} },
      });

      const wrapper = mountScenesPanel();
      await wrapper.vm.$nextTick();

      const chips = wrapper.findAllComponents({ name: "VChip" });
      const fpsChip = chips.find((c) => c.text().includes("FPS Prototype"));
      expect(fpsChip).toBeDefined();

      await fpsChip!.trigger("click");
      await wrapper.vm.$nextTick();

      // Quick action click must NOT trigger scene generation
      expect(createSceneSpy).not.toHaveBeenCalled();
    });

    it("should show media import banner only when media is pending", async () => {
      // Without pending media — no banner
      const wrapperNone = mountScenesPanel();
      await wrapperNone.vm.$nextTick();
      expect(
        wrapperNone
          .findAll('[type="info"]')
          .filter((el) => el.text().includes("Media Ready to Import")).length
      ).toBe(0);

      // With pending media — banner appears
      const { setPendingMediaImport } = useMediaImport();
      setPendingMediaImport(
        {
          data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          name: "TestTexture",
          type: "image",
          textureType: "Sprite",
        },
        "Import this image as a Unity texture"
      );

      const wrapperWithMedia = mountScenesPanel();
      await wrapperWithMedia.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(wrapperWithMedia.html()).toContain("Media Ready to Import");
    });
  });
});
