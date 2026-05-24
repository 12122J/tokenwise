import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { db } from '../db.mjs';
import { hashPassword } from '../middleware/adminAuth.mjs';

export const setupRouter = Router();

setupRouter.get('/', (req, res) => {
  const settings = db.getSettings();
  if (settings?.setup_complete) return res.redirect('/admin');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tokenwise — Setup</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="setup-page">
  <div class="setup-card">
    <h1>Tokenwise</h1>
    <p class="subtitle">Set an admin password to get started.</p>
    <form method="POST" action="/setup">
      <label>Admin password
        <input type="password" name="password" required minlength="8" autofocus>
      </label>
      <button type="submit">Create admin account</button>
    </form>
  </div>
</body>
</html>`);
});

setupRouter.post('/', (req, res) => {
  const settings = db.getSettings();
  if (settings?.setup_complete) return res.redirect('/admin');

  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).send('Password must be at least 8 characters');
  }

  const admin_token = randomBytes(32).toString('hex');
  const { key } = db.addKey('default');

  db.setSettings({
    password_hash: hashPassword(password),
    admin_token,
    setup_complete: true,
    first_api_key: key,
  });

  res
    .cookie('admin_token', admin_token, { httpOnly: true, sameSite: 'strict' })
    .redirect('/admin?first_run=1&key=' + encodeURIComponent(key));
});

setupRouter.post('/login', (req, res) => {
  const settings = db.getSettings();
  if (!settings?.setup_complete) return res.redirect('/setup');

  const { password } = req.body;
  if (hashPassword(password) !== settings.password_hash) {
    return res.status(401).send('Wrong password');
  }

  res
    .cookie('admin_token', settings.admin_token, { httpOnly: true, sameSite: 'strict' })
    .redirect('/admin');
});
