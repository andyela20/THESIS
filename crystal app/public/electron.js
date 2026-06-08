const { app, BrowserWindow, shell, Menu, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn, execSync } = require("child_process");

app.commandLine.appendSwitch("disable-gpu");
app.disableHardwareAcceleration();

if (process.platform === "win32") {
  app.setAppUserModelId("com.magnitect.desktop");
}

Menu.setApplicationMenu(null);

let mainWindow;
let modelProcess = null;
let isQuitting = false;

const MODEL_PORT = 5001;
const MODEL_HEALTH_URL = `http://127.0.0.1:${MODEL_PORT}/health`;

function getLogDir() {
  const logDir = path.join(app.getPath("userData"), "logs");

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return logDir;
}

function getModelLogPath() {
  return path.join(getLogDir(), "model-api.log");
}

function appendModelLog(message) {
  try {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(getModelLogPath(), line, "utf8");
  } catch {}
}

function getAppIconPath() {
  const possibleIconPaths = [
    path.join(process.resourcesPath || "", "LOGOGRAPHIC.ico"),
    path.join(__dirname, "LOGOGRAPHIC.ico"),
    path.join(__dirname, "assets", "LOGOGRAPHIC.ico"),
    path.join(__dirname, "src", "assets", "LOGOGRAPHIC.ico"),
    path.join(__dirname, "..", "src", "assets", "LOGOGRAPHIC.ico"),
    path.join(process.cwd(), "src", "assets", "LOGOGRAPHIC.ico"),
    path.join(process.cwd(), "public", "LOGOGRAPHIC.ico"),
    path.join(process.cwd(), "LOGOGRAPHIC.ico")
  ];

  for (const iconPath of possibleIconPaths) {
    if (iconPath && fs.existsSync(iconPath)) {
      console.log("[APP ICON] Using:", iconPath);
      return iconPath;
    }
  }

  console.warn("[APP ICON] LOGOGRAPHIC.ico not found. Checked:", possibleIconPaths);
  return undefined;
}

function getAppIcon() {
  const iconPath = getAppIconPath();

  if (!iconPath) {
    return undefined;
  }

  const icon = nativeImage.createFromPath(iconPath);

  if (icon.isEmpty()) {
    console.warn("[APP ICON] Icon file was found but could not be loaded:", iconPath);
    return undefined;
  }

  return icon;
}

function isExternalUrl(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkLocalModelHealth(timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(MODEL_HEALTH_URL, (res) => {
      let body = "";

      res.setEncoding("utf8");

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          const ok = res.statusCode >= 200 && res.statusCode < 300;
          resolve(ok && data && data.status === "ok");
        } catch {
          resolve(false);
        }
      });
    });

    req.on("error", () => resolve(false));

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function killProcessOnPort(port) {
  if (process.platform !== "win32") {
    return;
  }

  try {
    appendModelLog(`Checking for old process on port ${port}...`);

    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      windowsHide: true
    });

    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const pids = new Set();

    for (const line of lines) {
      const parts = line.split(/\s+/);
      const state = parts[3];
      const pid = parts[4];

      if (
        pid &&
        /^\d+$/.test(pid) &&
        (state === "LISTENING" || line.includes(`:${port}`))
      ) {
        pids.add(pid);
      }
    }

    for (const pid of pids) {
      try {
        appendModelLog(`Killing old process on port ${port}. PID=${pid}`);
        execSync(`taskkill /PID ${pid} /F`, {
          encoding: "utf8",
          windowsHide: true
        });
      } catch (err) {
        appendModelLog(`Could not kill PID=${pid}: ${err.message}`);
      }
    }
  } catch {
    appendModelLog(`No old process found on port ${port}.`);
  }
}

function getModelApiExePath() {
  const packagedPath = path.join(
    process.resourcesPath,
    "model-api",
    "model-api.exe"
  );

  const devPath = path.join(
    __dirname,
    "..",
    "crystalscope-model",
    "dist",
    "model-api",
    "model-api.exe"
  );

  if (app.isPackaged) {
    return packagedPath;
  }

  return devPath;
}

