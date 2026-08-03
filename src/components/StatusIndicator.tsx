import type { OverallStatus } from '../scoring/sustainedAlertTracker';
import { STATUS_COLORS, resolveStatus } from '../scoring/statusPresentation';

interface StatusIndicatorProps {
  overall: OverallStatus;
}

export function StatusIndicator({ overall }: StatusIndicatorProps) {
  const { color, label } = resolveStatus(overall);
  return (
    <div className="card">
      <div className="card-title">Posture status</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: STATUS_COLORS[color],
            boxShadow: `0 0 10px ${STATUS_COLORS[color]}`,
            display: 'inline-block',
            transition: 'background-color 200ms ease',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 14 }}>{label}</span>
      </div>
    </div>
  );
}
