// Boss Mode System - Adds boss encounters to certain levels
// Bosses are environmental hazards that pursue or challenge the player

import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

export type BossType = 'chaser' | 'shooter' | 'stomper';

interface BossConfig {
  type: BossType;
  name: string;
  color: string;
  glowColor: string;
  speed: number;
  size: number;
  attackInterval: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  lifetime: number;
}

const BOSS_CONFIGS: Record<number, BossConfig> = {
  5: {
    type: 'chaser',
    name: 'Shadow Beast',
    color: '#440066',
    glowColor: '#aa00ff',
    speed: 180,
    size: 80,
    attackInterval: 0,
  },
  10: {
    type: 'shooter',
    name: 'Storm Eye',
    color: '#004466',
    glowColor: '#00aaff',
    speed: 100,
    size: 100,
    attackInterval: 2000,
  },
  15: {
    type: 'stomper',
    name: 'Titan',
    color: '#660000',
    glowColor: '#ff4400',
    speed: 150,
    size: 120,
    attackInterval: 3000,
  },
};

export class BossManager {
  private active = false;
  private bossX = 0;
  private bossY = 0;
  private bossConfig: BossConfig | null = null;

  // Animation
  private animTimer = 0;
  private pulsePhase = 0;
  private eyeAngle = 0;

  // Attacks
  private attackTimer = 0;
  private projectiles: Projectile[] = [];
  private stompWarningY = -1;
  private stompTimer = 0;
  private stompResetTimer: ReturnType<typeof setTimeout> | null = null;

  // State
  private isEnraged = false;
  private damageFlash = 0;
  private defeated = false;

  /**
   * Initialize boss for a level (if applicable)
   */
  initForLevel(levelId: number, playerStartX: number): void {
    this.bossConfig = BOSS_CONFIGS[levelId] || null;
    this.active = this.bossConfig !== null;
    this.defeated = false;

    if (this.bossConfig) {
      // Position boss based on type
      if (this.bossConfig.type === 'chaser') {
        this.bossX = playerStartX - 300; // Start behind player
        this.bossY = GAME_HEIGHT - 150;
      } else if (this.bossConfig.type === 'shooter') {
        this.bossX = GAME_WIDTH + 50; // Off-screen right (will track player)
        this.bossY = 100;
      } else if (this.bossConfig.type === 'stomper') {
        this.bossX = playerStartX + GAME_WIDTH / 2;
        this.bossY = -100; // Above screen
      }
    }

    this.projectiles = [];
    this.attackTimer = 0;
    this.isEnraged = false;
  }

  /**
   * Check if boss is active for this level
   */
  isActive(): boolean {
    return this.active && !this.defeated;
  }

  /**
   * Get boss name for UI
   */
  getBossName(): string {
    return this.bossConfig?.name || '';
  }

