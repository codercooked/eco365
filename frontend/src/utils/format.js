export function formatDuration(ms) {
  if (!ms || ms < 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

export function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
}

export function formatTimeShort(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getTimeSince(isoString) {
  if (!isoString) return null;
  return Date.now() - new Date(isoString).getTime();
}

export function statusColor(status) {
  switch(status) {
    case 'RUNNING': return 'var(--status-running)';
    case 'STOPPED': return 'var(--status-stopped)';
    case 'IDLE': return 'var(--status-idle)';
    case 'OFFLINE': return 'var(--status-offline)';
    default: return 'var(--text-secondary)';
  }
}

export function statusBg(status) {
  switch(status) {
    case 'RUNNING': return 'var(--status-running-bg)';
    case 'STOPPED': return 'var(--status-stopped-bg)';
    case 'IDLE': return 'var(--status-idle-bg)';
    case 'OFFLINE': return 'var(--status-offline-bg)';
    default: return 'var(--bg-primary)';
  }
}
