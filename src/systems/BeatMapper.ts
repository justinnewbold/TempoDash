// Rhythm Beat Mapping System - Syncs level elements with music beats
import { GAME_WIDTH } from '../constants';

export interface BeatEvent {
  time: number;        // Time in ms from start
  type: 'kick' | 'snare' | 'hihat' | 'bass' | 'melody';
  intensity: number;   // 0-1 strength of the beat
}

export interface BeatMap {
  bpm: number;
  offset: number;      // Start offset in ms
  beats: BeatEvent[];
  duration: number;    // Total duration in ms
}

interface UpcomingBeat {
  event: BeatEvent;
  screenX: number;
  opacity: number;
}

export class BeatMapper {
  private beatMap: BeatMap | null = null;
  private currentTime = 0;
  private isPlaying = false;
  private upcomingBeats: UpcomingBeat[] = [];
  private beatIndicatorPulse = 0;
  private lastBeatTime = 0;

  // Visualizer settings
  private readonly LOOK_AHEAD_TIME = 2000;  // Show beats 2s ahead

  constructor() {}

  // Generate a beat map from BPM (simple rhythmic pattern)
  generateFromBPM(bpm: number, duration: number): BeatMap {
    const beatInterval = 60000 / bpm;  // ms per beat
    const beats: BeatEvent[] = [];

    let time = 0;
    let beatIndex = 0;

    while (time < duration) {
      // Main kick on 1 and 3
      if (beatIndex % 4 === 0 || beatIndex % 4 === 2) {
        beats.push({ time, type: 'kick', intensity: 1.0 });
      }

      // Snare on 2 and 4
      if (beatIndex % 4 === 1 || beatIndex % 4 === 3) {
        beats.push({ time, type: 'snare', intensity: 0.9 });
      }

      // Hi-hat on every eighth note
      if (beatIndex % 2 === 0) {
        beats.push({ time: time + beatInterval / 2, type: 'hihat', intensity: 0.5 });
      }

      // Bass drop every 8 beats
      if (beatIndex % 8 === 0) {
        beats.push({ time, type: 'bass', intensity: 1.0 });
      }

      // Melody accent every 16 beats
      if (beatIndex % 16 === 0) {
        beats.push({ time, type: 'melody', intensity: 0.8 });
      }

      time += beatInterval;
      beatIndex++;
    }

    // Sort by time
    beats.sort((a, b) => a.time - b.time);

    return {
      bpm,
      offset: 0,
      beats,
      duration,
    };
  }

  // Load a beat map
  loadBeatMap(beatMap: BeatMap): void {
    this.beatMap = beatMap;
    this.currentTime = 0;
    this.upcomingBeats = [];
  }

  // Start playback
  start(): void {
    this.isPlaying = true;
    this.currentTime = 0;
    this.lastBeatTime = 0;
  }

  // Stop playback
  stop(): void {
    this.isPlaying = false;
  }

  // Get current BPM
  getBPM(): number {
    return this.beatMap?.bpm || 120;
  }

  // Check if a beat just occurred (for visual effects)
  checkBeat(deltaTime: number): BeatEvent | null {
    if (!this.beatMap || !this.isPlaying) return null;

    this.currentTime += deltaTime;

    // Find beats that occurred in this frame
    const prevTime = this.currentTime - deltaTime;
    for (const beat of this.beatMap.beats) {
      if (beat.time > prevTime && beat.time <= this.currentTime) {
        this.beatIndicatorPulse = 1;
        this.lastBeatTime = this.currentTime;
        return beat;
      }
    }

    return null;
  }

  // Update visualizer
  update(deltaTime: number, _playerX: number): void {
    if (!this.beatMap || !this.isPlaying) return;

    // Decay beat pulse
    if (this.beatIndicatorPulse > 0) {
      this.beatIndicatorPulse = Math.max(0, this.beatIndicatorPulse - deltaTime * 0.005);
    }

    // Calculate upcoming beats based on player position and time
    this.upcomingBeats = [];
    const lookAheadEnd = this.currentTime + this.LOOK_AHEAD_TIME;

    for (const beat of this.beatMap.beats) {
      if (beat.time > this.currentTime && beat.time <= lookAheadEnd) {
        const timeUntilBeat = beat.time - this.currentTime;
        const progress = 1 - (timeUntilBeat / this.LOOK_AHEAD_TIME);

        // Position beat indicator across screen based on timing
        const screenX = GAME_WIDTH * 0.2 + (GAME_WIDTH * 0.6) * progress;
        const opacity = Math.min(1, progress * 2);

        this.upcomingBeats.push({ event: beat, screenX, opacity });
      }
    }
  }

