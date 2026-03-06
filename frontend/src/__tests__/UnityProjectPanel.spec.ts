import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises, VueWrapper } from "@vue/test-utils";
import UnityProjectPanel from "@/components/UnityProjectPanel";
import { SmartField } from "@/components/generic/SmartField";
import * as client from "@/api/client";
import { createVuetify } from 'vuetify';

const vuetify = createVuetify();

vi.mock("@/api/client");

const emitUpdate = async (wrapper: VueWrapper<unknown>, label: string, value: unknown) => {
  const fields = wrapper.findAllComponents(SmartField);
  const field = fields.find(f => (f.props() as { label: string }).label === label);
  if (!field) throw new Error(`SmartField with label "${label}" not found. Found: ${fields.map(f => (f.props() as { label: string }).label).join(', ')}`);
  await field.vm.$emit("update:modelValue", value);
  await (wrapper.vm as unknown as { $nextTick: () => Promise<void> }).$nextTick();
};

function getGenerateButton(wrapper: VueWrapper<unknown>) {
  return wrapper.findAll("button").find((b) => b.text().includes("Generate Base Project"));
}

function getOpenFolderButton(wrapper: VueWrapper<unknown>) {
  return wrapper.findAll("button").find((b) => b.text().includes("Open Folder"));
}

function getStatusText(wrapper: VueWrapper<unknown>): string {
  const banner = wrapper.findComponent({ name: "StatusBanner" });
  const prop = banner.exists() ? banner.props("status") : undefined;
  if (prop != null && prop !== "") return String(prop);
  return wrapper.text();
}

const SESSION_NAME_KEY = "unity_session_project_name";
const SESSION_PATH_KEY = "unity_session_project_path";

