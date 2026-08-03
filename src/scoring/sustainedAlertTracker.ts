import type { PostureIssues } from './postureScoring';
import type { PostureThresholds } from './thresholds';

export type IssueKey = keyof PostureIssues;

interface IssueState {
  badSinceMs: number | null;
  goodSinceMs: number | null;
  alerting: boolean;
}

// Overall status shown by the UI's green/red indicator: 'unknown' while
// we lack confident landmarks, 'good' when nothing is sustained-bad,
// 'bad' when at least one issue has crossed its sustain threshold.
export type OverallStatus = 'unknown' | 'good' | 'bad';

export interface SustainResult {
  overall: OverallStatus;
  alerting: Record<IssueKey, boolean>;
}

const ISSUE_KEYS: IssueKey[] = ['forwardNeck', 'slouching', 'tooClose', 'leaningLeft', 'leaningRight'];

function initialState(): Record<IssueKey, IssueState> {
  return {
    forwardNeck: { badSinceMs: null, goodSinceMs: null, alerting: false },
    slouching: { badSinceMs: null, goodSinceMs: null, alerting: false },
    tooClose: { badSinceMs: null, goodSinceMs: null, alerting: false },
    leaningLeft: { badSinceMs: null, goodSinceMs: null, alerting: false },
    leaningRight: { badSinceMs: null, goodSinceMs: null, alerting: false },
  };
}

// Stateful hysteresis debounce — see the module-level explanation in the
// chat for why enter/exit use different durations. One instance should
// live for the lifetime of a monitoring session; feed it every frame's
// PostureIssues in timestamp order.
export class SustainedAlertTracker {
  state: Record<IssueKey, IssueState> = initialState();
  thresholds: Pick<PostureThresholds, 'sustainMs' | 'recoveryMs'>;

  constructor(thresholds: Pick<PostureThresholds, 'sustainMs' | 'recoveryMs'>) {
    this.thresholds = thresholds;
  }

  update(issues: PostureIssues, timestampMs: number): SustainResult {
    for (const key of ISSUE_KEYS) {
      const value = issues[key];
      const s = this.state[key];

      if (value === null) {
        // Unknown frame: freeze — neither accumulate toward alert nor
        // toward recovery. A brief tracking dropout shouldn't reset
        // progress in either direction.
        continue;
      }

      if (value) {
        s.goodSinceMs = null;
        if (s.badSinceMs === null) s.badSinceMs = timestampMs;
        if (!s.alerting && timestampMs - s.badSinceMs >= this.thresholds.sustainMs) {
          s.alerting = true;
        }
      } else {
        s.badSinceMs = null;
        if (s.goodSinceMs === null) s.goodSinceMs = timestampMs;
        if (s.alerting && timestampMs - s.goodSinceMs >= this.thresholds.recoveryMs) {
          s.alerting = false;
        }
      }
    }

    const alerting = {
      forwardNeck: this.state.forwardNeck.alerting,
      slouching: this.state.slouching.alerting,
      tooClose: this.state.tooClose.alerting,
      leaningLeft: this.state.leaningLeft.alerting,
      leaningRight: this.state.leaningRight.alerting,
    };

    const anyKnown = ISSUE_KEYS.some((k) => issues[k] !== null);
    const anyAlerting = ISSUE_KEYS.some((k) => alerting[k]);

    const overall: OverallStatus = !anyKnown ? 'unknown' : anyAlerting ? 'bad' : 'good';

    return { overall, alerting };
  }

  reset(): void {
    this.state = initialState();
  }
}
