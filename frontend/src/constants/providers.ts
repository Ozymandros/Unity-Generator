export type ProviderOption = {
  value: string;
  label: string;
  models?: { value: string; label: string }[];
};

export const TEXT_PROVIDERS: ProviderOption[] = [
  {
    value: "google",
    label: "Google (Gemini)",
    models: [
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    ],
  },
  {
    value: "openai",
    label: "OpenAI",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "o1-preview", label: "o1 Preview" },
    ],
  },
  {
    value: "anthropic",
    label: "Anthropic",
    models: [
      { value: "claude-3-5-sonnet-20240620", label: "Claude 3.5 Sonnet" },
      { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    ],
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    models: [
      { value: "deepseek-chat", label: "DeepSeek Chat" },
      { value: "deepseek-coder", label: "DeepSeek Coder" },
    ],
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    models: [
      { value: "openrouter/auto", label: "Auto" },
    ],
  },
  {
      value: "groq",
      label: "Groq",
      models: [
          { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
          { value: "llama3-70b-8192", label: "Llama 3 70B" },
      ]
  },
  {
      value: "huggingface",
      label: "Hugging Face",
      models: [
          { value: "google/gemma-2b", label: "Gemma 2B" },
          { value: "mistralai/Mistral-7B-Instruct-v0.2", label: "Mistral 7B Instruct v0.2" },
          { value: "meta-llama/Meta-Llama-3-8B-Instruct", label: "Llama 3 8B Instruct" },
          { value: "HuggingFaceH4/zephyr-7b-beta", label: "Zephyr 7B Beta" },
          { value: "tiiuae/falcon-7b-instruct", label: "Falcon 7B Instruct" },
          { value: "Qwen/Qwen1.5-7B-Chat", label: "Qwen 1.5 7B Chat" },
          { value: "microsoft/Phi-3-mini-4k-instruct", label: "Phi-3 Mini 4k" }
      ]
  },
  {
      value: "ollama",
      label: "Ollama",
      models: [
          { value: "gemme3:4b", label: "Gemma 3 4B" }
      ]
  }
];

export const IMAGE_PROVIDERS: ProviderOption[] = [
  { value: "stability", label: "Stability AI" },
  { value: "openai", label: "OpenAI (DALL-E 3)" },
  { value: "google", label: "Google (Imagen)" },
  { value: "flux", label: "Flux (Replicate)" },
];

export const AUDIO_PROVIDERS: ProviderOption[] = [
  { 
    value: "elevenlabs", 
    label: "ElevenLabs",
    models: [
      { value: "Rachel", label: "Rachel" },
      { value: "Drew", label: "Drew" },
      { value: "Clyde", label: "Clyde" },
      { value: "Mimi", label: "Mimi" },
    ]
  },
  { value: "openai", label: "OpenAI (TTS)" },
  { value: "google", label: "Google (TTS)" },
  { 
    value: "playht", 
    label: "PlayHT",
    models: [
      { value: "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e", label: "Jennifer" },
      { value: "s3://voice-cloning-zero-shot/f9ff78ba-d016-47f6-b0ef-dd630f59414e", label: "William" },
    ]
  },
];

export const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 Square" },
  { value: "16:9", label: "16:9 Landscape" },
  { value: "9:16", label: "9:16 Portrait" },
  { value: "4:3", label: "4:3 Standard" },
  { value: "3:2", label: "3:2 Classic" },
];

export const QUALITY_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "hd", label: "HD" },
];

export const TEMPERATURE_PRESETS = [
  { value: 0.2, label: "Precise" },
  { value: 0.7, label: "Balanced" },
  { value: 1.0, label: "Creative" },
];

export const LENGTH_PRESETS = [
  { value: 1024, label: "Short" },
  { value: 2048, label: "Standard" },
  { value: 4096, label: "Long" },
];

export const STABILITY_PRESETS = [
  { value: 0.3, label: "More Variable" },
  { value: 0.5, label: "Balanced" },
  { value: 0.8, label: "More Stable" },
];
