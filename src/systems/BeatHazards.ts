// Beat-Synced Hazards System
// Sawblades, lasers, and crushing blocks that activate on the beat

import { Rectangle } from '../types';

export type BeatHazardType = 'sawblade' | 'laser' | 'crusher';

export interface BeatHazardConfig {
  type: BeatHazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  // Beat pattern: array of 0s and 1s for each beat in the cycle
  // e.g., [1, 0, 1, 0] = active on beats 1 and 3, inactive on 2 and 4
  pattern: number[];
  // Optional: offset in beats (0-based)
  patternOffset?: number;
}

export class BeatHazard {
  type: BeatHazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  pattern: number[];
  patternOffset: number;

  private isActive = false;
  private activationProgress = 0;  // 0-1 for smooth transitions
  private animationTime = 0;
  private sawbladeRotation = 0;
  private crusherY = 0;
  private crusherBaseY: number;

  // Crusher animation
  private static readonly CRUSHER_TRAVEL = 80;
  private static readonly CRUSHER_SPEED = 800;  // pixels per second when slamming

  constructor(config: BeatHazardConfig) {
    this.type = config.type;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.pattern = config.pattern;
    this.patternOffset = config.patternOffset || 0;
    this.crusherBaseY = config.y;
    this.crusherY = config.y;
  }

  update(deltaTime: number, currentBeat: number): void {
    this.animationTime += deltaTime;

    // Determine if hazard should be active based on pattern
    const patternIndex = (currentBeat + this.patternOffset) % this.pattern.length;
    const shouldBeActive = this.pattern[patternIndex] === 1;

    // Smooth transition
    const transitionSpeed = 0.01 * deltaTime;
    if (shouldBeActive) {
      this.activationProgress = Math.min(1, this.activationProgress + transitionSpeed);
    } else {
      this.activationProgress = Math.max(0, this.activationProgress - transitionSpeed);
    }
    this.isActive = this.activationProgress > 0.5;

    // Type-specific animations
    switch (this.type) {
      case 'sawblade':
        // Rotate constantly, faster when active
        const rotationSpeed = this.isActive ? 720 : 180;  // degrees per second
        this.sawbladeRotation += rotationSpeed * (deltaTime / 1000);
        break;

      case 'crusher':
        // Slam down when active, retract when inactive
        if (shouldBeActive) {
          this.crusherY = Math.min(
            this.crusherBaseY + BeatHazard.CRUSHER_TRAVEL,
            this.crusherY + BeatHazard.CRUSHER_SPEED * (deltaTime / 1000)
          );
        } else {
          this.crusherY = Math.max(
            this.crusherBaseY,
            this.crusherY - BeatHazard.CRUSHER_SPEED * 0.5 * (deltaTime / 1000)
          );
        }
        break;

      case 'laser':
        // Laser is instant on/off, handled by activationProgress
        break;
    }
  }

  // Check collision with player
  checkCollision(playerBounds: Rectangle): boolean {
    if (!this.isActive) return false;

    const hazardBounds = this.getBounds();

    return !(
      playerBounds.x + playerBounds.width <= hazardBounds.x ||
      playerBounds.x >= hazardBounds.x + hazardBounds.width ||
      playerBounds.y + playerBounds.height <= hazardBounds.y ||
      playerBounds.y >= hazardBounds.y + hazardBounds.height
    );
  }

