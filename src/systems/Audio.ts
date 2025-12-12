// Procedural music system using Web Audio API
// Generates a Geometry Dash-style electronic beat

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private bpm = 100; // Synced with jump timing (jump duration = 0.6s = 1 beat at 100 BPM)
  private beatInterval: number | null = null;
  private currentBeat = 0;
  private isMuted = false;
  private beatCallback: ((beat: number) => void) | null = null;

  // Musical notes (frequencies in Hz)
  private notes = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  };

  // Bass pattern (plays on every beat)
  private bassPattern = ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'F3', 'F3'];

  // Melody pattern (plays every other beat)
  private melodyPattern = ['E4', 'G4', 'C5', 'B4', 'A4', 'G4', 'E4', 'D4'];

  // Arp pattern
  private arpPattern = ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'G3'];

  constructor() {
    // Audio context will be created on first user interaction
  }

  private initAudioContext(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
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
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
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

  private playBeat(): void {
    if (!this.audioContext || !this.masterGain || this.isMuted) return;

    const time = this.audioContext.currentTime;
    const beatIndex = this.currentBeat % 8;

    // Bass on every beat
    this.playBass(this.bassPattern[beatIndex], time);

    // Kick drum on beats 0, 2, 4, 6 (stronger on downbeat 0)
    if (beatIndex % 2 === 0) {
      this.playKick(time, beatIndex === 0);
    }

    // Hi-hat on every beat
    this.playHiHat(time, beatIndex % 2 === 1);

    // Snare on beats 2 and 6
    if (beatIndex === 2 || beatIndex === 6) {
      this.playSnare(time);
    }

    // Melody every other beat
    if (beatIndex % 2 === 0) {
      this.playMelody(this.melodyPattern[Math.floor(beatIndex / 2) % this.melodyPattern.length], time);
    }

    // Arp pattern
    this.playArp(this.arpPattern[beatIndex], time);

    // Fire beat callback for visual sync
    if (this.beatCallback) {
      this.beatCallback(this.currentBeat);
    }

    this.currentBeat++;
  }

  private playBass(note: string, time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = this.notes[note as keyof typeof this.notes] || 130.81;

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialDecayTo(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playMelody(note: string, time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.value = this.notes[note as keyof typeof this.notes] || 261.63;

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialDecayTo(0.01, time + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playArp(note: string, time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = this.notes[note as keyof typeof this.notes] || 261.63;

    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialDecayTo(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playKick(time: number, isDownbeat: boolean = false): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    // Stronger kick on downbeat (beat 0) for rhythm emphasis
    const kickVolume = isDownbeat ? 0.5 : 0.35;
    osc.frequency.setValueAtTime(isDownbeat ? 160 : 150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

    gain.gain.setValueAtTime(kickVolume, time);
    gain.gain.exponentialDecayTo(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);

    // Add click layer on downbeat for clearer timing
    if (isDownbeat) {
      this.playClick(time);
    }
  }

  private playClick(time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.value = 1200;

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialDecayTo(0.001, time + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playSnare(time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    // Noise for snare
    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.15, time);
    noiseGain.gain.exponentialDecayTo(0.01, time + 0.1);

    // Bandpass filter for snare character
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.1);

    // Tonal component
    const osc = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);

    oscGain.gain.setValueAtTime(0.1, time);
    oscGain.gain.exponentialDecayTo(0.01, time + 0.05);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playHiHat(time: number, open: boolean): void {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * (open ? 0.15 : 0.05);
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(open ? 0.06 : 0.08, time);
    gain.gain.exponentialDecayTo(0.001, time + (open ? 0.15 : 0.05));

    // Highpass filter for hi-hat character
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + (open ? 0.15 : 0.05));
  }

  // Play a death sound effect
  playDeath(): void {
    if (!this.audioContext || !this.masterGain || this.isMuted) return;

    const time = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.3);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialDecayTo(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  // Play a jump sound effect
  playJump(): void {
    if (!this.audioContext || !this.masterGain || this.isMuted) return;

    const time = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, time);
    osc.frequency.exponentialRampToValueAtTime(600, time + 0.1);

    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialDecayTo(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  // Play level complete sound
  playLevelComplete(): void {
    if (!this.audioContext || !this.masterGain || this.isMuted) return;

    const time = this.audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, time + i * 0.15 + 0.05);
      gain.gain.exponentialDecayTo(0.001, time + i * 0.15 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time + i * 0.15);
      osc.stop(time + i * 0.15 + 0.5);
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
