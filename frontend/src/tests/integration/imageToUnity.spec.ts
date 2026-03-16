import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import ImagePanel from "@/components/ImagePanel/ImagePanel.vue";
import ScenesPanel from "@/components/ScenesPanel.vue";
import { useMediaImport } from "@/composables/useMediaImport";
import * as client from "@/api/client";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import i18n from "@/i18n";

/**
 * Integration test suite for Image-to-Unity workflow.
 * 
 * Tests the complete end-to-end workflow:
 * 1. User generates an image in ImagePanel
 * 2. User clicks "Save to Unity Project" button
 * 3. Navigation to ScenesPanel with media data
 * 4. ScenesPanel receives and displays media import info
 * 5. User submits prompt with media data included
 * 6. Media data is cleared after successful import
 * 
 * **Validates Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11**
 * 
 * **Property 6: Media Navigation Preserves Data**
 * **Property 7: Media Navigation Pre-fills Prompt**
 * **Property 8: Query Parameters Populate Component State**
 * **Property 9: Pending Media Import Included in Request**
 * **Property 10: Successful Import Clears Pending State**
 */

// Mock API client
vi.mock("@/api/client");

// Mock useApp for tab navigation
const mockSetActive = vi.fn();
vi.mock("@/App", () => ({
  useApp: () => ({
    setActive: mockSetActive
  })
}));

// Mock session project
vi.mock("@/composables/useSessionProject", () => ({
  useSessionProject: () => ({
    projectName: { value: "TestProject" }
  })
}));

// Mock project store
vi.mock("@/store/projectStore", () => ({
  projectStore: {
    activeProjectName: "TestProject"
  }
}));

