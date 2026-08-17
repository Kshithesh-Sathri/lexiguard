const API = 'https://lexiguard-backend.onrender.com/api';

function color(s) {
  return s >= 85 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444';
}

function label(s) {
  return s >= 85 ? 'Safe to use' : s >= 60 ? 'Moderate Risk' : 'High Risk';
}

function showLoading(message) {
  document.getElementById('root').innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <div class="loading-text">${message || 'Scanning page...'}</div>
    </div>`;
}

function showHome() {
  document.getElementById('root').innerHTML = `
    <div class="body">
      <p style="color:#94a3b8;font-size:12px;margin-bottom:14px;line-height:1.6">
        Click below to scan this page for dark patterns and hidden risks.
      </p>
      <button class="scan-btn" id="scan-btn">🔍 Analyze This Page</button>
    </div>`;
  document.getElementById('scan-btn').addEventListener('click', scanPage);
}

function showError(msg) {
  document.getElementById('root').innerHTML = `
    <div class="body">
      <div class="error-box"><strong>Error</strong><br>${msg}</div>
      <button class="scan-btn" id="scan-btn">Try Again</button>
    </div>`;
  document.getElementById('scan-btn').addEventListener('click', scanPage);
}

function showResult(data, isAuto) {
  const s = data.trust_score || 0;
  const c = color(s);
  const clauses = data.clauses || [];
  const summary = data.summary || {};

  const clausesHTML = clauses.slice(0, 3).map(cl => `
    <div class="clause ${cl.risk_level}">
      <div class="clause-type">${cl.risk_level} · ${cl.pattern_type}</div>
      <div class="clause-text">${cl.simplified}</div>
    </div>`).join('');

  document.getElementById('root').innerHTML = `
    <div class="body">
      ${isAuto ? `
        <div style="font-size:10px;color:#475569;text-align:right;
          margin-bottom:8px">⚡ Auto-scanned</div>` : ''}

      <div class="score-box">
        <div class="score-num" style="color:${c}">${s}</div>
        <div class="score-lbl">Trust Score / 100</div>
        <div class="score-status" style="color:${c}">${label(s)}</div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-num" style="color:#ef4444">
            ${summary.high_risks ?? 0}
          </div>
          <div class="stat-lbl">High</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="color:#f59e0b">
            ${summary.medium_risks ?? 0}
          </div>
          <div class="stat-lbl">Medium</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="color:#a78bfa">
            ${summary.privacy_concerns ?? 0}
          </div>
          <div class="stat-lbl">Privacy</div>
        </div>
      </div>

      ${summary.main_concern ? `
        <div class="concern">💡 ${summary.main_concern}</div>` : ''}

      <button class="open-btn" id="open-btn">
        📊 Open Full Dashboard
      </button>

      ${clauses.length > 0 ? `
        <div class="clauses-label">
          Top risks (${clauses.length} total)
        </div>
        <div class="scroll">${clausesHTML}</div>` : ''}

      ${clauses.length > 3 ? `
        <div style="color:#475569;font-size:10px;text-align:center;padding:4px">
          +${clauses.length - 3} more in full dashboard
        </div>` : ''}

      <button class="rescan-btn" id="rescan-btn" style="margin-top:8px">
        🔄 Rescan
      </button>
    </div>`;

  document.getElementById('open-btn').addEventListener('click', openDashboard);
  document.getElementById('rescan-btn').addEventListener('click', scanPage);
}

async function openDashboard() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const data = await getTabScan(tab.id);

  await chrome.storage.local.set({
    lastScan: data?.scan || null,
    lastUrl: tab.url
  });

  chrome.tabs.create({
    url: chrome.runtime.getURL('dashboard/index.html')
  });
}

async function getTabScan(tabId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'getTabScan', tabId },
      (response) => resolve(response)
    );
  });
}

async function scanPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) { showError('Cannot access tab.'); return; }
  if (tab.url.startsWith('chrome://')) {
    showError('Cannot scan Chrome pages.');
    return;
  }

  showLoading('Analyzing page...');

  // Clear the old cached scan for this tab so rescan always fetches fresh
  await chrome.storage.local.remove([`scan_${tab.id}`, `url_${tab.id}`]);

  // Tell background to scan
  chrome.runtime.sendMessage({
    action: 'scanNow',
    tabId: tab.id,
    url: tab.url
  });

  // Poll for result (store on window so it can be cleared)
  let attempts = 0;
  window._lexiPoll = setInterval(async () => {
    attempts++;
    const data = await getTabScan(tab.id);

    if (data?.scan) {
      clearInterval(window._lexiPoll);
      showResult(data.scan, false);

      // Highlight on page
      if (data.scan.clauses?.length > 0) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'highlightClauses',
          clauses: data.scan.clauses
        });
      }
    }

    if (attempts > 30) {
      clearInterval(window._lexiPoll);
      showError('Scan timed out. Try again.');
    }
  }, 1000);
}

// Clear poll on popup close
window.addEventListener('unload', () => { if (window._lexiPoll) clearInterval(window._lexiPoll); });

// ─── On popup open ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { showHome(); return; }

  // Check if we already have a scan for this tab
  const data = await getTabScan(tab.id);

  if (data?.scan) {
    // Show cached result instantly
    showResult(data.scan, true);
  } else {
    // No scan yet — show home
    showHome();
  }
});