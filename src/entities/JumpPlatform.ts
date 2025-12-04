import { CONFIG } from '../constants';

export type PlatformType = 'normal' | 'bouncy' | 'crumbling';

export class JumpPlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  passed = false;
  color: string;
  tier: number;
  type: PlatformType;

  // Direction for tiered platforms (-1 = down, 0 = single, 1 = up)
  direction: number = 0;

  // Crumbling state
  isCrumbling = false;
  crumbleTimer = 0;
  shakeOffset = 0;

  // Visual effects
  glowIntensity = 0;
  pulsePhase = Math.random() * Math.PI * 2;

  constructor(
    x: number,
    y?: number,
    width?: number,
    color?: string,
    tier: number = 0,
    type: PlatformType = 'normal',
    direction: number = 0
  ) {
    this.x = x;
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    this.y = y ?? groundY - (70 + Math.random() * 40);
    this.width = width ?? 80 + Math.random() * 40;
    this.height = 15;
    this.color = color ?? '#00ffff';
    this.tier = tier;
    this.type = type;
    this.direction = direction;
  }

  update(speed: number, beatPulse: number = 0): void {
    this.x -= CONFIG.BASE_OBSTACLE_SPEED * speed;

    // Update glow pulse
    this.pulsePhase += 0.1 * speed;
    this.glowIntensity = Math.sin(this.pulsePhase) * 0.3 + 0.7;

    // Sync with beat if provided
    if (beatPulse > 0) {
      this.glowIntensity = Math.max(this.glowIntensity, beatPulse);
    }

    // Update crumbling
    if (this.isCrumbling) {
      this.crumbleTimer += 16 * speed;
      this.shakeOffset = (Math.random() - 0.5) * 4;

      // Fall after 500ms
      if (this.crumbleTimer > 500) {
        this.y += 8 * speed;
      }
    }
  }

  // Check if player is landing on platform from above
  checkLanding(playerX: number, playerY: number, playerWidth: number, playerHeight: number, velocityY: number): boolean {
    if (velocityY <= 0) return false;
    if (this.isCrumbling && this.crumbleTimer > 500) return false;

    const playerBottom = playerY + playerHeight;
    const playerCenterX = playerX + playerWidth / 2;

    if (playerCenterX < this.x || playerCenterX > this.x + this.width) {
      return false;
    }

    if (playerBottom >= this.y && playerBottom <= this.y + this.height + 10) {
      return true;
    }

    return false;
  }

  // Trigger crumbling
  startCrumbling(): void {
    if (this.type === 'crumbling' && !this.isCrumbling) {
      this.isCrumbling = true;
      this.crumbleTimer = 0;
    }
  }

  // Check if platform should be removed
  shouldRemove(): boolean {
    return this.isCrumbling && this.crumbleTimer > 1000;
  }

  // Get bounce multiplier for bouncy platforms
  getBounceMultiplier(): number {
    return this.type === 'bouncy' ? 1.4 : 1.0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Apply shake for crumbling
    const offsetX = this.isCrumbling ? this.shakeOffset : 0;
    const offsetY = this.isCrumbling ? this.shakeOffset * 0.5 : 0;

    // Fade out when falling
    if (this.isCrumbling && this.crumbleTimer > 500) {
      ctx.globalAlpha = Math.max(0, 1 - (this.crumbleTimer - 500) / 500);
    }

    // Platform glow - pulsing
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10 + this.glowIntensity * 10;

    // Main platform
    const gradient = ctx.createLinearGradient(
      this.x + offsetX, this.y + offsetY,
      this.x + offsetX, this.y + this.height + offsetY
    );

    // Different colors for different types
    if (this.type === 'bouncy') {
      gradient.addColorStop(0, '#00ff88');
      gradient.addColorStop(1, '#00aa55');
    } else if (this.type === 'crumbling') {
      gradient.addColorStop(0, this.isCrumbling ? '#ff6644' : '#ffaa44');
      gradient.addColorStop(1, this.isCrumbling ? '#aa2200' : '#aa6622');
    } else {
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(1, this.adjustColor(this.color, -30));
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);

    // Top highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(this.x + 2 + offsetX, this.y + 2 + offsetY, this.width - 4, 3);

    // Edge decorations
    ctx.fillStyle = this.adjustColor(this.color, 20);
    ctx.fillRect(this.x + offsetX, this.y + offsetY, 3, this.height);
    ctx.fillRect(this.x + this.width - 3 + offsetX, this.y + offsetY, 3, this.height);

    // Type indicators
    if (this.type === 'bouncy') {
      // Spring icon
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const centerX = this.x + this.width / 2 + offsetX;
      const centerY = this.y + this.height / 2 + offsetY;
      for (let i = 0; i < 3; i++) {
        ctx.moveTo(centerX - 8 + i * 8, centerY - 3);
        ctx.lineTo(centerX - 4 + i * 8, centerY + 3);
      }
      ctx.stroke();
    } else if (this.type === 'crumbling' && !this.isCrumbling) {
      // Crack lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x + this.width * 0.3 + offsetX, this.y + offsetY);
      ctx.lineTo(this.x + this.width * 0.35 + offsetX, this.y + this.height + offsetY);
      ctx.moveTo(this.x + this.width * 0.7 + offsetX, this.y + offsetY);
      ctx.lineTo(this.x + this.width * 0.65 + offsetX, this.y + this.height + offsetY);
      ctx.stroke();
    }

    // Direction indicator for tiered platforms
    if (this.direction !== 0 && this.tier > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      const arrow = this.direction > 0 ? '▲' : '▼';
      ctx.fillText(arrow, this.x + this.width / 2 + offsetX, this.y - 5 + offsetY);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
}
