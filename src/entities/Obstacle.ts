import { ObstacleType } from '../types';
import { CONFIG } from '../constants';

export class Obstacle {
  x: number;
  y: number;
  width = 40;
  height = 40;
  type: ObstacleType;
  passed = false;

  constructor(x: number, type?: ObstacleType, jumpCount: number = 0) {
    this.x = x;
    this.type = type || this.randomType(jumpCount);
    this.setupDimensions();
    this.y = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - this.height;
  }

  private randomType(jumpCount: number): ObstacleType {
    const types: ObstacleType[] = ['spike', 'block', 'doubleSpike', 'tallBlock'];
    // Increase difficulty with more jumps
    const difficulty = Math.min(jumpCount / 50, 1);
    const typeIndex = Math.floor(Math.random() * (2 + Math.floor(difficulty * 2)));
    return types[Math.min(typeIndex, types.length - 1)];
  }

  private setupDimensions(): void {
    switch (this.type) {
      case 'spike':
        this.width = 40;
        this.height = 40;
        break;
      case 'doubleSpike':
        this.width = 70;
        this.height = 40;
        break;
      case 'block':
        this.width = 50;
        this.height = 50;
        break;
      case 'tallBlock':
        this.width = 40;
        this.height = 80;
        break;
      case 'platform':
        this.width = 80;
        this.height = 20;
        break;
      default:
        this.width = 40;
        this.height = 40;
    }
  }

  update(speed: number): void {
    this.x -= CONFIG.BASE_OBSTACLE_SPEED * speed;
  }

  checkCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    // Smaller hitbox for more forgiving gameplay
    const px = playerX + 5;
    const py = playerY + 5;
    const pw = playerWidth - 10;
    const ph = playerHeight - 10;

    // For spikes, only check bottom half
    if (this.type === 'spike' || this.type === 'doubleSpike') {
      return px < this.x + this.width &&
             px + pw > this.x &&
             py < this.y + this.height &&
             py + ph > this.y + 15;
    }

    // Standard AABB collision
    return px < this.x + this.width &&
           px + pw > this.x &&
           py < this.y + this.height &&
           py + ph > this.y;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 15;

    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ff4757');

    if (this.type === 'spike' || this.type === 'doubleSpike') {
      const spikes = this.type === 'spike' ? 1 : 2;
      const spikeWidth = this.type === 'spike' ? 40 : 35;

      for (let i = 0; i < spikes; i++) {
        ctx.beginPath();
        ctx.moveTo(this.x + i * spikeWidth, this.y + this.height);
        ctx.lineTo(this.x + spikeWidth / 2 + i * spikeWidth, this.y);
        ctx.lineTo(this.x + spikeWidth + i * spikeWidth, this.y + this.height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    } else {
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Shadow at bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(this.x + 5, this.y + this.height - 15, this.width - 10, 10);
    }

    ctx.shadowBlur = 0;
  }
}
