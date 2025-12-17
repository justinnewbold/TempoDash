import { LevelConfig, Rectangle } from '../types';
import { Platform } from '../entities/Platform';
import { Coin } from '../entities/Coin';
import { Player } from '../entities/Player';
import { Background } from '../graphics/Background';
import { COLORS } from '../constants';

export class Level {
  id: number;
  name: string;
  platforms: Platform[] = [];
  coins: Coin[] = [];
  coinsCollected = 0;
  totalCoins = 0;
  goal: Rectangle;
  playerStart: { x: number; y: number };
  background: Background;
  levelLength: number;
  private config: LevelConfig;

  constructor(config: LevelConfig) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.goal = config.goal;
    this.playerStart = config.playerStart;
    this.background = new Background(config.background);

    // Create platforms
    for (const platformConfig of config.platforms) {
      this.platforms.push(new Platform(platformConfig));
    }

    // Create coins
    if (config.coins) {
      for (const coinConfig of config.coins) {
        this.coins.push(new Coin(coinConfig));
      }
      this.totalCoins = config.coins.length;
    }

    // Calculate level length (furthest platform or goal)
    this.levelLength = this.goal.x + this.goal.width;
    for (const platform of this.platforms) {
      const platformEnd = platform.x + platform.width;
      if (platformEnd > this.levelLength) {
        this.levelLength = platformEnd;
      }
    }
  }

  reset(): void {
    // Reset coins
    this.coins = [];
    this.coinsCollected = 0;
    if (this.config.coins) {
      for (const coinConfig of this.config.coins) {
        this.coins.push(new Coin(coinConfig));
      }
    }
  }

  update(deltaTime: number): void {
    this.background.update(deltaTime);

    for (const platform of this.platforms) {
      platform.update(deltaTime);
    }

    for (const coin of this.coins) {
      coin.update(deltaTime);
    }
  }

  checkCoinCollection(player: Player): number {
    const playerBounds = player.getBounds();
    let collected = 0;

    for (const coin of this.coins) {
      if (coin.checkCollision(playerBounds)) {
        coin.collect();
        this.coinsCollected++;
        collected++;
      }
    }

    return collected;
  }

  getTotalCoins(): number {
    return this.coins.length;
  }

  getProgress(playerX: number): number {
    const startX = this.playerStart.x;
    const endX = this.goal.x;
    // Prevent division by zero
    if (endX === startX) return playerX >= endX ? 1 : 0;
    const progress = (playerX - startX) / (endX - startX);
    return Math.max(0, Math.min(1, progress));
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

  render(ctx: CanvasRenderingContext2D, cameraX: number = 0): void {
    // Draw background (with parallax effect)
    this.background.render(ctx, cameraX);

    // Draw platforms
    for (const platform of this.platforms) {
      platform.render(ctx, cameraX);
    }

    // Draw coins
    for (const coin of this.coins) {
      coin.render(ctx, cameraX);
    }

    // Draw goal
    this.renderGoal(ctx, cameraX);
  }

  private renderGoal(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.goal.x - cameraX;

    // Skip if off screen
    if (screenX + this.goal.width < -50 || screenX > ctx.canvas.width + 50) {
      return;
    }

    const time = Date.now() * 0.003;
    const pulse = Math.sin(time) * 0.3 + 0.7;

    // Glow effect
    ctx.shadowColor = COLORS.GOAL;
    ctx.shadowBlur = 20 * pulse;

    // Goal gradient
    const gradient = ctx.createLinearGradient(
      screenX,
      this.goal.y,
      screenX,
      this.goal.y + this.goal.height
    );
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(0.5, '#ffed4a');
    gradient.addColorStop(1, '#ffd700');

    ctx.fillStyle = gradient;
    ctx.fillRect(screenX, this.goal.y, this.goal.width, this.goal.height);

    // Star icon in center
    ctx.fillStyle = '#fff';
    const centerX = screenX + this.goal.width / 2;
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
