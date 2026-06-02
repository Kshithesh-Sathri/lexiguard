const API = 'http://localhost:5000/api';
let authToken = null;
let currentUser = null;

// ─── Auth functions ───────────────────────────────────────
function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('form-login').style.display = isLogin ? 'block' : 'none';
  document.getElementById('form-register').style.display = isLogin ? 'none' : 'block';
  document.getElementById('tab-login').style.background = isLogin ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent';
  document.getElementById('tab-login').style.color = isLogin ? 'white' : '#64748b';
  document.getElementById('tab-register').style.background = isLogin ? 'transparent' : 'linear-gradient(135deg,#6366f1,#8b5cf6)';
  document.getElementById('tab-register').style.color = isLogin ? '#64748b' : 'white';
  document.getElementById('auth-error').style.display = 'none';
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  if (!email || !password) { showAuthError('Please enter email and password'); return; }
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { showAuthError(data.error || 'Login failed'); return; }
    await saveAuth(data.token, data.user);
    hideAuthModal();
  } catch (err) {
    showAuthError('Cannot reach backend');
  }
  btn.textContent = 'Sign In';
  btn.disabled = false;
}

async function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn = document.getElementById('register-btn');
  if (!email || !password) { showAuthError('Please enter email and password'); return; }
  btn.textContent = 'Creating account...';
  btn.disabled = true;
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) { showAuthError(data.error || 'Registration failed'); return; }
    await saveAuth(data.token, data.user);
    hideAuthModal();
  } catch (err) {
    showAuthError('Cannot reach backend');
  }
  btn.textContent = 'Create Account';
  btn.disabled = false;
}

async function saveAuth(token, user) {
  authToken = token;
  currentUser = user;
  await chrome.storage.local.set({ authToken: token, authUser: user });
  updateUserUI(user);
}

