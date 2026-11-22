const { app, BrowserWindow, ipcMain, desktopCapturer, session, globalShortcut, shell, clipboard } = require('electron');
const path = require('path');
const { fork } = require('child_process');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let mainWindow;
let serverProcess;

ipcMain.on('open-external-url', (event, url) => {
  if (url) {
    console.log("Opening external URL via shell:", url);
    shell.openExternal(url);
  }
});

function startBackendServer() {
  try {
    const fs = require('fs');
    let serverPath = path.join(__dirname, '../aura_server.js');
    if (!fs.existsSync(serverPath)) {
      serverPath = 'e:\\antigravity\\dcai\\aura_server.js';
    }
    const nodeModulesPath = 'e:\\antigravity\\dcai\\node_modules';
    serverProcess = fork(serverPath, [], {
      env: { 
        ...process.env, 
        PORT: 3001, 
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
        NODE_PATH: nodeModulesPath
      }
    });
    console.log("Aura Server im Hintergrund gestartet");
  } catch (err) {
    console.error("Fehler beim Starten des Backend-Servers:", err);
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0d0e11',
    title: 'Aura AI',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error("did-fail-load:", code, desc);
    const distIndex = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(distIndex);
  });

  mainWindow.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message} (${sourceId}:${line})`);
  });

  const distIndex = path.join(__dirname, '../dist/index.html');
  const fs = require('fs');
  if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    if (mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

app.whenReady().then(() => {
  startBackendServer();
  createMainWindow();

  // Registriere globale Hotkeys: sowohl Alt+Space als auch Ctrl+Shift+A
  const ok1 = globalShortcut.register('Alt+Space', () => {
    console.log("Alt+Space getriggert");
    toggleWindow();
  });
  const ok2 = globalShortcut.register('CommandOrControl+Shift+A', () => {
    console.log("Ctrl+Shift+A getriggert");
    toggleWindow();
  });
  // Globaler Ghost-Writer Shortcut: Ctrl+Alt+G
  const ok3 = globalShortcut.register('CommandOrControl+Alt+G', () => {
    console.log("Ctrl+Alt+G Ghostwriter getriggert");
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
    const clipText = clipboard.readText() || '';
    mainWindow.webContents.send('trigger-ghostwriter', clipText);
  });

  // Globaler Screen-Snipping & OCR Scanner Shortcut: Ctrl+Shift+S
  const ok4 = globalShortcut.register('CommandOrControl+Shift+S', async () => {
    console.log("Ctrl+Shift+S Snipping getriggert");
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
      if (sources && sources.length > 0) {
        const primary = sources[0];
        const dataUrl = primary.thumbnail.toDataURL();
        if (!mainWindow) return;
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('trigger-screen-capture', dataUrl);
      }
    } catch(err) {
      console.error("Screen capture error:", err);
    }
  });
  console.log("Hotkeys registered: Alt+Space ->", ok1, "| Ctrl+Shift+A ->", ok2, "| Ctrl+Alt+G ->", ok3, "| Ctrl+Shift+S ->", ok4);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (serverProcess) {
    serverProcess.kill();
  }
});
