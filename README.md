<div align="center">

<img src="extension/icons/icon48.png" alt="LexiGuard Logo" width="90" height="90">

# 🛡️ LexiGuard

### *You never read Terms & Conditions. Now you don't have to.*

AI-powered Chrome extension that automatically detects dark patterns, hidden subscriptions, and privacy violations — before you click **Agree**.

[![Landing Page](https://img.shields.io/badge/🌐%20Landing%20Page-trylexiguard.netlify.app-6366f1?style=for-the-badge)](https://trylexiguard.netlify.app)
[![Backend API](https://img.shields.io/badge/⚡%20Live%20API-Render-22c55e?style=for-the-badge)](https://lexiguard-backend.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Kshithesh--Sathri-181717?style=for-the-badge&logo=github)](https://github.com/Kshithesh-Sathri/lexiguard)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Groq](https://img.shields.io/badge/Groq%20AI-LLaMA%203.3%2070B-f97316?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase&logoColor=white)
![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)

</div>

---

## Demo

🌐 **Landing page:** [trylexiguard.netlify.app](https://trylexiguard.netlify.app)

🔗 **Live API:** [lexiguard-backend.onrender.com](https://lexiguard-backend.onrender.com)

---

## 🎯 The Problem

**91% of people accept Terms & Conditions without reading them.**

Companies exploit this with:
- 🔄 Auto-renewals buried in page 7
- 💸 Hidden charges revealed only at checkout
- 🔒 "Easy to join, impossible to cancel" traps
- 👁️ Data selling disguised in vague language
- 😈 Manipulative UI that tricks you into agreeing

**LexiGuard reads every word so you don't have to.**

---

## ✨ Features

### ⚡ Fully Automatic — Zero Clicks Required
The extension silently monitors every tab. The moment you land on a Terms, Privacy, or Policy page — it scans automatically. No button needed.

### 🎨 Instant Badge Warning
The extension icon changes color the moment a scan completes:

| Badge | Meaning |
|-------|---------|
| 🟢 **✓ Green** | Safe (85–100) |
| 🟡 **Score Yellow** | Moderate Risk (60–84) |
| 🔴 **! Red** | Dangerous (below 60) |

### 🧠 AI Dark Pattern Detection (10 Categories)
Powered by **LLaMA 3.3 70B** via Groq — the fastest LLM inference available:

| Dark Pattern | What It Means |
|---|---|
| 🔄 Auto Renewal | Charges you automatically without warning |
| 📦 Hidden Subscription | Free trial silently becomes paid |
| 🚪 Roach Motel | Easy to join, impossible to cancel |
| 💰 Hidden Costs | Fees only shown at the last step |
| 🔒 Forced Consent | Can't use the service without sharing data |
| 📤 Data Selling | Your data sold to third parties |
| 👁️ Privacy Abuse | Excessive tracking and data collection |
| 🤝 Third Party Sharing | Your info shared with unknown partners |
| ⏰ Scarcity Manipulation | Fake urgency ("Only 2 left!") |
| 😔 Confirmshaming | "No thanks, I hate saving money" |

### 📊 Trust Score System
Every document gets a **0–100 trust score** with consistent, deterministic results — same page always gets the same score.

```
🟢 85–100  →  Safe to use
🟡 60–84   →  Read carefully
🔴  0–59   →  High risk, proceed with caution
```

### 🌟 Legal Simplifier
Paste any clause and get a plain-English breakdown instantly.

> **Original:** *"User hereby grants an irrevocable, perpetual, royalty-free, worldwide license..."*
>
> **Simplified:** *"They can use your content forever, anywhere, for free — even after you delete your account."*

### 📄 PDF Contract Analyzer
Upload any document — rental agreements, job offers, freelance contracts — and scan for hidden risks in seconds.

### 📋 Full Scan History
Every scan is saved automatically to the database — both **auto-scans** from browsing and **manual scans** from the dashboard. View all previous scans with trust scores, risky clauses, and timestamps.

### ⚖️ Document Comparison
Paste old and new versions of a Terms of Service side-by-side and see exactly what changed — and whether it got better or worse.

### 🖥️ Full Dashboard
A complete web dashboard inside the extension with:
- **Scanner** — paste any URL or text
- **PDF Analyzer** — upload contracts
- **History** — all previous scans
- **Legal Simplifier** — decode any clause
- **Compare** — diff two policy versions

---

## 🏗️ Architecture

```
User visits Terms/Privacy page
          │
          ▼
Background Service Worker (auto-detects legal pages)
          │
          ▼
Content Script (extracts page text via smart DOM selectors)
          │
          ▼
Node.js + Express REST API (localhost:5000 / Render.com)
          │
          ▼
Groq API → LLaMA 3.3 70B (structured JSON analysis)
          │
    ┌─────┴──────┐
    ▼            ▼
Supabase DB   Extension UI
(history)   (badge + popup + dashboard)
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Chrome Extension | Manifest V3 | Auto-scan, badge, highlights, popup |
| Content Script | Vanilla JS | DOM scraping, text highlighting, warning banners |
| Background Worker | Service Worker | Tab monitoring, auto-detect legal pages |
| REST API | Node.js + Express | Handle requests, fallback models |
| AI Engine | Groq — LLaMA 3.3 70B | Detect dark patterns, deterministic output |
| Database | PostgreSQL via Supabase | Scan history (auto + manual) |
| PDF Parsing | pdf-parse | Extract text from uploaded contracts |
| Deployment | Render + Netlify | Host backend + landing page |

---

## 🚀 Local Setup

### Prerequisites
- Node.js v20+
- [Groq API key](https://console.groq.com) — free
- [Supabase](https://supabase.com) project — free

### 1. Clone

```bash
git clone https://github.com/Kshithesh-Sathri/lexiguard.git
cd lexiguard
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
GROQ_API_KEY=gsk_your_groq_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...your_supabase_anon_key
JWT_SECRET=any_strong_random_string
NODE_ENV=development
```

Start:
```bash
npm start
# ✅ LexiGuard backend running on http://localhost:5000
```

### 3. Database

Run this in your Supabase SQL Editor:

```sql
CREATE TABLE scans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text,
  domain text,
  trust_score integer,
  user_id text,
  scanned_at timestamptz DEFAULT now()
);

CREATE TABLE clauses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id uuid REFERENCES scans(id) ON DELETE CASCADE,
  text text,
  simplified text,
  risk_level text,
  pattern_type text
);
```

### 4. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Pin LexiGuard to your toolbar

### 5. Test It

Visit any Terms or Privacy page (e.g. spotify.com/legal) and watch the badge appear automatically.

---

## 📡 API Reference

**Base URL:** `http://localhost:5000` (dev) · `https://lexiguard-backend.onrender.com` (prod)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/analyze` | Analyze text for dark patterns |
| `POST` | `/api/analyze-pdf` | Upload and analyze a PDF |
| `POST` | `/api/simplify` | Simplify a legal clause |
| `POST` | `/api/compare` | Compare two document versions |
| `GET` | `/api/history` | Get scan history |

### Example

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "We automatically renew your subscription monthly. Cancellation requires 30 days written notice.",
    "url": "https://example.com/terms"
  }'
```

```json
{
  "trust_score": 42,
  "clauses": [
    {
      "text": "automatically renew your subscription monthly",
      "pattern_type": "Auto Renewal",
      "risk_level": "High",
      "simplified": "You will be charged every month without a reminder.",
      "consequence": "You could be billed for months before you notice."
    },
    {
      "text": "30 days written notice to cancel",
      "pattern_type": "Roach Motel",
      "risk_level": "High",
      "simplified": "Cancelling is deliberately made hard and slow.",
      "consequence": "You will be charged at least one extra month after deciding to cancel."
    }
  ],
  "summary": {
    "high_risks": 2,
    "medium_risks": 0,
    "low_risks": 0,
    "subscription_traps": 1,
    "privacy_concerns": 0,
    "main_concern": "This document contains auto-renewal and difficult cancellation traps."
  }
}
```


---

## 📁 Project Structure

```
lexiguard/
├── extension/                  ← Chrome Extension (load this folder)
│   ├── manifest.json           ← Extension config (Manifest V3)
│   ├── background/
│   │   └── background.js       ← Auto-scan + tab monitoring + badge
│   ├── content/
│   │   └── content.js          ← Page highlighting + warning banners
│   ├── popup/
│   │   ├── index.html          ← Popup UI
│   │   └── popup.js            ← Popup logic + scan polling
│   ├── dashboard/
│   │   ├── index.html          ← Full dashboard
│   │   ├── dashboard.js        ← Dashboard logic
│   │   └── dashboard.css       ← Dashboard styles
│   ├── welcome/
│   │   └── index.html          ← First-install onboarding page
│   └── icons/
│       └── icon48.png
│
└── backend/                    ← Node.js REST API
    ├── .env                    ← API keys (never commit this)
    ├── package.json
    └── src/
        ├── server.js           ← Express server
        ├── services/
        │   └── geminiService.js  ← Groq AI (LLaMA 3.3 70B)
        ├── controllers/
        │   └── analyzeController.js  ← All route handlers
        ├── routes/
        │   ├── analyze.js      ← API routes
        │   └── auth.js         ← Auth routes
        ├── middleware/
        │   ├── auth.js         ← JWT verification
        │   └── rateLimiter.js  ← In-memory rate limiting
        └── config/
            └── supabase.js     ← DB client
```

---
## How It Works

1. **Detection** — Background service worker monitors every tab. When a URL contains `terms`, `privacy`, `policy`, or `legal`, it triggers an auto-scan.

2. **Extraction** — Content script extracts the page text using smart DOM selectors targeting legal content containers.

3. **AI Analysis** — Text is sent to the Groq API with a carefully engineered prompt. LLaMA 3.3 70B returns a structured JSON response with all risky clauses identified.

4. **Display** — The extension icon badge changes color, a warning banner slides up on the page, and risky text is highlighted directly on the webpage.

5. **Storage** — All scans are saved to PostgreSQL via Supabase for history and analytics.

---

## What I Learned Building This

- Chrome Extension Manifest V3 architecture (service workers, content scripts, messaging)
- Building and deploying a REST API with Node.js and Express
- Integrating LLM APIs with structured JSON output and prompt engineering
- PostgreSQL schema design and Supabase integration
- Real-world deployment with Render and Netlify
- DOM manipulation and text highlighting in content scripts
- User authentication (JWT)

---

## Future Plans

- [ ] Publish to Chrome Web Store
- [ ] Multi-language support (Telugu, Hindi, Tamil)
- [ ] Community trust scores — *"1,200 users scanned this site"*
- [ ] Shareable scan report links
- [ ] Firefox extension support
- [ ] Real-time alerts before checkout pages
- [ ] GDPR / Consumer law compliance checker

---

## License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ by [Kshithesh Sathri](https://github.com/Kshithesh-Sathri)

**Stack:** Node.js · Express · React · PostgreSQL · Groq AI · Chrome Extension


*Protecting consumers, one Terms & Conditions at a time.*

</div>
