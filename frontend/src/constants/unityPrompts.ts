/**
 * Unity Prompts Constants
 * 
 * This file defines all quick action prompts and example prompts for Unity scene generation.
 * Prompts are organized by category and use const assertion for type safety.
 * 
 * Categories:
 * - prototype: Complete game prototypes with player, camera, input, and UI
 * - scene: Scene creation with GameObjects, materials, and lighting
 * - ui: UI canvas and layout creation
 * - animation: Animator controllers and timeline cutscenes
 */

/**
 * Quick action prompt strings for common Unity tasks.
 *
 * Each entry is a fully self-contained natural-language instruction that the LLM
 * can execute without further clarification.  Users can edit the injected text
 * before submitting, so prompts are intentionally detailed to serve as a useful
 * starting point rather than a minimal stub.
 *
 * Use cases by category:
 *
 * prototype.fps
 *   - Intended for: developers who want an instant first-person shooter foundation
 *   - Expected outcome: scene with FPS player controller, camera rig, WASD + mouse-look
 *     input, and a minimal HUD (crosshair + health bar) ready to play in the Editor
 *
 * prototype.platformer
 *   - Intended for: developers who want a 2D side-scrolling game starting point
 *   - Expected outcome: scene with a 2D player character, ground platform, jump physics,
 *     and a side-scrolling camera follow script
 *
 * scene.objects
 *   - Intended for: quickly populating a scene with visible geometry for testing
 *     materials, lighting, or camera angles
 *   - Expected outcome: three coloured primitive shapes on a white ground plane with
 *     a directional light, all at specified world positions
 *
 * ui.canvas
 *   - Intended for: adding a standard game HUD to an existing scene
 *   - Expected outcome: Screen Space Overlay canvas containing a health bar slider,
 *     score text label, and a pause button wired to a basic pause script
 *
 * animation.characterAnimator
 *   - Intended for: setting up locomotion animation for a humanoid character
 *   - Expected outcome: Animator Controller with Idle → Walk → Run states driven by a
 *     Speed float parameter, plus a Grounded bool for the Jump state
 *
 * animation.introCutscene
 *   - Intended for: creating a cinematic opening sequence
 *   - Expected outcome: Timeline asset with a camera pan track, a fade-in signal track,
 *     and an Activation track that spawns the player character at the 5-second mark
 */
export const UNITY_PROMPTS = {
  prototype: {
    /** FPS prototype — instant playable first-person shooter setup */
    fps: "Create a complete FPS prototype with first-person player controller, camera, WASD movement, mouse look, and basic UI with crosshair and health bar",
    /** Platformer prototype — 2D side-scrolling game foundation */
    platformer: "Create a 2D platformer prototype with player character, ground platform, jump mechanics, and side-scrolling camera"
  },
  scene: {
    /** Scene with objects — coloured primitives for quick visual testing */
    objects: "Create a scene with a red cube at (0, 1, 0), blue sphere at (2, 1, 0), green capsule at (-2, 1, 0), white plane as ground, and directional light"
  },
  ui: {
    /** UI canvas — standard game HUD with health, score, and pause */
    canvas: "Create a UI canvas with health bar, score text, and pause button in screen space overlay mode"
  },
  animation: {
    /** Character animator — locomotion state machine (idle/walk/run/jump) */
    characterAnimator: "Create a character animator controller with idle, walk, run, and jump states with smooth transitions based on speed and grounded parameters",
    /** Intro cutscene — cinematic opening with camera pan and character spawn */
    introCutscene: "Create a timeline cutscene with camera pan from sky to ground, fade in effect, and character spawn animation over 5 seconds"
  }
} as const;

/**
 * Type representing all available prompt categories
 */
export type PromptCategory = 'prototype' | 'scene' | 'ui' | 'animation';

/**
 * Quick action interface for UI components.
 * Defines the structure for quick action buttons displayed in the ScenesPanel.
 * 
 * @interface QuickAction
 * @property {string} label - Display label for the quick action button
 * @property {string} icon - Material Design Icon identifier (e.g., "mdi-pistol", "mdi-run")
 * @property {string} prompt - Pre-written prompt text to inject into the prompt field when clicked
 * @property {PromptCategory} category - Category for grouping and analytics tracking
 * 
 * @example
 * ```typescript
 * const fpsAction: QuickAction = {
 *   label: "FPS Prototype",
 *   icon: "mdi-pistol",
 *   prompt: "Create a complete FPS prototype with first-person player controller...",
 *   category: "prototype"
 * };
 * ```
 */
export interface QuickAction {
  /** Display label for the quick action button */
  label: string;
  /** Material Design Icon identifier (e.g., "mdi-pistol") */
  icon: string;
  /** Pre-written prompt text to inject into the prompt field */
  prompt: string;
  /** Category for grouping and analytics */
  category: PromptCategory;
}

