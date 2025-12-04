import { CONFIG } from '../constants';

type MovementType = 'horizontal' | 'vertical' | 'circular';

export class MovingObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  baseX: number;
  baseY: number;
  movementType: MovementType;
  range: number;
  speed: number;
  angle = 0;
  passed = false;

  constructor(x: number, movementType?: MovementType, range?: number, speed?: number) {
    this.baseX = x;
    this.x = x;
    this.width = 40;
    this.height = 40;
    this.movementType = movementType ?? this.randomMovementType();
    this.range = range ?? 80 + Math.random() * 60;
    this.speed = speed ?? 0.03 + Math.random() * 0.02;

    // Set initial Y based on movement type
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    if (this.movementType === 'vertical') {
      this.baseY = groundY - 100 - Math.random() * 100;
    } else if (this.movementType === 'circular') {
      this.baseY = groundY - 120;
    } else {
      this.baseY = groundY - this.height - 50 - Math.random() * 80;
    }
    this.y = this.baseY;
  }

  private randomMovementType(): MovementType {
    const types: MovementType[] = ['horizontal', 'vertical', 'circular'];
    return types[Math.floor(Math.random() * types.length)];
  }

  update(speed: number): void {
    // Scroll with the level
    this.baseX -= CONFIG.BASE_OBSTACLE_SPEED * speed;
    this.angle += this.speed * speed;

    // Apply movement pattern
    switch (this.movementType) {
      case 'horizontal':
        this.x = this.baseX + Math.sin(this.angle) * this.range;
        this.y = this.baseY;
        break;
      case 'vertical':
        this.x = this.baseX;
        this.y = this.baseY + Math.sin(this.angle) * this.range;
        break;
      case 'circular':
        this.x = this.baseX + Math.cos(this.angle) * this.range;
        this.y = this.baseY + Math.sin(this.angle) * this.range * 0.5;
        break;
    }
  }

  checkCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    const px = playerX + 8;
    const py = playerY + 8;
    const pw = playerWidth - 16;
    const ph = playerHeight - 16;

    return px < this.x + this.width &&
           px + pw > this.x &&
           py < this.y + this.height &&
           py + ph > this.y;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Glow effect
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 15;

    // Rotation based on movement
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.angle * 2);

    // Gradient fill
    const gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2);
    gradient.addColorStop(0, '#ff8800');
    gradient.addColorStop(0.5, '#ff4400');
    gradient.addColorStop(1, '#cc2200');

    ctx.fillStyle = gradient;

    // Draw as a star/danger shape
    ctx.beginPath();
    const spikes = 4;
    const outerRadius = this.width / 2;
    const innerRadius = this.width / 4;

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes;
      if (i === 0) {
        ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      } else {
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Center dot
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw movement path preview (faded)
    ctx.strokeStyle = 'rgba(255, 100, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (this.movementType === 'vertical') {
      ctx.beginPath();
      ctx.moveTo(this.baseX + this.width / 2, this.baseY - this.range);
      ctx.lineTo(this.baseX + this.width / 2, this.baseY + this.range + this.height);
      ctx.stroke();
    } else if (this.movementType === 'horizontal') {
      ctx.beginPath();
      ctx.moveTo(this.baseX - this.range, this.y + this.height / 2);
      ctx.lineTo(this.baseX + this.range + this.width, this.y + this.height / 2);
      ctx.stroke();
    } else {
      // Circular path
      ctx.beginPath();
      ctx.ellipse(
        this.baseX + this.width / 2,
        this.baseY + this.height / 2,
        this.range,
        this.range * 0.5,
        0, 0, Math.PI * 2
      );
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }
}
