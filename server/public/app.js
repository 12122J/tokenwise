// ── Utilities ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const main = () => $('main');

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/admin/api' + path, opts);
  if (res.status === 401) { window.location = '/login'; return; }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function downloadFile(filename, content) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

// ── Routing ────────────────────────────────────────────────────────────────────
const views = { findings, cards, config, keys, setup };
let currentView = null;

function navigate(view) {
  editingCard = null;
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  currentView = view;
  (views[view] || findings)();
}

document.querySelectorAll('.sidebar-item').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.view));
});

// ── Findings ───────────────────────────────────────────────────────────────────
async function findings() {
  main().innerHTML = '<div style="padding:1rem;color:var(--text-muted)">Loading...</div>';
  const all = await api('GET', '/findings');
  const pending = all.filter(f => f.status === 'pending');
  const reviewed = all.filter(f => f.status !== 'pending');

  const badge = $('findings-badge');
  if (pending.length > 0) {
    badge.textContent = pending.length;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }

  main().innerHTML = `
    ${pending.length > 0 ? `
    <div class="banner">
      <div class="banner-title">${pending.length} finding${pending.length !== 1 ? 's' : ''} need${pending.length === 1 ? 's' : ''} your review</div>
      <div class="banner-body">Your agents surfaced these patterns during recent tasks. Merge the ones worth keeping — they will be added to the relevant reference card and served to all agents on next session.</div>
    </div>` : ''}
    <div class="findings-list" id="findings-list">
      ${pending.map(findingRow).join('')}
      ${reviewed.length > 0 ? `
        <div class="section-label">Reviewed</div>
        ${reviewed.map(findingRow).join('')}
      ` : ''}
      ${all.length === 0 ? '<div style="color:var(--text-muted);padding:0.5rem 0;">No findings yet. Agents submit findings using the contribute-finding script.</div>' : ''}
    </div>
  `;

  main().querySelectorAll('[data-merge]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await api('POST', '/findings/' + btn.dataset.merge + '/merge');
      findings();
    });
  });
  main().querySelectorAll('[data-skip]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await api('POST', '/findings/' + btn.dataset.skip + '/skip');
      findings();
    });
  });
}

function findingRow(f) {
  const reviewed = f.status !== 'pending';
  return `
    <div class="finding ${reviewed ? 'reviewed' : ''}">
      <div class="finding-body">
        <div class="finding-meta">
          <span class="tag">${f.card}</span>
          ${f.status !== 'pending' ? `<span class="tag ${f.status}">${f.status}</span>` : ''}
          <span class="finding-time">${timeAgo(f.created_at)}${f.task ? ' · ' + f.task : ''}</span>
        </div>
        <div class="finding-text">${f.finding}</div>
        ${!reviewed ? `<div class="finding-dest">Merging adds this to <span>${f.card}.md</span> under "Contributed Patterns"</div>` : ''}
      </div>
      ${!reviewed ? `
      <div class="finding-actions">
        <button class="btn btn-green" data-merge="${f.id}">Merge</button>
        <button class="btn btn-ghost" data-skip="${f.id}">Skip</button>
      </div>` : ''}
    </div>
  `;
}

// ── Cards ──────────────────────────────────────────────────────────────────────
let editingCard = null;

