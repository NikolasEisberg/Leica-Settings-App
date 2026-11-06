/* global window, document */

let appState = null;
let appPreferences = {
  defaultFolderPath: '',
  appearance: 'system'
};
let currentResolvedTheme = 'dark';
let defaultSystemFolderPath = '';
let currentStoreFilePath = '';
let factoryDefaults = {};
let schema = null;
let inspectorSearchQuery = '';
let selectedExportPreset = 'standard'; // 'standard' | 'camera_config' | 'custom'

const PROFILE_SLOT_META = [
  { slotIndex: 0, label: 'Active State', key: null },
  { slotIndex: 1, label: 'Profile 1', key: 'D037' },
  { slotIndex: 2, label: 'Profile 2', key: 'D038' },
  { slotIndex: 3, label: 'Profile 3', key: 'D039' },
  { slotIndex: 4, label: 'Profile 4', key: 'D03A' },
  { slotIndex: 5, label: 'Profile 5', key: 'D0AD' },
  { slotIndex: 6, label: 'Profile 6', key: 'D0AE' }
];

const PROFILE_KEYS_SET = new Set(['D037', 'D038', 'D039', 'D03A', 'D0AD', 'D0AE']);

const PHOTO_TO_VIDEO_FN_MAP = [
  ['D191', 'D1BD'],
  ['D193', 'D1D1'],
  ['D195', 'D1D5'],
  ['D1D6', 'D1D8'],
  ['D1D7', 'D1D9'],
  ['D1DA', 'D1DB']
];

function getActiveConfig() {
  if (!appState || !Array.isArray(appState.configurations)) return null;
  return (
    appState.configurations.find((c) => c.id === appState.activeConfigId) ||
    appState.configurations[0] ||
    null
  );
}

function getSlotVal(settings, key, slotIndex) {
  const arr = settings[key];
  if (!Array.isArray(arr)) return undefined;
  if (PROFILE_KEYS_SET.has(key)) return arr[0];
  if (arr.length === 7) return arr[slotIndex];
  if (arr.length === 21) {
    const base = slotIndex * 3;
    return `${arr[base]}, ${arr[base + 1]}, ${arr[base + 2]}`;
  }
  return arr[0];
}

function setSlotVal(settings, key, slotIndex, rawVal) {
  const arr = settings[key];
  if (!Array.isArray(arr)) return;

  if (PROFILE_KEYS_SET.has(key)) {
    arr[0] = String(rawVal);
    return;
  }

  if (arr.length === 21) {
    const parts = String(rawVal)
      .split(',')
      .map((s) => Number(s.trim()));
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      const base = slotIndex * 3;
      arr[base] = parts[0];
      arr[base + 1] = parts[1];
      arr[base + 2] = parts[2];
    }
    return;
  }

  // Coerce type to match existing element type (number vs string)
  const sample = arr[0];
  const typedVal = typeof sample === 'number' ? Number(rawVal) : String(rawVal);
  if (arr.length === 7) {
    arr[slotIndex] = typedVal;
  } else {
    arr[0] = typedVal;
  }
}

function setAllSlotsVal(settings, key, rawVal) {
  for (let i = 0; i < 7; i++) {
    setSlotVal(settings, key, i, rawVal);
  }
}

function isSettingDefaultInSlot(settings, key, slotIndex) {
  if (PROFILE_KEYS_SET.has(key)) return true;
  const val = getSlotVal(settings, key, slotIndex);
  const defVal = factoryDefaults[key];
  if (defVal === undefined) return true;
  return String(val) === String(defVal);
}

function isSettingAllDefaultsAcrossSlots(settings, key) {
  if (PROFILE_KEYS_SET.has(key)) return true;
  for (let i = 0; i < 7; i++) {
    if (!isSettingDefaultInSlot(settings, key, i)) {
      return false;
    }
  }
  return true;
}

function isSettingIdenticalAcrossComparison(config, compareConfig, key) {
  if (PROFILE_KEYS_SET.has(key)) {
    if (!compareConfig) return true;
    return String(config.settings[key]?.[0]) === String(compareConfig.settings[key]?.[0]);
  }

  const firstVal = String(getSlotVal(config.settings, key, 0));
  for (let i = 1; i < 7; i++) {
    if (String(getSlotVal(config.settings, key, i)) !== firstVal) {
      return false;
    }
  }

  if (compareConfig && compareConfig.settings && compareConfig.settings[key]) {
    for (let i = 0; i < 7; i++) {
      if (String(getSlotVal(compareConfig.settings, key, i)) !== firstVal) {
        return false;
      }
    }
  }

  return true;
}

function countSlotDiffsFromDefault(config, slotIndex) {
  if (!config || !config.settings) return 0;
  let count = 0;
  for (const key of Object.keys(config.settings)) {
    if (PROFILE_KEYS_SET.has(key)) continue;
    if (!isSettingDefaultInSlot(config.settings, key, slotIndex)) {
      count++;
    }
  }
  return count;
}

function buildDropdownOptionsForKey(key, currentValues = []) {
  const customEntry = appState?.customSchema?.[key];
  const schemaEntry = customEntry || schema.SETTINGS_SCHEMA[key];
  const baseOptions =
    schemaEntry && Array.isArray(schemaEntry.options) ? [...schemaEntry.options] : [];

  const defVal = factoryDefaults[key];

  if (baseOptions.length === 0) {
    const sample = currentValues.find((v) => v !== undefined) ?? defVal ?? 0;
    if (typeof sample === 'string' && sample.includes(',')) {
      baseOptions.push(
        { value: '36, 1, 95', label: '36, 1, 95 (50mm f/0.95 Default)' },
        { value: '30, 1, 40', label: '30, 1, 40 (35mm f/1.4 Summilux)' },
        { value: '37, 1, 40', label: '37, 1, 40 (50mm f/1.4 Summilux)' },
        { value: '32, 2, 0', label: '32, 2, 0 (35mm f/2.0 Summicron)' }
      );
    } else if (typeof sample === 'string') {
      baseOptions.push({ value: sample, label: `${sample}` });
    } else {
      const nums = new Set([-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]);
      if (typeof defVal === 'number') nums.add(defVal);
      for (const v of currentValues) {
        if (typeof v === 'number') nums.add(v);
      }
      for (const n of Array.from(nums).sort((a, b) => a - b)) {
        baseOptions.push({
          value: n,
          label: n === defVal ? `${n} (Factory Default)` : `${n}`
        });
      }
    }
  }

  const seen = new Set(baseOptions.map((o) => String(o.value)));
  if (defVal !== undefined && !seen.has(String(defVal))) {
    baseOptions.push({ value: defVal, label: `${defVal} (Factory Default)` });
    seen.add(String(defVal));
  }
  for (const v of currentValues) {
    if (v !== undefined && !seen.has(String(v))) {
      baseOptions.push({ value: v, label: `${v} (Current Value)` });
      seen.add(String(v));
    }
  }

  return baseOptions;
}

