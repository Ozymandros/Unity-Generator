import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import UnityProjectPanel from "./UnityProjectPanel.vue";
import * as client from "../../api/client";

vi.mock("../../api/client");

describe("UnityProjectPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = undefined;
  });

  it("renders form fields", () => {
    const wrapper = mount(UnityProjectPanel);
    expect(wrapper.find('input').exists()).toBe(true); // Project Name
    expect(wrapper.findAll("textarea").length).toBeGreaterThan(0);
    expect(wrapper.findAll("select").length).toBeGreaterThan(0);
    // First primary button is Generate Project
    expect(wrapper.findAll("button.primary")[0].text()).toBe("Generate Project");
  });

  it("calls generateUnityProject API on button click", async () => {
    vi.mocked(client.generateUnityProject).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { project_path: "C:/output/TestProject" },
    });

    const wrapper = mount(UnityProjectPanel);
    await flushPromises();
    await wrapper.find('input').setValue('TestProject');
    const selects = wrapper.findAll('select');
    await selects[0].setValue('3d'); // Unity Template
    await selects[1].setValue('2022.3'); // Unity Version
    await selects[2].setValue('windows'); // Unity Platform
    await wrapper.find('#code-prompt').setValue("Create player controller");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.generateUnityProject).toHaveBeenCalledWith({
      project_name: "TestProject",
      code_prompt: "Create player controller",
      text_prompt: undefined,
      image_prompt: undefined,
      audio_prompt: undefined,
      provider_overrides: {
        audio: undefined,
        code: undefined,
        image: undefined,
        text: undefined,
      },
      options: {
        code: expect.anything(),
        text: expect.anything(),
        image: expect.anything(),
        audio: expect.anything(),
      },
      unity_template: "3d",
      unity_version: "2022.3",
      unity_platform: "windows",
    });
  });

  it("displays result on success", async () => {
    vi.mocked(client.generateUnityProject).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { project_path: "C:/output/MyUnityProject" },
    });

    const wrapper = mount(UnityProjectPanel);
    await wrapper.find('input').setValue('MyUnityProject');
    await wrapper.findAll('select')[0].setValue('3d');
    await wrapper.findAll('select')[1].setValue('2022.3');
    await wrapper.findAll('select')[2].setValue('windows');
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
    await wrapper.find('input').setValue('FailProject');
    await wrapper.findAll('select')[0].setValue('3d');
    await wrapper.findAll('select')[1].setValue('2022.3');
    await wrapper.findAll('select')[2].setValue('windows');
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Project generation failed");
  });

  it("passes structured options to API", async () => {
    vi.mocked(client.generateUnityProject).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { project_path: "C:/output/TestProject" },
    });


    const wrapper = mount(UnityProjectPanel);
    await wrapper.find('input').setValue('TestProject');
    await wrapper.findAll('select')[0].setValue('3d');
    await wrapper.findAll('select')[1].setValue('2022.3');
    await wrapper.findAll('select')[2].setValue('windows');
    await flushPromises();

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (wrapper.vm as any).code.prompt = "Test code prompt";
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (wrapper.vm as any).code.options.temperature = 1.0;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (wrapper.vm as any).code.options.max_tokens = 4096;
    await wrapper.vm.$nextTick();
    // Force input event to trigger reactivity if needed
    wrapper.find('input').element.dispatchEvent(new Event('input'));
    await wrapper.vm.$nextTick();

    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.generateUnityProject).toHaveBeenCalledWith({
      project_name: "TestProject",
      code_prompt: "Test code prompt",
      text_prompt: undefined,
      image_prompt: undefined,
      audio_prompt: undefined,
      provider_overrides: {
        audio: undefined,
        code: undefined,
        image: undefined,
        text: undefined,
      },
      options: {
        code: expect.objectContaining({ temperature: 1.0, max_tokens: 4096 }),
        text: expect.anything(),
        image: expect.anything(),
        audio: expect.anything(),
      },
      unity_template: "3d",
      unity_version: "2022.3",
      unity_platform: "windows",
    });
  });

  it("opens the output folder with Tauri when available", async () => {
    vi.mocked(client.generateUnityProject).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { project_path: "C:/output/TestProject" },
    });

    const openMock = vi.fn().mockResolvedValue(undefined);
    (window as unknown as { __TAURI__?: { shell?: { open: (path: string) => Promise<void> } } }).__TAURI__ = {
      shell: { open: openMock },
    };

    const wrapper = mount(UnityProjectPanel);
    await wrapper.find('input').setValue('TestProject');
    await wrapper.findAll('select')[0].setValue('3d');
    await wrapper.findAll('select')[1].setValue('2022.3');
    await wrapper.findAll('select')[2].setValue('windows');
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    await wrapper.find("button.secondary").trigger("click");
    await flushPromises();

    expect(openMock).toHaveBeenCalledWith("C:/output/TestProject");
    expect(wrapper.text()).toContain("Opened output folder.");
  });

  it("falls back to latest output when no project path exists", async () => {
    vi.mocked(client.getLatestOutput).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { path: "C:/output/Latest" },
    });

    const openMock = vi.fn().mockResolvedValue(undefined);
    (window as unknown as { __TAURI__?: { shell?: { open: (path: string) => Promise<void> } } }).__TAURI__ = {
      shell: { open: openMock },
    };

    const wrapper = mount(UnityProjectPanel);
    await wrapper.find("button.secondary").trigger("click");
    await flushPromises();

    expect(client.getLatestOutput).toHaveBeenCalled();
    expect(openMock).toHaveBeenCalledWith("C:/output/Latest");
    expect(wrapper.text()).toContain("Opened output folder.");
  });

  it("shows a fallback message when Tauri is unavailable", async () => {
    vi.mocked(client.getLatestOutput).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { path: "C:/output/Latest" },
    });

    (window as unknown as { __TAURI__?: { shell?: { open: (path: string) => Promise<void> } } }).__TAURI__ =
      undefined;

    const wrapper = mount(UnityProjectPanel);
    await wrapper.find("button.secondary").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Tauri not available in web build");
  });

  // -------------------------------------------------------------------
  // Unity Engine Settings & Finalize
  // -------------------------------------------------------------------

  it("renders Unity Engine Settings section", () => {
    const wrapper = mount(UnityProjectPanel);
    expect(wrapper.text()).toContain("Unity Engine Settings");
    expect(wrapper.findAll('input[type="checkbox"]').length).toBe(3);
  });

  it("renders finalize button", () => {
    const wrapper = mount(UnityProjectPanel);
    const buttons = wrapper.findAll("button.primary");
    const finalizeBtn = buttons.find((b) =>
      b.text().includes("Finalize with Unity Engine")
    );
    expect(finalizeBtn).toBeTruthy();
  });

  it("shows UPM packages input when toggle is checked", async () => {
    const wrapper = mount(UnityProjectPanel);
    // The first checkbox is Generate Default Scene, second is Install Packages
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    // Second checkbox controls install_packages
    await checkboxes[1].setValue(true);
    await flushPromises();
    expect(wrapper.text()).toContain("UPM Packages");
  });

  it("shows scene name input when generate scene is checked", async () => {
    const wrapper = mount(UnityProjectPanel);
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    // First checkbox controls generate_scene
    await checkboxes[0].setValue(true);
    await flushPromises();
    expect(wrapper.text()).toContain("Scene Name");
  });

  it("calls finalizeProject API on finalize button click", async () => {
    vi.mocked(client.finalizeProject).mockResolvedValue({
      success: true,
      job_id: "test-job-123",
      message: "Job created",
    });

    vi.mocked(client.getFinalizeJobStatus).mockResolvedValue({
      job_id: "test-job-123",
      status: "completed",
      step: "done",
      progress: 100,
      logs_tail: ["Finalization complete"],
      errors: [],
      started_at: null,
      finished_at: null,
      project_path: "C:/output/TestProject",
      zip_path: "C:/output/TestProject.zip",
    });

    const wrapper = mount(UnityProjectPanel);
    const buttons = wrapper.findAll("button.primary");
    const finalizeBtn = buttons.find((b) =>
      b.text().includes("Finalize with Unity Engine")
    );
    await finalizeBtn!.trigger("click");
    await flushPromises();

    expect(client.finalizeProject).toHaveBeenCalledWith(
      expect.objectContaining({
        project_name: "UnityProject",
        unity_settings: expect.objectContaining({
          install_packages: false,
          generate_scene: false,
          setup_urp: false,
        }),
      })
    );
  });

  it("shows error when finalize job fails", async () => {
    vi.mocked(client.finalizeProject).mockResolvedValue({
      success: false,
      job_id: "",
      message: "",
    });

    const wrapper = mount(UnityProjectPanel);
    const buttons = wrapper.findAll("button.primary");
    const finalizeBtn = buttons.find((b) =>
      b.text().includes("Finalize with Unity Engine")
    );
    await finalizeBtn!.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Failed to create finalize job");
  });
});
