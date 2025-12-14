import { Vector2, InputState, Rectangle } from '../types';
import { PLAYER, COLORS, GAME_HEIGHT } from '../constants';
import { Platform } from './Platform';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
  rotation: number;
}

export class Player {
  x: number;
  y: number;
  width = PLAYER.WIDTH;
  height = PLAYER.HEIGHT;
  velocityY = 0;

  isGrounded = false;
  isDead = false;
  private rotation = 0; // Current rotation in degrees
  private targetRotation = 0; // Target rotation (snaps to 90 degree increments)
  private trail: TrailPoint[] = [];
  private animationTime = 0;
  private airJumpsRemaining = 2; // Can perform two air jumps (double + triple)

  constructor(startPosition: Vector2) {
    this.x = startPosition.x;
    this.y = startPosition.y;
  }

  reset(position: Vector2): void {
    this.x = position.x;
    this.y = position.y;
    this.velocityY = 0;
    this.isGrounded = false;
    this.isDead = false;
    this.rotation = 0;
    this.targetRotation = 0;
    this.trail = [];
    this.airJumpsRemaining = 2;
  }

  update(deltaTime: number, input: InputState, platforms: Platform[]): void {
    if (this.isDead) return;

    this.animationTime += deltaTime;

    // Update trail
    this.updateTrail(deltaTime);

    // Auto-move forward at constant speed
    this.x += PLAYER.SPEED * (deltaTime / 1000);

    // Handle jumping (auto-jump when holding - jump as soon as grounded)
    if (input.jump && this.isGrounded) {
      this.velocityY = -PLAYER.JUMP_FORCE;
      this.isGrounded = false;
      this.airJumpsRemaining = 2; // Reset air jumps on ground jump
    } else if (input.jumpPressed && !this.isGrounded && this.airJumpsRemaining > 0) {
      // Air jumps (double/triple) - each successive jump is weaker
      const jumpMultiplier = this.airJumpsRemaining === 2 ? 0.85 : 0.7;
      this.velocityY = -PLAYER.JUMP_FORCE * jumpMultiplier;
      this.airJumpsRemaining--;
    }

    // Apply gravity
    this.velocityY += PLAYER.GRAVITY * (deltaTime / 1000);
    this.velocityY = Math.min(this.velocityY, PLAYER.MAX_FALL_SPEED);

    // Apply vertical velocity
    this.y += this.velocityY * (deltaTime / 1000);

    // Handle rotation (spin in air like Geometry Dash)
    if (!this.isGrounded) {
      this.rotation += PLAYER.ROTATION_SPEED * (deltaTime / 1000);
    } else {
      // Snap to nearest 90 degrees when landing
      this.targetRotation = Math.round(this.rotation / 90) * 90;
      this.rotation = this.targetRotation;
    }

    // Handle collisions
    this.handleCollisions(platforms);

    // Check if fell off screen (death)
    if (this.y > GAME_HEIGHT + 100) {
      this.isDead = true;
    }
  }

  private handleCollisions(platforms: Platform[]): void {
    const wasGrounded = this.isGrounded;
    this.isGrounded = false;

    for (const platform of platforms) {
      if (!platform.isCollidable()) continue;

      const collision = this.checkCollision(platform);
      if (!collision) continue;

      // Handle platform-specific effects
      switch (platform.type) {
        case 'lava':
        case 'spike':
          this.isDead = true;
          return;

        case 'bounce':
          if (collision === 'top') {
            this.velocityY = -PLAYER.JUMP_FORCE * PLAYER.BOUNCE_MULTIPLIER;
            this.y = platform.y - this.height;
          }
          continue;
      }

      // In Geometry Dash style, hitting the side of a platform = death
      if (collision === 'left' || collision === 'right') {
        this.isDead = true;
        return;
      }

      // Resolve collision
      this.resolveCollision(platform, collision);
    }

    // Reset rotation target when first landing
    if (!wasGrounded && this.isGrounded) {
      this.targetRotation = Math.round(this.rotation / 90) * 90;
    }
  }

