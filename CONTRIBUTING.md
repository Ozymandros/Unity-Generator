# Contributing to Unity-Generator

Thank you for your interest in contributing! This document outlines the process and guidelines for contributing to the Unity-Generator project.

## Cross-Platform Support

This project is designed to run on **Windows**, **Linux**, and **macOS**. All contributions must maintain cross-platform compatibility.

### Platform-Specific Guidelines

#### Paths & File Operations

- **Always use `pathlib.Path`** for file operations in Python code
- **Never hardcode absolute paths** - use relative paths or environment variables
- For path normalization, use **`Path().as_posix()`** instead of manual string replacement
- Example:
  ```python
  from pathlib import Path
  
  # Good
  project_path = Path(request.project_path).as_posix()
  
  # Avoid
  path = request.project_path.replace("\\", "/")
  ```

#### Shell Scripts & Commands

- Use **cross-platform npm/pnpm scripts** defined in `package.json` rather than OS-specific shell scripts
- If OS-specific behavior is needed, detect the OS in code:
  ```python
  import platform
  if platform.system() == "Windows":
      # Windows-specific code
  ```
- For shell commands in CI/CD, use `bash` shell with cross-platform compatible commands

#### Environment Variables

- Document environment variables that affect behavior (e.g., `UNITY_EDITOR_PATH`)
- Provide platform-specific examples in documentation:
  - Windows: `C:\Program Files\Unity\Hub\Editor\...`
  - macOS: `/Applications/Unity/...`
  - Linux: `~/.config/Unity/...`

### Development Workflow

#### Local Development

**Setup (all platforms):**
```bash
pnpm run setup
```

**Backend Development:**
```bash
# Using pnpm (recommended - works on all platforms)
pnpm run backend:dev

# Or directly with Python (after creating .venv)
cd backend
<platform-specific venv activation>
python -m uvicorn app.main:app --reload --port 35421
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for full platform-specific venv activation instructions.

**Frontend Development:**
```bash
pnpm run dev
```

**Run All Checks (before submitting PR):**
```bash
pnpm run check:all
```

#### Docker Development

All platforms support Docker Compose testing:
```bash
docker-compose up
```

### Continuous Integration

The project uses GitHub Actions with **multi-OS matrix testing**:

- **Backend tests** run on: `ubuntu-latest`, `windows-latest`, `macos-latest`
- **Frontend tests** run on: `ubuntu-latest`, `windows-latest`, `macos-latest`
- **E2E tests** run on: `ubuntu-latest` only (Playwright-specific)

All three OS runners must pass before merging.

### Before Submitting a Pull Request

1. **Ensure all checks pass:**
   ```bash
   pnpm run check:all
   ```

2. **Test on multiple platforms** (if possible):
   - Run the development server on Windows, Linux, or macOS
   - Verify that path handling works correctly
   - Check that all pnpm scripts execute without errors

3. **Verify Docker support:**
   ```bash
   docker-compose up
   ```

4. **Check path handling:**
   - Avoid hardcoded absolute paths
   - Use relative paths or environment variables
   - Ensure cross-platform path handling in any new code

5. **Document platform-specific behavior:**
   - If a feature behaves differently on certain platforms, document it
   - Include examples for all supported platforms

## Code Quality Standards

- **Backend**: Follow PEP 8, use type hints, pass ruff lint and pyright checks
- **Frontend**: Use Vue 3 `<script setup>`, TypeScript, follow ESLint rules
- **Commits**: Write clear, descriptive commit messages
- **Comments**: Explain why, not what; code should be self-documenting

## Testing

- Every feature should include tests
- Tests must pass on all supported platforms in CI
- For OS-specific code, ensure tests cover the target platforms

## Questions?

If you have questions about cross-platform compatibility or contributing, please open an issue or discussion in the repository.

Thank you for helping make Unity-Generator better!