async function cards(selectCard) {
  const all = await api('GET', '/cards');
  if (editingCard || selectCard) {
    const name = selectCard || editingCard;
    const { content } = await api('GET', '/cards/' + name);
    const words = content.split(/\s+/).filter(Boolean).length;
    const over = words > 200;
    main().innerHTML = `
      <div class="editor-panel">
        <div class="editor-header">
          <span class="editor-name" style="cursor:pointer" id="back-to-cards">Cards</span>
          <span style="color:var(--text-muted)"> / </span>
          <span class="editor-name">${name}</span>
          <span class="editor-wordcount ${over ? 'over' : ''}" id="wordcount">${words} words${over ? ' — over limit' : ''}</span>
        </div>
        <textarea class="editor-textarea" id="card-editor">${content}</textarea>
        <div class="editor-footer">
          <span class="editor-hint">Keep under 200 words. Saved changes are served to agents on next session.</span>
          <button class="btn btn-ghost" id="delete-card">Delete</button>
          <button class="btn btn-primary" id="save-card">Save</button>
        </div>
      </div>
    `;
    $('back-to-cards').addEventListener('click', () => { editingCard = null; cards(); });
    $('card-editor').addEventListener('input', () => {
      const w = $('card-editor').value.split(/\s+/).filter(Boolean).length;
      $('wordcount').textContent = w + ' words' + (w > 200 ? ' — over limit' : '');
      $('wordcount').className = 'editor-wordcount' + (w > 200 ? ' over' : '');
    });
    $('save-card').addEventListener('click', async () => {
      await api('PUT', '/cards/' + name, { content: $('card-editor').value });
      $('save-card').textContent = 'Saved';
      setTimeout(() => { $('save-card').textContent = 'Save'; }, 1500);
    });
    $('delete-card').addEventListener('click', async () => {
      if (confirm(`Delete "${name}"? This cannot be undone.`)) {
        await api('DELETE', '/cards/' + name);
        editingCard = null;
        cards();
      }
    });
    editingCard = name;
    return;
  }

  main().innerHTML = `
    <div class="page-header">
      <span class="page-title">Cards</span>
      <span class="page-subtitle">Reference cards served to agents. Click to edit.</span>
    </div>
    <div class="cards-list">
      <div class="key-new-form" style="margin-bottom:1rem">
        <input type="text" id="new-card-name" placeholder="New card name (e.g. testing)">
        <button class="btn btn-primary" id="create-card">New card</button>
      </div>
      ${all.map(c => `
        <div class="card-row" data-card="${c.name}">
          <span class="card-name">${c.name}</span>
          <span class="card-words ${c.words > 200 ? 'over' : ''}">${c.words} words</span>
        </div>
      `).join('')}
    </div>
  `;
  $('create-card').addEventListener('click', async () => {
    const raw = $('new-card-name').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!raw) return;
    await api('PUT', '/cards/' + raw, { content: `# ${raw.charAt(0).toUpperCase() + raw.slice(1)}\n\n` });
    cards(raw);
  });
  main().querySelectorAll('.card-row').forEach(row => {
    row.addEventListener('click', () => cards(row.dataset.card));
  });
}

// ── Config ─────────────────────────────────────────────────────────────────────
async function config() {
  const cfg = await api('GET', '/config');
  main().innerHTML = `
    <div class="page-header">
      <span class="page-title">Config</span>
      <span class="page-subtitle">Task types and budget tiers</span>
    </div>
    <div class="content-area">
      <div class="section-title">Config (JSON)</div>
      <div class="section-desc">Edit task types and budgets. Each task type must have a matching card in Cards.</div>
      <textarea class="editor-textarea" id="config-editor" style="min-height:280px">${JSON.stringify(cfg, null, 2)}</textarea>
      <div class="editor-footer" style="margin-top:0.75rem">
        <button class="btn btn-primary" id="save-config">Save config</button>
        <span id="config-status" style="color:var(--text-muted);font-size:11px"></span>
      </div>
    </div>
  `;
  $('save-config').addEventListener('click', async () => {
    try {
      const parsed = JSON.parse($('config-editor').value);
      await api('PUT', '/config', parsed);
      $('config-status').textContent = 'Saved';
      setTimeout(() => { $('config-status').textContent = ''; }, 2000);
    } catch (e) {
      $('config-status').textContent = 'Error: ' + e.message;
    }
  });
}

