import { db } from '../db.mjs';
import { createHash } from 'node:crypto';

export function adminAuth(req, res, next) {
  const settings = db.getSettings();
  if (!settings?.setup_complete) return res.redirect('/setup');
  const token = req.cookies?.admin_token;
  const expected = settings.admin_token;
  if (!token || !expected || token !== expected) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

export function hashPassword(password) {
  return createHash('sha256').update(password + 'tokenwise-salt').digest('hex');
}
