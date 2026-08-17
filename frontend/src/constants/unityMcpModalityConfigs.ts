import type { GenerationResponse } from "@/api/client";
import {
  generateUnityAnimation,
  generateUnityCamera,
  generateUnityLighting,
  generateUnityMaterials,
} from "@/api/client";

export type UnityModalityQuickAction = {
  label: string;
  icon: string;
  prompt: string;
};

export type UnityMcpModalityConfig = {
  modalityKey: string;
  i18nPrefix: string;
  generate: (body: Record<string, unknown>) => Promise<GenerationResponse>;
  quickActions: UnityModalityQuickAction[];
  examplePrompts: { text: string }[];
  systemPromptPrefKey?: string;
};

export const LIGHTING_CONFIG: UnityMcpModalityConfig = {
  modalityKey: "unity-lighting",
  i18nPrefix: "unityLighting",
  generate: (body) => generateUnityLighting(body),
  quickActions: [
    { label: "Sun + Ambient", icon: "mdi-white-balance-sunny", prompt: "Add a directional sun light with warm color and soft shadows for an outdoor scene." },
    { label: "Indoor Point", icon: "mdi-lightbulb-on", prompt: "Create point lights for a cozy indoor room with warm temperature." },
    { label: "Spotlight Stage", icon: "mdi-spotlight", prompt: "Add a spotlight rig for a small stage with rim and key lights." },
  ],
  examplePrompts: [
    { text: "Set up a three-point lighting rig for a character showcase scene." },
    { text: "Create moonlit night lighting with cool directional light and low ambient." },
  ],
};

export const CAMERA_CONFIG: UnityMcpModalityConfig = {
  modalityKey: "unity-camera",
  i18nPrefix: "unityCamera",
  generate: (body) => generateUnityCamera(body),
  quickActions: [
    { label: "Third Person", icon: "mdi-camera", prompt: "Create a third-person follow camera with smooth damping behind the player." },
    { label: "Top Down", icon: "mdi-arrow-down-bold", prompt: "Add an orthographic top-down camera for a strategy game." },
    { label: "Cinematic", icon: "mdi-movie-open", prompt: "Configure a cinematic perspective camera with letterbox-friendly FOV." },
  ],
  examplePrompts: [
    { text: "Set up a main camera with post-processing friendly clip planes for a 3D platformer." },
    { text: "Create a split-screen compatible camera prefab setup." },
  ],
};

export const MATERIALS_CONFIG: UnityMcpModalityConfig = {
  modalityKey: "unity-materials",
  i18nPrefix: "unityMaterials",
  generate: (body) => generateUnityMaterials(body),
  quickActions: [
    { label: "PBR Metal", icon: "mdi-gold", prompt: "Create a metallic PBR material with moderate smoothness for armor." },
    { label: "Stylized Toon", icon: "mdi-palette", prompt: "Create a stylized toon material with bold albedo and rim lighting hints." },
    { label: "Glass", icon: "mdi-glass-wine", prompt: "Create a transparent glass material with refraction-friendly settings." },
  ],
  examplePrompts: [
    { text: "Generate materials for a low-poly environment: grass, stone, and wood." },
    { text: "Create an emissive sci-fi panel material with pulsing color." },
  ],
};

export const ANIMATION_CONFIG: UnityMcpModalityConfig = {
  modalityKey: "unity-animation",
  i18nPrefix: "unityAnimation",
  generate: (body) => generateUnityAnimation(body),
  quickActions: [
    { label: "Locomotion", icon: "mdi-run", prompt: "Create a basic animator with Idle, Walk, and Run states and smooth transitions." },
    { label: "Cutscene", icon: "mdi-movie-roll", prompt: "Create a Timeline asset for a short intro cutscene with camera and activation tracks." },
    { label: "Combat", icon: "mdi-sword", prompt: "Create an advanced animator with attack combo blend tree and parameters." },
  ],
  examplePrompts: [
    { text: "Build an animator controller for a platformer character with jump and fall states." },
    { text: "Create a timeline sequence that fades in UI and moves the camera." },
  ],
};
