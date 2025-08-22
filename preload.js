// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs seguras do processo principal para o processo de renderização
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  scanVideos: (folderPath) => ipcRenderer.invoke('videos:scan', folderPath),
  updateProgress: (data) => ipcRenderer.send('video:updateProgress', data),
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  }
});
