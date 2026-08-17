<!-- Generated: 2026-04-03 -->
# Frontend UI Panels — Comprehensive Inventory

This document is a polished, easy-to-scan inventory of the frontend UI panels, controls, icons, behaviors, and the backend endpoints they call. It's intended as a single reference for QA, test authoring, or developer onboarding.

Quick facts
- Location: [FRONTEND_UI_PANELS.md](FRONTEND_UI_PANELS.md)
- Source: frontend code, i18n labels, Playwright tests, API client wrappers
- Generated: 2026-04-03

## Table of contents
- [Navigation](#navigation)
- [Common primitives & patterns](#common-primitives--patterns)
- Panels
  - [Settings](#panel-settings)
  - [Scenes](#panel-scenes)
  - [Code](#panel-code)
  - [Text](#panel-text)
  - [Image](#panel-image)
  - [Sprites](#panel-sprites)
  - [Audio](#panel-audio)
  - [Unity UI](#panel-unity-ui)
  - [Unity Physics](#panel-unity-physics)
  - [Unity Project](#panel-unity-project)
  - [Management / Provider Dashboard](#management--provider--model-dashboard)
- [API mappings](#api-mappings)
- [Tests & selector strategy](#tests--selector-strategy)
- [How to use this report](#how-to-use-this-report)
- [Change log](#change-log)

---

## Navigation

- App shell and tab icons are defined in [frontend/src/App.setup.ts](frontend/src/App.setup.ts#L1-L200) and rendered in [frontend/src/App.vue](frontend/src/App.vue#L1-L200).
- Stable nav test ids: `nav-{Tab-Name}` (e.g. `nav-Code`, `nav-Text`) — used across Playwright tests for stable navigation.

---

## Common primitives & patterns

- `SmartField` — generic labeled input component. Files:
  - [frontend/src/components/generic/SmartField/SmartField.vue](frontend/src/components/generic/SmartField/SmartField.vue#L1-L200)
  - [frontend/src/components/generic/SmartField/SmartField.ts](frontend/src/components/generic/SmartField/SmartField.ts#L1-L200)
  - Types: supports `text`, `password`, `textarea`, `select`, `checkbox`, `number`.
- `StatusBanner` — shared status UI used to display success/error messages: [frontend/src/components/StatusBanner.vue](frontend/src/components/StatusBanner.vue#L1-L200).
- Iconography: Material Design Icons (`mdi-*`) across nav, chips, and buttons.

Tips for readers
- When mapping UI → tests, prefer label-based queries for inputs and `data-testid` only for the nav. SmartField labels come from i18n keys in [frontend/src/i18n/locales/en.ts](frontend/src/i18n/locales/en.ts#L1-L400).

---

## Panel: Settings

[Component: frontend/src/components/SettingsPanel/SettingsPanel.vue](frontend/src/components/SettingsPanel/SettingsPanel.vue#L1-L300)

Quick summary: configure backend URL, preferred providers/models, API keys, and user preferences.

UI elements
- `Backend URL` — `general.fields.backendUrl` — text input (`SmartField`)
- `Output Base Path` — `general.fields.outputBasePath` — text input
- Preferred Provider/Model selects — `general.fields.preferredIntelligence`, `general.fields.preferredLlm` — `select`
- Save Actions — `general.actions.saveAll` — `v-btn`

Behavior & backend
- Uses management endpoints via [frontend/src/api/client.ts](frontend/src/api/client.ts): `getAllConfig`, `saveProvider`, `saveApiKey`, `getPref`, `setPref`.

Tests
- Covered by management and settings unit/e2e tests in `frontend/src/__tests__` and `frontend/tests/e2e`.

---

## Panel: Scenes (Scene Creator)

[Component: frontend/src/components/ScenesPanel.vue](frontend/src/components/ScenesPanel.vue#L1-L240)

Quick summary: create and preview Unity scenes; integrates with media import flows.

UI elements
- `Scene Description` — `scenes.fields.prompt` — `SmartField` `textarea`
- `Provider` / `Model` — `select`
- `Temperature` — preset `select`
- `Create Scene` — triggers `createScene()` → `/api/scenes/create`

Behavior
- Can receive media from Image/Audio panels via `useMediaImport` and pre-fill prompts.

Tests
- Unit and compatibility tests: `ScenesPanel.spec.ts` and e2e scenarios.

---

## Panel: Code (Unity C# Code)

[Component: frontend/src/components/CodePanel/CodePanel.vue](frontend/src/components/CodePanel/CodePanel.vue#L1-L240)

Quick summary: generate C# scripts; includes max tokens, system prompt, provider/model selection.

UI elements
- `Prompt` — `code.fields.prompt` (`SmartField` textarea)
- `Max tokens` — `code.fields.maxTokens` (`SmartField` number)
- `Generate` — `generateCode()` → `/generate/code`

Tests
- `CodePanel.spec.ts` asserts SmartField wiring and generation invocation.

---

## Panel: Text

[Component: frontend/src/components/TextPanel/TextPanel.vue](frontend/src/components/TextPanel/TextPanel.vue#L1-L200)

Quick summary: free-form text generation with length presets and model selection.

UI elements
- `Prompt` — `SmartField` textarea
- `Length` — `text.fields.length` select
- `Generate` — `generateText()` → `/generate/text`

---

## Panel: Image

[Component: frontend/src/components/ImagePanel/ImagePanel.vue](frontend/src/components/ImagePanel/ImagePanel.vue#L1-L220)

Quick summary: generate images with aspect ratios, quality, and Unity-specific metadata.

UI elements
- `Prompt` — `SmartField` textarea
- `Aspect Ratio` — `image.fields.aspectRatio` (`ASPECT_RATIOS`)
- `Quality` — `image.fields.quality`
- `Texture Name` / `Texture Type` — Unity metadata inputs
- `Generate` — `generateImage()` → `/generate/image`
- `Save to Unity` — hands generated assets to `ScenesPanel` via `useMediaImport`

Tests
- ImagePanel unit and integration tests; export/import flows are asserted in e2e.

---

## Panel: Sprites

[Component: frontend/src/components/SpritesPanel/SpritesPanel.vue](frontend/src/components/SpritesPanel/SpritesPanel.vue#L1-L220)

Quick summary: generate pixel/2D sprites with palette controls and export options.

UI elements
- `Prompt`, `Resolution`, `Palette Size`, `Auto-Crop` — SmartField inputs
- `Generate` — `generateSprites()` → `/generate/sprites`

---

## Panel: Audio

[Component: frontend/src/components/AudioPanel/AudioPanel.vue](frontend/src/components/AudioPanel/AudioPanel.vue#L1-L240)

Quick summary: generate speech/music clips with voice/model selection and Unity export.

UI elements
- `Generation Type` (audio/music), `Prompt`, `Voice`, `Format`, `Stability`
- `Generate` — `generateAudio()` → `/generate/audio`
- `Save to Unity` — imports audio into Scenes

---

## Panel: Unity UI

[Component: frontend/src/components/UnityUIPanel/UnityUIPanel.vue](frontend/src/components/UnityUIPanel/UnityUIPanel.vue#L1-L260)

Quick summary: generate Unity UI prefabs (buttons, HUDs, dialogs) from high-level prompts and templates.

UI elements
- `UI System`, `Element Type` (from `UI_ELEMENT_TYPES`), `Prompt`, `Output Format`, `Anchor Preset`, `Color Theme`, `Include Animations`
- Quick-action chips (`UI_QUICK_ACTIONS`) that prefill the prompt; icons use `mdi-*` tokens.
- `Generate` — `generateUnityUI()` → `/generate/unity-ui`

---

## Panel: Unity Physics

[Component: frontend/src/components/UnityPhysicsPanel/UnityPhysicsPanel.vue](frontend/src/components/UnityPhysicsPanel/UnityPhysicsPanel.vue#L1-L260)

Quick summary: generate physics configurations (rigidbodies, colliders, gravity presets, ragdolls, vehicles).

UI elements
- Quick-action chips (`PHYSICS_QUICK_ACTIONS`) to inject templates
- `Physics Backend`, `Simulation Mode`, `Gravity Preset`, prompt textarea, include checkboxes for rigidbodies/colliders/layers
- `Generate` — `generateUnityPhysics()` → `/generate/unity-physics`

---

## Panel: Unity Project

[Component: frontend/src/components/UnityProjectPanel/UnityProjectPanel.vue](frontend/src/components/UnityProjectPanel/UnityProjectPanel.vue#L1-L260)

Quick summary: scaffolds a complete Unity project, supports finalize/download.

UI elements
- `Project Name`, `Unity Template`, `Unity Version` (from backend `/unity-versions`), `Target Platform`, checkboxes for scenes/UPM/URP
- `Generate` → `generateUnityProject()` → `/generate/unity-project`
- Finalize workflow: `finalizeProject()` + `getFinalizeJobStatus()` + `downloadFinalizedProject()` (see [frontend/src/api/client.ts](frontend/src/api/client.ts)).

---

## Management / Provider & Model Dashboard

[Component: frontend/src/components/ManagementDashboard.vue](frontend/src/components/ManagementDashboard.vue#L1-L260)

Summary: register providers/models, manage API keys, and system prompts.

Key endpoints
- `/api/management/providers`, `/api/management/models/:provider`, `/api/management/keys`, `/api/management/prompts` — used by the management UI.

---

## API mappings

- Generation endpoints (see client wrappers in [frontend/src/api/client.ts](frontend/src/api/client.ts)):
  - `/generate/code` — `generateCode()`
  - `/generate/text` — `generateText()`
  - `/generate/image` — `generateImage()`
  - `/generate/audio` — `generateAudio()`
  - `/generate/sprites` — `generateSprites()`
  - `/generate/unity-ui` — `generateUnityUI()`
  - `/generate/unity-project` — `generateUnityProject()`
  - `/generate/unity-physics` — `generateUnityPhysics()`

---

## Tests & selector strategy

- Playwright e2e: prefer `data-testid` for nav, otherwise use role/label queries. Example: `[data-testid="nav-Code"]` in [frontend/tests/e2e/app.spec.ts](frontend/tests/e2e/app.spec.ts#L120-L240).
- Unit tests: assert `SmartField` props/labels; components are tested in `frontend/src/__tests__/`.

---

## How to use this report

1. Open a panel section and follow the `Component:` link to jump to source.
2. Use the API mappings to correlate UI actions with backend endpoints (helpful for mocks and tests).
3. Ask me to: export a CSV/JSON with every `SmartField` occurrence and exact file/line references, or generate a spreadsheet for QA.

---

## Change log
- 2026-04-03 — Created initial comprehensive inventory and polished layout.

---

End of report.
