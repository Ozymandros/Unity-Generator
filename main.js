/**
 * Electron Main Process — single entry (no runtime require of local files).
 * Bundled by Forge+Vite to .vite/build/main.js; __dirname at runtime is .vite/build.
 */

const { app, BrowserWindow, ipcMain, dialog, Notification, nativeTheme, shell, autoUpdater } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const axios = require('axios');
const os = require('os');
const { createApplicationMenu, enableContextMenu } = require('./main/menu');
const { parseManifestJson, parseProjectVersionTxt } = require('./main/unityProjectScanParsers');

// --- safeExistsSync (avoids DEP0187) ---
function safeExistsSync(p) {
  return typeof p === 'string' && p.length > 0 && fs.existsSync(p);
}

// --- Logger ---
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
let currentLogLevel = process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
let logFilePath = null;

function formatLogEntry(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const processName = process.type === 'browser' ? 'main' : 'renderer';
  return JSON.stringify({ timestamp, level, process: processName, message, context });
}

function writeLogToFile(entry) {
  if (!logFilePath) return;
  try { fs.appendFileSync(logFilePath, entry + '\n'); } catch (e) { console.error('Write log failed', e); }
}

function logMainProcess(message, context = {}) {
  if (currentLogLevel > LOG_LEVELS.INFO) return;
  const entry = formatLogEntry('INFO', message, context);
  console.log(entry);
  writeLogToFile(entry);
}

function formatError(error) {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack, code: error.code };
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}

function initLogger(logLevel = 'info') {
  try {
    const level = (logLevel || 'info').toUpperCase();
    if (LOG_LEVELS[level] !== undefined) currentLogLevel = LOG_LEVELS[level];
    const userDataPath = app.getPath('userData');
    logFilePath = path.join(userDataPath, 'app.log');
    const logDir = path.dirname(logFilePath);
    if (!safeExistsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  } catch (e) { console.error('Init logger failed', e); }
}

function readRecentLogs(lines = 100) {
  if (!safeExistsSync(logFilePath)) return [];
  try {
    const content = fs.readFileSync(logFilePath, 'utf8');
    return content.split('\n').filter(l => l.trim()).slice(-lines);
  } catch (e) { return []; }
}

// --- Window ---
const WINDOW_WIDTH = 1200, WINDOW_HEIGHT = 800, WINDOW_MIN_WIDTH = 800, WINDOW_MIN_HEIGHT = 600;

function configureAccessibility() {
  try {
    app.commandLine.appendSwitch('force-renderer-accessibility', 'true');
    app.accessibilitySupport = true;
    nativeTheme.on('updated', () => {});
  } catch (e) { logMainProcess(`Accessibility: ${formatError(e)}`); }
}

function createMainWindow() {
  try {
    const isDev = !app.isPackaged;
    const window = new BrowserWindow({
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      minWidth: WINDOW_MIN_WIDTH,
      minHeight: WINDOW_MIN_HEIGHT,
      title: 'Unity Generator',
      icon: path.join(__dirname, 'app-icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        accessibilitySupport: true,
        webSecurity: true
      },
      // In dev, keep menus visible (Windows/Linux). In prod, allow auto-hide.
      autoHideMenuBar: !isDev,
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 16 }
    });
    if (isDev) {
      try { window.setMenuBarVisibility(true); } catch (_) {}
    }
    // Note: Electron uses the window title for accessibility automatically
    // No need to call setAccessibilityTitle() - it doesn't exist in Electron's API
    return window;
  } catch (e) {
    logMainProcess(`Create window: ${formatError(e)}`);
    throw e;
  }
}

function handleWindowClose(window) {
  if (window === global.mainWindow) global.mainWindow = null;
}

async function isViteDevServerUp(timeoutMs = 400) {
  try {
    const r = await axios.get('http://127.0.0.1:5173', { timeout: timeoutMs });
    return r.status >= 200 && r.status < 500;
  } catch (_) {
    return false;
  }
}