// ── API Keys ───────────────────────────────────────────────────────────────────
async function keys(newKey) {
  const all = await api('GET', '/keys');
  const snippet = await api('GET', '/snippet');
  main().innerHTML = `
    <div class="page-header">
      <span class="page-title">API Keys</span>
      <span class="page-subtitle">Keys are used in the employee settings.json hook</span>
    </div>
    <div class="keys-list">
      ${newKey ? `
        <div class="key-reveal">New key (shown once — copy it now):\n\n${newKey}</div>
      ` : ''}
      <div class="key-new-form">
        <input type="text" id="key-label" placeholder="Label (e.g. engineering-team)">
        <button class="btn btn-primary" id="gen-key">Generate key</button>
      </div>
      ${all.map(k => `
        <div class="key-row">
          <span class="key-label">${k.label}</span>
          <span class="key-date">${new Date(k.created_at).toLocaleDateString()}</span>
          <button class="btn btn-ghost" data-revoke="${k.id}">Revoke</button>
        </div>
      `).join('')}
      <div style="margin-top:1.5rem">
        <div class="section-title" style="margin-bottom:0.4rem">Deploy to employees</div>
        <div class="section-desc" style="margin-bottom:0.75rem">${newKey ? 'API key is pre-filled — ready to copy or download.' : 'Generate a key above to get files with the key pre-filled.'}</div>
        <div class="snippet" style="margin-bottom:0.75rem">${newKey ? snippet.snippet.replace('YOUR_API_KEY', newKey) : snippet.snippet}</div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.25rem">
          <button class="btn btn-ghost" id="dl-settings">Download settings.json</button>
          <button class="btn btn-ghost" id="dl-script">Download install.sh</button>
        </div>
        <div class="section-desc" style="font-size:11px">For Codex, Cursor, or opencode — see the README for adapter files. Those platforms embed the skill statically and don't use hook injection.</div>
      </div>
    </div>
  `;
  $('gen-key').addEventListener('click', async () => {
    const label = $('key-label').value.trim();
    if (!label) return;
    const res = await api('POST', '/keys', { label });
    keys(res.key);
  });
  main().querySelectorAll('[data-revoke]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Revoke this key? Agents using it will stop working.')) {
        await api('DELETE', '/keys/' + btn.dataset.revoke);
        keys();
      }
    });
  });

  const settingsJson = JSON.parse(newKey ? snippet.snippet.replace('YOUR_API_KEY', newKey) : snippet.snippet);
  const command = settingsJson.hooks.SessionStart[0].hooks[0].command;

  $('dl-settings').addEventListener('click', () => {
    downloadFile('settings.json', JSON.stringify(settingsJson, null, 2));
  });

  $('dl-script').addEventListener('click', () => {
    const script = `#!/bin/bash
set -e
SETTINGS_DIR="$HOME/.claude-personal"
mkdir -p "$SETTINGS_DIR"

if [ -f "$SETTINGS_DIR/settings.json" ]; then
  cp "$SETTINGS_DIR/settings.json" "$SETTINGS_DIR/settings.json.bak"
  echo "Backed up existing settings.json to settings.json.bak"
fi

cat > "$SETTINGS_DIR/settings.json" << '__ENDJSON__'
${JSON.stringify(settingsJson, null, 2)}
__ENDJSON__

echo "Tokenwise hook installed. Restart Claude Code to activate."
`;
    downloadFile('install-tokenwise.sh', script);
  });
}

// ── Setup ──────────────────────────────────────────────────────────────────────
async function setup() {
  const snippet = await api('GET', '/snippet');
  main().innerHTML = `
    <div class="page-header">
      <span class="page-title">Setup</span>
      <span class="page-subtitle">How to deploy the framework to your team</span>
    </div>
    <div class="content-area">
      <div class="section-title" style="margin-bottom:0.5rem">Step 1 — Generate an API key</div>
      <div class="section-desc">Go to API Keys, generate a key labelled for your team.</div>

      <div class="section-title" style="margin-bottom:0.5rem;margin-top:1.25rem">Step 2 — Give employees this file</div>
      <div class="section-desc">Save as <code>~/.claude-personal/settings.json</code> on each employee machine. Replace YOUR_API_KEY. IT can deploy this via MDM (Jamf, Intune) to all machines at once.</div>
      <div class="snippet">${snippet.snippet}</div>

      <div class="section-title" style="margin-bottom:0.5rem;margin-top:1.25rem">Step 3 — Done</div>
      <div class="section-desc">Every time an employee opens Claude Code, the hook fetches the current skill from this server and injects it into their session. Update a card in the dashboard — all agents get it next session automatically.</div>
    </div>
  `;
}

// ── Init ───────────────────────────────────────────────────────────────────────
const params = new URLSearchParams(location.search);
if (params.has('first_run') && params.has('key')) {
  navigate('keys');
  keys(params.get('key'));
  history.replaceState({}, '', '/admin');
} else {
  navigate('findings');
}
