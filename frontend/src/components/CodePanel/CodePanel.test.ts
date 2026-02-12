import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { CodePanel } from "@/components/CodePanel";
import * as client from "@/api/client";

vi.mock("../../api/client");

describe("CodePanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders form fields", () => {
    const wrapper = mount(CodePanel);
    expect(wrapper.find("textarea").exists()).toBe(true);
    expect(wrapper.findAll("select").length).toBeGreaterThanOrEqual(2);
    expect(wrapper.find("button.primary").text()).toBe("Generate");
  });

  it("calls generateCode API on button click", async () => {
    vi.mocked(client.generateCode).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "public class Test {}" },
    });

    const wrapper = mount(CodePanel);
    await wrapper.find("textarea").setValue("Create a test class");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.generateCode).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Create a test class" })
    );
  });

  it("displays result on success", async () => {
    vi.mocked(client.generateCode).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { content: "class PlayerController {}" },
    });

    const wrapper = mount(CodePanel);
    await wrapper.find("textarea").setValue("Create player controller");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    const resultTextarea = wrapper.findAll("textarea")[1];
    expect((resultTextarea.element as HTMLTextAreaElement).value).toContain(
      "PlayerController"
    );
  });

  it("shows error status on failure", async () => {
    vi.mocked(client.generateCode).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "API rate limited",
      data: null,
    });

    const wrapper = mount(CodePanel);
    await wrapper.find("textarea").setValue("Test prompt");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("API rate limited");
  });
});