describe("Image-to-Unity Integration Workflow", () => {
  let vuetify: ReturnType<typeof createVuetify>;

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    vuetify = createVuetify();

    // Clear media import state
    const { clearPendingMediaImport } = useMediaImport();
    clearPendingMediaImport();

    // Mock API preferences
    vi.spyOn(client, "getPref").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { key: "test", value: null },
    });

    // Setup intelligence store with mock data
    const store = useIntelligenceStore();
    store.$patch(state => {
      state.providers = [
        {
          name: "openai",
          api_key_name: null,
          base_url: null,
          openai_compatible: false,
          requires_api_key: false,
          supports_vision: false,
          supports_streaming: false,
          supports_function_calling: false,
          supports_tool_use: false,
          modalities: ["text", "image"],
          default_models: {},
          extra: {}
        }
      ];
      state.models = {
        openai: [
          { value: "dall-e-3", label: "DALL-E 3", modality: "image" },
          { value: "gpt-4", label: "GPT-4", modality: "text" }
        ]
      };
      state.preferences = {
        preferred_image_provider: "openai",
        preferred_image_model: "dall-e-3",
        preferred_text_provider: "openai",
        preferred_text_model: "gpt-4"
      };
    });
    store.load = vi.fn().mockResolvedValue(undefined);
  });

  /**
   * Test 1: Complete workflow from image generation to Unity import
   * 
   * Validates the entire user journey:
   * - Generate image in ImagePanel
   * - Configure texture settings
   * - Click "Save to Unity Project"
   * - Navigate to ScenesPanel
   * - Verify media data and prompt are preserved
   * - Submit scene generation with media
   * - Verify media is cleared after success
   */
  it("should complete full workflow: generate image → save to Unity → import in Unity", async () => {
    // ===== STEP 1: Generate image in ImagePanel =====
    const testImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    vi.spyOn(client, "generateImage").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { url: testImageData },
    });

    const imagePanel = mount(ImagePanel, {
      global: {
        plugins: [vuetify, i18n]
      }
    });

    await flushPromises();

    // Set prompt and generate image
    const imagePanelFields = imagePanel.findAllComponents({ name: "SmartField" });
    const promptField = imagePanelFields.find(f => f.props("label") === "Prompt");
    expect(promptField).toBeDefined();
    
    promptField!.vm.$emit("update:modelValue", "A red cube texture");
    await flushPromises();

    const generateBtn = imagePanel.findAll("button").find(b => 
      b.text().toLowerCase().includes("generate")
    );
    expect(generateBtn).toBeDefined();
    
    await generateBtn!.trigger("click");
    await flushPromises();

    // Verify image was generated
    const imagePanelInstance = imagePanel.vm as any;
    expect(imagePanelInstance.generatedImage).toBe(testImageData);

    // ===== STEP 2: Configure texture settings =====
    // Update texture settings directly on the component instance
    imagePanelInstance.textureNameInput = "CubeTexture";
    imagePanelInstance.textureTypeSelect = "Default";
    await flushPromises();

    // ===== STEP 3: Click "Save to Unity Project" =====
    const saveToUnityBtn = imagePanel.findAll("button").find(b => 
      b.text().toLowerCase().includes("save to unity")
    );
    expect(saveToUnityBtn).toBeDefined();
    
    await saveToUnityBtn!.trigger("click");
    await flushPromises();

    // ===== STEP 4: Verify navigation was triggered =====
    expect(mockSetActive).toHaveBeenCalledWith("Scenes");

    // ===== STEP 5: Verify media import state was set =====
    const { pendingMediaImport, pendingPrompt, hasPendingMediaImport } = useMediaImport();
    
    expect(hasPendingMediaImport()).toBe(true);
    expect(pendingMediaImport.value).not.toBeNull();
    expect(pendingMediaImport.value?.data).toBe(testImageData);
    expect(pendingMediaImport.value?.name).toBe("CubeTexture");
    expect(pendingMediaImport.value?.type).toBe("image");
    expect(pendingMediaImport.value?.textureType).toBe("Default");
    expect(pendingPrompt.value).toContain("CubeTexture");
    expect(pendingPrompt.value).toContain("Default");
    expect(pendingPrompt.value).toContain("Unity texture");

    // ===== STEP 6: Mount ScenesPanel and verify it receives media data =====
    vi.spyOn(client, "createScene").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: {
        content: "Scene generated successfully with texture imported",
        files: ["Assets/Textures/CubeTexture.png", "Assets/Scenes/MainScene.unity"]
      }
    });

    const scenesPanel = mount(ScenesPanel, {
      global: {
        plugins: [vuetify, i18n]
      }
    });

    await flushPromises();

    // Verify ScenesPanel received the media import data
    const scenesPanelInstance = scenesPanel.vm as any;
    expect(scenesPanelInstance.pendingMediaImport).not.toBeNull();
    expect(scenesPanelInstance.prompt).toBe(pendingPrompt.value);

    // ===== STEP 7: Verify info banner is displayed =====
    // The banner uses v-alert component, not a simple type attribute
    const infoBanner = scenesPanel.findComponent({ name: 'VAlert' });
    expect(infoBanner.exists()).toBe(true);
    expect(infoBanner.text()).toContain("Ready to import");
    expect(infoBanner.text()).toContain("image");

    // ===== STEP 8: Submit scene generation with media =====
    const sceneGenerateBtn = scenesPanel.findAll("button").find(b => 
      b.text().toLowerCase().includes("create scene")
    );
    expect(sceneGenerateBtn).toBeDefined();
    
    await sceneGenerateBtn!.trigger("click");
    await flushPromises();

    // ===== STEP 9: Verify API was called with media data =====
    expect(client.createScene).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("CubeTexture"),
        media_import: expect.objectContaining({
          data: testImageData,
          name: "CubeTexture",
          type: "image",
          texture_type: "Default"  // Note: API uses snake_case
        })
      })
    );

    // ===== STEP 10: Verify media import was cleared after success =====
    await flushPromises();
    expect(hasPendingMediaImport()).toBe(false);
    expect(pendingMediaImport.value).toBeNull();
  });

  /**
   * Test 2: Verify navigation with query parameters
   * 
   * Tests that media data is correctly passed through the navigation system
   * and that all required parameters are preserved.
   * 
   * **Validates Requirements: 4.5, 4.6, 4.7**
   * **Property 6: Media Navigation Preserves Data**
   */
  it("should preserve all media data during navigation", async () => {
    const testImageData = "data:image/png;base64,testdata123";
    const textureName = "PlayerSprite";
    const textureType = "Sprite";

    // Simulate ImagePanel setting media import
    const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
    
    const unityPrompt = `Import this generated image as a Unity texture named "${textureName}" with ${textureType} texture type, and create a GameObject with SpriteRenderer component displaying it at position (0, 0, 0)`;
    
    setPendingMediaImport(
      {
        data: testImageData,
        name: textureName,
        type: "image",
        textureType: textureType
      },
      unityPrompt
    );

    // Verify all data is preserved
    expect(pendingMediaImport.value).not.toBeNull();
    expect(pendingMediaImport.value?.data).toBe(testImageData);
    expect(pendingMediaImport.value?.name).toBe(textureName);
    expect(pendingMediaImport.value?.type).toBe("image");
    expect(pendingMediaImport.value?.textureType).toBe(textureType);
  });

  /**
   * Test 3: Verify prompt pre-fill with Unity import instructions
   * 
   * Tests that the prompt is correctly pre-filled with instructions
   * that include texture name, type, and Unity-specific commands.
   * 
   * **Validates Requirements: 4.8, 4.9**
   * **Property 7: Media Navigation Pre-fills Prompt**
   */
  it("should pre-fill prompt with Unity import instructions", async () => {
    const testImageData = "data:image/png;base64,testdata";
    const textureName = "GroundTexture";
    const textureType = "Normal";

    const { setPendingMediaImport, pendingPrompt } = useMediaImport();
    
    const unityPrompt = `Import this generated image as a Unity texture named "${textureName}" with ${textureType} texture type, and create a GameObject with SpriteRenderer component displaying it at position (0, 0, 0)`;
    
    setPendingMediaImport(
      {
        data: testImageData,
        name: textureName,
        type: "image",
        textureType: textureType
      },
      unityPrompt
    );

    // Verify prompt contains all required elements
    expect(pendingPrompt.value).toContain(textureName);
    expect(pendingPrompt.value).toContain(textureType);
    expect(pendingPrompt.value).toContain("Unity texture");
    expect(pendingPrompt.value).toContain("GameObject");
    expect(pendingPrompt.value).toContain("SpriteRenderer");
  });

  /**
   * Test 4: Verify ScenesPanel populates state from media import
   * 
   * Tests that ScenesPanel correctly reads and displays media import data
   * when mounted with pending media.
   * 
   * **Validates Requirements: 4.10, 6.2, 6.3**
   * **Property 8: Query Parameters Populate Component State**
   */
  it("should populate ScenesPanel state from media import data", async () => {
    const testImageData = "data:image/png;base64,testdata";
    const textureName = "UITexture";
    const textureType = "UI";

    // Set up media import before mounting ScenesPanel
    const { setPendingMediaImport } = useMediaImport();
    
    const unityPrompt = `Import this generated image as a Unity texture named "${textureName}" with ${textureType} texture type, and create a GameObject with SpriteRenderer component displaying it at position (0, 0, 0)`;
    
    setPendingMediaImport(
      {
        data: testImageData,
        name: textureName,
        type: "image",
        textureType: textureType
      },
      unityPrompt
    );

    // Mount ScenesPanel
    const scenesPanel = mount(ScenesPanel, {
      global: {
        plugins: [vuetify, i18n]
      }
    });

    await flushPromises();

    // Verify component state
    const scenesPanelInstance = scenesPanel.vm as any;
    expect(scenesPanelInstance.prompt).toBe(unityPrompt);
    expect(scenesPanelInstance.pendingMediaImport).not.toBeNull();
    expect(scenesPanelInstance.pendingMediaImport.data).toBe(testImageData);
    expect(scenesPanelInstance.pendingMediaImport.name).toBe(textureName);
    expect(scenesPanelInstance.pendingMediaImport.type).toBe("image");
    expect(scenesPanelInstance.pendingMediaImport.textureType).toBe(textureType);

    // Verify info banner is displayed
    const infoBanner = scenesPanel.findComponent({ name: 'VAlert' });
    expect(infoBanner.exists()).toBe(true);
    expect(infoBanner.text()).toContain("Ready to import");
  });

  /**
   * Test 5: Verify media data is included in scene generation request
   * 
   * Tests that when ScenesPanel submits a scene generation request with
   * pending media, the media data is correctly included in the API payload.
   * 
   * **Validates Requirements: 4.11, 6.5**
   * **Property 9: Pending Media Import Included in Request**
   */
  it("should include media data in scene generation request", async () => {
    const testImageData = "data:image/png;base64,testdata";
    const textureName = "CharacterTexture";
    const textureType = "Sprite";

    // Set up media import
    const { setPendingMediaImport } = useMediaImport();
    
    const unityPrompt = `Import this generated image as a Unity texture named "${textureName}" with ${textureType} texture type, and create a GameObject with SpriteRenderer component displaying it at position (0, 0, 0)`;
    
    setPendingMediaImport(
      {
        data: testImageData,
        name: textureName,
        type: "image",
        textureType: textureType
      },
      unityPrompt
    );

    // Mock successful API response
    vi.spyOn(client, "createScene").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: {
        content: "Scene generated with texture",
        files: ["Assets/Textures/CharacterTexture.png"]
      }
    });

    // Mount ScenesPanel and trigger generation
    const scenesPanel = mount(ScenesPanel, {
      global: {
        plugins: [vuetify, i18n]
      }
    });

    await flushPromises();

    const generateBtn = scenesPanel.findAll("button").find(b => 
      b.text().toLowerCase().includes("create scene")
    );
    
    await generateBtn!.trigger("click");
    await flushPromises();

    // Verify API was called with media_import
    expect(client.createScene).toHaveBeenCalledWith(
      expect.objectContaining({
        media_import: expect.objectContaining({
          data: testImageData,
          name: textureName,
          type: "image",
          texture_type: textureType  // Note: API uses snake_case
        })
      })
    );
  });

  /**
   * Test 6: Verify media import is cleared after successful generation
   * 
   * Tests that pending media import state is cleared after a successful
   * scene generation, preventing duplicate imports.
   * 
   * **Validates Requirements: 6.6**
   * **Property 10: Successful Import Clears Pending State**
   */
  it("should clear pending media import after successful generation", async () => {
    const testImageData = "data:image/png;base64,testdata";
    
    // Set up media import
    const { setPendingMediaImport, hasPendingMediaImport } = useMediaImport();
    
    setPendingMediaImport(
      {
        data: testImageData,
        name: "TestTexture",
        type: "image",
        textureType: "Default"
      },
      "Import this texture"
    );

    expect(hasPendingMediaImport()).toBe(true);

    // Mock successful API response
    vi.spyOn(client, "createScene").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: {
        content: "Scene generated",
        files: []
      }
    });

    // Mount ScenesPanel and trigger generation
    const scenesPanel = mount(ScenesPanel, {
      global: {
        plugins: [vuetify, i18n]
      }
    });

    await flushPromises();

    const generateBtn = scenesPanel.findAll("button").find(b => 
      b.text().toLowerCase().includes("create scene")
    );
    
    await generateBtn!.trigger("click");
    await flushPromises();

    // Verify media import was cleared
    expect(hasPendingMediaImport()).toBe(false);
  });

  /**
   * Test 7: Verify media import is NOT cleared after failed generation
   * 
   * Tests that pending media import state is preserved when scene generation
   * fails, allowing the user to retry without re-importing the media.
   */
  it("should NOT clear pending media import after failed generation", async () => {
    const testImageData = "data:image/png;base64,testdata";
    
    // Set up media import
    const { setPendingMediaImport, hasPendingMediaImport } = useMediaImport();
    
    setPendingMediaImport(
      {
        data: testImageData,
        name: "TestTexture",
        type: "image",
        textureType: "Default"
      },
      "Import this texture"
    );

    expect(hasPendingMediaImport()).toBe(true);

    // Mock failed API response
    vi.spyOn(client, "createScene").mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Scene generation failed",
      data: null
    });

    // Mount ScenesPanel and trigger generation
    const scenesPanel = mount(ScenesPanel, {
      global: {
        plugins: [vuetify, i18n]
      }
    });

    await flushPromises();

    const generateBtn = scenesPanel.findAll("button").find(b => 
      b.text().toLowerCase().includes("create scene")
    );
    
    await generateBtn!.trigger("click");
    await flushPromises();

    // Verify media import was NOT cleared (user can retry)
    expect(hasPendingMediaImport()).toBe(true);
  });

  /**
   * Test 8: Verify different texture types are preserved
   * 
   * Tests that all texture type options (Default, Sprite, Normal, UI)
   * are correctly preserved through the workflow.
   */
  it("should preserve different texture types through workflow", async () => {
    const textureTypes = ["Default", "Sprite", "Normal", "UI"];

    for (const textureType of textureTypes) {
      const { setPendingMediaImport, pendingMediaImport, clearPendingMediaImport } = useMediaImport();
      
      clearPendingMediaImport();

      setPendingMediaImport(
        {
          data: "data:image/png;base64,test",
          name: `${textureType}Texture`,
          type: "image",
          textureType: textureType
        },
        `Import as ${textureType}`
      );

      expect(pendingMediaImport.value?.textureType).toBe(textureType);
    }
  });

  /**
   * Test 9: Verify error handling when no image is generated
   * 
   * Tests that attempting to save to Unity without generating an image
   * throws an appropriate error.
   */
  it("should throw error when saving to Unity without generated image", async () => {
    const imagePanel = mount(ImagePanel, {
      global: {
        plugins: [vuetify, i18n]
      }
    });

    await flushPromises();

    const imagePanelInstance = imagePanel.vm as any;
    
    // Verify no image is generated
    expect(imagePanelInstance.generatedImage).toBeNull();

    // Attempt to save to Unity should throw error
    expect(() => {
      imagePanelInstance.saveToUnity();
    }).toThrow("No image available to save to Unity");
  });

  /**
   * Test 10: Verify ScenesPanel works normally without pending media
   * 
   * Tests backward compatibility - ScenesPanel should function normally
   * when there is no pending media import.
   */
  it("should work normally in ScenesPanel without pending media import", async () => {
    // Ensure no pending media
    const { clearPendingMediaImport, hasPendingMediaImport } = useMediaImport();
    clearPendingMediaImport();
    expect(hasPendingMediaImport()).toBe(false);

    // Mock successful API response without media
    vi.spyOn(client, "createScene").mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: {
        content: "Scene generated normally",
        files: []
      }
    });

    // Mount ScenesPanel
    const scenesPanel = mount(ScenesPanel, {
      global: {
        plugins: [vuetify, i18n]
      }
    });

    await flushPromises();

    // Verify no info banner is shown
    const infoBanner = scenesPanel.findComponent({ name: 'VAlert' });
    expect(infoBanner.exists()).toBe(false);

    // Set a normal prompt
    const scenesPanelInstance = scenesPanel.vm as any;
    scenesPanelInstance.prompt = "Create a simple scene with a cube";
    await flushPromises();

    // Trigger generation
    const generateBtn = scenesPanel.findAll("button").find(b => 
      b.text().toLowerCase().includes("create scene")
    );
    
    await generateBtn!.trigger("click");
    await flushPromises();

    // Verify API was called WITHOUT media_import
    expect(client.createScene).toHaveBeenCalledWith(
      expect.not.objectContaining({
        media_import: expect.anything()
      })
    );
  });
});

