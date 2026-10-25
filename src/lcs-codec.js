/**
 * Lossless parser and serializer for Leica .lcs camera settings files.
 * Preserves exact key order, 21-element 3-tuple formatting, and compact colon syntax.
 */

const PROFILE_NAME_KEYS = [
  { key: 'D037', slotIndex: 1, defaultName: 'User1' },
  { key: 'D038', slotIndex: 2, defaultName: 'User2' },
  { key: 'D039', slotIndex: 3, defaultName: 'User3' },
  { key: 'D03A', slotIndex: 4, defaultName: 'User4' },
  { key: 'D0AD', slotIndex: 5, defaultName: 'User5' },
  { key: 'D0AE', slotIndex: 6, defaultName: 'User6' }
];

const PROFILE_NAME_KEY_SET = new Set(PROFILE_NAME_KEYS.map((p) => p.key));

/**
 * Parse a raw .lcs JSON string into a structured object preserving key order.
 * @param {string} rawText
 */
function parseLcs(rawText) {
  const cleaned = rawText.replace(/^\uFEFF/, '');
  const parsed = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== 'object' || typeof parsed.Settings !== 'object') {
    throw new Error('Invalid .lcs file: missing "Camera" or "Settings" object.');
  }

  const camera = typeof parsed.Camera === 'string' ? parsed.Camera : 'LEICA Q3';

  // Extract exact key order from raw text because V8 Object.keys() hoists
  // numeric-looking hex keys ("5005", "5010", "5013") ahead of hex keys with A-F.
  const regexKeyOrder = [];
  const keyRegex = /^\s*"([0-9A-Fa-f]{4})"\s*:\s*\[/gm;
  let match;
  while ((match = keyRegex.exec(cleaned)) !== null) {
    const k = match[1];
    if (Object.prototype.hasOwnProperty.call(parsed.Settings, k)) {
      regexKeyOrder.push(k);
    }
  }

  const keyOrder = regexKeyOrder.length === Object.keys(parsed.Settings).length
    ? regexKeyOrder
    : Object.keys(parsed.Settings);

  const settings = {};

  for (const key of keyOrder) {
    const val = parsed.Settings[key];
    if (!Array.isArray(val)) {
      throw new Error(`Invalid .lcs setting "${key}": expected an array.`);
    }
    settings[key] = [...val];
  }

  return {
    camera,
    keyOrder,
    settings
  };
}

/**
 * Serialize a structured configuration back into Leica's exact byte-for-byte .lcs format.
 * @param {{ camera: string, settings: Record<string, any[]>, keyOrder?: string[] }} config
 * @returns {string}
 */
function serializeLcs(config) {
  const camera = config.camera || 'LEICA Q3';
  const settings = config.settings || {};
  const keys = Array.isArray(config.keyOrder) && config.keyOrder.length > 0
    ? config.keyOrder.filter((k) => Object.prototype.hasOwnProperty.call(settings, k))
    : Object.keys(settings);

  // Append any keys present in settings that weren't in keyOrder
  for (const k of Object.keys(settings)) {
    if (!keys.includes(k)) {
      keys.push(k);
    }
  }

  const lines = ['{'];
  lines.push(`  "Camera":${JSON.stringify(camera)},`);
  lines.push('  "Settings":{');

  for (let idx = 0; idx < keys.length; idx++) {
    const k = keys[idx];
    const v = settings[k];
    lines.push(`    "${k}":[`);

    if (Array.isArray(v) && v.length === 21) {
      for (let i = 0; i < 21; i += 3) {
        const chunk = `${JSON.stringify(v[i])}, ${JSON.stringify(v[i + 1])}, ${JSON.stringify(v[i + 2])}`;
        const comma = i + 3 < 21 ? ',' : '';
        lines.push(`      ${chunk}${comma}`);
      }
    } else if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        const comma = i + 1 < v.length ? ',' : '';
        lines.push(`      ${JSON.stringify(v[i])}${comma}`);
      }
    }

    const endComma = idx + 1 < keys.length ? ',' : '';
    lines.push(`    ]${endComma}`);
  }

  lines.push('  }');
  lines.push('}');
  return lines.join('\n');
}

/**
 * Get the value for a specific profile slot (0..6) on a given key.
 */
function getSlotValue(settings, key, slotIndex) {
  const arr = settings[key];
  if (!Array.isArray(arr)) return undefined;
  if (PROFILE_NAME_KEY_SET.has(key)) {
    return arr[0];
  }
  if (arr.length === 7) {
    return arr[slotIndex];
  }
  if (arr.length === 21) {
    const start = slotIndex * 3;
    return `${arr[start]}, ${arr[start + 1]}, ${arr[start + 2]}`;
  }
  return arr[0];
}

/**
 * Set the value for a specific profile slot (0..6) on a given key.
 */
function setSlotValue(settings, key, slotIndex, newValue) {
  const arr = settings[key];
  if (!Array.isArray(arr)) return;
  if (PROFILE_NAME_KEY_SET.has(key)) {
    arr[0] = String(newValue);
    return;
  }
  if (arr.length === 7) {
    arr[slotIndex] = newValue;
    return;
  }
  if (arr.length === 21 && typeof newValue === 'string') {
    const parts = newValue.split(',').map((s) => Number(s.trim()));
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      const start = slotIndex * 3;
      arr[start] = parts[0];
      arr[start + 1] = parts[1];
      arr[start + 2] = parts[2];
    }
  }
}

module.exports = {
  PROFILE_NAME_KEYS,
  PROFILE_NAME_KEY_SET,
  parseLcs,
  serializeLcs,
  getSlotValue,
  setSlotValue
};
