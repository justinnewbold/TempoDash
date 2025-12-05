import { CONFIG } from '../constants';

export type GemType = 'normal' | 'rare' | 'super';

export class Gem {
  x: number;
  y: number;
  width = 20;
  height = 20;
  type: GemType;
  collected = false;

  private bobOffset = Math.random() * Math.PI * 2;
  private rotation = 0;
  private sparkles: { angle: number; dist: number; size: number }[] = [];

  constructor(x: number, y?: number, type?: GemType) {
    this.x = x;

    // Default y is mid-height, with some variation
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    this.y = y ?? groundY - 80 - Math.random() * 100;

    // Determine gem type (70% normal, 25% rare, 5% super)
    if (type) {
      this.type = type;
    } else {
      const roll = Math.random();
      if (roll > 0.95) {
        this.type = 'super';
      } else if (roll > 0.7) {
        this.type = 'rare';
      } else {
        this.type = 'normal';
      }
    }

    // Initialize sparkles
    for (let i = 0; i < 4; i++) {
      this.sparkles.push({
        angle: (i / 4) * Math.PI * 2,
        dist: 12 + Math.random() * 5,
        size: 2 + Math.random() * 2
      });
    }
  }

  getPoints(): number {
    switch (this.type) {
      case 'super': return 100;
      case 'rare': return 50;
      default: return 25;
    }
  }

  getColor(): { primary: string; glow: string } {
    switch (this.type) {
      case 'super':
        return { primary: '#ff44ff', glow: '#ff00ff' };
      case 'rare':
        return { primary: '#44ff44', glow: '#00ff00' };
      default:
        return { primary: '#44aaff', glow: '#0088ff' };
    }
  }

  update(speed: number): void {
    this.x -= CONFIG.BASE_OBSTACLE_SPEED * speed;
    this.rotation += 0.05 * speed;
    this.bobOffset += 0.08 * speed;

    // Update sparkles
    for (const sparkle of this.sparkles) {
      sparkle.angle += 0.03 * speed;
    }
  }

  checkCollection(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    if (this.collected) return false;

    // Generous hitbox for collection
    const margin = 10;
    const collected = playerX < this.x + this.width + margin &&
                      playerX + playerWidth > this.x - margin &&
                      playerY < this.y + this.height + margin &&
                      playerY + playerHeight > this.y - margin;

    if (collected) {
      this.collected = true;
    }

    return collected;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    const colors = this.getColor();
    const bobY = Math.sin(this.bobOffset) * 5;

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + bobY);

    // Draw sparkles behind gem
    for (const sparkle of this.sparkles) {
      const sx = Math.cos(sparkle.angle) * sparkle.dist;
      const sy = Math.sin(sparkle.angle) * sparkle.dist * 0.6;

      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(this.bobOffset * 2 + sparkle.angle) * 0.3})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sparkle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glow
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 15 + Math.sin(this.bobOffset * 2) * 5;

    // Rotate gem
    ctx.rotate(this.rotation);

    // Draw diamond shape
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(this.width / 2, 0);
    ctx.lineTo(0, this.height / 2);
    ctx.lineTo(-this.width / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 3);
    ctx.lineTo(this.width / 4, -this.height / 6);
    ctx.lineTo(0, 0);
    ctx.lineTo(-this.width / 4, -this.height / 6);
    ctx.closePath();
    ctx.fill();

    // Super gems have extra effects
    if (this.type === 'super') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Outer ring
      ctx.beginPath();
      ctx.arc(0, 0, this.width * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 100, 255, ${0.3 + Math.sin(this.bobOffset * 3) * 0.2})`;
      ctx.stroke();
    }

    ctx.restore();
  }
}
