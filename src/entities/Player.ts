import { Vector2, InputState, Rectangle } from '../types';
import { PLAYER, COLORS, GAME_HEIGHT } from '../constants';
import { Platform } from './Platform';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export class Player {
  x: number;
  y: number;
  width = PLAYER.WIDTH;
  height = PLAYER.HEIGHT;
  velocityX = 0;
  velocityY = 0;

  isGrounded = false;
  isOnIce = false;
  isDead = false;
  private coyoteTime = 0;
  private jumpBufferTime = 0;
  private trail: TrailPoint[] = [];
  private animationTime = 0;
  private facingRight = true;

  constructor(startPosition: Vector2) {
    this.x = startPosition.x;
    this.y = startPosition.y;
  }

  reset(position: Vector2): void {
    this.x = position.x;
    this.y = position.y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isGrounded = false;
    this.isDead = false;
    this.coyoteTime = 0;
    this.jumpBufferTime = 0;
    this.trail = [];
  }

  update(deltaTime: number, input: InputState, platforms: Platform[]): void {
    if (this.isDead) return;

    this.animationTime += deltaTime;

    // Update trail
    this.updateTrail(deltaTime);

    // Handle horizontal movement
    this.handleMovement(input, deltaTime);

    // Handle jumping
    this.handleJumping(input, deltaTime);

    // Apply gravity
    this.velocityY += PLAYER.GRAVITY * (deltaTime / 1000);
    this.velocityY = Math.min(this.velocityY, PLAYER.MAX_FALL_SPEED);

    // Apply velocities
    this.x += this.velocityX * (deltaTime / 1000);
    this.y += this.velocityY * (deltaTime / 1000);

    // Handle collisions
    this.handleCollisions(platforms);

    // Update coyote time
    if (!this.isGrounded) {
      this.coyoteTime -= deltaTime;
    }

    // Check if fell off screen
    if (this.y > GAME_HEIGHT + 100) {
      this.isDead = true;
    }
  }

  private handleMovement(input: InputState, deltaTime: number): void {
    const targetVelocity =
      (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const acceleration = this.isGrounded
      ? PLAYER.SPEED
      : PLAYER.SPEED * PLAYER.AIR_CONTROL;

    if (targetVelocity !== 0) {
      this.facingRight = targetVelocity > 0;
      this.velocityX += targetVelocity * acceleration * (deltaTime / 1000) * 10;
      this.velocityX = Math.max(
        -PLAYER.SPEED,
        Math.min(PLAYER.SPEED, this.velocityX)
      );
    } else {
      // Apply friction
      const friction = this.isOnIce
        ? PLAYER.ICE_FRICTION
        : PLAYER.NORMAL_FRICTION;
      this.velocityX *= Math.pow(friction, deltaTime / 16);
      if (Math.abs(this.velocityX) < 5) {
        this.velocityX = 0;
      }
    }
  }

  private handleJumping(input: InputState, deltaTime: number): void {
    // Buffer jump input
    if (input.jumpPressed) {
      this.jumpBufferTime = PLAYER.JUMP_BUFFER;
    } else {
      this.jumpBufferTime -= deltaTime;
    }

    // Can jump if grounded or in coyote time
    const canJump = this.isGrounded || this.coyoteTime > 0;

    if (this.jumpBufferTime > 0 && canJump) {
      this.velocityY = -PLAYER.JUMP_FORCE;
      this.isGrounded = false;
      this.coyoteTime = 0;
      this.jumpBufferTime = 0;
    }

    // Variable jump height
    if (!input.jump && this.velocityY < -PLAYER.JUMP_FORCE / 2) {
      this.velocityY = -PLAYER.JUMP_FORCE / 2;
    }
  }

  private handleCollisions(platforms: Platform[]): void {
    const wasGrounded = this.isGrounded;
    this.isGrounded = false;
    this.isOnIce = false;

    for (const platform of platforms) {
      if (!platform.isCollidable()) continue;

      const collision = this.checkCollision(platform);
      if (!collision) continue;

      // Handle platform-specific effects
      switch (platform.type) {
        case 'lava':
          this.isDead = true;
          return;

        case 'bounce':
          if (collision === 'top') {
            this.velocityY = -PLAYER.JUMP_FORCE * PLAYER.BOUNCE_MULTIPLIER;
            this.y = platform.y - this.height;
          }
          continue;

        case 'crumble':
          if (collision === 'top') {
            platform.startCrumble();
          }
          break;

        case 'ice':
          if (collision === 'top') {
            this.isOnIce = true;
          }
          break;
      }

      // Resolve collision
      this.resolveCollision(platform, collision);
    }

    // Set coyote time when leaving ground
    if (wasGrounded && !this.isGrounded) {
      this.coyoteTime = PLAYER.COYOTE_TIME;
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
        break;
      case 'bottom':
        this.y = bounds.y + bounds.height;
        this.velocityY = 0;
        break;
      case 'left':
        this.x = bounds.x - this.width;
        this.velocityX = 0;
        break;
      case 'right':
        this.x = bounds.x + bounds.width;
        this.velocityX = 0;
        break;
    }
  }

  private updateTrail(deltaTime: number): void {
    // Add new trail point
    if (Math.abs(this.velocityX) > 50 || Math.abs(this.velocityY) > 50) {
      this.trail.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        alpha: 0.5,
      });
    }

    // Update and remove old trail points
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].alpha -= deltaTime / 200;
      if (this.trail[i].alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Limit trail length
    while (this.trail.length > 20) {
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

  render(ctx: CanvasRenderingContext2D): void {
    // Draw trail
    for (const point of this.trail) {
      ctx.fillStyle = `rgba(0, 255, 170, ${point.alpha})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8 * point.alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    // Squash and stretch
    const stretchY = 1 + Math.abs(this.velocityY) / 2000;
    const squashX = 1 / stretchY;
    ctx.scale(squashX, stretchY);

    // Flip based on direction
    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }

    // Body glow
    ctx.shadowColor = COLORS.PLAYER;
    ctx.shadowBlur = 15;

    // Main body
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

    // Draw rounded rectangle body
    this.drawRoundedRect(
      ctx,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
      8
    );

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(5, -10, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(7, -10, 3, 0, Math.PI * 2);
    ctx.fill();

    // Animated pulse effect
    const pulse = Math.sin(this.animationTime * 0.005) * 0.1 + 0.9;
    ctx.strokeStyle = `rgba(0, 255, 170, ${0.5 * pulse})`;
    ctx.lineWidth = 2;
    this.strokeRoundedRect(
      ctx,
      -this.width / 2 - 3,
      -this.height / 2 - 3,
      this.width + 6,
      this.height + 6,
      10
    );

    ctx.restore();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  private strokeRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
  }
}
