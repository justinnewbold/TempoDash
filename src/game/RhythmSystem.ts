/**
 * RhythmSystem - Extracted from Game.ts.
 * Handles beat tracking, rhythm scoring, and beat visualization.
 */

import { TIMING } from '../constants';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export interface BeatIndicator {
  time: number;
  intensity: number;
}

export interface BeatAccuracyFeedback {
  time: number;
  accuracy: 'perfect' | 'good' | 'miss';
  timer: number;
}

export type BeatTiming = 'perfect' | 'good' | 'miss';

export class RhythmSystem {
  // Beat state
  beatTimer = 0;
  currentBPM = 128;
  currentBeatNumber = 0;
  lastBeatTime = 0;

  // Beat indicators for visualization
  beatIndicators: BeatIndicator[] = [];
  beatAccuracy: BeatAccuracyFeedback[] = [];

  // Rhythm scoring
  rhythmMultiplier = 1;
  consecutiveOnBeatJumps = 0;

  // Tracking for mastery badges
  levelRhythmHits = 0;
  levelRhythmTotal = 0;

  /** Reset for new level */
  reset(): void {
    this.beatTimer = 0;
    this.currentBeatNumber = 0;
    this.beatIndicators = [];
    this.beatAccuracy = [];
    this.rhythmMultiplier = 1;
    this.consecutiveOnBeatJumps = 0;
    this.levelRhythmHits = 0;
    this.levelRhythmTotal = 0;
  }

  /** Set BPM for current level */
  setBPM(bpm: number): void {
    this.currentBPM = bpm || 128;
  }

  /** Check how close the current moment is to a beat */
  checkBeatTiming(): BeatTiming {
    const now = performance.now();
    const timeSinceBeat = now - this.lastBeatTime;
    const beatInterval = 60000 / this.currentBPM;
    const timeToNextBeat = beatInterval - (timeSinceBeat % beatInterval);
    const distanceFromBeat = Math.min(timeSinceBeat % beatInterval, timeToNextBeat);

    if (distanceFromBeat <= TIMING.BEAT_PERFECT_WINDOW) {
      return 'perfect';
    } else if (distanceFromBeat <= TIMING.BEAT_GOOD_WINDOW) {
      return 'good';
    }
    return 'miss';
  }

  /**
   * Called when player jumps. Evaluates beat timing and updates streak.
   * Returns the timing result for external systems (flow meter, milestones).
   */
  onPlayerJump(showVisualizer: boolean): { timing: BeatTiming; streak: number } {
    this.levelRhythmTotal++;

    const timing = this.checkBeatTiming();

    if (showVisualizer) {
      this.beatAccuracy.push({
        time: performance.now(),
        accuracy: timing,
        timer: 800,
      });
    }

    if (timing === 'perfect' || timing === 'good') {
      this.levelRhythmHits++;
    }

    if (timing === 'perfect') {
      this.consecutiveOnBeatJumps++;
    } else if (timing === 'good') {
      this.consecutiveOnBeatJumps = Math.max(0, this.consecutiveOnBeatJumps - 1);
    } else {
      this.consecutiveOnBeatJumps = 0;
    }

    return { timing, streak: this.consecutiveOnBeatJumps };
  }

  /** Update beat indicators and rhythm multiplier */
  update(deltaTime: number): void {
    // Update existing indicators
    for (let i = this.beatIndicators.length - 1; i >= 0; i--) {
      this.beatIndicators[i].time -= deltaTime / 1000;
      this.beatIndicators[i].intensity -= deltaTime / 500;
      if (this.beatIndicators[i].time <= 0) {
        this.beatIndicators.splice(i, 1);
      }
    }

    // Update beat accuracy feedback
    for (let i = this.beatAccuracy.length - 1; i >= 0; i--) {
      this.beatAccuracy[i].timer -= deltaTime;
      if (this.beatAccuracy[i].timer <= 0) {
        this.beatAccuracy.splice(i, 1);
      }
    }

    // Calculate rhythm multiplier
    if (this.consecutiveOnBeatJumps > 0) {
      this.rhythmMultiplier = 1 + Math.min(this.consecutiveOnBeatJumps * 0.1, 0.5);
    } else {
      this.rhythmMultiplier = Math.max(1, this.rhythmMultiplier - deltaTime / 2000);
    }
  }

  /** Get rhythm accuracy percentage for mastery badges */
  getAccuracyPercent(): number {
    if (this.levelRhythmTotal === 0) return 0;
    return Math.round((this.levelRhythmHits / this.levelRhythmTotal) * 100);
  }

  /** Render the beat visualizer UI */
  render(ctx: CanvasRenderingContext2D, showVisualizer: boolean, gameStatus: string): void {
    if (!showVisualizer) return;
    if (gameStatus !== 'playing' && gameStatus !== 'practice') return;

    ctx.save();

    const baseX = GAME_WIDTH - 60;
    const baseY = GAME_HEIGHT - 80;

    // Beat ring background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(baseX, baseY, 25, 0, Math.PI * 2);
    ctx.stroke();

    // Pulsing beat indicator
    const beatInterval = 60000 / this.currentBPM;
    const now = performance.now();
    const beatProgress = ((now - this.lastBeatTime) % beatInterval) / beatInterval;
    const pulseSize = 25 - beatProgress * 20;

    if (pulseSize > 5) {
      ctx.strokeStyle = `rgba(0, 255, 170, ${1 - beatProgress})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(baseX, baseY, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Beat accuracy feedback
    for (const feedback of this.beatAccuracy) {
      const alpha = feedback.timer / 800;
      const colors = { perfect: '#00ffaa', good: '#ffaa00', miss: '#ff4444' };
      ctx.fillStyle = colors[feedback.accuracy];
      ctx.globalAlpha = alpha;
      ctx.font = `bold 14px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        feedback.accuracy.toUpperCase(),
        baseX,
        baseY - 35 - (1 - alpha) * 10
      );
    }

    // Rhythm multiplier
    if (this.rhythmMultiplier > 1) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#00ffaa';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.rhythmMultiplier.toFixed(1)}x`, baseX, baseY + 45);
    }

    ctx.restore();
  }
}
