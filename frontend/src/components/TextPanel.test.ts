import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import TextPanel from "./TextPanel.vue";
import * as client from "../api/client";

vi.mock("../api/client");

describe("TextPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders form fields", () => {
    const wrapper = mount(TextPanel);
    expect(wrapper.find("textarea").exists()).toBe(true);
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
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.generateText).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Write a greeting" })
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
