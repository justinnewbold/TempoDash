import { PlatformConfig, PlatformType, MovePattern, Rectangle } from '../types';
import { COLORS, PLATFORM } from '../constants';

export class Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  movePattern?: MovePattern;
  color: string;

  private startX: number;
  private startY: number;
  private moveTime = 0;
  private crumbleTimer = 0;
  private isCrumbling = false;
  private crumbleProgress = 0;
  private phaseTimer = 0;
  isPhased = false;
  isDestroyed = false;

  // New platform type properties
  conveyorSpeed = 1;           // -1 to 1, negative = left
  private glassHits = 0;       // Breaks after 2 hits
  private glassBreaking = false;
  private conveyorAnimTime = 0;

  constructor(config: PlatformConfig) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.type = config.type;
    this.movePattern = config.movePattern;
    this.color = config.color || COLORS.PLATFORM[config.type];

    this.startX = config.x;
    this.startY = config.y;

    if (config.movePattern?.startOffset) {
      this.moveTime = config.movePattern.startOffset;
    }

    // Conveyor default speed
    if (config.conveyorSpeed !== undefined) {
      this.conveyorSpeed = config.conveyorSpeed;
    }
  }

  update(deltaTime: number): void {
    if (this.isDestroyed) return;

    // Handle movement
    if (this.movePattern && this.type === 'moving') {
      this.updateMovement(deltaTime);
    }

    // Handle crumbling
    if (this.type === 'crumble' && this.isCrumbling) {
      this.crumbleTimer += deltaTime;
      if (this.crumbleTimer >= PLATFORM.CRUMBLE_DELAY) {
        this.crumbleProgress = Math.min(
          1,
          (this.crumbleTimer - PLATFORM.CRUMBLE_DELAY) / PLATFORM.CRUMBLE_DURATION
        );
        if (this.crumbleProgress >= 1) {
          this.isDestroyed = true;
        }
      }
    }

    // Handle phasing
    if (this.type === 'phase') {
      this.phaseTimer += deltaTime;
      const cycleTime = PLATFORM.PHASE_ON_TIME + PLATFORM.PHASE_OFF_TIME;
      const cyclePosition = this.phaseTimer % cycleTime;
      this.isPhased = cyclePosition > PLATFORM.PHASE_ON_TIME;
    }

    // Handle conveyor animation
    if (this.type === 'conveyor') {
      this.conveyorAnimTime += deltaTime * 0.005 * this.conveyorSpeed;
    }

    // Handle glass breaking animation
    if (this.type === 'glass' && this.glassBreaking) {
      this.crumbleTimer += deltaTime;
      this.crumbleProgress = Math.min(1, this.crumbleTimer / 300);
      if (this.crumbleProgress >= 1) {
        this.isDestroyed = true;
      }
    }
  }

  private updateMovement(deltaTime: number): void {
    if (!this.movePattern) return;

    this.moveTime += deltaTime * 0.001 * this.movePattern.speed;

    switch (this.movePattern.type) {
      case 'horizontal':
        this.x = this.startX + Math.sin(this.moveTime) * this.movePattern.distance;
        break;
      case 'vertical':
        this.y = this.startY + Math.sin(this.moveTime) * this.movePattern.distance;
        break;
      case 'circular':
        this.x = this.startX + Math.cos(this.moveTime) * this.movePattern.distance;
        this.y = this.startY + Math.sin(this.moveTime) * this.movePattern.distance;
        break;
    }
  }

  startCrumble(): void {
    if (this.type === 'crumble' && !this.isCrumbling) {
      this.isCrumbling = true;
    }
  }

  // Handle glass platform landing - returns true if glass breaks
  onGlassLanding(): boolean {
    if (this.type !== 'glass' || this.glassBreaking) return false;

    this.glassHits++;
    if (this.glassHits >= 2) {
      this.glassBreaking = true;
      return true;
    }
    return false;
  }

  // Get glass crack state (0 = pristine, 1 = cracked, 2+ = breaking)
  getGlassState(): number {
    return this.glassHits;
  }

  getBounds(): Rectangle {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  isCollidable(): boolean {
    return !this.isDestroyed && !this.isPhased;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number = 0, gameWidth: number = 960): void {
    if (this.isDestroyed) return;

    // Skip rendering if off-screen (use logical game width, not canvas pixel width)
    const screenX = this.x - cameraX;
    if (screenX + this.width < -100 || screenX > gameWidth + 100) {
      return;
    }

    ctx.save();

    // Handle phase transparency
    if (this.type === 'phase') {
      const alpha = this.isPhased ? 0.2 : 1;
      ctx.globalAlpha = alpha;
    }

    // Handle crumble shake
    if (this.isCrumbling && this.crumbleProgress < 1) {
      const shake = (1 - this.crumbleProgress) * 3;
      ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake
      );
      ctx.globalAlpha = 1 - this.crumbleProgress;
    }

    // Draw platform base with camera offset
    this.drawPlatform(ctx, cameraX);

    ctx.restore();
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.x - cameraX;
    const gradient = ctx.createLinearGradient(
      screenX,
      this.y,
      screenX,
      this.y + this.height
    );

    switch (this.type) {
      case 'spike':
        // Draw triangular spikes (Geometry Dash style)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        const spikeCount = Math.floor(this.width / this.height);
        const spikeWidth = this.width / spikeCount;
        for (let i = 0; i < spikeCount; i++) {
          ctx.beginPath();
          ctx.moveTo(screenX + i * spikeWidth, this.y + this.height);
          ctx.lineTo(screenX + i * spikeWidth + spikeWidth / 2, this.y);
          ctx.lineTo(screenX + (i + 1) * spikeWidth, this.y + this.height);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        break;

      case 'bounce':
        gradient.addColorStop(0, '#ffc107');
        gradient.addColorStop(1, '#ff9800');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Bounce indicator lines
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const lineX = screenX + (this.width / 4) * (i + 1);
          ctx.beginPath();
          ctx.moveTo(lineX - 5, this.y + this.height / 2);
          ctx.lineTo(lineX, this.y + 5);
          ctx.lineTo(lineX + 5, this.y + this.height / 2);
          ctx.stroke();
        }
        break;

      case 'ice':
        gradient.addColorStop(0, 'rgba(200, 240, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(150, 200, 255, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Ice shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(screenX + 5, this.y + 3, this.width * 0.3, 4);
        break;

      case 'lava':
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff2200');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Lava bubbles
        ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
        const time = Date.now() * 0.003;
        for (let i = 0; i < 3; i++) {
          const bubbleX = screenX + (this.width / 4) * (i + 1);
          const bubbleY = this.y + 5 + Math.sin(time + i) * 3;
          ctx.beginPath();
          ctx.arc(bubbleX, bubbleY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'crumble':
        gradient.addColorStop(0, '#a0522d');
        gradient.addColorStop(1, '#8b4513');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Crack lines
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + this.width * 0.3, this.y);
        ctx.lineTo(screenX + this.width * 0.4, this.y + this.height);
        ctx.moveTo(screenX + this.width * 0.7, this.y);
        ctx.lineTo(screenX + this.width * 0.6, this.y + this.height);
        ctx.stroke();
        break;

      case 'moving':
        gradient.addColorStop(0, '#4fc3f7');
        gradient.addColorStop(1, '#0288d1');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Movement arrows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(screenX + 10, this.y + this.height / 2);
        ctx.lineTo(screenX + 20, this.y + this.height / 2 - 5);
        ctx.lineTo(screenX + 20, this.y + this.height / 2 + 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(screenX + this.width - 10, this.y + this.height / 2);
        ctx.lineTo(screenX + this.width - 20, this.y + this.height / 2 - 5);
        ctx.lineTo(screenX + this.width - 20, this.y + this.height / 2 + 5);
        ctx.fill();
        break;

      case 'phase':
        const phaseGradient = ctx.createLinearGradient(
          screenX,
          this.y,
          screenX + this.width,
          this.y
        );
        phaseGradient.addColorStop(0, '#9c27b0');
        phaseGradient.addColorStop(0.5, '#e040fb');
        phaseGradient.addColorStop(1, '#9c27b0');
        ctx.fillStyle = phaseGradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Phase particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const phaseTime = Date.now() * 0.005;
        for (let i = 0; i < 5; i++) {
          const px = screenX + (this.width / 6) * (i + 1);
          const py = this.y + this.height / 2 + Math.sin(phaseTime + i) * 5;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'conveyor':
        // Industrial green conveyor belt
        gradient.addColorStop(0, '#38a169');
        gradient.addColorStop(1, '#276749');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Animated conveyor lines
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 3;
        const lineSpacing = 20;
        const offset = (this.conveyorAnimTime * 50) % lineSpacing;
        for (let lx = -lineSpacing + offset; lx < this.width + lineSpacing; lx += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(screenX + lx, this.y);
          ctx.lineTo(screenX + lx + 10, this.y + this.height);
          ctx.stroke();
        }
        // Direction arrows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const arrowDir = this.conveyorSpeed > 0 ? 1 : -1;
        for (let i = 0; i < 3; i++) {
          const ax = screenX + (this.width / 4) * (i + 1);
          ctx.beginPath();
          ctx.moveTo(ax - 5 * arrowDir, this.y + this.height / 2 - 3);
          ctx.lineTo(ax + 5 * arrowDir, this.y + this.height / 2);
          ctx.lineTo(ax - 5 * arrowDir, this.y + this.height / 2 + 3);
          ctx.fill();
        }
        break;

      case 'gravity':
        // Magical pink/purple gradient
        const gravGradient = ctx.createLinearGradient(screenX, this.y, screenX + this.width, this.y + this.height);
        gravGradient.addColorStop(0, '#d53f8c');
        gravGradient.addColorStop(0.5, '#805ad5');
        gravGradient.addColorStop(1, '#d53f8c');
        ctx.fillStyle = gravGradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Floating particles effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const gravTime = Date.now() * 0.003;
        for (let i = 0; i < 4; i++) {
          const gx = screenX + (this.width / 5) * (i + 1);
          const gy = this.y + this.height / 2 + Math.sin(gravTime + i * 0.8) * 8;
          ctx.beginPath();
          ctx.arc(gx, gy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // Up/down arrows
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        const arrowY = this.y + this.height / 2;
        ctx.beginPath();
        ctx.moveTo(screenX + this.width / 2, arrowY - 6);
        ctx.lineTo(screenX + this.width / 2 - 4, arrowY);
        ctx.lineTo(screenX + this.width / 2 + 4, arrowY);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + this.width / 2, arrowY + 6);
        ctx.lineTo(screenX + this.width / 2 - 4, arrowY);
        ctx.lineTo(screenX + this.width / 2 + 4, arrowY);
        ctx.closePath();
        ctx.stroke();
        break;

      case 'sticky':
        // Yellow/amber honey-like platform
        gradient.addColorStop(0, '#ecc94b');
        gradient.addColorStop(1, '#d69e2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Dripping honey effect
        ctx.fillStyle = '#d69e2e';
        for (let i = 0; i < 4; i++) {
          const dx = screenX + (this.width / 5) * (i + 1);
          const dripHeight = 5 + Math.sin(Date.now() * 0.002 + i) * 3;
          ctx.beginPath();
          ctx.ellipse(dx, this.y + this.height + dripHeight / 2, 4, dripHeight, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(screenX + 5, this.y + 3, this.width * 0.4, 4);
        break;

      case 'glass':
        // Transparent glass platform
        ctx.fillStyle = this.glassHits === 0
          ? 'rgba(226, 232, 240, 0.6)'
          : 'rgba(226, 232, 240, 0.4)';
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Reflection shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(screenX + 5, this.y + 2, this.width * 0.6, 3);
        // Cracks if hit once
        if (this.glassHits >= 1) {
          ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
          ctx.lineWidth = 1;
          // Draw crack pattern
          const cx = screenX + this.width / 2;
          const cy = this.y + this.height / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 15, cy - 8);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 12, cy - 6);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 8, cy + 7);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 10, cy + 5);
          ctx.stroke();
        }
        // Border
        ctx.strokeStyle = 'rgba(200, 220, 240, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, this.y, this.width, this.height);
        break;

      default: // solid
        gradient.addColorStop(0, '#5a6a7a');
        gradient.addColorStop(1, '#3a4a5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(screenX, this.y, this.width, 3);
        break;
    }

    // Border (except for spikes)
    if (this.type !== 'spike') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, this.y, this.width, this.height);
    }
  }
}
