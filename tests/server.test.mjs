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

const { buildSkill } = await import('../server/lib/builder.mjs');

import express from 'express';
import { createServer } from 'node:http';

const { agentAuth } = await import('../server/middleware/agentAuth.mjs');
const { agentRouter } = await import('../server/routes/agent.mjs');

async function makeTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', agentAuth, agentRouter);
  return app;
}

async function request(app, method, path, opts = {}) {
  return new Promise((resolve) => {
    const server = createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const url = `http://localhost:${port}${path}`;
      const headers = { 'Content-Type': 'application/json', ...opts.headers };
      import('node:http').then(({ request: req }) => {
        const r = req(url, { method, headers }, (res) => {
          let body = '';
          res.on('data', d => body += d);
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
          });
        });
        if (opts.body) r.write(JSON.stringify(opts.body));
        r.end();
      });
    });
  });
}

test('buildSkill generates SKILL.md with task type reference list', () => {
  const config = {
    name: 'acme',
    task_types: [
      { id: 'debug', reference: 'debugging' },
      { id: 'review', reference: 'code-review' },
    ],
    budgets: { S: 'tiny edit', M: 'normal fix', L: 'cross-module', XL: 'architecture' },
  };
  const skill = buildSkill(config);
  assert.match(skill, /name: acme/);
  assert.match(skill, /- debug: `references\/debugging\.md`/);
  assert.match(skill, /- review: `references\/code-review\.md`/);
  assert.match(skill, /`S`: tiny edit/);
});

test('buildSkill word count is under 400', () => {
  const config = {
    name: 'test',
    task_types: [{ id: 'debug', reference: 'debugging' }],
    budgets: { S: 'small', M: 'medium', L: 'large', XL: 'xlarge' },
  };
  const skill = buildSkill(config);
  const words = skill.split(/\s+/).filter(Boolean).length;
  assert.ok(words < 400, `skill is ${words} words, expected < 400`);
});

test('GET /api/skill returns 401 without API key', async () => {
  const app = await makeTestApp();
  const res = await request(app, 'GET', '/api/skill');
  assert.equal(res.status, 401);
});

test('GET /api/skill returns hook JSON with valid API key', async () => {
  const { key } = db.addKey('test');
  const app = await makeTestApp();
  db.setConfig({ name: 'test', task_types: [{ id: 'debug', reference: 'debugging' }], budgets: { S: 'small' } });
  db.setCard('debugging', '# Debug\n\nContent.');
  const res = await request(app, 'GET', '/api/skill', { headers: { 'X-API-Key': key } });
  assert.equal(res.status, 200);
  assert.ok(res.body.hookSpecificOutput);
  assert.ok(res.body.hookSpecificOutput.additionalContext.includes('Runtime Router'));
});

test('POST /api/findings saves finding with valid key', async () => {
  const { key } = db.addKey('findings-test');
  const app = await makeTestApp();
  const res = await request(app, 'POST', '/api/findings', {
    headers: { 'X-API-Key': key },
    body: { card: 'debugging', finding: 'Check git log first', task: 'auth bug' },
  });
  assert.equal(res.status, 201);
  assert.ok(res.body.id);
});

test('POST /api/findings returns 400 if card or finding missing', async () => {
  const { key } = db.addKey('bad-findings-test');
  const app = await makeTestApp();
  const res = await request(app, 'POST', '/api/findings', {
    headers: { 'X-API-Key': key },
    body: { card: 'debugging' },
  });
  assert.equal(res.status, 400);
});
