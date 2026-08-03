interface WellnessIndicatorState {
  happy: boolean;
  sad: boolean;
  tiredEyes: boolean;
  yawning: boolean;
}

interface WellnessPanelProps {
  indicators: WellnessIndicatorState;
}

const COPY: Record<keyof WellnessIndicatorState, string> = {
  happy: '🙂 Smiling',
  sad: '😔 Looking down — everything okay?',
  tiredEyes: '😴 Eyes look tired — maybe take a break',
  yawning: '🥱 Yawning — low energy detected',
};

// Framed deliberately as approximate wellness signals, not diagnosed
// emotions — these come from facial muscle-movement heuristics
// (blendshapes), not a validated emotion classifier.
export function WellnessPanel({ indicators }: WellnessPanelProps) {
  const active = (Object.keys(indicators) as (keyof WellnessIndicatorState)[]).filter((k) => indicators[k]);

  return (
    <div className="card">
      <div className="card-title">Wellness indicators</div>
      {active.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>No notable signals</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
          {active.map((k) => (
            <li key={k}>{COPY[k]}</li>
          ))}
        </ul>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
        Approximate, based on facial muscle movement — not a clinical assessment.
      </div>
    </div>
  );
}