async function loadFrontend(window) {
  try {
    if (process.env.NODE_ENV === 'development') {
      // Prefer Vite in dev, but fallback to dist if Vite isn't running.
      const up = await isViteDevServerUp(600);
      if (up) {
        await window.loadURL('http://localhost:5173');
        window.webContents.openDevTools();
        return;
      }
      logMainProcess('Vite dev server not reachable on :5173; falling back to frontend/dist');
    }

    // In development (not packaged), open DevTools to see errors
    if (!app.isPackaged) {
      window.webContents.openDevTools();
    }

    // When packaged, use app.getAppPath() to get the correct base path
    // This resolves to the app.asar location
    const appPath = app.getAppPath();
    const frontendPath = path.join(appPath, 'frontend', 'dist', 'index.html');
    
    logMainProcess(`App path: ${appPath}`);
    logMainProcess(`Loading frontend from: ${frontendPath}`);
    logMainProcess(`Frontend exists: ${safeExistsSync(frontendPath)}`);
    
    if (safeExistsSync(frontendPath)) {
      await window.loadFile(frontendPath);
      logMainProcess('Frontend loaded successfully');
    } else {
      // Try alternative path (in case structure is different)
      const altPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
      logMainProcess(`Trying alternative path: ${altPath}`);
      logMainProcess(`Alternative exists: ${safeExistsSync(altPath)}`);
      
      if (safeExistsSync(altPath)) {
        await window.loadFile(altPath);
        logMainProcess('Frontend loaded from alternative path');
      } else {
        throw new Error(`Frontend not found at: ${frontendPath} or ${altPath}`);
      }
    }
  } catch (e) {
    logMainProcess(`Load frontend: ${formatError(e)}`);
    throw e;
  }
}

// --- Lifecycle (backend spawn) ---
/** Default backend port (high port to avoid conflicts). Override with BACKEND_PORT env (e.g. for E2E). */
const DEFAULT_BACKEND_PORT = 35421;
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT, 10) || DEFAULT_BACKEND_PORT;
const BACKEND_HOST = '127.0.0.1';
const HEALTH_ENDPOINT = '/health';
const MAX_RETRIES = 30, RETRY_INTERVAL = 1000;

async function isBackendHealthy(timeout = 1000) {
  try {
    const r = await axios.get(`http://${BACKEND_HOST}:${BACKEND_PORT}${HEALTH_ENDPOINT}`, { timeout });
    return r.status === 200;
  } catch (_) {
    return false;
  }
}

async function backendHasRoute(routePath, timeout = 1500) {
  try {
    const r = await axios.get(`http://${BACKEND_HOST}:${BACKEND_PORT}/openapi.json`, { timeout });
    const paths = r?.data?.paths;
    return !!(paths && Object.prototype.hasOwnProperty.call(paths, routePath));
  } catch (_) {
    return false;
  }
}

/**
 * Kill any process listening on BACKEND_PORT so the port is released.
 * On Windows: tries PowerShell Get-NetTCPConnection, then netstat fallback.
 * On non-Windows: no-op (rely on killing the spawned process).
 * Only call this when we are sure the listener is our own backend (e.g. right after
 * we killed our process on app quit). Do NOT use at startup to "free" the port, or
 * we might kill another application that is using the same port by coincidence.
 */
function terminateListenersOnBackendPort() {
  if (process.platform !== 'win32') return;
  const port = BACKEND_PORT;
  // 1) PowerShell: find PIDs by port and stop them
  const ps = [
    '$ids = Get-NetTCPConnection -State Listen -LocalAddress 127.0.0.1 -LocalPort ' + port + ' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique',
    'if ($ids) { foreach ($id in $ids) { try { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue } catch {} } }',
  ].join('; ');
  try {
    execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'ignore', timeout: 5000 });
  } catch (_) {
    // Ignore
  }
  // 2) Fallback: netstat -ano and taskkill PIDs listening on port
  try {
    const out = execSync(`netstat -ano`, { encoding: 'utf8', timeout: 3000 });
    const needle = ':' + port;
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!line.includes('LISTENING') || !line.includes(needle)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', timeout: 2000 });
      } catch (_) {}
    }
  } catch (_) {
    // Best-effort; spawn may still fail with EADDRINUSE.
  }
}

