const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('leicaAPI', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  saveState: (state) => ipcRenderer.invoke('save-state', state),
  importLcsDialog: () => ipcRenderer.invoke('import-lcs-dialog'),
  parseRawLcs: (payload) => ipcRenderer.invoke('parse-raw-lcs', payload),
  exportLcsDialog: (payload) => ipcRenderer.invoke('export-lcs-dialog', payload)
});
