import { Player } from '../entities/Player';
import { Platform } from '../entities/Platform';
import { Coin } from '../entities/Coin';
import { PowerUp } from '../entities/PowerUp';
import { LevelConfig, GameState, PowerUpType } from '../types';
import { PLAYER, GAME, COMBO, POWERUP } from '../constants';

export class GameEngine {
  player: Player;
  platforms: Platform[] = [];
  coins: Coin[] = [];
  powerUps: PowerUp[] = [];
  cameraY = 0;
  coinCollectedThisFrame = false;
  powerUpCollectedThisFrame = false;
  powerUpCollectedType: PowerUpType | null = null;

  state: GameState = {
    score: 0,
    coinsCollected: 0,
    isPlaying: false,
    isDead: false,
    isComplete: false,
    combo: 0,
    maxCombo: 0,
    scoreMultiplier: 1,
    activePowerUp: null,
    powerUpTimeRemaining: 0,
    hasShield: false,
  };

  private level: LevelConfig | null = null;
  private jumpPressed = false;
  private jumpHeld = false;
  private comboTimer = 0;
  private gameTime = 0;

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
      combo: 0,
      maxCombo: 0,
      scoreMultiplier: 1,
      activePowerUp: null,
      powerUpTimeRemaining: 0,
      hasShield: false,
    };

    this.comboTimer = 0;
    this.gameTime = 0;

    // Initialize player
    this.player.reset(level.playerStart);
    this.cameraY = level.playerStart.y - 200;

    // Create platforms
    this.platforms = level.platforms.map((config) => new Platform(config));

    // Create coins
    this.coins = level.coins.map((config) => new Coin(config));

    // Create power-ups
    this.powerUps = (level.powerUps || []).map((config) => new PowerUp(config));
  }

  update(deltaTime: number): void {
    // Reset per-frame flags
    this.coinCollectedThisFrame = false;
    this.powerUpCollectedThisFrame = false;
    this.powerUpCollectedType = null;

    if (!this.state.isPlaying || this.state.isDead || this.state.isComplete) {
      return;
    }

    // Apply slowmo power-up
    const effectiveDelta = this.state.activePowerUp === 'slowmo'
      ? deltaTime * POWERUP.SLOWMO_FACTOR
      : deltaTime;

    this.gameTime += effectiveDelta;

    // Update combo timer
    if (this.state.combo > 0) {
      this.comboTimer += effectiveDelta;
      if (this.comboTimer >= COMBO.TIMEOUT) {
        this.state.combo = 0;
        this.state.scoreMultiplier = 1;
      }
    }

    // Update power-up timer
    if (this.state.activePowerUp) {
      this.state.powerUpTimeRemaining -= effectiveDelta;
      if (this.state.powerUpTimeRemaining <= 0) {
        this.state.activePowerUp = null;
        this.state.powerUpTimeRemaining = 0;
      }
    }

    // Only pass nearby platforms for collision detection
    const nearbyPlatforms = this.getNearbyPlatforms();

    // Update player
    this.player.update(effectiveDelta, this.jumpPressed, this.jumpHeld, nearbyPlatforms);

    // Clear jump pressed flag (only active for one frame)
    this.jumpPressed = false;

    // Handle platform-specific effects after collision
    this.handlePlatformEffects(nearbyPlatforms);

    // Check for death
    if (this.player.isDead) {
      if (this.state.hasShield) {
        // Shield absorbs the hit
        this.state.hasShield = false;
        this.player.isDead = false;
        this.player.deathEvent = false;
        this.player.velocityY = PLAYER.JUMP_FORCE * 0.7; // Rescue jump
      } else {
        this.state.isDead = true;
        this.state.isPlaying = false;
        return;
      }
    }

    // Update camera to follow player
    const targetCameraY = this.player.y - (GAME.HEIGHT - PLAYER.SCREEN_Y_POSITION);
    this.cameraY += (targetCameraY - this.cameraY) * 0.1;

    // Update platforms
    for (const platform of this.platforms) {
      platform.update(effectiveDelta);
    }

    // Update coins and check collection
    const magnetRadius = this.state.activePowerUp === 'magnet' ? POWERUP.MAGNET_RADIUS : 0;

    for (const coin of this.coins) {
      coin.update(effectiveDelta);

      // Magnet attraction
      if (magnetRadius > 0 && !coin.collected) {
        const dx = this.player.x + this.player.width / 2 - coin.x;
        const dy = this.player.y + this.player.height / 2 - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < magnetRadius && dist > 0) {
          const force = (1 - dist / magnetRadius) * 5;
          coin.x += (dx / dist) * force;
          coin.y += (dy / dist) * force;
        }
      }

      if (!coin.collected && coin.checkCollision(this.player.getBounds())) {
        coin.collect();
        this.state.coinsCollected++;

        // Combo system
        this.state.combo++;
        this.comboTimer = 0;
        if (this.state.combo > this.state.maxCombo) {
          this.state.maxCombo = this.state.combo;
        }
        this.state.scoreMultiplier = Math.min(
          COMBO.MAX_MULTIPLIER,
          1 + (this.state.combo - 1) * COMBO.MULTIPLIER_INCREMENT
        );

        // Score calculation
        let baseScore = 10;
        if (this.state.activePowerUp === 'doublePoints') {
          baseScore *= 2;
        }
        this.state.score += Math.floor(baseScore * this.state.scoreMultiplier);
        this.coinCollectedThisFrame = true;
      }
    }

    // Update power-ups and check collection
    for (const powerUp of this.powerUps) {
      powerUp.update(effectiveDelta);

      if (!powerUp.collected && powerUp.checkCollision(this.player.getBounds())) {
        powerUp.collect();
        this.activatePowerUp(powerUp.type);
        this.powerUpCollectedThisFrame = true;
        this.powerUpCollectedType = powerUp.type;
      }
    }

    // Check for level completion
    if (this.level && this.player.y >= this.level.goalY) {
      this.state.isComplete = true;
      this.state.isPlaying = false;
    }
  }

  private handlePlatformEffects(platforms: Platform[]): void {
    for (const platform of platforms) {
      if (!platform.isCollidable()) continue;

      // Check if player is standing on this platform
      const pb = this.player.getBounds();
      const platBounds = platform.getBounds();
      const isOnPlatform =
        pb.x + pb.width > platBounds.x &&
        pb.x < platBounds.x + platBounds.width &&
        Math.abs(pb.y - (platBounds.y + platBounds.height)) < 5 &&
        this.player.isGrounded;

      if (!isOnPlatform) continue;

      switch (platform.type) {
        case 'conveyor':
          // Push player horizontally
          this.player.x += platform.conveyorSpeed * 0.016; // Approx 1 frame
          break;
        case 'ice':
          // Player slides - reduce friction (handled by velocity preservation in Player)
          break;
        case 'lava':
          // Instant death on lava
          if (!this.state.hasShield) {
            this.player.isDead = true;
            this.player.deathEvent = true;
          } else {
            this.state.hasShield = false;
            this.player.velocityY = PLAYER.JUMP_FORCE * 0.7;
          }
          break;
        case 'glass':
          // Glass starts breaking when landed on
          platform.hitGlass();
          break;
        case 'sticky':
          // Slow down auto-scroll temporarily
          // Handled by reducing player vertical movement
          break;
        case 'gravity':
          // Flip gravity (boost player upward)
          if (this.player.velocityY <= 0) {
            this.player.velocityY = PLAYER.JUMP_FORCE * 1.2;
          }
          break;
        case 'slowmo':
          // Temporary slow motion effect
          if (!this.state.activePowerUp) {
            this.state.activePowerUp = 'slowmo';
            this.state.powerUpTimeRemaining = 2000; // Brief 2-second slowmo
          }
          break;
      }
    }
  }

  private activatePowerUp(type: PowerUpType): void {
    switch (type) {
      case 'shield':
        this.state.hasShield = true;
        break;
      case 'magnet':
      case 'slowmo':
      case 'doublePoints':
        this.state.activePowerUp = type;
        this.state.powerUpTimeRemaining =
          type === 'magnet' ? POWERUP.MAGNET_DURATION :
          type === 'slowmo' ? POWERUP.SLOWMO_DURATION :
          POWERUP.DOUBLE_POINTS_DURATION;
        break;
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

  // Get platforms near player for collision detection (smaller range)
  private getNearbyPlatforms(): Platform[] {
    const margin = 150;
    const minY = this.player.y - margin;
    const maxY = this.player.y + margin;

    const nearby: Platform[] = [];
    for (const p of this.platforms) {
      const bounds = p.getBounds();
      if (bounds.y + bounds.height >= minY && bounds.y <= maxY && !p.isDestroyed && !p.isGlassBroken) {
        nearby.push(p);
      }
    }
    return nearby;
  }

  // Get entities visible on screen for rendering
  getVisiblePlatforms(): Platform[] {
    const margin = 200;
    const minY = this.cameraY - margin;
    const maxY = this.cameraY + GAME.HEIGHT + margin;

    return this.platforms.filter((p) => {
      const bounds = p.getBounds();
      return bounds.y + bounds.height >= minY && bounds.y <= maxY && !p.isDestroyed && !p.isGlassBroken;
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

  getVisiblePowerUps(): PowerUp[] {
    const margin = 100;
    const minY = this.cameraY - margin;
    const maxY = this.cameraY + GAME.HEIGHT + margin;

    return this.powerUps.filter((p) => {
      return !p.collected && p.y >= minY && p.y <= maxY;
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
