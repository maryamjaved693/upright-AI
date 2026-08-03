import type { OverallStatus } from './sustainedAlertTracker';

// Single source of truth for status -> color/label so the skeleton
// overlay, status dot, and alert banner never disagree with each other.
export type StatusColorKey = 'gray' | 'green' | 'red';

export const STATUS_COLORS: Record<StatusColorKey, string> = {
  gray: '#707777',
  green: '#4dd8c8',
  red: '#ff5c7a',
};

export function resolveStatus(overall: OverallStatus): { color: StatusColorKey; label: string } {
  if (overall === 'unknown') return { color: 'gray', label: 'No person detected' };
  if (overall === 'bad') return { color: 'red', label: 'Fix your posture' };
  return { color: 'green', label: 'Posture OK' };
}