async function startPythonBackend() {
  const isDev =  !app.isPackaged;

  // If something is already serving the backend port, reuse it instead of spawning
  // another process that will fail with EADDRINUSE on Windows.
  if (await isBackendHealthy(1000)) {
    const hasResetRoute = await backendHasRoute('/api/management/system-prompts/reset', 1500);
    if (hasResetRoute) {
      logMainProcess(`Backend already running at http://${BACKEND_HOST}:${BACKEND_PORT}; reusing existing process`);
      return null;
    }
    logMainProcess(`Backend on ${BACKEND_PORT} is healthy but stale (missing /api/management/system-prompts/reset)`);
    throw new Error(
      `Another application is using port ${BACKEND_PORT}. Please close it (e.g. a previous Unity Generator, or another server) and try again. You can also set BACKEND_PORT to a different port.`
    );
  }

  logMainProcess(`Starting backend in ${isDev ? 'development' : 'production'} mode`);
  
  if (isDev) {
    // Development: Run Python with uvicorn
    const pythonPath = process.platform === 'win32' ? 'python.exe' : 'python';
    const backendPath = path.join(__dirname, 'backend');
    
    logMainProcess(`Backend path (dev): ${backendPath}`);
    
    if (!safeExistsSync(backendPath)) {
      throw new Error(`Backend directory not found: ${backendPath}`);
    }
    
    const backend = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--host', BACKEND_HOST, '--port', String(BACKEND_PORT)], {
      cwd: backendPath,
      env: { ...process.env, PYTHONPATH: backendPath },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    backend.stdout.on('data', d => logMainProcess(`Backend: ${d.toString()}`));
    backend.stderr.on('data', d => logMainProcess(`Backend stderr: ${d.toString()}`));
    backend.on('close', code => logMainProcess(`Backend exited: ${code}`));
    backend.on('error', e => logMainProcess(`Backend error: ${formatError(e)}`));
    
    return backend;
  } else {
    // Production: Run standalone executable
    const backendExeName = process.platform === 'win32' ? 'unity-generator-backend.exe' : 'unity-generator-backend';
    const backendExePath = path.join(process.resourcesPath, 'backend', backendExeName);
    
    logMainProcess(`Backend executable path: ${backendExePath}`);
    logMainProcess(`Backend executable exists: ${safeExistsSync(backendExePath)}`);
    logMainProcess(`process.resourcesPath: ${process.resourcesPath}`);
    
    if (!safeExistsSync(backendExePath)) {
      throw new Error(`Backend executable not found: ${backendExePath}`);
    }
    
    // Run the standalone backend executable
    const backend = spawn(backendExePath, [], {
      env: { ...process.env, PORT: String(BACKEND_PORT), HOST: BACKEND_HOST, DATABASE_DIR: path.join(app.getPath('userData'), 'db') },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    backend.stdout.on('data', d => logMainProcess(`Backend: ${d.toString()}`));
    backend.stderr.on('data', d => logMainProcess(`Backend stderr: ${d.toString()}`));
    backend.on('close', code => logMainProcess(`Backend exited: ${code}`));
    backend.on('error', e => logMainProcess(`Backend error: ${formatError(e)}`));
    
    return backend;
  }
}

async function waitForBackendReady(backend) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const r = await axios.get(`http://${BACKEND_HOST}:${BACKEND_PORT}${HEALTH_ENDPOINT}`, { timeout: 5000 });
      if (r.status === 200) return true;
    } catch (_) {}
    await new Promise(r => setTimeout(r, RETRY_INTERVAL));
  }
  return false;
}

/**
 * Terminate the backend process and its tree so the port is released.
 * On Windows uses taskkill /T /F for reliable process-tree kill.
 * On Unix uses SIGTERM then SIGKILL after a short delay.
 * Resolves when the process has exited or after a timeout.
 * @param {import('child_process').ChildProcess | null} proc - Backend child process
 * @returns {Promise<void>}
 */
function killBackendProcess(proc) {
  if (!proc || proc.pid == null) return Promise.resolve();
  const pid = Math.floor(Number(proc.pid));
  if (!Number.isFinite(pid) || pid <= 0) return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timeoutId);
      try { proc.removeListener('exit', onExit); } catch (_) {}
      resolve();
    };
    const onExit = () => finish();
    const timeoutId = setTimeout(finish, 3000);
    proc.once('exit', onExit);

    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore', timeout: 5000 });
      } catch (_) {
        // Process may already be dead
      }
      // Ensure port is released: kill anything still listening (child or orphan)
      setTimeout(() => {
        terminateListenersOnBackendPort();
        finish();
      }, 400);
    } else {
      try { proc.kill('SIGTERM'); } catch (_) {}
      setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch (_) {}
        finish();
      }, 1500);
    }
  });
}

