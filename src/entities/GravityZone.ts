import { CONFIG } from '../constants';

export class GravityZone {
  x: number;
  width: number;
  multiplier: number;
  passed = false;
  private animTime = 0;

  constructor(x: number, width?: number, multiplier?: number) {
    this.x = x;
    this.width = width ?? 150 + Math.random() * 100; // 150-250 pixels wide
    this.multiplier = multiplier ?? 0.4; // 40% gravity
  }

  update(speed: number): void {
    this.x -= CONFIG.BASE_OBSTACLE_SPEED * speed;
    this.animTime += 0.05 * speed;
  }

  // Check if player is inside the zone
  isPlayerInside(playerX: number, playerWidth: number): boolean {
    const playerCenterX = playerX + playerWidth / 2;
    return playerCenterX > this.x && playerCenterX < this.x + this.width;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    const zoneHeight = groundY + 20; // Extend above ground

    // Zone background with animated gradient
    const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
    gradient.addColorStop(0, 'rgba(138, 43, 226, 0)');
    gradient.addColorStop(0.2, 'rgba(138, 43, 226, 0.2)');
    gradient.addColorStop(0.5, 'rgba(186, 85, 211, 0.25)');
    gradient.addColorStop(0.8, 'rgba(138, 43, 226, 0.2)');
    gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, 0, this.width, zoneHeight);

    // Floating particles effect
    ctx.fillStyle = 'rgba(200, 150, 255, 0.6)';
    for (let i = 0; i < 8; i++) {
      const px = this.x + (i * this.width / 8) + Math.sin(this.animTime + i) * 10;
      const py = 50 + Math.sin(this.animTime * 0.5 + i * 2) * 150 + 100;
      const size = 3 + Math.sin(this.animTime + i) * 2;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Zone indicator lines
    ctx.strokeStyle = 'rgba(186, 85, 211, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 10]);

    // Left border
    ctx.beginPath();
    ctx.moveTo(this.x, 0);
    ctx.lineTo(this.x, zoneHeight);
    ctx.stroke();

    // Right border
    ctx.beginPath();
    ctx.moveTo(this.x + this.width, 0);
    ctx.lineTo(this.x + this.width, zoneHeight);
    ctx.stroke();

    ctx.setLineDash([]);

    // "LOW-G" label
    ctx.fillStyle = 'rgba(200, 150, 255, 0.8)';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOW-G', this.x + this.width / 2, 30);
  }
}
