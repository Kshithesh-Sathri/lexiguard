import Groq from 'groq-sdk';
import { createRequire } from 'module';
import { analyzeDocument } from '../services/geminiService.js';
import supabase from '../config/supabase.js';

const MODELS = [
  'openai/gpt-oss-120b',   // primary — replacement for llama-3.3-70b-versatile
  'openai/gpt-oss-20b',    // fast fallback — replacement for llama-3.1-8b-instant
  'qwen/qwen3.6-27b'       // secondary fallback
];

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse = pdfParseModule.default || pdfParseModule;

// ─── Shared DB save helper ────────────────────────────────
async function saveScanToDB(url, analysis, userId = null) {
  const domain = (() => {
    try { return new URL(url || '').hostname || 'manual'; }
    catch { return url?.startsWith('pdf://') ? 'PDF Upload' : 'manual'; }
  })();

  console.log('[DB] Saving scan...', { url: url?.substring(0, 60), domain, trust_score: analysis.trust_score });

  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .insert({
      url: url || 'manual',
      domain,
      trust_score: analysis.trust_score,
      user_id: userId || null
    })
    .select()
    .single();

  console.log('[DB] Insert result:', scanError ? `ERROR: ${scanError.message}` : `OK id=${scan?.id}`);

  if (scanError || !scan) return null;

  if (analysis.clauses?.length > 0) {
    const clauseRows = analysis.clauses.map(c => ({
      scan_id: scan.id,
      text: c.text,
      simplified: c.simplified,
      risk_level: c.risk_level,
      pattern_type: c.pattern_type
    }));
    const { error: clauseError } = await supabase.from('clauses').insert(clauseRows);
    if (clauseError) console.log('[DB] Clauses error:', clauseError.message);
    else console.log('[DB] Clauses saved:', clauseRows.length);
  }

  return scan.id;
}

