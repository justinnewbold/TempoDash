import { SKINS, Particle, Skin } from '../types';
import { CONFIG } from '../constants';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export class Player {
  x: number;
  y: number;
  width = CONFIG.PLAYER_SIZE;
  height = CONFIG.PLAYER_SIZE;
  velocityY = 0;
  rotation = 0;
  isGrounded = true;
  isDead = false;

  private trail: TrailPoint[] = [];
  private rainbowHue = 0;
  private currentSkin: Skin;

  // Level-specific states
  isInLowGravity = false;
  gravityMultiplier = 1;

  constructor(skinId: string = 'cyan') {
    this.currentSkin = SKINS[skinId] || SKINS.cyan;
    this.x = 150;
    this.y = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - CONFIG.PLAYER_SIZE;
  }

  setSkin(skinId: string): void {
    this.currentSkin = SKINS[skinId] || SKINS.cyan;
  }

  reset(): void {
    this.x = 150;
    this.y = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - CONFIG.PLAYER_SIZE;
    this.velocityY = 0;
    this.rotation = 0;
    this.isGrounded = true;
    this.isDead = false;
    this.trail = [];
    this.isInLowGravity = false;
    this.gravityMultiplier = 1;
  }

  jump(): boolean {
    if (this.isGrounded && !this.isDead) {
      this.velocityY = CONFIG.JUMP_FORCE;
      this.isGrounded = false;
      return true;
    }
    return false;
  }

  update(gameSpeed: number): void {
    if (this.isDead) return;

    // Apply gravity
    let gravity = CONFIG.GRAVITY;
    if (this.isInLowGravity) {
      gravity *= this.gravityMultiplier;
    }

    this.velocityY += gravity * gameSpeed;
    this.y += this.velocityY * gameSpeed;

    // Ground collision
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - this.height;
    if (this.y >= groundY) {
      this.y = groundY;
      this.velocityY = 0;
      this.isGrounded = true;
      // Snap rotation to nearest 90 degrees
      this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
    } else {
      // Rotate while in air
      this.rotation += 0.15 * gameSpeed;
    }

    // Update trail
    this.trail.unshift({
      x: this.x,
      y: this.y + this.height / 2,
      alpha: 1
    });
    if (this.trail.length > 15) this.trail.pop();
    this.trail.forEach(t => t.alpha -= 0.07);

    // Update rainbow hue
    this.rainbowHue = (this.rainbowHue + 3) % 360;
  }

  // Land on a platform at a specific Y
  landOnPlatform(platformY: number): void {
    if (!this.isGrounded && this.velocityY > 0) {
      this.y = platformY - this.height;
      this.velocityY = 0;
      this.isGrounded = true;
      this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
    }
  }

  // Check if player fell into a hole
  checkHoleDeath(holeX: number, holeWidth: number): boolean {
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    // If player is at ground level and overlaps with hole, they die
    if (this.y + this.height >= groundY - 5) {
      const playerCenterX = this.x + this.width / 2;
      if (playerCenterX > holeX && playerCenterX < holeX + holeWidth) {
        return true;
      }
    }
    return false;
  }

  // Set low gravity state
  setLowGravity(active: boolean, multiplier: number = 0.5): void {
    this.isInLowGravity = active;
    this.gravityMultiplier = multiplier;
  }

  die(): void {
    this.isDead = true;
  }

  createJumpParticles(): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: this.x + Math.random() * 20,
        y: this.y + this.height,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: Math.random() * -3 - 1,
        life: 1,
        size: Math.random() * 6 + 2,
        hue: Math.random() * 60
      });
    }
    return particles;
  }

  createDeathParticles(): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: this.x + Math.random() * 40,
        y: this.y + Math.random() * 40,
        velocityX: (Math.random() - 0.5) * 10,
        velocityY: (Math.random() - 0.5) * 10,
        life: 1,
        size: Math.random() * 8 + 3,
        hue: Math.random() * 60
      });
    }
    return particles;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const skin = this.currentSkin;

    // Draw trail
    this.trail.forEach((t, i) => {
      if (t.alpha > 0) {
        ctx.beginPath();
        ctx.arc(t.x - i * 3, t.y, 3, 0, Math.PI * 2);

        if (skin.trail === 'rainbow') {
          ctx.fillStyle = `hsla(${(this.rainbowHue + i * 20) % 360}, 100%, 50%, ${t.alpha * 0.5})`;
        } else {
          ctx.fillStyle = `${skin.trail}${Math.floor(t.alpha * 127).toString(16).padStart(2, '0')}`;
        }
        ctx.fill();
      }
    });

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    // Glow effect
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 20;

    // Draw block with skin colors
    let gradient: CanvasGradient;
    if (skin.colors[0] === 'rainbow') {
      gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2);
      gradient.addColorStop(0, `hsl(${this.rainbowHue}, 100%, 50%)`);
      gradient.addColorStop(0.5, `hsl(${(this.rainbowHue + 60) % 360}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${(this.rainbowHue + 120) % 360}, 100%, 50%)`);
    } else {
      gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2);
      gradient.addColorStop(0, skin.colors[0]);
      gradient.addColorStop(1, skin.colors[1]);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 5, this.width - 10, this.height / 2 - 5);

    // Eye
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -5, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  getSkinGlow(): string {
    return this.currentSkin.glow;
  }

  getSkinTrail(): string {
    return this.currentSkin.trail;
  }

  getRainbowHue(): number {
    return this.rainbowHue;
  }
}
