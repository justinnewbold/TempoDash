import { ObstacleType } from '../types';
import { CONFIG } from '../constants';

export class Obstacle {
  x: number;
  y: number;
  width = 40;
  height = 40;
  type: ObstacleType;
  passed = false;

  // New: height variation properties
  private heightVariation = 0; // Random variation added to base height
  private isFloating = false; // Whether obstacle floats above ground
  private floatHeight = 0;

  constructor(x: number, type?: ObstacleType, jumpCount: number = 0) {
    this.x = x;
    this.type = type || this.randomType(jumpCount);
    this.setupDimensions(jumpCount);
    this.y = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - this.height - this.floatHeight;
  }

  private randomType(jumpCount: number): ObstacleType {
    const types: ObstacleType[] = ['spike', 'block', 'doubleSpike', 'tallBlock'];
    // Increase difficulty with more jumps
    const difficulty = Math.min(jumpCount / 50, 1);
    const typeIndex = Math.floor(Math.random() * (2 + Math.floor(difficulty * 2)));
    return types[Math.min(typeIndex, types.length - 1)];
  }

  private setupDimensions(jumpCount: number = 0): void {
    // Add height variation based on progression
    const variationRange = Math.min(jumpCount / 30, 1) * 25; // Up to 25px variation
    this.heightVariation = Math.random() * variationRange - variationRange * 0.3; // Bias towards taller

    // Small chance for floating obstacles after 20 jumps
    if (jumpCount > 20 && Math.random() < 0.15) {
      this.isFloating = true;
      this.floatHeight = 30 + Math.random() * 40; // Float 30-70px above ground
    }

    switch (this.type) {
      case 'spike':
        this.width = 35 + Math.random() * 15; // 35-50px width
        this.height = 35 + Math.floor(this.heightVariation); // Variable height
        break;
      case 'doubleSpike':
        this.width = 60 + Math.random() * 20; // 60-80px width
        this.height = 35 + Math.floor(this.heightVariation * 0.8);
        break;
      case 'block':
        this.width = 40 + Math.random() * 20; // 40-60px width
        this.height = 45 + Math.floor(this.heightVariation); // 45-70px height
        break;
      case 'tallBlock':
        this.width = 35 + Math.random() * 15; // 35-50px width
        this.height = 70 + Math.floor(this.heightVariation * 1.2); // 70-100px height
        break;
      case 'platform':
        this.width = 70 + Math.random() * 30; // 70-100px width
        this.height = 15 + Math.random() * 10; // 15-25px height
        break;
      default:
        this.width = 40;
        this.height = 40 + Math.floor(this.heightVariation);
    }

    // Ensure minimum heights
    this.height = Math.max(this.height, 25);
  }

  update(speed: number, customObstacleSpeed?: number): void {
    const obstacleSpeed = customObstacleSpeed ?? CONFIG.BASE_OBSTACLE_SPEED;
    this.x -= obstacleSpeed * speed;
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
    // Draw ground shadow for floating obstacles
    if (this.isFloating) {
      const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
      const shadowScale = 0.6 + (this.floatHeight / 70) * 0.2; // Shadow size based on height
      const shadowWidth = this.width * shadowScale;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(
        this.x + this.width / 2,
        groundY - 2,
        shadowWidth / 2,
        4,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.shadowColor = this.isFloating ? '#ff8800' : '#ff4757';
    ctx.shadowBlur = this.isFloating ? 20 : 15;

    // Different gradient for floating obstacles
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    if (this.isFloating) {
      gradient.addColorStop(0, '#ffaa44');
      gradient.addColorStop(1, '#ff6600');
    } else {
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(1, '#ff4757');
    }

    if (this.type === 'spike' || this.type === 'doubleSpike') {
      const spikes = this.type === 'spike' ? 1 : 2;
      const spikeWidth = this.width / spikes;

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

      // Inner highlight for depth
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(this.x + 3, this.y + 3, this.width - 6, this.height / 3);

      // Shadow at bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(this.x + 5, this.y + this.height - 12, this.width - 10, 8);
    }

    // Floating indicator (glowing lines)
    if (this.isFloating) {
      ctx.strokeStyle = 'rgba(255, 150, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.shadowBlur = 0;
  }
}
