// Electron shell for the USDB CS FILES portal.
// Runs the existing Express server inside the app and shows it in a native
// window, so the desktop build is the exact same product as the website.
import { app, BrowserWindow, shell, dialog } from 'electron';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keep all mutable state (SQLite db, uploaded files) in the per-user app data
// folder — the install/asar directory is read-only.
const userData = app.getPath('userData');
process.env.DATA_DIR = process.env.DATA_DIR || path.join(userData, 'data');
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(userData, 'uploads');
// Only this machine should be able to reach the embedded server.
process.env.HOST = process.env.HOST || '127.0.0.1';

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 15000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Server did not start within ${timeoutMs / 1000}s`));
        } else {
          setTimeout(attempt, 250);
        }
      });
    };
    attempt();
  });
}

async function createWindow() {
  const port = await getFreePort();
  process.env.PORT = String(port);

  // Import after env is set — the server reads PORT/DATA_DIR/UPLOAD_DIR at load.
  await import('../src/server.js');
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(baseUrl);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'USDB CS FILES',
    autoHideMenuBar: true,
    backgroundColor: '#0b1020',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Any link that leaves the app (external sites) opens in the default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(baseUrl)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  await win.loadURL(baseUrl);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() =>
    createWindow().catch((err) => {
      dialog.showErrorBox('USDB CS FILES failed to start', String(err?.stack || err));
      app.quit();
    })
  );

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
