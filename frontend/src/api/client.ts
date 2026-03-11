import { getDefaultBackendUrl } from "@/api/constants";

export type GenerationResponse = {
  success: boolean;
  date: string;
  error: string | null;
  data: Record<string, unknown> | null;
};

export type DiscoveryResponse = {
  success: boolean;
  date: string;
  error: string | null;
  data: Record<string, unknown> | null;
  providers?: ProviderCapabilities[];
  models?: Record<string, unknown>;
  keys?: Record<string, string>;
  preferences?: Record<string, string>;
  prompts?: Record<string, string>;
  settings?: Record<string, unknown>;
};

export type CreateSceneRequest = {
  prompt: string;
  provider?: string;
  options?: Record<string, unknown>;
  api_key?: string;
  system_prompt?: string;
  project_name?: string;  // backend always uses base_path + project_name
  project_path?: string;  // ignored by backend
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
  project_name?: string;  // backend always uses base_path + project_name
  project_path?: string;  // ignored by backend
};

function getBackendUrl(): string {
  return localStorage.getItem("backendUrl") || getDefaultBackendUrl();
}

/**
 * Creates a fetch error with context about the failed request.
 *
 * @param url - The URL that was being requested.
 * @param method - The HTTP method used.
 * @param cause - The original error that occurred.
 * @returns An Error object with detailed context.
 */
function createFetchError(url: string, method: string, cause: unknown): Error {
  let message = `Failed to connect to backend at ${url}`;
  
  if (cause instanceof Error) {
    if (cause.name === "TypeError" && cause.message.includes("fetch")) {
      message = "Backend server is not running. Please start the Python backend.";
    } else {
      message = `${cause.message} (Request: ${method} ${url})`;
    }
  }
  
  const error = new Error(message);
  error.name = "BackendError";
  // Store cause as a custom property for compatibility
  (error as Error & { cause?: unknown }).cause = cause;
  return error;
}

/**
 * Makes an HTTP POST request to the backend API.
 *
 * @param path - The API endpoint path (e.g., "/generate/code").
 * @param body - The request body to serialize as JSON.
 * @returns The parsed JSON response.
 * @throws {BackendError} If the request fails or backend is unavailable.
 *
 * @example
 * ```typescript
 * try {
 *   const response = await post<GenerationResponse>("/generate/code", { prompt: "Hello" });
 *   console.log(response.data);
 * } catch (error) {
 *   console.error("Backend error:", error.message);
 * }
 * ```
 */
async function post<T extends GenerationResponse>(
  path: string,
  body: GenerationRequest | SpritesRequest | { keys: Record<string, string> } | { key: string, value: string }
): Promise<T> {
  const url = `${getBackendUrl()}${path}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as T;
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
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
  project_name?: string;  // backend always uses base_path + project_name
  project_path?: string;  // ignored by backend
};

export function generateSprites(body: SpritesRequest) {
  return post<GenerationResponse>("/generate/sprites", body);
}

export async function saveApiKeys(keys: Record<string, string>): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/config/keys`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as GenerationResponse;
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

export async function getApiKeys(): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/config/keys`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as GenerationResponse;
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
}

/**
 * Saves a user preference to the backend.
 *
 * @param key - The preference key.
 * @param value - The preference value.
 * @returns The backend response.
 * @throws {BackendError} If the request fails or backend is unavailable.
 *
 * @example
 * ```typescript
 * try {
 *   await setPref("theme", "dark");
 * } catch (error) {
 *   console.error("Failed to save preference:", error.message);
 * }
 * ```
 */
export async function setPref(key: string, value: string): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/prefs`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const body = (await response.json()) as GenerationResponse & { detail?: string };
    return body as GenerationResponse;
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

/**
 * Retrieves a user preference from the backend.
 *
 * @param key - The preference key to retrieve.
 * @returns The backend response containing the preference value.
 * @throws {BackendError} If the request fails or backend is unavailable.
 *
 * @example
 * ```typescript
 * try {
 *   const response = await getPref("theme");
 *   console.log(response.data);
 * } catch (error) {
 *   console.error("Failed to get preference:", error.message);
 * }
 * ```
 */
export async function getPref(key: string): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/prefs/${key}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as GenerationResponse;
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
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
  const url = `${getBackendUrl()}/api/management/providers`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
}

export async function saveProvider(provider: ProviderCapabilities & { api_key_value?: string }): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/api/management/providers`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(provider),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

export async function deleteProvider(name: string): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/api/management/providers/${name}`;
  
  try {
    const response = await fetch(url, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "DELETE", error);
  }
}

export async function listModels(provider: string): Promise<ModelEntry[]> {
  const url = `${getBackendUrl()}/api/management/models/${provider}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
}

export async function addModel(provider: string, value: string, label: string, modality: string = "llm"): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/api/management/models`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, value, label, modality }),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

export async function removeModel(provider: string, value: string): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/api/management/models/${provider}/${encodeURIComponent(value)}`;
  
  try {
    const response = await fetch(url, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "DELETE", error);
  }
}

export async function listApiKeys(): Promise<Record<string, string>> {
  const url = `${getBackendUrl()}/api/management/keys`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
}

export async function saveApiKey(service_name: string, key_value: string): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/api/management/keys`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_name, key_value }),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

export async function deleteApiKey(service_name: string): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/api/management/keys/${service_name}`;
  
  try {
    const response = await fetch(url, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "DELETE", error);
  }
}

export async function listSystemPrompts(): Promise<Record<string, string>> {
  const url = `${getBackendUrl()}/api/management/prompts`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
}

export async function saveSystemPrompt(modality: string, content: string): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/api/management/prompts`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modality, content }),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

export async function resetSystemPrompts(): Promise<Record<string, string>> {
  const url = `${getBackendUrl()}/api/management/system-prompts/reset`;
  try {
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || errorBody.error || `HTTP ${response.status}`);
    }
    return (await response.json()).data as Record<string, string>;
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

export async function getAllConfig(): Promise<DiscoveryResponse> {
  const url = `${getBackendUrl()}/api/management/all`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
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

export async function generateUnityProject(body: UnityProjectRequest): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/generate/unity-project`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as GenerationResponse;
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

export async function getLatestOutput(): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/output/latest`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as GenerationResponse;
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
}

// ---------------------------------------------------------------------------
// Unity versions (dropdown: label + id; user can add more)
// ---------------------------------------------------------------------------

export type UnityVersionOption = { value: string; label: string };

export async function getUnityVersions(): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/unity-versions`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as GenerationResponse;
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
}

export async function addUnityVersion(body: {
  value: string;
  label?: string;
}): Promise<GenerationResponse> {
  const url = `${getBackendUrl()}/unity-versions`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value: body.value,
        label: body.label ?? body.value,
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as GenerationResponse;
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

export async function healthCheck(): Promise<{ status: string }> {
  const url = `${getBackendUrl()}/health`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as { status: string };
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
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
  const url = `${getBackendUrl()}/api/v1/project/finalize`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as FinalizeProjectResponse;
  } catch (error) {
    throw createFetchError(url, "POST", error);
  }
}

export async function getFinalizeJobStatus(
  jobId: string
): Promise<FinalizeJobStatusResponse> {
  const url = `${getBackendUrl()}/api/v1/project/finalize/${jobId}`;
  
  try {
    const response = await fetch(url, { method: "GET" });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.error || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as FinalizeJobStatusResponse;
  } catch (error) {
    throw createFetchError(url, "GET", error);
  }
}

export function downloadFinalizedProject(jobId: string): string {
  return `${getBackendUrl()}/api/v1/project/finalize/${jobId}/download`;
}
