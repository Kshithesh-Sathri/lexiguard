export default function TrustMeter({ score }) {
  const color = score >= 85 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 85 ? 'Safe' : score >= 60 ? 'Moderate Risk' : 'High Risk';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none"
          stroke="#1e293b" strokeWidth="10"/>
        <circle cx="70" cy="70" r="54" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}/>
        <text x="70" y="65" textAnchor="middle"
          fill={color} fontSize="32" fontWeight="700">{score}</text>
        <text x="70" y="85" textAnchor="middle"
          fill="#94a3b8" fontSize="11">Trust Score</text>
      </svg>
      <span style={{ color }} className="font-semibold text-sm mt-1">{label}</span>
    </div>
  );
}