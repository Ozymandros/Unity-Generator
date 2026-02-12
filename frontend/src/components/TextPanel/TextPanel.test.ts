import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import TextPanel from "./TextPanel.vue";
import * as client from "../../api/client";

vi.mock("../../api/client");

describe("TextPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders form fields", () => {
    const wrapper = mount(TextPanel);
    expect(wrapper.find("textarea").exists()).toBe(true);
    expect(wrapper.findAll("select").length).toBeGreaterThan(0);
    expect(wrapper.find("button.primary").text()).toBe("Generate");
  });

  it("calls generateText API on button click", async () => {
    vi.mocked(client.generateText).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "Generated text content" },
    });

    const wrapper = mount(TextPanel);
    await wrapper.find("textarea").setValue("Write a greeting");
    
    // Select provider (index 0)
    const providerSelect = wrapper.findAll("select")[0];
    await providerSelect.setValue("openai");
    
    // Select model (index 1) - dependent on provider
    const modelSelect = wrapper.findAll("select")[1];
    await modelSelect.setValue("gpt-4o-mini");

    // Select Temperature (index 2)
    const tempSelect = wrapper.findAll("select")[2];
    await tempSelect.setValue(1.0); // Creative

    // Select Length (index 3)
    const lengthSelect = wrapper.findAll("select")[3];
    await lengthSelect.setValue(1024); // Short

    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.generateText).toHaveBeenCalledWith(
      expect.objectContaining({ 
          prompt: "Write a greeting",
          provider: "openai",
          options: expect.objectContaining({ 
            model: "gpt-4o-mini",
            temperature: 1.0,
            max_tokens: 1024
          })
      })
    );
  });

  it("displays result on success", async () => {
    vi.mocked(client.generateText).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "Hello, adventurer!" },
    });

    const wrapper = mount(TextPanel);
    await wrapper.find("textarea").setValue("Greeting");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    const resultTextarea = wrapper.findAll("textarea")[1];
    expect((resultTextarea.element as HTMLTextAreaElement).value).toContain(
      "Hello, adventurer!"
    );
  });

  it("shows error status on failure", async () => {
    vi.mocked(client.generateText).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Service unavailable",
      data: null,
    });

    const wrapper = mount(TextPanel);
    await wrapper.find("textarea").setValue("Test");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Service unavailable");
  });
});
