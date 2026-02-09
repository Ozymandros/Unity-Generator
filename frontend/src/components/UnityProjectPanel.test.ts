import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import UnityProjectPanel from "./UnityProjectPanel.vue";
import * as client from "../api/client";

vi.mock("../api/client");

describe("UnityProjectPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders form fields", () => {
    const wrapper = mount(UnityProjectPanel);
    expect(wrapper.find('input[type="text"]').exists() || wrapper.find("input").exists()).toBe(true);
    expect(wrapper.findAll("textarea").length).toBeGreaterThan(0);
    expect(wrapper.find("button.primary").text()).toBe("Generate Project");
  });

  it("calls generateUnityProject API on button click", async () => {
    vi.mocked(client.generateUnityProject).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { project_path: "C:/output/TestProject" },
    });

    const wrapper = mount(UnityProjectPanel);
    const textareas = wrapper.findAll("textarea");
    await textareas[0].setValue("Create player controller");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.generateUnityProject).toHaveBeenCalledWith(
      expect.objectContaining({
        project_name: "UnityProject",
        code_prompt: "Create player controller",
      })
    );
  });

  it("displays result on success", async () => {
    vi.mocked(client.generateUnityProject).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { project_path: "C:/output/MyUnityProject" },
    });

    const wrapper = mount(UnityProjectPanel);
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    // Result is displayed in a readonly textarea (last textarea in the component)
    const textareas = wrapper.findAll("textarea");
    const resultTextarea = textareas[textareas.length - 1];
    expect((resultTextarea.element as HTMLTextAreaElement).value).toContain(
      "MyUnityProject"
    );
  });

  it("shows error status on failure", async () => {
    vi.mocked(client.generateUnityProject).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Project generation failed",
      data: null,
    });

    const wrapper = mount(UnityProjectPanel);
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Project generation failed");
  });
});
