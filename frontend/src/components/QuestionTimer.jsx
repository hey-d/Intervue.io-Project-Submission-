import React, { useEffect, useState } from 'react';

export default function QuestionTimer({ startedAt = Date.now(), duration = 60, onTick, onExpire }) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, duration - elapsed);
  });

  useEffect(() => {
    if (remaining <= 0) {
      if (onExpire) onExpire();
      return;
    }
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const rem = Math.max(0, duration - elapsed);
      setRemaining(rem);
      if (onTick) onTick(rem);
      if (rem <= 0) {
        clearInterval(t);
        if (onExpire) onExpire();
      }
    }, 250);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, duration]);

  // nice circular-ish label with color
  return (
    <div className="flex items-center gap-3">
      <div style={{
        minWidth:54, minHeight:54, borderRadius:12,
        background: remaining > 10 ? 'linear-gradient(180deg,#eef2ff,#eef6ff)' : 'linear-gradient(180deg,#fff1f2,#fff7f7)',
        display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 14px rgba(79,70,229,0.06)'
      }}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:16, fontWeight:700, color: remaining > 10 ? 'var(--primary-600)' : 'var(--danger)' }}>
            {remaining}s
          </div>
          <div className="small">left</div>
        </div>
      </div>
      <div className="small">Answer within the time limit. Results will appear when the timer ends.</div>
    </div>
  );
}
