# Testing Guide

This document describes the testing strategy and available test suites for Unity Generator.

## Test Types

### 1. Unit Tests (Frontend)
**Location**: `frontend/src/**/*.spec.ts`  
**Framework**: Vitest + Vue Test Utils  
**Purpose**: Test individual components and functions in isolation

**Run unit tests:**
```bash
pnpm --dir frontend test
pnpm --dir frontend test:watch    # Watch mode
pnpm --dir frontend test:coverage # With coverage
```

**Example**: `frontend/src/__tests__/UnityProjectPanel.spec.ts`

### 2. Smoke Tests (E2E - Development)
**Location**: `frontend/tests/e2e/smoke.spec.ts`  
**Framework**: Playwright  
**Purpose**: Verify critical path functionality in **development mode**

**What they test:**
- ✅ Application window opens
- ✅ Frontend loads successfully
- ✅ Backend health endpoint is reachable
- ✅ Backend discovery endpoint responds
- ✅ Complete request flow (FE → BE)
- ✅ Window dimensions and visibility
- ✅ Basic navigation works
- ✅ Direct API calls to backend

**Run smoke tests:**
```bash
pnpm --dir frontend test:smoke
```

**Duration**: ~30 seconds  
**When to run**: Before every commit, in CI pipelines

**⚠️ IMPORTANT**: All tests run in isolated development mode only. Tests do NOT test production/installed apps.

### 3. Full E2E Tests
**Location**: `frontend/tests/e2e/app.spec.ts`  
**Framework**: Playwright  
**Purpose**: Comprehensive feature testing

**What they test:**
- All generation panels (Code, Text, Image, Audio, Unity Project, Sprites)
- Settings and configuration
- Error handling and propagation
- Navigation between all panels
- Provider/model selection
- Multiple generations
- Empty responses
- Network errors

**Run E2E tests:**
```bash
pnpm --dir frontend test:e2e
```

**Duration**: ~5-10 minutes  
**When to run**: Before releases, after major changes

### 4. Integration Tests (Electron)
**Location**: `frontend/tests/e2e/electron-integration.spec.ts`  
**Framework**: Playwright  
**Purpose**: Test Electron-specific functionality

**What they test:**
- Application startup sequence
- Backend process spawning
- Window loading and initialization
- HTTP communication with Python backend
- Error propagation from backend

**Run integration tests:**
```bash
pnpm --dir frontend test:e2e electron-integration.spec.ts
```

**Duration**: ~2 minutes  
**When to run**: After Electron changes

### 5. Backend Tests
**Location**: `backend/tests/`  
**Framework**: pytest  
**Purpose**: Test Python backend functionality

**Run backend tests:**
```bash
pnpm --dir backend test
```

## Test Pyramid

```
        /\
       /  \      E2E Tests (Slow, High Confidence)
      /____\     - Full E2E Suite (~5-10 min)
     /      \    
    /        \   Integration Tests (Medium Speed)
   /__________\  - Electron Integration (~2 min)
  /            \ 
 /              \ Smoke Tests (Fast, Critical Path)
/________________\ - Smoke Tests (~30 sec)
                  
                  Unit Tests (Fastest, Most Coverage)
                  - Frontend Unit Tests (~5 sec)
                  - Backend Unit Tests (~10 sec)
```

## Recommended Testing Workflow

### During Development
```bash
# Run unit tests in watch mode
pnpm --dir frontend test:watch
```

### Before Committing
```bash
# Run smoke tests to verify critical path
pnpm --dir frontend test:smoke

# Run type checking
pnpm run typecheck:all

# Run linting
pnpm run lint:all
```

### Before Pushing
```bash
# Run all tests
pnpm run test:all
pnpm --dir frontend test:e2e
```

### Before Release
```bash
# Run complete test suite
pnpm run check:all:e2e
```

## CI/CD Pipeline

The GitHub Actions workflow runs:
1. **Lint**: ESLint + Ruff
2. **Type Check**: TypeScript + Pyright
3. **Unit Tests**: Vitest + pytest
4. **Smoke Tests**: Playwright smoke tests
5. **E2E Tests**: Full Playwright suite
6. **Build**: electron-builder

## Test Coverage

### Current Coverage

**Frontend Unit Tests:**
- Component rendering
- User interactions
- API mocking
- Error handling
- State management

**Smoke Tests:**
- Window opening ✅
- Frontend loading ✅
- Backend health check ✅
- Backend discovery ✅
- Request flow (FE → BE) ✅
- Direct API calls ✅

**E2E Tests:**
- Code generation ✅
- Text generation ✅
- Image generation ✅
- Audio generation ✅
- Sprite generation ✅
- Unity project generation ✅
- Settings management ✅
- Error handling ✅
- Navigation ✅
- Provider/model selection ✅

