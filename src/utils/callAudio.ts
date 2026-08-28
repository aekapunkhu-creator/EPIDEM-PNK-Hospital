// Web Audio API Sound Synthesizer for Video Calls (Ringtone, Connect Chime, End Chime)
class CallAudioManager {
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private isPlayingRingtone: boolean = false;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play pleasant incoming ringtone (repeating double chime)
  playIncomingRingtone() {
    if (this.isPlayingRingtone) return;
    this.isPlayingRingtone = true;

    const playChime = () => {
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        // Note 1 (E5 - 659.25 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Note 2 (G#5 - 830.61 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(830.61, now + 0.18);
        gain2.gain.setValueAtTime(0.22, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.6);

        // Note 3 (B5 - 987.77 Hz)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(987.77, now + 0.38);
        gain3.gain.setValueAtTime(0.25, now + 0.38);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now + 0.38);
        osc3.stop(now + 1.1);
      } catch (e) {
        // Audio policy ignore
      }
    };

    playChime();
    this.ringtoneInterval = setInterval(playChime, 2500);
  }

  stopIncomingRingtone() {
    this.isPlayingRingtone = false;
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Play outgoing ringing tone for caller (Doctor waiting for patient)
  playOutgoingRing() {
    if (this.isPlayingRingtone) return;
    this.isPlayingRingtone = true;

    const playRing = () => {
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.3);
      } catch (e) {}
    };

    playRing();
    this.ringtoneInterval = setInterval(playRing, 3000);
  }

  stopOutgoingRing() {
    this.isPlayingRingtone = false;
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Play Call Connected Chime
  playConnectedSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });
    } catch (e) {}
  }

  // Play Call Ended Sound
  playEndedSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      [659.25, 523.25, 392.00].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.18, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.35);
      });
    } catch (e) {}
  }
}

export const callAudio = new CallAudioManager();