describe("UnityProjectPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(client.getUnityVersions).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: {
        versions: [
          { value: "6000.3.2f1", label: "6000.3.2f1" },
          { value: "2022.3", label: "2022.3 LTS" },
        ],
      },
    });
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = undefined;
    // Align with useSessionProject: default name so panel and finalize tests see "UnityProject"
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) =>
        k === SESSION_NAME_KEY ? "UnityProject" : k === SESSION_PATH_KEY ? "" : null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
  });

  const mountPanel = () => mount(UnityProjectPanel, {
    global: {
      plugins: [vuetify],
      stubs: {
        'v-expand-transition': { template: '<div><slot /></div>' },
        'v-fade-transition': { template: '<div><slot /></div>' },
        'v-dialog': { template: '<div v-if="modelValue"><slot /></div>', props: ['modelValue'] },
        'status-banner': true
      }
    }
  });

  it("renders form fields", () => {
    const wrapper = mountPanel();
    expect(wrapper.findAllComponents(SmartField).length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain("Generate Base Project");
  });

  it("calls generateUnityProject API on button click", async () => {
    vi.mocked(client.generateUnityProject).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { project_path: "C:/output/TestProject" },
    });

    const wrapper = mountPanel();
    await flushPromises();
    
    await emitUpdate(wrapper, 'Project Name', "TestProject");
    await emitUpdate(wrapper, 'Unity Template', "3d");
    await emitUpdate(wrapper, 'Unity Version', "2022.3");
    await emitUpdate(wrapper, 'Target Platform', "windows");

    const generateBtn = getGenerateButton(wrapper);
    await generateBtn!.trigger("click");
    await flushPromises();

    expect(client.generateUnityProject).toHaveBeenCalledWith({
      project_name: "TestProject",
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

    const wrapper = mountPanel();
    await emitUpdate(wrapper, 'Project Name', "MyUnityProject");
    await emitUpdate(wrapper, 'Unity Template', "3d");
    await emitUpdate(wrapper, 'Unity Version', "2022.3");
    await emitUpdate(wrapper, 'Target Platform', "windows");
    const generateBtn = getGenerateButton(wrapper);
    await generateBtn!.trigger("click");
    await flushPromises();

    const resultField = wrapper.findAllComponents(SmartField).find(f => f.props('label') === "Result (JSON)");
    expect(resultField!.props("modelValue")).toContain("MyUnityProject");
  });

  it("shows error status on failure", async () => {
    vi.mocked(client.generateUnityProject).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Project generation failed",
      data: null,
    });

    const wrapper = mountPanel();
    await emitUpdate(wrapper, 'Project Name', "FailProject");
    await emitUpdate(wrapper, 'Unity Template', "3d");
    await emitUpdate(wrapper, 'Unity Version', "2022.3");
    await emitUpdate(wrapper, 'Target Platform', "windows");
    const generateBtn = getGenerateButton(wrapper);
    await generateBtn!.trigger("click");
    await flushPromises();

    expect(getStatusText(wrapper)).toContain("Project generation failed");
  });

  it("renders with default settings", () => {
    const wrapper = mountPanel();
    const vm = wrapper.vm as unknown as { projectName: string; settings: { installPackages: boolean } };
    expect(vm.projectName).toBe("UnityProject");
    expect(vm.settings.installPackages).toBe(false);
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

    const wrapper = mountPanel();
    await flushPromises();
    await emitUpdate(wrapper, 'Project Name', "TestProject");
    await emitUpdate(wrapper, 'Unity Template', "3d");
    await emitUpdate(wrapper, 'Unity Version', "2022.3");
    await emitUpdate(wrapper, 'Target Platform', "windows");
    const generateBtn = getGenerateButton(wrapper);
    await generateBtn!.trigger("click");
    await flushPromises();

    const openFolderBtn = getOpenFolderButton(wrapper);
    await openFolderBtn!.trigger("click");
    await flushPromises();

    expect(openMock).toHaveBeenCalledWith("C:/output/TestProject");
    expect(getStatusText(wrapper)).toContain("Opened output folder.");
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

    const wrapper = mountPanel();
    await flushPromises();
    const openFolderBtn = getOpenFolderButton(wrapper);
    await openFolderBtn!.trigger("click");
    await flushPromises();

    expect(client.getLatestOutput).toHaveBeenCalled();
    expect(openMock).toHaveBeenCalledWith("C:/output/Latest");
    expect(getStatusText(wrapper)).toContain("Opened output folder.");
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

    const wrapper = mountPanel();
    await flushPromises();
    const openFolderBtn = getOpenFolderButton(wrapper);
    await openFolderBtn!.trigger("click");
    await flushPromises();

    expect(getStatusText(wrapper)).toContain("Tauri not available in web build");
  });

  // -------------------------------------------------------------------
  // Unity Engine Settings & Finalize
  // -------------------------------------------------------------------

  it("renders Unity Engine Settings section", () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).toContain("Unity Engine Settings");
    expect(wrapper.findAllComponents(SmartField).filter(f => f.props('type') === 'checkbox').length).toBe(3);
  });

  it("renders finalize button", () => {
    const wrapper = mountPanel();
    const buttons = wrapper.findAll("button");
    const finalizeBtn = buttons.find((b) =>
      b.text().includes("Finalize with Unity Engine")
    );
    expect(finalizeBtn).toBeTruthy();
  });

  it("shows UPM packages input when toggle is checked", async () => {
    const wrapper = mountPanel();
    // Manually set value to test rendering
    const vm = wrapper.vm as unknown as { settings: { installPackages: boolean } };
    vm.settings.installPackages = true;
    await flushPromises();
    await (wrapper.vm as unknown as { $nextTick: () => Promise<void> }).$nextTick();
    
    const fields = wrapper.findAllComponents(SmartField);
    expect(fields.some(f => (f.props() as { label: string }).label === "UPM Packages (comma-separated)")).toBe(true);
  });

  it("shows scene name input when generate scene is checked", async () => {
    const wrapper = mountPanel();
    const vm = wrapper.vm as unknown as { settings: { generateScene: boolean } };
    vm.settings.generateScene = true;
    await flushPromises();
    await (wrapper.vm as unknown as { $nextTick: () => Promise<void> }).$nextTick();

    const fields = wrapper.findAllComponents(SmartField);
    expect(fields.some(f => (f.props() as { label: string }).label === "Scene Name")).toBe(true);
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

    const wrapper = mountPanel();
    const buttons = wrapper.findAll("button");
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
      message: "Failed to create finalize job",
    });

    const wrapper = mountPanel();
    const buttons = wrapper.findAll("button");
    const finalizeBtn = buttons.find((b) =>
      b.text().includes("Finalize with Unity Engine")
    );
    await finalizeBtn!.trigger("click");
    await flushPromises();

    expect(wrapper.find("status-banner-stub").attributes("status") || (wrapper.findComponent({ name: 'StatusBanner' }).props('status'))).toContain("Failed to create finalize job");
  });
});
