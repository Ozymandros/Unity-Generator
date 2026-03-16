import { ref } from "vue";
import type { MediaImport } from "@/constants/unityPrompts";
import { validateMediaImport } from "@/utils/mediaValidation";

/**
 * Shared state for media import workflow between panels.
 * Enables ImagePanel and AudioPanel to pass media data to ScenesPanel
 * without using router query parameters.
 * 
 * State management: follows Vue's "global state from a Composable" pattern — refs at module scope
 * so all callers share the same reactive state. See https://vuejs.org/guide/scaling-up/state-management.html
 */

// Shared module-level state
const pendingMediaImport = ref<MediaImport | null>(null);
const pendingPrompt = ref<string>("");

/**
 * Composable for managing media import state across panels.
 * Provides methods to set and clear pending media imports.
 * 
 * @returns Object with media import state and management functions
 * 
 * @example
 * ```typescript
 * // In ImagePanel: Set media import and navigate
 * const { setPendingMediaImport } = useMediaImport();
 * setPendingMediaImport(
 *   { data: imageData, name: "Texture", type: "image", textureType: "Sprite" },
 *   "Import this texture..."
 * );
 * setActive("Scenes");
 * 
 * // In ScenesPanel: Check for pending import
 * const { pendingMediaImport, pendingPrompt, clearPendingMediaImport } = useMediaImport();
 * if (pendingMediaImport.value) {
 *   prompt.value = pendingPrompt.value;
 *   // Include media in request...
 *   clearPendingMediaImport();
 * }
 * ```
 */
export function useMediaImport() {
  /**
   * Set pending media import data and prompt.
   * Call this before navigating to ScenesPanel to pass media data.
   * Validates media data for security and integrity before storing.
   * 
   * @param mediaImport - Media import data including base64 data, name, type, and format
   * @param prompt - Pre-filled prompt text for Unity import instructions
   * 
   * @throws {Error} If mediaImport is null or missing required fields
   * @throws {Error} If media data validation fails (invalid base64, media type, file name, or size)
   * 
   * @example
   * ```typescript
   * setPendingMediaImport(
   *   {
   *     data: "data:image/png;base64,iVBORw0KG...",
   *     name: "PlayerTexture",
   *     type: "image",
   *     textureType: "Sprite"
   *   },
   *   "Import this generated image as a Unity texture..."
   * );
   * ```
   */
  function setPendingMediaImport(mediaImport: MediaImport, prompt: string): void {
    if (!mediaImport) {
      throw new Error("mediaImport cannot be null");
    }
    
    if (!mediaImport.data || !mediaImport.name || !mediaImport.type) {
      throw new Error("mediaImport must contain data, name, and type");
    }
    
    if (!prompt || !prompt.trim()) {
      throw new Error("prompt cannot be empty");
    }
    
    // Validate media data for security and integrity
    const validation = validateMediaImport(
      mediaImport.data,
      mediaImport.name,
      mediaImport.type
    );
    
    if (!validation.isValid) {
      throw new Error(`Media validation failed: ${validation.error}`);
    }
    
    pendingMediaImport.value = mediaImport;
    pendingPrompt.value = prompt;
  }
  
  /**
   * Clear pending media import data.
   * Call this after successfully processing the media import.
   * 
   * @example
   * ```typescript
   * // After successful scene generation with media
   * clearPendingMediaImport();
   * ```
   */
  function clearPendingMediaImport(): void {
    pendingMediaImport.value = null;
    pendingPrompt.value = "";
  }
  
  /**
   * Check if there is a pending media import.
   * 
   * @returns True if media import is pending, false otherwise
   * 
   * @example
   * ```typescript
   * if (hasPendingMediaImport()) {
   *   // Show info banner
   * }
   * ```
   */
  function hasPendingMediaImport(): boolean {
    return pendingMediaImport.value !== null;
  }
  
  return {
    pendingMediaImport,
    pendingPrompt,
    setPendingMediaImport,
    clearPendingMediaImport,
    hasPendingMediaImport
  };
}