async function startModelApi() {
  appendModelLog("========================================");
  appendModelLog("Starting MagniTect model API boot sequence...");
  appendModelLog(`App is packaged: ${app.isPackaged}`);
  appendModelLog(`process.resourcesPath: ${process.resourcesPath}`);
  appendModelLog(`__dirname: ${__dirname}`);

  killProcessOnPort(MODEL_PORT);

  await sleep(1000);

  const exePath = getModelApiExePath();
  const exeDir = path.dirname(exePath);

  appendModelLog(`Expected model-api.exe path: ${exePath}`);
  appendModelLog(`Expected model-api.exe directory: ${exeDir}`);
  appendModelLog(`model-api.exe exists: ${fs.existsSync(exePath)}`);

  if (!fs.existsSync(exePath)) {
    const message = `[MODEL API] model-api.exe not found: ${exePath}`;
    console.error(message);
    appendModelLog(message);
    return;
  }

  console.log("[MODEL API] Starting:", exePath);
  appendModelLog(`[MODEL API] Starting: ${exePath}`);

  const stdoutLog = fs.openSync(getModelLogPath(), "a");
  const stderrLog = fs.openSync(getModelLogPath(), "a");

  modelProcess = spawn(exePath, [], {
    cwd: exeDir,
    windowsHide: false,
    stdio: ["ignore", stdoutLog, stderrLog],
    env: {
      ...process.env,
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8"
    }
  });

  modelProcess.on("error", (err) => {
    const message = `[MODEL API] Failed to start: ${err.message}`;
    console.error(message);
    appendModelLog(message);
  });

  modelProcess.on("exit", (code, signal) => {
    const message = `[MODEL API] Exited. code=${code}, signal=${signal}`;
    console.log(message);
    appendModelLog(message);
    modelProcess = null;
  });

  for (let i = 1; i <= 90; i += 1) {
    const ok = await checkLocalModelHealth(1500);

    if (ok) {
      console.log("[MODEL API] Local model server is ready.");
      appendModelLog("[MODEL API] Local model server is ready.");
      return;
    }

    appendModelLog(`[MODEL API] Waiting for health check... ${i}/90`);
    await sleep(1000);
  }

  const warning = "[MODEL API] Started, but health check did not respond within 90 seconds.";
  console.warn(warning);
  appendModelLog(warning);
}

function stopModelApi() {
  if (!modelProcess) {
    return;
  }

  try {
    console.log("[MODEL API] Stopping local model server...");
    appendModelLog("[MODEL API] Stopping local model server...");
    modelProcess.kill();
  } catch (err) {
    console.error("[MODEL API] Could not stop model server:", err);
    appendModelLog(`[MODEL API] Could not stop model server: ${err.message}`);
  }

  modelProcess = null;
}

function forceQuitApp() {
  if (isQuitting) {
    return;
  }

  isQuitting = true;

  stopModelApi();

  try {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.destroy();
      }
    });
  } catch {}

  app.quit();

  setTimeout(() => {
    stopModelApi();
    app.exit(0);
  }, 500);
}

function createWindow() {
  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: true,
    center: true,
    title: "MagniTect",
    icon: appIcon,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      nativeWindowOpen: false
    }
  });

  mainWindow.setMenu(null);

  mainWindow.webContents.on("page-title-updated", (event) => {
    event.preventDefault();
    mainWindow.setTitle("MagniTect");
  });

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.setTitle("MagniTect");
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      shell.openExternal(url);
    }

    return { action: "deny" };
  });

  mainWindow.webContents.on("did-create-window", (childWindow, details) => {
    if (details && details.url && isExternalUrl(details.url)) {
      shell.openExternal(details.url);
    }

    try {
      childWindow.close();
    } catch {}
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const isAppUrl =
      url.startsWith("http://localhost:3000") ||
      url.startsWith("file://");

    if (!isAppUrl && isExternalUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      forceQuitApp();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, "index.html")}`;

  mainWindow.loadURL(startUrl);
}

app.whenReady().then(async () => {
  await startModelApi();
  createWindow();
});

app.on("before-quit", () => {
  isQuitting = true;
  stopModelApi();
});

app.on("window-all-closed", () => {
  forceQuitApp();
});

app.on("activate", () => {
  if (mainWindow === null && !isQuitting) {
    createWindow();
  }
});