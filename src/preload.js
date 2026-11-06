const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('leicaAPI', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  saveState: (state) => ipcRenderer.invoke('save-state', state),
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  updatePreferences: (payload) => ipcRenderer.invoke('update-preferences', payload),
  chooseDefaultFolder: () => ipcRenderer.invoke('choose-default-folder'),
  openFolderInFinder: (folderPath) => ipcRenderer.invoke('open-folder-in-finder', folderPath),
  importLcsDialog: () => ipcRenderer.invoke('import-lcs-dialog'),
  parseRawLcs: (payload) => ipcRenderer.invoke('parse-raw-lcs', payload),
  exportLcsDialog: (payload) => ipcRenderer.invoke('export-lcs-dialog', payload),
  onOpenSettings: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('open-settings', handler);
    return () => ipcRenderer.removeListener('open-settings', handler);
  },
  onThemeUpdated: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('theme-updated', handler);
    return () => ipcRenderer.removeListener('theme-updated', handler);
  }
});
