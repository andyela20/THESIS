const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

app.commandLine.appendSwitch("disable-gpu");
app.disableHardwareAcceleration();

let mainWindow;
let modelProcess;

function getIconPath() {
  const possiblePaths = [
    path.join(__dirname, "LOGOGRAPHIC.ico"),
    path.join(__dirname, "public", "LOGOGRAPHIC.ico"),
    path.join(__dirname, "src", "assets", "LOGOGRAPHIC.ico")
  ];

  return possiblePaths.find((iconPath) => fs.existsSync(iconPath));
}

function getModelApiPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "model-api", "model-api.exe");
  }

  return path.join(
    __dirname,
    "..",
    "crystalscope-model",
    "dist",
    "model-api",
    "model-api.exe"
  );
}

function startModelApi() {
  const modelApiPath = getModelApiPath();

  if (!fs.existsSync(modelApiPath)) {
    console.error("Model API executable not found:", modelApiPath);
    return;
  }

  modelProcess = spawn(modelApiPath, [], {
  detached: false,
  stdio: "ignore",
  windowsHide: true,
  env: {
    ...process.env,
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8"
  }
});

  modelProcess.on("error", (err) => {
    console.error("Failed to start model API:", err);
  });
}

function createWindow() {
  const iconPath = getIconPath();

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
      webSecurity: true
    }
  });

  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, "index.html")}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.magnitect.desktop");
  }

  startModelApi();

  setTimeout(() => {
    createWindow();
  }, 3000);
});

app.on("window-all-closed", () => {
  if (modelProcess) {
    modelProcess.kill();
    modelProcess = null;
  }

  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (modelProcess) {
    modelProcess.kill();
    modelProcess = null;
  }
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
