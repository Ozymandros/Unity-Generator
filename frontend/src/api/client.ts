export type GenerationResponse = {
  success: boolean;
  date: string;
  error: string | null;
  data: Record<string, unknown> | null;
};

export type CreateSceneRequest = {
  prompt: string;
  provider?: string;
  options?: Record<string, unknown>;
  api_key?: string;
  system_prompt?: string;
};

export function createScene(body: CreateSceneRequest) {
    return post<GenerationResponse>("/api/scenes/create", body);
}

export type GenerationRequest = {
  prompt: string;
  modality?: string;
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

export async function setPref(key: string, value: string): Promise<GenerationResponse> {
  const response = await fetch(`${getBackendUrl()}/prefs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  const body = (await response.json()) as GenerationResponse & { detail?: string };
  if (!response.ok) {
    throw new Error(body.detail ?? body.error ?? `Request failed (${response.status})`);
  }
  return body as GenerationResponse;
}

export async function getPref(key: string) {
  const response = await fetch(`${getBackendUrl()}/prefs/${key}`, {
    method: "GET",
  });
  return (await response.json()) as GenerationResponse;
}

// ---------------------------------------------------------------------------
// Provider model management
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Management API
// ---------------------------------------------------------------------------

export type ModelEntry = {
  value: string;
  label: string;
  modality: string;
};

export type ProviderCapabilities = {
  name: string;
  api_key_name: string | null;
  base_url: string | null;
  openai_compatible: boolean;
  requires_api_key: boolean;
  supports_vision: boolean;
  supports_streaming: boolean;
  supports_function_calling: boolean;
  supports_tool_use: boolean;
  modalities: string[];
  default_models: Record<string, string>;
  extra: Record<string, unknown>;
};

export async function listProviders(): Promise<ProviderCapabilities[]> {
  const response = await fetch(`${getBackendUrl()}/api/management/providers`);
  return await response.json();
}

export async function saveProvider(provider: ProviderCapabilities & { api_key_value?: string }): Promise<GenerationResponse> {
  const response = await fetch(`${getBackendUrl()}/api/management/providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(provider),
  });
  return await response.json();
}

export async function deleteProvider(name: string): Promise<GenerationResponse> {
  const response = await fetch(`${getBackendUrl()}/api/management/providers/${name}`, {
    method: "DELETE",
  });
  return await response.json();
}

export async function listModels(provider: string): Promise<ModelEntry[]> {
  const response = await fetch(`${getBackendUrl()}/api/management/models/${provider}`);
  return await response.json();
}

export async function addModel(provider: string, value: string, label: string, modality: string = "llm"): Promise<GenerationResponse> {
  const response = await fetch(`${getBackendUrl()}/api/management/models`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, value, label, modality }),
  });
  return await response.json();
}

export async function removeModel(provider: string, value: string): Promise<GenerationResponse> {
  const response = await fetch(`${getBackendUrl()}/api/management/models/${provider}/${encodeURIComponent(value)}`, {
    method: "DELETE",
  });
  return await response.json();
}

export async function listApiKeys(): Promise<Record<string, string>> {
  const response = await fetch(`${getBackendUrl()}/api/management/keys`);
  return await response.json();
}

export async function saveApiKey(service_name: string, key_value: string): Promise<GenerationResponse> {
  const response = await fetch(`${getBackendUrl()}/api/management/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service_name, key_value }),
  });
  return await response.json();
}

export async function deleteApiKey(service_name: string): Promise<GenerationResponse> {
  const response = await fetch(`${getBackendUrl()}/api/management/keys/${service_name}`, {
    method: "DELETE",
  });
  return await response.json();
}

export async function listSystemPrompts(): Promise<Record<string, string>> {
  const response = await fetch(`${getBackendUrl()}/api/management/prompts`);
  return await response.json();
}

export async function saveSystemPrompt(modality: string, content: string): Promise<GenerationResponse> {
  const response = await fetch(`${getBackendUrl()}/api/management/prompts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modality, content }),
  });
  return await response.json();
}

export type DiscoveryResponse = {
  providers: ProviderCapabilities[];
  models: Record<string, ModelEntry[]>;
  prompts: Record<string, string>;
  keys: string[];
  preferences: Record<string, string>;
};

export async function getAllConfig(): Promise<DiscoveryResponse> {
  const response = await fetch(`${getBackendUrl()}/api/management/all`);
  return await response.json();
}

export async function getApiKey(serviceName: string): Promise<string | null> {
  const keys = await listApiKeys();
  return keys[serviceName] || null;
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
