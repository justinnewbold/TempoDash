import { Rectangle } from '../types';
import { GAME_WIDTH } from '../constants';

export interface PortalConfig {
  id: string;
  x: number;
  y: number;
  linkedPortalId: string;
  color?: string;
}

export class Portal {
  id: string;
  x: number;
  y: number;
  linkedPortalId: string;
  color: string;
  readonly width = 30;
  readonly height = 60;

  private animationTime = 0;
  private teleportCooldown = 0;
  private static readonly COOLDOWN_DURATION = 500; // ms before portal can teleport again
  private swirl = 0; // Swirl animation angle

  // Visual feedback on teleport
  private flashTimer = 0;

  constructor(config: PortalConfig) {
    this.id = config.id;
    this.x = config.x;
    this.y = config.y;
    this.linkedPortalId = config.linkedPortalId;
    this.color = config.color || '#8b5cf6'; // Default purple
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;
    this.swirl += deltaTime * 0.005;

    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= deltaTime;
    }

    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
    }
  }

  canTeleport(): boolean {
    return this.teleportCooldown <= 0;
  }

  onTeleport(): void {
    this.teleportCooldown = Portal.COOLDOWN_DURATION;
    this.flashTimer = 300;
  }

  getBounds(): Rectangle {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  checkCollision(playerBounds: Rectangle): boolean {
    const bounds = this.getBounds();
    return (
      playerBounds.x < bounds.x + bounds.width &&
      playerBounds.x + playerBounds.width > bounds.x &&
      playerBounds.y < bounds.y + bounds.height &&
      playerBounds.y + playerBounds.height > bounds.y
    );
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.x - cameraX;

    // Skip if off screen
    if (screenX < -80 || screenX > GAME_WIDTH + 80) return;

    ctx.save();

    // Flash effect when teleporting
    if (this.flashTimer > 0) {
      const flashAlpha = this.flashTimer / 300;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 40 * flashAlpha;
    }

    // Outer glow
    const glowPulse = Math.sin(this.animationTime * 0.003) * 0.3 + 0.7;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15 * glowPulse;

    // Portal oval shape
    const centerY = this.y;
    const radiusX = this.width / 2;
    const radiusY = this.height / 2;

    // Draw swirling vortex rings
    for (let ring = 3; ring >= 0; ring--) {
      const ringScale = 1 - ring * 0.2;
      const ringAlpha = 0.3 + ring * 0.15;

      ctx.beginPath();
      ctx.ellipse(
        screenX,
        centerY,
        radiusX * ringScale,
        radiusY * ringScale,
        0,
        0,
        Math.PI * 2
      );

      // Parse hex color and apply alpha
      const hex = this.color.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);

      if (ring === 0) {
        // Innermost ring - bright gradient
        const gradient = ctx.createRadialGradient(
          screenX, centerY, 0,
          screenX, centerY, radiusY * ringScale
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.8)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.2)`);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${ringAlpha})`;
      }
      ctx.fill();
    }

    // Swirling particles around the portal
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i + this.swirl * 2;
      const orbitRadiusX = radiusX * 0.8;
      const orbitRadiusY = radiusY * 0.8;
      const px = screenX + Math.cos(angle) * orbitRadiusX;
      const py = centerY + Math.sin(angle) * orbitRadiusY;
      const particleSize = 2 + Math.sin(this.animationTime * 0.005 + i) * 1;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(px, py, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Portal border
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(screenX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Cooldown indicator (dimmed when on cooldown)
    if (this.teleportCooldown > 0) {
      const cooldownAlpha = this.teleportCooldown / Portal.COOLDOWN_DURATION;
      ctx.fillStyle = `rgba(0, 0, 0, ${cooldownAlpha * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(screenX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
