import { Vector2, InputState, Rectangle } from '../types';
import { PLAYER, COLORS, GAME_HEIGHT, GAME_WIDTH, PLATFORM } from '../constants';
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

  // New state variables
  isInLowGravity = false;
  gravityMultiplier = 1;
  isGravityReversed = false;
  private teleportCooldown = 0;
  private speedBoostTimer = 0;

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
    this.isInLowGravity = false;
    this.gravityMultiplier = 1;
    this.isGravityReversed = false;
    this.teleportCooldown = 0;
    this.speedBoostTimer = 0;
  }

  update(deltaTime: number, input: InputState, platforms: Platform[]): void {
    if (this.isDead) return;

    this.animationTime += deltaTime;

    // Update cooldowns
    if (this.teleportCooldown > 0) this.teleportCooldown -= deltaTime;
    if (this.speedBoostTimer > 0) this.speedBoostTimer -= deltaTime;

    // Reset per-frame states
    this.isInLowGravity = false;
    this.gravityMultiplier = 1;

    // Update trail
    this.updateTrail(deltaTime);

    // Handle horizontal movement
    this.handleMovement(input, deltaTime);

    // Handle jumping
    this.handleJumping(input, deltaTime);

    // Apply gravity (respecting low gravity and reverse gravity)
    let gravity = PLAYER.GRAVITY * this.gravityMultiplier;
    if (this.isGravityReversed) gravity = -gravity;

    this.velocityY += gravity * (deltaTime / 1000);

    const maxFall = this.isGravityReversed ? -PLAYER.MAX_FALL_SPEED : PLAYER.MAX_FALL_SPEED;
    if (this.isGravityReversed) {
      this.velocityY = Math.max(this.velocityY, maxFall);
    } else {
      this.velocityY = Math.min(this.velocityY, maxFall);
    }

    // Apply velocities
    this.x += this.velocityX * (deltaTime / 1000);
    this.y += this.velocityY * (deltaTime / 1000);

    // Handle collisions
    this.handleCollisions(platforms, deltaTime);

    // Update coyote time
    if (!this.isGrounded) {
      this.coyoteTime -= deltaTime;
    }

    // Check if fell off screen (both directions for reverse gravity)
    if (this.y > GAME_HEIGHT + 100 || this.y < -100) {
      this.isDead = true;
    }

    // Keep player in horizontal bounds
    if (this.x < 0) this.x = 0;
    if (this.x > GAME_WIDTH - this.width) this.x = GAME_WIDTH - this.width;
  }

  private handleMovement(input: InputState, deltaTime: number): void {
    const targetVelocity = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const acceleration = this.isGrounded
      ? PLAYER.SPEED
      : PLAYER.SPEED * PLAYER.AIR_CONTROL;

    if (targetVelocity !== 0) {
      this.facingRight = targetVelocity > 0;
      this.velocityX += targetVelocity * acceleration * (deltaTime / 1000) * 10;

      // Allow higher speed during speed boost
      const maxSpeed = this.speedBoostTimer > 0 ? PLAYER.SPEED * 2 : PLAYER.SPEED;
      this.velocityX = Math.max(-maxSpeed, Math.min(maxSpeed, this.velocityX));
    } else {
      // Apply friction
      const friction = this.isOnIce ? PLAYER.ICE_FRICTION : PLAYER.NORMAL_FRICTION;
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
      // Jump direction depends on gravity
      const jumpForce = this.isGravityReversed ? PLAYER.JUMP_FORCE : -PLAYER.JUMP_FORCE;
      // Weaker jump in low gravity
      this.velocityY = jumpForce * (this.isInLowGravity ? 0.7 : 1);
      this.isGrounded = false;
      this.coyoteTime = 0;
      this.jumpBufferTime = 0;
    }

    // Variable jump height
    if (!input.jump) {
      const threshold = this.isGravityReversed ? PLAYER.JUMP_FORCE / 2 : -PLAYER.JUMP_FORCE / 2;
      if (this.isGravityReversed) {
        if (this.velocityY > threshold) {
          this.velocityY = threshold;
        }
      } else {
        if (this.velocityY < threshold) {
          this.velocityY = threshold;
        }
      }
    }
  }

  private handleCollisions(platforms: Platform[], deltaTime: number): void {
    const wasGrounded = this.isGrounded;
    this.isGrounded = false;
    this.isOnIce = false;

    // Collect effects from overlapping platforms
    let conveyorSpeed = 0;
    let windForce = 0;

    for (const platform of platforms) {
      if (!platform.isCollidable()) continue;

      const collision = this.checkCollision(platform);
      if (!collision) continue;

      // Check for deadly platforms first
      if (platform.isDeadly()) {
        this.isDead = true;
        return;
      }

      // Handle platform-specific effects
      switch (platform.type) {
        case 'bounce':
          if (collision === 'top' || (this.isGravityReversed && collision === 'bottom')) {
            const bounceForce = this.isGravityReversed
              ? PLAYER.JUMP_FORCE * PLAYER.BOUNCE_MULTIPLIER
              : -PLAYER.JUMP_FORCE * PLAYER.BOUNCE_MULTIPLIER;
            this.velocityY = bounceForce;
            const bounds = platform.getBounds();
            this.y = this.isGravityReversed
              ? bounds.y + bounds.height
              : bounds.y - this.height;
          }
          continue;

        case 'crumble':
          if (collision === 'top' || (this.isGravityReversed && collision === 'bottom')) {
            platform.startCrumble();
          }
          break;

        case 'ice':
          if (collision === 'top' || (this.isGravityReversed && collision === 'bottom')) {
            this.isOnIce = true;
          }
          break;

        case 'conveyor':
          if (collision === 'top' || (this.isGravityReversed && collision === 'bottom')) {
            conveyorSpeed += platform.getConveyorSpeed();
          }
          break;

        case 'lowgravity':
          this.isInLowGravity = true;
          this.gravityMultiplier = PLATFORM.LOW_GRAVITY_MULTIPLIER;
          break;

        case 'reverse':
          if (collision === 'top' && !this.isGravityReversed) {
            this.isGravityReversed = true;
            this.velocityY = -PLAYER.JUMP_FORCE * 0.5;
          } else if (collision === 'bottom' && this.isGravityReversed) {
            this.isGravityReversed = false;
            this.velocityY = PLAYER.JUMP_FORCE * 0.5;
          }
          break;

        case 'wind':
          windForce += platform.getWindForce();
          break;

        case 'cloud':
          if (collision === 'top' || (this.isGravityReversed && collision === 'bottom')) {
            platform.setStoodOn(true);
          }
          break;

        case 'teleporter':
          if (platform.canTeleport() && this.teleportCooldown <= 0) {
            const linkedPlatform = this.findLinkedTeleporter(platform, platforms);
            if (linkedPlatform) {
              const linkedBounds = linkedPlatform.getBounds();
              this.x = linkedBounds.x + linkedBounds.width / 2 - this.width / 2;
              this.y = linkedBounds.y - this.height - 5;
              platform.triggerTeleport();
              linkedPlatform.triggerTeleport();
              this.teleportCooldown = 500;
              continue;
            }
          }
          break;

        case 'speedboost':
          if (collision === 'top' || (this.isGravityReversed && collision === 'bottom')) {
            this.velocityX = this.facingRight ? PLATFORM.SPEED_BOOST_FORCE : -PLATFORM.SPEED_BOOST_FORCE;
            this.speedBoostTimer = 500;
          }
          break;
      }

      // Resolve collision
      this.resolveCollision(platform, collision);
    }

    // Apply conveyor and wind effects
    this.velocityX += conveyorSpeed * (deltaTime / 1000);
    this.velocityX += windForce * (deltaTime / 1000);

    // Set coyote time when leaving ground
    if (wasGrounded && !this.isGrounded) {
      this.coyoteTime = PLAYER.COYOTE_TIME;
    }
  }

  private findLinkedTeleporter(source: Platform, platforms: Platform[]): Platform | null {
    if (!source.linkedId) return null;
    return platforms.find(p =>
      p !== source &&
      p.type === 'teleporter' &&
      p.linkedId === source.linkedId
    ) || null;
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
        if (!this.isGravityReversed) {
          this.isGrounded = true;
        }
        break;
      case 'bottom':
        this.y = bounds.y + bounds.height;
        this.velocityY = 0;
        if (this.isGravityReversed) {
          this.isGrounded = true;
        }
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

    // Flip upside down if gravity is reversed
    if (this.isGravityReversed) {
      ctx.scale(1, -1);
    }

    // Body glow - different color in low gravity
    ctx.shadowColor = this.isInLowGravity ? '#a78bfa' : COLORS.PLAYER;
    ctx.shadowBlur = 15;

    // Main body
    const gradient = ctx.createLinearGradient(
      -this.width / 2,
      -this.height / 2,
      this.width / 2,
      this.height / 2
    );

    if (this.speedBoostTimer > 0) {
      gradient.addColorStop(0, '#fde047');
      gradient.addColorStop(0.5, '#facc15');
      gradient.addColorStop(1, '#eab308');
    } else if (this.isInLowGravity) {
      gradient.addColorStop(0, '#c4b5fd');
      gradient.addColorStop(0.5, '#a78bfa');
      gradient.addColorStop(1, '#8b5cf6');
    } else {
      gradient.addColorStop(0, '#00ffcc');
      gradient.addColorStop(0.5, COLORS.PLAYER);
      gradient.addColorStop(1, '#00cc88');
    }
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
