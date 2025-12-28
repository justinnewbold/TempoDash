// Procedural Music System - Dynamic music that adapts to gameplay
// Uses Web Audio API for real-time audio generation and mixing

export type MusicIntensity = 'calm' | 'normal' | 'intense' | 'danger' | 'victory';

interface MusicLayer {
  name: string;
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;
  targetVolume: number;
  currentVolume: number;
  frequency: number;
  type: OscillatorType;
}

interface DrumPattern {
  kick: number[];
  snare: number[];
  hihat: number[];
}

export class ProceduralMusicSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Music layers
  private bassLayer: MusicLayer;
  private leadLayer: MusicLayer;
  private padLayer: MusicLayer;
  private arpeggioLayer: MusicLayer;

  // Rhythm
  private drumPattern: DrumPattern;
  private beatIndex = 0;
  private bpm = 128;
  private lastBeatTime = 0;
  private beatInterval: number;

  // State
  private isPlaying = false;
  private currentIntensity: MusicIntensity = 'normal';
  private intensityTransition = 0;
  private dangerPulse = 0;

  // Musical scales (pentatonic for pleasing sounds)
  private static readonly SCALES = {
    calm: [261.63, 293.66, 329.63, 392.00, 440.00],      // C major pentatonic
    normal: [329.63, 369.99, 415.30, 493.88, 554.37],    // E major pentatonic
    intense: [392.00, 440.00, 493.88, 587.33, 659.25],   // G major pentatonic
    danger: [293.66, 349.23, 392.00, 466.16, 523.25],    // D minor pentatonic
    victory: [523.25, 587.33, 659.25, 783.99, 880.00],   // C major pentatonic (high)
  };

  constructor() {
    this.bassLayer = this.createLayer('bass', 'sawtooth', 0);
    this.leadLayer = this.createLayer('lead', 'square', 0);
    this.padLayer = this.createLayer('pad', 'sine', 0);
    this.arpeggioLayer = this.createLayer('arpeggio', 'triangle', 0);

    this.drumPattern = {
      kick: [0, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0],
      snare: [0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0],
      hihat: [0, 2, 4, 6, 8, 10, 12, 14, 0, 2, 4, 6, 8, 10, 12, 14],
    };

    this.beatInterval = (60 / this.bpm) * 1000 / 4;  // 16th notes
  }

  private createLayer(name: string, type: OscillatorType, frequency: number): MusicLayer {
    return {
      name,
      oscillator: null,
      gainNode: null,
      targetVolume: 0,
      currentVolume: 0,
      frequency,
      type,
    };
  }

  async initialize(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();

    // Create master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;

    // Create compressor for better dynamics
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.audioContext.destination);

    // Initialize layers
    this.initializeLayer(this.bassLayer, 0.15);
    this.initializeLayer(this.leadLayer, 0.08);
    this.initializeLayer(this.padLayer, 0.1);
    this.initializeLayer(this.arpeggioLayer, 0.06);
  }

  private initializeLayer(layer: MusicLayer, baseVolume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    layer.gainNode = this.audioContext.createGain();
    layer.gainNode.gain.value = 0;
    layer.gainNode.connect(this.masterGain);

    layer.oscillator = this.audioContext.createOscillator();
    layer.oscillator.type = layer.type;
    layer.oscillator.frequency.value = 220;
    layer.oscillator.connect(layer.gainNode);
    layer.oscillator.start();

    layer.targetVolume = baseVolume;
  }

  start(): void {
    if (this.isPlaying) return;

    this.initialize().then(() => {
      this.isPlaying = true;
      this.lastBeatTime = performance.now();
    });
  }

  stop(): void {
    this.isPlaying = false;

    // Fade out all layers
    this.fadeLayer(this.bassLayer, 0);
    this.fadeLayer(this.leadLayer, 0);
    this.fadeLayer(this.padLayer, 0);
    this.fadeLayer(this.arpeggioLayer, 0);
  }

  private fadeLayer(layer: MusicLayer, targetVolume: number): void {
    layer.targetVolume = targetVolume;
  }

  setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
    this.beatInterval = (60 / this.bpm) * 1000 / 4;
  }

  setIntensity(intensity: MusicIntensity): void {
    if (this.currentIntensity === intensity) return;

    this.currentIntensity = intensity;
    this.intensityTransition = 1;

    // Adjust layer volumes based on intensity
    switch (intensity) {
      case 'calm':
        this.fadeLayer(this.bassLayer, 0.1);
        this.fadeLayer(this.leadLayer, 0);
        this.fadeLayer(this.padLayer, 0.15);
        this.fadeLayer(this.arpeggioLayer, 0.04);
        break;

      case 'normal':
        this.fadeLayer(this.bassLayer, 0.15);
        this.fadeLayer(this.leadLayer, 0.06);
        this.fadeLayer(this.padLayer, 0.1);
        this.fadeLayer(this.arpeggioLayer, 0.06);
        break;

      case 'intense':
        this.fadeLayer(this.bassLayer, 0.2);
        this.fadeLayer(this.leadLayer, 0.1);
        this.fadeLayer(this.padLayer, 0.08);
        this.fadeLayer(this.arpeggioLayer, 0.1);
        break;

      case 'danger':
        this.fadeLayer(this.bassLayer, 0.25);
        this.fadeLayer(this.leadLayer, 0.12);
        this.fadeLayer(this.padLayer, 0.05);
        this.fadeLayer(this.arpeggioLayer, 0.08);
        this.dangerPulse = 1;
        break;

      case 'victory':
        this.fadeLayer(this.bassLayer, 0.15);
        this.fadeLayer(this.leadLayer, 0.15);
        this.fadeLayer(this.padLayer, 0.2);
        this.fadeLayer(this.arpeggioLayer, 0.12);
        break;
    }
  }

  // Call this based on game state
  updateFromGameState(speedMultiplier: number, isNearDeath: boolean, _hasShield: boolean, comboCount: number): void {
    // Determine intensity based on game state
    if (isNearDeath) {
      this.setIntensity('danger');
    } else if (speedMultiplier > 1.3 || comboCount > 10) {
      this.setIntensity('intense');
    } else if (speedMultiplier < 1.05 && comboCount === 0) {
      this.setIntensity('calm');
    } else {
      this.setIntensity('normal');
    }

    // Adjust BPM based on speed
    const targetBPM = 128 + (speedMultiplier - 1) * 50;
    this.setBPM(targetBPM);
  }

  triggerVictory(): void {
    this.setIntensity('victory');
  }

  update(deltaTime: number): void {
    if (!this.isPlaying || !this.audioContext) return;

    const now = performance.now();

    // Process beat
    if (now - this.lastBeatTime >= this.beatInterval) {
      this.lastBeatTime = now;
      this.processBeat();
      this.beatIndex = (this.beatIndex + 1) % 16;
    }

    // Smooth volume transitions
    this.updateLayerVolume(this.bassLayer, deltaTime);
    this.updateLayerVolume(this.leadLayer, deltaTime);
    this.updateLayerVolume(this.padLayer, deltaTime);
    this.updateLayerVolume(this.arpeggioLayer, deltaTime);

    // Danger pulse effect
    if (this.currentIntensity === 'danger' && this.dangerPulse > 0) {
      this.dangerPulse -= deltaTime * 0.002;
    }

    // Intensity transition
    if (this.intensityTransition > 0) {
      this.intensityTransition -= deltaTime * 0.001;
    }
  }

  private updateLayerVolume(layer: MusicLayer, deltaTime: number): void {
    if (!layer.gainNode) return;

    const rate = 0.005 * deltaTime;
    layer.currentVolume += (layer.targetVolume - layer.currentVolume) * rate;
    layer.gainNode.gain.value = layer.currentVolume;
  }

  private processBeat(): void {
    const scale = ProceduralMusicSystem.SCALES[this.currentIntensity];

    // Bass - plays on beat 0, 4, 8, 12 (quarter notes)
    if (this.beatIndex % 4 === 0) {
      const bassNote = scale[0] / 2;  // One octave down
      this.setFrequency(this.bassLayer, bassNote);
    }

    // Lead - melodic pattern
    if (this.beatIndex % 2 === 0) {
      const noteIndex = Math.floor(Math.random() * scale.length);
      this.setFrequency(this.leadLayer, scale[noteIndex]);
    }

    // Pad - sustained chord
    if (this.beatIndex === 0) {
      // Root note for pad
      this.setFrequency(this.padLayer, scale[0] * 0.5);
    }

    // Arpeggio - fast pattern
    const arpeggioNote = scale[this.beatIndex % scale.length];
    this.setFrequency(this.arpeggioLayer, arpeggioNote);

    // Drum sounds using noise bursts
    this.playDrums();
  }

  private setFrequency(layer: MusicLayer, frequency: number): void {
    if (!layer.oscillator) return;
    layer.oscillator.frequency.setTargetAtTime(frequency, this.audioContext!.currentTime, 0.01);
  }

  private playDrums(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Kick drum
    if (this.drumPattern.kick.includes(this.beatIndex)) {
      this.playKick();
    }

    // Snare
    if (this.drumPattern.snare.includes(this.beatIndex)) {
      this.playSnare();
    }

    // Hi-hat
    if (this.drumPattern.hihat.includes(this.beatIndex)) {
      this.playHihat();
    }
  }

  private playKick(): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  private playSnare(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Noise burst for snare
    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  private playHihat(): void {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * 0.05;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getCurrentIntensity(): MusicIntensity {
    return this.currentIntensity;
  }

  isInitialized(): boolean {
    return this.audioContext !== null;
  }
}