function updateUserUI(user) {
  const footer = document.querySelector('.sidebar-footer');
  if (footer && user) {
    footer.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;
            background:linear-gradient(135deg,#6366f1,#8b5cf6);
            display:flex;align-items:center;justify-content:center;
            font-size:12px;font-weight:700;color:white;flex-shrink:0">
            ${user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div style="overflow:hidden">
            <div style="font-size:12px;font-weight:600;color:#e2e8f0;
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${user.name || user.email}
            </div>
            <div style="font-size:10px;color:#475569">Signed in</div>
          </div>
        </div>
          <button onclick="handleLogout()" style="width:100%;padding:5px;background:transparent;
          border:1px solid #1e2d45;border-radius:6px;
          color:#475569;font-size:11px;cursor:pointer">
          Sign out
        </button>
      </div>`;
  }
}

async function handleLogout() {
  authToken = null;
  currentUser = null;
  await chrome.storage.local.remove(['authToken', 'authUser']);
  location.reload();
}

function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function showAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function skipAuth() {
  hideAuthModal();
}

async function checkAuth() {
  const stored = await chrome.storage.local.get(['authToken', 'authUser']);
  if (stored.authToken && stored.authUser) {
    authToken = stored.authToken;
    currentUser = stored.authUser;
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        updateUserUI(currentUser);
        hideAuthModal();
        return;
      }
    } catch (err) {
      console.log('Token verification failed');
    }
    authToken = null;
    currentUser = null;
    await chrome.storage.local.remove(['authToken', 'authUser']);
  }
  // No valid session — show the modal
  showAuthModal();
}

checkAuth();

// ─── Auth button listeners ────────────────────────────────
document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));
document.getElementById('login-btn')?.addEventListener('click', handleLogin);
document.getElementById('register-btn')?.addEventListener('click', handleRegister);
document.getElementById('skip-auth-btn')?.addEventListener('click', skipAuth);

// Enter key support
document.getElementById('login-password')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleLogin();
});
document.getElementById('reg-password')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleRegister();
});

// ─── Simulated Progress ───────────────────────────────────
const SCAN_STEPS = [
  'Extracting text content',
  'Detecting dark patterns',
  'Analyzing privacy risks',
  'Calculating trust score',
  'Saving to database',
  'Analysis complete'
];

const PDF_STEPS = [
  'Reading PDF file',
  'Extracting text from pages',
  'Detecting dark patterns',
  'Analyzing privacy risks',
  'Calculating trust score',
  'Saving results',
  'PDF analysis complete'
];

let progressTimer = null;

function showProgress(steps, containerId) {
  const existing = document.getElementById('progress-overlay');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'progress-overlay';
  el.className = 'progress-overlay';
  el.innerHTML = `
    <div class="progress-title">🔍 Analyzing document...</div>
    <div class="progress-message" id="progress-msg">Starting analysis...</div>
    <div class="progress-track">
      <div class="progress-fill" id="progress-fill"></div>
    </div>
    <div class="progress-steps" id="progress-steps">
      ${steps.map((s, i) => `
        <div class="progress-step" id="pstep-${i}">
          <div class="step-dot"></div>
          <span>${s}</span>
        </div>`).join('')}
    </div>`;
  const container = document.getElementById(containerId);
  if (container) container.appendChild(el);
  simulateProgress(steps);
  return el;
}

function simulateProgress(steps) {
  let currentStep = 0;
  if (progressTimer) clearInterval(progressTimer);
  activateStep(0, steps[0], steps.length);
  progressTimer = setInterval(() => {
    currentStep++;
    if (currentStep >= steps.length - 1) { clearInterval(progressTimer); return; }
    activateStep(currentStep, steps[currentStep], steps.length);
  }, 800);
}

function activateStep(index, message, total) {
  for (let i = 0; i < index; i++) {
    const el = document.getElementById(`pstep-${i}`);
    if (el) el.className = 'progress-step done';
  }
  const current = document.getElementById(`pstep-${index}`);
  if (current) current.className = 'progress-step active';
  const msg = document.getElementById('progress-msg');
  const fill = document.getElementById('progress-fill');
  if (msg) msg.textContent = message + '...';
  if (fill) fill.style.width = ((index + 1) / (total || SCAN_STEPS.length) * 90) + '%';
}

function completeProgress(steps) {
  if (progressTimer) clearInterval(progressTimer);
  for (let i = 0; i < steps.length; i++) {
    const el = document.getElementById(`pstep-${i}`);
    if (el) el.className = 'progress-step done';
  }
  const fill = document.getElementById('progress-fill');
  const msg = document.getElementById('progress-msg');
  if (fill) fill.style.width = '100%';
  if (msg) msg.textContent = '✅ Analysis complete!';
}

function hideProgress() {
  if (progressTimer) clearInterval(progressTimer);
  const el = document.getElementById('progress-overlay');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.4s ease';
    setTimeout(() => el.remove(), 400);
  }
}

// ─── Navigation ───────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`page-${btn.dataset.page}`).classList.add('active');
    if (btn.dataset.page === 'history') loadHistory();
  });
});

// ─── Load last scan from popup ────────────────────────────
chrome.storage.local.get(['lastScan', 'lastUrl'], (data) => {
  if (data.lastScan) {
    document.getElementById('url-input').value = data.lastUrl || '';
    displayResults(data.lastScan);
  }
});

// ─── Helper functions ─────────────────────────────────────
function trustColor(s) {
  return s >= 85 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444';
}

function trustLabel(s) {
  return s >= 85 ? '✅ Safe to use' : s >= 60 ? '⚠️ Moderate Risk' : '🚨 High Risk — Be Careful';
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const increment = Math.max(target / 20, 0.1);
  const timer = setInterval(() => {
    current = Math.min(current + increment, target);
    el.textContent = Math.round(current);
    if (current >= target) clearInterval(timer);
  }, 30);
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Scanner ──────────────────────────────────────────────
document.getElementById('analyze-btn').addEventListener('click', async () => {
  const text = document.getElementById('text-input').value.trim();
  const url = document.getElementById('url-input').value.trim();
  const errEl = document.getElementById('scan-error');
  const btn = document.getElementById('analyze-btn');

  errEl.style.display = 'none';
  if (!text || text.length < 50) {
    errEl.textContent = 'Please paste some text to analyze (at least 50 characters).';
    errEl.style.display = 'block';
    return;
  }

  btn.textContent = 'Analyzing...';
  btn.disabled = true;
  document.getElementById('results').style.display = 'none';
  const chartRow = document.getElementById('charts-row');
  if (chartRow) chartRow.style.display = 'none';

  showProgress(SCAN_STEPS, 'page-scanner');

  try {
    const res = await fetch(`${API}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : ''
      },
      body: JSON.stringify({ text, url })
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Backend error'); }
    const data = await res.json();
    completeProgress(SCAN_STEPS);
    await new Promise(resolve => setTimeout(resolve, 600));
    hideProgress();
    displayResults(data);
  } catch (err) {
    hideProgress();
    errEl.textContent = err.message.includes('fetch') ? 'Cannot reach backend.' : err.message;
    errEl.style.display = 'block';
  }

  btn.textContent = '🔍 Analyze Document';
  btn.disabled = false;
});