// --- Notification ---
let permissionsGranted = false;

function requestPermissions() {
  try {
    if (process.platform === 'darwin') {
      const n = new Notification({ title: 'Notification Test', body: 'Test', silent: true });
      n.show();
      setTimeout(() => { permissionsGranted = true; }, 100);
    } else {
      permissionsGranted = true;
    }
    return permissionsGranted;
  } catch (e) {
    permissionsGranted = false;
    return false;
  }
}

function getNotificationIcon() {
  const iconPath = path.join(__dirname, 'app-icon.png');
  return safeExistsSync(iconPath) ? iconPath : undefined;
}

async function showNotification(notification) {
  if (!notification || typeof notification.title !== 'string' || !notification.title.trim()) return;
  if (!permissionsGranted) return;
  try {
    const n = new Notification({
      title: notification.title.trim(),
      body: (notification.body || '').trim(),
      icon: getNotificationIcon(),
      silent: false
    });
    const actions = notification.actions;
    if (actions && typeof actions.onClick === 'function') n.on('click', () => { try { actions.onClick(); } catch (e) { logMainProcess(`Notification click: ${formatError(e)}`); } });
    n.show();
  } catch (e) { logMainProcess(`Notification: ${formatError(e)}`); }
}

// --- Security ---
function validateInput(input) {
  if (typeof input !== 'string') return { valid: false, error: 'Input must be a string' };
  if (input.trim().length === 0) return { valid: false, error: 'Input cannot be empty' };
  if (input.length > 10000) return { valid: false, error: 'Input too long' };
  const sanitized = input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  return { valid: true, sanitized };
}

function handleCSPViolation(violation) {
  logMainProcess('CSP violation', { url: violation?.url });
  return { blocked: true, reason: 'CSP violation' };
}

function buildCSPString() {
  const backendOrigin = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
  return `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' ${backendOrigin}; style-src 'self' 'unsafe-inline' ${backendOrigin}; img-src 'self' data: ${backendOrigin}; connect-src 'self' ${backendOrigin}; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';`;
}

function configureCSP() {
  return buildCSPString();
}

// --- i18n ---
const DEFAULT_LANGUAGE = 'en';
let currentLanguage = DEFAULT_LANGUAGE;
const languageResources = {};

function loadLanguageResources(language) {
  if (!language || typeof language !== 'string') throw new Error('language must be non-empty string');
  const trimmed = language.trim();
  if (!trimmed) throw new Error('language cannot be empty');
  try {
    const resourcesPath = path.join(__dirname, '..', 'resources', 'locales', `${trimmed}.json`);
    if (!safeExistsSync(resourcesPath)) return loadLanguageResources(DEFAULT_LANGUAGE);
    const content = fs.readFileSync(resourcesPath, 'utf8');
    const resources = JSON.parse(content);
    if (!resources || typeof resources !== 'object') throw new Error('Invalid JSON');
    languageResources[trimmed] = resources;
    currentLanguage = trimmed;
    return true;
  } catch (e) {
    logMainProcess(`i18n load ${language}: ${formatError(e)}`);
    return false;
  }
}

function translateText(key, params = {}) {
  if (!key || typeof key !== 'string') throw new Error('key must be non-empty string');
  const trimmed = key.trim();
  if (!trimmed) return key;
  const resources = languageResources[currentLanguage] || languageResources[DEFAULT_LANGUAGE];
  let translation = resources?.[trimmed];
  if (!translation) return trimmed;
  if (Object.keys(params).length > 0) {
    Object.keys(params).forEach(k => { translation = translation.replace(`{${k}}`, params[k] != null ? String(params[k]) : ''); });
  }
  return translation;
}

function getAvailableLanguages() {
  try {
    const localesPath = path.join(__dirname, '..', 'resources', 'locales');
    if (!safeExistsSync(localesPath)) return [DEFAULT_LANGUAGE];
    return fs.readdirSync(localesPath).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).sort();
  } catch (e) { return [DEFAULT_LANGUAGE]; }
}

