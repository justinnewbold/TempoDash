import { LevelConfig, Rectangle } from '../types';
import { Platform } from '../entities/Platform';
import { Player } from '../entities/Player';
import { Background } from '../graphics/Background';
import { COLORS } from '../constants';

export class Level {
  id: number;
  name: string;
  platforms: Platform[] = [];
  goal: Rectangle;
  playerStart: { x: number; y: number };
  background: Background;

  constructor(config: LevelConfig) {
    this.id = config.id;
    this.name = config.name;
    this.goal = config.goal;
    this.playerStart = config.playerStart;
    this.background = new Background(config.background);

    // Create platforms
    for (const platformConfig of config.platforms) {
      this.platforms.push(new Platform(platformConfig));
    }
  }

  reset(): void {
    // Recreate platforms to reset their state
    this.platforms = [];
  }

  update(deltaTime: number): void {
    this.background.update(deltaTime);

    for (const platform of this.platforms) {
      platform.update(deltaTime);
    }
  }

  checkGoal(player: Player): boolean {
    const playerBounds = player.getBounds();

    return (
      playerBounds.x < this.goal.x + this.goal.width &&
      playerBounds.x + playerBounds.width > this.goal.x &&
      playerBounds.y < this.goal.y + this.goal.height &&
      playerBounds.y + playerBounds.height > this.goal.y
    );
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw background
    this.background.render(ctx);

    // Draw platforms
    for (const platform of this.platforms) {
      platform.render(ctx);
    }

    // Draw goal
    this.renderGoal(ctx);
  }

  private renderGoal(ctx: CanvasRenderingContext2D): void {
    const time = Date.now() * 0.003;
    const pulse = Math.sin(time) * 0.3 + 0.7;

    // Glow effect
    ctx.shadowColor = COLORS.GOAL;
    ctx.shadowBlur = 20 * pulse;

    // Goal gradient
    const gradient = ctx.createLinearGradient(
      this.goal.x,
      this.goal.y,
      this.goal.x,
      this.goal.y + this.goal.height
    );
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(0.5, '#ffed4a');
    gradient.addColorStop(1, '#ffd700');

    ctx.fillStyle = gradient;
    ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);

    // Star icon in center
    ctx.fillStyle = '#fff';
    const centerX = this.goal.x + this.goal.width / 2;
    const centerY = this.goal.y + this.goal.height / 2;
    this.drawStar(ctx, centerX, centerY, 12 * pulse, 5);

    ctx.shadowBlur = 0;
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    points: number
  ): void {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius / 2;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  getActivePlatforms(): Platform[] {
    return this.platforms.filter((p) => p.isCollidable());
  }
}
