// ─── CONFIG ───────────────────────────────────────────────
// IMPORTANT: Change this to your actual backend URL when deployed.
// For local development use: http://localhost:5000/api
const API = 'http://localhost:5000/api';

const LEGAL_PATTERNS = [
  'terms', 'privacy', 'policy', 'legal', 'agreement',
  'conditions', 'tos', 'eula', 'cookie', 'gdpr'
];

// In-memory cache: url -> scan result
const scannedTabs = new Map();

// ─── Install: show welcome page ───────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome/index.html')
    });
  }
});

// ─── Tab updates: auto-scan legal pages ───────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url) return;
  if (tab.url.startsWith('chrome://')) return;
  if (tab.url.startsWith('chrome-extension://')) return;

  const url = tab.url.toLowerCase();
  const isLegalPage = LEGAL_PATTERNS.some(p => url.includes(p));

  if (isLegalPage) {
    console.log('[LexiGuard] Legal page detected:', tab.url);
    setBadge(tabId, '...', '#6366f1');
    scanTab(tabId, tab.url);
  } else {
    // Restore badge if we have a cached result for this URL
    const cached = scannedTabs.get(tab.url);
    if (cached) {
      applyBadge(tabId, cached.trust_score);
      // Also restore it in storage for popup
      chrome.storage.local.set({
        [`scan_${tabId}`]: cached,
        [`url_${tabId}`]: tab.url
      });
    } else {
      clearBadge(tabId);
    }
  }
});

// ─── Tab switching: restore badge ─────────────────────────
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url) return;
    const cached = scannedTabs.get(tab.url);
    if (cached) applyBadge(activeInfo.tabId, cached.trust_score);
  } catch (e) {
    // Tab may have been closed
  }
});

// ─── Scan a tab ───────────────────────────────────────────
async function scanTab(tabId, url) {
  try {
    // Extract page text via scripting API
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Try to grab the main content area first
        const selectors = [
          '[class*="terms"]', '[class*="privacy"]', '[class*="policy"]',
          '[id*="terms"]', '[id*="privacy"]', '[id*="policy"]',
          'main', 'article', '.content', '#content'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.innerText && el.innerText.trim().length > 300) {
            return el.innerText.trim().substring(0, 6000);
          }
        }
        return document.body?.innerText?.trim().substring(0, 6000) || '';
      }
    });

    const text = results?.[0]?.result || '';

    if (!text || text.length < 100) {
      console.log('[LexiGuard] Not enough text on page');
      clearBadge(tabId);
      return;
    }

    // Call backend
    const res = await fetch(`${API}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, url })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[LexiGuard] Backend error:', res.status, errText);
      clearBadge(tabId);
      return;
    }

    const data = await res.json();

    // Cache result
    scannedTabs.set(url, data);

    // Update badge
    applyBadge(tabId, data.trust_score);

    // Show warning banner on page (only for risky pages)
    if (data.trust_score < 85) {
      chrome.tabs.sendMessage(tabId, {
        action: 'showWarning',
        trustScore: data.trust_score,
        highRisks: data.summary?.high_risks || 0,
        mainConcern: data.summary?.main_concern || ''
      }).catch(() => {}); // Content script may not be ready
    }

    // Highlight risky clauses
    if (data.clauses?.length > 0) {
      chrome.tabs.sendMessage(tabId, {
        action: 'highlightClauses',
        clauses: data.clauses
      }).catch(() => {});
    }

    // Store for popup to read
    await chrome.storage.local.set({
      [`scan_${tabId}`]: data,
      [`url_${tabId}`]: url
    });

    console.log('[LexiGuard] Auto-scan complete. Trust score:', data.trust_score);

  } catch (err) {
    console.error('[LexiGuard] Scan failed:', err.message);
    clearBadge(tabId);
  }
}

// ─── Badge helpers ─────────────────────────────────────────
function applyBadge(tabId, trustScore) {
  if (trustScore >= 85) {
    setBadge(tabId, '✓', '#22c55e');
  } else if (trustScore >= 60) {
    setBadge(tabId, String(trustScore), '#f59e0b');
  } else {
    setBadge(tabId, '!', '#ef4444');
  }
}

function setBadge(tabId, text, color) {
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
}

function clearBadge(tabId) {
  chrome.action.setBadgeText({ text: '', tabId });
}

// ─── Message listener (from popup + content) ───────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // Popup asks: do we have a result for this tab?
  if (request.action === 'getTabScan') {
    const tabId = request.tabId;
    chrome.storage.local.get([`scan_${tabId}`, `url_${tabId}`], (data) => {
      sendResponse({
        scan: data[`scan_${tabId}`] || null,
        url: data[`url_${tabId}`] || null
      });
    });
    return true; // keep channel open for async response
  }

  // Popup asks: scan this tab right now (manual scan or rescan)
  if (request.action === 'scanNow') {
    const { tabId, url } = request;

    // BUG FIX: Always do a fresh scan when popup explicitly requests it
    // (old code reused cache even after user clicked Rescan)
    setBadge(tabId, '...', '#6366f1');

    // Clear old result so popup poll doesn't pick up stale data
    chrome.storage.local.remove([`scan_${tabId}`, `url_${tabId}`], () => {
      scanTab(tabId, url);
    });

    sendResponse({ started: true });
    return true;
  }

  // Content script or popup asks to open dashboard
  if (request.action === 'openDashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
    sendResponse({ done: true });
    return true;
  }

  // Check if backend is reachable (used by popup to show friendly error)
  if (request.action === 'checkBackend') {
    fetch(`${API.replace('/api', '')}/`)
      .then(r => sendResponse({ ok: r.ok }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome/index.html')
    });
  }
});

  return false;
});
