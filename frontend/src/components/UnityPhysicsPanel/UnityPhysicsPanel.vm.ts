/**
 * View-model for {@link UnityPhysicsPanel.vue}.
 *
 * Keeps presentation-only logic out of the SFC: i18n handle, select options,
 * and quick-action handlers. Domain state and API calls stay in
 * {@link useUnityPhysicsPanel} (UnityPhysicsPanel.ts).
 *
 * Layout for this feature folder:
 * - `UnityPhysicsPanel.vue` — template + component imports + thin `<script setup>`
 * - `UnityPhysicsPanel.vm.ts` — this file (view-model composable)
 * - `UnityPhysicsPanel.ts` — data / generation composable
 * - `UnityPhysicsPanel.css` — scoped styles (linked from the SFC)
 */

import { useI18n } from "vue-i18n";
import { useUnityPhysicsPanel, PHYSICS_QUICK_ACTIONS } from "./UnityPhysicsPanel";

export type { PhysicsAgentResult } from "./UnityPhysicsPanel";

/** Label/value pairs for physics backend and simulation mode selects. */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Composable that wires i18n and UI-only options on top of {@link useUnityPhysicsPanel}.
 *
 * @returns Everything the panel template needs: `t`, core refs, option lists, and handlers.
 *
 * @example
 * ```ts
 * const vm = useUnityPhysicsPanelViewModel();
 * // use vm.t, vm.prompt, vm.run, … in template
 * ```
 */
export function useUnityPhysicsPanelViewModel() {
  const { t } = useI18n();
  const core = useUnityPhysicsPanel();

  const physicsBackendOptions: SelectOption[] = [
    { value: "physx", label: "PhysX (Built-in)" },
    { value: "dots", label: "DOTS Physics (ECS)" },
  ];

  const simulationModeOptions: SelectOption[] = [
    { value: "fixed_update", label: "FixedUpdate (recommended)" },
    { value: "update", label: "Update (kinematic)" },
    { value: "script", label: "Script-driven (Physics.Simulate)" },
  ];

  const gravityPresetOptions: SelectOption[] = [
    { value: "", label: "None (let LLM decide)" },
    { value: "earth", label: "Earth (9.81 m/s²)" },
    { value: "moon", label: "Moon (1.62 m/s²)" },
    { value: "zero_g", label: "Zero-G (space)" },
    { value: "low", label: "Low gravity (3.0 m/s²)" },
    { value: "high", label: "High gravity (20.0 m/s²)" },
  ];

  /**
   * Applies a quick-action chip: sets prompt and optional gravity preset.
   */
  function handleQuickActionClick(action: (typeof PHYSICS_QUICK_ACTIONS)[number]): void {
    if (!action?.prompt) return;
    core.prompt.value = action.prompt;
    if (action.gravityPreset) core.gravityPreset.value = action.gravityPreset;
  }

  return {
    t,
    ...core,
    physicsBackendOptions,
    simulationModeOptions,
    gravityPresetOptions,
    handleQuickActionClick,
  };
}
