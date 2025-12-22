// Procedural EDM music system using Web Audio API
// Based on the Neon Pulse Engine with multiple music styles

export type MusicStyle = 'noir' | 'funk' | 'sludge' | 'focus' | 'crystal' | 'hazard' | 'energetic';

interface MusicPreset {
  tempo: number;
  bassFreqs: number[];
  leadFreqs: number[];
  bassWave: OscillatorType;
  leadWave: OscillatorType;
  arpPattern: number[];
  useDelay: boolean;
  filterQ: number;
  drumStyle: 'soft' | 'standard' | 'distorted' | 'bit';
}

// Map levels to music styles
export const LEVEL_MUSIC: Record<number, MusicStyle> = {
  1: 'noir',      // Level 1: Neon Noir - smooth intro
  2: 'funk',      // Level 2: Cyber Funk - upbeat
  3: 'crystal',   // Level 3: Crystalline - dreamy
  4: 'focus',     // Level 4: Deep Focus - steady
  5: 'sludge',    // Level 5: Sludge Factory - heavy
  6: 'hazard',    // Level 6: Biohazard - aggressive
  7: 'energetic', // Level 7: Festival EDM - finale
};

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isPlaying = false;
  private isMuted = false;
  private musicVolume = 0.3;
  private sfxVolume = 0.5;

  // Scheduler variables
  private nextNoteTime = 0.0;
  private noteIndex = 0;
  private readonly lookahead = 25.0; // ms
  private readonly scheduleAheadTime = 0.1; // seconds
  private timerID: number | null = null;

  private currentPreset: MusicPreset;
  private currentStyle: MusicStyle = 'noir';
  private beatCallback: ((beat: number) => void) | null = null;

  // Music presets from Neon Pulse Engine
  private presets: Record<MusicStyle, MusicPreset> = {
    // Neon Noir (90 BPM) - D Minor Blues: smooth, jazzy
    noir: {
      tempo: 90,
      bassFreqs: [73.42, 87.31, 98.00, 103.83],
      leadFreqs: [293.66, 349.23, 392.00, 415.30, 440.00],
      bassWave: 'triangle',
      leadWave: 'square',
      arpPattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      useDelay: true,
      filterQ: 2,
      drumStyle: 'soft',
    },
    // Cyber Funk (112 BPM) - Dorian mode: funky and bright
    funk: {
      tempo: 112,
      bassFreqs: [73.42, 73.42, 110.00, 87.31],
      leadFreqs: [440.00, 523.25, 587.33, 659.25, 783.99],
      bassWave: 'sawtooth',
      leadWave: 'sawtooth',
      arpPattern: [0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1],
      useDelay: false,
      filterQ: 15,
      drumStyle: 'standard',
    },
    // Sludge Factory (85 BPM) - Phrygian Dominant: dark, heavy
    sludge: {
      tempo: 85,
      bassFreqs: [36.71, 38.89, 46.25, 36.71],
      leadFreqs: [146.83, 155.56, 185.00, 220.00],
      bassWave: 'sawtooth',
      leadWave: 'square',
      arpPattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      useDelay: true,
      filterQ: 1,
      drumStyle: 'distorted',
    },
    // Deep Focus (120 BPM) - Pentatonic: steady, clean
    focus: {
      tempo: 120,
      bassFreqs: [55.00, 55.00, 65.41, 48.99],
      leadFreqs: [440.00, 523.25, 659.25, 880.00],
      bassWave: 'square',
      leadWave: 'sine',
      arpPattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      useDelay: true,
      filterQ: 0,
      drumStyle: 'bit',
    },
    // Crystalline (95 BPM) - Lydian mode: dreamy, sci-fi
    crystal: {
      tempo: 95,
      bassFreqs: [73.42, 82.41, 110.00, 123.47],
      leadFreqs: [587.33, 739.99, 880.00, 1108.73],
      bassWave: 'sine',
      leadWave: 'triangle',
      arpPattern: [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
      useDelay: true,
      filterQ: 0,
      drumStyle: 'soft',
    },
    // Biohazard (108 BPM) - Chromatic/Dissonant: aggressive
    hazard: {
      tempo: 108,
      bassFreqs: [55, 58.27, 55, 61.74],
      leadFreqs: [440, 466.16, 311.13, 622.25],
      bassWave: 'sawtooth',
      leadWave: 'sawtooth',
      arpPattern: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0],
      useDelay: false,
      filterQ: 25,
      drumStyle: 'distorted',
    },
    // Festival EDM (128 BPM) - F Major: energetic finale
    energetic: {
      tempo: 128,
      bassFreqs: [87.31, 87.31, 130.81, 110.00],
      leadFreqs: [349.23, 440.00, 523.25, 698.46, 880.00],
      bassWave: 'sawtooth',
      leadWave: 'sawtooth',
      arpPattern: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
      useDelay: true,
      filterQ: 8,
      drumStyle: 'standard',
    },
  };

  constructor() {
    this.currentPreset = this.presets.noir;
  }

  private initAudioContext(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.audioContext.destination);

      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

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

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.noteIndex = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.1;
    this.scheduler();
  }

  stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
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
    return this.currentPreset.tempo;
  }

  setStyle(style: MusicStyle): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stop();
    }

    this.currentStyle = style;
    this.currentPreset = this.presets[style];

    if (wasPlaying) {
      this.start();
    }
  }

  setStyleForLevel(levelId: number): void {
    const style = LEVEL_MUSIC[levelId] || 'noir';
    this.setStyle(style);
  }

  getStyle(): MusicStyle {
    return this.currentStyle;
  }

  getStyleName(): string {
    const names: Record<MusicStyle, string> = {
      noir: 'Neon Noir',
      funk: 'Cyber Funk',
      sludge: 'Sludge Factory',
      focus: 'Deep Focus',
      crystal: 'Crystalline',
      hazard: 'Biohazard',
      energetic: 'Festival EDM',
    };
    return names[this.currentStyle];
  }

  // --- SCHEDULER (from Neon Pulse Engine) ---

  private scheduler(): void {
    if (!this.audioContext) return;

    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.noteIndex, this.nextNoteTime);
      this.nextNote();
    }
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private nextNote(): void {
    const secondsPerBeat = 60.0 / this.currentPreset.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.noteIndex++;
    if (this.noteIndex === 16) {
      this.noteIndex = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number): void {
    if (this.isMuted) return;

    const p = this.currentPreset;

    // Fire beat callback for visual sync
    if (this.beatCallback) {
      this.beatCallback(beatNumber);
    }

    // --- KICK ---
    let playKick = false;
    if (p.drumStyle === 'distorted') {
      if (beatNumber === 0 || beatNumber === 10) playKick = true;
    } else if (p.drumStyle === 'soft') {
      if (beatNumber === 0 || beatNumber === 8) playKick = true;
    } else {
      if (beatNumber % 4 === 0) playKick = true;
    }

    if (playKick) {
      this.playKick(time, p.drumStyle === 'distorted' ? 1.2 : 0.8);
    }

    // --- SNARE ---
    if (beatNumber % 8 === 4) {
      this.playSnare(time);
    }

    // --- HATS ---
    if (p.drumStyle !== 'soft') {
      if (beatNumber % 2 === 0) this.playHiHat(time, 0.05);
      else this.playHiHat(time, 0.02);
    } else {
      if (beatNumber % 4 === 2) this.playHiHat(time, 0.1);
    }

    // --- BASS ---
    if (p.drumStyle === 'distorted') {
      if (beatNumber === 0 || beatNumber === 10) {
        const freq = p.bassFreqs[Math.floor(Math.random() * p.bassFreqs.length)];
        this.playBass(time, freq, 0.8);
      }
    } else {
      if (beatNumber % 4 !== 0 || p.tempo > 110) {
        const freq = p.bassFreqs[Math.floor(Math.random() * p.bassFreqs.length)];
        this.playBass(time, freq, 0.25);
      }
    }

    // --- LEAD ---
    if (p.arpPattern[beatNumber]) {
      const note = p.leadFreqs[Math.floor(Math.random() * p.leadFreqs.length)];
      this.playLead(time, note);
    }
  }

  // --- SYNTHESIZERS ---

  private playKick(time: number, vol: number): void {
    if (!this.audioContext || !this.musicGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(vol * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number): void {
    if (!this.audioContext || !this.musicGain) return;

    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    if (this.currentPreset.drumStyle === 'bit') {
      filter.type = 'lowpass';
      filter.frequency.value = 3000;
    } else {
      filter.type = 'highpass';
      filter.frequency.value = 1000;
    }

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.5 * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(time);
  }

  private playHiHat(time: number, duration: number): void {
    if (!this.audioContext || !this.musicGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = this.currentPreset.drumStyle === 'bit' ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(800, time);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    gain.gain.setValueAtTime(0.1 * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  private playBass(time: number, freq: number, duration: number): void {
    if (!this.audioContext || !this.musicGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = this.currentPreset.bassWave;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.Q.value = this.currentPreset.filterQ;
    filter.frequency.setValueAtTime(freq * 3, time);
    filter.frequency.exponentialRampToValueAtTime(freq, time + duration);

    gain.gain.setValueAtTime(0.4 * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  private playLead(time: number, freq: number): void {
    if (!this.audioContext || !this.musicGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = this.currentPreset.leadWave;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.1 * this.musicVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    if (this.currentPreset.useDelay) {
      const osc2 = this.audioContext.createOscillator();
      osc2.type = this.currentPreset.leadWave;
      osc2.frequency.setValueAtTime(freq + 3, time);

      const delay = this.audioContext.createDelay();
      delay.delayTime.value = 0.30;
      const delayGain = this.audioContext.createGain();
      delayGain.gain.value = 0.3;

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.musicGain);
      gain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.musicGain);
      osc2.start(time);
      osc2.stop(time + 0.2);
    } else {
      osc.connect(gain);
      gain.connect(this.musicGain);
    }
    osc.start(time);
    osc.stop(time + 0.2);
  }

  // --- SOUND EFFECTS ---

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
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.35);
  }

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
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  playLevelComplete(): void {
    this.initAudioContext();
    if (!this.audioContext || !this.sfxGain) return;

    const time = this.audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];

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
      gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.12 + 0.5);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time + i * 0.12);
      osc2.start(time + i * 0.12);
      osc.stop(time + i * 0.12 + 0.6);
      osc2.stop(time + i * 0.12 + 0.6);
    });
  }

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
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  playUnlock(): void {
    this.initAudioContext();
    if (!this.audioContext || !this.sfxGain) return;

    const time = this.audioContext.currentTime;
    const notes = [523.25, 783.99, 1046.50];

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.2, time + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(time + i * 0.08);
      osc.stop(time + i * 0.08 + 0.25);
    });
  }
}
