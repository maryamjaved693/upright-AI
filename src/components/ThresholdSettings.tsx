import type { PostureThresholds } from '../scoring/thresholds';

interface ThresholdSettingsProps {
  thresholds: PostureThresholds;
  onChange: (next: PostureThresholds) => void;
}

interface SliderConfig {
  key: keyof Pick<PostureThresholds, 'neckDropRatioMin' | 'torsoRatioMin' | 'shoulderWidthMax' | 'lateralLeanRatioMin'>;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}

const SLIDERS: SliderConfig[] = [
  {
    key: 'neckDropRatioMin',
    label: 'Forward-neck sensitivity',
    min: 0.1,
    max: 1.0,
    step: 0.01,
    hint: 'Higher = triggers more easily (flags smaller forward head drops).',
  },
  {
    key: 'torsoRatioMin',
    label: 'Slouch sensitivity',
    min: 0.3,
    max: 2.5,
    step: 0.01,
    hint: 'Higher = triggers more easily (flags smaller torso compression). Needs hips in frame.',
  },
  {
    key: 'shoulderWidthMax',
    label: '"Too close" sensitivity',
    min: 0.2,
    max: 0.9,
    step: 0.01,
    hint: 'Lower = triggers more easily (flags being farther away as still too close).',
  },
  {
    key: 'lateralLeanRatioMin',
    label: 'Left/right lean sensitivity',
    min: 0.02,
    max: 0.4,
    step: 0.01,
    hint: 'Lower = triggers more easily (flags smaller sideways head tilt).',
  },
];

// The fixed thresholds in thresholds.ts are estimates — actual camera
// distance/mount position varies enough per setup that no single
// default works for everyone. Exposing them live means you can dial
// in your own setup by watching the status dot instead of editing code.
export function ThresholdSettings({ thresholds, onChange }: ThresholdSettingsProps) {
  return (
    <div className="card">
      <details>
        <summary className="card-title" style={{ cursor: 'pointer', display: 'inline-block', marginBottom: 0 }}>
          Tune sensitivity
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {SLIDERS.map(({ key, label, min, max, step, hint }) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <span>
                {label}: <strong>{thresholds[key].toFixed(2)}</strong>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={thresholds[key]}
                onChange={(e) => onChange({ ...thresholds, [key]: Number(e.target.value) })}
              />
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>{hint}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
