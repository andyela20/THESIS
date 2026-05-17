const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

app.commandLine.appendSwitch("disable-gpu");
app.disableHardwareAcceleration();

let mainWindow;
let modelProcess = null;
let isQuitting = false;

const MODEL_PORT = 5001;
const MODEL_HEALTH_URL = `http://127.0.0.1:${MODEL_PORT}/health`;

function getAppIconPath() {
  const possibleIconPaths = [
    // Packaged app with extraResources:
    path.join(process.resourcesPath || "", "LOGOGRAPHIC.ico"),

    // Packaged app if icon is inside the app folder/build folder:
    path.join(__dirname, "LOGOGRAPHIC.ico"),

    // Your actual icon location in dev:
    path.join(__dirname, "src", "assets", "LOGOGRAPHIC.ico"),

    // If this Electron file is inside public/ or build/:
    path.join(__dirname, "..", "src", "assets", "LOGOGRAPHIC.ico"),

    // If React copied the icon from public during build:
    path.join(__dirname, "public", "LOGOGRAPHIC.ico"),

    // Extra fallback from project root:
    path.join(process.cwd(), "src", "assets", "LOGOGRAPHIC.ico"),
    path.join(process.cwd(), "public", "LOGOGRAPHIC.ico"),
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

function isExternalUrl(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function checkLocalModelHealth(timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(MODEL_HEALTH_URL, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 300);
    });

    req.on("error", () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function getModelApiExePath() {
  // Installed app:
  // ...\MagniTect\resources\model-api\model-api.exe
  const packagedPath = path.join(process.resourcesPath, "model-api", "model-api.exe");

  // Dev mode:
  // THESIS\crystalscope-model\dist\model-api\model-api.exe
  const devPath = path.join(
    __dirname,
    "..",
    "crystalscope-model",
    "dist",
    "model-api",
    "model-api.exe"
  );

  if (app.isPackaged) return packagedPath;
  return devPath;
}

async function startModelApi() {
  const alreadyRunning = await checkLocalModelHealth();

  if (alreadyRunning) {
    console.log("[MODEL API] Local model server already running on port 5001.");
    return;
  }

  const exePath = getModelApiExePath();
  const exeDir = path.dirname(exePath);

  if (!fs.existsSync(exePath)) {
    console.error("[MODEL API] model-api.exe not found:", exePath);
    return;
  }

  console.log("[MODEL API] Starting:", exePath);

  modelProcess = spawn(exePath, [], {
    cwd: exeDir,
    windowsHide: true,
    stdio: "ignore",
  });

  modelProcess.on("error", (err) => {
    console.error("[MODEL API] Failed to start:", err);
  });

  modelProcess.on("exit", (code, signal) => {
    console.log(`[MODEL API] Exited. code=${code}, signal=${signal}`);
    modelProcess = null;
  });

  // Give Flask/PyInstaller time to load the model.
  // First launch can be slow because RF-DETR and DINOv2 weights are loading.
  for (let i = 1; i <= 60; i += 1) {
    const ok = await checkLocalModelHealth(1000);

    if (ok) {
      console.log("[MODEL API] Local model server is ready.");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.warn("[MODEL API] Started, but health check did not respond within 60 seconds.");
}

function stopModelApi() {
  if (!modelProcess) return;

  try {
    console.log("[MODEL API] Stopping local model server...");
    modelProcess.kill();
  } catch (err) {
    console.error("[MODEL API] Could not stop model server:", err);
  }

  modelProcess = null;
}

function forceQuitApp() {
  if (isQuitting) return;
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
  const iconPath = getAppIconPath();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: true,
    center: true,
    title: "MagniTect",
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      nativeWindowOpen: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      shell.openExternal(url);
    }

    return { action: "deny" };
  });

  mainWindow.webContents.on("did-create-window", (childWindow, details) => {
    if (details?.url && isExternalUrl(details.url)) {
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