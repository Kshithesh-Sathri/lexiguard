// ─── Warning Banner ───────────────────────────────────────
let warningBanner = null;

function showWarningBanner(trustScore, highRisks, mainConcern) {
  // Remove existing banner
  removeWarningBanner();

  const color = trustScore >= 85 ? '#22c55e'
    : trustScore >= 60 ? '#f59e0b' : '#ef4444';

  const bgColor = trustScore >= 85 ? 'rgba(34,197,94,0.95)'
    : trustScore >= 60 ? 'rgba(245,158,11,0.95)'
    : 'rgba(239,68,68,0.95)';

  const icon = trustScore >= 85 ? '✅' : trustScore >= 60 ? '⚠️' : '🚨';
  const title = trustScore >= 85 ? 'This page looks safe'
    : trustScore >= 60 ? 'Moderate risks found'
    : 'High risk page detected!';

  // Only show banner for moderate and high risk
  if (trustScore >= 85) return;

  warningBanner = document.createElement('div');
  warningBanner.id = 'lexiguard-banner';
  warningBanner.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    background: #0f172a;
    border: 1px solid ${color};
    border-radius: 16px;
    padding: 16px 20px;
    max-width: 340px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}33;
    font-family: system-ui, -apple-system, sans-serif;
    animation: lexiguardSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
  `;

  warningBanner.innerHTML = `
    <style>
      @keyframes lexiguardSlideIn {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes lexiguardSlideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100px); opacity: 0; }
      }
      #lexiguard-banner:hover {
        transform: translateY(-2px);
        transition: transform 0.2s ease;
      }
    </style>

    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="font-size:28px;line-height:1;flex-shrink:0">${icon}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;
          margin-bottom:4px">
          <div style="font-size:14px;font-weight:700;color:#f1f5f9">
            ${title}
          </div>
          <button id="lexiguard-close" style="
            background:transparent;border:none;color:#475569;
            font-size:18px;cursor:pointer;padding:0 0 0 8px;line-height:1;
          ">✕</button>
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:10px;
          line-height:1.5">
          ${mainConcern || `${highRisks} high risk clause${highRisks !== 1 ? 's' : ''} found`}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="
              background:${color}22;
              color:${color};
              font-size:11px;
              font-weight:700;
              padding:3px 10px;
              border-radius:20px;
              border:1px solid ${color}44;
            ">Trust Score: ${trustScore}/100</div>
          </div>
          <button id="lexiguard-details" style="
            background:${color};
            color:white;
            border:none;
            border-radius:8px;
            padding:5px 12px;
            font-size:12px;
            font-weight:600;
            cursor:pointer;
          ">View Details</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(warningBanner);

  // Close button
  document.getElementById('lexiguard-close').addEventListener('click', (e) => {
    e.stopPropagation();
    removeWarningBanner();
  });

  // View details button — open dashboard tab
  document.getElementById('lexiguard-details').addEventListener('click', (e) => {
    e.stopPropagation();
    // Open the full dashboard instead (openPopup needs user gesture in MV3)
    chrome.runtime.sendMessage({ action: 'openDashboard' });
    removeWarningBanner();
  });

  // Auto dismiss after 8 seconds for moderate risk
  // Keep for high risk until user dismisses
  if (trustScore >= 60) {
    setTimeout(() => {
      removeWarningBanner();
    }, 8000);
  }
}

function removeWarningBanner() {
  const existing = document.getElementById('lexiguard-banner');
  if (existing) {
    existing.style.animation = 'lexiguardSlideOut 0.3s ease forwards';
    setTimeout(() => existing.remove(), 300);
  }
}

// ─── Text Highlighting ────────────────────────────────────
function findAndHighlight(searchText, riskLevel, simplified) {
  const colors = {
    High: 'rgba(239,68,68,0.3)',
    Medium: 'rgba(245,158,11,0.3)',
    Low: 'rgba(59,130,246,0.2)'
  };
  const borders = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#3b82f6'
  };

  const clean = searchText
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean || clean.length < 8) return false;

  const words = clean.split(' ');
  const attempts = [];
  if (words.length >= 6) attempts.push(words.slice(0, 6).join(' '));
  if (words.length >= 4) attempts.push(words.slice(0, 4).join(' '));
  if (words.length >= 3) attempts.push(words.slice(0, 3).join(' '));
  attempts.push(clean.substring(0, 40));
  attempts.push(clean.substring(0, 25));

  for (const attempt of attempts) {
    if (!attempt || attempt.length < 8) continue;
    const found = searchInPage(attempt, riskLevel, simplified, colors, borders);
    if (found) return true;
  }
  return false;
}

