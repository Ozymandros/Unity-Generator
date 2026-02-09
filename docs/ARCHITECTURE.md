# Architecture Overview

The system is split into a lightweight desktop UI (Tauri + Vue) and a local
Python backend (FastAPI + Semantic Kernel). The backend orchestrates modular
agents that call cloud AI providers using user-supplied API keys.

## Data Flow

1. User configures API keys and preferences in the UI.
2. UI calls backend HTTP endpoints for generation tasks.
3. Backend routes requests to appropriate agent.
4. Agent calls provider wrappers (LLM/image/audio).
5. Backend returns a unified response format to the UI.
