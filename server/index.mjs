#!/usr/bin/env node
import express from 'express';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import cookieParser from 'cookie-parser';
import { db } from './db.mjs';
import { agentAuth } from './middleware/agentAuth.mjs';
import { adminAuth } from './middleware/adminAuth.mjs';
import { agentRouter } from './routes/agent.mjs';
import { adminApiRouter } from './routes/admin-api.mjs';
import { setupRouter } from './routes/setup.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public'), { index: false }));

// ── Seed data on first run ─────────────────────────────────────────────────────
function seedIfNeeded() {
  if (db.getConfig()) return;

  const frameworkConfig = join(ROOT, 'framework', 'config.yaml');
  const refsDir = join(ROOT, 'framework', 'references');

  if (!existsSync(frameworkConfig)) {
    console.log('No framework/config.yaml found. Skipping seed.');
    return;
  }

  const raw = readFileSync(frameworkConfig, 'utf8');
  const nameMatch = raw.match(/^name:\s*(.+)/m);
  const name = nameMatch ? nameMatch[1].replace(/#.*/, '').trim() : 'my-team';

  const taskTypes = [];
  const taskMatches = raw.matchAll(/- id:\s*(\S+)\s*\n\s+reference:\s*references\/(.+?)\.md/g);
  for (const m of taskMatches) taskTypes.push({ id: m[1], reference: m[2] });

  const budgets = {};
  const budgetSection = raw.match(/budgets:\n([\s\S]*?)(?=\n\S|$)/);
  if (budgetSection) {
    for (const line of budgetSection[1].split('\n')) {
      const m = line.match(/^\s+(\w+):\s+(.+)/);
      if (m) budgets[m[1]] = m[2].replace(/#.*/, '').trim();
    }
  }

  db.setConfig({ name, task_types: taskTypes, budgets });

  if (existsSync(refsDir)) {
    for (const file of readdirSync(refsDir).filter(f => f.endsWith('.md'))) {
      const cardName = basename(file, '.md');
      db.setCard(cardName, readFileSync(join(refsDir, file), 'utf8'));
    }
  }

  console.log(`Seeded config (${taskTypes.length} task types) and ${Object.keys(db.getCards()).length} cards from framework/`);
}

seedIfNeeded();

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/setup', setupRouter);
app.use('/api', agentAuth, agentRouter);
app.use('/admin/api', adminAuth, adminApiRouter);

app.get('/login', (req, res) => {
  const settings = db.getSettings();
  if (!settings?.setup_complete) return res.redirect('/setup');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tokenwise — Log in</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="setup-page">
  <div class="setup-card">
    <h1>Tokenwise</h1>
    <p class="subtitle">Enter your admin password.</p>
    <form method="POST" action="/setup/login">
      <label>Admin password
        <input type="password" name="password" required autofocus>
      </label>
      <button type="submit">Log in</button>
    </form>
  </div>
</body>
</html>`);
});

app.get('/admin', (req, res) => {
  const settings = db.getSettings();
  if (!settings?.setup_complete) return res.redirect('/setup');
  const token = req.cookies?.admin_token;
  if (!token || token !== settings.admin_token) return res.redirect('/login');
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.get('/', (req, res) => {
  const settings = db.getSettings();
  res.redirect(settings?.setup_complete ? '/admin' : '/setup');
});

app.listen(PORT, () => {
  console.log(`Tokenwise server running at http://localhost:${PORT}`);
  const settings = db.getSettings();
  if (!settings?.setup_complete) {
    console.log(`First run — visit http://localhost:${PORT}/setup to configure`);
  }
});
