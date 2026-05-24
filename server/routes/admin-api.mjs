import { Router } from 'express';
import { db } from '../db.mjs';
import { buildSkill } from '../lib/builder.mjs';

export const adminApiRouter = Router();

// ── Findings ──────────────────────────────────────────────────────────────────

adminApiRouter.get('/findings', (req, res) => {
  res.json(db.getFindings());
});

adminApiRouter.post('/findings/:id/merge', (req, res) => {
  const finding = db.getFinding(req.params.id);
  if (!finding) return res.status(404).json({ error: 'Finding not found' });

  const existing = db.getCard(finding.card) || '';
  const section = '\n## Contributed Patterns\n';
  const entry = `\n- ${finding.finding}`;

  const updated = existing.includes('## Contributed Patterns')
    ? existing.replace(/(## Contributed Patterns\n)/, `$1${entry}\n`)
    : existing + section + entry + '\n';

  db.setCard(finding.card, updated);
  db.setFindingStatus(finding.id, 'merged');
  res.json({ ok: true });
});

adminApiRouter.post('/findings/:id/skip', (req, res) => {
  db.setFindingStatus(req.params.id, 'skipped');
  res.json({ ok: true });
});

// ── Cards ──────────────────────────────────────────────────────────────────────

adminApiRouter.get('/cards', (req, res) => {
  const cards = db.getCards();
  const result = Object.entries(cards).map(([name, content]) => ({
    name,
    words: content.split(/\s+/).filter(Boolean).length,
  }));
  res.json(result);
});

adminApiRouter.get('/cards/:name', (req, res) => {
  const content = db.getCard(req.params.name);
  if (content === null) return res.status(404).json({ error: 'Card not found' });
  res.json({ name: req.params.name, content });
});

adminApiRouter.put('/cards/:name', (req, res) => {
  const { content } = req.body || {};
  if (typeof content !== 'string') return res.status(400).json({ error: 'content is required' });
  db.setCard(req.params.name, content);
  res.json({ ok: true });
});

adminApiRouter.delete('/cards/:name', (req, res) => {
  db.deleteCard(req.params.name);
  res.json({ ok: true });
});

// ── Config ─────────────────────────────────────────────────────────────────────

adminApiRouter.get('/config', (req, res) => {
  res.json(db.getConfig());
});

adminApiRouter.put('/config', (req, res) => {
  const config = req.body;
  if (!config?.task_types || !config?.budgets) {
    return res.status(400).json({ error: 'task_types and budgets are required' });
  }
  db.setConfig(config);
  res.json({ ok: true });
});

// ── API Keys ───────────────────────────────────────────────────────────────────

adminApiRouter.get('/keys', (req, res) => {
  res.json(db.getKeys());
});

adminApiRouter.post('/keys', (req, res) => {
  const { label } = req.body || {};
  if (!label) return res.status(400).json({ error: 'label is required' });
  const { id, key } = db.addKey(label);
  res.status(201).json({ id, key });
});

adminApiRouter.delete('/keys/:id', (req, res) => {
  db.deleteKey(req.params.id);
  res.json({ ok: true });
});

// ── Skill text (for static adapter downloads) ─────────────────────────────────

adminApiRouter.get('/skill-text', (req, res) => {
  const config = db.getConfig();
  if (!config) return res.status(503).json({ error: 'Server not configured yet' });
  res.json({ text: buildSkill(config), name: config.name });
});

// ── Setup snippet ──────────────────────────────────────────────────────────────

adminApiRouter.get('/snippet', (req, res) => {
  const host = req.headers.host || 'your-server.example.com';
  const protocol = req.secure ? 'https' : 'http';
  const snippet = {
    hooks: {
      SessionStart: [{
        matcher: '',
        hooks: [{
          type: 'command',
          command: `curl -sf -H 'X-API-Key: YOUR_API_KEY' ${protocol}://${host}/api/skill`,
        }],
      }],
    },
  };
  res.json({ snippet: JSON.stringify(snippet, null, 2) });
});