document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('text-input').value = '';
  document.getElementById('url-input').value = '';
  document.getElementById('results').style.display = 'none';
  document.getElementById('scan-error').style.display = 'none';
  const chartRow = document.getElementById('charts-row');
  if (chartRow) chartRow.style.display = 'none';
});

// ─── Display Results ──────────────────────────────────────
function displayResults(data) {
  const score = data.trust_score || 0;
  const color = trustColor(score);
  const summary = data.summary || {};
  const clauses = data.clauses || [];

  const arc = document.getElementById('trust-arc');
  if (arc) {
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (score / 100) * circumference;
    arc.style.stroke = color;
    setTimeout(() => { arc.style.strokeDashoffset = offset; }, 100);
  }

  const trustNumEl = document.getElementById('trust-num');
  if (trustNumEl) {
    let current = 0;
    const increment = Math.max(score / 40, 0.5);
    const counter = setInterval(() => {
      current = Math.min(current + increment, score);
      trustNumEl.textContent = Math.round(current);
      trustNumEl.style.color = color;
      if (current >= score) clearInterval(counter);
    }, 25);
  }

  const statusEl = document.getElementById('trust-status');
  if (statusEl) {
    statusEl.textContent = trustLabel(score);
    statusEl.style.color = color;
    statusEl.className = 'trust-status ' + (score >= 85 ? 'safe' : score >= 60 ? 'moderate' : 'danger');
  }

  animateNumber('s-high', summary.high_risks ?? 0);
  animateNumber('s-med', summary.medium_risks ?? 0);
  animateNumber('s-priv', summary.privacy_concerns ?? 0);
  animateNumber('s-sub', summary.subscription_traps ?? 0);

  const concernEl = document.getElementById('s-concern');
  if (concernEl) concernEl.textContent = summary.main_concern || '';

  setTimeout(() => {
    renderRiskChart(summary);
    renderPatternChart(clauses);
    const chartRow = document.getElementById('charts-row');
    if (chartRow) chartRow.style.display = 'grid';
  }, 400);

  const clausesTitleEl = document.getElementById('clauses-title');
  if (clausesTitleEl) clausesTitleEl.textContent = `Risky Clauses (${clauses.length} found)`;

  const clausesListEl = document.getElementById('clauses-list');
  if (clausesListEl) {
    clausesListEl.innerHTML = clauses.length === 0
      ? `<div style="text-align:center;padding:40px;color:#334155;font-size:14px">✅ No risky clauses found — this document looks safe!</div>`
      : clauses.map((c, i) => `
          <div class="clause-card ${c.risk_level}" style="animation-delay:${i * 0.06}s">
            <div class="clause-meta">
              <span class="risk-badge ${c.risk_level}">${c.risk_level}</span>
              <span class="pattern-type">${c.pattern_type}</span>
            </div>
            <div class="clause-simplified">${c.simplified}</div>
            <div class="clause-consequence">${c.consequence || ''}</div>
          </div>`).join('');
  }

  document.getElementById('results').style.display = 'block';
  window._lastScanData = data;
}

