import { statusColor, statusBg } from '../utils/format';

export default function StatusBadge({ status, size = 'default' }) {
  const dotSize = size === 'small' ? 6 : 7;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: size === 'small' ? '12px' : '13px',
      fontWeight: 500,
      color: statusColor(status),
      background: statusBg(status),
      padding: size === 'small' ? '2px 8px' : '3px 10px',
      borderRadius: '3px',
    }}>
      <span style={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        background: statusColor(status),
        flexShrink: 0,
      }} />
      {status}
    </span>
  );
}
