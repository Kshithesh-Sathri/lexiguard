<div align="center">

<img src="extension/icons/icon48.png" alt="LexiGuard Logo" width="80" height="80">

# LexiGuard

### AI-powered legal document analyzer that protects you from dark patterns

[![Live Demo](https://img.shields.io/badge/Landing%20Page-trylexiguard.netlify.app-6366f1?style=for-the-badge&logo=netlify)](https://trylexiguard.netlify.app)
[![Backend](https://img.shields.io/badge/API-Render-22c55e?style=for-the-badge&logo=render)](https://lexiguard-backend.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Kshithesh--Sathri-181717?style=for-the-badge&logo=github)](https://github.com/Kshithesh-Sathri/lexiguard)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)

</div>

---

## What is LexiGuard?

LexiGuard is a Chrome extension that automatically scans Terms & Conditions and Privacy Policies using AI to detect **dark patterns**, hidden subscriptions, and privacy violations — before you click agree.

Most people never read Terms & Conditions. Companies exploit this with hidden auto-renewals, data selling clauses, and impossible cancellation policies. LexiGuard reads them for you and warns you instantly.

---

## Demo

🌐 **Landing page:** [trylexiguard.netlify.app](https://trylexiguard.netlify.app)

🔗 **Live API:** [lexiguard-backend.onrender.com](https://lexiguard-backend.onrender.com)

---

## Features

### 🔴 Auto Badge Warning
The extension icon automatically turns **red**, **yellow**, or **green** on any Terms or Privacy page — without you clicking anything.

### 🧠 AI Dark Pattern Detection
LLaMA AI reads the entire document and identifies:
- Hidden Subscription traps
- Data Selling clauses
- Roach Motel (easy join, hard cancel)
- Hidden Costs
- Forced Consent
- Privacy Abuse
- Third Party Sharing
- Auto Renewal
- Confirmshaming
- Scarcity Manipulation

### 📊 Trust Score System
Every document gets a **0-100 trust score** — instantly know if a site is safe or dangerous.

| Score | Meaning |
|-------|---------|
| 85-100 | ✅ Safe |
| 60-84 | ⚠️ Moderate Risk |
| 0-59 | 🚨 High Risk |

### ⚠️ Instant Page Warning
A warning banner slides up automatically on risky pages — no clicking required.

### ✨ Legal Simplifier
Converts legal jargon into plain English.
> "User hereby grants irrevocable perpetual license..." → **"They can use your content forever."**

### 📄 PDF Contract Analyzer
Upload any PDF — rental agreements, job offers, freelance contracts — and scan for hidden risks.

### 📋 Scan History
Every scan is saved to the database. View all previous scans with trust scores and risky clauses.

### 🖥️ Full Dashboard
Complete web dashboard accessible from the extension with Scanner, History, PDF Analyzer, and Legal Simplifier pages.

## Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| Chrome Extension | Manifest V3 | UI, auto-scan, badge, highlights |
| Content Script | Vanilla JS | DOM scraping, text highlighting |
| Background Worker | Service Worker | Auto-detect legal pages |
| REST API | Node.js + Express | Handle requests, call AI |
| AI Engine | Groq LLaMA 3.3 70B | Detect dark patterns |
| Database | PostgreSQL (Supabase) | Store scan history |
| Cache | Redis | Cache repeated scans |
| Deployment | Render + Netlify | Host backend + landing page |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Chrome Extension | Manifest V3, Vanilla JS |
| Frontend Dashboard | React, Tailwind CSS, Vite |
| Backend API | Node.js, Express.js |
| AI Engine | Groq API (LLaMA 3.3 70B, Gemma2, Mixtral) |
| Database | PostgreSQL via Supabase |
| Caching | Redis (ioredis) |
| PDF Parsing | pdf-parse |
| Deployment | Render (backend), Netlify (landing page) |

---

## Project Structure

| Folder | Description |
|--------|-------------|
| `backend/` | Node.js + Express REST API |
| `backend/src/controllers/` | Request handlers for each route |
| `backend/src/services/` | Groq AI integration |
| `backend/src/config/` | Supabase + Redis configuration |
| `extension/` | Chrome Extension (Manifest V3) |
| `extension/popup/` | Extension popup UI |
| `extension/dashboard/` | Full dashboard (HTML/CSS/JS) |
| `extension/content/` | Content script for highlighting |
| `extension/background/` | Service worker for auto-scan |
| `extension/welcome/` | Onboarding page on first install |
| `frontend/` | React web dashboard (development) |
| `landing/` | Landing page deployed on Netlify |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Analyze text for dark patterns |
| POST | `/api/analyze-pdf` | Upload and analyze PDF |
| POST | `/api/simplify` | Simplify a legal clause |
| GET | `/api/history` | Get scan history |
| GET | `/api/health` | Health check |

### Example Request

```bash
curl -X POST https://lexiguard-backend.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "We automatically renew your subscription every month. You cannot cancel online.",
    "url": "https://example.com"
  }'
```

### Example Response

```json
{
  "trust_score": 25,
  "clauses": [
    {
      "text": "automatically renew your subscription every month",
      "pattern_type": "Auto Renewal",
      "risk_level": "High",
      "simplified": "Your subscription renews automatically without asking you.",
      "consequence": "You will be charged every month without a reminder."
    }
  ],
  "summary": {
    "high_risks": 2,
    "medium_risks": 1,
    "low_risks": 0,
    "subscription_traps": 1,
    "privacy_concerns": 0,
    "main_concern": "This document contains auto-renewal and cancellation traps."
  }
}
```

---

## Local Setup

### Prerequisites
- Node.js v20+
- A [Groq API key](https://console.groq.com) (free)
- A [Supabase](https://supabase.com) project (free)

### 1. Clone the repository

```bash
git clone https://github.com/Kshithesh-Sathri/lexiguard.git
cd lexiguard
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the database

Run this SQL in your Supabase SQL editor:

```sql
create table scans (
  id uuid default gen_random_uuid() primary key,
  url text,
  domain text,
  trust_score integer,
  scanned_at timestamptz default now()
);

create table clauses (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid references scans(id),
  text text,
  simplified text,
  risk_level text,
  pattern_type text
);
```

### 4. Load the Chrome extension

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Pin LexiGuard to your toolbar

### 5. Test the extension

Visit any Terms or Privacy page (e.g. `spotify.com/legal`) and watch the badge appear automatically.

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
- Redis caching for API optimization

---

## Future Plans

- [ ] Publish to Chrome Web Store
- [ ] User authentication (JWT)
- [ ] Community trust scores ("312 users scanned this site")
- [ ] Share report as public link
- [ ] Multi-language support (Telugu, Hindi, Tamil)
- [ ] Compare old vs new Terms of Service
- [ ] Firefox extension support

---

## License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ by [Kshithesh Sathri](https://github.com/Kshithesh-Sathri)

**Stack:** Node.js · Express · React · PostgreSQL · Groq AI · Chrome Extension

</div>