  private checkCollision(
    platform: Platform
  ): 'top' | 'bottom' | 'left' | 'right' | null {
    const bounds = platform.getBounds();

    // Check if overlapping
    if (
      this.x + this.width <= bounds.x ||
      this.x >= bounds.x + bounds.width ||
      this.y + this.height <= bounds.y ||
      this.y >= bounds.y + bounds.height
    ) {
      return null;
    }

    // Determine collision side
    const overlapLeft = this.x + this.width - bounds.x;
    const overlapRight = bounds.x + bounds.width - this.x;
    const overlapTop = this.y + this.height - bounds.y;
    const overlapBottom = bounds.y + bounds.height - this.y;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapY < minOverlapX) {
      return overlapTop < overlapBottom ? 'top' : 'bottom';
    } else {
      return overlapLeft < overlapRight ? 'left' : 'right';
    }
  }

  private resolveCollision(
    platform: Platform,
    side: 'top' | 'bottom' | 'left' | 'right'
  ): void {
    const bounds = platform.getBounds();

    switch (side) {
      case 'top':
        this.y = bounds.y - this.height;
        this.velocityY = 0;
        this.isGrounded = true;
        this.airJumpsRemaining = 2; // Reset air jumps on landing
        break;
      case 'bottom':
        this.y = bounds.y + bounds.height;
        this.velocityY = 0;
        break;
      case 'left':
      case 'right':
        // Side collisions are death in auto-runner
        this.isDead = true;
        break;
    }
  }

  private updateTrail(deltaTime: number): void {
    // Add new trail point
    this.trail.push({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      alpha: 0.6,
      rotation: this.rotation,
    });

    // Update and remove old trail points
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].alpha -= deltaTime / 100;
      if (this.trail[i].alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Limit trail length
    while (this.trail.length > 15) {
      this.trail.shift();
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

  render(ctx: CanvasRenderingContext2D, cameraX: number = 0): void {
    const screenX = this.x - cameraX;
    const screenY = this.y;

    // Draw trail
    for (const point of this.trail) {
      const trailScreenX = point.x - cameraX;
      ctx.save();
      ctx.translate(trailScreenX, point.y);
      ctx.rotate((point.rotation * Math.PI) / 180);
      ctx.fillStyle = `rgba(0, 255, 170, ${point.alpha * 0.3})`;
      ctx.fillRect(-this.width / 2 * point.alpha, -this.height / 2 * point.alpha,
                   this.width * point.alpha, this.height * point.alpha);
      ctx.restore();
    }

    // Draw player cube
    ctx.save();
    ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);

    // Body glow
    ctx.shadowColor = COLORS.PLAYER;
    ctx.shadowBlur = 20;

    // Main cube body with gradient
    const gradient = ctx.createLinearGradient(
      -this.width / 2,
      -this.height / 2,
      this.width / 2,
      this.height / 2
    );
    gradient.addColorStop(0, '#00ffcc');
    gradient.addColorStop(0.5, COLORS.PLAYER);
    gradient.addColorStop(1, '#00cc88');
    ctx.fillStyle = gradient;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-this.width / 2 + 4, -this.height / 2 + 4, this.width - 8, 8);

    // Border
    ctx.strokeStyle = '#00ffee';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Eye/face design (in top-right corner - front of movement)
    const eyeX = this.width / 2 - 10;
    const eyeY = -this.height / 2 + 10;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(eyeX + 2, eyeY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Small highlight in eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX + 3.5, eyeY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Animated pulse effect around player (when grounded)
    if (this.isGrounded) {
      const pulse = Math.sin(this.animationTime * 0.01) * 0.2 + 0.8;
      ctx.save();
      ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
      ctx.strokeStyle = `rgba(0, 255, 170, ${0.3 * pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        -this.width / 2 - 5 * pulse,
        -this.height / 2 - 5 * pulse,
        this.width + 10 * pulse,
        this.height + 10 * pulse
      );
      ctx.restore();
    }
  }
}
