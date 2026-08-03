// Thin Web Audio wrapper. No audio asset needed — the alert is a short
// synthesized tone. Must call unlock() from a user gesture handler
// (e.g. a button click) before play() will produce sound in Chrome/Safari.
export class BeepPlayer {
  ctx: AudioContext | null = null;

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  play(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);

    // Exponential envelope avoids the click/pop of a hard on/off gain.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}
