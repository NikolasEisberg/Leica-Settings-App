const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  nativeTheme,
  nativeImage,
  shell
} = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const {
  PROFILE_NAME_KEYS,
  PROFILE_NAME_KEY_SET,
  parseLcs,
  serializeLcs
} = require('./lcs-codec');

const {
  CAMERA_MODELS,
  PROFILE_NAME_SUGGESTIONS,
  CATEGORIES,
  SETTINGS_SCHEMA
} = require('./settings-schema');

const APP_NAME = 'Leica Dial & Dot';
const STORE_FILENAME = 'leica-dial-and-dot-store.json';
const LEGACY_STORE_FILENAME = 'leica-settings-studio-store.json';
const PREFS_FILENAME = 'leica-dial-and-dot-preferences.json';
const BUNDLED_LCS_CANDIDATES = [
  path.join(__dirname, '..', 'settings.lcs'),
  path.join(__dirname, '..', 'lcs_samples', 'q3_28', 'settings.lcs')
];
const APP_ICON_PATH = path.join(__dirname, 'assets', 'icon.png');

app.setName(APP_NAME);

function getDefaultBaseDir() {
  try {
    const userDataDir = app.getPath('userData');
    fs.mkdirSync(userDataDir, { recursive: true });
    const testFile = path.join(userDataDir, '.write-test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return userDataDir;
  } catch {
    return path.join(__dirname, '..');
  }
}

function getPrefsFilePath() {
  const baseDir = getDefaultBaseDir();
  const prefix = baseDir === path.join(__dirname, '..') ? '.' : '';
  return path.join(baseDir, `${prefix}${PREFS_FILENAME}`);
}

function loadPreferences() {
  const defaultDir = getDefaultBaseDir();
  const defaults = {
    defaultFolderPath: defaultDir,
    appearance: 'system' // 'system' | 'light' | 'dark'
  };

  const prefsPath = getPrefsFilePath();
  if (fs.existsSync(prefsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(prefsPath, 'utf-8'));
      const appearance = ['system', 'light', 'dark'].includes(parsed?.appearance)
        ? parsed.appearance
        : 'system';
      const folderPath =
        typeof parsed?.defaultFolderPath === 'string' && parsed.defaultFolderPath.trim()
          ? parsed.defaultFolderPath.trim()
          : defaultDir;
      return {
        defaultFolderPath: folderPath,
        appearance
      };
    } catch (err) {
      console.error('Failed to read preferences file, using defaults:', err);
    }
  }

  return defaults;
}

function savePreferences(prefs) {
  try {
    const prefsPath = getPrefsFilePath();
    fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
    fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2), 'utf-8');
    return { ok: true };
  } catch (err) {
    console.error('Failed to save preferences:', err);
    return { ok: false, error: err.message };
  }
}

function resolveStoreFilePath(folderPath) {
  const targetDir = folderPath || loadPreferences().defaultFolderPath || getDefaultBaseDir();
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    return path.join(targetDir, STORE_FILENAME);
  } catch {
    const fallbackDir = getDefaultBaseDir();
    return path.join(fallbackDir, STORE_FILENAME);
  }
}

function getResolvedTheme(appearance) {
  if (appearance === 'light') return 'light';
  if (appearance === 'dark') return 'dark';
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
}

function applyNativeAppearance(appearance) {
  const validAppearance = ['system', 'light', 'dark'].includes(appearance)
    ? appearance
    : 'system';
  nativeTheme.themeSource = validAppearance;
  const resolvedTheme = getResolvedTheme(validAppearance);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setBackgroundColor(resolvedTheme === 'light' ? '#f5f5f7' : '#0e0e10');
    mainWindow.webContents.send('theme-updated', {
      appearance: validAppearance,
      resolvedTheme
    });
  }

  return resolvedTheme;
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
  for (const candidate of BUNDLED_LCS_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf-8');
      return parseLcs(raw);
    }
  }
  return null;
}

function loadAppState() {
  const prefs = loadPreferences();
  const storePath = resolveStoreFilePath(prefs.defaultFolderPath);
  const baseline = loadBaselineLcs();
  const factoryDefaults = baseline ? buildFactoryDefaultsMap(baseline.settings) : {};

  // Check primary store path first, then legacy store paths for seamless migration
  const candidatePaths = [
    storePath,
    path.join(prefs.defaultFolderPath, LEGACY_STORE_FILENAME),
    path.join(getDefaultBaseDir(), LEGACY_STORE_FILENAME),
    path.join(__dirname, '..', `.${LEGACY_STORE_FILENAME}`)
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const saved = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
        if (saved && Array.isArray(saved.configurations) && saved.configurations.length > 0) {
          if (candidate !== storePath) {
            saveAppState(saved, prefs.defaultFolderPath);
          }
          return {
            state: saved,
            factoryDefaults
          };
        }
      } catch (err) {
        console.error('Failed to read saved store from', candidate, err);
      }
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

  saveAppState(initialState, prefs.defaultFolderPath);
  return {
    state: initialState,
    factoryDefaults
  };
}

function saveAppState(state, targetFolder) {
  try {
    const storePath = resolveStoreFilePath(targetFolder);
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(state, null, 2), 'utf-8');
    return { ok: true, storePath };
  } catch (err) {
    console.error('Error saving app state:', err);
    return { ok: false, error: err.message };
  }
}

let mainWindow = null;

function buildAppMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: APP_NAME,
            submenu: [
              { role: 'about', label: `About ${APP_NAME}` },
              { type: 'separator' },
              {
                label: 'Settings…',
                accelerator: 'CmdOrCtrl+,',
                click: () => {
                  if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('open-settings');
                  }
                }
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: `Hide ${APP_NAME}` },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit', label: `Quit ${APP_NAME}` }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        ...(!isMac
          ? [
              {
                label: 'Settings…',
                accelerator: 'CmdOrCtrl+,',
                click: () => {
                  if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('open-settings');
                  }
                }
              },
              { type: 'separator' }
            ]
          : []),
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }]
          : [{ role: 'close' }])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const prefs = loadPreferences();
  nativeTheme.themeSource = prefs.appearance;
  const resolvedTheme = getResolvedTheme(prefs.appearance);

  let iconImage = undefined;
  if (fs.existsSync(APP_ICON_PATH)) {
    iconImage = nativeImage.createFromPath(APP_ICON_PATH);
    if (process.platform === 'darwin' && app.dock && !iconImage.isEmpty()) {
      app.dock.setIcon(iconImage);
    }
  }

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: resolvedTheme === 'light' ? '#f5f5f7' : '#0e0e10',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: APP_NAME,
    icon: iconImage,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  buildAppMenu();

  nativeTheme.on('updated', () => {
    const prefs = loadPreferences();
    const resolvedTheme = getResolvedTheme(prefs.appearance);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBackgroundColor(resolvedTheme === 'light' ? '#f5f5f7' : '#0e0e10');
      mainWindow.webContents.send('theme-updated', {
        appearance: prefs.appearance,
        resolvedTheme
      });
    }
  });

  ipcMain.handle('get-initial-data', () => {
    const preferences = loadPreferences();
    const { state, factoryDefaults } = loadAppState();
    const resolvedTheme = applyNativeAppearance(preferences.appearance);
    return {
      appName: APP_NAME,
      state,
      preferences,
      resolvedTheme,
      defaultSystemFolderPath: getDefaultBaseDir(),
      storeFilePath: resolveStoreFilePath(preferences.defaultFolderPath),
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
    const prefs = loadPreferences();
    return saveAppState(newState, prefs.defaultFolderPath);
  });

  ipcMain.handle('get-preferences', () => {
    const preferences = loadPreferences();
    return {
      preferences,
      resolvedTheme: getResolvedTheme(preferences.appearance),
      defaultSystemFolderPath: getDefaultBaseDir(),
      storeFilePath: resolveStoreFilePath(preferences.defaultFolderPath)
    };
  });

  ipcMain.handle('update-preferences', (_event, { patch, currentState }) => {
    const currentPrefs = loadPreferences();
    const previousFolder = currentPrefs.defaultFolderPath;

    const nextAppearance = ['system', 'light', 'dark'].includes(patch?.appearance)
      ? patch.appearance
      : currentPrefs.appearance;

    let nextFolder = currentPrefs.defaultFolderPath;
    if (typeof patch?.defaultFolderPath === 'string' && patch.defaultFolderPath.trim()) {
      nextFolder = patch.defaultFolderPath.trim();
    }

    try {
      fs.mkdirSync(nextFolder, { recursive: true });
    } catch (err) {
      return { ok: false, error: `Cannot access or create folder: ${err.message}` };
    }

    const updatedPrefs = {
      defaultFolderPath: nextFolder,
      appearance: nextAppearance
    };

    const saveRes = savePreferences(updatedPrefs);
    if (!saveRes.ok) {
      return saveRes;
    }

    // If folder changed, ensure current state is saved/migrated to the new folder
    if (nextFolder !== previousFolder || currentState) {
      const targetStorePath = resolveStoreFilePath(nextFolder);
      if (currentState) {
        saveAppState(currentState, nextFolder);
      } else {
        const oldStorePath = resolveStoreFilePath(previousFolder);
        if (fs.existsSync(oldStorePath) && !fs.existsSync(targetStorePath)) {
          try {
            fs.copyFileSync(oldStorePath, targetStorePath);
          } catch (err) {
            console.error('Failed to migrate store file to new folder:', err);
          }
        }
      }
    }

    const resolvedTheme = applyNativeAppearance(nextAppearance);

    return {
      ok: true,
      preferences: updatedPrefs,
      resolvedTheme,
      defaultSystemFolderPath: getDefaultBaseDir(),
      storeFilePath: resolveStoreFilePath(nextFolder)
    };
  });

  ipcMain.handle('choose-default-folder', async () => {
    const prefs = loadPreferences();
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Default Folder for Leica Dial & Dot',
      defaultPath: prefs.defaultFolderPath,
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true };
    }

    return {
      canceled: false,
      folderPath: result.filePaths[0]
    };
  });

  ipcMain.handle('open-folder-in-finder', async (_event, folderPath) => {
    const prefs = loadPreferences();
    const target = folderPath || prefs.defaultFolderPath;
    try {
      await shell.openPath(target);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('import-lcs-dialog', async () => {
    const prefs = loadPreferences();
    const result = await dialog.showOpenDialog(mainWindow, {
      title: `Import Leica Settings File (.lcs) — ${APP_NAME}`,
      defaultPath: prefs.defaultFolderPath,
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
      const baseName = path.basename(
        fileName || 'settings.lcs',
        path.extname(fileName || 'settings.lcs')
      );
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
    const prefs = loadPreferences();
    const safeFileName = (suggestedFileName || 'settings.lcs').endsWith('.lcs')
      ? suggestedFileName
      : `${suggestedFileName}.lcs`;

    const defaultExportPath = prefs.defaultFolderPath
      ? path.join(prefs.defaultFolderPath, safeFileName)
      : safeFileName;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: `Export Leica Settings File (.lcs) — ${APP_NAME}`,
      defaultPath: defaultExportPath,
      filters: [{ name: 'Leica Camera Settings (.lcs)', extensions: ['lcs'] }]
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