// ─── Analyze Text ─────────────────────────────────────────
export async function analyzeText(req, res) {
  try {
    const { text, url } = req.body;
    const userId = req.userId || null;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Text too short to analyze (minimum 50 characters)' });
    }

    const analysis = await analyzeDocument(text);

    let scanId = null;
    try {
      scanId = await saveScanToDB(url, analysis, userId);
    } catch (dbErr) {
      console.log('[DB] Save exception:', dbErr.message);
    }

    return res.json({ ...analysis, scan_id: scanId });

  } catch (error) {
    console.error('Analysis error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

// ─── Get History ──────────────────────────────────────────
// FIX: Show ALL scans for logged-in user — both their own (user_id match)
// AND auto-scans (user_id is null) so popup scans appear in history
export async function getHistory(req, res) {
  try {
    const userId = req.userId;
    console.log('[DB] Loading history for userId:', userId || 'guest');

    let scans = [];

    if (userId) {
      // Get scans belonging to this user
      const { data: userScans, error: e1 } = await supabase
        .from('scans')
        .select(`id, url, domain, trust_score, scanned_at,
          clauses (id, text, simplified, risk_level, pattern_type)`)
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false })
        .limit(25);

      if (e1) throw e1;

      // Also get auto-scans (user_id is null) — these come from the extension popup
      const { data: autoScans, error: e2 } = await supabase
        .from('scans')
        .select(`id, url, domain, trust_score, scanned_at,
          clauses (id, text, simplified, risk_level, pattern_type)`)
        .is('user_id', null)
        .order('scanned_at', { ascending: false })
        .limit(25);

      if (e2) throw e2;

      // Merge and sort by date, remove duplicates by URL keeping latest
      const all = [...(userScans || []), ...(autoScans || [])];
      const seen = new Set();
      scans = all
        .sort((a, b) => new Date(b.scanned_at) - new Date(a.scanned_at))
        .filter(s => {
          if (seen.has(s.url)) return false;
          seen.add(s.url);
          return true;
        })
        .slice(0, 50);

    } else {
      const { data, error } = await supabase
        .from('scans')
        .select(`id, url, domain, trust_score, scanned_at,
          clauses (id, text, simplified, risk_level, pattern_type)`)
        .is('user_id', null)
        .order('scanned_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      scans = data || [];
    }

    console.log('[DB] History result:', scans.length, 'scans');
    return res.json({ scans });

  } catch (error) {
    console.error('History error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

// ─── Simplify Clause ──────────────────────────────────────
export async function simplifyClause(req, res) {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: 'Text too short (minimum 10 characters)' });
    }

    let lastError = null;
    for (const model of MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a legal document simplifier. Return ONLY valid JSON. No markdown, no backticks.'
            },
            {
              role: 'user',
              content: `Analyze this legal clause and return this exact JSON:
{
  "simplified": "<explain in plain English, 1-2 sentences>",
  "risk_level": "<High | Medium | Low>",
  "consequence": "<what this means for the user, 1 sentence>",
  "recommendation": "<what the user should do, 1 sentence>"
}

Clause: ${text}`
            }
          ],
          temperature: 0,
          seed: 42,
          max_tokens: 500
        });

        const output = completion.choices[0].message.content.trim()
          .replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON in response');
        return res.json(JSON.parse(output.substring(jsonStart, jsonEnd + 1)));

      } catch (err) {
        if (err.message.includes('429') || err.message.includes('rate_limit') || err.message.includes('decommissioned')) {
          lastError = err; continue;
        }
        throw err;
      }
    }
    throw lastError || new Error('All models unavailable.');

  } catch (error) {
    console.error('Simplify error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

// ─── Analyze PDF ──────────────────────────────────────────
export async function analyzePDF(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });

    let text = '', pages = 1;
    try {
      const pdfData = await pdfParse(req.file.buffer);
      text = pdfData.text?.trim() || '';
      pages = pdfData.numpages || 1;
    } catch (parseErr) {
      return res.status(400).json({ error: 'PDF parse failed: ' + parseErr.message });
    }

    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Could not extract text. PDF may be image-based.' });
    }

    console.log(`[PDF] Extracted ${text.split(' ').length} words from ${pages} pages`);

    const analysis = await analyzeDocument(text);
    let scanId = null;
    try {
      scanId = await saveScanToDB(`pdf://${req.file.originalname}`, analysis, req.userId || null);
    } catch (dbErr) {
      console.log('[DB] PDF save exception:', dbErr.message);
    }

    return res.json({ ...analysis, scan_id: scanId, filename: req.file.originalname, pages, word_count: text.split(' ').length });

  } catch (error) {
    console.error('PDF error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

// ─── Compare Documents ────────────────────────────────────
export async function compareDocuments(req, res) {
  try {
    const { oldText, newText, siteName } = req.body;

    if (!oldText || !newText) return res.status(400).json({ error: 'Both old and new text required' });
    if (oldText.trim().length < 50 || newText.trim().length < 50) {
      return res.status(400).json({ error: 'Both texts must be at least 50 characters' });
    }

    const cleanOld = oldText.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 4000);
    const cleanNew = newText.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 4000);

    let lastError = null;
    for (const model of MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a legal document comparison expert. Return ONLY valid JSON. No markdown. No backticks.'
            },
            {
              role: 'user',
              content: `Compare these two legal document versions and return ONLY this JSON:
{
  "verdict": "<Better | Worse | Same | Mixed>",
  "verdict_reason": "<one sentence>",
  "old_score": <0-100>,
  "new_score": <0-100>,
  "score_change": <integer>,
  "changes": [
    {
      "type": "<Added | Removed | Modified>",
      "impact": "<Positive | Negative | Neutral>",
      "title": "<short title>",
      "old_text": "<max 100 chars or empty>",
      "new_text": "<max 100 chars or empty>",
      "explanation": "<plain English>",
      "severity": "<High | Medium | Low>"
    }
  ],
  "summary": {
    "total_changes": <count>,
    "negative_changes": <count>,
    "positive_changes": <count>,
    "neutral_changes": <count>,
    "biggest_concern": "<one sentence>"
  }
}

OLD VERSION:
${cleanOld}

NEW VERSION:
${cleanNew}`
            }
          ],
          temperature: 0,
          seed: 42,
          max_tokens: 2000
        });

        let output = completion.choices[0].message.content.trim()
          .replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON found');

        const parsed = JSON.parse(output.substring(jsonStart, jsonEnd + 1));
        if (!Array.isArray(parsed.changes)) parsed.changes = [];
        if (!parsed.summary) parsed.summary = { total_changes: 0, negative_changes: 0, positive_changes: 0, neutral_changes: 0, biggest_concern: 'No significant changes.' };
        if (parsed.old_score === undefined) parsed.old_score = 70;
        if (parsed.new_score === undefined) parsed.new_score = 70;
        if (parsed.score_change === undefined) parsed.score_change = parsed.new_score - parsed.old_score;

        return res.json({ ...parsed, site_name: siteName || 'Document' });

      } catch (error) {
        if (error.message.includes('429') || error.message.includes('rate_limit') || error.message.includes('decommissioned')) {
          lastError = error; continue;
        }
        throw error;
      }
    }
    throw lastError || new Error('All models unavailable.');

  } catch (error) {
    console.error('Compare error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