// --- Migration ---
function getLegacyDataLocation() {
  const appName = 'unity-generator';
  switch (process.platform) {
    case 'win32': return path.join(process.env.APPDATA || '', appName);
    case 'darwin': return path.join(os.homedir(), 'Library', 'Application Support', appName);
    case 'linux': return path.join(os.homedir(), '.local', 'share', appName);
    default: return path.join(os.homedir(), '.config', appName);
  }
}

function getElectronDataLocation() {
  return app.getPath('userData');
}

function extractLegacyData(legacyPath = getLegacyDataLocation()) {
  if (!legacyPath || typeof legacyPath !== 'string') throw new Error('legacyPath must be non-empty string');
  if (!safeExistsSync(legacyPath)) return { exists: false, files: {}, directories: [], message: 'Legacy data location does not exist' };
  const files = {}, directories = [];
  function readDir(dirPath, basePath = '') {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const rel = basePath ? path.join(basePath, entry.name) : entry.name;
      if (entry.isDirectory()) { directories.push(rel); readDir(fullPath, rel); }
      else if (entry.isFile()) { try { files[rel] = fs.readFileSync(fullPath, 'utf8'); } catch (_) {} }
    }
  }
  readDir(legacyPath);
  return { exists: true, files, directories, legacyPath, count: Object.keys(files).length };
}

function migrateToElectron(legacyData, electronPath = getElectronDataLocation()) {
  if (!legacyData || typeof legacyData !== 'object') throw new Error('legacyData must be object');
  if (!electronPath || typeof electronPath !== 'string') throw new Error('electronPath must be non-empty string');
  const result = { migrated: 0, skipped: 0, errors: [], electronPath };
  try {
    if (!safeExistsSync(electronPath)) fs.mkdirSync(electronPath, { recursive: true });
  } catch (e) { result.errors.push({ type: 'directory_creation', message: e.message }); return result; }
  if (!legacyData.exists) { result.message = 'No legacy data to migrate'; return result; }
  for (const [rel, content] of Object.entries(legacyData.files)) {
    try {
      const targetPath = path.join(electronPath, rel);
      const targetDir = path.dirname(targetPath);
      if (!safeExistsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetPath, content, 'utf8');
      result.migrated++;
    } catch (e) { result.errors.push({ file: rel, type: 'file_write', message: e.message }); }
  }
  for (const dir of legacyData.directories || []) {
    try {
      const targetDir = path.join(electronPath, dir);
      if (!safeExistsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    } catch (e) { result.errors.push({ directory: dir, type: 'directory_creation', message: e.message }); }
  }
  return result;
}

function performMigration() {
  const legacyPath = getLegacyDataLocation();
  const electronPath = getElectronDataLocation();
  const legacyData = extractLegacyData(legacyPath);
  if (!legacyData.exists) return { success: true, migrated: 0, skipped: 0, message: 'No legacy data found', legacyPath, electronPath };
  const result = migrateToElectron(legacyData, electronPath);
  return { success: result.errors.length === 0, migrated: result.migrated, skipped: result.skipped, errors: result.errors, legacyPath, electronPath };
}

// --- Updater ---
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000;
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'https://updates.unitygenerator.com';
let lastUpdateCheck = 0;

function configureAutoUpdater() {
  try {
    autoUpdater.setFeedURL({ url: `${UPDATE_SERVER_URL}/update/${process.platform}-${process.arch}/${app.getVersion()}`, provider: 'generic' });
    autoUpdater.on('checking-for-update', () => logMainProcess('Checking for updates...'));
    autoUpdater.on('update-available', info => showNotification({ title: 'Update Available', body: `Version ${info.version} available. Downloading...`, type: 'info' }));
    autoUpdater.on('update-not-available', () => {});
    autoUpdater.on('update-downloaded', info => {
      showNotification({ title: 'Update Downloaded', body: `Version ${info.version} downloaded. Restart to install.`, type: 'success' });
      showNotification({ title: 'Restart to Update', body: 'Click to restart and install', type: 'info', actions: { onClick: () => setImmediate(() => autoUpdater.quitAndInstall()) } });
    });
    autoUpdater.on('error', e => showNotification({ title: 'Update Error', body: e.message, type: 'error' }));
  } catch (e) { logMainProcess(`Updater config: ${formatError(e)}`); }
}

async function checkForUpdates() {
  try { await autoUpdater.checkForUpdates(); return true; } catch (e) { return false; }
}

function enableAutoUpdates() {
  configureAutoUpdater();
  checkForUpdates();
  setInterval(() => { const now = Date.now(); if (now - lastUpdateCheck > UPDATE_CHECK_INTERVAL) { checkForUpdates(); lastUpdateCheck = now; } }, UPDATE_CHECK_INTERVAL);
}

function getUpdateStatus() {
  return { autoUpdateEnabled: true, lastCheck: lastUpdateCheck, updateServer: UPDATE_SERVER_URL };
}

// --- URL scheme ---
function registerURLScheme() {
  return ['win32', 'darwin', 'linux'].includes(process.platform);
}

function parseURL(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const urlObj = new URL(url);
    const scheme = urlObj.protocol.replace(':', '');
    if (scheme !== 'unitygen') return null;
    const params = {}; for (const [k, v] of urlObj.searchParams.entries()) params[k] = v;
    return { scheme, host: urlObj.hostname || 'default', params, original: url };
  } catch (e) { return null; }
}

