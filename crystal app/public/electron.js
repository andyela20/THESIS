const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

app.commandLine.appendSwitch("disable-gpu");
app.disableHardwareAcceleration();

let mainWindow;
let isQuitting = false;

function isExternalUrl(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function forceQuitApp() {
  if (isQuitting) return;
  isQuitting = true;

  try {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.destroy();
      }
    });
  } catch {}

  app.quit();

  setTimeout(() => {
    app.exit(0);
  }, 500);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: true,
    center: true,
    title: "MagniTect",
    icon: path.join(__dirname, "public", "favicon.ico"),
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

  // IMPORTANT: force close even if React/session/page tries to block it.
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

app.whenReady().then(createWindow);

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  forceQuitApp();
});

app.on("activate", () => {
  if (mainWindow === null && !isQuitting) {
    createWindow();
  }
});