async function persistState(toastMessage) {
  const activeConfig = getActiveConfig();
  if (activeConfig) {
    activeConfig.updatedAt = new Date().toISOString();
  }
  const statusEl = document.getElementById('save-status-indicator');
  if (statusEl) statusEl.textContent = 'Saving…';

  await window.leicaAPI.saveState(appState);

  if (statusEl) statusEl.textContent = 'Saved across sessions';
  if (toastMessage) {
    showToast(toastMessage);
  }
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add('hidden');
  }, 2600);
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function renderAll() {
  renderSidebarConfigList();
  renderConfigToolbar();
  renderProfileBar();
  renderCategoryTabs();
  renderMainContent();
}

function renderSidebarConfigList() {
  const listEl = document.getElementById('config-list');
  listEl.innerHTML = '';

  const activeConfig = getActiveConfig();

  for (const cfg of appState.configurations) {
    const item = document.createElement('div');
    item.className = `config-item ${activeConfig && cfg.id === activeConfig.id ? 'active' : ''}`;

    const profNames = ['D037', 'D038', 'D039', 'D03A', 'D0AD', 'D0AE']
      .map((k) => cfg.settings[k]?.[0])
      .filter(Boolean)
      .join(' · ');

    const slot1Diffs = countSlotDiffsFromDefault(cfg, 1);
    const dateStr = cfg.updatedAt
      ? new Date(cfg.updatedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';

    item.innerHTML = `
      <div class="config-item-top">
        <span class="config-item-name">${escapeHtml(cfg.name || 'Untitled Setup')}</span>
        <span class="camera-badge">${escapeHtml(cfg.camera || 'LEICA Q3')}</span>
      </div>
      <div class="config-item-profiles">Profiles: ${escapeHtml(profNames)}</div>
      <div class="config-item-meta">
        <span>${slot1Diffs} custom setting${slot1Diffs === 1 ? '' : 's'}</span>
        <span>${escapeHtml(dateStr)}</span>
      </div>
    `;

    item.addEventListener('click', () => {
      appState.activeConfigId = cfg.id;
      persistState();
      renderAll();
    });

    listEl.appendChild(item);
  }
}

function renderConfigToolbar() {
  const cfg = getActiveConfig();
  const nameInput = document.getElementById('input-config-name');
  const camSelect = document.getElementById('select-camera-model');

  if (!cfg) return;

  nameInput.value = cfg.name || '';
  cfg.camera = 'LEICA Q3';

  camSelect.innerHTML = '<option value="LEICA Q3" selected>LEICA Q3</option>';
  camSelect.disabled = true;
}

function renderProfileBar() {
  const cfg = getActiveConfig();
  if (!cfg) return;

  const chkSync = document.getElementById('chk-sync-slot0');
  chkSync.checked = Boolean(appState.syncSlotZero);

  const tabsContainer = document.getElementById('profile-tabs');
  tabsContainer.innerHTML = '';

  const activeSlot = appState.activeSlotIndex ?? 1;

  for (const meta of PROFILE_SLOT_META) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `profile-tab ${meta.slotIndex === activeSlot ? 'active' : ''}`;

    const slotName = meta.key
      ? cfg.settings[meta.key]?.[0] || `User${meta.slotIndex}`
      : 'Active State';

    const diffCount = countSlotDiffsFromDefault(cfg, meta.slotIndex);

    tab.innerHTML = `
      <div class="profile-tab-top">
        <span>${escapeHtml(meta.label)}</span>
        <span class="profile-tab-diff-pill ${diffCount === 0 ? 'clean' : ''}">
          ${diffCount === 0 ? 'Default' : `${diffCount} diff`}
        </span>
      </div>
      <div class="profile-tab-name">${escapeHtml(slotName)}</div>
    `;

    tab.addEventListener('click', () => {
      appState.activeSlotIndex = meta.slotIndex;
      persistState();
      renderProfileBar();
      renderCategoryTabs();
      renderMainContent();
    });

    tabsContainer.appendChild(tab);
  }

  // Profile Name open input bar (for Slots 1..6)
  const nameBar = document.getElementById('profile-name-bar');
  const currentMeta = PROFILE_SLOT_META.find((m) => m.slotIndex === activeSlot);

  if (currentMeta && currentMeta.key) {
    nameBar.classList.remove('hidden');
    const currentName = cfg.settings[currentMeta.key]?.[0] || '';
    document.getElementById('profile-name-key-badge').textContent = currentMeta.label;
    const nameInput = document.getElementById('input-profile-name');
    nameInput.value = currentName;
    document.getElementById('profile-name-char-count').textContent = `${currentName.length}/10`;

    const suggestionSelect = document.getElementById('select-profile-suggestion');
    suggestionSelect.innerHTML = '<option value="">Choose recommended name…</option>';
    for (const suggestion of schema.PROFILE_NAME_SUGGESTIONS) {
      const opt = document.createElement('option');
      opt.value = suggestion;
      opt.textContent = suggestion;
      suggestionSelect.appendChild(opt);
    }
  } else {
    nameBar.classList.add('hidden');
  }
}