// ─── Charts ───────────────────────────────────────────────
function renderRiskChart(summary) {
  const el = document.getElementById('risk-bar-chart');
  if (!el) return;
  const high = summary.high_risks || 0;
  const med = summary.medium_risks || 0;
  const low = summary.low_risks || 0;
  const priv = summary.privacy_concerns || 0;
  const total = Math.max(high + med + low, 1);
  el.innerHTML = `
    <div class="risk-bars">
      <div class="risk-bar-item">
        <div class="risk-bar-label" style="color:#ef4444">High</div>
        <div class="risk-bar-track"><div class="risk-bar-fill" style="background:#ef4444;width:${high/total*100}%"></div></div>
        <div class="risk-bar-count" style="color:#ef4444">${high}</div>
      </div>
      <div class="risk-bar-item">
        <div class="risk-bar-label" style="color:#f59e0b">Medium</div>
        <div class="risk-bar-track"><div class="risk-bar-fill" style="background:#f59e0b;width:${med/total*100}%"></div></div>
        <div class="risk-bar-count" style="color:#f59e0b">${med}</div>
      </div>
      <div class="risk-bar-item">
        <div class="risk-bar-label" style="color:#3b82f6">Low</div>
        <div class="risk-bar-track"><div class="risk-bar-fill" style="background:#3b82f6;width:${low/total*100}%"></div></div>
        <div class="risk-bar-count" style="color:#3b82f6">${low}</div>
      </div>
      <div class="risk-bar-item">
        <div class="risk-bar-label" style="color:#a78bfa">Privacy</div>
        <div class="risk-bar-track"><div class="risk-bar-fill" style="background:#a78bfa;width:${priv/total*100}%"></div></div>
        <div class="risk-bar-count" style="color:#a78bfa">${priv}</div>
      </div>
    </div>`;
}

function renderPatternChart(clauses) {
  const el = document.getElementById('pattern-chart');
  if (!el) return;
  if (clauses.length === 0) {
    el.innerHTML = `<div style="color:#334155;font-size:13px;text-align:center;padding:20px">No patterns found</div>`;
    return;
  }
  const patterns = {};
  clauses.forEach(c => { const p = c.pattern_type || 'Unknown'; patterns[p] = (patterns[p] || 0) + 1; });
  const sorted = Object.entries(patterns).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const colors = ['#ef4444', '#f59e0b', '#a78bfa', '#3b82f6', '#22c55e', '#fb923c'];
  el.innerHTML = `
    <div class="pattern-list">
      ${sorted.map(([name, count], i) => `
        <div class="pattern-item">
          <span class="pattern-name">${name}</span>
          <span class="pattern-badge" style="background:${colors[i]}22;color:${colors[i]}">${count}</span>
        </div>`).join('')}
    </div>`;
}

