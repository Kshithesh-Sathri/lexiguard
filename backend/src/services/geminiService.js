import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = [
  'openai/gpt-oss-120b',   // primary — replacement for llama-3.3-70b-versatile
  'openai/gpt-oss-20b',    // fast fallback — replacement for llama-3.1-8b-instant
  'qwen/qwen3.6-27b'       // secondary fallback
];

export async function analyzeDocument(text) {
  let lastError = null;

  for (const model of MODELS) {
    try {
      console.log('[AI] Trying model:', model);
      const result = await callGroq(model, text);
      console.log('[AI] Success with model:', model, '| Trust score:', result.trust_score);
      return result;
    } catch (error) {
      if (
        error.message.includes('429') ||
        error.message.includes('rate_limit') ||
        error.message.includes('decommissioned')
      ) {
        console.log(`[AI] Model ${model} unavailable, trying next...`);
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw new Error('All models unavailable. Please wait 1 minute and try again.');
}

async function callGroq(model, text) {
  const cleanText = text
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000);

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are a legal document analyzer specializing in dark patterns and consumer protection.
Return ONLY valid JSON. No markdown. No backticks. No explanations before or after JSON.
All string values must use ASCII characters only. Write all text in English.`
      },
      {
        role: 'user',
        content: `Analyze this legal/terms document for dark patterns and risks.

For the "text" field: copy an EXACT phrase from the document (5-15 words).
Do NOT include clauses unless real evidence exists in the document.
If the document is safe, return an empty clauses array and a high trust_score.

Return ONLY this exact JSON structure:
{
  "trust_score": <integer 0-100>,
  "clauses": [
    {
      "text": "<EXACT 5-15 word quote copied from the document>",
      "pattern_type": "<Hidden Subscription|Data Selling|Roach Motel|Hidden Costs|Forced Consent|Privacy Abuse|Auto Renewal|Third Party Sharing|Scarcity Manipulation|Confirmshaming>",
      "risk_level": "<High|Medium|Low>",
      "simplified": "<one sentence plain English explanation>",
      "consequence": "<one sentence: what happens to the user>"
    }
  ],
  "summary": {
    "high_risks": <integer>,
    "medium_risks": <integer>,
    "low_risks": <integer>,
    "subscription_traps": <integer>,
    "privacy_concerns": <integer>,
    "main_concern": "<one sentence summary of biggest concern>"
  }
}

Trust score guide:
- 85-100: Safe, transparent, user-friendly
- 60-84: Moderate risks, some concerning clauses
- 0-59: Dangerous, many manipulative or harmful clauses

Document:
${cleanText}`
      }
    ],
    temperature: 0,
    seed: 42,
    max_tokens: 1500
  });

  let output = completion.choices[0].message.content.trim();
  output = output.replace(/```json/gi, '').replace(/```/g, '').trim();

  const jsonStart = output.indexOf('{');
  const jsonEnd = output.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('AI response did not contain valid JSON');
  }

  const parsed = JSON.parse(output.substring(jsonStart, jsonEnd + 1));

  if (typeof parsed.trust_score !== 'number') parsed.trust_score = 50;
  parsed.trust_score = Math.max(0, Math.min(100, parsed.trust_score));
  if (!Array.isArray(parsed.clauses)) parsed.clauses = [];
  if (!parsed.summary) parsed.summary = {
    high_risks: 0, medium_risks: 0, low_risks: 0,
    subscription_traps: 0, privacy_concerns: 0,
    main_concern: 'Analysis complete.'
  };

  return parsed;
}