function renderCategoryTabs() {
  const cfg = getActiveConfig();
  if (!cfg) return;

  const nav = document.getElementById('category-tabs');
  nav.innerHTML = '';

  const activeSlot = appState.activeSlotIndex ?? 1;

  for (const cat of schema.CATEGORIES) {
    const keysInCat = Object.entries(schema.SETTINGS_SCHEMA)
      .filter(([, def]) => def.category === cat.id)
      .map(([k]) => k);

    const modifiedInCat = keysInCat.filter(
      (k) => !isSettingDefaultInSlot(cfg.settings, k, activeSlot)
    ).length;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `category-tab ${appState.activeTab === cat.id ? 'active' : ''}`;
    btn.innerHTML = `
      <span>${cat.icon} ${escapeHtml(cat.title)}</span>
      <span class="category-badge ${modifiedInCat > 0 ? 'has-diff' : ''}">
        ${modifiedInCat > 0 ? `${modifiedInCat} modified` : keysInCat.length}
      </span>
    `;
    btn.addEventListener('click', () => {
      appState.activeTab = cat.id;
      persistState();
      renderCategoryTabs();
      renderMainContent();
    });
    nav.appendChild(btn);
  }

  // Diff & All 346 Settings Inspector Tab
  const totalDiffsInSlot = countSlotDiffsFromDefault(cfg, activeSlot);
  const inspectorBtn = document.createElement('button');
  inspectorBtn.type = 'button';
  inspectorBtn.className = `category-tab ${appState.activeTab === 'inspector' ? 'active' : ''}`;
  inspectorBtn.innerHTML = `
    <span>🔍 Diff &amp; All Settings Inspector (346)</span>
    <span class="category-badge ${totalDiffsInSlot > 0 ? 'has-diff' : ''}">
      ${totalDiffsInSlot} custom
    </span>
  `;
  inspectorBtn.addEventListener('click', () => {
    appState.activeTab = 'inspector';
    persistState();
    renderCategoryTabs();
    renderMainContent();
  });
  nav.appendChild(inspectorBtn);
}

function renderMainContent() {
  const container = document.getElementById('settings-container');
  container.innerHTML = '';

  const cfg = getActiveConfig();
  if (!cfg) return;

  if (appState.activeTab === 'inspector') {
    renderInspectorView(container, cfg);
    return;
  }

  const cat = schema.CATEGORIES.find((c) => c.id === appState.activeTab) || schema.CATEGORIES[0];
  const activeSlot = appState.activeSlotIndex ?? 1;
  const slotMeta = PROFILE_SLOT_META.find((m) => m.slotIndex === activeSlot);
  const slotDisplayName = slotMeta?.key
    ? `${slotMeta.label} ("${cfg.settings[slotMeta.key]?.[0] || ''}")`
    : 'Slot 0 (Active Camera State)';

  // Banner
  const banner = document.createElement('div');
  banner.className = 'category-header-banner';
  banner.innerHTML = `
    <div>
      <h3>${cat.icon} ${escapeHtml(cat.title)} — <span class="category-slot-accent">${escapeHtml(slotDisplayName)}</span></h3>
      <p>${escapeHtml(cat.description)}</p>
    </div>
    <div id="category-extra-actions"></div>
  `;
  container.appendChild(banner);

  if (cat.id === 'buttons') {
    const extraEl = banner.querySelector('#category-extra-actions');
    const copyFnBtn = document.createElement('button');
    copyFnBtn.className = 'btn btn-secondary btn-sm';
    copyFnBtn.textContent = 'Copy Photo Mode FN Buttons → Video Mode';
    copyFnBtn.addEventListener('click', () => {
      for (const [photoKey, videoKey] of PHOTO_TO_VIDEO_FN_MAP) {
        const val = getSlotVal(cfg.settings, photoKey, activeSlot);
        if (val !== undefined) {
          applyValueChange(cfg, videoKey, activeSlot, val);
        }
      }
      persistState('Copied Photo Mode button assignments to Video Mode');
      renderAll();
    });
    extraEl.appendChild(copyFnBtn);
  }

  const grid = document.createElement('div');
  grid.className = 'settings-grid';

  const entries = Object.entries(schema.SETTINGS_SCHEMA).filter(
    ([key, def]) => def.category === cat.id && cfg.settings[key] !== undefined
  );

  for (const [key, def] of entries) {
    const card = createSettingCard(cfg, key, def, activeSlot);
    grid.appendChild(card);
  }

  container.appendChild(grid);
}

