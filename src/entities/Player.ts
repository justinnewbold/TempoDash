import { SKINS, Particle, Skin } from '../types';
import { CONFIG } from '../constants';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
  size: number;
  velocityY: number;
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

  // Configurable physics (for dev settings)
  customGravity: number | null = null;
  customJumpForce: number | null = null;

  // Double jump power-up (auto-activates on collection for 8 seconds)
  hasDoubleJump = false; // Currently active (timed)
  private doubleJumpUsed = false;
  private doubleJumpEndTime = 0; // When the current boost expires

  // Squash & stretch
  private squashX = 1;
  private squashY = 1;
  private targetSquashX = 1;
  private targetSquashY = 1;
  private wasGrounded = true;

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
    this.squashX = 1;
    this.squashY = 1;
    this.targetSquashX = 1;
    this.targetSquashY = 1;
    this.wasGrounded = true;
    // Reset double jump
    this.hasDoubleJump = false;
    this.doubleJumpUsed = false;
    this.doubleJumpEndTime = 0;
  }

  jump(): boolean {
    if (this.isDead) return false;

    const jumpForce = this.customJumpForce ?? CONFIG.JUMP_FORCE;

    if (this.isGrounded) {
      // Normal ground jump
      this.velocityY = jumpForce;
      this.isGrounded = false;
      this.doubleJumpUsed = false; // Reset double jump on ground jump
      // Stretch on jump (taller and thinner)
      this.targetSquashX = 0.7;
      this.targetSquashY = 1.3;
      return true;
    } else if (this.hasDoubleJump && !this.doubleJumpUsed) {
      // Double jump in air
      this.velocityY = jumpForce * 0.85; // Slightly weaker than ground jump
      this.doubleJumpUsed = true;
      // More extreme stretch for double jump
      this.targetSquashX = 0.6;
      this.targetSquashY = 1.4;
      return true;
    }
    return false;
  }

  update(gameSpeed: number): void {
    if (this.isDead) return;

    // Apply gravity
    let gravity = this.customGravity ?? CONFIG.GRAVITY;
    if (this.isInLowGravity) {
      gravity *= this.gravityMultiplier;
    }

    this.velocityY += gravity * gameSpeed;
    this.y += this.velocityY * gameSpeed;

    // Ground collision
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - this.height;
    if (this.y >= groundY) {
      this.y = groundY;

      // Squash on landing (wider and shorter)
      if (!this.wasGrounded && this.velocityY > 0) {
        const impactForce = Math.min(Math.abs(this.velocityY) / 15, 1);
        this.targetSquashX = 1 + impactForce * 0.4; // Wider
        this.targetSquashY = 1 - impactForce * 0.3; // Shorter
      }

      this.velocityY = 0;
      this.isGrounded = true;
      // Snap rotation to nearest 90 degrees
      this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
    } else {
      // Rotate while in air
      this.rotation += 0.15 * gameSpeed;

      // Stretch while falling fast
      if (this.velocityY > 5) {
        this.targetSquashX = 0.85;
        this.targetSquashY = 1.15;
      } else if (this.velocityY < -5) {
        // Stretch while rising fast
        this.targetSquashX = 0.8;
        this.targetSquashY = 1.2;
      } else {
        // Return to normal in air
        this.targetSquashX = 1;
        this.targetSquashY = 1;
      }
    }

    // Track grounded state
    this.wasGrounded = this.isGrounded;

    // Smoothly interpolate squash values
    const squashSpeed = 0.2 * gameSpeed;
    this.squashX += (this.targetSquashX - this.squashX) * squashSpeed;
    this.squashY += (this.targetSquashY - this.squashY) * squashSpeed;

    // Return to normal when grounded
    if (this.isGrounded) {
      this.targetSquashX = 1;
      this.targetSquashY = 1;
    }

    // Update trail - more points when moving fast
    const speed = Math.abs(this.velocityY);
    const trailSize = 3 + Math.min(speed * 0.3, 5); // Bigger trail at high speed

    this.trail.unshift({
      x: this.x,
      y: this.y + this.height / 2,
      alpha: 1,
      size: trailSize,
      velocityY: this.velocityY
    });

    // Keep more trail points when moving fast
    const maxTrail = this.isGrounded ? 10 : 20;
    while (this.trail.length > maxTrail) this.trail.pop();
    this.trail.forEach(t => t.alpha -= this.isGrounded ? 0.1 : 0.05);

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

  // Auto-activate double jump on collection (8 second duration)
  addDoubleJumpBoost(): void {
    this.hasDoubleJump = true;
    this.doubleJumpUsed = false;
    this.doubleJumpEndTime = Date.now() + 8000; // 8 seconds
  }

  // Get remaining time on current boost (for UI display)
  getDoubleJumpTimeRemaining(): number {
    if (!this.hasDoubleJump) return 0;
    return Math.max(0, this.doubleJumpEndTime - Date.now());
  }

  // Update power-up states
  updatePowerUps(): void {
    // Check if double jump boost has expired (10 second timer)
    if (this.hasDoubleJump && Date.now() > this.doubleJumpEndTime) {
      this.hasDoubleJump = false;
      this.doubleJumpUsed = false;
      this.doubleJumpEndTime = 0;
    }

    // Reset doubleJumpUsed when landing so player can double jump again
    // (during the 10 second window they can double jump multiple times)
    if (this.hasDoubleJump && this.isGrounded) {
      this.doubleJumpUsed = false;
    }
  }

  // Check if double jump was used (for particle effects)
  wasDoubleJumpUsed(): boolean {
    return this.doubleJumpUsed;
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

  createDoubleJumpParticles(): Particle[] {
    const particles: Particle[] = [];
    // More particles, orange/yellow hue, burst in all directions
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      particles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        velocityX: Math.cos(angle) * (3 + Math.random() * 3),
        velocityY: Math.sin(angle) * (3 + Math.random() * 3),
        life: 1,
        size: Math.random() * 8 + 4,
        hue: 30 + Math.random() * 30 // Orange to yellow
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

    // Draw enhanced trail
    this.trail.forEach((t, i) => {
      if (t.alpha > 0) {
        // Trail stretches based on velocity
        const stretch = Math.abs(t.velocityY) * 0.15;
        const offsetX = i * 4;

        ctx.beginPath();
        if (stretch > 1) {
          // Elongated trail when moving fast
          ctx.ellipse(t.x - offsetX, t.y, t.size * 0.8, t.size + stretch, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(t.x - offsetX, t.y, t.size, 0, Math.PI * 2);
        }

        if (skin.trail === 'rainbow') {
          ctx.fillStyle = `hsla(${(this.rainbowHue + i * 25) % 360}, 100%, 60%, ${t.alpha * 0.6})`;
        } else {
          ctx.fillStyle = `${skin.trail}${Math.floor(t.alpha * 150).toString(16).padStart(2, '0')}`;
        }
        ctx.fill();

        // Add glow for fast movement
        if (t.size > 5) {
          ctx.shadowColor = skin.glow;
          ctx.shadowBlur = t.size;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    });

    ctx.save();

    // Apply squash & stretch - anchor at bottom center when grounded
    const anchorY = this.isGrounded ? this.y + this.height : this.y + this.height / 2;
    ctx.translate(this.x + this.width / 2, anchorY);
    ctx.rotate(this.rotation);
    ctx.scale(this.squashX, this.squashY);

    // Offset to account for squash anchor point
    const offsetY = this.isGrounded ? -this.height / 2 : 0;

    // Glow effect
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 20;

    // Draw block with skin colors
    let gradient: CanvasGradient;
    if (skin.colors[0] === 'rainbow') {
      gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2 + offsetY, this.width / 2, this.height / 2 + offsetY);
      gradient.addColorStop(0, `hsl(${this.rainbowHue}, 100%, 50%)`);
      gradient.addColorStop(0.5, `hsl(${(this.rainbowHue + 60) % 360}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${(this.rainbowHue + 120) % 360}, 100%, 50%)`);
    } else {
      gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2 + offsetY, this.width / 2, this.height / 2 + offsetY);
      gradient.addColorStop(0, skin.colors[0]);
      gradient.addColorStop(1, skin.colors[1]);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(-this.width / 2, -this.height / 2 + offsetY, this.width, this.height);

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 5 + offsetY, this.width - 10, this.height / 2 - 5);

    // Eye - adjust position based on squash
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -5 + offsetY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7, -5 + offsetY, 4, 0, Math.PI * 2);
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
