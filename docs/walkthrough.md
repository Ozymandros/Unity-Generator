# Incremental Project Generation & Universal System Prompts

This document outlines the major refactoring to an incremental, asset-focused workflow and the implementation of universal system prompt support across all AI generation features.

## 1. Incremental Project Generation Workflow

The Unity Generator has transitioned from a monolithic "single-click" generation to an incremental workflow. This allows users to build their project piece by piece, refining individual assets before finalizing.

### Key Features

- **Project Scaffolding**: Create the base Unity project structure (folder hierarchy and project settings) once.
- **Active Project Store**: A global, reactive Vue store (`projectStore`) tracks the current project workspace. This state persists across sessions via `localStorage`.
- **Integrated Asset Panels**: Code, Text, Image, Audio, and Sprites panels are now "project-aware." When a project is active, you can toggle **"Auto-save to project"** to automatically place generated files in the correct `Assets/` subfolder.
- **Smart Asset Saving**:
  - **Scripts**: Saved to `Assets/Scripts/` with AI-suggested filenames.
  - **Text**: Saved to `Assets/Text/`.
  - **Images/Sprites**: Saved to `Assets/Sprites/`.
  - **Audio**: Saved to `Assets/Audio/`.
  - **Metadata**: Unity `.meta` files are generated automatically for every asset.
- **Background Finalization**: Use the "Finalize with Unity Engine" step to batch process the project (UPM packages, scene setup, URP config) using a headless Unity Editor.

## 2. Universal System Prompts

Implemented a robust system for providing high-level instructions to AI agents, ensuring consistent behavior and developer-controlled guardrails.

### Hierarchy & Fallbacks

1. **Local Override**: Set a specific system prompt directly in any asset generation panel.
2. **Global Preference**: Defined in the Settings panel for each asset type (Code, Text, Image, Audio).
3. **Hardcoded Defaults**: Sensible defaults established in the backend if no other prompts are provided.

### Provider Integration

- **LLM**: Formally uses the `system` role.
- **Non-System Providers**: For image and audio providers that don't support a separate system role, instructions are intelligently prepended to the user prompt.

## 3. Mandatory Validation & Quality Control

To ensure codebase stability, a strict validation policy is enforced.

- **Unified Check**: The global command `pnpm check:all` runs:
  1. `lint:all`: Python (Ruff) and Frontend (ESLint) linting.
  2. `typecheck:all`: Backend (`pyright`) and Frontend (`tsc`) static analysis.
  3. `test:all`: Full unit test suite (Pytest + Vitest).
- **Environment Stability**: The `projectStore` includes safety checks to ensure `localStorage` dependency doesn't break headless test environments.

## Verification Summary

### Automated Tests

- ✅ **Backend Tests**: 161 tests passed (including incremental saving and sprite generation).
- ✅ **Frontend Tests**: 61 tests passed (including project store and panel integrations).
- ✅ **Type Checking**: 0 errors found by Pyright and TSC.
- ✅ **Linting**: All files pass Ruff and ESLint rules.

### Manual Finalization

- ✅ **Project Scaffolding**: Verified creation of valid Unity projects.
- ✅ **Asset Injection**: Verified that scripts, images, and audio are correctly placed and recognizable by the Unity Editor.
- ✅ **Meta Generation**: Verified GUID/YAML structure of generated `.meta` files.
