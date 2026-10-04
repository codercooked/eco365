import { useState, useEffect } from 'react';
import { formatDuration } from '../utils/format';

export default function LiveCounter({ since, active = true }) {
  const [elapsed, setElapsed] = useState(() => since ? Date.now() - new Date(since).getTime() : 0);

  useEffect(() => {
    if (!since || !active) return;
    setElapsed(Date.now() - new Date(since).getTime());
    const interval = setInterval(() => {
      setElapsed(Date.now() - new Date(since).getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [since, active]);

  if (!since || !active) return <span>—</span>;
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatDuration(elapsed)}</span>;
}
