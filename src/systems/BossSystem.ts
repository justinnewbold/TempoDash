// Boss Rush System - Creates boss encounters with unique attack patterns
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export type BossType = 'crusher' | 'shooter' | 'chaser' | 'shapeshifter';

interface BossProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  active: boolean;
}

interface BossPhase {
  duration: number;  // ms
  attackPattern: 'slam' | 'sweep' | 'barrage' | 'chase';
  speed: number;
  projectileCount?: number;
}

export interface BossConfig {
  type: BossType;
  name: string;
  health: number;
  phases: BossPhase[];
  color: string;
  size: { width: number; height: number };
}

export class Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: BossType;
  name: string;
  color: string;

  phase = 1;
  private currentPhase = 0;
  private phaseTimer = 0;
  private attackTimer = 0;
  private phases: BossPhase[];
  private projectiles: BossProjectile[] = [];
  private animTime = 0;
  private targetY: number;
  private attackCooldown = 0;

  // Visual effects
  private damageFlash = 0;
  private shakeIntensity = 0;

  constructor(config: BossConfig, startX: number) {
    this.x = startX;
    this.y = 100;
    this.targetY = 100;
    this.width = config.size.width;
    this.height = config.size.height;
    this.health = config.health;
    this.maxHealth = config.health;
    this.type = config.type;
    this.name = config.name;
    this.color = config.color;
    this.phases = config.phases;

    // Pre-allocate projectiles
    for (let i = 0; i < 50; i++) {
      this.projectiles.push({ x: 0, y: 0, vx: 0, vy: 0, size: 10, active: false });
    }
  }

  update(deltaTime: number, playerX: number, playerY: number, cameraX: number): void {
    this.animTime += deltaTime;

    // Keep boss ahead of player
    const targetX = cameraX + GAME_WIDTH - 150;
    this.x += (targetX - this.x) * 0.02;

    // Phase management
    this.phaseTimer += deltaTime;
    const phase = this.phases[this.currentPhase];

    if (this.phaseTimer >= phase.duration) {
      this.phaseTimer = 0;
      this.currentPhase = (this.currentPhase + 1) % this.phases.length;
    }

    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Execute attack pattern
    this.attackTimer += deltaTime;
    if (this.attackTimer >= 1500 && this.attackCooldown <= 0) {
      this.executeAttack(phase, playerX, playerY, cameraX);
      this.attackTimer = 0;
      this.attackCooldown = 500;
    }

    // Smooth vertical movement
    this.y += (this.targetY - this.y) * 0.05;

    // Update projectiles
    this.updateProjectiles(deltaTime);

    // Decay visual effects
    if (this.damageFlash > 0) this.damageFlash -= deltaTime * 0.005;
    if (this.shakeIntensity > 0) this.shakeIntensity -= deltaTime * 0.01;
  }

  private executeAttack(phase: BossPhase, playerX: number, playerY: number, _cameraX: number): void {
    switch (phase.attackPattern) {
      case 'slam':
        // Move to player's Y position then slam down
        this.targetY = Math.max(50, Math.min(GAME_HEIGHT - this.height - 100, playerY - this.height / 2));
        break;

      case 'sweep':
        // Sweep across the screen
        this.targetY = this.targetY < GAME_HEIGHT / 2 ? GAME_HEIGHT - 150 : 100;
        break;

      case 'barrage':
        // Fire projectiles at player
        const count = phase.projectileCount || 5;
        for (let i = 0; i < count; i++) {
          this.fireProjectile(playerX, playerY, i * 0.2);
        }
        break;

      case 'chase':
        // Aggressively follow player
        this.targetY = playerY - this.height / 2;
        break;
    }
  }

  private fireProjectile(targetX: number, targetY: number, delay: number): void {
    setTimeout(() => {
      const proj = this.projectiles.find(p => !p.active);
      if (!proj) return;

      proj.active = true;
      proj.x = this.x;
      proj.y = this.y + this.height / 2;
      proj.size = 15;

      // Calculate direction to player
      const dx = targetX - proj.x;
      const dy = targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = 400;

      proj.vx = (dx / dist) * speed;
      proj.vy = (dy / dist) * speed;
    }, delay * 1000);
  }

  private updateProjectiles(deltaTime: number): void {
    const dt = deltaTime / 1000;

    for (const proj of this.projectiles) {
      if (!proj.active) continue;

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Deactivate if off screen
      if (proj.x < -50 || proj.x > GAME_WIDTH + 50 ||
          proj.y < -50 || proj.y > GAME_HEIGHT + 50) {
        proj.active = false;
      }
    }
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    this.damageFlash = 1;
    this.shakeIntensity = 1;
    return this.health <= 0;
  }

  checkPlayerCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number, cameraX: number): boolean {
    const screenX = this.x - cameraX;

    // Check boss body collision
    if (playerX + playerWidth > screenX &&
        playerX < screenX + this.width &&
        playerY + playerHeight > this.y &&
        playerY < this.y + this.height) {
      return true;
    }

    // Check projectile collisions
    for (const proj of this.projectiles) {
      if (!proj.active) continue;

      const projScreenX = proj.x;
      if (playerX + playerWidth > projScreenX - proj.size &&
          playerX < projScreenX + proj.size &&
          playerY + playerHeight > proj.y - proj.size &&
          playerY < proj.y + proj.size) {
        proj.active = false;  // Consume projectile
        return true;
      }
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.x - cameraX;

    ctx.save();

    // Apply shake
    if (this.shakeIntensity > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeIntensity * 10,
        (Math.random() - 0.5) * this.shakeIntensity * 10
      );
    }

    // Boss body
    const baseColor = this.damageFlash > 0 ? '#ffffff' : this.color;
    ctx.fillStyle = baseColor;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20 + Math.sin(this.animTime * 0.005) * 10;

    // Draw boss shape based on type
    switch (this.type) {
      case 'crusher':
        // Rectangular crusher
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Teeth
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
          const toothX = screenX + (this.width / 5) * i;
          ctx.beginPath();
          ctx.moveTo(toothX, this.y + this.height);
          ctx.lineTo(toothX + this.width / 10, this.y + this.height + 20);
          ctx.lineTo(toothX + this.width / 5, this.y + this.height);
          ctx.fill();
        }
        break;

      case 'shooter':
        // Circular shooter with cannons
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        // Cannon
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - 20, this.y + this.height / 2 - 10, 30, 20);
        break;

      case 'chaser':
        // Triangular chaser pointing left
        ctx.beginPath();
        ctx.moveTo(screenX, this.y + this.height / 2);
        ctx.lineTo(screenX + this.width, this.y);
        ctx.lineTo(screenX + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        break;

      case 'shapeshifter':
        // Morphing blob
        const time = this.animTime * 0.003;
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          const radius = (this.width / 2) * (1 + Math.sin(angle * 3 + time) * 0.2);
          const px = screenX + this.width / 2 + Math.cos(angle) * radius;
          const py = this.y + this.height / 2 + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
    }

    // Render projectiles
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff4444';
    for (const proj of this.projectiles) {
      if (!proj.active) continue;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Health bar
    this.renderHealthBar(ctx, screenX);
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D, screenX: number): void {
    const barWidth = this.width;
    const barHeight = 8;
    const barY = this.y - 20;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(screenX, barY, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
    ctx.fillStyle = healthColor;
    ctx.fillRect(screenX, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX, barY, barWidth, barHeight);

    // Boss name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, screenX + barWidth / 2, barY - 8);
  }

  isDefeated(): boolean {
    return this.health <= 0;
  }

  getHealthPercent(): number {
    return this.health / this.maxHealth;
  }
}

