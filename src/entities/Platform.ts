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

  // Platform-specific properties
  linkedId?: string;
  direction: 'left' | 'right';
  windStrength: number;

  private startX: number;
  private startY: number;
  private moveTime = 0;
  private crumbleTimer = 0;
  private isCrumbling = false;
  private crumbleProgress = 0;
  private phaseTimer = 0;
  isPhased = false;
  isDestroyed = false;

  // New platform states
  private lightningTimer = 0;
  isElectrified = false;
  private cloudSinkAmount = 0;
  isBeingStoodOn = false;
  private windTimer = 0;
  isWindActive = false;
  private glitchTimer = 0;
  private glitchOffset = { x: 0, y: 0 };
  private teleportCooldown = 0;

  constructor(config: PlatformConfig) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.type = config.type;
    this.movePattern = config.movePattern;
    this.color = config.color || COLORS.PLATFORM[config.type] || COLORS.PLATFORM.solid;

    this.startX = config.x;
    this.startY = config.y;
    this.linkedId = config.linkedId;
    this.direction = config.direction || 'right';
    this.windStrength = config.windStrength || 400;

    if (config.movePattern?.startOffset) {
      this.moveTime = config.movePattern.startOffset;
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

    // Handle lightning
    if (this.type === 'lightning') {
      this.lightningTimer += deltaTime;
      const cycleTime = PLATFORM.LIGHTNING_ON_TIME + PLATFORM.LIGHTNING_OFF_TIME;
      const cyclePosition = this.lightningTimer % cycleTime;
      this.isElectrified = cyclePosition > PLATFORM.LIGHTNING_ON_TIME;
    }

    // Handle cloud sinking
    if (this.type === 'cloud') {
      if (this.isBeingStoodOn) {
        this.cloudSinkAmount = Math.min(
          PLATFORM.CLOUD_MAX_SINK,
          this.cloudSinkAmount + PLATFORM.CLOUD_SINK_SPEED * (deltaTime / 1000)
        );
      } else {
        this.cloudSinkAmount = Math.max(
          0,
          this.cloudSinkAmount - PLATFORM.CLOUD_SINK_SPEED * 2 * (deltaTime / 1000)
        );
      }
      this.isBeingStoodOn = false; // Reset each frame
    }

    // Handle wind
    if (this.type === 'wind') {
      this.windTimer += deltaTime;
      const cycleTime = PLATFORM.WIND_INTERVAL + PLATFORM.WIND_DURATION;
      const cyclePosition = this.windTimer % cycleTime;
      this.isWindActive = cyclePosition > PLATFORM.WIND_INTERVAL;
    }

    // Handle glitch
    if (this.type === 'glitch') {
      this.glitchTimer += deltaTime;
      if (this.glitchTimer > PLATFORM.GLITCH_INTERVAL) {
        this.glitchTimer = 0;
        this.glitchOffset = {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 5,
        };
      }
    }

    // Handle teleporter cooldown
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= deltaTime;
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

  setStoodOn(value: boolean): void {
    this.isBeingStoodOn = value;
  }

  canTeleport(): boolean {
    return this.type === 'teleporter' && this.teleportCooldown <= 0;
  }

  triggerTeleport(): void {
    this.teleportCooldown = 500; // 500ms cooldown
  }

  getBounds(): Rectangle {
    let adjustedY = this.y;
    if (this.type === 'cloud') {
      adjustedY += this.cloudSinkAmount;
    }
    if (this.type === 'glitch') {
      return {
        x: this.x + this.glitchOffset.x,
        y: this.y + this.glitchOffset.y,
        width: this.width,
        height: this.height,
      };
    }
    return {
      x: this.x,
      y: adjustedY,
      width: this.width,
      height: this.height,
    };
  }

  isCollidable(): boolean {
    if (this.isDestroyed) return false;
    if (this.isPhased) return false;
    return true;
  }

  isDeadly(): boolean {
    if (this.type === 'lava') return true;
    if (this.type === 'lightning' && this.isElectrified) return true;
    return false;
  }

  getConveyorSpeed(): number {
    if (this.type !== 'conveyor') return 0;
    return this.direction === 'right' ? PLATFORM.CONVEYOR_SPEED : -PLATFORM.CONVEYOR_SPEED;
  }

  getWindForce(): number {
    if (this.type !== 'wind' || !this.isWindActive) return 0;
    return this.direction === 'right' ? this.windStrength : -this.windStrength;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDestroyed) return;

    ctx.save();

    // Handle phase transparency
    if (this.type === 'phase') {
      ctx.globalAlpha = this.isPhased ? 0.2 : 1;
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

    // Handle glitch offset
    if (this.type === 'glitch') {
      ctx.translate(this.glitchOffset.x, this.glitchOffset.y);
    }

    // Handle cloud sink
    if (this.type === 'cloud') {
      ctx.translate(0, this.cloudSinkAmount);
    }

    // Draw platform base
    this.drawPlatform(ctx);

    ctx.restore();
  }

  private drawPlatform(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    const time = Date.now() * 0.003;

    switch (this.type) {
      case 'bounce':
        gradient.addColorStop(0, '#ffc107');
        gradient.addColorStop(1, '#ff9800');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const lineX = this.x + (this.width / 4) * (i + 1);
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
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(this.x + 5, this.y + 3, this.width * 0.3, 4);
        break;

      case 'lava':
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff2200');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
        for (let i = 0; i < 3; i++) {
          const bubbleX = this.x + (this.width / 4) * (i + 1);
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
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.3, this.y);
        ctx.lineTo(this.x + this.width * 0.4, this.y + this.height);
        ctx.moveTo(this.x + this.width * 0.7, this.y);
        ctx.lineTo(this.x + this.width * 0.6, this.y + this.height);
        ctx.stroke();
        break;

      case 'moving':
        gradient.addColorStop(0, '#4fc3f7');
        gradient.addColorStop(1, '#0288d1');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + this.height / 2);
        ctx.lineTo(this.x + 20, this.y + this.height / 2 - 5);
        ctx.lineTo(this.x + 20, this.y + this.height / 2 + 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 10, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width - 20, this.y + this.height / 2 - 5);
        ctx.lineTo(this.x + this.width - 20, this.y + this.height / 2 + 5);
        ctx.fill();
        break;

      case 'phase':
        const phaseGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
        phaseGradient.addColorStop(0, '#9c27b0');
        phaseGradient.addColorStop(0.5, '#e040fb');
        phaseGradient.addColorStop(1, '#9c27b0');
        ctx.fillStyle = phaseGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const phaseTime = Date.now() * 0.005;
        for (let i = 0; i < 5; i++) {
          const px = this.x + (this.width / 6) * (i + 1);
          const py = this.y + this.height / 2 + Math.sin(phaseTime + i) * 5;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'conveyor':
        gradient.addColorStop(0, '#64748b');
        gradient.addColorStop(1, '#475569');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Animated conveyor lines
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        const offset = (Date.now() * 0.1 * (this.direction === 'right' ? 1 : -1)) % 20;
        for (let i = -1; i < this.width / 20 + 1; i++) {
          const lineX = this.x + i * 20 + offset;
          if (lineX >= this.x && lineX <= this.x + this.width) {
            ctx.beginPath();
            ctx.moveTo(lineX, this.y + 3);
            ctx.lineTo(lineX + (this.direction === 'right' ? 8 : -8), this.y + this.height - 3);
            ctx.stroke();
          }
        }
        // Direction arrow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const arrowX = this.x + this.width / 2;
        ctx.beginPath();
        if (this.direction === 'right') {
          ctx.moveTo(arrowX + 10, this.y + this.height / 2);
          ctx.lineTo(arrowX - 5, this.y + this.height / 2 - 6);
          ctx.lineTo(arrowX - 5, this.y + this.height / 2 + 6);
        } else {
          ctx.moveTo(arrowX - 10, this.y + this.height / 2);
          ctx.lineTo(arrowX + 5, this.y + this.height / 2 - 6);
          ctx.lineTo(arrowX + 5, this.y + this.height / 2 + 6);
        }
        ctx.fill();
        break;

      case 'lowgravity':
        const lgGradient = ctx.createRadialGradient(
          this.x + this.width / 2, this.y + this.height / 2, 0,
          this.x + this.width / 2, this.y + this.height / 2, this.width / 2
        );
        lgGradient.addColorStop(0, 'rgba(167, 139, 250, 0.8)');
        lgGradient.addColorStop(1, 'rgba(139, 92, 246, 0.6)');
        ctx.fillStyle = lgGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Floating particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 4; i++) {
          const px = this.x + (this.width / 5) * (i + 1);
          const py = this.y + this.height / 2 + Math.sin(time * 2 + i * 1.5) * 6;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'reverse':
        gradient.addColorStop(0, '#ec4899');
        gradient.addColorStop(1, '#be185d');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Up/down arrows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
          const ax = this.x + (this.width / 4) * (i + 1);
          ctx.beginPath();
          ctx.moveTo(ax, this.y + 5);
          ctx.lineTo(ax - 6, this.y + this.height / 2);
          ctx.lineTo(ax + 6, this.y + this.height / 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(ax, this.y + this.height - 5);
          ctx.lineTo(ax - 6, this.y + this.height / 2);
          ctx.lineTo(ax + 6, this.y + this.height / 2);
          ctx.fill();
        }
        break;

      case 'wind':
        gradient.addColorStop(0, '#34d399');
        gradient.addColorStop(1, '#059669');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Wind effect lines
        if (this.isWindActive) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          const windOffset = (Date.now() * 0.3 * (this.direction === 'right' ? 1 : -1)) % 30;
          for (let i = 0; i < 4; i++) {
            const ly = this.y + (this.height / 5) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(this.x + windOffset + i * 10, ly);
            ctx.bezierCurveTo(
              this.x + windOffset + 20 + i * 10, ly - 3,
              this.x + windOffset + 40 + i * 10, ly + 3,
              this.x + windOffset + 60 + i * 10, ly
            );
            ctx.stroke();
          }
        }
        // Direction indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const windArrowX = this.x + this.width / 2;
        ctx.beginPath();
        if (this.direction === 'right') {
          ctx.moveTo(windArrowX + 15, this.y + this.height / 2);
          ctx.lineTo(windArrowX, this.y + this.height / 2 - 8);
          ctx.lineTo(windArrowX, this.y + this.height / 2 + 8);
        } else {
          ctx.moveTo(windArrowX - 15, this.y + this.height / 2);
          ctx.lineTo(windArrowX, this.y + this.height / 2 - 8);
          ctx.lineTo(windArrowX, this.y + this.height / 2 + 8);
        }
        ctx.fill();
        break;

      case 'lightning':
        if (this.isElectrified) {
          // Electrified state
          ctx.shadowColor = '#fef08a';
          ctx.shadowBlur = 15;
          gradient.addColorStop(0, '#fef08a');
          gradient.addColorStop(1, '#fbbf24');
        } else {
          gradient.addColorStop(0, '#6b7280');
          gradient.addColorStop(1, '#4b5563');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Lightning bolts when active
        if (this.isElectrified) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const bx = this.x + (this.width / 4) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(bx, this.y + 2);
            ctx.lineTo(bx - 4, this.y + this.height / 3);
            ctx.lineTo(bx + 2, this.y + this.height / 3);
            ctx.lineTo(bx - 2, this.y + this.height - 2);
            ctx.stroke();
          }
        }
        ctx.shadowBlur = 0;
        break;

      case 'cloud':
        ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
        // Draw cloud shape
        const cloudY = this.y;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width * 0.3, cloudY + this.height * 0.6, this.width * 0.25, this.height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + this.width * 0.6, cloudY + this.height * 0.5, this.width * 0.3, this.height * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + this.width * 0.8, cloudY + this.height * 0.6, this.width * 0.2, this.height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'teleporter':
        const tpGradient = ctx.createRadialGradient(
          this.x + this.width / 2, this.y + this.height / 2, 0,
          this.x + this.width / 2, this.y + this.height / 2, this.width / 2
        );
        const pulse = Math.sin(time * 3) * 0.3 + 0.7;
        tpGradient.addColorStop(0, `rgba(56, 178, 172, ${pulse})`);
        tpGradient.addColorStop(1, 'rgba(20, 184, 166, 0.5)');
        ctx.fillStyle = tpGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Swirl effect
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        for (let a = 0; a < Math.PI * 4; a += 0.3) {
          const r = (a / (Math.PI * 4)) * Math.min(this.width, this.height) * 0.4;
          const px = cx + Math.cos(a + time * 2) * r;
          const py = cy + Math.sin(a + time * 2) * r;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;

      case 'speedboost':
        gradient.addColorStop(0, '#fde047');
        gradient.addColorStop(1, '#facc15');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Speed arrows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const speedOffset = (Date.now() * 0.2) % 25;
        for (let i = 0; i < 4; i++) {
          const sx = this.x + 10 + i * 25 + speedOffset;
          if (sx < this.x + this.width - 10) {
            ctx.beginPath();
            ctx.moveTo(sx + 12, this.y + this.height / 2);
            ctx.lineTo(sx, this.y + this.height / 2 - 6);
            ctx.lineTo(sx, this.y + this.height / 2 + 6);
            ctx.fill();
          }
        }
        break;

      case 'glitch':
        // Glitchy appearance with random color bands
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff'];
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = colors[i];
          ctx.globalAlpha = 0.3;
          ctx.fillRect(
            this.x + Math.random() * 5,
            this.y + (this.height / 5) * i,
            this.width + Math.random() * 5 - 2.5,
            this.height / 5 + 1
          );
        }
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Glitch text
        ctx.fillStyle = '#00ff00';
        ctx.font = '10px monospace';
        ctx.fillText('ERR', this.x + this.width / 2 - 10, this.y + this.height / 2 + 3);
        ctx.globalAlpha = 1;
        break;

      default: // solid
        gradient.addColorStop(0, '#5a6a7a');
        gradient.addColorStop(1, '#3a4a5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(this.x, this.y, this.width, 3);
        break;
    }

    // Border (except for cloud)
    if (this.type !== 'cloud') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}
