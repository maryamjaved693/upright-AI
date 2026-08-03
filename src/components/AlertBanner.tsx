import type { SustainResult } from '../scoring/sustainedAlertTracker';

interface AlertBannerProps {
  alerting: SustainResult['alerting'];
}

const ISSUE_COPY: Record<keyof SustainResult['alerting'], string> = {
  forwardNeck: 'Your neck is leaning forward — pull your head back over your shoulders.',
  slouching: "You're slouching — sit back and lengthen your spine.",
  tooClose: "You're sitting too close to the screen — scoot back.",
  leaningLeft: "You're leaning to your left — straighten up and center yourself.",
  leaningRight: "You're leaning to your right — straighten up and center yourself.",
};

export function AlertBanner({ alerting }: AlertBannerProps) {
  const active = (Object.keys(alerting) as (keyof typeof alerting)[]).filter((k) => alerting[k]);
  if (active.length === 0) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        fontFamily: 'var(--sans)',
        background: 'var(--red)',
        color: '#012624',
        borderRadius: 16,
        padding: '14px 22px',
        maxWidth: 480,
        animation: 'posture-alert-pop 200ms ease-out',
      }}
    >
      <style>{`
        @keyframes posture-alert-pop {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <strong style={{ fontSize: 16 }}>⚠ Please sit up straight!</strong>
      <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
        {active.map((key) => (
          <li key={key}>{ISSUE_COPY[key]}</li>
        ))}
      </ul>
    </div>
  );
}
