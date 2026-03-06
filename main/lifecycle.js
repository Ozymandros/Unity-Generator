/**
 * Lifecycle Manager
 * 
 * Manages application lifecycle including backend process spawning,
 * health checking, and graceful shutdown.
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { logMainProcess, formatError } = require('./logger');

// Configuration
const BACKEND_PORT = 8000;
const BACKEND_HOST = '127.0.0.1';
const HEALTH_ENDPOINT = '/health';
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000; // 1 second

/**
 * Start Python FastAPI backend
 * 
 * @returns {Promise<Object>} The spawned backend process
 */
async function startPythonBackend() {
  try {
    logMainProcess('Starting Python FastAPI backend...');
    
    // Determine Python executable
    const pythonPath = process.platform === 'win32' ? 'python.exe' : 'python';
    
    // Determine backend path
    const backendPath = path.join(__dirname, '..', 'backend');
    
    if (!fs.existsSync(backendPath)) {
      throw new Error(`Backend directory not found: ${backendPath}`);
    }
    
    // Spawn Python backend process
    const backend = spawn(pythonPath, [
      '-m', 'uvicorn',
      'app.main:app',
      '--host', BACKEND_HOST,
      '--port', BACKEND_PORT.toString(),
      '--reload'
    ], {
      cwd: backendPath,
      env: {
        ...process.env,
        PYTHONPATH: backendPath
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
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
    
    logMainProcess('Python FastAPI backend started');
    
    return backend;
    
  } catch (error) {
    logMainProcess(`Failed to start backend: ${formatError(error)}`);
    throw error;
  }
}

/**
 * Wait for backend to be ready
 * 
 * Polls the backend health endpoint until it responds successfully
 * or max retries is reached.
 * 
 * @param {Object} backend - The backend process
 * @returns {Promise<boolean>} True if backend is ready, false otherwise
 */
async function waitForBackendReady(backend) {
  try {
    logMainProcess(`Waiting for backend to be ready on ${BACKEND_HOST}:${BACKEND_PORT}...`);
    
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await axios.get(`http://${BACKEND_HOST}:${BACKEND_PORT}${HEALTH_ENDPOINT}`, {
          timeout: 5000
        });
        
        if (response.status === 200) {
          logMainProcess('Backend is ready');
          return true;
        }
      } catch (error) {
        // Backend not ready yet, wait and retry
        if (i % 5 === 0) {
          logMainProcess(`Backend not ready yet (attempt ${i + 1}/${MAX_RETRIES})`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
    
    logMainProcess('Backend failed to become ready within timeout');
    return false;
    
  } catch (error) {
    logMainProcess(`Error waiting for backend: ${formatError(error)}`);
    return false;
  }
}

/**
 * Gracefully shutdown the application
 * 
 * Stops the Python backend and quits the Electron app.
 */
async function gracefulShutdown() {
  try {
    logMainProcess('Initiating graceful shutdown...');
    
    // Stop backend if running
    if (backendProcess) {
      logMainProcess('Stopping Python backend...');
      backendProcess.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      if (!backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }
    
    logMainProcess('Graceful shutdown complete');
    
  } catch (error) {
    logMainProcess(`Shutdown error: ${formatError(error)}`);
  }
}

/**
 * Restart the Python backend
 * 
 * @returns {Promise<Object>} The new backend process
 */
async function restartBackend() {
  try {
    logMainProcess('Restarting Python backend...');
    
    // Stop current backend
    if (backendProcess) {
      backendProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Start new backend
    const newBackend = await startPythonBackend();
    
    // Wait for it to be ready
    const ready = await waitForBackendReady(newBackend);
    
    if (!ready) {
      throw new Error('Backend failed to restart');
    }
    
    logMainProcess('Python backend restarted successfully');
    return newBackend;
    
  } catch (error) {
    logMainProcess(`Backend restart error: ${formatError(error)}`);
    throw error;
  }
}

/**
 * Get backend status
 * 
 * @returns {Object} Backend status object
 */
function getBackendStatus() {
  if (!backendProcess) {
    return {
      isRunning: false,
      health: 'stopped',
      port: BACKEND_PORT
    };
  }
  
  return {
    isRunning: true,
    health: 'healthy',
    port: BACKEND_PORT
  };
}

// Export for use in main.js
let backendProcess = null;

module.exports = {
  startPythonBackend,
  waitForBackendReady,
  gracefulShutdown,
  restartBackend,
  getBackendStatus,
  setBackendProcess: (process) => { backendProcess = process; }
};