**Integration Tests:**
- Application startup ✅
- Backend spawning ✅
- Window loading ✅
- HTTP communication ✅
- Error propagation ✅

## Debugging Tests

### Run with Playwright UI
```bash
cd frontend
pnpm exec playwright test --ui
```

### Run in headed mode (see browser)
```bash
cd frontend
pnpm exec playwright test --headed
```

### Debug specific test
```bash
cd frontend
pnpm exec playwright test --debug smoke.spec.ts
```

### Run a single E2E spec (via project script)
```bash
cd frontend
pnpm run test:e2e prompt-reset.spec.ts
```

### View test report
```bash
cd frontend
pnpm exec playwright show-report
```

## Troubleshooting

### 404 on "Reset system prompts" (or other `/api/management/...` endpoints)

The route is registered in the backend (see `backend/tests/test_management_discovery.py::test_reset_system_prompts`). If you get 404:

1. **The process on port 35421 may be an old backend.** Use Launch **"B: Full stack (Vite + uvicorn)"** or **"C: Full stack + Electron"** so the preLaunchTask frees the port and the correct backend starts.
2. **Confirm the route in this codebase:**  
   `cd backend && python -m pytest tests/test_management_discovery.py::test_reset_system_prompts -v`  
   If this passes, the app has the route; the server you're hitting is not this app.
3. **Optional:** Clear bytecode and restart: remove `backend/app/**/__pycache__` and restart the backend from Launch.

### Health check identifies this backend

`GET /health` returns `{"status": "ok", "management": true}` for this backend. If you get a different response (e.g. no `management` key), the process on 35421 is not the Unity Generator backend from this repo.

## Writing New Tests

### Unit Test Template
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from '@/components/MyComponent.vue';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    const wrapper = mount(MyComponent);
    expect(wrapper.text()).toContain('Expected Text');
  });

  it('handles user interaction', async () => {
    const wrapper = mount(MyComponent);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test('feature works correctly', async ({ page }) => {
  await page.goto('/');
  
  // Navigate to feature
  await page.locator('[data-testid="nav-Feature"]').click();
  
  // Interact with feature
  await page.getByLabel('Input').fill('test value');
  await page.getByRole('button', { name: 'Submit' }).click();
  
  // Verify result
  await expect(page.getByText('Success')).toBeVisible();
});
```

## Best Practices

### General
1. **Test behavior, not implementation** - Test what users see and do
2. **Keep tests independent** - No shared state between tests
3. **Use descriptive names** - Test names should explain what they verify
4. **Fail fast** - Tests should fail quickly when something is wrong
5. **Clean up** - Always clean up resources (automatic with Playwright)

### Unit Tests
1. **Mock external dependencies** - API calls, file system, etc.
2. **Test edge cases** - Empty inputs, null values, errors
3. **Keep tests small** - One assertion per test when possible
4. **Use beforeEach** - Set up common test state

### E2E Tests
1. **Use data-testid attributes** - More stable than CSS selectors
2. **Wait for elements explicitly** - Use `toBeVisible()` with timeouts
3. **Mock API responses** - For consistency and speed
4. **Test user workflows** - Complete user journeys, not just clicks

### Smoke Tests
1. **Keep them fast** - < 10 seconds per test
2. **Test critical path only** - Window opens, backend reachable
3. **No mocking** - Test real connectivity
4. **Fail fast** - If smoke tests fail, don't run full suite

## Troubleshooting

### Tests timeout
- Check backend is running
- Increase timeout in test
- Check for network issues

### Element not found
- Use `data-testid` attributes
- Wait for element with explicit timeout
- Check element is actually rendered

### Backend connection fails
- Verify backend dependencies installed
- Check backend logs for errors
- Ensure correct port configuration

### Default backend port
The app and tests use a fixed default backend port (**35421**) to avoid conflicts with common dev tools. E2E and Playwright read `BACKEND_PORT` from the environment; if you run the backend on a different port, set `BACKEND_PORT` when running tests (e.g. `BACKEND_PORT=35500 pnpm --dir frontend test:e2e`).

### Port already in use
- Test runner finds free ports automatically
- Check for zombie processes
- Kill processes manually if needed

## Performance Benchmarks

Expected test durations:
- **Unit tests**: ~5 seconds
- **Smoke tests**: ~30 seconds
- **Integration tests**: ~2 minutes
- **Full E2E suite**: ~5-10 minutes

If tests are significantly slower:
- Check backend startup time
- Verify system resources (CPU, memory)
- Check for network latency issues

## Test Results

Latest test run (2026-03-08):
```
✅ Smoke Tests: 9/9 passed (18.2s)
✅ Unit Tests: All passed
✅ Type Check: No errors
✅ Lint: No errors
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [pytest Documentation](https://docs.pytest.org/)
