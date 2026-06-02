import { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeText } from '../services/api';
import TrustMeter from '../components/TrustMeter';

const riskColor = { High: 'text-red-400', Medium: 'text-yellow-400', Low: 'text-blue-400' };
const riskBg = { High: 'border-red-500', Medium: 'border-yellow-500', Low: 'border-blue-500' };

export default function Dashboard() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, url })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header with History button */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-indigo-400">LexiGuard</h1>
          <Link to="/history"
            className="px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300
                       hover:bg-slate-700 border border-slate-700">
            📋 History
          </Link>
        </div>
        <p className="text-slate-400 mb-8">AI-powered legal document analyzer</p>

        {/* Input section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <input value={url} onChange={e => setUrl(e.target.value)}
            placeholder="Website URL (optional)"
            className="w-full bg-slate-700 rounded-lg p-3 mb-3 text-sm outline-none
                       border border-slate-600 focus:border-indigo-500"/>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Paste Terms & Conditions or Privacy Policy text here..."
            rows={8}
            className="w-full bg-slate-700 rounded-lg p-3 mb-4 text-sm outline-none
                       border border-slate-600 focus:border-indigo-500 resize-none"/>
          <button onClick={handleAnalyze} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg
                       font-semibold text-sm disabled:opacity-50 cursor-pointer">
            {loading ? 'Analyzing...' : 'Analyze Document'}
          </button>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* Results section */}
        {result && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800 rounded-xl p-6 flex justify-center">
                <TrustMeter score={result.trust_score} />
              </div>
              <div className="bg-slate-800 rounded-xl p-6 col-span-2">
                <h2 className="font-semibold mb-4 text-slate-200">Summary</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'High risks', val: result.summary.high_risks, c: 'text-red-400' },
                    { label: 'Medium risks', val: result.summary.medium_risks, c: 'text-yellow-400' },
                    { label: 'Privacy issues', val: result.summary.privacy_concerns, c: 'text-purple-400' },
                    { label: 'Subscription traps', val: result.summary.subscription_traps, c: 'text-orange-400' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-700 rounded-lg p-4">
                      <div className={`text-2xl font-bold ${item.c}`}>{item.val}</div>
                      <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-400 mt-4">{result.summary.main_concern}</p>
              </div>
            </div>

            <h2 className="font-semibold mb-4 text-slate-200">
              Risky clauses ({result.clauses.length} found)
            </h2>
            <div className="space-y-3">
              {result.clauses.map((clause, i) => (
                <div key={i}
                  className={`bg-slate-800 rounded-xl p-5 border-l-4 ${riskBg[clause.risk_level]}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold uppercase ${riskColor[clause.risk_level]}`}>
                      {clause.risk_level}
                    </span>
                    <span className="text-xs text-slate-500">{clause.pattern_type}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{clause.simplified}</p>
                  <p className="text-xs text-slate-500">{clause.consequence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}