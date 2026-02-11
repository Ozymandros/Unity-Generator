export type GenerationResponse = {
  success: boolean;
  date: string;
  error: string | null;
  data: Record<string, unknown> | null;
};

export type GenerationRequest = {
  prompt: string;
  provider?: string;
  api_key?: string;
  options?: Record<string, unknown>;
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
