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

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDestroyed) return;

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

    switch (this.type) {
      case 'bounce':
        gradient.addColorStop(0, '#ffc107');
        gradient.addColorStop(1, '#ff9800');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Bounce indicator lines
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
        // Ice shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(this.x + 5, this.y + 3, this.width * 0.3, 4);
        break;

      case 'lava':
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff2200');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Lava bubbles
        ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
        const time = Date.now() * 0.003;
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
        // Crack lines
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
        // Movement arrows
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
        const phaseGradient = ctx.createLinearGradient(
          this.x,
          this.y,
          this.x + this.width,
          this.y
        );
        phaseGradient.addColorStop(0, '#9c27b0');
        phaseGradient.addColorStop(0.5, '#e040fb');
        phaseGradient.addColorStop(1, '#9c27b0');
        ctx.fillStyle = phaseGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Phase particles
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

      default: // solid
        gradient.addColorStop(0, '#5a6a7a');
        gradient.addColorStop(1, '#3a4a5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(this.x, this.y, this.width, 3);
        break;
    }

    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}
