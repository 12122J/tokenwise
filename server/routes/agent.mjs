import { Router } from 'express';
import { db } from '../db.mjs';
import { buildSkill } from '../lib/builder.mjs';

export const agentRouter = Router();

agentRouter.get('/skill', (req, res) => {
  const config = db.getConfig();
  if (!config) return res.status(503).json({ error: 'Server not configured yet' });
  const cards = db.getCards();
  const apiKey = req.headers['x-api-key'];
  const serverUrl = `${req.secure ? 'https' : 'http'}://${req.headers.host}`;
  const skillText = buildSkill(config, { serverUrl, apiKey });
  const welcome = `[${config.name} framework loaded — ${config.task_types.length} task types, ${Object.keys(cards).length} cards]\n\n`;
  res.json({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: welcome + skillText,
    },
  });
});

agentRouter.get('/skill/references/:card', (req, res) => {
  const content = db.getCard(req.params.card);
  if (!content) return res.status(404).json({ error: 'Card not found' });
  res.type('text/plain').send(content);
});

agentRouter.post('/findings', (req, res) => {
  const { card, finding, task } = req.body || {};
  if (!card || !finding) return res.status(400).json({ error: 'card and finding are required' });
  const id = db.addFinding({ card, finding, task: task || '' });
  res.status(201).json({ id });
});
