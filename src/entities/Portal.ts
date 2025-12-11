import { CONFIG } from '../constants';

export class Portal {
  x: number;
  y: number;
  width = 50;
  height = 70;
  linkedPortal: Portal | null = null;
  color: string;
  passed = false;
  private animTime = 0;
  private cooldown = 0;
  private readonly COOLDOWN_TIME = 1000; // 1 second cooldown

  constructor(x: number, y?: number, color?: string) {
    this.x = x;
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    this.y = y ?? groundY - this.height;
    this.color = color ?? this.randomColor();
  }

  private randomColor(): string {
    const colors = ['#00ff00', '#00ffff', '#ff00ff', '#ffff00'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Convert hex color to rgba with specified alpha
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  link(other: Portal): void {
    this.linkedPortal = other;
    other.linkedPortal = this;
    other.color = this.color;
  }

  update(speed: number, deltaTime: number): void {
    this.x -= CONFIG.BASE_OBSTACLE_SPEED * speed;
    this.animTime += 0.1 * speed;

    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }
  }

  canTeleport(): boolean {
    return this.cooldown <= 0 && this.linkedPortal !== null;
  }

  triggerCooldown(): void {
    this.cooldown = this.COOLDOWN_TIME;
    if (this.linkedPortal) {
      this.linkedPortal.cooldown = this.COOLDOWN_TIME;
    }
  }

  // Check if player is touching portal
  checkContact(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    const px = playerX + playerWidth / 4;
    const py = playerY + playerHeight / 4;
    const pw = playerWidth / 2;
    const ph = playerHeight / 2;

    return px < this.x + this.width &&
           px + pw > this.x &&
           py < this.y + this.height &&
           py + ph > this.y;
  }

  // Get exit position for teleportation
  getExitPosition(): { x: number; y: number } {
    return {
      x: this.x + this.width / 2,
      y: this.y
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Outer glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.cooldown > 0 ? 5 : 20;

    // Portal ring effect
    const alpha = this.cooldown > 0 ? 0.3 : 0.8;
    ctx.strokeStyle = this.hexToRgba(this.color, alpha);
    ctx.lineWidth = 4;

    // Outer ellipse
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner spinning rings
    for (let i = 0; i < 3; i++) {
      const ringAlpha = (0.6 - i * 0.15) * (this.cooldown > 0 ? 0.3 : 1);
      ctx.strokeStyle = this.hexToRgba(this.color, ringAlpha);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        (this.width / 2 - 8 - i * 6) * (0.9 + Math.sin(this.animTime + i) * 0.1),
        (this.height / 2 - 8 - i * 6) * (0.9 + Math.cos(this.animTime + i) * 0.1),
        this.animTime * (i % 2 === 0 ? 1 : -1) * 0.5,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Portal center (swirling effect)
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.width / 2
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.3, this.hexToRgba(this.color, 0.53)); // ~0x88/255
    gradient.addColorStop(0.7, this.hexToRgba(this.color, 0.13)); // ~0x22/255
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, this.width / 2 - 5, this.height / 2 - 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Particles swirling into portal
    if (this.cooldown <= 0) {
      ctx.fillStyle = this.color;
      for (let i = 0; i < 6; i++) {
        const angle = this.animTime * 2 + (i * Math.PI * 2) / 6;
        const radius = 15 + Math.sin(this.animTime * 3 + i) * 10;
        const px = centerX + Math.cos(angle) * radius;
        const py = centerY + Math.sin(angle) * radius * 0.7;
        const size = 2 + Math.sin(this.animTime + i) * 1;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // "WARP" label when linked
    if (this.linkedPortal) {
      ctx.fillStyle = this.cooldown > 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WARP', centerX, this.y - 5);
    }

    ctx.restore();
  }
}
