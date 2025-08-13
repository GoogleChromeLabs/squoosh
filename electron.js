const { app, BrowserWindow } = require('electron');
const express = require('express');
const path = require('path');

let server;

function startServer() {
  const serverApp = express();
  const staticPath = path.join(__dirname, 'build');

  // Serve static files
  serverApp.use(express.static(staticPath));

  server = serverApp.listen(0, 'localhost', () => {
    const port = server.address().port;
    console.log(`Local server running on http://localhost:${port}`);
    createWindow(port);
  });
}

function createWindow(port) {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Load from local server
  mainWindow.loadURL(`http://localhost:${port}`);
}

app.whenReady().then(startServer);

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    startServer();
  }
});
