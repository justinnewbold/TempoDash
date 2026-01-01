import { Player } from '../entities/Player';
import { Platform } from '../entities/Platform';
import { Coin } from '../entities/Coin';
import { LevelConfig, GameState } from '../types';
import { PLAYER, GAME } from '../constants';

export class GameEngine {
  player: Player;
  platforms: Platform[] = [];
  coins: Coin[] = [];
  cameraY = 0;
  coinCollectedThisFrame = false;

  state: GameState = {
    score: 0,
    coinsCollected: 0,
    isPlaying: false,
    isDead: false,
    isComplete: false,
  };

  private level: LevelConfig | null = null;
  private jumpPressed = false;
  private jumpHeld = false;

  constructor() {
    this.player = new Player({ x: GAME.WIDTH / 2 - PLAYER.SIZE / 2, y: 100 });
  }

  loadLevel(level: LevelConfig): void {
    this.level = level;

    // Reset state
    this.state = {
      score: 0,
      coinsCollected: 0,
      isPlaying: true,
      isDead: false,
      isComplete: false,
    };

    // Initialize player
    this.player.reset(level.playerStart);
    this.cameraY = level.playerStart.y - 200;

    // Create platforms
    this.platforms = level.platforms.map((config) => new Platform(config));

    // Create coins
    this.coins = level.coins.map((config) => new Coin(config));
  }

  update(deltaTime: number): void {
    // Reset per-frame flags
    this.coinCollectedThisFrame = false;

    if (!this.state.isPlaying || this.state.isDead || this.state.isComplete) {
      return;
    }

    // Update player
    this.player.update(deltaTime, this.jumpPressed, this.jumpHeld, this.platforms);

    // Clear jump pressed flag (only active for one frame)
    this.jumpPressed = false;

    // Check for death
    if (this.player.isDead) {
      this.state.isDead = true;
      this.state.isPlaying = false;
      return;
    }

    // Update camera to follow player
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
        this.state.score += 10;
        this.coinCollectedThisFrame = true;
      }
    }

    // Check for level completion
    if (this.level && this.player.y >= this.level.goalY) {
      this.state.isComplete = true;
      this.state.isPlaying = false;
    }
  }

  // Input handling
  onJumpStart(): void {
    this.jumpPressed = true;
    this.jumpHeld = true;
  }

  onJumpEnd(): void {
    this.jumpHeld = false;
  }

  // Restart the current level
  restart(): void {
    if (this.level) {
      this.loadLevel(this.level);
    }
  }

  // Get entities visible on screen for rendering
  getVisiblePlatforms(): Platform[] {
    const margin = 200;
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

    return this.coins.filter((c) => {
      return c.y >= minY && c.y <= maxY;
    });
  }

  // Convert world Y to screen Y
  worldToScreenY(worldY: number): number {
    return GAME.HEIGHT - (worldY - this.cameraY);
  }

  // Convert world position to screen position
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX,
      y: this.worldToScreenY(worldY),
    };
  }
}