function processURL(url) {
  if (!url || typeof url !== 'string') return { success: false, error: 'URL must be non-empty string' };
  const parsed = parseURL(url);
  if (!parsed) return { success: false, error: 'Failed to parse URL' };
  return {
    success: true,
    parsed,
    actions: { forwardToBackend: parsed.host === 'generate' || parsed.host === 'open', forwardToFrontend: true, showWindow: true }
  };
}

function forwardToBackend(parsedURL) {
  if (!parsedURL || parsedURL.scheme !== 'unitygen') return null;
  return { action: parsedURL.host, parameters: parsedURL.params, timestamp: Date.now() };
}

function forwardToFrontend(parsedURL) {
  if (!parsedURL || parsedURL.scheme !== 'unitygen') return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(parsedURL.params || {})) if (v != null) params.set(k, v);
  const q = params.toString(); return q ? `?${q}` : '';
}

// --- App state ---
let mainWindow = null;
let backendProcess = null;
let isQuitting = false;

async function initializeApp() {
  try {
    logMainProcess('Initializing application...');
    logMainProcess(`Platform: ${process.platform}, Arch: ${process.arch}`);
    logMainProcess(`__dirname: ${__dirname}`);
    logMainProcess(`process.resourcesPath: ${process.resourcesPath}`);
    logMainProcess(`NODE_ENV: ${process.env.NODE_ENV || 'production'}`);
    
    configureAccessibility();
    
    const migrationResult = performMigration();
    if (migrationResult.migrated > 0) logMainProcess(`Migrated ${migrationResult.migrated} files`);
    
    registerURLScheme();
    
    logMainProcess('Starting Python backend...');
    backendProcess = await startPythonBackend();
    
    logMainProcess('Waiting for backend to be ready...');
    const backendReady = await waitForBackendReady(backendProcess);
    
    if (!backendReady) {
      logMainProcess('ERROR: Backend failed to start');
      await showNotification({ title: 'Backend Error', body: 'Failed to start Python backend. Check logs.', type: 'error' });
      dialog.showErrorBox('Backend Error', `Failed to start Python backend.\n\nCheck logs at: ${logFilePath}`);
      app.quit();
      return;
    }
    
    logMainProcess('Backend is ready');
    enableAutoUpdates();
    
    logMainProcess('Creating main window...');
    mainWindow = createMainWindow();
    global.mainWindow = mainWindow;
    
    mainWindow.on('closed', () => handleWindowClose(mainWindow));
    
    // Add error handlers for the window
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      logMainProcess(`Window failed to load: ${errorCode} - ${errorDescription}`);
    });
    
    mainWindow.webContents.on('crashed', (event, killed) => {
      logMainProcess(`Window crashed: killed=${killed}`);
    });
    
    // Capture console messages from renderer
    mainWindow.webContents.on('console-message', (level, message, line, sourceId) => {
      logMainProcess(`Renderer console [${level}]: ${message} (${sourceId}:${line})`);
    });
    
    logMainProcess('Loading frontend...');
    await loadFrontend(mainWindow);

    // Create application menu (File/Edit/Tools/Help)
    createApplicationMenu(mainWindow, app, __dirname, logMainProcess);
    // Enable context menu (right-click)
    enableContextMenu(mainWindow, logMainProcess);
    
    logMainProcess('Application initialized successfully');
  } catch (e) {
    console.error('FATAL ERROR in initializeApp:', e);
    logMainProcess(`Init error: ${formatError(e)}`);
    await showNotification({ title: 'Initialization Error', body: 'Failed to initialize. Check logs.', type: 'error' });
    dialog.showErrorBox('Initialization Error', `Failed to initialize application:\n\n${e.message}\n\nCheck logs at: ${logFilePath}`);
    app.quit();
  }
}

