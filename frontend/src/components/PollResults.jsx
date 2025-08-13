import React from 'react';

/**
 * props:
 *  - options: array of option strings
 *  - responses: array of counts (aligned with options)
 *  - totalLabel (optional)
 */
export default function PollResults({ options = [], responses = [], totalLabel = 'Total responses' }) {
  const total = (responses || []).reduce((a,b)=>a+(b||0),0);

  return (
    <div className="card mt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="label">Live Results</div>
          <div className="small">Real-time breakdown by option</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {options.map((opt, i) => {
          const count = responses && responses[i] ? responses[i] : 0;
          const pct = total === 0 ? 0 : Math.round((count / total) * 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{opt}</div>
                <div className="small">{count} • {pct}%</div>
              </div>
              <div className="result-bar mt-2">
                <div className="result-fill" style={{ width: `${pct}%` }}>
                  {pct >= 10 ? `${pct}%` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 small">{totalLabel}: <strong>{total}</strong></div>
    </div>
  );
}
