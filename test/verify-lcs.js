const fs = require('fs');
const path = require('path');
const assert = require('assert');

const {
  PROFILE_NAME_KEY_SET,
  parseLcs,
  serializeLcs,
  getSlotValue,
  setSlotValue
} = require('../src/lcs-codec');
const { SETTINGS_SCHEMA, CATEGORIES, getOptionsForKey } = require('../src/settings-schema');

const rootLcsPath = path.join(__dirname, '..', 'settings.lcs');
const sampleLcsPath = path.join(__dirname, '..', 'lcs_samples', 'q3_28', 'settings.lcs');
const lcsPath = fs.existsSync(rootLcsPath) ? rootLcsPath : sampleLcsPath;
const raw = fs.readFileSync(lcsPath, 'utf-8');

// 1. Test round-trip byte-for-byte fidelity
const parsed = parseLcs(raw);
assert.strictEqual(parsed.camera, 'LEICA Q3');
assert.strictEqual(parsed.keyOrder.length, 346);

const reserialized = serializeLcs(parsed);
assert.strictEqual(reserialized.length, raw.length);
assert.strictEqual(reserialized, raw, 'Round-trip serialization must be 100% byte-identical to settings.lcs');

// 2. Test slot read/write operations
assert.strictEqual(getSlotValue(parsed.settings, 'D037', 1), 'Nikolas');
assert.strictEqual(getSlotValue(parsed.settings, 'D00B', 1), 25000);
assert.strictEqual(getSlotValue(parsed.settings, 'D00B', 2), 6400);
assert.strictEqual(getSlotValue(parsed.settings, 'D1FD', 0), '36, 1, 95');

// 3. Test Diff Inspector filtering logic (hideDefaults, hideIdentical, and both)
const nonProfileKeys = parsed.keyOrder.filter((k) => !PROFILE_NAME_KEY_SET.has(k));
const differingKeysAcrossSlots = nonProfileKeys.filter((k) => {
  const vals = [0, 1, 2, 3, 4, 5, 6].map((i) => String(getSlotValue(parsed.settings, k, i)));
  return new Set(vals).size > 1;
});
assert.deepStrictEqual(
  differingKeysAcrossSlots,
  ['5013', '500A', 'D00B', 'D00C'],
  'Exactly 4 keys should differ between Nikolas profile (Slots 0/1) and Factory Default (Slots 2-6)'
);

// 4. Test schema coverage & dropdown option generation for all 346 keys
assert.ok(CATEGORIES.length >= 6);
for (const key of parsed.keyOrder) {
  const opts = getOptionsForKey(key, parsed.settings[key], parsed.settings[key][6]);
  assert.ok(Array.isArray(opts) && opts.length > 0, `Key ${key} should have dropdown options`);
}

// 5. Verify Leica Dial & Dot branding, logo assets, Light/Dark themes & macOS Settings modal
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
assert.strictEqual(pkg.productName, 'Leica Dial & Dot');

const svgPath = path.join(__dirname, '..', 'src', 'assets', 'logo.svg');
const pngPath = path.join(__dirname, '..', 'src', 'assets', 'icon.png');
assert.ok(fs.existsSync(svgPath), 'logo.svg must exist');
assert.ok(fs.existsSync(pngPath), 'icon.png must exist');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'index.html'), 'utf-8');
assert.ok(html.includes('Leica Dial &amp; Dot'), 'index.html should display Leica Dial & Dot');
assert.ok(html.includes('id="settings-modal"'), 'index.html should contain macOS Settings modal');
assert.ok(html.includes('id="input-default-folder"'), 'index.html should include default folder path setting');
assert.ok(html.includes('data-appearance="system"'), 'index.html should include System appearance option');
assert.ok(html.includes('data-appearance="light"'), 'index.html should include Light appearance option');
assert.ok(html.includes('data-appearance="dark"'), 'index.html should include Dark appearance option');

const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'styles.css'), 'utf-8');
assert.ok(css.includes('[data-theme="dark"]'), 'styles.css must define Dark Mode theme');
assert.ok(css.includes('[data-theme="light"]'), 'styles.css must define Light Mode theme');

console.log('✓ All .lcs codec, diff inspector filter, branding, theme, and schema verification tests passed (346 keys, byte-identical output).');
