const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stemify', {
  platform: process.platform,
  backendUrl: 'http://127.0.0.1:5001',
  onBackendStatus: (cb) =>
    ipcRenderer.on('backend-status', (_e, msg) => cb(msg)),
});
