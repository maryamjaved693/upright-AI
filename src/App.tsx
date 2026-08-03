import { useCallback, useState } from 'react';
import { WebcamPoseView } from './components/WebcamPoseView';
import { StatusIndicator } from './components/StatusIndicator';
import { AlertBanner } from './components/AlertBanner';
import { BreakReminder } from './components/BreakReminder';
import { SoundToggle } from './components/SoundToggle';
import { WellnessPanel } from './components/WellnessPanel';
import { ThresholdSettings } from './components/ThresholdSettings';
import { DebugMetricsPanel } from './components/DebugMetricsPanel';
import { usePostureMonitor } from './hooks/usePostureMonitor';
import { useBreakTimer } from './hooks/useBreakTimer';
import { useAudioAlert } from './hooks/useAudioAlert';
import { useWellnessMonitor } from './hooks/useWellnessMonitor';
import { useWebcam } from './pose/useWebcam';
import { useFaceLandmarker } from './face/useFaceLandmarker';
import { STATUS_COLORS, resolveStatus } from './scoring/statusPresentation';
import { DEFAULT_THRESHOLDS, type PostureThresholds } from './scoring/thresholds';
import type { PoseFrame } from './pose/types';

function App() {
  const webcam = useWebcam();
  const [thresholds, setThresholds] = useState<PostureThresholds>(DEFAULT_THRESHOLDS);
  const monitor = usePostureMonitor(thresholds);
  const breakTimer = useBreakTimer();
  const wellness = useWellnessMonitor();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audio = useAudioAlert(monitor.overallRef, soundEnabled);

  useFaceLandmarker({
    videoRef: webcam.videoRef,
    videoReady: webcam.status === 'ready',
    onFace: wellness.handleFace,
  });

  const handleFrame = useCallback(
    (frame: PoseFrame) => {
      monitor.handleFrame(frame);
      breakTimer.markPresent();
    },
    [monitor, breakTimer],
  );

  const toggleSound = () => {
    if (!soundEnabled) audio.unlock();
    setSoundEnabled((v) => !v);
  };

  return (
    <div className="app-page">
      <header className="app-header">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">Upright AI</div>
          <div className="brand-tagline">Real-time posture & wellness monitor</div>
        </div>
      </header>

      <div className="app-shell">
        <main className="main">
          <WebcamPoseView
            videoRef={webcam.videoRef}
            status={webcam.status}
            error={webcam.error}
            onFrame={handleFrame}
            skeletonColor={STATUS_COLORS[resolveStatus(monitor.overall).color]}
          />

          <div className="main-status-row">
            <StatusIndicator overall={monitor.overall} />
            <WellnessPanel indicators={wellness.indicators} />
          </div>
        </main>

        <aside className="sidebar">
          <BreakReminder
            dueForBreak={breakTimer.dueForBreak}
            remainingMs={breakTimer.remainingMs}
            onAcknowledge={breakTimer.acknowledgeBreak}
          />

          <div className="card">
            <div className="card-title">Sound alerts</div>
            <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
          </div>
          <ThresholdSettings thresholds={thresholds} onChange={setThresholds} />

          <div style={{ marginTop: 'auto' }}>
            <DebugMetricsPanel metricsRef={monitor.metricsRef} thresholds={thresholds} />
          </div>
        </aside>
      </div>

      <AlertBanner alerting={monitor.alerting} />
    </div>
  );
}

export default App;