function createSettingCard(cfg, key, def, activeSlot) {
  const currentVal = getSlotVal(cfg.settings, key, activeSlot);
  const isModified = !isSettingDefaultInSlot(cfg.settings, key, activeSlot);
  const defVal = factoryDefaults[key];

  const card = document.createElement('div');
  card.className = `setting-card ${isModified ? 'modified' : ''}`;

  const top = document.createElement('div');
  top.className = 'setting-card-top';
  top.innerHTML = `
    <div>
      <div class="setting-title-row">
        <span class="setting-title">${escapeHtml(def.label)}</span>
        ${isModified ? '<span class="modified-badge">Modified</span>' : ''}
      </div>
      <div class="setting-desc">${escapeHtml(def.description || '')}</div>
    </div>
  `;
  card.appendChild(top);

  const controlsRow = document.createElement('div');
  controlsRow.className = 'setting-controls-row';

  if (def.type === 'text_with_presets') {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.value = currentVal ?? '';
    input.placeholder = def.label;
    input.addEventListener('change', () => {
      applyValueChange(cfg, key, activeSlot, input.value);
      persistState(`Updated ${def.label}`);
      renderAll();
    });

    const presetSelect = document.createElement('select');
    presetSelect.className = 'dropdown-select dropdown-sm';
    presetSelect.style.maxWidth = '155px';
    presetSelect.innerHTML = '<option value="__none__">Presets…</option>';
    for (const p of def.presets || []) {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p === '' ? '(Empty)' : p;
      presetSelect.appendChild(opt);
    }
    presetSelect.addEventListener('change', () => {
      if (presetSelect.value === '__none__') return;
      applyValueChange(cfg, key, activeSlot, presetSelect.value);
      persistState(`Applied preset for ${def.label}`);
      renderAll();
    });

    controlsRow.appendChild(input);
    controlsRow.appendChild(presetSelect);
  } else {
    // Dropdown control
    const allSlotVals = [0, 1, 2, 3, 4, 5, 6].map((i) => getSlotVal(cfg.settings, key, i));
    const options = buildDropdownOptionsForKey(key, allSlotVals);

    const select = document.createElement('select');
    select.className = 'dropdown-select';
    for (const optDef of options) {
      const opt = document.createElement('option');
      opt.value = String(optDef.value);
      opt.textContent = optDef.label;
      if (String(optDef.value) === String(currentVal)) {
        opt.selected = true;
      }
      select.appendChild(opt);
    }

    select.addEventListener('change', () => {
      applyValueChange(cfg, key, activeSlot, select.value);
      persistState(`Adjusted ${def.label}`);
      renderAll();
    });

    controlsRow.appendChild(select);
  }

  // Apply to all 7 slots button
  const btnAllSlots = document.createElement('button');
  btnAllSlots.type = 'button';
  btnAllSlots.className = 'btn btn-secondary btn-sm';
  btnAllSlots.title = 'Apply this setting value to all 7 profile slots';
  btnAllSlots.textContent = '⇉ All 7';
  btnAllSlots.addEventListener('click', () => {
    const val = getSlotVal(cfg.settings, key, activeSlot);
    setAllSlotsVal(cfg.settings, key, val);
    persistState(`Applied ${def.label} to all 7 profile slots`);
    renderAll();
  });
  controlsRow.appendChild(btnAllSlots);

  // Reset to Factory Default button
  if (defVal !== undefined) {
    const btnReset = document.createElement('button');
    btnReset.type = 'button';
    btnReset.className = 'btn btn-ghost btn-sm';
    btnReset.title = `Reset to Factory Default (${defVal})`;
    btnReset.textContent = '↺';
    btnReset.addEventListener('click', () => {
      applyValueChange(cfg, key, activeSlot, defVal);
      persistState(`Reset ${def.label} to factory default`);
      renderAll();
    });
    controlsRow.appendChild(btnReset);
  }

  card.appendChild(controlsRow);

  // 7-slot mini strip preview
  const preview = document.createElement('div');
  preview.className = 'setting-slots-preview';
  preview.innerHTML = '<span>Slots [0–6]:</span>';
  for (let i = 0; i < 7; i++) {
    const pill = document.createElement('span');
    pill.className = `slot-mini-pill ${i === activeSlot ? 'active-slot' : ''}`;
    pill.textContent = `${i}:${getSlotVal(cfg.settings, key, i)}`;
    preview.appendChild(pill);
  }
  card.appendChild(preview);

  return card;
}

// ============================================================================
// DIFF & ALL 346 SETTINGS INSPECTOR VIEW
// ============================================================================

function renderInspectorView(container, cfg) {
  const filters = appState.inspectorFilters || {
    hideDefaults: false,
    hideIdentical: false,
    compareConfigId: ''
  };
  appState.inspectorFilters = filters;

  const compareConfig =
    appState.configurations.find((c) => c.id === filters.compareConfigId && c.id !== cfg.id) ||
    null;

  const toolbar = document.createElement('div');
  toolbar.className = 'inspector-toolbar';

  toolbar.innerHTML = `
    <div class="inspector-filters-left">
      <input
        id="inspector-search-input"
        type="text"
        class="text-input inspector-search"
        placeholder="Search setting name…"
        value="${escapeHtml(inspectorSearchQuery)}"
      />

      <label class="filter-pill-toggle" title="Hide settings whose values match the camera's factory defaults">
        <input type="checkbox" id="chk-hide-defaults" ${filters.hideDefaults ? 'checked' : ''} />
        <span>Hide Default Settings</span>
      </label>

      <label class="filter-pill-toggle" title="Hide settings where all profile slots (and compared config) have the same value">
        <input type="checkbox" id="chk-hide-identical" ${filters.hideIdentical ? 'checked' : ''} />
        <span>Hide Identical Settings</span>
      </label>
    </div>

    <div class="field-group" style="flex-direction:row; align-items:center; gap:8px;">
      <label for="select-compare-config" style="margin:0;">Compare Against:</label>
      <select id="select-compare-config" class="dropdown-select dropdown-sm">
        <option value="">None (Compare 7 Slots Internally)</option>
      </select>
    </div>
  `;

  container.appendChild(toolbar);

  const compareSelect = toolbar.querySelector('#select-compare-config');
  for (const other of appState.configurations) {
    if (other.id === cfg.id) continue;
    const opt = document.createElement('option');
    opt.value = other.id;
    opt.textContent = `${other.name} (${other.camera})`;
    if (other.id === filters.compareConfigId) opt.selected = true;
    compareSelect.appendChild(opt);
  }

  toolbar.querySelector('#inspector-search-input').addEventListener('input', (e) => {
    inspectorSearchQuery = e.target.value;
    renderInspectorTable(container, cfg, compareConfig);
  });

  toolbar.querySelector('#chk-hide-defaults').addEventListener('change', (e) => {
    filters.hideDefaults = e.target.checked;
    persistState();
    renderInspectorTable(container, cfg, compareConfig);
  });

  toolbar.querySelector('#chk-hide-identical').addEventListener('change', (e) => {
    filters.hideIdentical = e.target.checked;
    persistState();
    renderInspectorTable(container, cfg, compareConfig);
  });

  compareSelect.addEventListener('change', (e) => {
    filters.compareConfigId = e.target.value;
    persistState();
    renderMainContent();
  });

  const tableHost = document.createElement('div');
  tableHost.id = 'inspector-table-host';
  container.appendChild(tableHost);

  renderInspectorTable(container, cfg, compareConfig);
}

