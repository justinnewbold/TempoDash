// Power-up system for gameplay enhancements
import { Rectangle } from '../types';
import { GAME_HEIGHT } from '../constants';

export type PowerUpType = 'shield' | 'magnet' | 'slowmo' | 'doublePoints';

export interface PowerUp {
  type: PowerUpType;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  animationTime: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  maxTime: number;
}

// Power-up configuration
export const POWER_UP_CONFIG: Record<PowerUpType, { duration: number; color: string; icon: string }> = {
  shield: {
    duration: 5000, // 5 seconds
    color: '#00aaff',
    icon: '🛡️',
  },
  magnet: {
    duration: 8000, // 8 seconds
    color: '#ff00ff',
    icon: '🧲',
  },
  slowmo: {
    duration: 4000, // 4 seconds
    color: '#ffff00',
    icon: '⏱️',
  },
  doublePoints: {
    duration: 10000, // 10 seconds
    color: '#ffd700',
    icon: '2️⃣',
  },
};

export class PowerUpManager {
  private powerUps: PowerUp[] = [];
  private activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();

  // Spawn a power-up at a position
  spawn(type: PowerUpType, x: number, y: number): PowerUp {
    const powerUp: PowerUp = {
      type,
      x,
      y,
      width: 30,
      height: 30,
      collected: false,
      animationTime: 0,
    };
    this.powerUps.push(powerUp);
    return powerUp;
  }

  // Clear all power-ups (on level reset)
  clear(): void {
    this.powerUps = [];
    this.activePowerUps.clear();
  }

  // Update power-ups
  update(deltaTime: number): void {
    // Update animation for uncollected power-ups and remove collected ones
    this.powerUps = this.powerUps.filter(powerUp => {
      if (powerUp.collected) return false;
      powerUp.animationTime += deltaTime;
      return true;
    });

    // Update active power-up timers
    for (const [type, active] of this.activePowerUps.entries()) {
      active.remainingTime -= deltaTime;
      if (active.remainingTime <= 0) {
        this.activePowerUps.delete(type);
      }
    }
  }

  // Check collision with player
  checkCollision(playerBounds: Rectangle): PowerUp | null {
    for (const powerUp of this.powerUps) {
      if (powerUp.collected) continue;

      // Simple AABB collision
      if (
        playerBounds.x < powerUp.x + powerUp.width &&
        playerBounds.x + playerBounds.width > powerUp.x &&
        playerBounds.y < powerUp.y + powerUp.height &&
        playerBounds.y + playerBounds.height > powerUp.y
      ) {
        powerUp.collected = true;
        this.activatePowerUp(powerUp.type);
        return powerUp;
      }
    }
    return null;
  }

  // Activate a power-up
  activatePowerUp(type: PowerUpType): void {
    const config = POWER_UP_CONFIG[type];
    this.activePowerUps.set(type, {
      type,
      remainingTime: config.duration,
      maxTime: config.duration,
    });
  }

  // Check if a power-up is active
  isActive(type: PowerUpType): boolean {
    return this.activePowerUps.has(type);
  }

  // Get remaining time for a power-up (0 if not active)
  getRemainingTime(type: PowerUpType): number {
    return this.activePowerUps.get(type)?.remainingTime ?? 0;
  }

  // Get progress (0-1) for a power-up
  getProgress(type: PowerUpType): number {
    const active = this.activePowerUps.get(type);
    if (!active) return 0;
    return active.remainingTime / active.maxTime;
  }

  // Get all active power-ups
  getActivePowerUps(): ActivePowerUp[] {
    return Array.from(this.activePowerUps.values());
  }

  // Get the slow-mo multiplier (1.0 if not active, 0.5 if active)
  getSlowMoMultiplier(): number {
    return this.isActive('slowmo') ? 0.5 : 1.0;
  }

  // Get the points multiplier
  getPointsMultiplier(): number {
    return this.isActive('doublePoints') ? 2 : 1;
  }

  // Get magnet range (0 if not active)
  getMagnetRange(): number {
    return this.isActive('magnet') ? 150 : 0;
  }

  // Check if shield is active (prevents death)
  hasShield(): boolean {
    return this.isActive('shield');
  }

  // Consume shield (called when player would die)
  consumeShield(): boolean {
    if (this.hasShield()) {
      this.activePowerUps.delete('shield');
      return true; // Shield consumed, player saved
    }
    return false;
  }

  // Render power-ups
  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    if (this.powerUps.length === 0) return;
    for (const powerUp of this.powerUps) {
      if (powerUp.collected) continue;

      const screenX = powerUp.x - cameraX;
      const screenY = powerUp.y;

      // Skip if off screen
      if (screenX < -50 || screenX > 1000) continue;

      const config = POWER_UP_CONFIG[powerUp.type];
      const bounce = Math.sin(powerUp.animationTime * 0.005) * 5;
      const pulse = Math.sin(powerUp.animationTime * 0.003) * 0.2 + 1;

      ctx.save();
      ctx.translate(screenX + powerUp.width / 2, screenY + powerUp.height / 2 + bounce);

      // Glow effect
      ctx.shadowColor = config.color;
      ctx.shadowBlur = 15 * pulse;

      // Power-up body
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.arc(0, 0, powerUp.width / 2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Inner circle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, powerUp.width / 3, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      ctx.shadowBlur = 0;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.icon, 0, 0);

      ctx.restore();
    }
  }

  // Render active power-up indicators in UI
  renderUI(ctx: CanvasRenderingContext2D): void {
    const activePowerUps = this.getActivePowerUps();
    if (activePowerUps.length === 0) return;

    const startX = 10;
    const startY = GAME_HEIGHT - 50;
    const spacing = 45;

    ctx.save();

    for (let i = 0; i < activePowerUps.length; i++) {
      const active = activePowerUps[i];
      const config = POWER_UP_CONFIG[active.type];
      const x = startX + i * spacing;
      const progress = active.remainingTime / active.maxTime;

      // Background circle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(x + 18, startY + 18, 18, 0, Math.PI * 2);
      ctx.fill();

      // Progress arc
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + 18, startY + 18, 16, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();

      // Icon
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.icon, x + 18, startY + 18);

      // Time remaining (if low)
      if (active.remainingTime < 2000) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText(Math.ceil(active.remainingTime / 1000).toString(), x + 18, startY + 35);
      }
    }

    ctx.restore();
  }

  // Render shield effect around player
  renderShieldEffect(ctx: CanvasRenderingContext2D, playerX: number, playerY: number, playerWidth: number, playerHeight: number): void {
    if (!this.hasShield()) return;

    const shieldProgress = this.getProgress('shield');
    const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 1;
    const alpha = 0.3 + (shieldProgress * 0.3);

    ctx.save();

    // Shield bubble
    const centerX = playerX + playerWidth / 2;
    const centerY = playerY + playerHeight / 2;
    const radius = Math.max(playerWidth, playerHeight) * 0.8 * pulse;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, `rgba(0, 170, 255, 0)`);
    gradient.addColorStop(0.7, `rgba(0, 170, 255, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(0, 170, 255, ${alpha})`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Shield border
    ctx.strokeStyle = `rgba(0, 200, 255, ${alpha + 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
