
import ScenesPanel from "../components/ScenesPanel.vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia, setActivePinia } from "pinia";
import * as client from "@/api/client";
import { expect, it, beforeEach } from "vitest";
import { useMediaImport } from "@/composables/useMediaImport";

vi.mock("@/api/client"); // Mock the entire client module


let vuetify: ReturnType<typeof createVuetify>;
beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
    vuetify = createVuetify();
    
    // Clear media import state before each test
    const { clearPendingMediaImport } = useMediaImport();
    clearPendingMediaImport();
    
    vi.spyOn(client, "getPref").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        data: { key: "default_code_system_prompt", value: "Mock System Prompt" },
    });
    vi.spyOn(client, "getAllConfig").mockResolvedValue({
        success: true,
        date: new Date().toISOString(),
        error: null,
        providers: [{
            name: "openai",
            api_key_name: "OPENAI_API_KEY",
            base_url: "https://api.openai.com/v1",
            openai_compatible: true,
            requires_api_key: true,
            supports_vision: false,
            supports_streaming: false,
            supports_function_calling: false,
            supports_tool_use: false,
            modalities: ["llm", "image"],
            default_models: {},
            extra: {}
        }],
        models: { openai: [
            { value: "gpt-4o", modality: "llm", label: "GPT-4o" },
            { value: "sprite-model", modality: "image", label: "Sprite Model" }
        ] },
        prompts: {},
        keys: {} as Record<string, string>,
        data: null
    });
});

    it("renders input fields", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        expect(wrapper.html()).toContain("Scene Description");
        expect(wrapper.html().toLowerCase()).toContain("generate scene");
        
    });

    it("calls createScene API with correct parameters including provider and options", async () => {
        const createSceneSpy = vi.spyOn(client, "createScene");
        createSceneSpy.mockResolvedValue({
            success: true,
            date: new Date().toISOString(),
            error: null,
            data: { 
                    content: "Scene details", 
                    files: ["Scene.unity"], 
                    metadata: { steps: ["Step 1"] } 
            },
        });

        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();

        // Find SmartField for prompt and set value
        await wrapper.vm.$nextTick();
        const fields = wrapper.findAllComponents({ name: 'SmartField' });
        const setField = (label: string, value: unknown) => {
            const field = fields.find(f => {
                const propLabel = f.props('label');
                return propLabel && propLabel.toLowerCase().replace(/\s+/g, '') === label.toLowerCase().replace(/\s+/g, '');
            });
            if (!field) throw new Error(`SmartField with label ${label} not found`);
            return field.vm.$emit('update:modelValue', value);
        };
        setField('Scene Description', 'Create a test scene');
                setField('Provider', 'openai');
                setField('Model', 'gpt-4o');
                // Open Advanced Options panel to reveal API Key field
                const advBtn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('advanced options'));
                if (advBtn) {
                    await advBtn.trigger('click');
                    await wrapper.vm.$nextTick();
                }
                // Re-query SmartFields after panel is open
                const fieldsAfterExpand = wrapper.findAllComponents({ name: 'SmartField' });
                const setFieldAfterExpand = (label: string, value: unknown) => {
                        const field = fieldsAfterExpand.find(f => {
                                const propLabel = f.props('label');
                                return propLabel && propLabel.toLowerCase().replace(/\s+/g, '') === label.toLowerCase().replace(/\s+/g, '');
                        });
                        if (!field) throw new Error(`SmartField with label ${label} not found`);
                        return field.vm.$emit('update:modelValue', value);
                };
                setFieldAfterExpand('API Key (Optional Override)', 'sk-test-key');
                setField('Temperature', 0.7);
        const btn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('generate'));
        if (!btn) throw new Error('Generate button not found');
        await btn.trigger("click");
        await wrapper.vm.$nextTick();

        expect(client.createScene).toHaveBeenCalledWith(
            expect.objectContaining({
            prompt: "Create a test scene",
            provider: "openai",
            api_key: "sk-test-key",
            project_name: expect.any(String), // shared session project name or DEFAULT_PROJECT_NAME; backend always receives it
            options: expect.objectContaining({
                temperature: 0.7
            })
            })
        );
        const callArg = (createSceneSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as { project_name?: string };
        expect(callArg.project_name).toBeDefined();
        expect(typeof callArg.project_name).toBe("string");
        expect(callArg.project_name!.length).toBeGreaterThan(0); // backend always receives a non-empty session/default project name
    });

    it("getRandomExamplePrompt returns a valid example prompt", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Access the component's getRandomExamplePrompt function through the wrapper
        // Since it's used in the template, we can verify the placeholder contains valid text
        const smartField = wrapper.findComponent({ name: 'SmartField' });
        const placeholder = smartField.props('placeholder');
        
        // Verify placeholder is a non-empty string
        expect(placeholder).toBeDefined();
        expect(typeof placeholder).toBe('string');
        expect(placeholder.length).toBeGreaterThan(0);
        
        // Verify it's one of the expected example prompts
        const validExamples = [
            "Create a scene with a red cube, blue sphere, and directional light",
            "Add a material with metallic blue color and high smoothness",
            "Create a prefab from the player GameObject with Rigidbody and Collider",
            "Setup Input System with WASD movement and space jump actions",
            "Create an animator with idle, walk, run states and speed-based transitions",
            "Create a UI canvas with health bar slider, score text, and game over panel"
        ];
        expect(validExamples).toContain(placeholder);
    });

    /**
     * Property 3: Quick Action Prompt Injection
     * Validates: Requirements 2.8, 2.9
     * 
     * For any quick action in the quick actions list, clicking that action should inject 
     * its associated prompt text into the prompt input field without triggering form submission.
     */
    it("should inject prompt when quick action is clicked", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Find all quick action chips
        const chips = wrapper.findAllComponents({ name: 'VChip' });
        
        // Verify we have quick action chips
        expect(chips.length).toBeGreaterThan(0);
        
        // Click the first quick action (FPS Prototype)
        const fpsChip = chips.find(chip => chip.text().includes('FPS Prototype'));
        expect(fpsChip).toBeDefined();
        
        await fpsChip!.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Verify the prompt field contains the FPS prototype prompt
        const promptField = wrapper.findAllComponents({ name: 'SmartField' })
            .find(f => f.props('label') === 'Scene Description');
        
        expect(promptField).toBeDefined();
        expect(promptField!.props('modelValue')).toContain('FPS prototype');
        expect(promptField!.props('modelValue')).toContain('first-person player controller');
    });

    /**
     * Property 3: Quick Action Prompt Injection (All Actions)
     * Validates: Requirements 2.8, 2.9
     * 
     * Verifies that all quick actions properly inject their prompts.
     */
    it("should inject correct prompt for each quick action", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        const quickActions = [
            { label: 'FPS Prototype', expectedText: 'FPS prototype' },
            { label: 'Platformer Prototype', expectedText: 'platformer prototype' },
            { label: 'Add UI Canvas', expectedText: 'UI canvas' },
            { label: 'Character Animator', expectedText: 'character animator' },
            { label: 'Intro Cutscene', expectedText: 'timeline cutscene' },
            { label: 'Scene with Objects', expectedText: 'red cube' }
        ];
        
        for (const action of quickActions) {
            // Find the chip by label
            const chips = wrapper.findAllComponents({ name: 'VChip' });
            const chip = chips.find(c => c.text().includes(action.label));
            
            expect(chip).toBeDefined();
            
            // Click the chip
            await chip!.trigger('click');
            await wrapper.vm.$nextTick();
            
            // Verify prompt was injected
            const promptField = wrapper.findAllComponents({ name: 'SmartField' })
                .find(f => f.props('label') === 'Scene Description');
            
            const promptValue = promptField!.props('modelValue') as string;
            expect(promptValue.toLowerCase()).toContain(action.expectedText.toLowerCase());
        }
    });

    /**
     * Property 4: Quick Action Field Focus
     * Validates: Requirements 2.10, 2.11
     * 
     * For any quick action, clicking it should result in the prompt input field 
     * receiving focus and being editable.
     * 
     * Note: Focus testing in JSDOM is limited. We verify that the prompt is injected
     * and the field remains editable (not disabled).
     */
    it("should allow prompt editing after quick action click", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Find and click a quick action
        const chips = wrapper.findAllComponents({ name: 'VChip' });
        const fpsChip = chips.find(chip => chip.text().includes('FPS Prototype'));
        
        await fpsChip!.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Verify the prompt field is not disabled and can be edited
        const promptField = wrapper.findAllComponents({ name: 'SmartField' })
            .find(f => f.props('label') === 'Scene Description');
        
        expect(promptField).toBeDefined();
        expect(promptField!.props('disabled')).toBeFalsy();
        
        // Verify we can modify the prompt after injection
        const originalPrompt = promptField!.props('modelValue') as string;
        const modifiedPrompt = originalPrompt + ' with extra features';
        
        promptField!.vm.$emit('update:modelValue', modifiedPrompt);
        await wrapper.vm.$nextTick();
        
        // Verify the modification was accepted
        expect(promptField!.props('modelValue')).toBe(modifiedPrompt);
    });

    /**
     * Property 4: Quick Action Does NOT Trigger Form Submission
     * Validates: Requirements 2.9, 2.11
     * 
     * Clicking a quick action should NOT automatically submit the form.
     * Users must explicitly click the "Generate Scene" button.
     */
    it("should not auto-submit when quick action is clicked", async () => {
        const createSceneSpy = vi.spyOn(client, "createScene");
        createSceneSpy.mockResolvedValue({
            success: true,
            date: new Date().toISOString(),
            error: null,
            data: { content: "Scene details", files: [], metadata: {} },
        });
        
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Click a quick action
        const chips = wrapper.findAllComponents({ name: 'VChip' });
        const fpsChip = chips.find(chip => chip.text().includes('FPS Prototype'));
        
        await fpsChip!.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Verify createScene was NOT called
        expect(createSceneSpy).not.toHaveBeenCalled();
        
        // Verify the generate button still exists and is clickable
        const generateBtn = wrapper.findAll('button')
            .find(b => b.text().toLowerCase().includes('generate'));
        expect(generateBtn).toBeDefined();
        expect(generateBtn!.attributes('disabled')).toBeUndefined();
    });

    /**
     * Property 5: Example Prompt Injection
     * Validates: Requirements 3.7
     * 
     * For any example prompt in the example prompts list, clicking that example 
     * should inject its text into the prompt input field.
     */
    it("should inject text when example prompt is clicked", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Find the expansion panel title button and click it to expand
        const expansionPanelTitle = wrapper.find('[title="Example Prompts"]');
        if (!expansionPanelTitle.exists()) {
            // Try alternative selector
            const buttons = wrapper.findAll('button');
            const exampleButton = buttons.find(b => b.text().includes('Example Prompts'));
            expect(exampleButton).toBeDefined();
            await exampleButton!.trigger('click');
        } else {
            await expansionPanelTitle.trigger('click');
        }
        
        await wrapper.vm.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for animation
        
        // Find example prompt list items after expansion
        const listItems = wrapper.findAllComponents({ name: 'VListItem' });
        
        // Click the first example prompt
        const firstExample = listItems.find(item => 
            item.text().includes('Create a scene with a red cube')
        );
        
        expect(firstExample).toBeDefined();
        
        await firstExample!.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Verify the prompt was injected
        const promptField = wrapper.findAllComponents({ name: 'SmartField' })
            .find(f => f.props('label') === 'Scene Description');
        
        expect(promptField!.props('modelValue')).toBe(
            'Create a scene with a red cube, blue sphere, and directional light'
        );
    });

    /**
     * Property 5: Example Prompt Injection (All Examples)
     * Validates: Requirements 3.7
     * 
     * Verifies that all example prompts can be clicked and injected.
     */
    it("should inject correct text for each example prompt", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Find and expand the Example Prompts panel
        const buttons = wrapper.findAll('button');
        const exampleButton = buttons.find(b => b.text().includes('Example Prompts'));
        expect(exampleButton).toBeDefined();
        
        await exampleButton!.trigger('click');
        await wrapper.vm.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for animation
        
        const expectedExamples = [
            "Create a scene with a red cube, blue sphere, and directional light",
            "Add a material with metallic blue color and high smoothness",
            "Create a prefab from the player GameObject with Rigidbody and Collider",
            "Setup Input System with WASD movement and space jump actions",
            "Create an animator with idle, walk, run states and speed-based transitions",
            "Create a UI canvas with health bar slider, score text, and game over panel"
        ];
        
        // Find all list items after expansion
        const listItems = wrapper.findAllComponents({ name: 'VListItem' });
        
        // Verify we have the expected number of examples
        expect(listItems.length).toBeGreaterThanOrEqual(expectedExamples.length);
        
        // Test each example
        for (const expectedText of expectedExamples) {
            const exampleItem = listItems.find(item => item.text().includes(expectedText));
            expect(exampleItem).toBeDefined();
            
            await exampleItem!.trigger('click');
            await wrapper.vm.$nextTick();
            
            const promptField = wrapper.findAllComponents({ name: 'SmartField' })
                .find(f => f.props('label') === 'Scene Description');
            
            expect(promptField!.props('modelValue')).toBe(expectedText);
        }
    });

    /**
     * Input Validation: Quick Action Error Handling
     * Validates: Requirements 10.1, 7.6
     * 
     * Verifies that handleQuickActionClick throws appropriate errors for invalid inputs.
     * 
     * Note: This test verifies the function behavior directly since the UI should never
     * pass invalid actions, but the function must still validate inputs defensively.
     */
    it("should throw error for invalid quick action", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Access the component instance to test the function directly
        const component = wrapper.vm as unknown as { 
            handleQuickActionClick: (action: unknown) => void 
        };
        
        // Test with null action
        expect(() => {
            component.handleQuickActionClick(null);
        }).toThrow('Invalid quick action: action and action.prompt are required');
        
        // Test with action missing prompt
        expect(() => {
            component.handleQuickActionClick({ label: 'Test', icon: 'mdi-test', category: 'test' });
        }).toThrow('Invalid quick action: action and action.prompt are required');
    });

    /**
     * UI Rendering: Quick Actions Section
     * Validates: Requirements 2.1
     * 
     * Verifies that the quick actions section is rendered with all expected buttons.
     */
    it("should render quick actions section with all buttons", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Verify quick actions section exists
        expect(wrapper.html()).toContain('Quick Actions');
        
        // Verify all 6 quick action buttons are rendered
        const expectedLabels = [
            'FPS Prototype',
            'Platformer Prototype',
            'Add UI Canvas',
            'Character Animator',
            'Intro Cutscene',
            'Scene with Objects'
        ];
        
        const chips = wrapper.findAllComponents({ name: 'VChip' });
        
        for (const label of expectedLabels) {
            const chip = chips.find(c => c.text().includes(label));
            expect(chip).toBeDefined();
        }
    });

    /**
     * UI Rendering: Example Prompts Section
     * Validates: Requirements 3.1, 3.8
     * 
     * Verifies that the example prompts section is rendered and expandable.
     */
    it("should render example prompts section", async () => {
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Verify example prompts section exists
        expect(wrapper.html()).toContain('Example Prompts');
        
        // Find the expansion panel button
        const buttons = wrapper.findAll('button');
        const exampleButton = buttons.find(b => b.text().includes('Example Prompts'));
        
        expect(exampleButton).toBeDefined();
        
        // Expand the panel
        await exampleButton!.trigger('click');
        await wrapper.vm.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for animation
        
        // Verify at least 6 example prompts are displayed
        const listItems = wrapper.findAllComponents({ name: 'VListItem' });
        expect(listItems.length).toBeGreaterThanOrEqual(6);
    });

    /**
     * Analytics: Quick Action Usage Logging
     * Validates: Requirements 11.1
     * 
     * Verifies that quick action clicks are logged for analytics.
     */
    it("should log analytics event when quick action is clicked", async () => {
        const consoleSpy = vi.spyOn(console, 'log');
        
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Click a quick action
        const chips = wrapper.findAllComponents({ name: 'VChip' });
        const fpsChip = chips.find(chip => chip.text().includes('FPS Prototype'));
        
        await fpsChip!.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Verify analytics event was logged
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Quick action used: FPS Prototype (prototype)')
        );
        
        (consoleSpy as unknown as { mockRestore: () => void }).mockRestore();
    });

    /**
     * Property 6: Media Navigation Preserves Data
     * Validates: Requirements 4.5, 4.6, 4.7, 5.5, 5.6, 5.7, 6.7
     * 
     * For any media data (image or audio), navigating from ImagePanel or AudioPanel 
     * to ScenesPanel should preserve the media data, media name, media type, and 
     * format-specific properties.
     * 
     * Note: This test uses the useMediaImport composable directly since navigation
     * is handled by the tab system rather than vue-router in this application.
     */
    it("should preserve image data when navigating from ImagePanel", async () => {
        // Arrange: Set up media import data
        const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
        
        const imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const imageName = "TestTexture";
        const prompt = "Import this generated image as a Unity texture named 'TestTexture'";
        
        setPendingMediaImport(
            {
                data: imageData,
                name: imageName,
                type: "image",
                textureType: "Sprite"
            },
            prompt
        );
        
        // Act: Mount ScenesPanel (simulates navigation)
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Assert: Verify media data is preserved
        expect(pendingMediaImport.value).toBeDefined();
        expect(pendingMediaImport.value?.data).toBe(imageData);
        expect(pendingMediaImport.value?.name).toBe(imageName);
        expect(pendingMediaImport.value?.type).toBe("image");
        expect(pendingMediaImport.value?.textureType).toBe("Sprite");
    });

    it("should preserve audio data when navigating from AudioPanel", async () => {
        // Arrange: Set up audio import data
        const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
        
        const audioData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
        const audioName = "BackgroundMusic";
        const prompt = "Import this generated audio as a Unity audio clip named 'BackgroundMusic'";
        
        setPendingMediaImport(
            {
                data: audioData,
                name: audioName,
                type: "audio",
                audioFormat: "WAV"
            },
            prompt
        );
        
        // Act: Mount ScenesPanel
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Assert: Verify audio data is preserved
        expect(pendingMediaImport.value).toBeDefined();
        expect(pendingMediaImport.value?.data).toBe(audioData);
        expect(pendingMediaImport.value?.name).toBe(audioName);
        expect(pendingMediaImport.value?.type).toBe("audio");
        expect(pendingMediaImport.value?.audioFormat).toBe("WAV");
    });

    /**
     * Property 7: Media Navigation Pre-fills Prompt
     * Validates: Requirements 4.8, 4.9, 5.8, 5.9
     * 
     * For any media import navigation, the ScenesPanel prompt field should be 
     * pre-filled with Unity import instructions that include the media name and 
     * appropriate tool usage.
     */
    it("should pre-fill prompt with image import instructions", async () => {
        // Arrange: Set up image import with prompt
        const { setPendingMediaImport } = useMediaImport();
        
        const imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const imageName = "PlayerSprite";
        const importPrompt = "Import this generated image as a Unity texture named 'PlayerSprite' with Sprite texture type";
        
        setPendingMediaImport(
            {
                data: imageData,
                name: imageName,
                type: "image",
                textureType: "Sprite"
            },
            importPrompt
        );
        
        // Act: Mount ScenesPanel
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        // Wait for onMounted to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Assert: Verify prompt is pre-filled
        const promptField = wrapper.findAllComponents({ name: 'SmartField' })
            .find(f => f.props('label') === 'Scene Description');
        
        expect(promptField).toBeDefined();
        expect(promptField!.props('modelValue')).toBe(importPrompt);
        expect(promptField!.props('modelValue')).toContain('PlayerSprite');
        expect(promptField!.props('modelValue')).toContain('Unity texture');
    });

    it("should pre-fill prompt with audio import instructions", async () => {
        // Arrange: Set up audio import with prompt
        const { setPendingMediaImport } = useMediaImport();
        
        const audioData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
        const audioName = "ExplosionSound";
        const importPrompt = "Import this generated audio as a Unity audio clip named 'ExplosionSound' in WAV format";
        
        setPendingMediaImport(
            {
                data: audioData,
                name: audioName,
                type: "audio",
                audioFormat: "WAV"
            },
            importPrompt
        );
        
        // Act: Mount ScenesPanel
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        // Wait for onMounted to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Assert: Verify prompt is pre-filled
        const promptField = wrapper.findAllComponents({ name: 'SmartField' })
            .find(f => f.props('label') === 'Scene Description');
        
        expect(promptField).toBeDefined();
        expect(promptField!.props('modelValue')).toBe(importPrompt);
        expect(promptField!.props('modelValue')).toContain('ExplosionSound');
        expect(promptField!.props('modelValue')).toContain('audio clip');
    });

    /**
     * Property 8: Query Parameters Populate Component State
     * Validates: Requirements 6.2, 6.3, 6.4
     * 
     * For any navigation to ScenesPanel with media query parameters, the component 
     * should populate the prompt field and store media data in pendingMediaImport state.
     */
    it("should populate component state from media import data", async () => {
        // Arrange: Set up media import
        const { setPendingMediaImport, pendingMediaImport, hasPendingMediaImport } = useMediaImport();
        
        const mediaData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const mediaName = "TestImage";
        const prompt = "Import test image";
        
        setPendingMediaImport(
            {
                data: mediaData,
                name: mediaName,
                type: "image",
                textureType: "Default"
            },
            prompt
        );
        
        // Act: Mount ScenesPanel
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        // Wait for onMounted to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Assert: Verify component state is populated
        expect(hasPendingMediaImport()).toBe(true);
        expect(pendingMediaImport.value).toBeDefined();
        expect(pendingMediaImport.value?.data).toBe(mediaData);
        expect(pendingMediaImport.value?.name).toBe(mediaName);
        expect(pendingMediaImport.value?.type).toBe("image");
        
        // Verify prompt field is populated
        const promptField = wrapper.findAllComponents({ name: 'SmartField' })
            .find(f => f.props('label') === 'Scene Description');
        expect(promptField!.props('modelValue')).toBe(prompt);
    });

    it("should display info banner when media import is pending", async () => {
        // Arrange: Set up media import
        const { setPendingMediaImport, clearPendingMediaImport } = useMediaImport();
        
        clearPendingMediaImport();
        
        setPendingMediaImport(
            {
                data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                name: "TestTexture",
                type: "image",
                textureType: "Sprite"
            },
            "Import test texture"
        );
        
        // Act: Mount ScenesPanel
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Assert: Verify info banner is displayed
        const alert = wrapper.findComponent({ name: 'VAlert' });
        expect(alert.exists()).toBe(true);
        expect(alert.props('type')).toBe('info');
        expect(alert.text()).toContain('Media Ready to Import');
        expect(alert.text()).toContain('TestTexture');
    });

    /**
     * Property 9: Pending Media Import Included in Request
     * Validates: Requirements 4.11, 5.11, 6.5
     * 
     * For any scene generation request where pendingMediaImport state is present, 
     * the request payload should include the media import data.
     */
    it("should include image media data in scene generation request", async () => {
        // Arrange: Set up media import and mock API
        const { setPendingMediaImport } = useMediaImport();
        
        const imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const imageName = "GameTexture";
        
        setPendingMediaImport(
            {
                data: imageData,
                name: imageName,
                type: "image",
                textureType: "Default"
            },
            "Import this texture to Unity"
        );
        
        const createSceneSpy = vi.spyOn(client, "createScene");
        createSceneSpy.mockResolvedValue({
            success: true,
            date: new Date().toISOString(),
            error: null,
            data: { content: "Scene created", files: [], metadata: {} },
        });
        
        // Act: Mount and trigger scene generation
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        // Wait for onMounted to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const generateBtn = wrapper.findAll('button')
            .find(b => b.text().toLowerCase().includes('generate'));
        
        expect(generateBtn).toBeDefined();
        await generateBtn!.trigger('click');
        await wrapper.vm.$nextTick();
        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Assert: Verify media_import is included in request payload
        expect(createSceneSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                media_import: expect.objectContaining({
                    data: imageData,
                    name: imageName,
                    type: "image",
                    texture_type: "Default"
                })
            })
        );
    });

    it("should include audio media data in scene generation request", async () => {
        // Arrange: Set up audio import and mock API
        const { setPendingMediaImport } = useMediaImport();
        
        const audioData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
        const audioName = "GameMusic";
        
        setPendingMediaImport(
            {
                data: audioData,
                name: audioName,
                type: "audio",
                audioFormat: "WAV"
            },
            "Import this audio to Unity"
        );
        
        const createSceneSpy = vi.spyOn(client, "createScene");
        createSceneSpy.mockResolvedValue({
            success: true,
            date: new Date().toISOString(),
            error: null,
            data: { content: "Scene created", files: [], metadata: {} },
        });
        
        // Act: Mount and trigger scene generation
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        // Wait for onMounted to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const generateBtn = wrapper.findAll('button')
            .find(b => b.text().toLowerCase().includes('generate'));
        
        expect(generateBtn).toBeDefined();
        await generateBtn!.trigger('click');
        await wrapper.vm.$nextTick();
        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Assert: Verify media_import is included in request payload
        expect(createSceneSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                media_import: expect.objectContaining({
                    data: audioData,
                    name: audioName,
                    type: "audio",
                    audio_format: "WAV"
                })
            })
        );
    });

    it("should not include media_import when no media is pending", async () => {
        // Arrange: Clear any pending media
        const { clearPendingMediaImport } = useMediaImport();
        clearPendingMediaImport();
        
        const createSceneSpy = vi.spyOn(client, "createScene");
        createSceneSpy.mockResolvedValue({
            success: true,
            date: new Date().toISOString(),
            error: null,
            data: { content: "Scene created", files: [], metadata: {} },
        });
        
        // Act: Mount and trigger scene generation
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        // Set prompt manually
        const promptField = wrapper.findAllComponents({ name: 'SmartField' })
            .find(f => f.props('label') === 'Scene Description');
        promptField!.vm.$emit('update:modelValue', 'Create a simple scene');
        await wrapper.vm.$nextTick();
        
        const generateBtn = wrapper.findAll('button')
            .find(b => b.text().toLowerCase().includes('generate'));
        
        await generateBtn!.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Assert: Verify media_import is NOT included in request payload
        const callArgs = (createSceneSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as Record<string, unknown>;
        expect(callArgs.media_import).toBeUndefined();
    });

    /**
     * Property 10: Successful Import Clears Pending State
     * Validates: Requirements 6.6
     * 
     * For any successful scene generation with media import, the pendingMediaImport 
     * state should be cleared after completion.
     */
    it("should clear pending media import after successful generation", async () => {
        // Arrange: Set up media import and mock successful API response
        const { setPendingMediaImport, hasPendingMediaImport } = useMediaImport();
        
        setPendingMediaImport(
            {
                data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                name: "TestTexture",
                type: "image",
                textureType: "Sprite"
            },
            "Import test texture"
        );
        
        // Verify media is pending before generation
        expect(hasPendingMediaImport()).toBe(true);
        
        const createSceneSpy = vi.spyOn(client, "createScene");
        createSceneSpy.mockResolvedValue({
            success: true,
            date: new Date().toISOString(),
            error: null,
            data: { content: "Scene created with texture", files: ["TestTexture.png"], metadata: {} },
        });
        
        // Act: Mount and trigger scene generation
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        // Wait for onMounted to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const generateBtn = wrapper.findAll('button')
            .find(b => b.text().toLowerCase().includes('generate'));
        
        expect(generateBtn).toBeDefined();
        await generateBtn!.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Wait for async operation to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Assert: Verify pending media import is cleared
        expect(hasPendingMediaImport()).toBe(false);
    });

    it("should NOT clear pending media import after failed generation", async () => {
        // Arrange: Set up media import and mock failed API response
        const { setPendingMediaImport, clearPendingMediaImport, hasPendingMediaImport } = useMediaImport();
        
        clearPendingMediaImport();
        
        setPendingMediaImport(
            {
                data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                name: "TestTexture",
                type: "image",
                textureType: "Sprite"
            },
            "Import test texture"
        );
        
        // Verify media is pending before generation
        expect(hasPendingMediaImport()).toBe(true);
        
        const createSceneSpy = vi.spyOn(client, "createScene");
        createSceneSpy.mockResolvedValue({
            success: false,
            date: new Date().toISOString(),
            error: "Failed to create scene",
            data: null,
        });
        
        // Act: Mount and trigger scene generation
        const wrapper = mount(ScenesPanel, { global: { plugins: [vuetify] } });
        await wrapper.vm.$nextTick();
        
        const generateBtn = wrapper.findAll('button')
            .find(b => b.text().toLowerCase().includes('generate'));
        
        await generateBtn!.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Wait for async operation to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Assert: Verify pending media import is NOT cleared (user can retry)
        expect(hasPendingMediaImport()).toBe(true);
    });

    /**
     * Media Data Validation Tests
     * Validates: Requirements 13.1, 13.2, 13.5
     * 
     * Tests that media data is validated for base64 encoding, file names, and size limits.
     */
    it("should reject invalid base64 encoding", async () => {
        // Arrange
        const { setPendingMediaImport } = useMediaImport();
        
        // Act & Assert: Attempt to set invalid base64 data
        expect(() => {
            setPendingMediaImport(
                {
                    data: "not-valid-base64-data",
                    name: "TestTexture",
                    type: "image",
                    textureType: "Sprite"
                },
                "Import test texture"
            );
        }).toThrow(/Media validation failed/);
    });

    it("should reject file names with path traversal characters", async () => {
        // Arrange
        const { setPendingMediaImport } = useMediaImport();
        
        const validImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        
        // Act & Assert: Test various dangerous file names
        const dangerousNames = [
            "../../../etc/passwd",
            "folder/file.png",
            "C:\\Windows\\file.png",
            "..\\..\\file.png"
        ];
        
        for (const dangerousName of dangerousNames) {
            expect(() => {
                setPendingMediaImport(
                    {
                        data: validImageData,
                        name: dangerousName,
                        type: "image",
                        textureType: "Sprite"
                    },
                    "Import test texture"
                );
            }).toThrow(/Media validation failed/);
        }
    });

    it("should accept safe file names", async () => {
        // Arrange
        const { setPendingMediaImport, clearPendingMediaImport } = useMediaImport();
        
        clearPendingMediaImport();
        
        const validImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        
        // Act & Assert: Test various safe file names
        const safeNames = [
            "texture.png",
            "MyTexture_01",
            "player-sprite",
            "Background123"
        ];
        
        for (const safeName of safeNames) {
            clearPendingMediaImport();
            
            expect(() => {
                setPendingMediaImport(
                    {
                        data: validImageData,
                        name: safeName,
                        type: "image",
                        textureType: "Sprite"
                    },
                    "Import test texture"
                );
            }).not.toThrow();
        }
    });

    it("should reject mismatched media types", async () => {
        // Arrange
        const { setPendingMediaImport } = useMediaImport();
        
        const imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        
        // Act & Assert: Try to import image data as audio
        expect(() => {
            setPendingMediaImport(
                {
                    data: imageData,
                    name: "TestAudio",
                    type: "audio", // Mismatch: data is image but type is audio
                    audioFormat: "WAV"
                },
                "Import test audio"
            );
        }).toThrow(/Media validation failed/);
    });

    it("should validate media type matches data format", async () => {
        // Arrange
        const { setPendingMediaImport, clearPendingMediaImport } = useMediaImport();
        
        clearPendingMediaImport();
        
        const imageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const audioData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
        
        // Act & Assert: Valid image import
        expect(() => {
            setPendingMediaImport(
                {
                    data: imageData,
                    name: "TestImage",
                    type: "image",
                    textureType: "Sprite"
                },
                "Import test image"
            );
        }).not.toThrow();
        
        clearPendingMediaImport();
        
        // Valid audio import
        expect(() => {
            setPendingMediaImport(
                {
                    data: audioData,
                    name: "TestAudio",
                    type: "audio",
                    audioFormat: "WAV"
                },
                "Import test audio"
            );
        }).not.toThrow();
    });
// ...existing code...

