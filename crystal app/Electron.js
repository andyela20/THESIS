const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

app.commandLine.appendSwitch("disable-gpu");
app.disableHardwareAcceleration();

let mainWindow;

function isExternalUrl(url) {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
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
      nativeWindowOpen: false
    }
  });

  // Force all new browser windows, including Google OAuth, to open externally.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      shell.openExternal(url);
      return { action: "deny" };
    }

    return { action: "deny" };
  });

  // Backup catcher: if Electron still creates a child window, close it and open URL in browser.
  mainWindow.webContents.on("did-create-window", (childWindow, details) => {
    if (details && details.url && isExternalUrl(details.url)) {
      shell.openExternal(details.url);
    }

    try {
      childWindow.close();
    } catch {}
  });

  // Prevent the main app window from being redirected to Google/browser pages.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const isAppUrl =
      url.startsWith("http://localhost:3000") ||
      url.startsWith("file://");

    if (!isAppUrl && isExternalUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
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

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
