// Level Intro Animation System - Countdown and level info display
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export interface LevelInfo {
  levelId: number;
  name: string;
  bpm: number;
  bestTime: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Insane';
}

type IntroPhase = 'info' | 'countdown' | 'go' | 'done';

export class LevelIntroManager {
  private isActive = false;
  private phase: IntroPhase = 'done';
  private timer = 0;
  private levelInfo: LevelInfo | null = null;
  private countdownNumber = 3;
  private onComplete: (() => void) | null = null;

  // Timing constants
  private readonly INFO_DURATION = 1500;
  private readonly COUNTDOWN_INTERVAL = 800;
  private readonly GO_DURATION = 600;

  constructor() {}

  // Start the intro sequence
  start(levelInfo: LevelInfo, onComplete: () => void): void {
    this.levelInfo = levelInfo;
    this.onComplete = onComplete;
    this.isActive = true;
    this.phase = 'info';
    this.timer = 0;
    this.countdownNumber = 3;
  }

  // Skip the intro
  skip(): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.phase = 'done';
    if (this.onComplete) {
      this.onComplete();
      this.onComplete = null;
    }
  }

  // Update the intro animation
  update(deltaTime: number): void {
    if (!this.isActive) return;

    this.timer += deltaTime;

    switch (this.phase) {
      case 'info':
        if (this.timer >= this.INFO_DURATION) {
          this.phase = 'countdown';
          this.timer = 0;
          this.countdownNumber = 3;
        }
        break;

      case 'countdown':
        if (this.timer >= this.COUNTDOWN_INTERVAL) {
          this.timer = 0;
          this.countdownNumber--;
          if (this.countdownNumber <= 0) {
            this.phase = 'go';
          }
        }
        break;

      case 'go':
        if (this.timer >= this.GO_DURATION) {
          this.phase = 'done';
          this.isActive = false;
          if (this.onComplete) {
            this.onComplete();
            this.onComplete = null;
          }
        }
        break;
    }
  }

  // Render the intro
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive || !this.levelInfo) return;

    ctx.save();

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    switch (this.phase) {
      case 'info':
        this.renderLevelInfo(ctx, centerX, centerY);
        break;

      case 'countdown':
        this.renderCountdown(ctx, centerX, centerY);
        break;

      case 'go':
        this.renderGo(ctx, centerX, centerY);
        break;
    }

    // Skip hint
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Press SPACE or tap to skip', centerX, GAME_HEIGHT - 40);

    ctx.restore();
  }

  private renderLevelInfo(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    if (!this.levelInfo) return;

    const progress = Math.min(1, this.timer / 500);  // Fade in over 500ms
    ctx.globalAlpha = progress;

    // Level number
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.fillText(`LEVEL ${this.levelInfo.levelId}`, centerX, centerY - 80);

    // Level name
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText(this.levelInfo.name.toUpperCase(), centerX, centerY - 30);
    ctx.shadowBlur = 0;

    // BPM
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff00ff';
    ctx.fillText(`♪ ${this.levelInfo.bpm} BPM`, centerX, centerY + 20);

    // Difficulty
    const difficultyColors: Record<string, string> = {
      Easy: '#00ff00',
      Medium: '#ffff00',
      Hard: '#ff8800',
      Expert: '#ff0000',
      Insane: '#ff00ff',
    };
    ctx.fillStyle = difficultyColors[this.levelInfo.difficulty] || '#ffffff';
    ctx.fillText(this.levelInfo.difficulty.toUpperCase(), centerX, centerY + 55);

    // Best time
    if (this.levelInfo.bestTime !== null) {
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`Best: ${this.formatTime(this.levelInfo.bestTime)}`, centerX, centerY + 95);
    }
  }

  private renderCountdown(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const pulse = 1 + (1 - this.timer / this.COUNTDOWN_INTERVAL) * 0.3;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(pulse, pulse);

    // Number
    ctx.font = 'bold 150px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30;
    ctx.fillText(this.countdownNumber.toString(), 0, 50);

    ctx.restore();
  }

  private renderGo(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const progress = this.timer / this.GO_DURATION;
    const scale = 1 + progress * 0.5;
    const alpha = 1 - progress;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // GO!
    ctx.font = 'bold 100px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 40;
    ctx.fillText('GO!', 0, 35);

    ctx.restore();
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 10);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
  }

  // Check if intro is currently showing
  isShowing(): boolean {
    return this.isActive;
  }

  // Get current phase for external use
  getPhase(): IntroPhase {
    return this.phase;
  }
}
