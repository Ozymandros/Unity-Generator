/**
 * Unity UI Prompts Constants
 *
 * Template prompts and quick actions for Unity UI element generation.
 * Organised by element type and UI system (uGUI vs UI Toolkit).
 *
 * Each prompt is a complete, self-contained natural-language instruction
 * that the LLM can execute without further clarification.
 */

/** Supported Unity UI systems */
export type UISystem = "ugui" | "uitoolkit";

/** Supported output formats */
export type UIOutputFormat = "script" | "prefab_yaml" | "both";

/** Supported anchor presets */
export type UIAnchorPreset = "full_screen" | "top_left" | "center" | "stretch" | "custom";

/**
 * A quick-action chip for the Unity UI panel.
 *
 * @example
 * ```typescript
 * const action: UIQuickAction = {
 *   label: "Health Bar",
 *   icon: "mdi-heart",
 *   elementType: "health_bar",
 *   prompt: "Create a health bar...",
 * };
 * ```
 */
export interface UIQuickAction {
  /** Display label shown on the chip */
  label: string;
  /** Material Design Icon identifier */
  icon: string;
  /** Element type key sent to the backend */
  elementType: string;
  /** Pre-written prompt injected into the textarea when clicked */
  prompt: string;
}

/**
 * An example prompt entry shown in the expandable examples section.
 */
export interface UIExamplePrompt {
  /** Full prompt text */
  text: string;
  /** Category for grouping */
  category: string;
}

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

/**
 * Quick-action chips for common Unity UI elements.
 * Clicking a chip injects the corresponding prompt into the textarea.
 */
export const UI_QUICK_ACTIONS: UIQuickAction[] = [
  {
    label: "Health Bar",
    icon: "mdi-heart",
    elementType: "health_bar",
    prompt:
      "Create a uGUI health bar with a background Image, a fill Image using a Slider component, " +
      "and a TMP_Text label showing current/max HP. Anchor it to the top-left of the screen. " +
      "Include a public SetHealth(float current, float max) method.",
  },
  {
    label: "Button",
    icon: "mdi-gesture-tap-button",
    elementType: "button",
    prompt:
      "Create a styled uGUI Button with a rounded background Image, a TMP_Text label, " +
      "hover and pressed colour transitions, and an OnClick UnityEvent. " +
      "Include a C# MonoBehaviour that wires up the button and logs the click.",
  },
  {
    label: "Dialogue Box",
    icon: "mdi-comment-text-outline",
    elementType: "dialogue_box",
    prompt:
      "Create a uGUI dialogue box panel with a speaker name TMP_Text, a body TMP_Text for dialogue lines, " +
      "a portrait Image placeholder, and Next/Skip buttons. " +
      "Include a DialogueController MonoBehaviour with a ShowDialogue(string speaker, string[] lines) method " +
      "that types out text character by character using a coroutine.",
  },
  {
    label: "Inventory Slot",
    icon: "mdi-package-variant",
    elementType: "inventory_slot",
    prompt:
      "Create a uGUI inventory slot prefab with a background Image, an item icon Image, " +
      "a quantity TMP_Text badge in the bottom-right corner, and a highlight overlay Image " +
      "that activates on hover. Include an InventorySlot MonoBehaviour with SetItem(Sprite icon, int quantity) " +
      "and Clear() methods.",
  },
  {
    label: "HUD Layout",
    icon: "mdi-view-dashboard",
    elementType: "hud_layout",
    prompt:
      "Create a complete game HUD Canvas in Screen Space Overlay mode with: " +
      "a health bar (top-left), a minimap placeholder (top-right), " +
      "an ammo counter (bottom-right), and an objective text (top-center). " +
      "Use CanvasScaler set to Scale With Screen Size (1920×1080 reference). " +
      "Include a HUDController MonoBehaviour that exposes public methods to update each element.",
  },
];

// ---------------------------------------------------------------------------
// Example Prompts
// ---------------------------------------------------------------------------

/**
 * Example prompts shown in the expandable section of the Unity UI panel.
 */
export const UI_EXAMPLE_PROMPTS: UIExamplePrompt[] = [
  {
    text: "Create a stamina bar that depletes when sprinting and regenerates over time, with a pulsing glow effect when full",
    category: "hud",
  },
  {
    text: "Create a UI Toolkit UXML/USS settings menu with sliders for volume and brightness, a dropdown for resolution, and a Back button",
    category: "menu",
  },
  {
    text: "Create a floating damage number prefab that spawns above enemies, animates upward, and fades out over 1 second",
    category: "feedback",
  },
  {
    text: "Create a quest tracker panel anchored to the right side of the screen showing up to 3 active objectives with checkboxes",
    category: "hud",
  },
  {
    text: "Create a tooltip popup that appears on hover over inventory items, showing item name, description, and stats in a styled panel",
    category: "inventory",
  },
  {
    text: "Create a radial ability wheel that opens on holding Q, showing 4 ability icons with cooldown overlays and keybind labels",
    category: "ability",
  },
  {
    text: "Create a crosshair that dynamically expands when moving and contracts when standing still, with hit-marker flash on damage",
    category: "hud",
  },
];

// ---------------------------------------------------------------------------
// Element type options for the dropdown
// ---------------------------------------------------------------------------

export interface UIElementTypeOption {
  value: string;
  label: string;
}

/**
 * Element type options for the element type selector dropdown.
 */
export const UI_ELEMENT_TYPES: UIElementTypeOption[] = [
  { value: "custom", label: "Custom (free-form)" },
  { value: "health_bar", label: "Health Bar" },
  { value: "button", label: "Button" },
  { value: "dialogue_box", label: "Dialogue Box" },
  { value: "inventory_slot", label: "Inventory Slot" },
  { value: "hud_layout", label: "HUD Layout" },
  { value: "minimap", label: "Minimap" },
  { value: "ability_bar", label: "Ability Bar" },
  { value: "tooltip", label: "Tooltip" },
  { value: "damage_number", label: "Damage Number" },
  { value: "quest_tracker", label: "Quest Tracker" },
  { value: "crosshair", label: "Crosshair" },
];

// ---------------------------------------------------------------------------
// Template prompts by element type × UI system
// ---------------------------------------------------------------------------

/**
 * Returns a template prompt for the given element type and UI system combination.
 * Falls back to a generic prompt if no specific template exists.
 *
 * @param elementType - The element type key (e.g. ``"health_bar"``).
 * @param uiSystem - The target UI system (``"ugui"`` or ``"uitoolkit"``).
 * @returns A complete, self-contained prompt string.
 *
 * @example
 * ```typescript
 * const prompt = getTemplatePrompt("health_bar", "ugui");
 * // Returns the uGUI health bar template prompt
 * ```
 */
export function getTemplatePrompt(elementType: string, uiSystem: UISystem): string {
  if (!elementType || elementType === "custom") return "";

  const action = UI_QUICK_ACTIONS.find((a) => a.elementType === elementType);
  if (!action) return `Create a ${elementType.replace(/_/g, " ")} UI element for Unity.`;

  if (uiSystem === "uitoolkit") {
    return action.prompt
      .replace(/uGUI/g, "UI Toolkit (UXML/USS)")
      .replace(/MonoBehaviour/g, "MonoBehaviour with UIDocument")
      .replace(/TMP_Text/g, "Label")
      .replace(/Image component/g, "VisualElement with background-image")
      .replace(/Slider component/g, "ProgressBar element");
  }

  return action.prompt;
}
