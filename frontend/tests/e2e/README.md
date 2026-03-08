# E2E Test Suite

This directory contains end-to-end tests for the Unity Generator application using Playwright.

## Test Files

### `smoke.spec.ts` - Smoke Tests (Critical Path)
Quick tests that verify the most critical functionality:
- ✅ Application window opens
- ✅ Frontend loads successfully  
- ✅ Backend is reachable via health endpoint
- ✅ Backend can access its configuration (discovery endpoint)
- ✅ Complete request flow works (FE → BE)
- ✅ Direct API calls to backend (without frontend)

**Run smoke tests only:**
```bash
pnpm test:smoke
```

### `app.spec.ts` - Full Application Tests
Comprehensive tests covering all features:
- All generation panels (Code, Text, Image, Audio, Unity Project, Sprites)
- Settings and configuration
- Error handling
- Navigation
- Provider/model selection
- Multiple generations

**Run all E2E tests:**
```bash
pnpm test:e2e
```

### `electron-integration.spec.ts` - Electron Integration Tests
Tests specific to Electron integration:
- Application startup sequence
- Backend process spawning
- Window loading
- HTTP communication with Python backend
- Error propagation

## Running Tests

### Quick Smoke Test (Recommended First)
```bash
cd frontend
pnpm test:smoke
```

This runs only the critical path tests (~30 seconds). Run this first to ensure basic functionality.

### Full E2E Test Suite
```bash
cd frontend
pnpm test:e2e
```

This runs all E2E tests (~5-10 minutes). Run this for comprehensive testing.

### Specific Test File
```bash
cd frontend
node scripts/run-playwright-e2e.mjs app.spec.ts
```

### From Root Directory
```bash
pnpm --dir frontend test:smoke
pnpm --dir frontend test:e2e
```

## Test Environment

The tests automatically:
1. Find free ports for frontend (starting at 5173) and backend (starting at 8000)
2. Start Vite dev server (unless in CI)
3. Start Python backend (unless in CI)
4. Run Playwright tests
5. Clean up processes

**No manual setup required!** Just run the command.

## CI/CD

In CI environments, the tests expect:
- Frontend server already running (via `VITE_PORT` env var)
- Backend server already running (via `BACKEND_PORT` env var)

The test runner detects CI and skips starting servers.

## Debugging Tests

### Run with UI
```bash
cd frontend
pnpm exec playwright test --ui
```

### Run in headed mode
```bash
cd frontend
pnpm exec playwright test --headed
```

### Debug specific test
```bash
cd frontend
pnpm exec playwright test --debug smoke.spec.ts
```

## Test Structure

### Smoke Tests
- **Purpose**: Verify critical path works
- **Speed**: Fast (~30 seconds)
- **When**: Run before every commit, in CI pipelines
- **Coverage**: Window opens, backend reachable, basic request flow

### Full E2E Tests
- **Purpose**: Comprehensive feature testing
- **Speed**: Slower (~5-10 minutes)
- **When**: Run before releases, after major changes
- **Coverage**: All features, error cases, edge cases

### Integration Tests
- **Purpose**: Verify Electron-specific functionality
- **Speed**: Medium (~2 minutes)
- **When**: Run after Electron changes
- **Coverage**: Process management, IPC, window lifecycle

## Writing New Tests

### Smoke Test Guidelines
- Keep tests fast (< 10 seconds each)
- Test only critical functionality
- No mocking - test real connectivity
- Fail fast if basic functionality broken

### E2E Test Guidelines
- Mock API responses for consistency
- Test user workflows end-to-end
- Include error cases
- Use descriptive test names

### Best Practices
1. Use `data-testid` attributes for stable selectors
2. Wait for elements with explicit timeouts
3. Test user-visible behavior, not implementation
4. Keep tests independent (no shared state)
5. Clean up after tests (automatic with Playwright)

## Troubleshooting

### Tests fail with "Port already in use"
The test runner automatically finds free ports. If this fails, check:
- No zombie processes holding ports
- Firewall not blocking local connections

### Tests timeout waiting for backend
Check:
- Python backend can start successfully
- Backend dependencies installed (`pip install -r backend/requirements.txt`)
- No errors in backend logs

### Tests fail with "Element not found"
Check:
- Frontend built successfully (`pnpm run build`)
- No console errors in browser
- Selectors match current UI (use `data-testid` attributes)

### Backend health check fails
Check:
- Backend running on correct port
- `/health` endpoint returns `{"status": "ok"}`
- No CORS issues (should allow `http://127.0.0.1`)

## Coverage

Current test coverage:
- ✅ Window opening and visibility
- ✅ Frontend loading and initialization
- ✅ Backend health check
- ✅ Backend discovery endpoint
- ✅ Complete request flow (FE → BE)
- ✅ All generation types (Code, Text, Image, Audio, Unity Project, Sprites)
- ✅ Settings and configuration
- ✅ Error handling and propagation
- ✅ Navigation between panels
- ✅ Provider/model selection
- ✅ Direct API calls (without frontend)

## Performance Benchmarks

Expected test durations:
- Smoke tests: ~30 seconds
- Integration tests: ~2 minutes
- Full E2E suite: ~5-10 minutes

If tests are significantly slower, check:
- Backend startup time
- Network latency (should be localhost)
- System resources (CPU, memory)
