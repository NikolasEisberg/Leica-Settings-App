const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const {
  PROFILE_NAME_KEYS,
  PROFILE_NAME_KEY_SET,
  parseLcs,
  serializeLcs,
  getSlotValue
} = require('./lcs-codec');

const {
  CAMERA_MODELS,
  PROFILE_NAME_SUGGESTIONS,
  CATEGORIES,
  SETTINGS_SCHEMA
} = require('./settings-schema');

const BUNDLED_LCS_PATH = path.join(__dirname, '..', 'settings.lcs');

function getStorePath() {
  try {
    const userDataDir = app.getPath('userData');
    fs.mkdirSync(userDataDir, { recursive: true });
    const testFile = path.join(userDataDir, '.write-test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return path.join(userDataDir, 'leica-settings-studio-store.json');
  } catch {
    return path.join(__dirname, '..', '.leica-settings-studio-store.json');
  }
}

/**
 * Build a Factory Default reference map from slot 6 (User6) of the baseline settings.lcs
 */
function buildFactoryDefaultsMap(baselineSettings) {
  const defaults = {};
  for (const [key, arr] of Object.entries(baselineSettings)) {
    if (PROFILE_NAME_KEY_SET.has(key)) {
      const profMeta = PROFILE_NAME_KEYS.find((p) => p.key === key);
      defaults[key] = profMeta ? profMeta.defaultName : arr[0];
    } else if (Array.isArray(arr) && arr.length === 7) {
      // Slot 6 ("User6") in settings.lcs is untouched factory default
      defaults[key] = arr[6];
    } else if (Array.isArray(arr) && arr.length === 21) {
      defaults[key] = `${arr[18]}, ${arr[19]}, ${arr[20]}`;
    } else if (Array.isArray(arr)) {
      defaults[key] = arr[0];
    }
  }
  return defaults;
}

/**
 * Create a clean Factory Default configuration object from the baseline parsed .lcs
 */
function createFactoryDefaultConfig(baselineParsed) {
  const settingsCopy = {};
  for (const key of baselineParsed.keyOrder) {
    const arr = baselineParsed.settings[key];
    if (PROFILE_NAME_KEY_SET.has(key)) {
      const profMeta = PROFILE_NAME_KEYS.find((p) => p.key === key);
      settingsCopy[key] = [profMeta ? profMeta.defaultName : arr[0]];
    } else if (Array.isArray(arr) && arr.length === 7) {
      const defVal = arr[6];
      settingsCopy[key] = [defVal, defVal, defVal, defVal, defVal, defVal, defVal];
    } else {
      settingsCopy[key] = [...arr];
    }
  }

  return {
    id: 'config-factory-q3',
    name: 'Factory Default Baseline',
    camera: baselineParsed.camera || 'LEICA Q3',
    notes: 'Clean factory defaults extracted from Leica Q3 profile slots',
    sourceFileName: 'settings.lcs (Factory Baseline)',
    updatedAt: new Date().toISOString(),
    keyOrder: [...baselineParsed.keyOrder],
    settings: settingsCopy
  };
}

function loadBaselineLcs() {
  if (fs.existsSync(BUNDLED_LCS_PATH)) {
    const raw = fs.readFileSync(BUNDLED_LCS_PATH, 'utf-8');
    return parseLcs(raw);
  }
  return null;
}

function loadAppState() {
  const storePath = getStorePath();
  const baseline = loadBaselineLcs();
  const factoryDefaults = baseline ? buildFactoryDefaultsMap(baseline.settings) : {};

  if (fs.existsSync(storePath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      if (saved && Array.isArray(saved.configurations) && saved.configurations.length > 0) {
        return {
          state: saved,
          factoryDefaults
        };
      }
    } catch (err) {
      console.error('Failed to read saved store, initializing fresh state:', err);
    }
  }

  // Initialize first-time state seeded with the user's settings.lcs
  const configurations = [];
  if (baseline) {
    configurations.push({
      id: 'config-initial-q3',
      name: 'Nikolas Setup',
      camera: baseline.camera || 'LEICA Q3',
      notes: 'Imported from workspace settings.lcs',
      sourceFileName: 'settings.lcs',
      updatedAt: new Date().toISOString(),
      keyOrder: baseline.keyOrder,
      settings: baseline.settings
    });
    configurations.push(createFactoryDefaultConfig(baseline));
  }

  const initialState = {
    activeConfigId: configurations[0]?.id || null,
    activeSlotIndex: 1, // Default to Slot 1 ("Nikolas")
    syncSlotZero: true,
    activeTab: 'exposure',
    inspectorFilters: {
      hideDefaults: false,
      hideIdentical: false,
      compareConfigId: 'config-factory-q3'
    },
    customSchema: {},
    configurations
  };

  saveAppState(initialState);
  return {
    state: initialState,
    factoryDefaults
  };
}

function saveAppState(state) {
  try {
    const storePath = getStorePath();
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(state, null, 2), 'utf-8');
    return { ok: true };
  } catch (err) {
    console.error('Error saving app state:', err);
    return { ok: false, error: err.message };
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#0e0e10',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'Leica Settings Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('get-initial-data', () => {
    const { state, factoryDefaults } = loadAppState();
    return {
      state,
      factoryDefaults,
      schema: {
        CAMERA_MODELS,
        PROFILE_NAME_SUGGESTIONS,
        PROFILE_NAME_KEYS,
        CATEGORIES,
        SETTINGS_SCHEMA
      }
    };
  });

  ipcMain.handle('save-state', (_event, newState) => {
    return saveAppState(newState);
  });

  ipcMain.handle('import-lcs-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Leica Settings File (.lcs)',
      properties: ['openFile'],
      filters: [
        { name: 'Leica Camera Settings (.lcs)', extensions: ['lcs', 'json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    try {
      const rawText = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseLcs(rawText);
      const baseName = path.basename(filePath, path.extname(filePath));
      const newConfig = {
        id: `config-${crypto.randomUUID().slice(0, 8)}`,
        name: baseName === 'settings' ? `${parsed.camera} Imported` : baseName,
        camera: parsed.camera,
        notes: `Imported from ${path.basename(filePath)}`,
        sourceFileName: path.basename(filePath),
        updatedAt: new Date().toISOString(),
        keyOrder: parsed.keyOrder,
        settings: parsed.settings
      };
      return { canceled: false, config: newConfig };
    } catch (err) {
      return { canceled: false, error: err.message };
    }
  });

  ipcMain.handle('parse-raw-lcs', (_event, { rawText, fileName }) => {
    try {
      const parsed = parseLcs(rawText);
      const baseName = path.basename(fileName || 'settings.lcs', path.extname(fileName || 'settings.lcs'));
      const newConfig = {
        id: `config-${crypto.randomUUID().slice(0, 8)}`,
        name: baseName === 'settings' ? `${parsed.camera} Imported` : baseName,
        camera: parsed.camera,
        notes: `Imported from ${fileName || 'settings.lcs'}`,
        sourceFileName: fileName || 'settings.lcs',
        updatedAt: new Date().toISOString(),
        keyOrder: parsed.keyOrder,
        settings: parsed.settings
      };
      return { config: newConfig };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('export-lcs-dialog', async (_event, { config, suggestedFileName }) => {
    const safeFileName = (suggestedFileName || 'settings.lcs').endsWith('.lcs')
      ? suggestedFileName
      : `${suggestedFileName}.lcs`;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Leica Settings File (.lcs)',
      defaultPath: safeFileName,
      filters: [
        { name: 'Leica Camera Settings (.lcs)', extensions: ['lcs'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    try {
      const serialized = serializeLcs(config);
      fs.writeFileSync(result.filePath, serialized, 'utf-8');
      return {
        canceled: false,
        filePath: result.filePath,
        bytesWritten: Buffer.byteLength(serialized, 'utf-8')
      };
    } catch (err) {
      return { canceled: false, error: err.message };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
