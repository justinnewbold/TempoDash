import { CONFIG } from '../constants';

export type PowerUpType = 'doubleJump';

export class PowerUp {
  x: number;
  y: number;
  width = 30;
  height = 30;
  type: PowerUpType;
  collected = false;

  private bobOffset = Math.random() * Math.PI * 2;
  private rotation = 0;
  private pulsePhase = 0;
  private particles: { angle: number; dist: number; speed: number }[] = [];

  constructor(x: number, y?: number, type: PowerUpType = 'doubleJump') {
    this.x = x;
    this.type = type;

    // Default y is mid-height
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    this.y = y ?? groundY - 100 - Math.random() * 80;

    // Initialize orbiting particles
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        angle: (i / 6) * Math.PI * 2,
        dist: 18 + Math.random() * 4,
        speed: 0.02 + Math.random() * 0.01
      });
    }
  }

  getDuration(): number {
    // Duration in milliseconds
    switch (this.type) {
      case 'doubleJump': return 8000; // 8 seconds
      default: return 5000;
    }
  }

  getColor(): { primary: string; secondary: string; glow: string } {
    switch (this.type) {
      case 'doubleJump':
        return { primary: '#ff8800', secondary: '#ffcc00', glow: '#ffaa00' };
      default:
        return { primary: '#ffffff', secondary: '#aaaaaa', glow: '#ffffff' };
    }
  }

  update(speed: number): void {
    this.x -= CONFIG.BASE_OBSTACLE_SPEED * speed;
    this.rotation += 0.03 * speed;
    this.bobOffset += 0.06 * speed;
    this.pulsePhase += 0.08 * speed;

    // Update orbiting particles
    for (const particle of this.particles) {
      particle.angle += particle.speed * speed;
    }
  }

  checkCollection(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    if (this.collected) return false;

    // Generous hitbox for collection
    const margin = 15;
    const collected = playerX < this.x + this.width + margin &&
                      playerX + playerWidth > this.x - margin &&
                      playerY < this.y + this.height + margin &&
                      playerY + playerHeight > this.y - margin;

    if (collected) {
      this.collected = true;
    }

    return collected;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    const colors = this.getColor();
    const bobY = Math.sin(this.bobOffset) * 6;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + bobY);

    // Draw orbiting particles
    for (const particle of this.particles) {
      const px = Math.cos(particle.angle) * particle.dist * pulse;
      const py = Math.sin(particle.angle) * particle.dist * 0.6 * pulse;

      ctx.fillStyle = `rgba(255, 200, 100, ${0.6 + Math.sin(this.pulsePhase + particle.angle) * 0.3})`;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer glow
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 25 + Math.sin(this.pulsePhase) * 10;

    // Main circle
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2 * pulse);
    gradient.addColorStop(0, colors.secondary);
    gradient.addColorStop(0.6, colors.primary);
    gradient.addColorStop(1, colors.glow);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner icon based on type
    ctx.shadowBlur = 0;
    ctx.rotate(this.rotation);

    if (this.type === 'doubleJump') {
      // Draw double arrow up icon
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // First arrow (top)
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(0, -8);
      ctx.lineTo(6, -2);
      ctx.stroke();

      // Second arrow (bottom)
      ctx.beginPath();
      ctx.moveTo(-6, 5);
      ctx.lineTo(0, -1);
      ctx.lineTo(6, 5);
      ctx.stroke();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-3, -3, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