// --- IPC ---
ipcMain.handle('backend:status', async () => {
  const healthy = await isBackendHealthy(1000);
  return {
    isRunning: healthy || !!backendProcess,
    health: healthy ? 'healthy' : 'stopped',
    port: BACKEND_PORT,
    managedByElectron: !!backendProcess
  };
});

ipcMain.handle('backend:restart', async () => {
  try {
    if (backendProcess) {
      await killBackendProcess(backendProcess);
      backendProcess = null;
    }
    backendProcess = await startPythonBackend();
    const ready = await waitForBackendReady(backendProcess);
    return { isRunning: ready, health: ready ? 'healthy' : 'unhealthy', port: BACKEND_PORT };
  } catch (e) {
    return { isRunning: false, health: 'unhealthy', error: e.message };
  }
});

ipcMain.handle('notification:show', async (e, notification) => showNotification(notification));
ipcMain.handle('logger:error', async (e, err) => { logMainProcess(formatError(err)); return true; });
ipcMain.handle('notification:request-permissions', () => requestPermissions());
ipcMain.handle('i18n:translate', async (e, key, params) => translateText(key, params));
ipcMain.handle('i18n:load', async (e, language) => loadLanguageResources(language));
ipcMain.handle('i18n:available-languages', () => getAvailableLanguages());
ipcMain.handle('migration:status', () => ({
  legacyPath: getLegacyDataLocation(),
  electronPath: getElectronDataLocation(),
  legacyExists: safeExistsSync(getLegacyDataLocation()),
  electronExists: safeExistsSync(getElectronDataLocation())
}));
ipcMain.handle('migration:perform', () => performMigration());
ipcMain.handle('migration:extract-data', () => extractLegacyData());
ipcMain.handle('dialog:open-file', async (e, options) => dialog.showOpenDialog(options));
ipcMain.handle('dialog:save-file', async (e, options) => dialog.showSaveDialog(options));
ipcMain.handle('dialog:error', async (e, options) => dialog.showMessageBox({ type: 'error', title: options?.title || 'Error', message: options?.message, detail: options?.detail, buttons: options?.buttons || ['OK'] }));
ipcMain.handle('dialog:info', async (e, options) => dialog.showMessageBox({ type: 'info', title: options?.title || 'Information', message: options?.message, detail: options?.detail, buttons: options?.buttons || ['OK'] }));
ipcMain.handle('dialog:warning', async (e, options) => dialog.showMessageBox({ type: 'warning', title: options?.title || 'Warning', message: options?.message, detail: options?.detail, buttons: options?.buttons || ['OK'] }));
ipcMain.handle('dialog:question', async (e, options) => dialog.showMessageBox({ type: 'question', title: options?.title || 'Question', message: options?.message, detail: options?.detail, buttons: options?.buttons || ['Yes', 'No'], defaultId: options?.defaultId ?? 1, cancelId: options?.cancelId ?? 1 }));

ipcMain.handle('shell:open-path', async (_e, filePath) => {
  if (!filePath || typeof filePath !== 'string') return { success: false, error: 'File path must be a non-empty string' };
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to open path' };
  }
});

/**
 * Scan a Unity project folder and return best-effort metadata for prefilling UI.
 * Reads only well-known files under the selected root; does not mutate anything.
 */
