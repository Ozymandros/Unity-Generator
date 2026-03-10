import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  generateAudio,
  generateCode,
  generateImage,
  generateText,
  generateUnityProject,
  getLatestOutput,
  getPref,
  healthCheck,
  saveApiKeys,
  setPref,
  finalizeProject,
  getFinalizeJobStatus,
  downloadFinalizedProject,
} from "@/api/client";
import { getDefaultBackendUrl } from "@/api/constants";

const mockFetch = vi.fn();
const defaultBackendUrl = getDefaultBackendUrl();

function mockResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => defaultBackendUrl),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  });
});

describe("api client", () => {
  it("calls generateCode", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { content: "code" } })
    );
    await generateCode({ prompt: "p" });
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/generate/code",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("calls generateText", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { content: "text" } })
    );
    await generateText({ prompt: "p" });
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/generate/text",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("calls generateImage", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { image: "img" } })
    );
    await generateImage({ prompt: "p" });
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/generate/image",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("calls generateAudio", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { audio: "audio" } })
    );
    await generateAudio({ prompt: "p" });
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/generate/audio",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("calls saveApiKeys", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { saved: ["openai"] } })
    );
    await saveApiKeys({ openai_api_key: "x" });
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/config/keys",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("calls setPref", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { key: "k" } })
    );
    await setPref("k", "v");
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/prefs",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("calls getPref", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { key: "k" } })
    );
    await getPref("k");
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/prefs/k",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("calls generateUnityProject", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { project_path: "p" } })
    );
    await generateUnityProject({ project_name: "p" });
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/generate/unity-project",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("calls getLatestOutput", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { path: "p" } })
    );
    await getLatestOutput();
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/output/latest",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("calls healthCheck", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ status: "ok" }));
    await healthCheck();
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/health",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("calls finalizeProject", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, job_id: "abc123", message: "created" })
    );
    const result = await finalizeProject({
      project_name: "TestProject",
      unity_settings: { generate_scene: true, scene_name: "MainScene" },
    });
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/api/v1/project/finalize",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.job_id).toBe("abc123");
  });

  it("calls getFinalizeJobStatus", async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({
        job_id: "abc123",
        status: "running",
        step: "unity_run",
        progress: 50,
        logs_tail: ["log line"],
        errors: [],
        started_at: null,
        finished_at: null,
        project_path: null,
        zip_path: null,
      })
    );
    const result = await getFinalizeJobStatus("abc123");
    expect(mockFetch).toHaveBeenCalledWith(
      defaultBackendUrl + "/api/v1/project/finalize/abc123",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.status).toBe("running");
    expect(result.progress).toBe(50);
  });

  it("returns download URL for downloadFinalizedProject", () => {
    const url = downloadFinalizedProject("abc123");
    expect(url).toBe(
      defaultBackendUrl + "/api/v1/project/finalize/abc123/download"
    );
  });
});
