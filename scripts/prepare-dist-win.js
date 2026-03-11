/**
 * Run before electron-builder on Windows to avoid "file is being used by another process".
 * Kills any processes that may be holding dist-electron (e.g. from a previous crashed build),
 * then removes dist-electron so the next build starts clean.
 *
 * Usage: node scripts/prepare-dist-win.js
 * Exit: 0 on success; 0 even if cleanup partially fails (builder will run and may error).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const isWin = process.platform === "win32";
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist-electron");

function log(msg) {
  console.log("[prepare-dist-win]", msg);
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

if (!isWin) {
  log("Windows only; skipping.");
  process.exit(0);
}

// 1) Kill any process whose executable is under dist-electron (catches app + any remnant)
const distElectronPath = path.join(root, "dist-electron");
const pathEscaped = distElectronPath.replace(/'/g, "''"); // escape single quotes for PowerShell
try {
  const ps = `$p = '${pathEscaped}'; Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($p, [StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps.replace(/"/g, '\\"')}"`, {
    stdio: "pipe",
    windowsHide: true,
    timeout: 10000,
  });
  log("Killed any process running from dist-electron");
} catch (e) {
  if (e.stdout) log(String(e.stdout));
  if (e.stderr) log(String(e.stderr));
}

// 2) Kill any process whose command line mentions dist-electron or app.asar (phantom lockers)
try {
  const psCmdLine = `Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -and ($_.CommandLine -like '*dist-electron*' -or $_.CommandLine -like '*app.asar*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCmdLine.replace(/"/g, '\\"')}"`, {
    stdio: "pipe",
    windowsHide: true,
    timeout: 15000,
  });
  log("Killed any process with dist-electron/app.asar in command line");
} catch (e) {
  if (e.stdout) log(String(e.stdout));
  if (e.stderr) log(String(e.stderr));
}

// 3) Kill by known image names
const toKill = [
  "Unity Generator.exe",
  "unity-generator-backend.exe",
  "electron.exe",
  "app-builder.exe",
];

for (const name of toKill) {
  try {
    execSync(`taskkill /IM "${name}" /F`, {
      stdio: "ignore",
      windowsHide: true,
      timeout: 5000,
    });
    log(`Killed ${name}`);
  } catch {
    // Process not running or already gone
  }
}

log("Waiting 3s for handles to release...");
sleep(3000);

// Remove or rename dist-electron so builder gets a clean output dir
const distEscaped = distDir.replace(/'/g, "''");
const maxRetries = 5;
const retryDelayMs = 1500;
let cleared = false;
for (let i = 0; i < maxRetries; i++) {
  try {
    if (!fs.existsSync(distDir)) {
      cleared = true;
      break;
    }
    const psRemove = [
      `$d = '${distEscaped}'`,
      `Get-ChildItem -LiteralPath $d -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { $_.Attributes = 'Normal' }`,
      `Remove-Item -LiteralPath $d -Recurse -Force -ErrorAction Stop`,
    ].join("; ");
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psRemove.replace(/"/g, '\\"')}"`, {
      stdio: "pipe",
      windowsHide: true,
      timeout: 30000,
      cwd: root,
    });
    log("Removed dist-electron");
    cleared = true;
    break;
  } catch (e) {
    log(`Remove attempt ${i + 1}/${maxRetries} failed: ${e.message}`);
    if (i < maxRetries - 1) {
      log(`Retrying in ${retryDelayMs}ms...`);
      sleep(retryDelayMs);
    } else {
      log("Giving up. A process is still holding app.asar. Reboot, or use Sysinternals Handle (handle.exe app.asar) as Admin to see which process, then close it.");
    }
  }
}

process.exit(0);
