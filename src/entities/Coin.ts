import { CoinConfig, Rectangle } from '../types';
import { GAME_HEIGHT } from '../constants';

export class Coin {
  x: number;
  y: number;
  readonly width = 24;
  readonly height = 24;
  collected = false;
  private animationTime = 0;
  private collectAnimation = 0;

  constructor(config: CoinConfig) {
    this.x = config.x;
    this.y = config.y;
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    if (this.collected && this.collectAnimation < 1) {
      this.collectAnimation += deltaTime / 200;
    }
  }

  // Attract coin toward a target position (for magnet power-up)
  attractToward(targetX: number, targetY: number, strength: number, deltaTime: number): void {
    if (this.collected) return;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Move toward player with speed based on distance (faster when closer)
      const speed = strength * (1 + (150 - Math.min(distance, 150)) / 50);
      const moveX = (dx / distance) * speed * (deltaTime / 1000);
      const moveY = (dy / distance) * speed * (deltaTime / 1000);

      this.x += moveX;
      this.y += moveY;
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

    const coinBounds = this.getBounds();
    return (
      playerBounds.x < coinBounds.x + coinBounds.width &&
      playerBounds.x + playerBounds.width > coinBounds.x &&
      playerBounds.y < coinBounds.y + coinBounds.height &&
      playerBounds.y + playerBounds.height > coinBounds.y
    );
  }

  render(ctx: CanvasRenderingContext2D, cameraY: number): void {
    const screenX = this.x;
    const screenY = this.y - cameraY;

    // Skip if off screen (use logical game height for vertical scrolling)
    if (screenY < -50 || screenY > GAME_HEIGHT + 50) return;

    // Collection animation
    if (this.collected) {
      if (this.collectAnimation >= 1) return;

      ctx.save();
      ctx.globalAlpha = 1 - this.collectAnimation;
      const scale = 1 + this.collectAnimation * 0.5;
      ctx.translate(screenX, screenY - this.collectAnimation * 30);
      ctx.scale(scale, scale);
      this.drawCoin(ctx, 0, 0);
      ctx.restore();
      return;
    }

    // Floating animation
    const floatOffset = Math.sin(this.animationTime * 0.005) * 4;
    const rotation = Math.sin(this.animationTime * 0.003) * 0.3;

    ctx.save();
    ctx.translate(screenX, screenY + floatOffset);
    ctx.rotate(rotation);
    this.drawCoin(ctx, 0, 0);
    ctx.restore();
  }

  private drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Outer glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    // Coin body
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.width / 2);
    gradient.addColorStop(0, '#ffed4a');
    gradient.addColorStop(0.5, '#ffd700');
    gradient.addColorStop(1, '#daa520');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Inner shine
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, this.width / 4, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, this.width / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();

    // Dollar sign or star
    ctx.fillStyle = '#daa520';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x, y);
  }
}
