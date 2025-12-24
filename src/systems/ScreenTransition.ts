// Screen transition effects for smooth menu/level changes
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export type TransitionType = 'fade' | 'slide' | 'wipe' | 'circle' | 'pixelate';

interface TransitionState {
  type: TransitionType;
  progress: number; // 0 to 1
  duration: number;
  isActive: boolean;
  isEntering: boolean; // true = fading in, false = fading out
  onComplete?: () => void;
  color: string;
  // For circle transition
  centerX: number;
  centerY: number;
}

export class ScreenTransition {
  private state: TransitionState = {
    type: 'fade',
    progress: 0,
    duration: 300,
    isActive: false,
    isEntering: false,
    color: '#000000',
    centerX: GAME_WIDTH / 2,
    centerY: GAME_HEIGHT / 2,
  };

  // Start a transition out (screen goes dark)
  startOut(type: TransitionType = 'fade', duration: number = 300, onComplete?: () => void): void {
    this.state = {
      type,
      progress: 0,
      duration,
      isActive: true,
      isEntering: false,
      onComplete,
      color: '#000000',
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
    };
  }

  // Start a transition in (screen reveals)
  startIn(type: TransitionType = 'fade', duration: number = 300, onComplete?: () => void): void {
    this.state = {
      type,
      progress: 0,
      duration,
      isActive: true,
      isEntering: true,
      onComplete,
      color: '#000000',
      centerX: GAME_WIDTH / 2,
      centerY: GAME_HEIGHT / 2,
    };
  }

  // Start a circle transition from a specific point (e.g., player death location)
  startCircleOut(centerX: number, centerY: number, duration: number = 500, onComplete?: () => void): void {
    this.state = {
      type: 'circle',
      progress: 0,
      duration,
      isActive: true,
      isEntering: false,
      onComplete,
      color: '#000000',
      centerX,
      centerY,
    };
  }

  startCircleIn(centerX: number, centerY: number, duration: number = 500, onComplete?: () => void): void {
    this.state = {
      type: 'circle',
      progress: 0,
      duration,
      isActive: true,
      isEntering: true,
      onComplete,
      color: '#000000',
      centerX,
      centerY,
    };
  }

  update(deltaTime: number): void {
    if (!this.state.isActive) return;

    this.state.progress += deltaTime / this.state.duration;

    if (this.state.progress >= 1) {
      this.state.progress = 1;
      this.state.isActive = false;
      if (this.state.onComplete) {
        this.state.onComplete();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.state.isActive && this.state.progress < 1) return;

    const progress = this.state.isEntering ? 1 - this.state.progress : this.state.progress;

    switch (this.state.type) {
      case 'fade':
        this.renderFade(ctx, progress);
        break;
      case 'slide':
        this.renderSlide(ctx, progress);
        break;
      case 'wipe':
        this.renderWipe(ctx, progress);
        break;
      case 'circle':
        this.renderCircle(ctx, progress);
        break;
      case 'pixelate':
        this.renderPixelate(ctx, progress);
        break;
    }
  }

  private renderFade(ctx: CanvasRenderingContext2D, progress: number): void {
    ctx.fillStyle = `rgba(0, 0, 0, ${progress})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private renderSlide(ctx: CanvasRenderingContext2D, progress: number): void {
    // Slide from left
    const width = GAME_WIDTH * this.easeInOut(progress);
    ctx.fillStyle = this.state.color;
    ctx.fillRect(0, 0, width, GAME_HEIGHT);
  }

  private renderWipe(ctx: CanvasRenderingContext2D, progress: number): void {
    // Diagonal wipe
    const eased = this.easeInOut(progress);
    ctx.fillStyle = this.state.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(GAME_WIDTH * eased * 1.5, 0);
    ctx.lineTo(GAME_WIDTH * eased * 1.5 - GAME_WIDTH * 0.5, GAME_HEIGHT);
    ctx.lineTo(0, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  private renderCircle(ctx: CanvasRenderingContext2D, progress: number): void {
    // Circle closing/opening effect (like Mario pipe)
    const maxRadius = Math.sqrt(GAME_WIDTH * GAME_WIDTH + GAME_HEIGHT * GAME_HEIGHT);
    const eased = this.easeInOut(progress);
    const radius = maxRadius * (1 - eased);

    ctx.fillStyle = this.state.color;
    ctx.beginPath();
    ctx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.arc(this.state.centerX, this.state.centerY, Math.max(0, radius), 0, Math.PI * 2, true);
    ctx.fill('evenodd');
  }

  private renderPixelate(ctx: CanvasRenderingContext2D, progress: number): void {
    // Pixelation effect with black squares
    const blockSize = Math.max(2, Math.floor(progress * 50));
    const threshold = progress;

    ctx.fillStyle = this.state.color;
    for (let y = 0; y < GAME_HEIGHT; y += blockSize) {
      for (let x = 0; x < GAME_WIDTH; x += blockSize) {
        // Use deterministic "random" based on position
        const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        if (noise < threshold) {
          ctx.fillRect(x, y, blockSize, blockSize);
        }
      }
    }
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  isActive(): boolean {
    return this.state.isActive;
  }

  getProgress(): number {
    return this.state.progress;
  }
}