function searchInPage(searchText, riskLevel, simplified, colors, borders) {
  const allElements = document.querySelectorAll(
    'p, li, span, div, td, h1, h2, h3, h4, section, article'
  );
  const lowerSearch = searchText.toLowerCase().trim();

  for (const el of allElements) {
    if (el.classList.contains('lexiguard-highlight')) continue;
    if (el.children.length > 5) continue;
    if (!el.textContent) continue;

    const lowerText = el.textContent.toLowerCase().trim();
    if (lowerText.includes(lowerSearch)) {
      if (el.textContent.length > 1000) continue;
      applyHighlight(el, riskLevel, simplified, colors, borders);
      return true;
    }
  }
  return false;
}

function applyHighlight(el, riskLevel, simplified, colors, borders) {
  el.style.backgroundColor = colors[riskLevel];
  el.style.borderLeft = `3px solid ${borders[riskLevel]}`;
  el.style.borderRadius = '3px';
  el.style.padding = '2px 6px';
  el.style.cursor = 'pointer';
  el.classList.add('lexiguard-highlight');
  el.setAttribute('data-lexiguard-risk', riskLevel);
  el.setAttribute('data-lexiguard-text', simplified);
  el.addEventListener('mouseenter', handleMouseEnter);
  el.addEventListener('mouseleave', handleMouseLeave);
}

// ─── Tooltip ──────────────────────────────────────────────
let tooltipEl = null;

function handleMouseEnter(e) {
  const el = e.currentTarget;
  showTooltip(el,
    el.getAttribute('data-lexiguard-risk'),
    el.getAttribute('data-lexiguard-text')
  );
}

function handleMouseLeave() { hideTooltip(); }

function showTooltip(element, riskLevel, simplified) {
  hideTooltip();

  const colors = { High: '#ef4444', Medium: '#f59e0b', Low: '#3b82f6' };
  const riskIcon = riskLevel === 'High' ? '🔴'
    : riskLevel === 'Medium' ? '🟡' : '🔵';

  tooltipEl = document.createElement('div');
  tooltipEl.style.cssText = `
    position: absolute;
    background: #0f172a;
    border: 1px solid ${colors[riskLevel] || '#6366f1'};
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 13px;
    color: #f1f5f9;
    z-index: 2147483647;
    max-width: 300px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    pointer-events: none;
    font-family: system-ui, sans-serif;
    line-height: 1.5;
  `;

  tooltipEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
      <span>${riskIcon}</span>
      <span style="color:${colors[riskLevel]};font-weight:700;
        font-size:11px;text-transform:uppercase">
        ${riskLevel} Risk
      </span>
      <span style="color:#475569;font-size:10px;margin-left:auto">
        LexiGuard
      </span>
    </div>
    <div style="color:#cbd5e1;font-size:12px">
      ${simplified || 'Risky clause detected'}
    </div>`;

  document.body.appendChild(tooltipEl);

  const rect = element.getBoundingClientRect();
  let top = rect.bottom + window.scrollY + 8;
  let left = rect.left + window.scrollX;

  if (left + 310 > window.innerWidth) left = window.innerWidth - 320;
  if (rect.bottom + 120 > window.innerHeight) {
    top = rect.top + window.scrollY - 110;
  }

  tooltipEl.style.top = top + 'px';
  tooltipEl.style.left = left + 'px';
}

function hideTooltip() {
  if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
}

// ─── Remove highlights ─────────────────────────────────────
function removeHighlights() {
  document.querySelectorAll('.lexiguard-highlight').forEach(el => {
    el.style.backgroundColor = '';
    el.style.borderLeft = '';
    el.style.borderRadius = '';
    el.style.padding = '';
    el.style.cursor = '';
    el.classList.remove('lexiguard-highlight');
    el.removeAttribute('data-lexiguard-risk');
    el.removeAttribute('data-lexiguard-text');
    el.removeEventListener('mouseenter', handleMouseEnter);
    el.removeEventListener('mouseleave', handleMouseLeave);
  });
}

// ─── Message listener ──────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'highlightClauses') {
    removeHighlights();
    let highlighted = 0;
    request.clauses.forEach(clause => {
      if (clause.text && clause.text.length > 5) {
        const found = findAndHighlight(
          clause.text,
          clause.risk_level,
          clause.simplified
        );
        if (found) highlighted++;
      }
    });
    console.log(`LexiGuard: ${highlighted}/${request.clauses.length} highlighted`);
    sendResponse({ done: true, highlighted });
  }

  if (request.action === 'showWarning') {
    showWarningBanner(
      request.trustScore,
      request.highRisks,
      request.mainConcern
    );
    sendResponse({ done: true });
  }

  if (request.action === 'removeHighlights') {
    removeHighlights();
    sendResponse({ done: true });
  }

  return true;
});