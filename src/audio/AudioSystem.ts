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

  // Reverb effect nodes (reserved for future use)
  // @ts-ignore - reserved for reverb implementation
  private _reverbGain: GainNode | null = null;
  // @ts-ignore - reserved for reverb implementation
  private _reverbDelays: DelayNode[] = [];
  // @ts-ignore - reserved for reverb implementation
  private _reverbFeedback: GainNode | null = null;

  // Effects (reserved for future use)
  // @ts-ignore - reserved for filter effects
  private _filterNode: BiquadFilterNode | null = null;
  // @ts-ignore - reserved for LFO modulation
  private _filterLFO: OscillatorNode | null = null;

  public enabled = true;
  public initialized = false;
  public currentBPM = CONFIG.BASE_BPM;
  public jumpCount = 0;
  private beatCount = 0;

  // Volume controls
  private musicVolume = 0.35;
  private sfxVolume = 0.6;

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

    // Only play ambient layer on schedule (pads and arps)
    // Beats (kick, snare, hihat, bass, melody) are triggered by player jumps
    if (pattern.pad[barBeat]) this.playMusicPad(time, music.padChord, music.style);
    if (pattern.arp[barBeat]) this.playMusicArp(time, music.arpNotes[barBeat % music.arpNotes.length], music.style);
  }

  // Play beat elements on player jump
  playBeatOnJump(): void {
    if (!this.ctx || !this.musicGain || !this.musicPlaying) return;

    const music = this.levelMusic[this.currentLevel - 1] || this.levelMusic[0];
    const time = this.ctx.currentTime;
    const beat = this.jumpCount % 16;
    const measureBeat = Math.floor(this.jumpCount / 4) % 8;

    // Always play kick on jump - this is the core rhythm
    this.playMusicKick(time, music.style);

    // Play other elements based on pattern position
    if (music.pattern.snare[beat]) this.playMusicSnare(time, music.style);
    if (music.pattern.hihat[beat]) this.playMusicHiHat(time, music.style);
    if (music.pattern.bass[beat]) this.playMusicBass(time, music.bassNotes[measureBeat], music.style);
    if (music.pattern.melody[beat]) this.playMusicMelody(time, music.melodyNotes[measureBeat], music.style);
  }

  private playMusicKick(time: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    // Layered kick: sub bass + body + click transient
    const isIntense = style === 'intense';
    const isAmbient = style === 'ambient';

    // Sub bass layer (deep low end)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isIntense ? 65 : 55, time);
    subOsc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
    subGain.gain.setValueAtTime(isAmbient ? 0.5 : 0.7, time);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    subOsc.connect(subGain);
    subGain.connect(this.musicGain);
    subOsc.start(time);
    subOsc.stop(time + 0.2);

    // Body layer (punch)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(isIntense ? 180 : 150, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(50, time + 0.08);
    bodyGain.gain.setValueAtTime(isAmbient ? 0.4 : 0.6, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.musicGain);
    bodyOsc.start(time);
    bodyOsc.stop(time + 0.1);

    // Click transient (attack definition)
    if (!isAmbient) {
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      const clickFilter = this.ctx.createBiquadFilter();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(2500, time);
      clickOsc.frequency.exponentialRampToValueAtTime(200, time + 0.015);
      clickFilter.type = 'highpass';
      clickFilter.frequency.value = 500;
      clickGain.gain.setValueAtTime(0.15, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      clickOsc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(this.musicGain);
      clickOsc.start(time);
      clickOsc.stop(time + 0.02);
    }
  }

  private playMusicSnare(time: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const isGlitch = style === 'glitch';
    const isAmbient = style === 'ambient';
    const isIntense = style === 'intense';

    // 1. Tonal body (the "thump" of the snare)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(isGlitch ? 280 : 220, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(120, time + 0.03);
    bodyGain.gain.setValueAtTime(isAmbient ? 0.3 : 0.5, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.musicGain);
    bodyOsc.start(time);
    bodyOsc.stop(time + 0.06);

    // 2. Noise body (the "crack" of the snare)
    const noiseLen = isGlitch ? 0.08 : 0.12;
    const noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * noiseLen, this.ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = isGlitch ? 5500 : 3500;
    noiseFilter.Q.value = 1.2;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isAmbient ? 0.2 : 0.35, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseLen);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.musicGain);
    noiseSource.start(time);
    noiseSource.stop(time + noiseLen);

    // 3. Snare rattle (high-frequency sizzle)
    const rattleLen = 0.15;
    const rattleBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * rattleLen, this.ctx.sampleRate);
    const rattleData = rattleBuf.getChannelData(0);
    for (let i = 0; i < rattleData.length; i++) {
      rattleData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rattleData.length, 1.5);
    }

    const rattleSource = this.ctx.createBufferSource();
    rattleSource.buffer = rattleBuf;

    const rattleFilter = this.ctx.createBiquadFilter();
    rattleFilter.type = 'highpass';
    rattleFilter.frequency.value = 6000;

    const rattleGain = this.ctx.createGain();
    rattleGain.gain.setValueAtTime(isAmbient ? 0.08 : (isIntense ? 0.18 : 0.12), time);
    rattleGain.gain.exponentialRampToValueAtTime(0.001, time + rattleLen);

    rattleSource.connect(rattleFilter);
    rattleFilter.connect(rattleGain);
    rattleGain.connect(this.musicGain);
    rattleSource.start(time);
    rattleSource.stop(time + rattleLen);

    // 4. Click transient (attack pop)
    if (!isAmbient) {
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(1800, time);
      clickOsc.frequency.exponentialRampToValueAtTime(400, time + 0.01);
      clickGain.gain.setValueAtTime(0.25, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      clickOsc.connect(clickGain);
      clickGain.connect(this.musicGain);
      clickOsc.start(time);
      clickOsc.stop(time + 0.015);
    }
  }

  private playMusicHiHat(time: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const isAmbient = style === 'ambient';
    const isIntense = style === 'intense';
    const isGlitch = style === 'glitch';
    const decay = isAmbient ? 0.06 : 0.04;

    // 1. Metallic resonance layer (gives the "ting" character)
    const metalFreqs = isGlitch ? [6500, 8200, 11000] : [5200, 7400, 9800];
    metalFreqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.value = freq + (Math.random() - 0.5) * 200;
      const vol = (isAmbient ? 0.02 : 0.04) / (i + 1);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.8);
      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(time);
      osc.stop(time + decay);
    });

    // 2. Noise layer (the "shhh" character)
    const noiseLen = decay * 1.2;
    const noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * noiseLen, this.ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseData.length, 2);
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    // Bandpass for characteristic hi-hat sound
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = isAmbient ? 10000 : 8500;
    bandpass.Q.value = 0.8;

    // High shelf to add brightness
    const highShelf = this.ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 10000;
    highShelf.gain.value = isIntense ? 6 : 3;

    const noiseGain = this.ctx.createGain();
    const vol = isIntense ? 0.14 : (isAmbient ? 0.06 : 0.1);
    noiseGain.gain.setValueAtTime(vol, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseLen);

    noiseSource.connect(bandpass);
    bandpass.connect(highShelf);
    highShelf.connect(noiseGain);
    noiseGain.connect(this.musicGain);
    noiseSource.start(time);
    noiseSource.stop(time + noiseLen);
  }

  private playMusicBass(time: number, freq: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const isSynthwave = style === 'synthwave';
    const isGlitch = style === 'glitch';
    const isAmbient = style === 'ambient';
    const isSpace = style === 'space';
    const isIntense = style === 'intense';
    const decay = isSpace ? 0.3 : (isAmbient ? 0.25 : 0.18);
    const baseVol = isAmbient ? 0.2 : 0.35;

    // Sub bass layer (pure sine, low fundamental)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.value = freq;
    subGain.gain.setValueAtTime(baseVol * 0.6, time);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    subOsc.connect(subGain);
    subGain.connect(this.musicGain);
    subOsc.start(time);
    subOsc.stop(time + decay);

    // Main bass oscillator with harmonics
    const mainOsc = this.ctx.createOscillator();
    const mainGain = this.ctx.createGain();
    const mainFilter = this.ctx.createBiquadFilter();

    mainOsc.type = (isSynthwave || isGlitch || isIntense) ? 'sawtooth' : 'triangle';
    mainOsc.frequency.value = freq;

    mainFilter.type = 'lowpass';
    mainFilter.frequency.setValueAtTime(isIntense ? 800 : (isSynthwave ? 600 : 400), time);
    mainFilter.frequency.exponentialRampToValueAtTime(80, time + decay * 0.8);
    mainFilter.Q.value = isSynthwave ? 12 : (isIntense ? 8 : 4);

    mainGain.gain.setValueAtTime(baseVol * 0.5, time);
    mainGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    mainOsc.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(this.musicGain);
    mainOsc.start(time);
    mainOsc.stop(time + decay);

    // Detune layer for thickness (slight pitch offset)
    if (!isAmbient) {
      const detuneOsc = this.ctx.createOscillator();
      const detuneGain = this.ctx.createGain();
      const detuneFilter = this.ctx.createBiquadFilter();

      detuneOsc.type = 'sawtooth';
      detuneOsc.frequency.value = freq;
      detuneOsc.detune.value = isGlitch ? 15 : 8; // Slight detune for width

      detuneFilter.type = 'lowpass';
      detuneFilter.frequency.setValueAtTime(500, time);
      detuneFilter.frequency.exponentialRampToValueAtTime(100, time + decay * 0.7);

      detuneGain.gain.setValueAtTime(baseVol * 0.25, time);
      detuneGain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.9);

      detuneOsc.connect(detuneFilter);
      detuneFilter.connect(detuneGain);
      detuneGain.connect(this.musicGain);
      detuneOsc.start(time);
      detuneOsc.stop(time + decay);
    }

    // Click transient for attack definition
    if (isSynthwave || isIntense || isGlitch) {
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.value = freq * 4;
      clickGain.gain.setValueAtTime(0.08, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      clickOsc.connect(clickGain);
      clickGain.connect(this.musicGain);
      clickOsc.start(time);
      clickOsc.stop(time + 0.015);
    }
  }

  private playMusicMelody(time: number, freq: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const isSynthwave = style === 'synthwave';
    const isUplifting = style === 'uplifting';
    const isAmbient = style === 'ambient';
    const isSpace = style === 'space';
    const isIntense = style === 'intense';
    const isGlitch = style === 'glitch';

    const decay = (isAmbient || isSpace) ? 0.35 : 0.2;
    const baseVol = isAmbient ? 0.08 : 0.12;

    // Main oscillator
    const mainOsc = this.ctx.createOscillator();
    const mainGain = this.ctx.createGain();
    const mainFilter = this.ctx.createBiquadFilter();

    // Style-specific oscillator type
    if (isSynthwave || isIntense) mainOsc.type = 'sawtooth';
    else if (isUplifting || isGlitch) mainOsc.type = 'square';
    else if (isSpace) mainOsc.type = 'triangle';
    else mainOsc.type = 'sine';

    mainOsc.frequency.value = freq;

    mainFilter.type = 'lowpass';
    mainFilter.frequency.setValueAtTime(isIntense ? 4000 : (isSynthwave ? 2500 : 2000), time);
    mainFilter.frequency.exponentialRampToValueAtTime(800, time + decay * 0.7);
    mainFilter.Q.value = isSynthwave ? 4 : 2;

    mainGain.gain.setValueAtTime(0, time);
    mainGain.gain.linearRampToValueAtTime(baseVol, time + 0.008);
    mainGain.gain.setValueAtTime(baseVol * 0.8, time + 0.05);
    mainGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    mainOsc.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(this.musicGain);
    mainOsc.start(time);
    mainOsc.stop(time + decay);

    // Detuned layer for richness (supersaw effect)
    if (!isAmbient) {
      [-12, 12].forEach(detuneCents => {
        const detOsc = this.ctx!.createOscillator();
        const detGain = this.ctx!.createGain();
        const detFilter = this.ctx!.createBiquadFilter();

        detOsc.type = mainOsc.type;
        detOsc.frequency.value = freq;
        detOsc.detune.value = detuneCents;

        detFilter.type = 'lowpass';
        detFilter.frequency.value = 1800;

        detGain.gain.setValueAtTime(0, time);
        detGain.gain.linearRampToValueAtTime(baseVol * 0.3, time + 0.01);
        detGain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.9);

        detOsc.connect(detFilter);
        detFilter.connect(detGain);
        detGain.connect(this.musicGain!);
        detOsc.start(time);
        detOsc.stop(time + decay);
      });
    }

    // Sub octave for fullness (subtle)
    if (isSynthwave || isUplifting || isIntense) {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.value = freq / 2;
      subGain.gain.setValueAtTime(0, time);
      subGain.gain.linearRampToValueAtTime(baseVol * 0.2, time + 0.02);
      subGain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.7);
      subOsc.connect(subGain);
      subGain.connect(this.musicGain);
      subOsc.start(time);
      subOsc.stop(time + decay);
    }

    // High harmonic shimmer for bright styles
    if (isUplifting || isGlitch) {
      const shimmerOsc = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.value = freq * 2;
      shimmerGain.gain.setValueAtTime(0, time);
      shimmerGain.gain.linearRampToValueAtTime(baseVol * 0.15, time + 0.005);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.5);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(this.musicGain);
      shimmerOsc.start(time);
      shimmerOsc.stop(time + decay);
    }
  }

  private playMusicPad(time: number, chord: number[], style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const isAmbient = style === 'ambient';
    const isSpace = style === 'space';
    const isGlitch = style === 'glitch';
    const attackTime = (isAmbient || isSpace) ? 0.4 : 0.15;
    const sustainTime = isAmbient ? 1.8 : 1.0;
    const releaseTime = isAmbient ? 0.8 : 0.5;
    const totalTime = sustainTime + releaseTime;
    const baseVol = 0.05 / chord.length;

    // Play each note in the chord with multiple layers
    chord.forEach((freq, noteIndex) => {
      // Layer 1: Main sine wave (warm foundation)
      const mainOsc = this.ctx!.createOscillator();
      const mainGain = this.ctx!.createGain();
      const mainFilter = this.ctx!.createBiquadFilter();

      mainOsc.type = 'sine';
      mainOsc.frequency.value = freq;
      mainOsc.detune.value = (noteIndex - 1) * 3;

      mainFilter.type = 'lowpass';
      mainFilter.frequency.value = isAmbient ? 600 : 900;
      mainFilter.Q.value = 0.5;

      mainGain.gain.setValueAtTime(0, time);
      mainGain.gain.linearRampToValueAtTime(baseVol, time + attackTime);
      mainGain.gain.setValueAtTime(baseVol * 0.85, time + sustainTime);
      mainGain.gain.exponentialRampToValueAtTime(0.001, time + totalTime);

      mainOsc.connect(mainFilter);
      mainFilter.connect(mainGain);
      mainGain.connect(this.musicGain!);
      mainOsc.start(time);
      mainOsc.stop(time + totalTime);

      // Layer 2: Detuned saw/triangle for shimmer
      [-8, 8].forEach(detune => {
        const shimmerOsc = this.ctx!.createOscillator();
        const shimmerGain = this.ctx!.createGain();
        const shimmerFilter = this.ctx!.createBiquadFilter();

        shimmerOsc.type = isGlitch ? 'square' : 'triangle';
        shimmerOsc.frequency.value = freq;
        shimmerOsc.detune.value = detune + (noteIndex - 1) * 2;

        shimmerFilter.type = 'lowpass';
        shimmerFilter.frequency.value = isAmbient ? 1000 : 1500;

        shimmerGain.gain.setValueAtTime(0, time);
        shimmerGain.gain.linearRampToValueAtTime(baseVol * 0.35, time + attackTime * 1.2);
        shimmerGain.gain.setValueAtTime(baseVol * 0.3, time + sustainTime);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, time + totalTime);

        shimmerOsc.connect(shimmerFilter);
        shimmerFilter.connect(shimmerGain);
        shimmerGain.connect(this.musicGain!);
        shimmerOsc.start(time);
        shimmerOsc.stop(time + totalTime);
      });

      // Layer 3: Sub octave for depth (only on root notes)
      if (noteIndex === 0) {
        const subOsc = this.ctx!.createOscillator();
        const subGain = this.ctx!.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.value = freq / 2;
        subGain.gain.setValueAtTime(0, time);
        subGain.gain.linearRampToValueAtTime(baseVol * 0.4, time + attackTime * 1.5);
        subGain.gain.setValueAtTime(baseVol * 0.35, time + sustainTime);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + totalTime);
        subOsc.connect(subGain);
        subGain.connect(this.musicGain!);
        subOsc.start(time);
        subOsc.stop(time + totalTime);
      }

      // Layer 4: High harmonic for air (subtle)
      if (!isAmbient) {
        const airOsc = this.ctx!.createOscillator();
        const airGain = this.ctx!.createGain();
        const airFilter = this.ctx!.createBiquadFilter();
        airOsc.type = 'sine';
        airOsc.frequency.value = freq * 2;
        airFilter.type = 'lowpass';
        airFilter.frequency.value = 3000;
        airGain.gain.setValueAtTime(0, time);
        airGain.gain.linearRampToValueAtTime(baseVol * 0.1, time + attackTime);
        airGain.gain.exponentialRampToValueAtTime(0.001, time + sustainTime * 0.7);
        airOsc.connect(airFilter);
        airFilter.connect(airGain);
        airGain.connect(this.musicGain!);
        airOsc.start(time);
        airOsc.stop(time + sustainTime);
      }
    });
  }

  private playMusicArp(time: number, freq: number, style: string): void {
    if (!this.ctx || !this.musicGain) return;

    const isGlitch = style === 'glitch';
    const isAmbient = style === 'ambient';
    const isUplifting = style === 'uplifting';
    const decay = isGlitch ? 0.06 : (isAmbient ? 0.12 : 0.1);
    const baseVol = isUplifting ? 0.07 : 0.05;

    // Main arp oscillator
    const mainOsc = this.ctx.createOscillator();
    const mainGain = this.ctx.createGain();
    const mainFilter = this.ctx.createBiquadFilter();

    mainOsc.type = isGlitch ? 'square' : (isUplifting ? 'sawtooth' : 'triangle');
    mainOsc.frequency.value = freq;

    mainFilter.type = 'lowpass';
    mainFilter.frequency.setValueAtTime(isAmbient ? 2500 : 5000, time);
    mainFilter.frequency.exponentialRampToValueAtTime(800, time + decay * 0.8);
    mainFilter.Q.value = isUplifting ? 3 : 1;

    mainGain.gain.setValueAtTime(0, time);
    mainGain.gain.linearRampToValueAtTime(baseVol, time + 0.003);
    mainGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    mainOsc.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(this.musicGain);
    mainOsc.start(time);
    mainOsc.stop(time + decay);

    // Slight detune layer for thickness
    if (!isAmbient) {
      const detOsc = this.ctx.createOscillator();
      const detGain = this.ctx.createGain();
      detOsc.type = mainOsc.type;
      detOsc.frequency.value = freq;
      detOsc.detune.value = isGlitch ? 20 : 10;
      detGain.gain.setValueAtTime(0, time);
      detGain.gain.linearRampToValueAtTime(baseVol * 0.4, time + 0.005);
      detGain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.8);
      detOsc.connect(detGain);
      detGain.connect(this.musicGain);
      detOsc.start(time);
      detOsc.stop(time + decay);
    }

    // High shimmer for bright styles
    if (isUplifting || isGlitch) {
      const shimOsc = this.ctx.createOscillator();
      const shimGain = this.ctx.createGain();
      shimOsc.type = 'sine';
      shimOsc.frequency.value = freq * 2;
      shimGain.gain.setValueAtTime(0, time);
      shimGain.gain.linearRampToValueAtTime(baseVol * 0.15, time + 0.002);
      shimGain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.5);
      shimOsc.connect(shimGain);
      shimGain.connect(this.musicGain);
      shimOsc.start(time);
      shimOsc.stop(time + decay);
    }
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

  // Get current beat number (0-15)
  getCurrentBeat(): number {
    return this.currentMusicBeat;
  }

  // Check if current beat has a kick (for visual sync)
  isKickBeat(): boolean {
    const music = this.levelMusic[this.currentLevel - 1] || this.levelMusic[0];
    return music.pattern.kick[this.currentMusicBeat % 16] === 1;
  }

  // Get music intensity based on style
  getMusicIntensity(): number {
    const music = this.levelMusic[this.currentLevel - 1] || this.levelMusic[0];
    switch (music.style) {
      case 'intense': return 1.0;
      case 'uplifting': return 0.8;
      case 'glitch': return 0.7;
      case 'synthwave': return 0.6;
      case 'space': return 0.4;
      case 'ambient': return 0.3;
      default: return 0.5;
    }
  }

  // Start/stop jukebox mode (play music without game)
  startJukebox(levelId: number): void {
    this.currentLevel = levelId;
    this.startMusic();
  }

  stopJukebox(): void {
    this.stopMusic();
  }

  getGameSpeed(): number {
    return this.currentBPM / 60;
  }

  onJump(): void {
    if (!this.initialized || !this.beatConfig) return;

    this.jumpCount++;
    this.beatCount++;
    this.currentBPM = CONFIG.BASE_BPM + this.jumpCount;

    // Play music beats synced to jump (kick, snare, hihat, bass, melody)
    this.playBeatOnJump();

    // Also play the jump sound effect
    if (this.ctx && this.compressor && this.enabled) {
      this.playJumpSound(this.ctx.currentTime);
    }

    return;
  }

  private playJumpSound(time: number): void {
    if (!this.ctx || !this.compressor) return;

    const basePitch = 350 + Math.min(this.jumpCount * 1.5, 300);

    // Main tone - rising pitch
    const mainOsc = this.ctx.createOscillator();
    const mainGain = this.ctx.createGain();
    const mainFilter = this.ctx.createBiquadFilter();

    mainOsc.type = 'sine';
    mainOsc.frequency.setValueAtTime(basePitch, time);
    mainOsc.frequency.exponentialRampToValueAtTime(basePitch * 1.8, time + 0.08);

    mainFilter.type = 'lowpass';
    mainFilter.frequency.value = 2000;

    mainGain.gain.setValueAtTime(0.2, time);
    mainGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    mainOsc.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(this.compressor);
    mainOsc.start(time);
    mainOsc.stop(time + 0.1);

    // Harmonic layer for brightness
    const harmOsc = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    harmOsc.type = 'triangle';
    harmOsc.frequency.setValueAtTime(basePitch * 2, time);
    harmOsc.frequency.exponentialRampToValueAtTime(basePitch * 3, time + 0.06);
    harmGain.gain.setValueAtTime(0.08, time);
    harmGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
    harmOsc.connect(harmGain);
    harmGain.connect(this.compressor);
    harmOsc.start(time);
    harmOsc.stop(time + 0.07);

    // Subtle "whoosh" for movement feel
    const whooshLen = 0.06;
    const whooshBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * whooshLen, this.ctx.sampleRate);
    const whooshData = whooshBuf.getChannelData(0);
    for (let i = 0; i < whooshData.length; i++) {
      whooshData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / whooshData.length, 3);
    }
    const whoosh = this.ctx.createBufferSource();
    whoosh.buffer = whooshBuf;
    const whooshFilter = this.ctx.createBiquadFilter();
    whooshFilter.type = 'bandpass';
    whooshFilter.frequency.value = 4000;
    whooshFilter.Q.value = 2;
    const whooshGain = this.ctx.createGain();
    whooshGain.gain.setValueAtTime(0.06, time);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, time + whooshLen);
    whoosh.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(this.compressor);
    whoosh.start(time);
    whoosh.stop(time + whooshLen);
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

    const time = this.ctx.currentTime;

    // 1. Impact thud (very low, punchy)
    const impactOsc = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();
    impactOsc.type = 'sine';
    impactOsc.frequency.setValueAtTime(100, time);
    impactOsc.frequency.exponentialRampToValueAtTime(20, time + 0.15);
    impactGain.gain.setValueAtTime(0.9, time);
    impactGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    impactOsc.connect(impactGain);
    impactGain.connect(this.compressor);
    impactOsc.start(time);
    impactOsc.stop(time + 0.2);

    // 2. Sub rumble (extended low end)
    const rumbleOsc = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumbleOsc.type = 'sine';
    rumbleOsc.frequency.setValueAtTime(45, time);
    rumbleOsc.frequency.exponentialRampToValueAtTime(12, time + 0.8);
    rumbleGain.gain.setValueAtTime(0.6, time);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(this.compressor);
    rumbleOsc.start(time);
    rumbleOsc.stop(time + 0.8);

    // 3. Crash noise (initial burst)
    const crashLen = 0.5;
    const crashBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * crashLen, this.ctx.sampleRate);
    const crashData = crashBuf.getChannelData(0);
    for (let i = 0; i < crashData.length; i++) {
      crashData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crashData.length, 1.2);
    }
    const crash = this.ctx.createBufferSource();
    crash.buffer = crashBuf;
    const crashFilter = this.ctx.createBiquadFilter();
    crashFilter.type = 'lowpass';
    crashFilter.frequency.setValueAtTime(8000, time);
    crashFilter.frequency.exponentialRampToValueAtTime(200, time + crashLen);
    const crashGain = this.ctx.createGain();
    crashGain.gain.setValueAtTime(0.6, time);
    crashGain.gain.exponentialRampToValueAtTime(0.001, time + crashLen);
    crash.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(this.compressor);
    crash.start(time);
    crash.stop(time + crashLen);

    // 4. Metallic ring (debris sound)
    [320, 480, 640].forEach((freq, i) => {
      const ringOsc = this.ctx!.createOscillator();
      const ringGain = this.ctx!.createGain();
      ringOsc.type = 'triangle';
      ringOsc.frequency.value = freq + Math.random() * 50;
      ringGain.gain.setValueAtTime(0, time);
      ringGain.gain.linearRampToValueAtTime(0.12 / (i + 1), time + 0.01);
      ringGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3 + i * 0.1);
      ringOsc.connect(ringGain);
      ringGain.connect(this.compressor!);
      ringOsc.start(time);
      ringOsc.stop(time + 0.5);
    });

    // 5. Descending pitch sweep (dramatic effect)
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    const sweepFilter = this.ctx.createBiquadFilter();
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(400, time);
    sweepOsc.frequency.exponentialRampToValueAtTime(50, time + 0.4);
    sweepFilter.type = 'lowpass';
    sweepFilter.frequency.setValueAtTime(2000, time);
    sweepFilter.frequency.exponentialRampToValueAtTime(100, time + 0.4);
    sweepFilter.Q.value = 5;
    sweepGain.gain.setValueAtTime(0.15, time);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    sweepOsc.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(this.compressor);
    sweepOsc.start(time);
    sweepOsc.stop(time + 0.4);
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

  playPowerUp(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // 1. Rising arpeggio (magical feel)
    const notes = [392, 493.88, 587.33, 783.99, 987.77]; // G4, B4, D5, G5, B5
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 3000;

      const t = time + i * 0.05;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor!);
      osc.start(t);
      osc.stop(t + 0.4);

      // Add octave shimmer
      const shimOsc = this.ctx!.createOscillator();
      const shimGain = this.ctx!.createGain();
      shimOsc.type = 'sine';
      shimOsc.frequency.value = freq * 2;
      shimGain.gain.setValueAtTime(0, t);
      shimGain.gain.linearRampToValueAtTime(0.08, t + 0.01);
      shimGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      shimOsc.connect(shimGain);
      shimGain.connect(this.compressor!);
      shimOsc.start(t);
      shimOsc.stop(t + 0.25);
    });

    // 2. Magical sparkle burst
    for (let i = 0; i < 8; i++) {
      const sparkle = this.ctx.createOscillator();
      const sparkleGain = this.ctx.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.value = 1500 + Math.random() * 1500;
      const t = time + 0.15 + i * 0.025;
      sparkleGain.gain.setValueAtTime(0, t);
      sparkleGain.gain.linearRampToValueAtTime(0.06, t + 0.008);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      sparkle.connect(sparkleGain);
      sparkleGain.connect(this.compressor);
      sparkle.start(t);
      sparkle.stop(t + 0.12);
    }

    // 3. Low power surge (impact)
    const surge = this.ctx.createOscillator();
    const surgeGain = this.ctx.createGain();
    surge.type = 'sine';
    surge.frequency.setValueAtTime(80, time);
    surge.frequency.exponentialRampToValueAtTime(200, time + 0.2);
    surgeGain.gain.setValueAtTime(0.25, time);
    surgeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    surge.connect(surgeGain);
    surgeGain.connect(this.compressor);
    surge.start(time);
    surge.stop(time + 0.3);

    // 4. Ethereal pad swell
    const padFreqs = [392, 493.88, 587.33]; // G major chord
    padFreqs.forEach(freq => {
      const pad = this.ctx!.createOscillator();
      const padGain = this.ctx!.createGain();
      const padFilter = this.ctx!.createBiquadFilter();
      pad.type = 'sine';
      pad.frequency.value = freq;
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 800;
      padGain.gain.setValueAtTime(0, time);
      padGain.gain.linearRampToValueAtTime(0.04, time + 0.15);
      padGain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      pad.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(this.compressor!);
      pad.start(time);
      pad.stop(time + 0.6);
    });
  }

  playDoubleJump(): void {
    if (!this.initialized || !this.enabled || !this.ctx || !this.compressor) return;

    const time = this.ctx.currentTime;

    // 1. Main boost tone (rising pitch)
    const mainOsc = this.ctx.createOscillator();
    const mainGain = this.ctx.createGain();
    const mainFilter = this.ctx.createBiquadFilter();
    mainOsc.type = 'triangle';
    mainOsc.frequency.setValueAtTime(250, time);
    mainOsc.frequency.exponentialRampToValueAtTime(800, time + 0.12);
    mainFilter.type = 'lowpass';
    mainFilter.frequency.setValueAtTime(2000, time);
    mainFilter.frequency.exponentialRampToValueAtTime(4000, time + 0.1);
    mainGain.gain.setValueAtTime(0.25, time);
    mainGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    mainOsc.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(this.compressor);
    mainOsc.start(time);
    mainOsc.stop(time + 0.15);

    // 2. Harmonic layer (adds brightness)
    const harmOsc = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    harmOsc.type = 'sine';
    harmOsc.frequency.setValueAtTime(500, time);
    harmOsc.frequency.exponentialRampToValueAtTime(1600, time + 0.1);
    harmGain.gain.setValueAtTime(0.12, time);
    harmGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    harmOsc.connect(harmGain);
    harmGain.connect(this.compressor);
    harmOsc.start(time);
    harmOsc.stop(time + 0.12);

    // 3. Air whoosh (movement feel)
    const whooshLen = 0.12;
    const whooshBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * whooshLen, this.ctx.sampleRate);
    const whooshData = whooshBuf.getChannelData(0);
    for (let i = 0; i < whooshData.length; i++) {
      const env = Math.sin((i / whooshData.length) * Math.PI);
      whooshData[i] = (Math.random() * 2 - 1) * env;
    }
    const whoosh = this.ctx.createBufferSource();
    whoosh.buffer = whooshBuf;
    const whooshFilter = this.ctx.createBiquadFilter();
    whooshFilter.type = 'bandpass';
    whooshFilter.frequency.setValueAtTime(2000, time);
    whooshFilter.frequency.exponentialRampToValueAtTime(5000, time + whooshLen);
    whooshFilter.Q.value = 1.5;
    const whooshGain = this.ctx.createGain();
    whooshGain.gain.setValueAtTime(0.15, time);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, time + whooshLen);
    whoosh.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(this.compressor);
    whoosh.start(time);
    whoosh.stop(time + whooshLen);

    // 4. Quick sparkle accents
    [1200, 1800, 2400].forEach((freq, i) => {
      const spark = this.ctx!.createOscillator();
      const sparkGain = this.ctx!.createGain();
      spark.type = 'sine';
      spark.frequency.value = freq;
      const t = time + 0.02 + i * 0.02;
      sparkGain.gain.setValueAtTime(0, t);
      sparkGain.gain.linearRampToValueAtTime(0.06, t + 0.005);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      spark.connect(sparkGain);
      sparkGain.connect(this.compressor!);
      spark.start(t);
      spark.stop(t + 0.06);
    });
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopMusic();
    }
    return this.enabled;
  }

  // Volume controls
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.sfxVolume;
    }
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  // Initialize with saved volumes
  initVolumes(musicVol: number, sfxVol: number): void {
    this.musicVolume = musicVol;
    this.sfxVolume = sfxVol;
  }
}
