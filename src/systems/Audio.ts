// Procedural EDM/Dubstep music system using Web Audio API
// Generates heavy electronic beats with wobble bass, drops, and synths

export type MusicStyle = 'energetic' | 'dark' | 'epic';

interface MusicPatterns {
  bass: string[];
  melody: string[];
  arp: string[];
  bpm: number;
  wobbleRate: number; // LFO rate for wobble bass
  dropBeat: number;   // Beat where "drop" happens
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isPlaying = false;
  private bpm = 140; // EDM tempo
  private beatInterval: number | null = null;
  private currentBeat = 0;
  private isMuted = false;
  private beatCallback: ((beat: number) => void) | null = null;
  private currentStyle: MusicStyle = 'energetic';
  private barCount = 0;
  private musicVolume = 0.3;
  private sfxVolume = 0.5;

  // Musical notes (frequencies in Hz)
  private notes: Record<string, number> = {
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51,
  };

  // EDM/Dubstep music styles for different levels
  private musicStyles: Record<MusicStyle, MusicPatterns> = {
    // Level 1: Festival EDM (F major, energetic)
    energetic: {
      bass: ['F2', 'F2', 'F2', 'F2', 'C3', 'C3', 'D3', 'D3'],
      melody: ['F4', 'A4', 'C5', 'F5', 'C5', 'A4', 'F4', 'C4'],
      arp: ['F5', 'A5', 'C6', 'F5', 'A5', 'C6', 'F5', 'A5'],
      bpm: 128,
      wobbleRate: 4,
      dropBeat: 0,
    },
    // Level 2: Dark Dubstep (D minor, heavy wobble)
    dark: {
      bass: ['D2', 'D2', 'A2', 'A2', 'F2', 'F2', 'G2', 'G2'],
      melody: ['D4', 'F4', 'A4', 'D5', 'A4', 'F4', 'E4', 'D4'],
      arp: ['D5', 'F5', 'A5', 'D5', 'F5', 'A5', 'D5', 'F5'],
      bpm: 140,
      wobbleRate: 8,
      dropBeat: 4,
    },
    // Level 3: Epic Drumstep (E minor, fast and intense)
    epic: {
      bass: ['E2', 'E2', 'B2', 'B2', 'G2', 'G2', 'A2', 'A2'],
      melody: ['E5', 'G5', 'B5', 'E6', 'B5', 'G5', 'E5', 'D5'],
      arp: ['E5', 'G5', 'B5', 'E5', 'G5', 'B5', 'E5', 'G5'],
      bpm: 150,
      wobbleRate: 16,
      dropBeat: 0,
    },
  };

  // Current patterns (set by style)
  private bassPattern: string[] = this.musicStyles.energetic.bass;
  private melodyPattern: string[] = this.musicStyles.energetic.melody;
  private arpPattern: string[] = this.musicStyles.energetic.arp;
  private wobbleRate: number = 4;

  constructor() {
    // Audio context will be created on first user interaction
  }

  private initAudioContext(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.audioContext.destination);

      // Separate gain for music
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      // Separate gain for sound effects
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this.isMuted ? 0 : this.musicVolume;
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  start(): void {
    if (this.isPlaying) return;

    this.initAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentBeat = 0;

    const beatDuration = 60000 / this.bpm / 2; // Eighth notes

    // Start the beat loop
    this.playBeat();
    this.beatInterval = window.setInterval(() => {
      this.playBeat();
    }, beatDuration);
  }

  stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    if (this.beatInterval !== null) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.musicGain) {
      this.musicGain.gain.value = this.isMuted ? 0 : this.musicVolume;
    }
    return this.isMuted;
  }

  isMusicMuted(): boolean {
    return this.isMuted;
  }

  setBeatCallback(callback: ((beat: number) => void) | null): void {
    this.beatCallback = callback;
  }

  getBPM(): number {
    return this.bpm;
  }

  setStyle(style: MusicStyle): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stop();
    }

    this.currentStyle = style;
    const patterns = this.musicStyles[style];
    this.bassPattern = patterns.bass;
    this.melodyPattern = patterns.melody;
    this.arpPattern = patterns.arp;
    this.bpm = patterns.bpm;
    this.wobbleRate = patterns.wobbleRate;
    this.barCount = 0;

    if (wasPlaying) {
      this.start();
    }
  }

  getStyle(): MusicStyle {
    return this.currentStyle;
  }

  private playBeat(): void {
    if (!this.audioContext || !this.musicGain || this.isMuted) return;

    const time = this.audioContext.currentTime;
    const beatIndex = this.currentBeat % 8;

    // Track bar for build-up/drop dynamics
    if (beatIndex === 0) {
      this.barCount++;
    }

    // Wobble bass - the signature dubstep sound
    this.playWobbleBass(this.bassPattern[beatIndex], time);

    // Heavy kick drum on beats 0, 2, 4, 6
    if (beatIndex % 2 === 0) {
      this.playKick(time, beatIndex === 0);
    }

    // Punchy hi-hat pattern
    this.playHiHat(time, beatIndex % 2 === 1);

    // Snare on beats 2 and 6 (the backbeat)
    if (beatIndex === 2 || beatIndex === 6) {
      this.playSnare(time);
    }

    // EDM supersaw lead melody
    if (beatIndex % 2 === 0) {
      this.playSupersaw(this.melodyPattern[Math.floor(beatIndex / 2) % this.melodyPattern.length], time);
    }

    // Bright pluck arp
    this.playPluckArp(this.arpPattern[beatIndex], time);

    // Add sub bass for extra low end
    if (beatIndex % 4 === 0) {
      this.playSubBass(this.bassPattern[beatIndex], time);
    }

    // Fire beat callback for visual sync
    if (this.beatCallback) {
      this.beatCallback(this.currentBeat);
    }

    this.currentBeat++;
  }

  // Dubstep wobble bass with LFO modulation
  private playWobbleBass(note: string, time: number): void {
    if (!this.audioContext || !this.musicGain) return;

    const freq = this.notes[note] || 65.41;
    const duration = 0.25;

    // Main oscillator (sawtooth for that gritty sound)
    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    // Second oscillator slightly detuned
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = freq * 1.005;

    // LFO for the wobble effect
    const lfo = this.audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = this.wobbleRate;

    // Filter for the wub-wub sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 8;

    // LFO controls filter cutoff
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 600;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Output gain
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialDecayTo(0.01, time + duration);

    // Connect everything
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc2.start(time);
    lfo.start(time);
    osc.stop(time + duration);
    osc2.stop(time + duration);
    lfo.stop(time + duration);
  }

  // Deep sub bass for that chest-thumping low end
  private playSubBass(note: string, time: number): void {
    if (!this.audioContext || !this.musicGain) return;

    const freq = this.notes[note] || 65.41;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq / 2; // One octave lower

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialDecayTo(0.01, time + 0.3);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  // EDM supersaw lead sound
  private playSupersaw(note: string, time: number): void {
    if (!this.audioContext || !this.musicGain) return;

    const freq = this.notes[note] || 261.63;
    const detune = [0, -10, 10, -20, 20, -7, 7]; // Multiple detuned oscillators
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialDecayTo(0.001, time + 0.2);

    detune.forEach(d => {
      const osc = this.audioContext!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = d;
      osc.connect(gain);
      osc.start(time);
      osc.stop(time + 0.25);
    });

    gain.connect(this.musicGain);
  }

  // Bright pluck arp for that festival feel
  private playPluckArp(note: string, time: number): void {
    if (!this.audioContext || !this.musicGain) return;

    const freq = this.notes[note] || 523.25;

    const osc = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();

    osc.type = 'sine';
    osc.frequency.value = freq;
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.1);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialDecayTo(0.001, time + 0.1);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + 0.15);
    osc2.stop(time + 0.15);
  }

  // Heavy EDM kick drum
  private playKick(time: number, isDownbeat: boolean = false): void {
    if (!this.audioContext || !this.musicGain) return;

    // Main kick body
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    const kickVolume = isDownbeat ? 0.6 : 0.45;
    osc.frequency.setValueAtTime(isDownbeat ? 180 : 160, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    gain.gain.setValueAtTime(kickVolume, time);
    gain.gain.exponentialDecayTo(0.01, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.25);

    // Add punch/click transient
    const click = this.audioContext.createOscillator();
    const clickGain = this.audioContext.createGain();
    click.type = 'square';
    click.frequency.value = 1500;
    clickGain.gain.setValueAtTime(0.1, time);
    clickGain.gain.exponentialDecayTo(0.001, time + 0.02);
    click.connect(clickGain);
    clickGain.connect(this.musicGain);
    click.start(time);
    click.stop(time + 0.03);
  }

  // Punchy EDM snare with layered noise
  private playSnare(time: number): void {
    if (!this.audioContext || !this.musicGain) return;

    // Noise layer
    const bufferSize = this.audioContext.sampleRate * 0.15;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.2, time);
    noiseGain.gain.exponentialDecayTo(0.01, time + 0.12);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.15);

    // Tonal body
    const osc = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, time);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.06);

    oscGain.gain.setValueAtTime(0.15, time);
    oscGain.gain.exponentialDecayTo(0.01, time + 0.06);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  // Crisp hi-hat
  private playHiHat(time: number, open: boolean): void {
    if (!this.audioContext || !this.musicGain) return;

    const bufferSize = this.audioContext.sampleRate * (open ? 0.12 : 0.04);
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(open ? 0.08 : 0.1, time);
    gain.gain.exponentialDecayTo(0.001, time + (open ? 0.12 : 0.04));

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 9000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + (open ? 0.12 : 0.04));
  }

  // Play a death sound effect
  playDeath(): void {
    this.initAudioContext();
    if (!this.audioContext || !this.sfxGain) return;

    const time = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.3);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialDecayTo(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  // Play a jump sound effect
  playJump(): void {
    this.initAudioContext();
    if (!this.audioContext || !this.sfxGain) return;

    const time = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, time);
    osc.frequency.exponentialRampToValueAtTime(700, time + 0.08);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialDecayTo(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  // Play level complete sound - triumphant arpeggio
  playLevelComplete(): void {
    this.initAudioContext();
    if (!this.audioContext || !this.sfxGain) return;

    const time = this.audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const osc2 = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc2.type = 'triangle';
      osc2.frequency.value = freq;

      gain.gain.setValueAtTime(0, time + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, time + i * 0.12 + 0.03);
      gain.gain.exponentialDecayTo(0.001, time + i * 0.12 + 0.5);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time + i * 0.12);
      osc2.start(time + i * 0.12);
      osc.stop(time + i * 0.12 + 0.6);
      osc2.stop(time + i * 0.12 + 0.6);
    });
  }

  // Play menu select sound
  playSelect(): void {
    this.initAudioContext();
    if (!this.audioContext || !this.sfxGain) return;

    const time = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.05);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialDecayTo(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  // Play unlock sound
  playUnlock(): void {
    this.initAudioContext();
    if (!this.audioContext || !this.sfxGain) return;

    const time = this.audioContext.currentTime;
    const notes = [523.25, 783.99, 1046.50]; // C5, G5, C6

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.2, time + i * 0.08);
      gain.gain.exponentialDecayTo(0.001, time + i * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time + i * 0.08);
      osc.stop(time + i * 0.08 + 0.25);
    });
  }
}

// Polyfill for exponentialDecayTo (custom helper)
declare global {
  interface AudioParam {
    exponentialDecayTo(value: number, endTime: number): void;
  }
}

AudioParam.prototype.exponentialDecayTo = function(value: number, endTime: number) {
  // Can't use 0 with exponentialRampToValueAtTime
  this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
};
