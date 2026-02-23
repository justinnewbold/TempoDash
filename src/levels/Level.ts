import { LevelConfig, Rectangle, PowerUpConfig } from '../types';
import { Platform } from '../entities/Platform';
import { Coin } from '../entities/Coin';
import { Portal } from '../entities/Portal';
import { Gem } from '../entities/Gem';
import { Player } from '../entities/Player';
import { Background } from '../graphics/Background';
import { COLORS, GAME_WIDTH } from '../constants';

export class Level {
  id: number;
  name: string;
  platforms: Platform[] = [];
  secretPlatforms: Platform[] = []; // Subset of platforms for efficient secret-reveal checks
  coins: Coin[] = [];
  coinsCollected = 0;
  totalCoins = 0;
  powerUpConfigs: PowerUpConfig[] = [];
  portals: Portal[] = [];
  gems: Gem[] = [];
  gemsCollected = 0;
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
      const platform = new Platform(platformConfig);
      this.platforms.push(platform);
      if (platformConfig.type === 'secret') {
        this.secretPlatforms.push(platform);
      }
    }

    // Create coins
    if (config.coins) {
      for (const coinConfig of config.coins) {
        this.coins.push(new Coin(coinConfig));
      }
      this.totalCoins = config.coins.length;
    }

    // Store power-up configurations
    if (config.powerUps) {
      this.powerUpConfigs = [...config.powerUps];
    }

    // Create portals
    if (config.portals) {
      for (const portalConfig of config.portals) {
        this.portals.push(new Portal(portalConfig));
      }
    }

    // Create gems
    if (config.gems) {
      for (const gemConfig of config.gems) {
        this.gems.push(new Gem(gemConfig));
      }
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
    // Reset platforms (recreate from config to clear crumble/glass/phase state)
    this.platforms = [];
    this.secretPlatforms = [];
    for (const platformConfig of this.config.platforms) {
      const platform = new Platform(platformConfig);
      this.platforms.push(platform);
      if (platformConfig.type === 'secret') {
        this.secretPlatforms.push(platform);
      }
    }

    // Reset coins
    this.coins = [];
    this.coinsCollected = 0;
    if (this.config.coins) {
      for (const coinConfig of this.config.coins) {
        this.coins.push(new Coin(coinConfig));
      }
    }

    // Reset portals
    this.portals = [];
    if (this.config.portals) {
      for (const portalConfig of this.config.portals) {
        this.portals.push(new Portal(portalConfig));
      }
    }

    // Reset gems
    this.gems = [];
    this.gemsCollected = 0;
    if (this.config.gems) {
      for (const gemConfig of this.config.gems) {
        this.gems.push(new Gem(gemConfig));
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

    for (const portal of this.portals) {
      portal.update(deltaTime);
    }

    for (const gem of this.gems) {
      gem.update(deltaTime);
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

  /**
   * Check gem collection. Returns array of collected gem point values.
   */
  checkGemCollection(player: Player): number[] {
    const playerBounds = player.getBounds();
    const collectedValues: number[] = [];

    for (const gem of this.gems) {
      if (gem.checkCollision(playerBounds)) {
        gem.collect();
        this.gemsCollected++;
        collectedValues.push(gem.getPointValue());
      }
    }

    return collectedValues;
  }

  /**
   * Check portal teleportation. Returns the linked portal if player enters one.
   */
  checkPortalTeleport(player: Player): Portal | null {
    const playerBounds = player.getBounds();

    for (const portal of this.portals) {
      if (!portal.canTeleport()) continue;
      if (portal.checkCollision(playerBounds)) {
        // Find the linked portal
        const linkedPortal = this.portals.find(p => p.id === portal.linkedPortalId);
        if (linkedPortal) {
          portal.onTeleport();
          linkedPortal.onTeleport(); // Put both on cooldown
          return linkedPortal;
        }
      }
    }

    return null;
  }

  getTotalCoins(): number {
    return this.coins.length;
  }

  getTotalGems(): number {
    return this.gems.length;
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
      platform.render(ctx, cameraX, GAME_WIDTH);
    }

    // Off-screen culling boundaries
    const cullLeft = cameraX - 100;
    const cullRight = cameraX + GAME_WIDTH + 100;

    // Draw portals (behind coins/gems for layering)
    for (const portal of this.portals) {
      if (portal.x + 60 < cullLeft || portal.x > cullRight) continue;
      portal.render(ctx, cameraX);
    }

    // Draw coins
    for (const coin of this.coins) {
      if (coin.x + 20 < cullLeft || coin.x > cullRight) continue;
      coin.render(ctx, cameraX);
    }

    // Draw gems
    for (const gem of this.gems) {
      if (gem.x + 30 < cullLeft || gem.x > cullRight) continue;
      gem.render(ctx, cameraX);
    }

    // Draw goal
    this.renderGoal(ctx, cameraX);
  }

  private renderGoal(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.goal.x - cameraX;

    // Skip if off screen
    if (screenX + this.goal.width < -50 || screenX > GAME_WIDTH + 50) {
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
    // Return all platforms to avoid per-frame array allocation from .filter().
    // Callers (collision, beat pulse, etc.) already check isCollidable() individually.
    return this.platforms;
  }

  getConfig(): LevelConfig {
    return this.config;
  }
}
