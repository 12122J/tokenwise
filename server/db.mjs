import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || resolve(process.cwd(), 'data');
const CARDS_DIR = join(DATA_DIR, 'cards');
const FINDINGS_DIR = join(DATA_DIR, 'findings');

function ensureDirs() {
  mkdirSync(CARDS_DIR, { recursive: true });
  mkdirSync(FINDINGS_DIR, { recursive: true });
}

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function hashKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

export const db = {
  getCard(name) {
    ensureDirs();
    const p = join(CARDS_DIR, `${name}.md`);
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
  },

  setCard(name, content) {
    ensureDirs();
    writeFileSync(join(CARDS_DIR, `${name}.md`), content);
  },

  getCards() {
    ensureDirs();
    const files = readdirSync(CARDS_DIR).filter(f => f.endsWith('.md'));
    const result = {};
    for (const f of files) {
      const name = f.replace(/\.md$/, '');
      result[name] = readFileSync(join(CARDS_DIR, f), 'utf8');
    }
    return result;
  },

  addFinding({ card, finding, task = '' }) {
    ensureDirs();
    const id = randomBytes(8).toString('hex');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const path = join(FINDINGS_DIR, `${ts}-${id}.json`);
    writeJson(path, { id, card, finding, task, status: 'pending', created_at: new Date().toISOString() });
    return id;
  },

  getFindings(status = null) {
    ensureDirs();
    const files = readdirSync(FINDINGS_DIR).filter(f => f.endsWith('.json')).sort().reverse();
    const findings = files.map(f => readJson(join(FINDINGS_DIR, f))).filter(Boolean);
    return status ? findings.filter(f => f.status === status) : findings;
  },

  setFindingStatus(id, status) {
    ensureDirs();
    const files = readdirSync(FINDINGS_DIR).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const path = join(FINDINGS_DIR, f);
      const data = readJson(path);
      if (data && data.id === id) {
        data.status = status;
        writeJson(path, data);
        return;
      }
    }
    throw new Error(`Finding not found: ${id}`);
  },

  getFinding(id) {
    const all = this.getFindings();
    return all.find(f => f.id === id) || null;
  },

  addKey(label) {
    const keysPath = join(DATA_DIR, 'keys.json');
    const keys = readJson(keysPath) || [];
    const key = randomBytes(32).toString('hex');
    const id = randomBytes(4).toString('hex');
    keys.push({ id, key_hash: hashKey(key), label, created_at: new Date().toISOString() });
    writeJson(keysPath, keys);
    return { id, key };
  },

  getKeys() {
    const keysPath = join(DATA_DIR, 'keys.json');
    return (readJson(keysPath) || []).map(({ id, label, created_at }) => ({ id, label, created_at }));
  },

  validateKey(key) {
    const keysPath = join(DATA_DIR, 'keys.json');
    const keys = readJson(keysPath) || [];
    const h = hashKey(key);
    return keys.some(k => k.key_hash === h);
  },

  deleteKey(id) {
    const keysPath = join(DATA_DIR, 'keys.json');
    const keys = readJson(keysPath) || [];
    writeJson(keysPath, keys.filter(k => k.id !== id));
  },

  getConfig() {
    return readJson(join(DATA_DIR, 'config.json'));
  },

  setConfig(config) {
    mkdirSync(DATA_DIR, { recursive: true });
    writeJson(join(DATA_DIR, 'config.json'), config);
  },

  getSettings() {
    return readJson(join(DATA_DIR, 'settings.json'));
  },

  setSettings(settings) {
    mkdirSync(DATA_DIR, { recursive: true });
    writeJson(join(DATA_DIR, 'settings.json'), settings);
  },
};
