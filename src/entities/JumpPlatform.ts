import { CONFIG } from '../constants';

export class JumpPlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  passed = false;
  color: string;
  tier: number; // Track which tier this platform is in a sequence

  constructor(x: number, y?: number, width?: number, color?: string, tier: number = 0) {
    this.x = x;
    // Default height: 50-90 pixels from ground (reachable with a single jump)
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    this.y = y ?? groundY - (50 + Math.random() * 40);
    this.width = width ?? 80 + Math.random() * 40;
    this.height = 15;
    this.color = color ?? '#00ffff';
    this.tier = tier;
  }

  update(speed: number): void {
    this.x -= CONFIG.BASE_OBSTACLE_SPEED * speed;
  }

  // Check if player is landing on platform from above
  checkLanding(playerX: number, playerY: number, playerWidth: number, playerHeight: number, velocityY: number): boolean {
    // Only land if falling down
    if (velocityY <= 0) return false;

    const playerBottom = playerY + playerHeight;
    const playerCenterX = playerX + playerWidth / 2;

    // Check horizontal overlap
    if (playerCenterX < this.x || playerCenterX > this.x + this.width) {
      return false;
    }

    // Check if player's bottom is at or just above platform top
    if (playerBottom >= this.y && playerBottom <= this.y + this.height + 10) {
      return true;
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Platform glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    // Main platform
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, this.adjustColor(this.color, -30));

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Top highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, 3);

    // Edge decorations
    ctx.fillStyle = this.adjustColor(this.color, 20);
    ctx.fillRect(this.x, this.y, 3, this.height);
    ctx.fillRect(this.x + this.width - 3, this.y, 3, this.height);

    ctx.shadowBlur = 0;
  }

  private adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
}
