import { CONFIG } from '../constants';

export class Hole {
  x: number;
  width: number;
  passed = false;

  constructor(x: number, width?: number) {
    this.x = x;
    this.width = width ?? 60 + Math.random() * 40; // 60-100 pixels wide
  }

  update(speed: number): void {
    this.x -= CONFIG.BASE_OBSTACLE_SPEED * speed;
  }

  // Check if player fell into the hole
  checkDeath(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    const playerBottom = playerY + playerHeight;
    const playerCenterX = playerX + playerWidth / 2;

    // Player is at ground level and center is over the hole
    if (playerBottom >= groundY - 5) {
      if (playerCenterX > this.x + 10 && playerCenterX < this.x + this.width - 10) {
        return true;
      }
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D, _groundColor: string): void {
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;

    // Draw the hole (dark pit)
    ctx.fillStyle = '#000000';
    ctx.fillRect(this.x, groundY, this.width, CONFIG.GROUND_HEIGHT);

    // Gradient into darkness
    const gradient = ctx.createLinearGradient(this.x, groundY, this.x, CONFIG.HEIGHT);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(20, 0, 40, 0.9)');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, groundY, this.width, CONFIG.GROUND_HEIGHT);

    // Warning stripes at edges
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(this.x - 5, groundY - 3, 10, 3);
    ctx.fillRect(this.x + this.width - 5, groundY - 3, 10, 3);

    // Danger glow
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, groundY);
    ctx.lineTo(this.x, groundY + 30);
    ctx.moveTo(this.x + this.width, groundY);
    ctx.lineTo(this.x + this.width, groundY + 30);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