  // Get suggested platform placement based on beats
  getSuggestedPlacements(startTime: number, endTime: number): Array<{ x: number; type: string }> {
    if (!this.beatMap) return [];

    const placements: Array<{ x: number; type: string }> = [];
    const pixelsPerMs = 0.35;  // Approximate player speed

    for (const beat of this.beatMap.beats) {
      if (beat.time >= startTime && beat.time <= endTime) {
        const x = (beat.time - startTime) * pixelsPerMs;

        // Different beat types suggest different elements
        switch (beat.type) {
          case 'kick':
            placements.push({ x, type: 'platform' });
            break;
          case 'snare':
            placements.push({ x, type: 'coin' });
            break;
          case 'bass':
            placements.push({ x, type: 'boost' });
            break;
          case 'melody':
            placements.push({ x, type: 'powerup' });
            break;
        }
      }
    }

    return placements;
  }

  // Render beat visualizer
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.beatMap || !this.isPlaying) return;

    ctx.save();

    // Beat timeline at top
    const timelineY = 25;
    const timelineHeight = 30;

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(GAME_WIDTH * 0.15, timelineY - 5, GAME_WIDTH * 0.7, timelineHeight + 10);

    // Current position marker (center)
    const markerX = GAME_WIDTH * 0.2;
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10 + this.beatIndicatorPulse * 20;
    ctx.fillRect(markerX - 2, timelineY - 10, 4, timelineHeight + 20);

    // Upcoming beat markers
    for (const upcoming of this.upcomingBeats) {
      const color = this.getBeatColor(upcoming.event.type);
      const size = 6 + upcoming.event.intensity * 8;

      ctx.fillStyle = color;
      ctx.globalAlpha = upcoming.opacity;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      // Draw beat marker
      ctx.beginPath();
      if (upcoming.event.type === 'kick' || upcoming.event.type === 'bass') {
        // Square for bass/kick
        ctx.fillRect(
          upcoming.screenX - size / 2,
          timelineY + timelineHeight / 2 - size / 2,
          size,
          size
        );
      } else {
        // Circle for other beats
        ctx.arc(
          upcoming.screenX,
          timelineY + timelineHeight / 2,
          size / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;

    // BPM display
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(`${this.beatMap.bpm} BPM`, GAME_WIDTH * 0.85, timelineY + timelineHeight / 2 + 5);

    ctx.restore();
  }

  getLastBeatTime(): number {
    return this.lastBeatTime;
  }

  private getBeatColor(type: BeatEvent['type']): string {
    switch (type) {
      case 'kick': return '#ff4400';
      case 'snare': return '#ffff00';
      case 'hihat': return '#ffffff';
      case 'bass': return '#ff00ff';
      case 'melody': return '#00ffff';
    }
  }

  // Get beat pulse for visual effects (0-1)
  getPulse(): number {
    return this.beatIndicatorPulse;
  }

  // Check if currently on a strong beat (for combo bonuses)
  isOnBeat(tolerance: number = 100): boolean {
    if (!this.beatMap) return false;

    for (const beat of this.beatMap.beats) {
      if (Math.abs(beat.time - this.currentTime) <= tolerance) {
        return beat.type === 'kick' || beat.type === 'bass';
      }
    }
    return false;
  }

  // Get sync accuracy for scoring
  getBeatAccuracy(actionTime: number): 'perfect' | 'good' | 'ok' | 'miss' {
    if (!this.beatMap) return 'miss';

    let closestDistance = Infinity;

    for (const beat of this.beatMap.beats) {
      const distance = Math.abs(beat.time - actionTime);
      if (distance < closestDistance) {
        closestDistance = distance;
      }
    }

    if (closestDistance <= 50) return 'perfect';
    if (closestDistance <= 100) return 'good';
    if (closestDistance <= 200) return 'ok';
    return 'miss';
  }
}