  getBounds(): Rectangle {
    switch (this.type) {
      case 'crusher':
        return {
          x: this.x,
          y: this.crusherY,
          width: this.width,
          height: this.height,
        };
      default:
        return {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height,
        };
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.x - cameraX;

    // Skip if off-screen
    if (screenX + this.width < -50 || screenX > 600) return;

    ctx.save();

    // Base alpha based on activation
    const alpha = 0.3 + this.activationProgress * 0.7;
    ctx.globalAlpha = alpha;

    switch (this.type) {
      case 'sawblade':
        this.renderSawblade(ctx, screenX);
        break;
      case 'laser':
        this.renderLaser(ctx, screenX);
        break;
      case 'crusher':
        this.renderCrusher(ctx, screenX);
        break;
    }

    ctx.restore();
  }

  private renderSawblade(ctx: CanvasRenderingContext2D, screenX: number): void {
    const centerX = screenX + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = Math.min(this.width, this.height) / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((this.sawbladeRotation * Math.PI) / 180);

    // Outer glow when active
    if (this.isActive) {
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 20;
    }

    // Main blade circle
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, '#666666');
    gradient.addColorStop(0.7, '#444444');
    gradient.addColorStop(1, '#222222');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Teeth
    ctx.fillStyle = this.isActive ? '#ff6666' : '#888888';
    const teethCount = 12;
    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2;
      const innerRadius = radius * 0.6;
      const outerRadius = radius;
      const toothWidth = 0.15;

      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle - toothWidth) * innerRadius,
        Math.sin(angle - toothWidth) * innerRadius
      );
      ctx.lineTo(
        Math.cos(angle) * outerRadius,
        Math.sin(angle) * outerRadius
      );
      ctx.lineTo(
        Math.cos(angle + toothWidth) * innerRadius,
        Math.sin(angle + toothWidth) * innerRadius
      );
      ctx.closePath();
      ctx.fill();
    }

    // Center hub
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderLaser(ctx: CanvasRenderingContext2D, screenX: number): void {
    if (!this.isActive) {
      // Draw inactive laser emitter only
      ctx.fillStyle = '#444444';
      ctx.fillRect(screenX, this.y, 20, this.height);
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(screenX + 10, this.y + this.height / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Active laser beam
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 30;

    // Core beam (bright)
    const coreGradient = ctx.createLinearGradient(screenX, this.y, screenX, this.y + this.height);
    coreGradient.addColorStop(0, 'rgba(255, 100, 100, 0.9)');
    coreGradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(1, 'rgba(255, 100, 100, 0.9)');
    ctx.fillStyle = coreGradient;
    ctx.fillRect(screenX + this.width / 2 - 3, this.y, 6, this.height);

    // Outer glow
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(screenX + this.width / 2 - 10, this.y, 20, this.height);

    // Emitter
    ctx.fillStyle = '#666666';
    ctx.fillRect(screenX, this.y - 10, 20, 20);
    ctx.fillRect(screenX, this.y + this.height - 10, 20, 20);

    // Emitter glow
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(screenX + 10, this.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenX + 10, this.y + this.height, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderCrusher(ctx: CanvasRenderingContext2D, screenX: number): void {
    const currentY = this.crusherY;

    // Shadow under crusher
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(screenX + 5, this.crusherBaseY + BeatHazard.CRUSHER_TRAVEL + 5, this.width - 10, 10);

    // Main crusher block
    if (this.isActive) {
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 15;
    }

    const gradient = ctx.createLinearGradient(screenX, currentY, screenX + this.width, currentY);
    gradient.addColorStop(0, '#555555');
    gradient.addColorStop(0.5, '#777777');
    gradient.addColorStop(1, '#555555');
    ctx.fillStyle = gradient;
    ctx.fillRect(screenX, currentY, this.width, this.height);

    // Spikes on bottom
    ctx.fillStyle = this.isActive ? '#ff6666' : '#888888';
    const spikeCount = Math.floor(this.width / 15);
    const spikeWidth = this.width / spikeCount;
    for (let i = 0; i < spikeCount; i++) {
      ctx.beginPath();
      ctx.moveTo(screenX + i * spikeWidth, currentY + this.height);
      ctx.lineTo(screenX + i * spikeWidth + spikeWidth / 2, currentY + this.height + 15);
      ctx.lineTo(screenX + (i + 1) * spikeWidth, currentY + this.height);
      ctx.closePath();
      ctx.fill();
    }

    // Mounting bracket at top
    ctx.fillStyle = '#444444';
    ctx.fillRect(screenX + this.width / 2 - 15, this.crusherBaseY - 20, 30, 20 + (currentY - this.crusherBaseY));

    // Warning stripes
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.strokeRect(screenX + 2, currentY + 2, this.width - 4, this.height - 4);
    ctx.setLineDash([]);
  }

  isHazardActive(): boolean {
    return this.isActive;
  }

  getActivationProgress(): number {
    return this.activationProgress;
  }
}

export class BeatHazardManager {
  private hazards: BeatHazard[] = [];

  constructor() {}

  reset(): void {
    this.hazards = [];
  }

  loadHazards(configs: BeatHazardConfig[]): void {
    this.hazards = configs.map(config => new BeatHazard(config));
  }

  addHazard(config: BeatHazardConfig): void {
    this.hazards.push(new BeatHazard(config));
  }

  update(deltaTime: number, beatNumber: number): void {
    for (const hazard of this.hazards) {
      hazard.update(deltaTime, beatNumber);
    }
  }

  checkCollisions(playerBounds: Rectangle): boolean {
    for (const hazard of this.hazards) {
      if (hazard.checkCollision(playerBounds)) {
        return true;
      }
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    for (const hazard of this.hazards) {
      hazard.render(ctx, cameraX);
    }
  }

  getHazards(): BeatHazard[] {
    return this.hazards;
  }

  // Get hazards within a screen range for rendering optimization
  getVisibleHazards(cameraX: number, screenWidth: number): BeatHazard[] {
    return this.hazards.filter(h => {
      const bounds = h.getBounds();
      return bounds.x + bounds.width > cameraX - 100 && bounds.x < cameraX + screenWidth + 100;
    });
  }
}
