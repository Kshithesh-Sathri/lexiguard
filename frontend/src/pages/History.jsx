import { useState, useEffect } from 'react';
import { getHistory } from '../services/api';
import { Link } from 'react-router-dom';

function trustColor(score) {
  if (score >= 85) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function trustLabel(score) {
  if (score >= 85) return 'Safe';
  if (score >= 60) return 'Moderate';
  return 'High Risk';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function History() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await getHistory();
      setScans(data.scans || []);
    } catch (err) {
      setError('Failed to load history. Is the backend running?');
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div style={{
        width: 40, height: 40,
        border: '3px solid #334155',
        borderTopColor: '#818cf8',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-400">Scan History</h1>
            <p className="text-slate-400 text-sm mt-1">
              {scans.length} scans recorded
            </p>
          </div>
          <Link to="/"
            className="px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300
                       hover:bg-slate-700 border border-slate-700">
            ← Back to Scanner
          </Link>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl
                          p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {scans.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-slate-400 text-lg">No scans yet</p>
            <p className="text-slate-500 text-sm mt-2">
              Go to the scanner and analyze a document first
            </p>
            <Link to="/"
              className="inline-block mt-6 px-6 py-3 bg-indigo-600
                         rounded-lg text-sm font-semibold hover:bg-indigo-500">
              Start Scanning
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {scans.map(scan => (
            <div key={scan.id}
              className="bg-slate-800 rounded-xl border border-slate-700
                         hover:border-slate-600 transition-all cursor-pointer"
              onClick={() => setSelected(selected?.id === scan.id ? null : scan)}>

              {/* Scan card header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">

                  {/* Trust score circle */}
                  <div style={{
                    width: 52, height: 52,
                    borderRadius: '50%',
                    background: `conic-gradient(${trustColor(scan.trust_score)}
                      ${scan.trust_score * 3.6}deg, #1e293b 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{
                      width: 38, height: 38,
                      borderRadius: '50%',
                      background: '#1e293b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      color: trustColor(scan.trust_score)
                    }}>
                      {scan.trust_score}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-slate-200 text-sm">
                      {scan.domain || 'Unknown domain'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                      {scan.url}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span style={{ color: trustColor(scan.trust_score) }}
                        className="text-xs font-semibold">
                        {trustLabel(scan.trust_score)}
                      </span>
                      <span className="text-xs text-slate-600">
                        {timeAgo(scan.scanned_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk counts */}
                <div className="flex items-center gap-3">
                  {scan.clauses && scan.clauses.length > 0 && (
                    <>
                      <div className="text-center">
                        <div className="text-red-400 font-bold text-sm">
                          {scan.clauses.filter(c => c.risk_level === 'High').length}
                        </div>
                        <div className="text-slate-600 text-xs">High</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold text-sm">
                          {scan.clauses.filter(c => c.risk_level === 'Medium').length}
                        </div>
                        <div className="text-slate-600 text-xs">Med</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400 font-bold text-sm">
                          {scan.clauses.length}
                        </div>
                        <div className="text-slate-600 text-xs">Total</div>
                      </div>
                    </>
                  )}
                  <span className="text-slate-600 text-lg ml-2">
                    {selected?.id === scan.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expanded clauses */}
              {selected?.id === scan.id && scan.clauses && scan.clauses.length > 0 && (
                <div className="border-t border-slate-700 p-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                    Clauses found ({scan.clauses.length})
                  </p>
                  <div className="space-y-3">
                    {scan.clauses.map(clause => (
                      <div key={clause.id}
                        className="rounded-lg p-4"
                        style={{
                          background: clause.risk_level === 'High'
                            ? 'rgba(239,68,68,0.08)'
                            : clause.risk_level === 'Medium'
                            ? 'rgba(245,158,11,0.08)'
                            : 'rgba(59,130,246,0.08)',
                          borderLeft: `3px solid ${
                            clause.risk_level === 'High' ? '#ef4444'
                            : clause.risk_level === 'Medium' ? '#f59e0b'
                            : '#3b82f6'}`
                        }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold uppercase"
                            style={{
                              color: clause.risk_level === 'High' ? '#ef4444'
                                : clause.risk_level === 'Medium' ? '#f59e0b'
                                : '#3b82f6'
                            }}>
                            {clause.risk_level}
                          </span>
                          <span className="text-xs text-slate-500">
                            {clause.pattern_type}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{clause.simplified}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats footer */}
        {scans.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-400">{scans.length}</div>
              <div className="text-xs text-slate-500 mt-1">Total scans</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {scans.filter(s => s.trust_score >= 85).length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Safe sites</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {scans.filter(s => s.trust_score < 60).length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Dangerous sites</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}