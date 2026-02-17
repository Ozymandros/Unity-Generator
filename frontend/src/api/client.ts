export type GenerationResponse = {
  success: boolean;
  date: string;
  error: string | null;
  data: Record<string, unknown> | null;
};

export type CreateSceneRequest = {
  prompt: string;
  system_prompt?: string;
};

export function createScene(body: CreateSceneRequest) {
    return post<GenerationResponse>("/api/scenes/create", body);
}

export type GenerationRequest = {
  prompt: string;
  provider?: string;
  api_key?: string;
  options?: Record<string, unknown>;
  system_prompt?: string;
  project_path?: string;
};

function getBackendUrl(): string {
  return localStorage.getItem("backendUrl") || "http://127.0.0.1:8000";
}

async function post<T extends GenerationResponse>(
  path: string,
  body: GenerationRequest | SpritesRequest | { keys: Record<string, string> } | { key: string, value: string }
): Promise<T> {
  const response = await fetch(`${getBackendUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as T;
}

export function generateCode(body: GenerationRequest) {
  return post<GenerationResponse>("/generate/code", body);
}

export function generateText(body: GenerationRequest) {
  return post<GenerationResponse>("/generate/text", body);
}

export function generateImage(body: GenerationRequest) {
  return post<GenerationResponse>("/generate/image", body);
}

export function generateAudio(body: GenerationRequest) {
  return post<GenerationResponse>("/generate/audio", body);
}

export type SpritesRequest = {
  prompt: string;
  provider?: string;
  api_key?: string;
  resolution: number;
  options?: Record<string, unknown>;
  system_prompt?: string;
  project_path?: string;
};

export function generateSprites(body: SpritesRequest) {
  return post<GenerationResponse>("/generate/sprites", body);
}

export async function saveApiKeys(keys: Record<string, string>) {
  const response = await fetch(`${getBackendUrl()}/config/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys }),
  });
  return (await response.json()) as GenerationResponse;
}

export async function getApiKeys() {
  const response = await fetch(`${getBackendUrl()}/config/keys`, {
    method: "GET",
  });
  return (await response.json()) as GenerationResponse;
}

export async function setPref(key: string, value: string) {
  const response = await fetch(`${getBackendUrl()}/prefs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  return (await response.json()) as GenerationResponse;
}

export async function getPref(key: string) {
  const response = await fetch(`${getBackendUrl()}/prefs/${key}`, {
    method: "GET",
  });
  return (await response.json()) as GenerationResponse;
}

export type UnityProjectRequest = {
  project_name: string;
  code_prompt?: string;
  text_prompt?: string;
  image_prompt?: string;
  audio_prompt?: string;
  provider_overrides?: Record<string, string | undefined>;
  options?: Record<string, Record<string, unknown>>;
  unity_template?: string;
  unity_version?: string;
  unity_platform?: string;
};

export async function generateUnityProject(body: UnityProjectRequest) {
  const response = await fetch(`${getBackendUrl()}/generate/unity-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as GenerationResponse;
}

export async function getLatestOutput() {
  const response = await fetch(`${getBackendUrl()}/output/latest`, {
    method: "GET",
  });
  return (await response.json()) as GenerationResponse;
}

export async function healthCheck() {
  const response = await fetch(`${getBackendUrl()}/health`, {
    method: "GET",
  });
  return (await response.json()) as { status: string };
}

// ---------------------------------------------------------------------------
// Finalize workflow types
// ---------------------------------------------------------------------------

export type UnityEngineSettings = {
  install_packages?: boolean;
  generate_scene?: boolean;
  setup_urp?: boolean;
  packages?: string[];
  scene_name?: string;
  unity_editor_path?: string;
  timeout?: number;
};

export type FinalizeProjectRequest = {
  project_name?: string;
  project_path?: string;
  code_prompt?: string;
  text_prompt?: string;
  image_prompt?: string;
  audio_prompt?: string;
  provider_overrides?: Record<string, string | undefined>;
  options?: Record<string, Record<string, unknown>>;
  unity_settings?: UnityEngineSettings;
};

export type FinalizeProjectResponse = {
  success: boolean;
  job_id: string;
  message: string;
};

export type FinalizeJobStatusResponse = {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed" | "not_found";
  step: string;
  progress: number;
  logs_tail: string[];
  errors: string[];
  started_at: string | null;
  finished_at: string | null;
  project_path: string | null;
  zip_path: string | null;
};

// ---------------------------------------------------------------------------
// Finalize workflow API calls
// ---------------------------------------------------------------------------

export async function finalizeProject(
  body: FinalizeProjectRequest
): Promise<FinalizeProjectResponse> {
  const response = await fetch(
    `${getBackendUrl()}/api/v1/project/finalize`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return (await response.json()) as FinalizeProjectResponse;
}

export async function getFinalizeJobStatus(
  jobId: string
): Promise<FinalizeJobStatusResponse> {
  const response = await fetch(
    `${getBackendUrl()}/api/v1/project/finalize/${jobId}`,
    { method: "GET" }
  );
  return (await response.json()) as FinalizeJobStatusResponse;
}

export function downloadFinalizedProject(jobId: string): string {
  return `${getBackendUrl()}/api/v1/project/finalize/${jobId}/download`;
}
