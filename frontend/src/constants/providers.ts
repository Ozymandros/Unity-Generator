export interface ProviderOption {
  value: string;
  label: string;
  type?: "tts" | "music";
}

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
