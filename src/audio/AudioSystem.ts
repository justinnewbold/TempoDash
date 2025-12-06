import { BeatConfig } from '../types';
import { CONFIG } from '../constants';

// Music pattern types for different instruments
interface MusicPattern {
  kick: number[];
  snare: number[];
  hihat: number[];
  bass: number[];
  melody: number[];
  pad: number[];
  arp: number[];
}

// Level-specific music configurations
interface LevelMusic {
  name: string;
  bpm: number;
  pattern: MusicPattern;
  bassNotes: number[];
  melodyNotes: number[];
  padChord: number[];
  arpNotes: number[];
  style: 'synthwave' | 'uplifting' | 'ambient' | 'space' | 'intense' | 'glitch';
}

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicGain: GainNode | null = null;

  public enabled = true;
  public initialized = false;
  public currentBPM = CONFIG.BASE_BPM;
  public jumpCount = 0;
  private beatCount = 0;

  private beatConfig: BeatConfig | null = null;
  private currentLevel = 1;

  // Music scheduling
  private musicPlaying = false;
  private musicStartTime = 0;
  private nextBeatTime = 0;
  private schedulerInterval: number | null = null;
  private currentMusicBeat = 0;
  private readonly scheduleAheadTime = 0.1; // Schedule 100ms ahead
  private readonly lookahead = 25; // Check every 25ms

  // Beat patterns (original - used for jump sounds)
  private readonly kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
  private readonly snarePattern = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
  private readonly bassPattern = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0];

  // Level music configurations
  private readonly levelMusic: LevelMusic[] = [
    // Level 1: City Nights - Synthwave
    {
      name: 'City Nights',
      bpm: 110,
      pattern: {
        kick:   [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        snare:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat:  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        bass:   [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
        melody: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        pad:    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        arp:    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
      },
      bassNotes: [55, 55, 73.42, 73.42, 65.41, 65.41, 82.41, 73.42], // A1, D2, C2, E2 pattern
      melodyNotes: [440, 523.25, 659.25, 523.25, 392, 440, 523.25, 392], // A4, C5, E5 synthwave lead
      padChord: [220, 277.18, 329.63], // A minor chord
      arpNotes: [880, 1108.73, 1318.51, 1108.73, 880, 659.25, 880, 1108.73], // High synth arp
      style: 'synthwave'
    },
    // Level 2: Neon Dreams - Uplifting Trance
    {
      name: 'Neon Dreams',
      bpm: 138,
      pattern: {
        kick:   [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        snare:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat:  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        bass:   [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        melody: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        pad:    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        arp:    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      },
      bassNotes: [65.41, 65.41, 87.31, 87.31, 73.42, 73.42, 98, 87.31], // C2-F2-D2-G2
      melodyNotes: [523.25, 659.25, 783.99, 659.25, 523.25, 783.99, 659.25, 523.25], // C5-E5-G5 uplifting
      padChord: [261.63, 329.63, 392], // C major
      arpNotes: [1046.5, 1318.51, 1567.98, 1318.51, 1046.5, 783.99, 1046.5, 1318.51], // Fast trance arp
      style: 'uplifting'
    },
    // Level 3: Crystal Caverns - Ambient/Mystical
    {
      name: 'Crystal Caverns',
      bpm: 90,
      pattern: {
        kick:   [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        bass:   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        melody: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        pad:    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        arp:    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0]
      },
      bassNotes: [49, 49, 55, 55, 41.2, 41.2, 49, 55], // G1-A1-E1 cave bass
      melodyNotes: [392, 493.88, 587.33, 493.88, 392, 587.33, 493.88, 392], // G4-B4-D5 mysterious
      padChord: [196, 246.94, 293.66], // G minor (cave mood)
      arpNotes: [783.99, 987.77, 1174.66, 783.99, 587.33, 783.99, 987.77, 587.33], // Crystal chimes
      style: 'ambient'
    },
    // Level 4: Zero-G Station - Space/Floaty
    {
      name: 'Zero-G Station',
      bpm: 100,
      pattern: {
        kick:   [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        hihat:  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
        bass:   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        melody: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        pad:    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        arp:    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
      },
      bassNotes: [73.42, 73.42, 82.41, 82.41, 61.74, 61.74, 73.42, 82.41], // D2-E2-B1 space bass
      melodyNotes: [587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25], // D5 lydian floaty
      padChord: [293.66, 369.99, 440], // D major (bright/hopeful)
      arpNotes: [1174.66, 1318.51, 1567.98, 1760, 1567.98, 1318.51, 1174.66, 987.77], // Ethereal high
      style: 'space'
    },
    // Level 5: Storm Surge - Intense/Driving
    {
      name: 'Storm Surge',
      bpm: 150,
      pattern: {
        kick:   [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        snare:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        bass:   [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
        melody: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
        pad:    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        arp:    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
      },
      bassNotes: [82.41, 82.41, 73.42, 73.42, 65.41, 65.41, 73.42, 82.41], // E2-D2-C2 powerful
      melodyNotes: [659.25, 783.99, 659.25, 523.25, 659.25, 783.99, 880, 783.99], // E5 phrygian aggressive
      padChord: [329.63, 392, 493.88], // E minor
      arpNotes: [1318.51, 1567.98, 1318.51, 1046.5, 1318.51, 1567.98, 1760, 1567.98], // Intense stabs
      style: 'intense'
    },
    // Level 6: Digital Realm - Glitch/Electronic
    {
      name: 'Digital Realm',
      bpm: 140,
      pattern: {
        kick:   [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        snare:  [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
        hihat:  [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
        bass:   [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        melody: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1],
        pad:    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        arp:    [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1]
      },
      bassNotes: [87.31, 87.31, 73.42, 73.42, 98, 98, 82.41, 87.31], // F2-D2-G2-E2 glitchy
      melodyNotes: [698.46, 783.99, 523.25, 659.25, 698.46, 880, 783.99, 698.46], // F5 blues digital
      padChord: [349.23, 415.30, 523.25], // F minor (dark digital)
      arpNotes: [1396.91, 1567.98, 1046.5, 1318.51, 1396.91, 1760, 1567.98, 1396.91], // Glitchy arp
      style: 'glitch'
    }
  ];

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);

      // Separate gain for music (can be mixed differently)
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35; // Music slightly quieter than SFX
      this.musicGain.connect(this.masterGain);

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

  setLevelConfig(config: BeatConfig, levelId: number = 1): void {
    this.beatConfig = config;
    this.currentLevel = levelId;
  }

  start(): void {
    if (!this.initialized) return;
    this.jumpCount = 0;
    this.beatCount = 0;
    this.currentBPM = CONFIG.BASE_BPM;
    this.startMusic();
  }

  stop(): void {
    this.stopMusic();
  }

  // ============== MUSIC SYSTEM ==============

  startMusic(): void {
    if (!this.initialized || !this.ctx || !this.enabled) return;
    if (this.musicPlaying) return;

    this.musicPlaying = true;
    this.currentMusicBeat = 0;
    this.musicStartTime = this.ctx.currentTime;
    this.nextBeatTime = this.musicStartTime;

    // Start the scheduler
    this.schedulerInterval = window.setInterval(() => {
      this.scheduleMusicBeat();
    }, this.lookahead);
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.schedulerInterval !== null) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  private scheduleMusicBeat(): void {
    if (!this.ctx || !this.musicPlaying || !this.enabled) return;

    const music = this.levelMusic[this.currentLevel - 1] || this.levelMusic[0];
    const secondsPerBeat = 60 / music.bpm;

    // Schedule beats ahead of time for smooth playback
    while (this.nextBeatTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.playMusicBeat(this.nextBeatTime, this.currentMusicBeat, music);
      this.nextBeatTime += secondsPerBeat;
      this.currentMusicBeat = (this.currentMusicBeat + 1) % 16;
    }
  }

  private playMusicBeat(time: number, beat: number, music: LevelMusic): void {
    if (!this.ctx || !this.musicGain) return;

    const pattern = music.pattern;
    const barBeat = beat % 16;
    const measureBeat = Math.floor(beat / 4) % 8; // For chord/note changes

    // Play each instrument based on pattern
    if (pattern.kick[barBeat]) this.playMusicKick(time, music.style);
    if (pattern.snare[barBeat]) this.playMusicSnare(time, music.style);
    if (pattern.hihat[barBeat]) this.playMusicHiHat(time, music.style);
    if (pattern.bass[barBeat]) this.playMusicBass(time, music.bassNotes[measureBeat], music.style);
    if (pattern.melody[barBeat]) this.playMusicMelody(time, music.melodyNotes[measureBeat], music.style);
    if (pattern.pad[barBeat]) this.playMusicPad(time, music.padChord, music.style);
    if (pattern.arp[barBeat]) this.playMusicArp(time, music.arpNotes[barBeat % music.arpNotes.length], music.style);
  }

  private playMusicKick(time: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';

    // Different kick character per style
    const kickFreq = style === 'intense' ? 160 : style === 'ambient' ? 80 : 120;
    const decay = style === 'ambient' ? 0.2 : 0.15;

    osc.frequency.setValueAtTime(kickFreq, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + decay);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + decay);
  }

  private playMusicSnare(time: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = style === 'glitch' ? 6000 : 4000;

    const gain = this.ctx.createGain();
    const vol = style === 'ambient' ? 0.2 : 0.35;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(time);
    noise.stop(time + 0.1);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(style === 'glitch' ? 250 : 180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.04);
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(oscGain);
    oscGain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  private playMusicHiHat(time: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = style === 'ambient' ? 10000 : 8000;

    const gain = this.ctx.createGain();
    const vol = style === 'intense' ? 0.12 : style === 'ambient' ? 0.06 : 0.1;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(time);
    noise.stop(time + 0.04);
  }

  private playMusicBass(time: number, freq: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Different bass character per style
    osc.type = style === 'synthwave' || style === 'glitch' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(style === 'intense' ? 600 : 400, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.15);
    filter.Q.value = style === 'synthwave' ? 10 : 5;

    const vol = style === 'ambient' ? 0.25 : 0.4;
    const decay = style === 'space' ? 0.25 : 0.15;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + decay);
  }

  private playMusicMelody(time: number, freq: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Different lead sound per style
    switch (style) {
      case 'synthwave':
        osc.type = 'sawtooth';
        filter.frequency.value = 2000;
        break;
      case 'uplifting':
        osc.type = 'square';
        filter.frequency.value = 3000;
        break;
      case 'ambient':
        osc.type = 'sine';
        filter.frequency.value = 1500;
        break;
      case 'space':
        osc.type = 'triangle';
        filter.frequency.value = 2500;
        break;
      case 'intense':
        osc.type = 'sawtooth';
        filter.frequency.value = 4000;
        break;
      case 'glitch':
        osc.type = 'square';
        filter.frequency.value = 3500;
        break;
      default:
        osc.type = 'sine';
        filter.frequency.value = 2000;
    }

    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';

    const vol = style === 'ambient' ? 0.1 : 0.15;
    const decay = style === 'ambient' || style === 'space' ? 0.3 : 0.15;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + decay);
  }

  private playMusicPad(time: number, chord: number[], style: string): void {
    if (!this.ctx || !this.musicGain) return;

    // Pads are sustained chords - play all notes of the chord
    chord.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = style === 'glitch' ? 'square' : 'sine';
      osc.frequency.value = freq;

      // Slight detune for richness
      osc.detune.value = (i - 1) * 5;

      filter.type = 'lowpass';
      filter.frequency.value = style === 'ambient' ? 800 : 1200;

      const vol = 0.06 / chord.length;
      const attackTime = style === 'ambient' || style === 'space' ? 0.3 : 0.1;
      const sustainTime = style === 'ambient' ? 1.5 : 0.8;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + attackTime);
      gain.gain.linearRampToValueAtTime(vol * 0.7, time + sustainTime);
      gain.gain.exponentialRampToValueAtTime(0.001, time + sustainTime + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + sustainTime + 0.5);
    });
  }

  private playMusicArp(time: number, freq: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Arps are short, bright notes
    osc.type = style === 'glitch' ? 'square' : 'sine';
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = style === 'ambient' ? 2000 : 4000;

    const vol = style === 'uplifting' ? 0.08 : 0.05;
    const decay = style === 'glitch' ? 0.05 : 0.08;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + decay);
  }

  // Get beat time for syncing gameplay
  getBeatTime(): number {
    if (!this.ctx || !this.musicPlaying) return 0;
    const music = this.levelMusic[this.currentLevel - 1] || this.levelMusic[0];
    const secondsPerBeat = 60 / music.bpm;
    const elapsed = this.ctx.currentTime - this.musicStartTime;
    return elapsed % secondsPerBeat;
  }

  getMusicBPM(): number {
    const music = this.levelMusic[this.currentLevel - 1] || this.levelMusic[0];
    return music.bpm;
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

  playPerfectBeat(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // Bright, satisfying "ding" for perfect timing
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.1);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.25, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start(time);
    osc.stop(time + 0.15);

    // Add harmonic for richness
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.value = 1800;

    gain2.gain.setValueAtTime(0, time);
    gain2.gain.linearRampToValueAtTime(0.1, time + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc2.connect(gain2);
    gain2.connect(this.compressor);
    osc2.start(time);
    osc2.stop(time + 0.1);
  }

  playGemCollect(gemType: string): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // Different sounds based on gem type
    let baseFreq = 800;
    let duration = 0.15;

    if (gemType === 'super') {
      baseFreq = 1000;
      duration = 0.25;
    } else if (gemType === 'rare') {
      baseFreq = 900;
      duration = 0.2;
    }

    // Sparkly ascending notes
    const notes = gemType === 'super' ? [0, 4, 7, 12] : (gemType === 'rare' ? [0, 4, 7] : [0, 4]);

    notes.forEach((semitone, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = baseFreq * Math.pow(2, semitone / 12);

      const t = time + i * 0.04;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.compressor!);
      osc.start(t);
      osc.stop(t + duration);
    });

    // Add shimmer for rare/super
    if (gemType !== 'normal') {
      const shimmer = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();

      shimmer.type = 'sine';
      shimmer.frequency.value = 2000 + Math.random() * 500;

      shimmerGain.gain.setValueAtTime(0, time + 0.05);
      shimmerGain.gain.linearRampToValueAtTime(0.1, time + 0.08);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.compressor);
      shimmer.start(time + 0.05);
      shimmer.stop(time + 0.2);
    }
  }

  playMilestone(milestoneValue: number): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // Grand fanfare - more elaborate for higher milestones
    const intensity = Math.min(milestoneValue / 1000, 3); // Scale with milestone value

    // Rising arpeggio chord
    const notes = [0, 4, 7, 12, 16]; // Major chord with octave
    notes.forEach((semitone, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      const baseFreq = 440 + intensity * 100;
      osc.type = 'sine';
      osc.frequency.value = baseFreq * Math.pow(2, semitone / 12);

      const t = time + i * 0.04;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.compressor!);
      osc.start(t);
      osc.stop(t + 0.4);
    });

    // Shimmering high notes
    for (let i = 0; i < 3 + intensity; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 1200 + Math.random() * 800;

      const t = time + 0.15 + i * 0.03;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    // Final triumphant note
    const finalOsc = this.ctx.createOscillator();
    const finalGain = this.ctx.createGain();

    finalOsc.type = 'sine';
    finalOsc.frequency.value = 880 + intensity * 110;

    const finalT = time + 0.3;
    finalGain.gain.setValueAtTime(0, finalT);
    finalGain.gain.linearRampToValueAtTime(0.25, finalT + 0.05);
    finalGain.gain.exponentialRampToValueAtTime(0.001, finalT + 0.5);

    finalOsc.connect(finalGain);
    finalGain.connect(this.compressor);
    finalOsc.start(finalT);
    finalOsc.stop(finalT + 0.5);
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopMusic();
    }
    return this.enabled;
  }
}