/**
 * Example prompt interface for discoverability.
 * Used to display example prompts that inspire users and demonstrate system capabilities.
 * 
 * @interface ExamplePrompt
 * @property {string} text - Example prompt text that users can click to inject into the prompt field
 * @property {string} category - Category for organizing examples (scene, material, prefab, input, animation, ui)
 * 
 * @example
 * ```typescript
 * const sceneExample: ExamplePrompt = {
 *   text: "Create a scene with a red cube, blue sphere, and directional light",
 *   category: "scene"
 * };
 * ```
 */
export interface ExamplePrompt {
  /** Example prompt text */
  text: string;
  /** Category for organizing examples */
  category: string;
}

/**
 * Media import interface for cross-panel integration.
 * Used when transferring generated images or audio from ImagePanel/AudioPanel to Unity.
 * Supports both image textures and audio clips with format-specific properties.
 * 
 * @interface MediaImport
 * @property {string} data - Base64-encoded media data (e.g., "data:image/png;base64,iVBORw0KG...")
 * @property {string} name - Name for the imported asset in Unity (must not contain path traversal characters)
 * @property {'image' | 'audio'} type - Media type: "image" for textures or "audio" for audio clips
 * @property {string} [textureType] - Optional texture type for images (Default, Sprite, Normal, UI)
 * @property {string} [audioFormat] - Optional audio format for audio files (WAV, MP3, OGG)
 * 
 * @example
 * ```typescript
 * const imageImport: MediaImport = {
 *   data: "data:image/png;base64,iVBORw0KG...",
 *   name: "PlayerTexture",
 *   type: "image",
 *   textureType: "Sprite"
 * };
 * 
 * const audioImport: MediaImport = {
 *   data: "data:audio/wav;base64,UklGRiQAAABXQVZF...",
 *   name: "BackgroundMusic",
 *   type: "audio",
 *   audioFormat: "WAV"
 * };
 * ```
 */
export interface MediaImport {
  /** Base64-encoded media data */
  data: string;
  /** Name for the imported asset in Unity */
  name: string;
  /** Media type: "image" or "audio" */
  type: 'image' | 'audio';
  /** Texture type for images (Default, Sprite, Normal, UI) */
  textureType?: string;
  /** Audio format for audio files (WAV, MP3, OGG) */
  audioFormat?: string;
}

/**
 * Quick actions array for ScenesPanel.
 * Contains all 6 quick action buttons with their configurations.
 *
 * Each entry maps a user-visible label and icon to a prompt from `UNITY_PROMPTS`
 * so that the source of truth for prompt text stays in one place.
 *
 * Use cases:
 * - FPS Prototype: instant playable first-person shooter — player, camera, input, HUD
 * - Platformer Prototype: 2D side-scrolling game foundation — character, ground, jump, camera
 * - Add UI Canvas: standard game HUD — health bar, score text, pause button
 * - Character Animator: locomotion state machine — idle, walk, run, jump with transitions
 * - Intro Cutscene: cinematic opening — camera pan, fade-in, character spawn on Timeline
 * - Scene with Objects: coloured primitives for quick visual testing of materials/lighting
 */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "FPS Prototype",
    icon: "mdi-pistol",
    prompt: UNITY_PROMPTS.prototype.fps,
    category: "prototype"
  },
  {
    label: "Platformer Prototype",
    icon: "mdi-run",
    prompt: UNITY_PROMPTS.prototype.platformer,
    category: "prototype"
  },
  {
    label: "Add UI Canvas",
    icon: "mdi-monitor-dashboard",
    prompt: UNITY_PROMPTS.ui.canvas,
    category: "ui"
  },
  {
    label: "Character Animator",
    icon: "mdi-animation",
    prompt: UNITY_PROMPTS.animation.characterAnimator,
    category: "animation"
  },
  {
    label: "Intro Cutscene",
    icon: "mdi-movie-open",
    prompt: UNITY_PROMPTS.animation.introCutscene,
    category: "animation"
  },
  {
    label: "Scene with Objects",
    icon: "mdi-cube-outline",
    prompt: UNITY_PROMPTS.scene.objects,
    category: "scene"
  }
];

/**
 * Example prompts for discoverability and inspiration.
 *
 * Displayed in an expandable section in ScenesPanel to help users learn what the
 * system can do.  Clicking any entry injects its text into the prompt field.
 *
 * Coverage — one example per major capability category:
 * - scene:     Creating GameObjects with materials and lighting
 * - material:  Adjusting shader properties (metallic, smoothness)
 * - prefab:    Packaging GameObjects as reusable prefabs
 * - input:     Setting up the Unity Input System with action maps
 * - animation: Building Animator Controllers with state transitions
 * - ui:        Composing UI canvases with common HUD elements
 */
export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    text: "Create a scene with a red cube, blue sphere, and directional light",
    category: "scene"
  },
  {
    text: "Add a material with metallic blue color and high smoothness",
    category: "material"
  },
  {
    text: "Create a prefab from the player GameObject with Rigidbody and Collider",
    category: "prefab"
  },
  {
    text: "Setup Input System with WASD movement and space jump actions",
    category: "input"
  },
  {
    text: "Create an animator with idle, walk, run states and speed-based transitions",
    category: "animation"
  },
  {
    text: "Create a UI canvas with health bar slider, score text, and game over panel",
    category: "ui"
  }
];
