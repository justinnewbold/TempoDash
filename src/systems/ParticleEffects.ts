// Particle effects manager using object pooling for performance
import {
  ObjectPool,
  DeathParticle, createDeathParticle,
  CoinParticle, createCoinParticle,
  FloatingText, createFloatingText,
  TrailParticle, createTrailParticle,
  DustParticle, createDustParticle,
  BurstParticle, createBurstParticle,
  SparkParticle, createSparkParticle
} from './ObjectPool';
import { GAME_WIDTH } from '../constants';

export class ParticleEffects {
  private deathParticles: ObjectPool<DeathParticle>;
  private coinParticles: ObjectPool<CoinParticle>;
  private floatingTexts: ObjectPool<FloatingText>;
  private trailParticles: ObjectPool<TrailParticle>;
  private dustParticles: ObjectPool<DustParticle>;
  private burstParticles: ObjectPool<BurstParticle>;
  private sparkParticles: ObjectPool<SparkParticle>;

  // Trail spawn timer
  private trailSpawnTimer = 0;
  private static readonly TRAIL_SPAWN_INTERVAL = 30; // ms between trail particles

  // Adaptive particle budget: skip spawns when too many active particles
  private static readonly MAX_ACTIVE_PARTICLES = 300;

  // Track firework show timeouts for cleanup
  private fireworkTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    this.deathParticles = new ObjectPool(createDeathParticle, 50, 100);
    this.coinParticles = new ObjectPool(createCoinParticle, 20, 50);
    this.floatingTexts = new ObjectPool(createFloatingText, 10, 30);
    this.trailParticles = new ObjectPool(createTrailParticle, 30, 60);
    this.dustParticles = new ObjectPool(createDustParticle, 20, 40);
    this.burstParticles = new ObjectPool(createBurstParticle, 30, 60);
    this.sparkParticles = new ObjectPool(createSparkParticle, 40, 80);
  }

  // Spawn death explosion particles
  spawnDeathExplosion(x: number, y: number, color: string = '#00ffaa'): void {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.deathParticles.acquire();
      if (!particle) break;

      const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.3;
      const speed = 150 + Math.random() * 200;

      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.size = 4 + Math.random() * 6;
      particle.color = color;
      particle.rotation = Math.random() * 360;
      particle.rotationSpeed = (Math.random() - 0.5) * 720;
      particle.maxLifetime = 600 + Math.random() * 400;
      particle.alpha = 1;
    }
  }

  // Spawn coin collect particles
  spawnCoinCollect(x: number, y: number): void {
    const particleCount = 5;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.coinParticles.acquire();
      if (!particle) break;

      particle.x = x + (Math.random() - 0.5) * 20;
      particle.y = y;
      particle.vy = -80 - Math.random() * 40;
      particle.alpha = 1;
      particle.scale = 0.5 + Math.random() * 0.5;
    }
  }

  // Spawn floating text (for combos, scores, etc.)
  spawnFloatingText(x: number, y: number, text: string, color: string = '#ffffff', fontSize: number = 20): void {
    const floatingText = this.floatingTexts.acquire();
    if (!floatingText) return;

    floatingText.x = x;
    floatingText.y = y;
    floatingText.text = text;
    floatingText.color = color;
    floatingText.fontSize = fontSize;
    floatingText.alpha = 1;
    floatingText.vy = -50;
    floatingText.maxLifetime = 1000;
  }

  // Spawn trail particle behind player
  spawnTrail(x: number, y: number, color: string = '#00ffaa', size: number = 8): void {
    const particle = this.trailParticles.acquire();
    if (!particle) return;

    particle.x = x;
    particle.y = y;
    particle.color = color;
    particle.size = size + Math.random() * 4;
    particle.alpha = 0.5;
    particle.maxLifetime = 250 + Math.random() * 100;
  }

  // Spawn landing dust particles
  spawnLandingDust(x: number, y: number, velocityScale: number = 1): void {
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.dustParticles.acquire();
      if (!particle) break;

      const direction = i < particleCount / 2 ? -1 : 1;
      particle.x = x + (Math.random() - 0.5) * 20;
      particle.y = y;
      particle.vx = direction * (50 + Math.random() * 50) * velocityScale;
      particle.vy = -20 - Math.random() * 30;
      particle.size = 3 + Math.random() * 3;
      particle.alpha = 0.5;
    }
  }

  // Spawn jump dust particles
  spawnJumpDust(x: number, y: number): void {
    const particleCount = 4;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.dustParticles.acquire();
      if (!particle) break;

      particle.x = x + (Math.random() - 0.5) * 15;
      particle.y = y;
      particle.vx = (Math.random() - 0.5) * 40;
      particle.vy = 20 + Math.random() * 20;
      particle.size = 2 + Math.random() * 2;
      particle.alpha = 0.4;
    }
  }

  // Spawn dash trail (more intense trail)
  spawnDashTrail(x: number, y: number, color: string = '#00ffff'): void {
    for (let i = 0; i < 3; i++) {
      const particle = this.trailParticles.acquire();
      if (!particle) break;

      particle.x = x + (Math.random() - 0.5) * 10;
      particle.y = y + (Math.random() - 0.5) * 15;
      particle.color = color;
      particle.size = 6 + Math.random() * 8;
      particle.alpha = 0.7;
      particle.maxLifetime = 150 + Math.random() * 100;
    }
  }

  // Spawn edge bounce burst (when player bounces off platform corner)
  spawnEdgeBounce(x: number, y: number, direction: 'left' | 'right'): void {
    const particleCount = 12;
    const baseAngle = direction === 'left' ? Math.PI * 0.75 : Math.PI * 0.25;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.burstParticles.acquire();
      if (!particle) break;

      const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.5;
      const speed = 150 + Math.random() * 150;

      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed - 100; // Bias upward
      particle.size = 4 + Math.random() * 6;
      particle.color = '#ffff00';
      particle.alpha = 1;
      particle.maxLifetime = 300 + Math.random() * 200;
    }
  }

  // Spawn bounce platform effect
  spawnBounceEffect(x: number, y: number, width: number): void {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.burstParticles.acquire();
      if (!particle) break;

      particle.x = x + Math.random() * width;
      particle.y = y;
      particle.vx = (Math.random() - 0.5) * 100;
      particle.vy = -150 - Math.random() * 100;
      particle.size = 3 + Math.random() * 4;
      particle.color = '#ff6b9d';
      particle.alpha = 1;
      particle.maxLifetime = 400;
    }
  }

  // Spawn wall slide sparks
  spawnWallSparks(x: number, y: number, side: 'left' | 'right'): void {
    if (this.isOverBudget()) return;
    const particle = this.sparkParticles.acquire();
    if (!particle) return;

    particle.x = x;
    particle.y = y;
    particle.vx = (side === 'left' ? 1 : -1) * (30 + Math.random() * 50);
    particle.vy = -20 + Math.random() * 40;
    particle.size = 1 + Math.random() * 2;
    particle.color = '#ffaa00';
    particle.alpha = 1;
  }

  // Spawn power-up collect burst
  spawnPowerUpCollect(x: number, y: number, color: string): void {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.burstParticles.acquire();
      if (!particle) break;

      const angle = (Math.PI * 2 / particleCount) * i;
      const speed = 100 + Math.random() * 100;

      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.size = 5 + Math.random() * 5;
      particle.color = color;
      particle.alpha = 1;
      particle.maxLifetime = 500;
    }
  }

  // Spawn gravity flip effect
  spawnGravityFlip(x: number, y: number, flipped: boolean): void {
    const particleCount = 10;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.burstParticles.acquire();
      if (!particle) break;

      particle.x = x + (Math.random() - 0.5) * 40;
      particle.y = y + (Math.random() - 0.5) * 40;
      particle.vx = (Math.random() - 0.5) * 80;
      particle.vy = (flipped ? 1 : -1) * (50 + Math.random() * 100);
      particle.size = 4 + Math.random() * 4;
      particle.color = '#ed64a6';
      particle.alpha = 1;
      particle.maxLifetime = 400;
    }
  }

  // Spawn ice slide particles
  spawnIceSlide(x: number, y: number): void {
    if (this.isOverBudget()) return;
    const particle = this.sparkParticles.acquire();
    if (!particle) return;

    particle.x = x + (Math.random() - 0.5) * 20;
    particle.y = y;
    particle.vx = (Math.random() - 0.5) * 30;
    particle.vy = -10 - Math.random() * 20;
    particle.size = 2 + Math.random() * 2;
    particle.color = '#88ddff';
    particle.alpha = 0.8;
  }

  // Spawn crumble particles when platform breaks
  spawnCrumble(x: number, y: number, width: number, height: number): void {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.deathParticles.acquire();
      if (!particle) break;

      particle.x = x + Math.random() * width;
      particle.y = y + Math.random() * height;
      particle.vx = (Math.random() - 0.5) * 100;
      particle.vy = 50 + Math.random() * 100;
      particle.size = 4 + Math.random() * 8;
      particle.color = '#aa8866';
      particle.rotation = Math.random() * 360;
      particle.rotationSpeed = (Math.random() - 0.5) * 360;
      particle.alpha = 1;
      particle.maxLifetime = 800;
    }
  }

  // ===== FIREWORKS FOR PERFECT RUNS AND CELEBRATIONS =====

  // Spawn a firework burst at position
  spawnFirework(x: number, y: number, color?: string): void {
    const colors = ['#ff0000', '#00ff00', '#0088ff', '#ff00ff', '#ffff00', '#00ffff', '#ff8800'];
    const burstColor = color || colors[Math.floor(Math.random() * colors.length)];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.burstParticles.acquire();
      if (!particle) break;

      const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.3;
      const speed = 150 + Math.random() * 150;

      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.size = 3 + Math.random() * 4;
      particle.color = burstColor;
      particle.alpha = 1;
      particle.maxLifetime = 800 + Math.random() * 400;
    }

    // Spawn secondary sparkles
    for (let i = 0; i < 10; i++) {
      const spark = this.sparkParticles.acquire();
      if (!spark) break;

      spark.x = x;
      spark.y = y;
      spark.vx = (Math.random() - 0.5) * 300;
      spark.vy = (Math.random() - 0.5) * 300;
      spark.size = 1 + Math.random() * 2;
      spark.color = '#ffffff';
      spark.alpha = 1;
    }
  }

  // Spawn multiple fireworks for big celebrations
  spawnFireworkShow(centerX: number, centerY: number, count: number = 5): void {
    const delay = 200;
    for (let i = 0; i < count; i++) {
      const timeoutId = setTimeout(() => {
        const x = centerX + (Math.random() - 0.5) * 300;
        const y = centerY + (Math.random() - 0.5) * 150;
        this.spawnFirework(x, y);
        // Remove this timeout from tracking array
        const idx = this.fireworkTimeouts.indexOf(timeoutId);
        if (idx !== -1) this.fireworkTimeouts.splice(idx, 1);
      }, i * delay);
      this.fireworkTimeouts.push(timeoutId);
    }
  }

  // Spawn celebration confetti
  spawnConfetti(x: number, y: number, width: number): void {
    const colors = ['#ff0000', '#00ff00', '#0088ff', '#ff00ff', '#ffff00', '#ff8800', '#00ffff'];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.deathParticles.acquire();
      if (!particle) break;

      particle.x = x + Math.random() * width;
      particle.y = y;
      particle.vx = (Math.random() - 0.5) * 150;
      particle.vy = -200 - Math.random() * 150;
      particle.size = 4 + Math.random() * 6;
      particle.color = colors[Math.floor(Math.random() * colors.length)];
      particle.rotation = Math.random() * 360;
      particle.rotationSpeed = (Math.random() - 0.5) * 720;
      particle.alpha = 1;
      particle.maxLifetime = 2000 + Math.random() * 1000;
    }
  }

  // Spawn rainbow trail particle
  spawnRainbowTrail(x: number, y: number, hueOffset: number): void {
    if (this.isOverBudget()) return;
    const particle = this.trailParticles.acquire();
    if (!particle) return;

    const hue = (Date.now() / 10 + hueOffset) % 360;
    particle.x = x;
    particle.y = y;
    particle.color = `hsl(${hue}, 100%, 60%)`;
    particle.size = 10 + Math.random() * 4;
    particle.alpha = 0.7;
    particle.maxLifetime = 400;
  }

  /** Check if we're over the particle budget and should skip non-essential spawns */
  private isOverBudget(): boolean {
    return this.getActiveCount() > ParticleEffects.MAX_ACTIVE_PARTICLES;
  }

  // Update trail spawning based on player movement
  updateTrail(deltaTime: number, playerX: number, playerY: number, playerColor: string, isMoving: boolean, isDashing: boolean): void {
    if (!isMoving) return;

    this.trailSpawnTimer += deltaTime;
    if (this.trailSpawnTimer >= ParticleEffects.TRAIL_SPAWN_INTERVAL) {
      this.trailSpawnTimer = 0;

      // Skip trail particles when over budget to maintain frame rate
      if (this.isOverBudget()) return;

      if (isDashing) {
        this.spawnDashTrail(playerX, playerY, playerColor);
      } else {
        this.spawnTrail(playerX, playerY, playerColor, 6);
      }
    }
  }

  // Update all particles
  update(deltaTime: number): void {
    const dt = deltaTime / 1000;

    // Update death particles
    this.deathParticles.forEach((particle) => {
      particle.lifetime += deltaTime;
      if (particle.lifetime >= particle.maxLifetime) {
        this.deathParticles.release(particle);
        return;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 400 * dt; // Gravity
      particle.rotation += particle.rotationSpeed * dt;
      particle.alpha = 1 - (particle.lifetime / particle.maxLifetime);
      particle.size *= 0.995;
    });

    // Update coin particles
    this.coinParticles.forEach((particle) => {
      particle.lifetime += deltaTime;
      if (particle.lifetime >= 500) {
        this.coinParticles.release(particle);
        return;
      }

      particle.y += particle.vy * dt;
      particle.vy += 100 * dt;
      particle.alpha = 1 - (particle.lifetime / 500);
      particle.scale *= 0.98;
    });

    // Update floating texts
    this.floatingTexts.forEach((text) => {
      text.lifetime += deltaTime;
      if (text.lifetime >= text.maxLifetime) {
        this.floatingTexts.release(text);
        return;
      }

      text.y += text.vy * dt;
      text.alpha = 1 - (text.lifetime / text.maxLifetime);
    });

    // Update trail particles
    this.trailParticles.forEach((particle) => {
      particle.lifetime += deltaTime;
      if (particle.lifetime >= particle.maxLifetime) {
        this.trailParticles.release(particle);
        return;
      }

      particle.alpha = 0.5 * (1 - particle.lifetime / particle.maxLifetime);
      particle.size *= 0.97;
    });

    // Update dust particles
    this.dustParticles.forEach((particle) => {
      particle.lifetime += deltaTime;
      if (particle.lifetime >= 400) {
        this.dustParticles.release(particle);
        return;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 100 * dt; // Light gravity
      particle.alpha = 0.6 * (1 - particle.lifetime / 400);
      particle.size *= 0.98;
    });

    // Update burst particles
    this.burstParticles.forEach((particle) => {
      particle.lifetime += deltaTime;
      if (particle.lifetime >= particle.maxLifetime) {
        this.burstParticles.release(particle);
        return;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 300 * dt; // Gravity
      particle.alpha = 1 - (particle.lifetime / particle.maxLifetime);
      particle.size *= 0.97;
    });

    // Update spark particles
    this.sparkParticles.forEach((particle) => {
      particle.lifetime += deltaTime;
      if (particle.lifetime >= 200) {
        this.sparkParticles.release(particle);
        return;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 200 * dt;
      particle.alpha = 1 - (particle.lifetime / 200);
    });
  }

  // Render all particles
  render(ctx: CanvasRenderingContext2D, cameraX: number = 0): void {
    // Render trail particles (behind everything)
    // Use single save/restore for entire batch instead of per-particle
    ctx.save();
    this.trailParticles.forEach((particle) => {
      const screenX = particle.x - cameraX;
      if (screenX < -50 || screenX > GAME_WIDTH + 50) return;

      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(screenX, particle.y, particle.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Render dust particles
    ctx.save();
    ctx.shadowBlur = 0; // No shadow for dust
    this.dustParticles.forEach((particle) => {
      const screenX = particle.x - cameraX;
      if (screenX < -50 || screenX > GAME_WIDTH + 50) return;

      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
      ctx.beginPath();
      ctx.arc(screenX, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Render death particles (need individual save/restore for rotation)
    this.deathParticles.forEach((particle) => {
      const screenX = particle.x - cameraX;
      if (screenX < -50 || screenX > GAME_WIDTH + 50) return;

      ctx.save();
      ctx.translate(screenX, particle.y);
      ctx.rotate(particle.rotation * Math.PI / 180);
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
    });

    // Render coin particles (batched)
    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    this.coinParticles.forEach((particle) => {
      const screenX = particle.x - cameraX;
      if (screenX < -50 || screenX > GAME_WIDTH + 50) return;

      ctx.globalAlpha = particle.alpha;
      ctx.beginPath();
      ctx.arc(screenX, particle.y, 5 * particle.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Render floating texts (batched)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    this.floatingTexts.forEach((text) => {
      const screenX = text.x - cameraX;
      if (screenX < -100 || screenX > GAME_WIDTH + 100) return;

      ctx.globalAlpha = text.alpha;
      ctx.fillStyle = text.color;
      ctx.font = `bold ${text.fontSize}px Arial`;
      ctx.fillText(text.text, screenX, text.y);
    });
    ctx.restore();

    // Render burst particles (batched)
    ctx.save();
    ctx.shadowBlur = 12;
    this.burstParticles.forEach((particle) => {
      const screenX = particle.x - cameraX;
      if (screenX < -50 || screenX > GAME_WIDTH + 50) return;

      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.beginPath();
      ctx.arc(screenX, particle.y, particle.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Render spark particles (batched)
    ctx.save();
    ctx.shadowBlur = 6;
    this.sparkParticles.forEach((particle) => {
      const screenX = particle.x - cameraX;
      if (screenX < -50 || screenX > GAME_WIDTH + 50) return;

      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.beginPath();
      ctx.arc(screenX, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Get active particle count for debugging
  getActiveCount(): number {
    return this.deathParticles.getActiveCount() +
           this.coinParticles.getActiveCount() +
           this.floatingTexts.getActiveCount() +
           this.trailParticles.getActiveCount() +
           this.dustParticles.getActiveCount() +
           this.burstParticles.getActiveCount() +
           this.sparkParticles.getActiveCount();
  }

  // Clear all particles (on level change)
  clear(): void {
    this.deathParticles.releaseAll();
    this.coinParticles.releaseAll();
    this.floatingTexts.releaseAll();
    this.trailParticles.releaseAll();
    this.dustParticles.releaseAll();
    this.burstParticles.releaseAll();
    this.sparkParticles.releaseAll();

    // Clear any pending firework timeouts
    for (const timeoutId of this.fireworkTimeouts) {
      clearTimeout(timeoutId);
    }
    this.fireworkTimeouts = [];
  }
}
