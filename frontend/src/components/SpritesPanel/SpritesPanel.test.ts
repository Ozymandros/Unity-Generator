import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import SpritesPanel from "./SpritesPanel.vue";
import * as client from "../../api/client";

vi.mock("../../api/client");

describe("SpritesPanel", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("renders initial state correctly", () => {
        const wrapper = mount(SpritesPanel);
        expect(wrapper.find("h2").text()).toBe("2D Sprites");
        expect(wrapper.find("textarea").element.placeholder).toContain("pixel art sword");
        expect(wrapper.find("button.primary").text()).toBe("Generate Sprite");
    });

    it("requires prompt before generation", async () => {
        const wrapper = mount(SpritesPanel);
        await wrapper.find("button.primary").trigger("click");
        expect(wrapper.text()).toContain("Please enter a prompt.");
    });

    it("calls generateSprites API on valid submission", async () => {
        vi.mocked(client.generateSprites).mockResolvedValue({
            success: true,
            date: new Date().toISOString(),
            error: null,
            data: { image: "fake-base64", resolution: 64, provider: "openai" },
        });

        const wrapper = mount(SpritesPanel);
        await wrapper.find("textarea").setValue("A cool shield");
        
        // Select resolution (64 is default, let's change to 32)
        const buttons = wrapper.findAll(".toggle-group button");
        await buttons[1].trigger("click"); // 32x button
        
        await wrapper.find("button.primary").trigger("click");
        await flushPromises();

        expect(client.generateSprites).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: "A cool shield",
                resolution: 32,
            })
        );
        expect(wrapper.text()).toContain("Sprite generated.");
        expect(wrapper.find("img").exists()).toBe(true);
    });

    it("displays error message on API failure", async () => {
        vi.mocked(client.generateSprites).mockResolvedValue({
            success: false,
            date: new Date().toISOString(),
            error: "Backend error",
            data: null,
        });

        const wrapper = mount(SpritesPanel);
        await wrapper.find("textarea").setValue("Test prompt");
        await wrapper.find("button.primary").trigger("click");
        await flushPromises();

        expect(wrapper.text()).toContain("Backend error");
    });

    it("allows setting palette size and auto-crop", async () => {
         vi.mocked(client.generateSprites).mockResolvedValue({
            success: true,
            date: new Date().toISOString(),
            error: null,
            data: { image: "data" },
        });

        const wrapper = mount(SpritesPanel);
        await wrapper.find("textarea").setValue("Test options");
        
        // Set palette size to 16
        await wrapper.find("select").setValue(16); // paletteSize select is the second select in the field-group? 
        // Wait, template has: 1. Provider select, 2. Palette select.
        const selects = wrapper.findAll("select");
        await selects[1].setValue(16);
        
        // Toggle auto-crop
        await wrapper.find("input[type='checkbox']").setValue(true);
        
        await wrapper.find("button.primary").trigger("click");
        await flushPromises();

        expect(client.generateSprites).toHaveBeenCalledWith(
            expect.objectContaining({
                options: expect.objectContaining({
                    palette_size: 16,
                    auto_crop: true
                })
            })
        );
    });
});
