const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_SETTINGS,
  normalizeSettings,
  validNoteClass,
} = require('../../.test-build/settings.cjs');
const { roleFor } = require('../../.test-build/theme.cjs');
test('missing or corrupt settings use safe defaults', () => {
  for (const input of [null, 'bad', [], { noteClass: '.invalid > svg' }])
    assert.deepEqual(normalizeSettings(input), DEFAULT_SETTINGS);
});
test('all-notes and scoped settings round-trip without retaining unknown data', () => {
  assert.deepEqual(normalizeSettings({ noteClass: '  ', extra: 'unused' }), { noteClass: '' });
  assert.deepEqual(normalizeSettings({ noteClass: ' mermaid-notes ' }), {
    noteClass: 'mermaid-notes',
  });
  assert(validNoteClass('diagrams_2'));
  assert(!validNoteClass('one two'));
  assert(!validNoteClass('x]'));
});
test('semantic classes choose roles without consulting node labels', () => {
  assert.equal(roleFor(['store']), 'cache');
  assert.equal(roleFor(['focus']), 'entry');
  assert.equal(roleFor([]), 'neutral');
});
test('unknown classes stay neutral and known classes retain precedence', () => {
  assert.equal(roleFor(['custom']), 'neutral');
  assert.equal(roleFor(['custom', 'err']), 'error');
  assert.equal(roleFor(['step', 'store']), 'service');
});
