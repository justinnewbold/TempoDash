import { Player } from '../entities/Player';
import { Platform } from '../entities/Platform';
import { Coin } from '../entities/Coin';
import { GameState } from '../types';
import { PLAYER, GAME } from '../constants';
import { EndlessGenerator } from './EndlessGenerator';

export class EndlessGameEngine {
  player: Player;
  platforms: Platform[] = [];
  coins: Coin[] = [];
  cameraY = 0;
  generator: EndlessGenerator;
  coinCollectedThisFrame = false;

  state: GameState = {
    score: 0,
    coinsCollected: 0,
    isPlaying: false,
    isDead: false,
    isComplete: false,
  };

  private jumpPressed = false;
  private jumpHeld = false;
  private highestY = 0;

  constructor() {
    this.player = new Player({ x: GAME.WIDTH / 2 - PLAYER.SIZE / 2, y: 100 });
    this.generator = new EndlessGenerator();
  }

  start(): void {
    this.generator.reset();

    this.state = {
      score: 0,
      coinsCollected: 0,
      isPlaying: true,
      isDead: false,
      isComplete: false,
    };

    this.player.reset({ x: GAME.WIDTH / 2 - PLAYER.SIZE / 2, y: 100 });
    this.cameraY = -100;
    this.highestY = 100;

    // Create initial platforms
    this.updatePlatformsAndCoins();
  }

  private updatePlatformsAndCoins(): void {
    // Ensure generator has content ahead
    this.generator.ensureGeneratedTo(this.player.y + 2000);

    // Get visible range
    const minY = this.cameraY - 200;
    const maxY = this.cameraY + GAME.HEIGHT + 500;

    // Create Platform objects from configs
    const platformConfigs = this.generator.getPlatformsInRange(minY, maxY);

    // Only add new platforms that aren't already in our list
    const existingPositions = new Set(
      this.platforms.map((p) => `${p.x},${p.y}`)
    );

    for (const config of platformConfigs) {
      const key = `${config.x},${config.y}`;
      if (!existingPositions.has(key)) {
        this.platforms.push(new Platform(config));
      }
    }

    // Remove platforms that are far below camera
    this.platforms = this.platforms.filter((p) => {
      const bounds = p.getBounds();
      return bounds.y + bounds.height >= minY - 500;
    });

    // Similar for coins
    const coinConfigs = this.generator.getCoinsInRange(minY, maxY);
    const existingCoinPositions = new Set(
      this.coins.map((c) => `${c.x},${c.y}`)
    );

    for (const config of coinConfigs) {
      const key = `${config.x},${config.y}`;
      if (!existingCoinPositions.has(key)) {
        this.coins.push(new Coin(config));
      }
    }

    // Remove collected or far coins
    this.coins = this.coins.filter((c) => {
      return c.y >= minY - 200 && (!c.collected || c.collectAnimation < 1);
    });
  }

  update(deltaTime: number): void {
    // Reset per-frame flags
    this.coinCollectedThisFrame = false;

    if (!this.state.isPlaying || this.state.isDead) {
      return;
    }

    // Update platforms and coins based on player position
    this.updatePlatformsAndCoins();

    // Update player
    this.player.update(deltaTime, this.jumpPressed, this.jumpHeld, this.platforms);
    this.jumpPressed = false;

    // Check for death
    if (this.player.isDead) {
      this.state.isDead = true;
      this.state.isPlaying = false;
      return;
    }

    // Track highest point reached
    if (this.player.y > this.highestY) {
      this.highestY = this.player.y;
      // Score is based on height
      this.state.score = Math.floor(this.highestY / 10);
    }

    // Update camera
    const targetCameraY = this.player.y - (GAME.HEIGHT - PLAYER.SCREEN_Y_POSITION);
    this.cameraY += (targetCameraY - this.cameraY) * 0.1;

    // Update platforms
    for (const platform of this.platforms) {
      platform.update(deltaTime);
    }

    // Update coins and check collection
    for (const coin of this.coins) {
      coin.update(deltaTime);

      if (!coin.collected && coin.checkCollision(this.player.getBounds())) {
        coin.collect();
        this.state.coinsCollected++;
        this.state.score += 5;
        this.coinCollectedThisFrame = true;
      }
    }
  }

  onJumpStart(): void {
    this.jumpPressed = true;
    this.jumpHeld = true;
  }

  onJumpEnd(): void {
    this.jumpHeld = false;
  }

  restart(): void {
    this.start();
  }

  getVisiblePlatforms(): Platform[] {
    const margin = 100;
    const minY = this.cameraY - margin;
    const maxY = this.cameraY + GAME.HEIGHT + margin;

    return this.platforms.filter((p) => {
      const bounds = p.getBounds();
      return bounds.y + bounds.height >= minY && bounds.y <= maxY && !p.isDestroyed;
    });
  }

  getVisibleCoins(): Coin[] {
    const margin = 100;
    const minY = this.cameraY - margin;
    const maxY = this.cameraY + GAME.HEIGHT + margin;

    return this.coins.filter((c) => c.y >= minY && c.y <= maxY);
  }

  worldToScreenY(worldY: number): number {
    return GAME.HEIGHT - (worldY - this.cameraY);
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX,
      y: this.worldToScreenY(worldY),
    };
  }

  getDistance(): number {
    return Math.floor(this.highestY / 100);
  }

  getDifficulty(): number {
    return this.generator.getDifficulty();
  }
}
