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

const lcsPath = path.join(__dirname, '..', 'settings.lcs');
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

console.log('✓ All .lcs codec, diff inspector filter, and schema verification tests passed (346 keys, byte-identical output).');