// Predefined boss configurations
export const BOSS_CONFIGS: Record<string, BossConfig> = {
  crusher: {
    type: 'crusher',
    name: 'THE CRUSHER',
    health: 100,
    color: '#ff4400',
    size: { width: 120, height: 80 },
    phases: [
      { duration: 5000, attackPattern: 'slam', speed: 1.0 },
      { duration: 3000, attackPattern: 'sweep', speed: 1.5 },
    ],
  },
  shooter: {
    type: 'shooter',
    name: 'PROJECTILE MASTER',
    health: 80,
    color: '#4400ff',
    size: { width: 100, height: 100 },
    phases: [
      { duration: 4000, attackPattern: 'barrage', speed: 1.0, projectileCount: 3 },
      { duration: 4000, attackPattern: 'barrage', speed: 1.2, projectileCount: 5 },
      { duration: 3000, attackPattern: 'chase', speed: 1.5 },
    ],
  },
  chaser: {
    type: 'chaser',
    name: 'THE HUNTER',
    health: 60,
    color: '#00ff44',
    size: { width: 80, height: 60 },
    phases: [
      { duration: 3000, attackPattern: 'chase', speed: 2.0 },
      { duration: 2000, attackPattern: 'sweep', speed: 2.5 },
    ],
  },
  shapeshifter: {
    type: 'shapeshifter',
    name: 'CHAOS ORB',
    health: 120,
    color: '#ff00ff',
    size: { width: 90, height: 90 },
    phases: [
      { duration: 4000, attackPattern: 'barrage', speed: 1.0, projectileCount: 4 },
      { duration: 3000, attackPattern: 'chase', speed: 1.5 },
      { duration: 3000, attackPattern: 'slam', speed: 2.0 },
    ],
  },
};