function renderInspectorTable(container, cfg, compareConfig) {
  const host = container.querySelector('#inspector-table-host');
  if (!host) return;
  host.innerHTML = '';

  const filters = appState.inspectorFilters;
  const activeSlot = appState.activeSlotIndex ?? 1;
  const query = inspectorSearchQuery.trim().toLowerCase();

  const allKeys = cfg.keyOrder || Object.keys(cfg.settings);
  const getFriendlySettingLabel = (key, idx) => {
    const profMeta = PROFILE_SLOT_META.find((m) => m.key === key);
    if (profMeta) return `${profMeta.label} Name`;
    const schemaDef = schema.SETTINGS_SCHEMA[key];
    if (schemaDef?.label) return schemaDef.label;
    return `Camera Setting #${idx + 1}`;
  };

  const filteredKeys = allKeys.filter((key, idx) => {
    const label = getFriendlySettingLabel(key, idx).toLowerCase();

    if (query && !label.includes(query)) {
      return false;
    }

    if (filters.hideDefaults && isSettingAllDefaultsAcrossSlots(cfg.settings, key)) {
      return false;
    }

    if (filters.hideIdentical && isSettingIdenticalAcrossComparison(cfg, compareConfig, key)) {
      return false;
    }

    return true;
  });

  const summaryBar = document.createElement('div');
  summaryBar.style.marginBottom = '10px';
  summaryBar.style.color = 'var(--text-secondary)';
  summaryBar.style.fontSize = '12px';
  summaryBar.innerHTML = `
    Showing <strong>${filteredKeys.length}</strong> of <strong>${allKeys.length}</strong> total settings
    ${filters.hideDefaults ? ' • <em>Hiding Factory Defaults</em>' : ''}
    ${filters.hideIdentical ? ' • <em>Hiding Identical Settings</em>' : ''}
  `;
  host.appendChild(summaryBar);

  const wrap = document.createElement('div');
  wrap.className = 'inspector-table-wrap';

  const table = document.createElement('table');
  table.className = 'inspector-table';

  const p1Name = cfg.settings.D037?.[0] || 'Profile 1';
  const p2Name = cfg.settings.D038?.[0] || 'Profile 2';
  const p3Name = cfg.settings.D039?.[0] || 'Profile 3';
  const p4Name = cfg.settings.D03A?.[0] || 'Profile 4';
  const p5Name = cfg.settings.D0AD?.[0] || 'Profile 5';
  const p6Name = cfg.settings.D0AE?.[0] || 'Profile 6';

  const activeSlotLabel = activeSlot === 0 ? 'Active State' : `Profile ${activeSlot}`;

  table.innerHTML = `
    <thead>
      <tr>
        <th>Setting Name</th>
        <th>Edit ${escapeHtml(activeSlotLabel)} Value</th>
        <th>Active State</th>
        <th>Profile 1 (${escapeHtml(p1Name)})</th>
        <th>Profile 2 (${escapeHtml(p2Name)})</th>
        <th>Profile 3 (${escapeHtml(p3Name)})</th>
        <th>Profile 4 (${escapeHtml(p4Name)})</th>
        <th>Profile 5 (${escapeHtml(p5Name)})</th>
        <th>Profile 6 (${escapeHtml(p6Name)})</th>
        <th>Factory Default</th>
        ${compareConfig ? `<th>Compare: ${escapeHtml(compareConfig.name)} (${escapeHtml(activeSlotLabel)})</th>` : ''}
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  for (const key of filteredKeys) {
    const idx = allKeys.indexOf(key);
    const schemaDef = schema.SETTINGS_SCHEMA[key];
    const isProfKey = PROFILE_KEYS_SET.has(key);
    const label = getFriendlySettingLabel(key, idx);

    const isDiffRow = !isSettingAllDefaultsAcrossSlots(cfg.settings, key) ||
      !isSettingIdenticalAcrossComparison(cfg, compareConfig, key);

    const tr = document.createElement('tr');
    if (isDiffRow) tr.className = 'row-diff';

    const currentSlotVal = getSlotVal(cfg.settings, key, activeSlot);
    const defVal = factoryDefaults[key];

    let controlHtml = '';
    if (isProfKey || schemaDef?.type === 'text_with_presets') {
      controlHtml = `<input type="text" class="text-input dropdown-sm inspector-input" data-key="${key}" value="${escapeHtml(String(currentSlotVal ?? ''))}" style="width:180px;" />`;
    } else {
      const slotVals = [0, 1, 2, 3, 4, 5, 6].map((i) => getSlotVal(cfg.settings, key, i));
      const opts = buildDropdownOptionsForKey(key, slotVals);
      const optionsMarkup = opts
        .map(
          (o) =>
            `<option value="${escapeHtml(String(o.value))}" ${
              String(o.value) === String(currentSlotVal) ? 'selected' : ''
            }>${escapeHtml(o.label)}</option>`
        )
        .join('');
      controlHtml = `<select class="dropdown-select dropdown-sm inspector-select" data-key="${key}" style="width:210px;">${optionsMarkup}</select>`;
    }

    const slotCells = [0, 1, 2, 3, 4, 5, 6]
      .map((slotIdx) => {
        const v = getSlotVal(cfg.settings, key, slotIdx);
        const diffFromDef = !isProfKey && String(v) !== String(defVal);
        return `<td class="slot-cell ${diffFromDef ? 'diff-val' : ''}">${escapeHtml(String(v ?? ''))}</td>`;
      })
      .join('');

    let compareCell = '';
    if (compareConfig) {
      const cmpVal = getSlotVal(compareConfig.settings, key, activeSlot);
      const isDiffCmp = String(cmpVal) !== String(currentSlotVal);
      compareCell = `<td class="slot-cell ${isDiffCmp ? 'diff-val' : ''}">${escapeHtml(String(cmpVal ?? '—'))}</td>`;
    }

    tr.innerHTML = `
      <td><strong>${escapeHtml(label)}</strong></td>
      <td>${controlHtml}</td>
      ${slotCells}
      <td class="slot-cell">${escapeHtml(String(defVal ?? '—'))}</td>
      ${compareCell}
    `;

    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('.inspector-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const key = sel.getAttribute('data-key');
      const idx = allKeys.indexOf(key);
      const label = getFriendlySettingLabel(key, idx);
      applyValueChange(cfg, key, activeSlot, sel.value);
      persistState(`Updated ${label} in ${activeSlotLabel}`);
      renderProfileBar();
      renderCategoryTabs();
      renderInspectorTable(container, cfg, compareConfig);
    });
  });

  tbody.querySelectorAll('.inspector-input').forEach((inp) => {
    inp.addEventListener('change', () => {
      const key = inp.getAttribute('data-key');
      const idx = allKeys.indexOf(key);
      const label = getFriendlySettingLabel(key, idx);
      applyValueChange(cfg, key, activeSlot, inp.value);
      persistState(`Updated ${label}`);
      renderAll();
    });
  });

  wrap.appendChild(table);
  host.appendChild(wrap);
}

function applyValueChange(cfg, key, slotIndex, newVal) {
  setSlotVal(cfg.settings, key, slotIndex, newVal);
  // Mirror Slot 1 edits to Slot 0 if enabled
  if (appState.syncSlotZero && slotIndex === 1 && !PROFILE_KEYS_SET.has(key)) {
    setSlotVal(cfg.settings, key, 0, newVal);
  }
}

// ============================================================================
// EXPORT MODAL & FILENAME RECOMMENDATIONS (PRESETS 1 & 2 + OPEN INPUT)
// ============================================================================

function formatCameraConfigFilename(cfg) {
  const safeCam = (cfg.camera || 'LEICA_Q3')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const safeName = (cfg.name || 'Config')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `${safeCam}_${safeName}.lcs`;
}

function openExportModal() {
  const cfg = getActiveConfig();
  if (!cfg) return;

  const modal = document.getElementById('export-modal');
  const preset2Preview = document.getElementById('preset-camera-config-preview');
  const filenameInput = document.getElementById('input-export-filename');
  const summaryBox = document.getElementById('export-summary-box');

  const preset2Name = formatCameraConfigFilename(cfg);
  preset2Preview.textContent = preset2Name;

  if (selectedExportPreset === 'camera_config') {
    filenameInput.value = preset2Name;
  } else if (selectedExportPreset === 'standard') {
    filenameInput.value = 'settings.lcs';
  }

  updateExportPresetButtons();

  const totalKeys = Object.keys(cfg.settings).length;
  const p1Diffs = countSlotDiffsFromDefault(cfg, 1);
  summaryBox.innerHTML = `
    <div><strong>Configuration:</strong> ${escapeHtml(cfg.name)} (${escapeHtml(cfg.camera)})</div>
    <div><strong>Total Keys Preserved:</strong> ${totalKeys} hex properties across 7 profile slots</div>
    <div><strong>Profile 1 ("${escapeHtml(cfg.settings.D037?.[0] || 'User1')}") Customizations:</strong> ${p1Diffs} setting(s) modified from factory defaults</div>
  `;

  modal.classList.remove('hidden');
}

function updateExportPresetButtons() {
  document
    .getElementById('btn-preset-standard')
    .classList.toggle('active', selectedExportPreset === 'standard');
  document
    .getElementById('btn-preset-camera-config')
    .classList.toggle('active', selectedExportPreset === 'camera_config');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================================
// APPEARANCE & MACOS SETTINGS PANEL (⌘,)
// ============================================================================

function computeEffectiveTheme(appearance, resolvedFromMain) {
  if (appearance === 'light') return 'light';
  if (appearance === 'dark') return 'dark';
  if (resolvedFromMain === 'light' || resolvedFromMain === 'dark') {
    return resolvedFromMain;
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function applyThemeToDocument(appearance, resolvedFromMain) {
  const effective = computeEffectiveTheme(appearance, resolvedFromMain);
  currentResolvedTheme = effective;
  document.documentElement.setAttribute('data-theme', effective);
  renderSettingsModalState();
}

function renderSettingsModalState() {
  const folderInput = document.getElementById('input-default-folder');
  if (folderInput && document.activeElement !== folderInput) {
    folderInput.value = appPreferences.defaultFolderPath || '';
  }

  const storeFileEl = document.getElementById('settings-store-filepath');
  if (storeFileEl) {
    storeFileEl.textContent = currentStoreFilePath || '—';
  }

  const badgeEl = document.getElementById('settings-resolved-theme-badge');
  if (badgeEl) {
    const modeLabel = currentResolvedTheme === 'light' ? 'Light Mode' : 'Dark Mode';
    const sourceLabel =
      appPreferences.appearance === 'system' ? `System → ${modeLabel}` : modeLabel;
    badgeEl.textContent = `Active: ${sourceLabel}`;
  }

  document.querySelectorAll('.appearance-option-card').forEach((card) => {
    const mode = card.getAttribute('data-appearance');
    card.classList.toggle('active', mode === appPreferences.appearance);
  });
}

async function openSettingsModal() {
  const fresh = await window.leicaAPI.getPreferences();
  if (fresh && fresh.preferences) {
    appPreferences = fresh.preferences;
    currentResolvedTheme = fresh.resolvedTheme || currentResolvedTheme;
    defaultSystemFolderPath = fresh.defaultSystemFolderPath || defaultSystemFolderPath;
    currentStoreFilePath = fresh.storeFilePath || currentStoreFilePath;
  }
  renderSettingsModalState();
  const folderInput = document.getElementById('input-default-folder');
  if (folderInput) {
    folderInput.value = appPreferences.defaultFolderPath || '';
  }
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

async function saveFolderPathPreference(newFolderPath, toastMsg) {
  const trimmed = (newFolderPath || '').trim();
  if (!trimmed) {
    showToast('Please enter a valid folder path.');
    return;
  }
  const res = await window.leicaAPI.updatePreferences({
    patch: { defaultFolderPath: trimmed },
    currentState: appState
  });
  if (!res || !res.ok) {
    showToast(res?.error || 'Failed to update default folder path');
    return;
  }
  appPreferences = res.preferences;
  currentStoreFilePath = res.storeFilePath || currentStoreFilePath;
  const folderInput = document.getElementById('input-default-folder');
  if (folderInput) {
    folderInput.value = appPreferences.defaultFolderPath;
  }
  renderSettingsModalState();
  showToast(toastMsg || `Default folder set to ${appPreferences.defaultFolderPath}`);
}

// ============================================================================
// INITIALIZATION & EVENT LISTENERS
// ============================================================================

async function initApp() {
  const data = await window.leicaAPI.getInitialData();
  appState = data.state;
  appPreferences = data.preferences || { defaultFolderPath: '', appearance: 'system' };
  currentResolvedTheme = data.resolvedTheme || 'dark';
  defaultSystemFolderPath = data.defaultSystemFolderPath || '';
  currentStoreFilePath = data.storeFilePath || '';
  factoryDefaults = data.factoryDefaults || {};
  schema = data.schema;

  applyThemeToDocument(appPreferences.appearance, currentResolvedTheme);

  // Listen for native macOS theme changes pushed from main process
  if (window.leicaAPI.onThemeUpdated) {
    window.leicaAPI.onThemeUpdated(({ appearance, resolvedTheme }) => {
      if (appearance) appPreferences.appearance = appearance;
      applyThemeToDocument(appPreferences.appearance, resolvedTheme);
    });
  }

  // Also listen for matchMedia changes in renderer for instant system theme sync
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', (e) => {
        if (appPreferences.appearance === 'system') {
          applyThemeToDocument('system', e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  // Listen for native macOS menu "Settings…" (⌘,)
  if (window.leicaAPI.onOpenSettings) {
    window.leicaAPI.onOpenSettings(() => {
      openSettingsModal();
    });
  }

  // Keyboard shortcuts: Cmd+, / Ctrl+, to open Settings, Escape to close modals
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      openSettingsModal();
    } else if (e.key === 'Escape') {
      closeSettingsModal();
      document.getElementById('export-modal').classList.add('hidden');
    }
  });

  // Settings Modal UI Listeners
  document.getElementById('btn-open-settings').addEventListener('click', openSettingsModal);
  document.getElementById('btn-close-settings').addEventListener('click', closeSettingsModal);
  document.getElementById('btn-done-settings').addEventListener('click', closeSettingsModal);
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
      closeSettingsModal();
    }
  });

  document.querySelectorAll('.appearance-option-card').forEach((card) => {
    card.addEventListener('click', async () => {
      const nextAppearance = card.getAttribute('data-appearance');
      if (!nextAppearance) return;
      const res = await window.leicaAPI.updatePreferences({
        patch: { appearance: nextAppearance }
      });
      if (res && res.ok) {
        appPreferences = res.preferences;
        applyThemeToDocument(appPreferences.appearance, res.resolvedTheme);
        const labelMap = {
          system: 'System (Auto)',
          light: 'Light Mode',
          dark: 'Dark Mode'
        };
        showToast(`Appearance set to ${labelMap[nextAppearance] || nextAppearance}`);
      }
    });
  });

  document.getElementById('btn-choose-folder').addEventListener('click', async () => {
    const res = await window.leicaAPI.chooseDefaultFolder();
    if (res && !res.canceled && res.folderPath) {
      await saveFolderPathPreference(
        res.folderPath,
        `Default folder updated to ${res.folderPath}`
      );
    }
  });

  document.getElementById('btn-apply-folder').addEventListener('click', async () => {
    const inputVal = document.getElementById('input-default-folder').value;
    await saveFolderPathPreference(inputVal);
  });

  document.getElementById('input-default-folder').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveFolderPathPreference(e.target.value);
    }
  });

  document.getElementById('btn-reset-folder').addEventListener('click', async () => {
    if (!defaultSystemFolderPath) return;
    await saveFolderPathPreference(
      defaultSystemFolderPath,
      'Reset storage folder to macOS default location'
    );
  });

  document.getElementById('btn-reveal-folder').addEventListener('click', async () => {
    const target =
      document.getElementById('input-default-folder').value.trim() ||
      appPreferences.defaultFolderPath;
    await window.leicaAPI.openFolderInFinder(target);
  });

  // Configuration Name Open Input
  document.getElementById('input-config-name').addEventListener('input', (e) => {
    const cfg = getActiveConfig();
    if (!cfg) return;
    cfg.name = e.target.value;
    persistState();
    renderSidebarConfigList();
  });

  // Camera Model Dropdown
  document.getElementById('select-camera-model').addEventListener('change', (e) => {
    const cfg = getActiveConfig();
    if (!cfg) return;
    cfg.camera = e.target.value;
    persistState(`Camera model set to ${cfg.camera}`);
    renderSidebarConfigList();
  });

  // Sync Slot 0 Checkbox
  document.getElementById('chk-sync-slot0').addEventListener('change', (e) => {
    appState.syncSlotZero = e.target.checked;
    persistState(
      appState.syncSlotZero
        ? 'Slot 1 edits will mirror to Slot 0 (Active State)'
        : 'Slot 0 (Active State) edited independently'
    );
  });

  // Copy Slot Button
  document.getElementById('btn-copy-slot').addEventListener('click', () => {
    const targetVal = document.getElementById('select-copy-target').value;
    if (!targetVal) return;
    const cfg = getActiveConfig();
    if (!cfg) return;

    const sourceSlot = appState.activeSlotIndex ?? 1;
    const targets = targetVal === 'all' ? [0, 1, 2, 3, 4, 5, 6] : [Number(targetVal)];

    for (const key of Object.keys(cfg.settings)) {
      if (PROFILE_KEYS_SET.has(key)) continue;
      const val = getSlotVal(cfg.settings, key, sourceSlot);
      for (const t of targets) {
        setSlotVal(cfg.settings, key, t, val);
      }
    }

    document.getElementById('select-copy-target').value = '';
    persistState(
      targetVal === 'all'
        ? `Copied Slot ${sourceSlot} settings to all 7 slots`
        : `Copied Slot ${sourceSlot} settings to Slot ${targetVal}`
    );
    renderAll();
  });

  // Profile Name Open Input (Slots 1-6)
  document.getElementById('input-profile-name').addEventListener('input', (e) => {
    const cfg = getActiveConfig();
    if (!cfg) return;
    const activeSlot = appState.activeSlotIndex ?? 1;
    const meta = PROFILE_SLOT_META.find((m) => m.slotIndex === activeSlot);
    if (!meta || !meta.key) return;

    const newName = e.target.value.slice(0, 10);
    cfg.settings[meta.key] = [newName];
    document.getElementById('profile-name-char-count').textContent = `${newName.length}/10`;
    persistState();
    renderSidebarConfigList();
    // Update active tab text without losing focus
    const tabs = document.querySelectorAll('.profile-tab');
    if (tabs[activeSlot]) {
      const nameDiv = tabs[activeSlot].querySelector('.profile-tab-name');
      if (nameDiv) nameDiv.textContent = newName;
    }
  });

  // Profile Name Quick Suggestion Dropdown
  document.getElementById('select-profile-suggestion').addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return;
    const cfg = getActiveConfig();
    if (!cfg) return;
    const activeSlot = appState.activeSlotIndex ?? 1;
    const meta = PROFILE_SLOT_META.find((m) => m.slotIndex === activeSlot);
    if (!meta || !meta.key) return;

    cfg.settings[meta.key] = [val];
    persistState(`Renamed Profile ${activeSlot} to "${val}"`);
    renderAll();
  });

  // Import .lcs File Button
  document.getElementById('btn-import-lcs').addEventListener('click', async () => {
    const res = await window.leicaAPI.importLcsDialog();
    if (res.canceled) return;
    if (res.error) {
      showToast(`Import failed: ${res.error}`);
      return;
    }
    if (res.config) {
      appState.configurations.unshift(res.config);
      appState.activeConfigId = res.config.id;
      await persistState(`Imported "${res.config.name}"`);
      renderAll();
    }
  });

  // Create New Configuration from Factory Defaults
  document.getElementById('btn-new-config').addEventListener('click', () => {
    const baseCfg =
      appState.configurations.find((c) => c.id === 'config-factory-q3') || getActiveConfig();
    if (!baseCfg) return;
    const clonedSettings = JSON.parse(JSON.stringify(baseCfg.settings));
    for (const [key, defVal] of Object.entries(factoryDefaults)) {
      if (PROFILE_KEYS_SET.has(key)) continue;
      setAllSlotsVal(clonedSettings, key, defVal);
    }

    const newCfg = {
      id: `config-${Date.now().toString(36)}`,
      name: `New ${baseCfg.camera} Setup`,
      camera: baseCfg.camera || 'LEICA Q3',
      notes: 'Created from Factory Defaults',
      sourceFileName: 'Factory Defaults',
      updatedAt: new Date().toISOString(),
      keyOrder: [...(baseCfg.keyOrder || Object.keys(clonedSettings))],
      settings: clonedSettings
    };

    appState.configurations.unshift(newCfg);
    appState.activeConfigId = newCfg.id;
    persistState('Created new configuration from factory defaults');
    renderAll();
  });

  // Duplicate Configuration
  document.getElementById('btn-duplicate-config').addEventListener('click', () => {
    const cfg = getActiveConfig();
    if (!cfg) return;
    const dup = {
      id: `config-${Date.now().toString(36)}`,
      name: `${cfg.name} (Copy)`,
      camera: cfg.camera,
      notes: cfg.notes,
      sourceFileName: cfg.sourceFileName,
      updatedAt: new Date().toISOString(),
      keyOrder: [...(cfg.keyOrder || Object.keys(cfg.settings))],
      settings: JSON.parse(JSON.stringify(cfg.settings))
    };
    appState.configurations.unshift(dup);
    appState.activeConfigId = dup.id;
    persistState(`Duplicated "${cfg.name}"`);
    renderAll();
  });

  // Delete Configuration
  document.getElementById('btn-delete-config').addEventListener('click', () => {
    if (appState.configurations.length <= 1) {
      showToast('Cannot delete the last remaining configuration.');
      return;
    }
    const cfg = getActiveConfig();
    if (!cfg) return;
    appState.configurations = appState.configurations.filter((c) => c.id !== cfg.id);
    appState.activeConfigId = appState.configurations[0].id;
    persistState(`Deleted "${cfg.name}"`);
    renderAll();
  });

  // Drag & Drop .lcs support anywhere on window
  const dropzoneBox = document.getElementById('dropzone-box');
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzoneBox.classList.add('dragover');
  });
  window.addEventListener('dragleave', () => {
    dropzoneBox.classList.remove('dragover');
  });
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzoneBox.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const rawText = await file.text();
    const res = await window.leicaAPI.parseRawLcs({ rawText, fileName: file.name });
    if (res.error) {
      showToast(`Invalid .lcs file: ${res.error}`);
      return;
    }
    if (res.config) {
      appState.configurations.unshift(res.config);
      appState.activeConfigId = res.config.id;
      await persistState(`Imported "${file.name}"`);
      renderAll();
    }
  });

  // Export Modal Listeners
  document.getElementById('btn-open-export').addEventListener('click', openExportModal);
  document.getElementById('btn-close-export').addEventListener('click', () => {
    document.getElementById('export-modal').classList.add('hidden');
  });
  document.getElementById('btn-cancel-export').addEventListener('click', () => {
    document.getElementById('export-modal').classList.add('hidden');
  });

  document.getElementById('btn-preset-standard').addEventListener('click', () => {
    selectedExportPreset = 'standard';
    document.getElementById('input-export-filename').value = 'settings.lcs';
    updateExportPresetButtons();
  });

  document.getElementById('btn-preset-camera-config').addEventListener('click', () => {
    const cfg = getActiveConfig();
    if (!cfg) return;
    selectedExportPreset = 'camera_config';
    document.getElementById('input-export-filename').value = formatCameraConfigFilename(cfg);
    updateExportPresetButtons();
  });

  document.getElementById('input-export-filename').addEventListener('input', () => {
    selectedExportPreset = 'custom';
    updateExportPresetButtons();
  });

  document.getElementById('btn-confirm-export').addEventListener('click', async () => {
    const cfg = getActiveConfig();
    if (!cfg) return;
    const suggestedFileName =
      document.getElementById('input-export-filename').value.trim() || 'settings.lcs';

    const res = await window.leicaAPI.exportLcsDialog({
      config: cfg,
      suggestedFileName
    });

    if (res.canceled) return;
    if (res.error) {
      showToast(`Export failed: ${res.error}`);
      return;
    }

    document.getElementById('export-modal').classList.add('hidden');
    showToast(`Exported ${res.filePath} (${res.bytesWritten} bytes)`);
  });

  renderAll();
}

window.addEventListener('DOMContentLoaded', initApp);