ipcMain.handle('unityProject:scan', async (_e, projectRoot) => {
  try {
    if (!projectRoot || typeof projectRoot !== 'string' || !projectRoot.trim()) {
      return { success: false, error: 'projectRoot must be a non-empty string' };
    }

    const root = path.resolve(projectRoot);
    const assetsDir = path.join(root, 'Assets');
    const projectSettingsDir = path.join(root, 'ProjectSettings');
    const packagesDir = path.join(root, 'Packages');

    if (!safeExistsSync(assetsDir) || !safeExistsSync(projectSettingsDir)) {
      return { success: false, error: 'Selected folder is not a valid Unity project (missing Assets/ProjectSettings)' };
    }

    /** @type {{ root: string; unityVersion: string; packages: string[]; files: { projectVersionTxt: boolean; manifestJson: boolean } }} */
    const result = {
      root,
      unityVersion: '',
      packages: [],
      files: {
        projectVersionTxt: safeExistsSync(path.join(projectSettingsDir, 'ProjectVersion.txt')),
        manifestJson: safeExistsSync(path.join(packagesDir, 'manifest.json')),
      },
    };

    // Project version
    try {
      const pvPath = path.join(projectSettingsDir, 'ProjectVersion.txt');
      if (safeExistsSync(pvPath)) {
        const content = fs.readFileSync(pvPath, 'utf8');
        result.unityVersion = parseProjectVersionTxt(content).unityVersion || '';
      }
    } catch (e) {
      logMainProcess(`unityProject:scan ProjectVersion parse failed: ${formatError(e)}`);
    }

    // Packages manifest
    try {
      const manifestPath = path.join(packagesDir, 'manifest.json');
      if (safeExistsSync(manifestPath)) {
        const content = fs.readFileSync(manifestPath, 'utf8');
        result.packages = parseManifestJson(content).packages || [];
      }
    } catch (e) {
      logMainProcess(`unityProject:scan manifest parse failed: ${formatError(e)}`);
    }

    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Scan failed' };
  }
});

ipcMain.handle('url:process', async (e, url) => processURL(url));
ipcMain.handle('updater:check', () => checkForUpdates());
ipcMain.handle('updater:status', () => getUpdateStatus());

// --- App lifecycle ---
app.on('ready', async () => {
  try {
    // Initialize logger first so we can capture all logs
    initLogger(process.env.LOG_LEVEL || 'info');
    logMainProcess('App ready event fired');
    await initializeApp();
  } catch (e) {
    console.error('FATAL ERROR during app initialization:', e);
    logMainProcess(`Ready error: ${formatError(e)}`);
    // Show error dialog before quitting
    dialog.showErrorBox('Initialization Error', `Failed to start application:\n\n${e.message}\n\nCheck logs at: ${logFilePath || 'unknown'}`);
    app.quit();
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

app.on('before-quit', (event) => {
  if (isQuitting) return;
  isQuitting = true;
  if (!backendProcess) return;
  event.preventDefault();
  const proc = backendProcess;
  backendProcess = null;
  killBackendProcess(proc)
    .then(() => {
      // On Windows, ensure port is freed so next launch does not see "port occupied"
      if (process.platform === 'win32') {
        terminateListenersOnBackendPort();
        return new Promise((r) => setTimeout(r, 600));
      }
    })
    .then(() => { app.quit(); })
    .catch(() => { app.quit(); });
});

app.on('quit', () => logMainProcess('Application quit'));

app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) initializeApp(); });

// Squirrel.Windows: handle installer/update events (must be bundled via vite.main.config.mjs, not external)
if (require('electron-squirrel-startup')) app.quit();

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
    const url = commandLine?.[commandLine.length - 1];
    if (url && url.startsWith('unitygen://')) {
      const result = processURL(url);
      if (result.success) {
        if (result.actions.forwardToBackend) forwardToBackend(result.parsed);
        if (result.actions.forwardToFrontend && mainWindow) {
          const q = forwardToFrontend(result.parsed);
          if (q) { const cur = mainWindow.webContents.getURL(); mainWindow.loadURL(cur.includes('?') ? cur.split('?')[0] + q : cur + q); }
        }
        if (result.actions.showWindow && mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
      }
    }
  });
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  const result = processURL(url);
  if (result.success) {
    if (result.actions.forwardToBackend) forwardToBackend(result.parsed);
    if (result.actions.forwardToFrontend && mainWindow) {
      const q = forwardToFrontend(result.parsed);
      if (q) { const cur = mainWindow.webContents.getURL(); mainWindow.loadURL(cur.includes('?') ? cur.split('?')[0] + q : cur + q); }
    }
    if (result.actions.showWindow && mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  }
});

logMainProcess('Electron main process started');
