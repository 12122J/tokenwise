import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const TEST_DATA = resolve(process.cwd(), 'data-test');

// Override DATA_DIR before importing db
process.env.DATA_DIR = TEST_DATA;

const { db } = await import('../server/db.mjs');

test.beforeEach(() => {
  if (existsSync(TEST_DATA)) rmSync(TEST_DATA, { recursive: true });
  mkdirSync(TEST_DATA + '/cards', { recursive: true });
  mkdirSync(TEST_DATA + '/findings', { recursive: true });
});

test.after(() => {
  if (existsSync(TEST_DATA)) rmSync(TEST_DATA, { recursive: true });
});

test('getCard returns null when card does not exist', () => {
  assert.equal(db.getCard('missing'), null);
});

test('setCard and getCard round-trip', () => {
  db.setCard('debugging', '# Debugging\n\nContent here.');
  assert.equal(db.getCard('debugging'), '# Debugging\n\nContent here.');
});

test('getCards returns all cards as a name→content map', () => {
  db.setCard('debugging', 'debug content');
  db.setCard('review', 'review content');
  const cards = db.getCards();
  assert.equal(cards.debugging, 'debug content');
  assert.equal(cards.review, 'review content');
});

test('addFinding and getFindings', () => {
  const id = db.addFinding({ card: 'debugging', finding: 'Check git log first', task: 'auth bug' });
  assert.ok(id);
  const findings = db.getFindings();
  assert.equal(findings.length, 1);
  assert.equal(findings[0].card, 'debugging');
  assert.equal(findings[0].status, 'pending');
});

test('setFindingStatus changes status', () => {
  const id = db.addFinding({ card: 'debugging', finding: 'test', task: '' });
  db.setFindingStatus(id, 'merged');
  const findings = db.getFindings();
  assert.equal(findings[0].status, 'merged');
});

test('addKey and validateKey', () => {
  const { id, key } = db.addKey('test-key');
  assert.ok(key.length > 20);
  assert.ok(db.validateKey(key));
  assert.ok(!db.validateKey('wrong-key'));
});

test('deleteKey invalidates the key', () => {
  const { id, key } = db.addKey('to-delete');
  db.deleteKey(id);
  assert.ok(!db.validateKey(key));
});

test('getConfig returns null before setConfig', () => {
  assert.equal(db.getConfig(), null);
});

test('setConfig and getConfig round-trip', () => {
  const cfg = { task_types: [{ id: 'debug', reference: 'debugging' }], budgets: { S: 'small' } };
  db.setConfig(cfg);
  assert.deepEqual(db.getConfig(), cfg);
});

test('setSettings and getSettings round-trip', () => {
  db.setSettings({ password_hash: 'abc', setup_complete: false });
  assert.equal(db.getSettings().password_hash, 'abc');
});
