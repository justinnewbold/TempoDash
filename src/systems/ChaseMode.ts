// Chase Mode System - Wall of Death
// A deadly wall that chases the player, forcing fast gameplay

export interface ChaseConfig {
  enabled: boolean;
  initialDelay: number;      // ms before wall starts chasing
  baseSpeed: number;         // Base speed multiplier (1.0 = same as player)
  accelerationRate: number;  // How fast the wall speeds up
  wallWidth: number;         // Visual width of the wall
  warningDistance: number;   // Distance at which to show warning
}

export const DEFAULT_CHASE_CONFIG: ChaseConfig = {
  enabled: true,
  initialDelay: 2000,
  baseSpeed: 0.85,
  accelerationRate: 0.0001,
  wallWidth: 100,
  warningDistance: 200,
};

export class ChaseModeManager {
  private config: ChaseConfig;
  private wallX = -100;
  private isActive = false;
  private delayTimer = 0;
  private speedMultiplier = 1.0;
  private animTime = 0;

  constructor(config: Partial<ChaseConfig> = {}) {
    this.config = { ...DEFAULT_CHASE_CONFIG, ...config };
  }

  reset(): void {
    this.wallX = -100;
    this.isActive = false;
    this.delayTimer = 0;
    this.speedMultiplier = 1.0;
    this.animTime = 0;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  update(deltaTime: number, playerX: number, playerSpeed: number): void {
    if (!this.config.enabled) return;

    this.animTime += deltaTime;

    // Handle initial delay
    if (!this.isActive) {
      this.delayTimer += deltaTime;
      if (this.delayTimer >= this.config.initialDelay) {
        this.isActive = true;
        this.wallX = playerX - 400; // Start behind the player
      }
      return;
    }

    // Accelerate over time (cap at 5x to prevent impossible speeds)
    this.speedMultiplier = Math.min(
      this.speedMultiplier + this.config.accelerationRate * deltaTime,
      5.0
    );

    // Move the wall forward
    const wallSpeed = playerSpeed * this.config.baseSpeed * this.speedMultiplier;
    this.wallX += wallSpeed * (deltaTime / 1000);

    // Don't let wall get too far behind
    const minWallX = playerX - 600;
    if (this.wallX < minWallX) {
      this.wallX = minWallX;
    }
  }

  checkCollision(playerX: number): boolean {
    if (!this.isActive) return false;

    // Player dies if wall catches up
    return playerX - 20 < this.wallX + this.config.wallWidth;
  }

  getWallX(): number {
    return this.wallX;
  }

  isChaseActive(): boolean {
    return this.isActive;
  }

  getWarningLevel(playerX: number): number {
    if (!this.isActive) return 0;

    const distance = playerX - (this.wallX + this.config.wallWidth);
    if (distance > this.config.warningDistance) return 0;
    if (distance <= 0) return 1;

    return 1 - (distance / this.config.warningDistance);
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, gameHeight: number): void {
    if (!this.config.enabled) return;

    const screenX = this.wallX - cameraX;

    // Don't render if off screen to the left
    if (screenX + this.config.wallWidth < -50) return;

    ctx.save();

    // Create menacing gradient
    const gradient = ctx.createLinearGradient(
      screenX, 0,
      screenX + this.config.wallWidth, 0
    );

    // Pulsing opacity based on animation
    const pulse = 0.7 + Math.sin(this.animTime * 0.01) * 0.3;

    gradient.addColorStop(0, `rgba(50, 0, 0, ${pulse})`);
    gradient.addColorStop(0.3, `rgba(150, 0, 0, ${pulse * 0.9})`);
    gradient.addColorStop(0.6, `rgba(255, 50, 0, ${pulse * 0.8})`);
    gradient.addColorStop(0.9, `rgba(255, 100, 0, ${pulse * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(screenX, 0, this.config.wallWidth + 50, gameHeight);

    // Add lightning/energy effects
    ctx.strokeStyle = `rgba(255, 200, 0, ${pulse * 0.8})`;
    ctx.lineWidth = 3;

    const time = this.animTime * 0.005;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const startY = (gameHeight / 6) * (i + 0.5);
      let x = screenX + this.config.wallWidth * 0.7;
      let y = startY;

      ctx.moveTo(x, y);

      // Jagged lightning path
      for (let j = 0; j < 4; j++) {
        x += 15 + Math.random() * 10;
        y += (Math.sin(time + i + j) * 30);
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    // Danger text when active
    if (this.isActive) {
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillStyle = `rgba(255, 100, 0, ${pulse})`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;

      const textX = screenX + this.config.wallWidth + 30;
      if (textX > 0 && textX < 200) {
        ctx.fillText('⚠️ RUN!', textX, 50);
      }
    }

    ctx.restore();

    // Initial countdown before wall starts
    if (!this.isActive && this.config.enabled) {
      const countdown = Math.ceil((this.config.initialDelay - this.delayTimer) / 1000);
      if (countdown > 0 && countdown <= 3) {
        ctx.save();
        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 30;
        ctx.textAlign = 'center';
        ctx.fillText(`WALL INCOMING: ${countdown}`, 480, 100);
        ctx.restore();
      }
    }
  }

  renderWarning(ctx: CanvasRenderingContext2D, playerX: number, _cameraX: number, gameWidth: number): void {
    const warningLevel = this.getWarningLevel(playerX);
    if (warningLevel <= 0) return;

    ctx.save();

    // Red vignette from left side
    const gradient = ctx.createLinearGradient(0, 0, gameWidth * 0.3, 0);
    gradient.addColorStop(0, `rgba(255, 0, 0, ${warningLevel * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameWidth * 0.3, 600);

    // Warning text
    if (warningLevel > 0.5) {
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.fillStyle = `rgba(255, 50, 0, ${warningLevel})`;
      ctx.textAlign = 'left';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.fillText('⚠️ DANGER!', 20, 80);
    }

    ctx.restore();
  }
}