// ─── Download Report ──────────────────────────────────────
document.getElementById('download-btn').addEventListener('click', () => {
  const data = window._lastScanData;
  if (!data) return;
  const url = document.getElementById('url-input').value || 'Unknown';
  const date = new Date().toLocaleDateString();
  let report = `LEXIGUARD ANALYSIS REPORT\nGenerated: ${date}\nURL: ${url}\n${'='.repeat(50)}\n\nTRUST SCORE: ${data.trust_score}/100\nSTATUS: ${data.trust_score >= 85 ? 'SAFE' : data.trust_score >= 60 ? 'MODERATE RISK' : 'HIGH RISK'}\n\nSUMMARY\n-------\nHigh Risks: ${data.summary?.high_risks ?? 0}\nMedium Risks: ${data.summary?.medium_risks ?? 0}\nPrivacy Concerns: ${data.summary?.privacy_concerns ?? 0}\nSubscription Traps: ${data.summary?.subscription_traps ?? 0}\nOverall: ${data.summary?.main_concern || 'N/A'}\n\n${'='.repeat(50)}\nRISKY CLAUSES (${data.clauses?.length ?? 0} found)\n${'='.repeat(50)}\n`;
  data.clauses?.forEach((c, i) => { report += `\n${i + 1}. [${c.risk_level}] ${c.pattern_type}\n   Plain English: ${c.simplified}\n   Consequence: ${c.consequence || 'N/A'}\n   ${'─'.repeat(40)}`; });
  const blob = new Blob([report], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `LexiGuard_Report_${date.replace(/\//g, '-')}.txt`;
  a.click();
});

// ─── History ──────────────────────────────────────────────
async function loadHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = `<div class="spinner"></div>`;
  try {
   const res = await fetch(`${API}/history?t=${Date.now()}`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      headers: { 'Authorization': authToken ? `Bearer ${authToken}` : '' }
    });
    const data = await res.json();
    const scans = data.scans || [];
    if (scans.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No scans yet</div><div class="empty-sub">Analyze a document to see it here</div></div>`;
      return;
    }
    const statsEl = document.getElementById('history-stats');
    if (statsEl) {
      statsEl.style.display = 'grid';
      statsEl.innerHTML = `
        <div class="history-stat"><div class="history-stat-num" style="color:#818cf8">${scans.length}</div><div class="history-stat-lbl">Total Scans</div></div>
        <div class="history-stat"><div class="history-stat-num" style="color:#22c55e">${scans.filter(s => s.trust_score >= 85).length}</div><div class="history-stat-lbl">Safe Documents</div></div>
        <div class="history-stat"><div class="history-stat-num" style="color:#ef4444">${scans.filter(s => s.trust_score < 60).length}</div><div class="history-stat-lbl">Dangerous Documents</div></div>`;
    }
    list.innerHTML = scans.map(scan => {
      const c = trustColor(scan.trust_score);
      const high = (scan.clauses || []).filter(cl => cl.risk_level === 'High').length;
      const med = (scan.clauses || []).filter(cl => cl.risk_level === 'Medium').length;
      const timeAgo = getTimeAgo(scan.scanned_at);
      return `
        <div class="history-card" onclick="toggleHistory('${scan.id}')">
          <div class="history-card-header">
            <div>
              <div class="history-domain">${scan.domain || 'Unknown'}</div>
              <div class="history-url">${scan.url}</div>
              <div class="history-meta">
                <span class="history-score" style="color:${c}">${scan.trust_score}/100</span>
                <span class="history-time">${timeAgo}</span>
              </div>
            </div>
            <div class="history-risks">
              <div class="history-risk-count"><div class="history-risk-num" style="color:#ef4444">${high}</div><div class="history-risk-lbl">High</div></div>
              <div class="history-risk-count"><div class="history-risk-num" style="color:#f59e0b">${med}</div><div class="history-risk-lbl">Med</div></div>
              <div class="history-risk-count"><div class="history-risk-num" style="color:#94a3b8">${(scan.clauses || []).length}</div><div class="history-risk-lbl">Total</div></div>
            </div>
          </div>
          <div class="history-clauses" id="hc-${scan.id}">
            ${(scan.clauses || []).map(cl => `
              <div class="clause-card ${cl.risk_level}" style="margin-bottom:8px">
                <div class="clause-meta">
                  <span class="risk-badge ${cl.risk_level}">${cl.risk_level}</span>
                  <span class="pattern-type">${cl.pattern_type}</span>
                </div>
                <div class="clause-simplified">${cl.simplified}</div>
              </div>`).join('')}
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Could not load history</div><div class="empty-sub">Make sure the backend is running</div></div>`;
  }
}

function toggleHistory(id) {
  const el = document.getElementById(`hc-${id}`);
  if (el) el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// ─── Legal Simplifier ─────────────────────────────────────
document.getElementById('simplify-btn').addEventListener('click', async () => {
  const text = document.getElementById('simplifier-input').value.trim();
  const btn = document.getElementById('simplify-btn');
  const result = document.getElementById('simplifier-result');
  if (!text || text.length < 20) return;
  btn.textContent = 'Simplifying...';
  btn.disabled = true;
  result.style.display = 'none';
  try {
    const res = await fetch(`${API}/simplify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : ''
      },
      body: JSON.stringify({ text })
    });
    const data = await res.json();

    // BUG FIX: check for API error before rendering (was showing "undefined" on errors)
    if (!res.ok || data.error) {
      result.innerHTML = `<div class="error-msg">⚠️ ${data.error || 'Backend error. Check your Groq API key in backend/.env and restart the server.'}</div>`;
      result.style.display = 'block';
      return;
    }

    result.innerHTML = `
      <div class="simplifier-section">
        <div class="simplifier-label">Plain English</div>
        <div class="simplifier-text">${data.simplified || 'N/A'}</div>
      </div>
      <div class="simplifier-section">
        <div class="simplifier-label">Risk Level</div>
        <span class="risk-badge ${data.risk_level || 'Low'}" style="font-size:13px;padding:4px 12px">${data.risk_level || 'Unknown'}</span>
      </div>
      <div class="simplifier-section">
        <div class="simplifier-label">What this means for you</div>
        <div class="simplifier-text">${data.consequence || 'N/A'}</div>
      </div>
      <div class="simplifier-section">
        <div class="simplifier-label">What you should do</div>
        <div class="simplifier-text">${data.recommendation || 'N/A'}</div>
      </div>`;
    result.style.display = 'block';
  } catch (err) {
    result.innerHTML = `<div class="error-msg">⚠️ Failed to connect to backend. Make sure it is running on port 5000.</div>`;
    result.style.display = 'block';
  }
  btn.textContent = '🧠 Simplify This Clause';
  btn.disabled = false;
});

