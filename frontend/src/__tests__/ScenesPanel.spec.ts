
import ScenesPanel from "../components/ScenesPanel.vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia, setActivePinia } from "pinia";
import * as client from "@/api/client";
import { expect, it, beforeEach } from "vitest";

vi.mock("@/api/client"); // Mock the entire client module


let vuetify: ReturnType<typeof createVuetify>;
beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
    vuetify = createVuetify();
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
        vi.spyOn(client, "createScene").mockResolvedValue({
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
            options: expect.objectContaining({
                temperature: 0.7
            })
            })
        );
    });
// ...existing code...
