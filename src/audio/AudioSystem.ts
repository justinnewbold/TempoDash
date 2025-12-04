import { BeatConfig } from '../types';
import { CONFIG } from '../constants';

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  public enabled = true;
  public initialized = false;
  public currentBPM = CONFIG.BASE_BPM;
  public jumpCount = 0;
  private beatCount = 0;

  private beatConfig: BeatConfig | null = null;

  // Beat patterns
  private readonly kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
  private readonly snarePattern = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
  private readonly bassPattern = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0];

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 6;
      this.compressor.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.error('Audio initialization error:', e);
    }
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setLevelConfig(config: BeatConfig): void {
    this.beatConfig = config;
  }

  start(): void {
    if (!this.initialized) return;
    this.jumpCount = 0;
    this.beatCount = 0;
    this.currentBPM = CONFIG.BASE_BPM;
  }

  getGameSpeed(): number {
    return this.currentBPM / 60;
  }

  onJump(): void {
    if (!this.initialized || !this.beatConfig) return;

    this.jumpCount++;
    this.beatCount++;
    this.currentBPM = CONFIG.BASE_BPM + this.jumpCount;

    this.playBeat();

    return;
  }

  private playBeat(): void {
    if (!this.enabled || !this.ctx || !this.compressor || !this.beatConfig) return;

    const beat = this.beatCount % 16;
    const jumps = this.jumpCount;
    const time = this.ctx.currentTime;

    // Always play kick on beat pattern
    if (this.kickPattern[beat]) this.playKick(time);

    // Add snare after 10 jumps
    if (jumps >= 10 && this.snarePattern[beat]) this.playSnare(time);

    // Add hi-hat after 20 jumps
    if (jumps >= 20) this.playHiHat(time, 0.15);

    // Add bass after 40 jumps
    if (jumps >= 40 && this.bassPattern[beat]) this.playBass(time);

    // Add melody after 60 jumps
    if (jumps >= 60) this.playMelody(time, beat);

    // Double hi-hats after 80 jumps
    if (jumps >= 80 && beat % 2 === 1) this.playHiHat(time, 0.1);

    // Always play jump sound
    this.playJumpSound(time);
  }

  private playKick(time: number): void {
    if (!this.ctx || !this.compressor || !this.beatConfig) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.beatConfig.kickFreq, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);

    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playSnare(time: number): void {
    if (!this.ctx || !this.compressor || !this.beatConfig) return;

    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    noise.start(time);
    noise.stop(time + 0.1);

    // Tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(this.beatConfig.snareFreq, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.04);

    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(oscGain);
    oscGain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  private playHiHat(time: number, volume = 0.15): void {
    if (!this.ctx || !this.compressor) return;

    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    noise.start(time);
    noise.stop(time + 0.03);
  }

  private playBass(time: number): void {
    if (!this.ctx || !this.compressor || !this.beatConfig) return;

    const baseFreq = this.beatConfig.bassNote * Math.pow(2, (this.jumpCount - 40) / 100);

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    filter.Q.value = 8;

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playMelody(time: number, beat: number): void {
    if (!this.ctx || !this.compressor || !this.beatConfig) return;

    const semitone = this.beatConfig.scale[beat % 16];
    const freq = this.beatConfig.baseNote * Math.pow(2, semitone / 12);

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = 1500;

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playJumpSound(time: number): void {
    if (!this.ctx || !this.compressor) return;

    const pitch = 300 + this.jumpCount * 1.5;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, time);
    osc.frequency.exponentialRampToValueAtTime(pitch * 2, time + 0.1);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  playScore(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const base = 800 + this.jumpCount * 2;

    [base, base * 1.25, base * 1.5].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = this.ctx!.currentTime + i * 0.02;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.compressor!);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  playCrash(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    // Low rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(15, this.ctx.currentTime + 0.6);

    oscGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.compressor);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.compressor);
    noise.start();
    noise.stop(this.ctx.currentTime + 0.4);
  }

  playClick(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1000;

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playPortal(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    // Whoosh + tone sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playPlatformLand(isBouncy: boolean = false): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    if (isBouncy) {
      // Springy boing sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, time);
      osc.frequency.exponentialRampToValueAtTime(800, time + 0.05);
      osc.frequency.exponentialRampToValueAtTime(300, time + 0.15);

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(time);
      osc.stop(time + 0.2);
    } else {
      // Soft thud for normal platform
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(time);
      osc.stop(time + 0.1);
    }
  }

  playCrumble(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // Cracking/breaking sound
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    noise.start(time);
    noise.stop(time + 0.3);
  }

  playCombo(comboCount: number): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;
    // Higher pitch for higher combos
    const baseFreq = 500 + comboCount * 100;

    // Ascending arpeggio
    [0, 4, 7].forEach((semitone, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = baseFreq * Math.pow(2, semitone / 12);

      const t = time + i * 0.03;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.compressor!);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  // Cave-specific sounds

  playWaterDrip(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // High pitched drip with resonance
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000 + Math.random() * 500, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.05);

    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 10;

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  playCrystalChime(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // Crystalline shimmer - multiple harmonics
    const fundamentals = [1200, 1500, 1800, 2400];

    fundamentals.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq + Math.random() * 50;

      const t = time + i * 0.01;
      const volume = 0.08 / (i + 1);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.compressor!);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  playHoleWarning(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // Low, ominous pulse
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.linearRampToValueAtTime(80, time + 0.2);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  playFallIntoHole(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // Falling pitch sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.5);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.6);

    // Echo/reverb effect
    const echoDelay = this.ctx.createDelay();
    echoDelay.delayTime.value = 0.15;

    const echoGain = this.ctx.createGain();
    echoGain.gain.value = 0.3;

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(300, time + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(30, time + 0.7);

    gain2.gain.setValueAtTime(0.2, time + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

    osc2.connect(echoDelay);
    echoDelay.connect(echoGain);
    echoGain.connect(gain2);
    gain2.connect(this.compressor);
    osc2.start(time + 0.1);
    osc2.stop(time + 0.8);
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
