const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { URL } = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'src/assets/LOGOGRAPHIC.ico'),
    title: 'MagniTect',
  });

  const startUrl = process.env.ELECTRON_START_URL || 
    `file://${path.join(__dirname, 'build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // ── Intercept new windows (Google OAuth popup) ──
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // If it's the Google OAuth URL, open in the SAME main window
    if (url.includes('192.168.1.18:5000/api/auth/google') || 
        url.includes('accounts.google.com')) {
      mainWindow.loadURL(url);
      return { action: 'deny' }; // prevent new window
    }
    // All other external links open in system browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // ── After Google login, redirect back to main app ──
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // When Google redirects back with token
    if (url.includes('192.168.1.18:5000/api/auth/google/callback') || 
        url.includes('token=')) {
      // Let it navigate, AuthCallback will handle the token
    }
    // If it somehow lands on 192.168.1.18:5000 root, go back to app
    if (url === 'http://192.168.1.18:5000/' || url === 'http://192.168.1.18:5000') {
      event.preventDefault();
      const startUrl = process.env.ELECTRON_START_URL || 
        `file://${path.join(__dirname, 'build/index.html')}`;
      mainWindow.loadURL(startUrl);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ── Handle Google OAuth token callback ──
app.on('open-url', (event, url) => {
  event.preventDefault();
  const parsedUrl = new URL(url);
  const token    = parsedUrl.searchParams.get('token');
  const username = parsedUrl.searchParams.get('username');
  if (token && mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      localStorage.setItem('token', '${token}');
      localStorage.setItem('username', '${username}');
      window.location.reload();
    `);
  }
});
