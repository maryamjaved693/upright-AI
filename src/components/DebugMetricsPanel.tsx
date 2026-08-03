import { useEffect, useState } from 'react';
import type { RawMetrics } from '../scoring/postureMetrics';
import type { PostureThresholds } from '../scoring/thresholds';

interface DebugMetricsPanelProps {
  metricsRef: React.RefObject<RawMetrics | null>;
  thresholds: PostureThresholds;
}

function Row({ label, value, comparison, isBad }: { label: string; value: string; comparison: string; isBad: boolean | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span>{label}</span>
      <span style={{ color: isBad === null ? 'var(--text-faint)' : isBad ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
        {value} {comparison}
      </span>
    </div>
  );
}

// Polls metricsRef on its own timer (4x/sec) rather than subscribing to
// per-frame updates directly — this is opt-in diagnostic UI, not
// something that should cost a re-render on every one of the ~30
// frames/sec the main app already processes.
export function DebugMetricsPanel({ metricsRef, thresholds }: DebugMetricsPanelProps) {
  const [metrics, setMetrics] = useState<RawMetrics | null>(null);

  useEffect(() => {
    const id = setInterval(() => setMetrics(metricsRef.current), 250);
    return () => clearInterval(id);
  }, [metricsRef]);

  return (
    <div className="card">
      <details>
        <summary className="card-title" style={{ cursor: 'pointer', display: 'inline-block', marginBottom: 0 }}>
          Debug: live metrics
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, fontFamily: 'var(--mono)', fontSize: 12 }}>
        {!metrics ? (
          <span style={{ color: 'var(--text-faint)' }}>No person detected</span>
        ) : (
          <>
            <Row
              label="neckDropRatio"
              value={metrics.neckDropRatio.toFixed(3)}
              comparison={`(bad if < ${thresholds.neckDropRatioMin})`}
              isBad={metrics.neckDropRatio < thresholds.neckDropRatioMin}
            />
            <Row
              label="torsoRatio"
              value={metrics.torsoRatio === null ? 'null (hips not visible)' : metrics.torsoRatio.toFixed(3)}
              comparison={metrics.torsoRatio === null ? '' : `(bad if < ${thresholds.torsoRatioMin})`}
              isBad={metrics.torsoRatio === null ? null : metrics.torsoRatio < thresholds.torsoRatioMin}
            />
            <Row
              label="shoulderWidthNorm"
              value={metrics.shoulderWidthNorm.toFixed(3)}
              comparison={`(bad if > ${thresholds.shoulderWidthMax})`}
              isBad={metrics.shoulderWidthNorm > thresholds.shoulderWidthMax}
            />
            <Row
              label="lateralLeanRatio"
              value={metrics.lateralLeanRatio === null ? 'null (no ear/eye pair)' : metrics.lateralLeanRatio.toFixed(3)}
              comparison={metrics.lateralLeanRatio === null ? '' : `(bad if |x| > ${thresholds.lateralLeanRatioMin})`}
              isBad={
                metrics.lateralLeanRatio === null
                  ? null
                  : Math.abs(metrics.lateralLeanRatio) > thresholds.lateralLeanRatioMin
              }
            />
          </>
        )}
        </div>
      </details>
    </div>
  );
}
