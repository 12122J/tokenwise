import { db } from '../db.mjs';

export function agentAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || !db.validateKey(key)) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}
