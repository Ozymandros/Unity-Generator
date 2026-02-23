import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ScenesPanel from "./ScenesPanel.vue"; // Using default export for Vue file
import * as client from "@/api/client";

vi.mock("@/api/client"); // Mock the entire client module

describe("ScenesPanel", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Mock getPref for default prompts
        vi.mocked(client.getPref).mockResolvedValue({
            success: true,
            date: new Date().toISOString(),
            error: null,
            data: { key: "default_code_system_prompt", value: "Mock System Prompt" },
        });
    });

    it("renders input fields", async () => {
        const wrapper = mount(ScenesPanel);
        await flushPromises();

        // SmartField renders inputs/textareas/selects
        expect(wrapper.findAll("textarea").length).toBe(2); // Prompt + System Prompt
        expect(wrapper.findAll("select").length).toBe(3); // Provider + Model + Temperature
        expect(wrapper.find('input[type="password"]').exists()).toBe(true); // API Key
        expect(wrapper.find("button.primary").text()).toBe("Generate Scene");
    });

  it("calls createScene API with correct parameters including provider and options", async () => {
    vi.mocked(client.createScene).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { 
          content: "Scene details", 
          files: ["Scene.unity"], 
          metadata: { steps: ["Step 1"] } 
      },
    });

    const wrapper = mount(ScenesPanel);
    await flushPromises();

    // Set prompt (first textarea)
    await wrapper.findAll("textarea")[0].setValue("Create a test scene");

    // Set provider (first select)
    await wrapper.findAll("select")[0].setValue("openai");

    // Set model (second select, now enabled)
    await wrapper.findAll("select")[1].setValue("gpt-4o");

    // Set api key
    await wrapper.find('input[type="password"]').setValue("sk-test-key");

    // Click generate
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.createScene).toHaveBeenCalledWith(
        expect.objectContaining({
            prompt: "Create a test scene",
            provider: "openai",
            api_key: "sk-test-key",
            options: expect.objectContaining({
                model: "gpt-4o",
                temperature: 0.7
            })
        })
    );
  });
});