export class BossRushManager {
  private currentBoss: Boss | null = null;
  private bossQueue: string[] = [];
  private bossesDefeated = 0;
  private isActive = false;
  private transitionTimer = 0;
  private showingVictory = false;

  constructor() {}

  start(): void {
    this.isActive = true;
    this.bossesDefeated = 0;
    this.bossQueue = ['crusher', 'shooter', 'chaser', 'shapeshifter'];
    this.spawnNextBoss(0);
  }

  stop(): void {
    this.isActive = false;
    this.currentBoss = null;
    this.bossQueue = [];
  }

  private spawnNextBoss(cameraX: number): void {
    if (this.bossQueue.length === 0) {
      this.showingVictory = true;
      return;
    }

    const bossId = this.bossQueue.shift()!;
    const config = BOSS_CONFIGS[bossId];
    this.currentBoss = new Boss(config, cameraX + GAME_WIDTH + 100);
    this.transitionTimer = 2000;  // 2 second intro
  }

  update(deltaTime: number, playerX: number, playerY: number, cameraX: number): void {
    if (!this.isActive) return;

    if (this.transitionTimer > 0) {
      this.transitionTimer -= deltaTime;
      return;
    }

    if (this.currentBoss) {
      this.currentBoss.update(deltaTime, playerX, playerY, cameraX);

      if (this.currentBoss.isDefeated()) {
        this.bossesDefeated++;
        this.transitionTimer = 3000;  // Victory pause
        this.currentBoss = null;

        // Spawn next boss after delay
        setTimeout(() => {
          if (this.isActive) {
            this.spawnNextBoss(cameraX);
          }
        }, 3000);
      }
    }
  }

  checkPlayerCollision(bounds: { x: number; y: number; width: number; height: number }): boolean {
    if (!this.currentBoss || this.transitionTimer > 0) return false;
    // Use screen-relative coordinates (boss positions are screen-relative)
    return this.currentBoss.checkPlayerCollision(bounds.x, bounds.y, bounds.width, bounds.height, 0);
  }

  tryDamageBoss(bounds: { x: number; y: number; width: number; height: number }, isDashing: boolean): boolean {
    if (!this.currentBoss || this.transitionTimer > 0) return false;

    // Check if player is hitting boss from above or dashing into it
    const bossScreenX = this.currentBoss.x;  // Already screen relative
    const bossY = this.currentBoss.y;
    const bossWidth = this.currentBoss.width;
    const bossHeight = this.currentBoss.height;

    // Hitting from above (stomp)
    const isAbove = bounds.y + bounds.height <= bossY + 20 &&
                    bounds.x + bounds.width > bossScreenX &&
                    bounds.x < bossScreenX + bossWidth;

    // Dashing into boss from side
    const isSideHit = isDashing &&
                      bounds.x + bounds.width > bossScreenX &&
                      bounds.x < bossScreenX + bossWidth &&
                      bounds.y + bounds.height > bossY &&
                      bounds.y < bossY + bossHeight;

    if (isAbove || isSideHit) {
      const damage = isDashing ? 15 : 10;
      this.currentBoss.takeDamage(damage);
      return true;
    }

    return false;
  }

  getCurrentBoss(): { name: string; health: number; maxHealth: number; phase: number } | null {
    if (!this.currentBoss) return null;
    return {
      name: this.currentBoss.name,
      health: this.currentBoss.health,
      maxHealth: this.currentBoss.maxHealth,
      phase: this.getCurrentPhase(),
    };
  }

  private getCurrentPhase(): number {
    // Return a simple phase number (1-3)
    return Math.min(3, Math.floor((1 - (this.currentBoss?.getHealthPercent() || 1)) * 3) + 1);
  }

  getBossCount(): number {
    return Object.keys(BOSS_CONFIGS).length;
  }

  getCurrentBossIndex(): number {
    const totalBosses = this.getBossCount();
    return totalBosses - this.bossQueue.length - 1;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    if (!this.isActive) return;

    // Render boss
    if (this.currentBoss && this.transitionTimer <= 0) {
      this.currentBoss.render(ctx, cameraX);
    }

    // Render transition effects
    if (this.transitionTimer > 0 && this.currentBoss) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`BOSS: ${this.currentBoss.name}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

      ctx.font = '24px Arial';
      ctx.fillText('GET READY!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }

    // Victory screen
    if (this.showingVictory) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS RUSH COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2);

      ctx.font = '32px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Bosses Defeated: ${this.bossesDefeated}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
    }

    // Boss counter UI
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Bosses Defeated: ${this.bossesDefeated}/${Object.keys(BOSS_CONFIGS).length}`, 20, 80);
  }

  isInBossRush(): boolean {
    return this.isActive;
  }

  getBossesDefeated(): number {
    return this.bossesDefeated;
  }

  isVictory(): boolean {
    return this.showingVictory;
  }
}
