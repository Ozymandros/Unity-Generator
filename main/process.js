/**
 * Process Manager
 * 
 * Manages Python FastAPI backend process including spawning, monitoring, and stopping.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logMainProcess, formatError } = require('./logger');

// Configuration
const BACKEND_PORT = 8000;
const BACKEND_HOST = '127.0.0.1';
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAY = 2000; // 2 seconds

/**
 * Spawn Python FastAPI backend
 * 
 * @param {string} backendPath - Path to backend directory
 * @returns {Object} The spawned process
 */
function spawnBackend(backendPath) {
  try {
    logMainProcess('Spawning Python FastAPI backend...');
    
    // Determine Python executable
    const pythonPath = process.platform === 'win32' ? 'python.exe' : 'python';
    
    // Determine backend path if not provided
    const pathToUse = backendPath || path.join(__dirname, '..', 'backend');
    
    if (!fs.existsSync(pathToUse)) {
      throw new Error(`Backend directory not found: ${pathToUse}`);
    }
    
    // Spawn Python backend process
    const backend = spawn(pythonPath, [
      '-m', 'uvicorn',
      'app.main:app',
      '--host', BACKEND_HOST,
      '--port', BACKEND_PORT.toString(),
      '--reload'
    ], {
      cwd: pathToUse,
      env: {
        ...process.env,
        PYTHONPATH: pathToUse
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Store process reference
    global.backendProcess = backend;
    
    // Log backend output
    backend.stdout.on('data', (data) => {
      logMainProcess(`Backend: ${data.toString()}`);
    });
    
    backend.stderr.on('data', (data) => {
      logMainProcess(`Backend Error: ${data.toString()}`);
    });
    
    backend.on('close', (code) => {
      logMainProcess(`Backend process exited with code ${code}`);
    });
    
    backend.on('error', (error) => {
      logMainProcess(`Backend spawn error: ${formatError(error)}`);
    });
    
    logMainProcess('Python FastAPI backend spawned');
    
    return backend;
    
  } catch (error) {
    logMainProcess(`Failed to spawn backend: ${formatError(error)}`);
    throw error;
  }
}

/**
 * Monitor backend process for crashes
 * 
 * @param {Object} backend - The backend process to monitor
 * @param {Function} onCrash - Callback when backend crashes
 * @returns {Function} Cleanup function to stop monitoring
 */
function monitorBackend(backend, onCrash) {
  try {
    logMainProcess('Monitoring backend process...');
    
    // Listen for process exit
    backend.on('close', (code) => {
      if (code !== 0) {
        logMainProcess(`Backend crashed with code ${code}`);
        if (onCrash) {
          onCrash(code);
        }
      }
    });
    
    // Listen for process error
    backend.on('error', (error) => {
      logMainProcess(`Backend process error: ${formatError(error)}`);
      if (onCrash) {
        onCrash(error);
      }
    });
    
    // Return cleanup function
    return () => {
      backend.removeAllListeners('close');
      backend.removeAllListeners('error');
      logMainProcess('Backend monitoring stopped');
    };
    
  } catch (error) {
    logMainProcess(`Failed to monitor backend: ${formatError(error)}`);
    throw error;
  }
}

/**
 * Stop Python backend gracefully
 * 
 * @param {Object} backend - The backend process to stop
 * @param {number} timeout - Timeout in milliseconds before force kill
 * @returns {Promise<void>}
 */
async function stopBackend(backend, timeout = 5000) {
  try {
    logMainProcess('Stopping Python backend...');
    
    if (!backend) {
      logMainProcess('No backend process to stop');
      return;
    }
    
    // Send SIGTERM for graceful shutdown
    backend.kill('SIGTERM');
    
    // Wait for process to exit
    let exited = false;
    const exitPromise = new Promise((resolve) => {
      backend.on('close', () => {
        exited = true;
        resolve();
      });
    });
    
    // Wait with timeout
    await Promise.race([
      exitPromise,
      new Promise((resolve) => setTimeout(resolve, timeout))
    ]);
    
    // If still running, force kill
    if (!exited) {
      logMainProcess('Backend did not exit gracefully, force killing...');
      backend.kill('SIGKILL');
    }
    
    logMainProcess('Python backend stopped');
    
  } catch (error) {
    logMainProcess(`Failed to stop backend: ${formatError(error)}`);
    throw error;
  }
}

/**
 * Restart Python backend
 * 
 * @param {Object} backend - Current backend process
 * @param {string} backendPath - Path to backend directory
 * @returns {Promise<Object>} New backend process
 */
async function restartBackend(backend, backendPath) {
  try {
    logMainProcess('Restarting Python backend...');
    
    // Stop current backend
    if (backend) {
      await stopBackend(backend);
    }
    
    // Wait before restart
    await new Promise(resolve => setTimeout(resolve, RESTART_DELAY));
    
    // Start new backend
    const newBackend = spawnBackend(backendPath);
    
    logMainProcess('Python backend restarted');
    
    return newBackend;
    
  } catch (error) {
    logMainProcess(`Backend restart error: ${formatError(error)}`);
    throw error;
  }
}

/**
 * Check if backend is running
 * 
 * @param {Object} backend - The backend process
 * @returns {boolean} True if running
 */
function isBackendRunning(backend) {
  if (!backend) {
    return false;
  }
  
  return !backend.killed && backend.exitCode === null;
}

/**
 * Get backend PID
 * 
 * @param {Object} backend - The backend process
 * @returns {number|null} Process ID or null
 */
function getBackendPID(backend) {
  if (!backend) {
    return null;
  }
  
  return backend.pid || null;
}

module.exports = {
  spawnBackend,
  monitorBackend,
  stopBackend,
  restartBackend,
  isBackendRunning,
  getBackendPID
};
