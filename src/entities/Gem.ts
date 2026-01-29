import { Rectangle } from '../types';
import { GAME_WIDTH } from '../constants';

export type GemType = 'ruby' | 'sapphire' | 'emerald';

export interface GemConfig {
  x: number;
  y: number;
  type: GemType;
}

const GEM_COLORS: Record<GemType, { primary: string; glow: string; inner: string }> = {
  ruby: { primary: '#e11d48', glow: '#ff4466', inner: '#ff6b8a' },
  sapphire: { primary: '#2563eb', glow: '#60a5fa', inner: '#93c5fd' },
  emerald: { primary: '#059669', glow: '#34d399', inner: '#6ee7b7' },
};

const GEM_POINTS: Record<GemType, number> = {
  ruby: 500,
  sapphire: 1000,
  emerald: 2000,
};

export class Gem {
  x: number;
  y: number;
  type: GemType;
  collected = false;
  readonly width = 22;
  readonly height = 22;

  private animationTime = 0;
  private collectAnimation = 0;
  private sparkleTimer = 0;

  constructor(config: GemConfig) {
    this.x = config.x;
    this.y = config.y;
    this.type = config.type;
  }

  getPointValue(): number {
    return GEM_POINTS[this.type];
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;
    this.sparkleTimer += deltaTime;

    if (this.collected && this.collectAnimation < 1) {
      this.collectAnimation += deltaTime / 250;
    }
  }

  collect(): void {
    if (!this.collected) {
      this.collected = true;
      this.collectAnimation = 0;
    }
  }

  getBounds(): Rectangle {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  checkCollision(playerBounds: Rectangle): boolean {
    if (this.collected) return false;

    const bounds = this.getBounds();
    return (
      playerBounds.x < bounds.x + bounds.width &&
      playerBounds.x + playerBounds.width > bounds.x &&
      playerBounds.y < bounds.y + bounds.height &&
      playerBounds.y + playerBounds.height > bounds.y
    );
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.x - cameraX;

    // Skip if off screen
    if (screenX < -50 || screenX > GAME_WIDTH + 50) return;

    const colors = GEM_COLORS[this.type];

    // Collection animation
    if (this.collected) {
      if (this.collectAnimation >= 1) return;

      ctx.save();
      ctx.globalAlpha = 1 - this.collectAnimation;
      const scale = 1 + this.collectAnimation * 0.8;
      ctx.translate(screenX, this.y - this.collectAnimation * 40);
      ctx.scale(scale, scale);

      // Flash white during collection
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Show point value
      ctx.fillStyle = colors.glow;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${GEM_POINTS[this.type]}`, 0, -20);

      ctx.restore();
      return;
    }

    // Floating animation (more dramatic than coins)
    const floatOffset = Math.sin(this.animationTime * 0.004) * 6;
    const rotation = Math.sin(this.animationTime * 0.002) * 0.2;
    const scalePulse = 1 + Math.sin(this.animationTime * 0.006) * 0.08;

    ctx.save();
    ctx.translate(screenX, this.y + floatOffset);
    ctx.rotate(rotation);
    ctx.scale(scalePulse, scalePulse);

    // Outer glow
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 20;

    // Draw diamond/gem shape
    this.drawGemShape(ctx, 0, 0, colors);

    // Sparkle effect
    if (this.sparkleTimer % 800 < 200) {
      const sparkleAlpha = 1 - (this.sparkleTimer % 800) / 200;
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
      const sparkleAngle = this.animationTime * 0.01;
      for (let i = 0; i < 4; i++) {
        const angle = sparkleAngle + (Math.PI / 2) * i;
        const dist = this.width / 2 + 5;
        ctx.beginPath();
        ctx.arc(
          Math.cos(angle) * dist,
          Math.sin(angle) * dist,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawGemShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    colors: { primary: string; glow: string; inner: string }
  ): void {
    const s = this.width / 2;

    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(x, y - s);       // Top
    ctx.lineTo(x + s, y);       // Right
    ctx.lineTo(x, y + s * 0.7); // Bottom
    ctx.lineTo(x - s, y);       // Left
    ctx.closePath();

    // Fill with gradient
    const gradient = ctx.createLinearGradient(x - s, y - s, x + s, y + s);
    gradient.addColorStop(0, colors.inner);
    gradient.addColorStop(0.5, colors.primary);
    gradient.addColorStop(1, colors.inner);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Inner highlight (upper facet)
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.4, y - s * 0.2);
    ctx.lineTo(x - s * 0.4, y - s * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x, y + s * 0.7);
    ctx.lineTo(x - s, y);
    ctx.closePath();
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center facet line
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.lineTo(x, y - s * 0.2);
    ctx.lineTo(x + s, y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
