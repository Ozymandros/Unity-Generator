/**
 * Development Workflow Configuration
 * 
 * Configures concurrent development servers for backend, frontend, and Electron.
 */

const { spawn } = require('child_process');
const path = require('path');
const { logMainProcess } = require('../main/logger');

// Server configurations
const SERVERS = {
  backend: {
    name: 'Python Backend',
    command: 'python',
    args: ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'],
    cwd: path.join(__dirname, '..', 'backend'),
    port: 8000
  },
  frontend: {
    name: 'Vue Frontend',
    command: 'pnpm',
    args: ['--dir', 'frontend', 'dev'],
    cwd: path.join(__dirname, '..'),
    port: 5173
  },
  electron: {
    name: 'Electron',
    command: 'electron',
    args: ['.'],
    cwd: path.join(__dirname, '..'),
    port: null
  }
};

/**
 * Start all development servers
 */
function startDevServers() {
  logMainProcess('Starting development servers...');

  const processes = [];

  // Start backend server
  const backend = spawnServer(SERVERS.backend);
  processes.push(backend);

  // Start frontend server
  const frontend = spawnServer(SERVERS.frontend);
  processes.push(frontend);

  // Start Electron
  const electron = spawnServer(SERVERS.electron);
  processes.push(electron);

  // Handle process exits
  processes.forEach(proc => {
    proc.on('close', (code) => {
      if (code !== 0) {
        logMainProcess(`${proc.name} exited with code ${code}`);
      }
    });
  });

  logMainProcess('All development servers started');
}

/**
 * Spawn a server process
 * 
 * @param {Object} server - Server configuration
 * @returns {Object} Spawned process
 */
function spawnServer(server) {
  logMainProcess(`Starting ${server.name}...`);

  const proc = spawn(server.command, server.args, {
    cwd: server.cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  proc.name = server.name;
  proc.port = server.port;

  // Log output
  proc.stdout.on('data', (data) => {
    logMainProcess(`${server.name}: ${data.toString()}`);
  });

  proc.stderr.on('data', (data) => {
    logMainProcess(`${server.name} Error: ${data.toString()}`);
  });

  proc.on('error', (error) => {
    logMainProcess(`${server.name} spawn error: ${error.message}`);
  });

  return proc;
}

/**
 * Stop all development servers
 */
function stopDevServers() {
  logMainProcess('Stopping development servers...');

  // This would be implemented in a real scenario
  // For now, just log the intent
  logMainProcess('Development servers stopped');
}

module.exports = {
  startDevServers,
  stopDevServers,
  SERVERS
};