  /**
   * Update boss logic
   */
  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    levelProgress: number
  ): { hitPlayer: boolean; warning: boolean } {
    if (!this.active || !this.bossConfig || this.defeated) {
      return { hitPlayer: false, warning: false };
    }

    const dt = deltaTime / 1000;

    // Animation
    this.animTimer += deltaTime;
    this.pulsePhase = Math.sin(this.animTimer / 200) * 0.2 + 1;

    // Track player with eye
    const dx = playerX - this.bossX;
    const dy = playerY - this.bossY;
    this.eyeAngle = Math.atan2(dy, dx);

    // Enrage at 75% progress
    if (levelProgress > 0.75 && !this.isEnraged) {
      this.isEnraged = true;
    }

    const speedMultiplier = this.isEnraged ? 1.5 : 1.0;
    let hitPlayer = false;
    let warning = false;

    // Boss-specific behavior
    switch (this.bossConfig.type) {
      case 'chaser':
        // Chase player from behind
        const targetX = playerX - 200;
        const chaseSpeed = this.bossConfig.speed * speedMultiplier * dt;
        this.bossX += (targetX - this.bossX) * 0.02 * chaseSpeed;
        this.bossY = GAME_HEIGHT - 150 + Math.sin(this.animTimer / 300) * 30;

        // Check collision
        if (this.checkPlayerCollision(playerX, playerY)) {
          hitPlayer = true;
        }

        // Warning if getting close
        if (playerX - this.bossX < 250) {
          warning = true;
        }
        break;

      case 'shooter':
        // Float above and shoot
        this.bossX = playerX + 150 + Math.sin(this.animTimer / 500) * 100;
        this.bossY = 80 + Math.sin(this.animTimer / 400) * 40;

        // Shoot projectiles
        this.attackTimer += deltaTime;
        const shootInterval = this.bossConfig.attackInterval / speedMultiplier;
        if (this.attackTimer >= shootInterval) {
          this.attackTimer = 0;
          this.shootProjectile(playerX, playerY);
        }

        // Update projectiles
        for (const proj of this.projectiles) {
          proj.x += proj.vx * dt;
          proj.y += proj.vy * dt;
          proj.lifetime -= deltaTime;

          // Check projectile collision with player
          const pdx = proj.x - playerX;
          const pdy = proj.y - playerY;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < proj.size + 20) {
            hitPlayer = true;
          }
        }

        // Remove dead projectiles
        this.projectiles = this.projectiles.filter(p => p.lifetime > 0);
        break;

      case 'stomper':
        // Stomp from above
        this.bossX = playerX + Math.sin(this.animTimer / 600) * 50;

        this.attackTimer += deltaTime;
        const stompInterval = this.bossConfig.attackInterval / speedMultiplier;

        if (this.stompWarningY < 0 && this.attackTimer >= stompInterval) {
          // Start stomp warning
          this.stompWarningY = playerX;
          this.stompTimer = 800; // Warning duration
          this.attackTimer = 0;
          warning = true;
        }

        if (this.stompWarningY >= 0) {
          this.stompTimer -= deltaTime;
          warning = true;

          if (this.stompTimer <= 0) {
            // Execute stomp
            this.bossY = GAME_HEIGHT - this.bossConfig.size;

            // Check if player is in stomp zone
            if (Math.abs(playerX - this.stompWarningY) < this.bossConfig.size) {
              hitPlayer = true;
            }

            // Reset after stomp (track timer to clear on reset)
            if (this.stompResetTimer !== null) {
              clearTimeout(this.stompResetTimer);
            }
            this.stompResetTimer = setTimeout(() => {
              this.bossY = -100;
              this.stompWarningY = -1;
              this.stompResetTimer = null;
            }, 300);
          }
        } else {
          this.bossY = -100 + Math.sin(this.animTimer / 200) * 20;
        }
        break;
    }

    // Decay damage flash
    if (this.damageFlash > 0) {
      this.damageFlash -= deltaTime / 200;
    }

    return { hitPlayer, warning };
  }

  private shootProjectile(playerX: number, playerY: number): void {
    if (!this.bossConfig) return;

    const angle = Math.atan2(playerY - this.bossY, playerX - this.bossX);
    const speed = 300;

    this.projectiles.push({
      x: this.bossX,
      y: this.bossY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 15,
      color: this.bossConfig.glowColor,
      lifetime: 3000,
    });

    // Shoot spread in enraged mode
    if (this.isEnraged) {
      const spread = 0.3;
      this.projectiles.push({
        x: this.bossX,
        y: this.bossY,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        size: 12,
        color: this.bossConfig.glowColor,
        lifetime: 3000,
      });
      this.projectiles.push({
        x: this.bossX,
        y: this.bossY,
        vx: Math.cos(angle - spread) * speed,
        vy: Math.sin(angle - spread) * speed,
        size: 12,
        color: this.bossConfig.glowColor,
        lifetime: 3000,
      });
    }
  }

  private checkPlayerCollision(playerX: number, playerY: number): boolean {
    if (!this.bossConfig) return false;

    const dx = playerX - this.bossX;
    const dy = playerY - this.bossY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist < this.bossConfig.size / 2 + 20;
  }

  /**
   * Mark boss as defeated (player completed level)
   */
  defeatBoss(): void {
    this.defeated = true;
    this.damageFlash = 1.0;
  }

  /**
   * Render the boss
   */
  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    if (!this.active || !this.bossConfig || this.defeated) return;

    const screenX = this.bossX - cameraX;
    const size = this.bossConfig.size * this.pulsePhase;

    ctx.save();

    // Glow effect
    const gradient = ctx.createRadialGradient(
      screenX, this.bossY, 0,
      screenX, this.bossY, size
    );
    gradient.addColorStop(0, this.bossConfig.glowColor);
    gradient.addColorStop(0.5, this.bossConfig.color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, this.bossY, size, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = this.damageFlash > 0 ? '#ffffff' : this.bossConfig.color;
    ctx.beginPath();
    ctx.arc(screenX, this.bossY, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = this.isEnraged ? '#ff0000' : '#ffffff';
    const eyeX = screenX + Math.cos(this.eyeAngle) * size * 0.2;
    const eyeY = this.bossY + Math.sin(this.eyeAngle) * size * 0.2;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#000000';
    const pupilX = eyeX + Math.cos(this.eyeAngle) * size * 0.05;
    const pupilY = eyeY + Math.sin(this.eyeAngle) * size * 0.05;
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Render projectiles
    for (const proj of this.projectiles) {
      const projScreenX = proj.x - cameraX;

      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(projScreenX, proj.y, proj.size, 0, Math.PI * 2);
      ctx.fill();

      // Projectile glow
      ctx.fillStyle = `${proj.color}44`;
      ctx.beginPath();
      ctx.arc(projScreenX, proj.y, proj.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render stomp warning
    if (this.stompWarningY >= 0 && this.bossConfig.type === 'stomper') {
      const warningX = this.stompWarningY - cameraX;
      const warningAlpha = Math.sin(this.animTimer / 50) * 0.3 + 0.5;

      ctx.fillStyle = `rgba(255, 0, 0, ${warningAlpha})`;
      ctx.fillRect(
        warningX - this.bossConfig.size / 2,
        0,
        this.bossConfig.size,
        GAME_HEIGHT
      );

      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', warningX, 30);
    }

    // Boss name (if close to screen)
    if (screenX > -100 && screenX < GAME_WIDTH + 100) {
      ctx.fillStyle = this.bossConfig.glowColor;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.bossConfig.name, screenX, this.bossY - size - 10);

      if (this.isEnraged) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('ENRAGED!', screenX, this.bossY - size - 25);
      }
    }

    ctx.restore();
  }

  /**
   * Reset boss state
   */
  reset(): void {
    this.active = false;
    this.bossConfig = null;
    this.projectiles = [];
    this.defeated = false;
    this.isEnraged = false;
    if (this.stompResetTimer !== null) {
      clearTimeout(this.stompResetTimer);
      this.stompResetTimer = null;
    }
  }
}
