# Cursor Rules

This directory contains Cursor rules that guide AI code generation for the Unity Generator project. Rules are organized by scope and apply automatically based on file patterns or context.

## Rule Structure

### Always Apply Rules

These rules apply to every chat session:

- **`core-principles.mdc`**: Core software engineering principles (clean architecture, KISS, SRP, modularity, OOP, DRY)
- **`function-standards.mdc`**: Function writing standards (JSDoc/docstrings, input validation, early returns, meaningful names, examples)

### Backend Rules

Apply to Python/FastAPI files (`backend/**/*.py`, `services/**/*.py`, `agents/**/*.py`):

- **`backend/python-fastapi.mdc`**: Python/FastAPI guidelines, architecture patterns, best practices
- **`backend/project-conventions.mdc`**: Project-specific backend conventions (agent patterns, provider selection, response formats)

### Frontend Rules

Apply to TypeScript/Vue files (`frontend/src/**/*.ts`, `frontend/src/**/*.vue`):

- **`frontend/typescript-vue.mdc`**: TypeScript/Vue 3 Composition API guidelines, component patterns
- **`frontend/project-conventions.mdc`**: Project-specific frontend conventions (panel components, API client patterns)

### Manual Rules

Apply when explicitly mentioned in chat (e.g., `@code-review-checklist`):

- **`code-review-checklist.mdc`**: Code review checklist for ensuring code quality

## How Rules Work

- **Always Apply**: Included in every chat session automatically
- **Apply Intelligently**: Cursor decides when rules are relevant based on description and file context
- **Apply to Specific Files**: Rules activate when editing files matching the `globs` patterns
- **Apply Manually**: Mention rules in chat using `@rule-name` to activate them

## Rule Format

Rules use frontmatter metadata to control application:

```markdown
---
description: "Brief description for intelligent application"
globs:
  - "backend/**/*.py"
alwaysApply: false
---

# Rule Content
...
```

## Best Practices

- Rules are focused and actionable (under 500 lines each)
- Rules reference existing code using `@filename` syntax
- Rules provide concrete examples
- Rules follow project-specific patterns

## Related Files

- **`copilot-instructions.md`**: GitHub Copilot instructions (similar content, different format)
- **`docs/ARCHITECTURE.md`**: Project architecture documentation
- **`docs/DEVELOPMENT.md`**: Development guidelines
