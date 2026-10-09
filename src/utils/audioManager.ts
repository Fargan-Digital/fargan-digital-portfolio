/**
 * FARGAN DIGITAL AI — RETRO PROCEDURAL AUDIO ENGINE
 * Web Audio API based ambient synthesizer, BGM, and sound effects.
 * $0 Bandwidth, 0kb assets, instant start, mobile unlocked.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: number | null = null;
  private currentChordIdx: number = 0;

  // Lofi / Cyberpunk Ambient Chord Progression (Frequencies in Hz)
  // Dm9 -> G13 -> Cmaj9 -> Am9 (Warm, futuristic, relaxing)
  private chords: number[][] = [
    [146.83, 220.00, 261.63, 329.63], // Dm9 (D3, A3, C4, E4)
    [196.00, 246.94, 329.63, 392.00], // G13 (G3, B3, E4, G4)
    [130.81, 196.00, 246.94, 329.63], // Cmaj9 (C3, G3, B3, E4)
    [220.00, 261.63, 329.63, 392.00]  // Am9 (A3, C4, E4, G4)
  ];

  private melodyPitches: number[] = [
    523.25, 587.33, 659.25, 783.99, 880.00, 987.77, 1046.50
  ];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.isBgmPlaying) {
      this.stopBgm();
    } else if (!muted && !this.isBgmPlaying) {
      this.startBgm();
    }
  }

  public unmute(): void {
    this.setMuted(false);
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return !this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // =========================================================================
  // AMBIENT BACKGROUND MUSIC (LOFI CYBERPUNK SYNTHESIS)
  // =========================================================================
  public startBgm(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isBgmPlaying = true;
    if (this.bgmIntervalId) {
      window.clearInterval(this.bgmIntervalId);
    }

    // Play initial chord
    this.playAmbientChord();

    // Loop progression every 3.2 seconds
    this.bgmIntervalId = window.setInterval(() => {
      if (this.isBgmPlaying && !this.isMuted) {
        this.playAmbientChord();
      }
    }, 3200);
  }

  public stopBgm(): void {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      window.clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  private playAmbientChord(): void {
    const ctx = this.getContext();
    if (!ctx || this.isMuted) return;

    const chord = this.chords[this.currentChordIdx % this.chords.length];
    this.currentChordIdx++;

    const now = ctx.currentTime;
    const duration = 3.6;

    // Warm Low-pass filter for lofi dreamscape sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(850, now + 1.2);
    filter.frequency.exponentialRampToValueAtTime(500, now + duration);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.028, now + 0.8);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Play each note in chord
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle detune for lush chorus shimmer
      osc.detune.setValueAtTime((idx - 1.5) * 6, now);

      osc.connect(filter);
      osc.start(now);
      osc.stop(now + duration);
    });

    // Occasional gentle star-glimmer high melody bell
    if (Math.random() > 0.3) {
      const bellFreq = this.melodyPitches[Math.floor(Math.random() * this.melodyPitches.length)];
      const bellDelay = 0.6 + Math.random() * 1.4;
      const bellNow = now + bellDelay;

      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(bellFreq, bellNow);

      bellGain.gain.setValueAtTime(0.015, bellNow);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, bellNow + 1.2);

      bellOsc.connect(bellGain);
      bellGain.connect(ctx.destination);
      bellOsc.start(bellNow);
      bellOsc.stop(bellNow + 1.3);
    }
  }

  // =========================================================================
  // RETRO SOUND EFFECTS (SFX)
  // =========================================================================

  /** Cute retro RPG typewriter dialogue speech blip */
  public playTypewriterBlip(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // Pleasant pitch variation 720Hz - 900Hz
      osc.frequency.setValueAtTime(740 + Math.random() * 160, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.04);

      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /** Soft retro footstep sound */
  public playFootstep(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  /** Jump whoosh sound */
  public playJump(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  /** Welcome chime when approaching NPC */
  public playProximityChime(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [659.25, 987.77].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.05, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.4);
      });
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