// ─── PDF Analyzer ─────────────────────────────────────────
let selectedPdfFile = null;
const dropZone = document.getElementById('drop-zone');
const pdfInput = document.getElementById('pdf-input');

dropZone.addEventListener('click', () => pdfInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') setPdfFile(file);
  else showPdfError('Please drop a PDF file.');
});
pdfInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) setPdfFile(file); });

document.getElementById('remove-file').addEventListener('click', () => {
  selectedPdfFile = null;
  pdfInput.value = '';
  document.getElementById('file-info').style.display = 'none';
  document.getElementById('drop-zone').style.display = 'block';
  document.getElementById('analyze-pdf-btn').disabled = true;
  document.getElementById('pdf-results').style.display = 'none';
});

function setPdfFile(file) {
  selectedPdfFile = file;
  document.getElementById('drop-zone').style.display = 'none';
  document.getElementById('file-info').style.display = 'flex';
  document.getElementById('file-name').textContent = file.name;
  document.getElementById('file-size').textContent = (file.size / 1024).toFixed(1) + ' KB';
  document.getElementById('analyze-pdf-btn').disabled = false;
  document.getElementById('pdf-error').style.display = 'none';
}

function showPdfError(msg) {
  const el = document.getElementById('pdf-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

document.getElementById('analyze-pdf-btn').addEventListener('click', async () => {
  if (!selectedPdfFile) return;
  const btn = document.getElementById('analyze-pdf-btn');
  const errEl = document.getElementById('pdf-error');
  btn.textContent = 'Analyzing...';
  btn.disabled = true;
  document.getElementById('pdf-results').style.display = 'none';
  errEl.style.display = 'none';
  showProgress(PDF_STEPS, 'page-pdf');
  try {
    const formData = new FormData();
    formData.append('pdf', selectedPdfFile);
    const res = await fetch(`${API}/analyze-pdf`, {
      method: 'POST',
      headers: { 'Authorization': authToken ? `Bearer ${authToken}` : '' },
      body: formData
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to analyze PDF'); }
    const data = await res.json();
    completeProgress(PDF_STEPS);
    await new Promise(resolve => setTimeout(resolve, 600));
    hideProgress();
    displayPdfResults(data);
  } catch (err) {
    hideProgress();
    showPdfError(err.message.includes('fetch') ? 'Cannot reach backend.' : err.message);
  }
  btn.textContent = '🔍 Analyze PDF';
  btn.disabled = false;
});

function displayPdfResults(data) {
  const score = data.trust_score || 0;
  const color = trustColor(score);
  const summary = data.summary || {};
  const clauses = data.clauses || [];
  document.getElementById('pdf-file-stats').innerHTML = `
    <div class="pdf-stat"><div class="pdf-stat-num">${data.pages || 1}</div><div class="pdf-stat-lbl">Pages</div></div>
    <div class="pdf-stat"><div class="pdf-stat-num">${(data.word_count || 0).toLocaleString()}</div><div class="pdf-stat-lbl">Words</div></div>
    <div class="pdf-stat"><div class="pdf-stat-num">${clauses.length}</div><div class="pdf-stat-lbl">Risks Found</div></div>`;
  const arc = document.getElementById('pdf-trust-arc');
  if (arc) {
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (score / 100) * circumference;
    arc.style.stroke = color;
    setTimeout(() => { arc.style.strokeDashoffset = offset; }, 100);
  }
  document.getElementById('pdf-trust-num').textContent = score;
  document.getElementById('pdf-trust-num').style.color = color;
  document.getElementById('pdf-trust-status').textContent = trustLabel(score);
  document.getElementById('pdf-trust-status').style.color = color;
  document.getElementById('pdf-s-high').textContent = summary.high_risks ?? 0;
  document.getElementById('pdf-s-med').textContent = summary.medium_risks ?? 0;
  document.getElementById('pdf-s-priv').textContent = summary.privacy_concerns ?? 0;
  document.getElementById('pdf-s-sub').textContent = summary.subscription_traps ?? 0;
  document.getElementById('pdf-s-concern').textContent = summary.main_concern || '';
  document.getElementById('pdf-clauses-title').textContent = `Risky Clauses (${clauses.length} found)`;
  document.getElementById('pdf-clauses-list').innerHTML = clauses.length === 0
    ? `<div style="text-align:center;padding:30px;color:#475569">✅ No risky clauses found!</div>`
    : clauses.map((c, i) => `
        <div class="clause-card ${c.risk_level}" style="animation-delay:${i*0.05}s">
          <div class="clause-meta">
            <span class="risk-badge ${c.risk_level}">${c.risk_level}</span>
            <span class="pattern-type">${c.pattern_type}</span>
          </div>
          <div class="clause-simplified">${c.simplified}</div>
          <div class="clause-consequence">${c.consequence || ''}</div>
        </div>`).join('');
  document.getElementById('pdf-results').style.display = 'block';
  window._lastPdfData = data;
}

document.getElementById('pdf-download-btn').addEventListener('click', () => {
  const data = window._lastPdfData;
  if (!data) return;
  const date = new Date().toLocaleDateString();
  let report = `LEXIGUARD PDF ANALYSIS REPORT\nFile: ${data.filename || 'Unknown'}\nPages: ${data.pages || 'N/A'}\nWords: ${data.word_count || 'N/A'}\nGenerated: ${date}\n${'='.repeat(50)}\n\nTRUST SCORE: ${data.trust_score}/100\nSTATUS: ${data.trust_score >= 85 ? 'SAFE' : data.trust_score >= 60 ? 'MODERATE RISK' : 'HIGH RISK'}\n\nSUMMARY\n-------\nHigh Risks: ${data.summary?.high_risks ?? 0}\nMedium Risks: ${data.summary?.medium_risks ?? 0}\nPrivacy Concerns: ${data.summary?.privacy_concerns ?? 0}\nSubscription Traps: ${data.summary?.subscription_traps ?? 0}\nOverall: ${data.summary?.main_concern || 'N/A'}\n\n${'='.repeat(50)}\nRISKY CLAUSES (${data.clauses?.length ?? 0} found)\n${'='.repeat(50)}\n`;
  data.clauses?.forEach((c, i) => { report += `\n${i + 1}. [${c.risk_level}] ${c.pattern_type}\n   Plain English: ${c.simplified}\n   Consequence: ${c.consequence || 'N/A'}\n   ${'─'.repeat(40)}`; });
  const blob = new Blob([report], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `LexiGuard_PDF_Report_${date.replace(/\//g, '-')}.txt`;
  a.click();
});

// ─── Compare Documents ────────────────────────────────────
let allChanges = [];

document.getElementById('compare-btn').addEventListener('click', async () => {
  const oldText = document.getElementById('old-text').value.trim();
  const newText = document.getElementById('new-text').value.trim();
  const siteName = document.getElementById('site-name').value.trim();
  const btn = document.getElementById('compare-btn');
  const errEl = document.getElementById('compare-error');
  errEl.style.display = 'none';
  if (!oldText || oldText.length < 50) { errEl.textContent = 'Please paste the old version text (at least 50 characters).'; errEl.style.display = 'block'; return; }
  if (!newText || newText.length < 50) { errEl.textContent = 'Please paste the new version text (at least 50 characters).'; errEl.style.display = 'block'; return; }
  btn.textContent = 'Comparing...';
  btn.disabled = true;
  document.getElementById('compare-results').style.display = 'none';
  try {
    const res = await fetch(`${API}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : ''
      },
      body: JSON.stringify({ oldText, newText, siteName })
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Comparison failed'); }
    const data = await res.json();
    displayCompareResults(data);
  } catch (err) {
    errEl.textContent = err.message.includes('fetch') ? 'Cannot reach backend.' : err.message;
    errEl.style.display = 'block';
  }
  btn.textContent = '⚖️ Compare Documents';
  btn.disabled = false;
});

function displayCompareResults(data) {
  const verdict = data.verdict || 'Mixed';
  const changes = data.changes || [];
  const summary = data.summary || {};
  allChanges = changes;
  const verdictConfig = {
    Worse: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', icon: '📉' },
    Better: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', icon: '📈' },
    Same: { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)', icon: '➡️' },
    Mixed: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: '⚖️' }
  };
  const vc = verdictConfig[verdict] || verdictConfig.Mixed;
  const banner = document.getElementById('verdict-banner');
  banner.style.background = vc.bg;
  banner.style.borderColor = vc.border;
  document.getElementById('verdict-title').innerHTML = `${vc.icon} Terms got <span style="color:${vc.color}">${verdict}</span>`;
  document.getElementById('verdict-reason').textContent = data.verdict_reason || '';
  const oldScore = data.old_score || 0;
  const newScore = data.new_score || 0;
  const scoreChange = data.score_change || (newScore - oldScore);
  document.getElementById('old-score-num').textContent = oldScore;
  document.getElementById('new-score-num').textContent = newScore;
  document.getElementById('new-score-num').style.color = trustColor(newScore);
  const changeBadge = document.getElementById('score-change-badge');
  if (scoreChange > 0) { changeBadge.textContent = `+${scoreChange}`; changeBadge.style.background = 'rgba(34,197,94,0.15)'; changeBadge.style.color = '#22c55e'; }
  else if (scoreChange < 0) { changeBadge.textContent = `${scoreChange}`; changeBadge.style.background = 'rgba(239,68,68,0.15)'; changeBadge.style.color = '#ef4444'; }
  else { changeBadge.textContent = 'No change'; changeBadge.style.background = 'rgba(100,116,139,0.15)'; changeBadge.style.color = '#64748b'; }
  document.getElementById('compare-stats').innerHTML = `
    <div style="background:#0d1424;border-radius:12px;padding:16px;text-align:center;border:1px solid #1e2d45">
      <div style="font-size:28px;font-weight:800;color:#f1f5f9">${summary.total_changes ?? changes.length}</div>
      <div style="font-size:11px;color:#475569;margin-top:4px">Total Changes</div>
    </div>
    <div style="background:#0d1424;border-radius:12px;padding:16px;text-align:center;border:1px solid #1e2d45">
      <div style="font-size:28px;font-weight:800;color:#ef4444">${summary.negative_changes ?? 0}</div>
      <div style="font-size:11px;color:#475569;margin-top:4px">Negative Changes</div>
    </div>
    <div style="background:#0d1424;border-radius:12px;padding:16px;text-align:center;border:1px solid #1e2d45">
      <div style="font-size:28px;font-weight:800;color:#22c55e">${summary.positive_changes ?? 0}</div>
      <div style="font-size:11px;color:#475569;margin-top:4px">Positive Changes</div>
    </div>
    <div style="background:#0d1424;border-radius:12px;padding:16px;text-align:center;border:1px solid #1e2d45">
      <div style="font-size:28px;font-weight:800;color:#64748b">${summary.neutral_changes ?? 0}</div>
      <div style="font-size:11px;color:#475569;margin-top:4px">Neutral Changes</div>
    </div>`;
  document.getElementById('changes-title').textContent = `${changes.length} Changes Found`;
  renderChanges(changes);
  document.getElementById('compare-results').style.display = 'block';
}

function renderChanges(changes) {
  const list = document.getElementById('changes-list');
  if (changes.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:#334155;font-size:14px">No significant changes detected between the two versions.</div>`;
    return;
  }
  list.innerHTML = changes.map((c, i) => `
    <div class="change-card ${c.impact}" style="animation-delay:${i * 0.05}s">
      <div class="change-header">
        <span class="change-type-badge ${c.type}">${c.type}</span>
        <span class="change-impact-badge ${c.impact}">${c.impact}</span>
        <span class="change-title">${c.title}</span>
        <span class="change-severity">${c.severity} severity</span>
      </div>
      <div class="change-explanation">${c.explanation}</div>
      ${(c.old_text || c.new_text) ? `
        <div class="change-diff">
          <div class="diff-old"><div class="diff-label">Before</div>${c.old_text || '<em style="color:#334155">Not present in old version</em>'}</div>
          <div class="diff-new"><div class="diff-label">After</div>${c.new_text || '<em style="color:#334155">Removed in new version</em>'}</div>
        </div>` : ''}
    </div>`).join('');
}

document.getElementById('filter-btns').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => { b.style.background = 'transparent'; b.style.borderColor = '#334155'; });
  btn.style.background = '#1e293b';
  btn.style.borderColor = '#6366f1';
  const filter = btn.dataset.filter;
  const filtered = filter === 'all' ? allChanges : allChanges.filter(c => c.impact === filter);
  renderChanges(filtered);
});