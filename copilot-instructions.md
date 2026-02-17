# GitHub Copilot Custom Instructions

This file provides comprehensive guidance for GitHub Copilot to generate code that follows modern best practices, clean architecture principles, and project-specific conventions for both backend (Python/FastAPI) and frontend (TypeScript/Vue/Tauri) components.

## Core Principles

Always adhere to these fundamental principles:

- **Clean Architecture**: Separate concerns into distinct layers (presentation, business logic, data access)
- **KISS (Keep It Simple, Stupid)**: Prefer simple, straightforward solutions over complex ones
- **Separation of Responsibilities**: Each module, class, and function should have a single, well-defined purpose
- **Single Responsibility Principle (SRP)**: A class or function should have only one reason to change
- **Modularity**: Design code as independent, reusable modules with clear interfaces
- **Object-Oriented Programming (OOP)**: Use classes and objects to encapsulate data and behavior
- **DRY (Don't Repeat Yourself)**: Avoid code duplication; extract common functionality
- **Intuitive Design**: Code should be self-documenting and easy to understand
- **Scalability**: Design for growth and change without major refactoring
- **Mandatory Validation**: Every agent action (creation, modification, etc.) MUST be validated with `pnpm check:all & pnpm test:all` before completion.

## Available Skills (Semantic Kernel)

- **UnityCodeSkill**: Provides Unity-aware code generation (`generate_unity_csharp`), syntax validation (`validate_unity_syntax`), and code extraction (`extract_csharp_code`).
- **UnityProjectSkill**: Secure file operations restricted to the output directory (`write_unity_asset`, `create_unity_folder`).
- **TextSkill**: Basic text manipulation like `trim_text`, `uppercase_text`, and `lowercase_text`.
- **TimeSkill**: Date and time operations including `get_current_time` and `format_date`.
- **MathSkill**: Basic mathematical operations like `add_numbers` and `multiply_numbers`.

### Frontend Technical Skills (Vue/TypeScript)

- **apiClient**: Unified API wrapper in `src/api/client.ts` for all backend communication (generation, prefs, jobs).
- **SmartField**: Versatile UI component in `src/components/generic/SmartField.vue` for consistent form inputs.
- **StatusBanner**: Standardized status and error reporting component in `src/components/StatusBanner.vue`.
- **TauriShell**: OS-level integration for opening files and folders via `@tauri-apps/api/shell`.

## Code Organization Guidelines

Keep HTML, CSS, and TypeScript code strictly separated, avoiding inline styles or logic whenever possible.

Split code into independent, focused files, ensuring each file has a single clear responsibility.

Maintain a clean, hierarchical, and intuitive folder structure, grouping related components, utilities, and assets together.

Ensure that components remain modular, reusable, and easy to navigate.

Prefer cohesive naming conventions and consistent file organization across the entire project.

When refactoring or creating new components, always prioritize:
- **Clarity**: Code should be easy to read and understand.
- **Maintainability**: Changes should be easy to implement without side effects.
- **Testability**: Code should be structured to allow easy unit testing.
- **Minimal Coupling**: Minimize dependencies between modules/components.

Use project instructions and rules files as definitive guidelines.

Use these skills when appropriate according to the task context. Be smart, mutatis mutandis.

## Function Writing Standards

When writing functions, **always** follow these requirements:

### Documentation
- Add descriptive JSDoc comments (for TypeScript/JavaScript) or docstrings (for Python) that explain:
  - What the function does
  - Parameters with types and descriptions
  - Return value with type and description
  - Any exceptions that may be raised
  - At least one example usage in comments

### Input Validation
- Validate all inputs at the function entry point
- Check for null/undefined/None values
- Validate types and ranges where applicable
- Provide clear error messages for invalid inputs

### Error Handling
- Use early returns for error conditions (fail fast)
- Prefer explicit error handling over silent failures
- Use appropriate exception types (Python) or error types (TypeScript)
- Log errors appropriately before raising/throwing

### Code Quality
- Use meaningful, descriptive variable names that convey intent
- Avoid abbreviations unless they're widely understood
- Keep functions focused and small (ideally < 50 lines)
- Prefer composition over inheritance
- Use type hints/annotations for all function signatures

### Example Function Template

**Python:**
```python
def process_user_data(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process user data and return normalized result.

    Args:
        user_id: Unique identifier for the user. Must be non-empty string.
        data: Dictionary containing user data fields. Must contain 'name' and 'email' keys.

    Returns:
        Dictionary with processed user data including normalized fields.

    Raises:
        ValueError: If user_id is empty or data is missing required fields.
        TypeError: If user_id is not a string or data is not a dictionary.

    Example:
        >>> process_user_data("user123", {"name": "John", "email": "john@example.com"})
        {'id': 'user123', 'name': 'John', 'email': 'john@example.com', 'normalized': True}
    """
    if not isinstance(user_id, str) or not user_id:
        raise ValueError("user_id must be a non-empty string")

    if not isinstance(data, dict):
        raise TypeError("data must be a dictionary")

    if "name" not in data or "email" not in data:
        raise ValueError("data must contain 'name' and 'email' keys")

    # Process data...
    return {"id": user_id, **data, "normalized": True}
```

**TypeScript:**
```typescript
/**
 * Process user data and return normalized result.
 *
 * @param userId - Unique identifier for the user. Must be non-empty string.
 * @param data - Object containing user data fields. Must contain 'name' and 'email' properties.
 * @returns Object with processed user data including normalized fields.
 * @throws {Error} If userId is empty or data is missing required fields.
 *
 * @example
 * ```typescript
 * const result = processUserData("user123", { name: "John", email: "john@example.com" });
 * // Returns: { id: "user123", name: "John", email: "john@example.com", normalized: true }
 * ```
 */
function processUserData(
  userId: string,
  data: { name: string; email: string }
): { id: string; name: string; email: string; normalized: boolean } {
  if (!userId || typeof userId !== "string") {
    throw new Error("userId must be a non-empty string");
  }

  if (!data?.name || !data?.email) {
    throw new Error("data must contain 'name' and 'email' properties");
  }

  // Process data...
  return { id: userId, ...data, normalized: true };
}
```

## Backend Guidelines (Python/FastAPI)

### Architecture Patterns

- **Layered Architecture**: 
  - `app/main.py`: API routes and request handling (presentation layer)
  - `app/schemas.py`: Pydantic models for request/response validation
  - `app/agent_manager.py`: Business logic orchestration
  - `agents/`: Domain-specific agent implementations
  - `services/`: Provider wrappers and external service integrations
  - `app/db.py`: Data access layer for SQLite
  - `app/config.py`: Configuration management

- **Dependency Injection**: Pass dependencies (like API keys, database connections) as parameters rather than accessing globals

- **Provider Pattern**: Use abstraction layers (like `services/*_provider.py`) to decouple business logic from external APIs

### Code Organization

- **Module Structure**: Each module should have a single, clear responsibility
- **Import Organization**: Group imports: standard library, third-party, local (with blank lines between groups)
- **Class Design**: Use classes to encapsulate state and behavior; prefer composition over inheritance
- **Error Handling**: Use FastAPI's exception handlers for consistent error responses

### FastAPI Specific

- **Route Handlers**: Keep route handlers thin; delegate business logic to service/agent layers
- **Request Validation**: Use Pydantic models for all request/response schemas
- **Response Models**: Always define response models using Pydantic BaseModel
- **Error Responses**: Use consistent error response format (see `schemas.py` for `error_response` helper)
- **Async/Await**: Use async functions for I/O-bound operations (database, HTTP requests)

### Python Best Practices

- **Type Hints**: Use type hints for all function signatures, parameters, and return types
- **Docstrings**: Follow Google or NumPy docstring style
- **Logging**: Use Python's `logging` module with appropriate log levels (DEBUG, INFO, WARNING, ERROR)
- **Constants**: Define constants at module level using UPPER_CASE
- **Path Handling**: Use `pathlib.Path` instead of string paths
- **Environment Variables**: Load configuration from environment variables with sensible defaults

### Example Backend Code Pattern

```python
import logging
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from app.schemas import error_response, ok_response
from app.agent_manager import AgentManager

LOGGER = logging.getLogger(__name__)
agent_manager = AgentManager()


class GenerateRequest(BaseModel):
    """Request model for code generation."""
    prompt: str = Field(..., description="Generation prompt", min_length=1)
    provider: Optional[str] = Field(None, description="Optional provider override")
    options: Dict[str, Any] = Field(default_factory=dict, description="Provider-specific options")


async def generate_code_endpoint(request: GenerateRequest) -> GenerationResponse:
    """
    Generate code using the specified agent.

    Args:
        request: Validated generation request containing prompt and options.

    Returns:
        GenerationResponse with success status and generated content or error.

    Example:
        POST /generate/code
        {
            "prompt": "Create a Unity MonoBehaviour script",
            "provider": "openai",
            "options": {"model": "gpt-4o-mini"}
        }
    """
    if not request.prompt or len(request.prompt.strip()) == 0:
        return error_response("Prompt cannot be empty")

    try:
        result = agent_manager.run_code(
            prompt=request.prompt,
            provider=request.provider,
            options=request.options
        )
        return ok_response(result)
    except RuntimeError as e:
        LOGGER.error(f"Code generation failed: {e}")
        return error_response(str(e))
    except Exception as e:
        LOGGER.exception("Unexpected error during code generation")
        return error_response("Internal server error")
```

## Frontend Guidelines (TypeScript/Vue/Tauri)

### Architecture Patterns

- **Component-Based Architecture**: Break UI into small, reusable Vue components
- **Separation of Concerns**:
  - `components/`: Presentational components (UI only)
  - `api/`: API client layer (HTTP communication)
  - `App.vue`: Main application shell and routing logic
- **State Management**: Use Vue's reactive refs/composables for local state; avoid global state unless necessary
- **Type Safety**: Leverage TypeScript's type system; avoid `any` types

### Vue 3 Composition API

- **Script Setup**: Use `<script setup lang="ts">` syntax for all components
- **Reactivity**: Use `ref()` for primitive values, `reactive()` for objects (prefer `ref` for consistency)
- **Composables**: Extract reusable logic into composables (functions returning reactive state)
- **Props**: Define props with TypeScript interfaces and `defineProps<T>()`
- **Emits**: Define emits with TypeScript types using `defineEmits<T>()`
- **Lifecycle**: Use composition API lifecycle hooks (`onMounted`, `onUnmounted`, etc.)

### TypeScript Best Practices

- **Type Definitions**: Define interfaces/types for all data structures
- **Strict Mode**: Enable strict TypeScript checking
- **Type Inference**: Let TypeScript infer types where possible, but be explicit for public APIs
- **Null Safety**: Use optional chaining (`?.`) and nullish coalescing (`??`) appropriately
- **Async/Await**: Prefer async/await over Promise chains for readability

### API Client Pattern

- **Centralized Client**: Keep all API calls in `api/client.ts`
- **Type Safety**: Define request/response types matching backend schemas
- **Error Handling**: Handle errors consistently; provide user-friendly error messages
- **Response Validation**: Validate API responses match expected types

### Component Structure

- **Template**: Keep templates simple; move complex logic to script section
- **Styling**: Use scoped styles; prefer CSS Grid/Flexbox for layouts
- **Accessibility**: Include proper ARIA labels and semantic HTML
- **Performance**: Use `v-if` vs `v-show` appropriately; avoid unnecessary re-renders

### Example Frontend Code Pattern

```typescript
<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { GenerationRequest, GenerationResponse } from "../api/client";
import { generateCode } from "../api/client";
import StatusBanner from "./StatusBanner.vue";

interface CodePanelState {
  prompt: string;
  provider: string;
  model: string;
  status: string | null;
  tone: "ok" | "error";
  result: string;
}

const prompt = ref<string>("");
const provider = ref<string>("");
const model = ref<string>("");
const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const result = ref<string>("");

/**
 * Validates the prompt input before submission.
 *
 * @param promptValue - The prompt string to validate.
 * @returns True if valid, false otherwise.
 *
 * @example
 * ```typescript
 * if (!validatePrompt(prompt.value)) {
 *   status.value = "Prompt cannot be empty";
 *   return;
 * }
 * ```
 */
function validatePrompt(promptValue: string): boolean {
  if (!promptValue || promptValue.trim().length === 0) {
    return false;
  }
  return promptValue.trim().length >= 3;
}

/**
 * Generates code using the backend API.
 * Updates status and result refs based on the response.
 *
 * @example
 * ```typescript
 * await run();
 * // Updates status.value and result.value based on API response
 * ```
 */
async function run(): Promise<void> {
  if (!validatePrompt(prompt.value)) {
    tone.value = "error";
    status.value = "Prompt must be at least 3 characters";
    return;
  }

  status.value = "Generating code...";
  tone.value = "ok";

  try {
    const request: GenerationRequest = {
      prompt: prompt.value.trim(),
      provider: provider.value || undefined,
      options: model.value ? { model: model.value } : undefined,
    };

    const response: GenerationResponse = await generateCode(request);

    if (!response.success) {
      tone.value = "error";
      status.value = response.error || "Failed to generate code";
      return;
    }

    status.value = "Code generated successfully";
    result.value = String(response.data?.content || "");
  } catch (error) {
    tone.value = "error";
    status.value = error instanceof Error ? error.message : "Unknown error occurred";
  }
}

onMounted(() => {
  // Initialize component state if needed
});
</script>

<template>
  <div class="panel">
    <h2>Unity C# Code</h2>
    <StatusBanner :status="status" :tone="tone" />
    <!-- Rest of template -->
  </div>
</template>

<style scoped>
/* Component-specific styles */
</style>
```

## Project-Specific Conventions

### Backend

- **Agent Pattern**: Agents in `agents/` should have a `run(prompt, provider, options, api_keys)` signature
- **Provider Selection**: Use `services/provider_select.py` pattern for provider fallback logic
- **Response Format**: Always return `GenerationResponse` with `success`, `date`, `error`, and `data` fields
- **API Keys**: Load API keys via `app/config.py` functions; never hardcode keys
- **Unity Projects**: Use `app/unity_project.py` utilities for creating Unity project structures

### Frontend

- **Panel Components**: Each generation type (Code, Text, Image, Audio) should have its own panel component
- **Status Banner**: Use `StatusBanner` component for consistent status/error display
- **API Client**: All backend communication goes through `api/client.ts` functions
- **Backend URL**: Store backend URL in localStorage with fallback to `http://127.0.0.1:8000`

### Testing

- **Backend Tests**: Use pytest; place tests in `backend/tests/`
- **Frontend Tests**: Use Vitest for unit tests; Playwright for E2E tests
- **Test Naming**: Use descriptive test names that explain what is being tested
- **Test Structure**: Follow Arrange-Act-Assert pattern
- **Validation**: Always run `pnpm check:all & pnpm test:all` to verify changes across the entire monorepo.

## Unified Quality Control (Global package.json)

The project root contains a global `package.json` that provides unified scripts for maintaining quality across both frontend and backend. Always prefer these commands for validation:

- `pnpm check:all`: Runs linting, typechecking, and tests for both stacks.
- `pnpm test:all`: Runs all backend and frontend tests.
- `pnpm lint:all`: Runs linting for both stacks.
- `pnpm typecheck:all`: Runs typechecking for both stacks.

## Code Review Checklist

When generating code, ensure:

- [ ] Functions have comprehensive documentation (JSDoc/docstrings)
- [ ] Input validation is present and thorough
- [ ] Early returns are used for error conditions
- [ ] Variable names are descriptive and meaningful
- [ ] Example usage is included in comments
- [ ] Type hints/annotations are complete
- [ ] Error handling is appropriate and consistent
- [ ] Code follows single responsibility principle
- [ ] No code duplication (DRY principle)
- [ ] Code is simple and intuitive (KISS principle)
- [ ] Architecture layers are respected (separation of concerns)
- [ ] Changes are validated with `pnpm check:all & pnpm test:all`
- [ ] Backend uses Pydantic models for validation
- [ ] Frontend uses TypeScript types for type safety
- [ ] Logging is appropriate (backend) or error messages are user-friendly (frontend)

## Additional Best Practices

### Performance

- **Backend**: Use async/await for I/O operations; avoid blocking the event loop
- **Frontend**: Debounce user input for API calls; use loading states appropriately
- **Caching**: Consider caching for expensive operations (but keep it simple)

### Security

- **API Keys**: Never commit API keys; use environment variables or local config files
- **Input Sanitization**: Validate and sanitize all user inputs
- **Error Messages**: Don't expose sensitive information in error messages

### Maintainability

- **Comments**: Write comments that explain "why", not "what" (code should be self-documenting)
- **Refactoring**: Prefer small, incremental refactorings over large rewrites
- **Documentation**: Keep documentation up-to-date with code changes

### Consistency

- **Naming**: Follow project naming conventions (snake_case for Python, camelCase for TypeScript)
- **Formatting**: Use consistent code formatting (Black for Python, Prettier for TypeScript)
- **File Structure**: Follow existing project structure patterns

---

**Remember**: The goal is to write code that is clean, maintainable, scalable, and easy to understand. When in doubt, choose the simpler solution that follows these principles.

Remove whitespace from blank lines. Always validate with `pnpm check:all` before finalizing any code changes.