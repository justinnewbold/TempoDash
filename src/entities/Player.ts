import { Vector2, InputState, Rectangle, PlayerSkin } from '../types';
import { PLAYER, GAME_HEIGHT } from '../constants';
import { Platform } from './Platform';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
  rotation: number;
  active: boolean; // For ring buffer
}

// Default skin for fallback
const DEFAULT_SKIN: PlayerSkin = {
  id: 'default',
  name: 'Cyan Cube',
  primaryColor: '#00ffaa',
  secondaryColor: '#00cc88',
  glowColor: '#00ffaa',
  eyeColor: '#ffffff',
  trailColor: 'rgba(0, 255, 170, 0.3)',
  cost: 0,
};

// Ring buffer size for trail points (pre-allocated for performance)
const TRAIL_BUFFER_SIZE = 20;

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

  // Ring buffer for trail points (pre-allocated for performance)
  private trailBuffer: TrailPoint[] = [];
  private trailHead = 0; // Index of next position to write
  private trailCount = 0; // Number of active trail points

  private animationTime = 0;
  private airJumpsRemaining = 2; // Can perform two air jumps (double + triple)

  // Dash ability (triggered on triple jump)
  isDashing = false;
  private dashTimer = 0;
  private static readonly DASH_DURATION = 225; // ms
  private static readonly DASH_SPEED_MULT = 2.5;

  // Current skin
  private skin: PlayerSkin = DEFAULT_SKIN;

  // New platform interaction states
  private onConveyor: Platform | null = null;
  private isStuck = false;
  private gravityFlipped = false;

  constructor(startPosition: Vector2) {
    this.x = startPosition.x;
    this.y = startPosition.y;

    // Pre-allocate trail buffer
    for (let i = 0; i < TRAIL_BUFFER_SIZE; i++) {
      this.trailBuffer.push({ x: 0, y: 0, alpha: 0, rotation: 0, active: false });
    }
  }

  setSkin(skin: PlayerSkin): void {
    this.skin = skin;
  }

  reset(position: Vector2): void {
    this.x = position.x;
    this.y = position.y;
    this.velocityY = 0;
    this.isGrounded = false;
    this.isDead = false;
    this.rotation = 0;
    this.targetRotation = 0;
    // Reset trail buffer without reallocation
    for (let i = 0; i < TRAIL_BUFFER_SIZE; i++) {
      this.trailBuffer[i].active = false;
    }
    this.trailHead = 0;
    this.trailCount = 0;
    this.airJumpsRemaining = 2;
    this.isDashing = false;
    this.dashTimer = 0;
    this.onConveyor = null;
    this.isStuck = false;
    this.gravityFlipped = false;
  }

  // Revive player (used when shield saves from death)
  revive(): void {
    this.isDead = false;
    // Give a small upward boost to escape the hazard
    this.velocityY = -PLAYER.JUMP_FORCE * 0.5;
  }

  update(deltaTime: number, input: InputState, platforms: Platform[], speedMultiplier: number = 1.0, allowAirJumps: boolean = true): void {
    if (this.isDead) return;

    this.animationTime += deltaTime;

    // Reset conveyor state each frame (will be re-set in collision handling)
    this.onConveyor = null;

    // Update dash timer
    if (this.isDashing) {
      this.dashTimer -= deltaTime;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }


    // Update trail
    this.updateTrail(deltaTime);

    // Handle sticky release - jump to escape
    if (this.isStuck && input.jumpPressed) {
      this.isStuck = false;
      this.velocityY = -PLAYER.JUMP_FORCE;
      this.isGrounded = false;
    }

    // Auto-move forward at constant speed (faster when dashing, affected by speed multiplier)
    // Sticky platforms slow/stop forward movement
    const stickySlow = this.isStuck ? 0.3 : 1;
    const speedMult = this.isDashing ? Player.DASH_SPEED_MULT : 1;
    this.x += PLAYER.SPEED * speedMult * speedMultiplier * stickySlow * (deltaTime / 1000);

    // Handle jumping (auto-jump when holding - jump as soon as grounded)
    if (input.jump && this.isGrounded && !this.isStuck) {
      this.velocityY = -PLAYER.JUMP_FORCE;
      this.isGrounded = false;
      this.airJumpsRemaining = 2; // Reset air jumps on ground jump
    } else if (input.jumpPressed && !this.isGrounded && this.airJumpsRemaining > 0 && allowAirJumps) {
      // Air jumps (double/triple) - each successive jump is weaker
      // Disabled when "Grounded" modifier is active
      const jumpMultiplier = this.airJumpsRemaining === 2 ? 1.275 : 0.7;
      this.velocityY = -PLAYER.JUMP_FORCE * jumpMultiplier;

      // Triple jump (last air jump) triggers dash
      if (this.airJumpsRemaining === 1) {
        this.isDashing = true;
        this.dashTimer = Player.DASH_DURATION;
      }

      this.airJumpsRemaining--;
    }

    // Apply gravity (flipped if on gravity platform)
    const gravityDir = this.gravityFlipped ? -1 : 1;
    this.velocityY += PLAYER.GRAVITY * gravityDir * (deltaTime / 1000);
    this.velocityY = Math.min(Math.abs(this.velocityY), PLAYER.MAX_FALL_SPEED) * Math.sign(this.velocityY);

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

    // Apply conveyor belt movement
    if (this.onConveyor !== null && this.isGrounded) {
      const conveyor = this.onConveyor as Platform;
      const conveyorSpeed = conveyor.conveyorSpeed * 150; // 150 px/s base speed
      this.x += conveyorSpeed * (deltaTime / 1000);
    }

    // Reset gravity flip when leaving ground (fall normally after flip)
    if (!this.isGrounded && this.gravityFlipped) {
      // Check if player is moving upward (escaped gravity flip)
      if (this.velocityY < 0) {
        this.gravityFlipped = false;
      }
    }

    // Check if fell off screen (death) - account for gravity flip
    const deathY = this.gravityFlipped ? -100 : GAME_HEIGHT + 100;
    const fellOffScreen = this.gravityFlipped ? this.y < deathY : this.y > deathY;
    if (fellOffScreen) {
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

      const bounds = platform.getBounds();

      // Handle platform-specific effects
      switch (platform.type) {
        case 'lava':
        case 'spike':
          this.isDead = true;
          return;

        case 'bounce':
          if (collision === 'top') {
            this.velocityY = -PLAYER.JUMP_FORCE * PLAYER.BOUNCE_MULTIPLIER;
            this.y = bounds.y - this.height;
          }
          continue;

        case 'glass':
          if (collision === 'top') {
            platform.onGlassLanding();
          }
          break;

        case 'conveyor':
          if (collision === 'top') {
            this.onConveyor = platform;
          }
          break;

        case 'sticky':
          if (collision === 'top') {
            this.isStuck = true;
          }
          break;

        case 'gravity':
          if (collision === 'top') {
            // Gravity flip - give upward boost and flip gravity direction
            this.gravityFlipped = !this.gravityFlipped;
            this.velocityY = this.gravityFlipped ? PLAYER.JUMP_FORCE : -PLAYER.JUMP_FORCE;
            this.y = bounds.y - this.height;
          }
          continue;
      }

      // Ledge assist: if hitting side but upper 50% of player is above platform top,
      // boost them up onto the platform instead of dying
      if (collision === 'left') {
        const playerMidpoint = this.y + this.height * 0.5;
        const platformTop = bounds.y;

        // If player's midpoint (50% of height) is above platform top, assist them up
        if (playerMidpoint < platformTop) {
          // Boost player up onto the platform
          this.y = platformTop - this.height;
          this.velocityY = 0;
          this.isGrounded = true;
          this.airJumpsRemaining = 2;
          continue;
        }

        // Otherwise it's a real side collision = death
        this.isDead = true;
        return;
      }

      if (collision === 'right') {
        // Apply same ledge assist logic to right side
        const playerMidpoint = this.y + this.height * 0.5;
        const platformTop = bounds.y;

        if (playerMidpoint < platformTop) {
          this.y = platformTop - this.height;
          this.velocityY = 0;
          this.isGrounded = true;
          this.airJumpsRemaining = 2;
          continue;
        }

        // Otherwise it's a real side collision = death
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
    // Add new trail point to ring buffer (no allocation)
    const point = this.trailBuffer[this.trailHead];
    point.x = this.x + this.width / 2;
    point.y = this.y + this.height / 2;
    point.alpha = 0.6;
    point.rotation = this.rotation;
    point.active = true;

    // Advance head pointer (wrap around)
    this.trailHead = (this.trailHead + 1) % TRAIL_BUFFER_SIZE;
    if (this.trailCount < TRAIL_BUFFER_SIZE) {
      this.trailCount++;
    }

    // Update alpha for all active points
    const fadeRate = deltaTime / 100;
    for (let i = 0; i < TRAIL_BUFFER_SIZE; i++) {
      if (this.trailBuffer[i].active) {
        this.trailBuffer[i].alpha -= fadeRate;
        if (this.trailBuffer[i].alpha <= 0) {
          this.trailBuffer[i].active = false;
        }
      }
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

    // Get skin colors (handle rainbow skin with cycling colors)
    let primaryColor = this.skin.primaryColor;
    let secondaryColor = this.skin.secondaryColor;
    let glowColor = this.skin.glowColor;

    if (this.skin.id === 'rainbow') {
      const hue = (this.animationTime * 0.1) % 360;
      primaryColor = `hsl(${hue}, 100%, 60%)`;
      secondaryColor = `hsl(${(hue + 30) % 360}, 100%, 50%)`;
      glowColor = `hsl(${hue}, 100%, 70%)`;
    }

    // Draw trail from ring buffer
    for (let i = 0; i < TRAIL_BUFFER_SIZE; i++) {
      const point = this.trailBuffer[i];
      if (!point.active) continue;

      const trailScreenX = point.x - cameraX;
      ctx.save();
      ctx.translate(trailScreenX, point.y);
      ctx.rotate((point.rotation * Math.PI) / 180);
      const trailColor = this.colorWithAlpha(this.skin.trailColor, point.alpha * 0.3);
      ctx.fillStyle = trailColor;
      ctx.fillRect(-this.width / 2 * point.alpha, -this.height / 2 * point.alpha,
                   this.width * point.alpha, this.height * point.alpha);
      ctx.restore();
    }

    // Draw player cube
    ctx.save();
    ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);

    // Body glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;

    // Main cube body with gradient
    const gradient = ctx.createLinearGradient(
      -this.width / 2,
      -this.height / 2,
      this.width / 2,
      this.height / 2
    );
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.5, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-this.width / 2 + 4, -this.height / 2 + 4, this.width - 8, 8);

    // Border (slightly lighter version of primary)
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Eye/face design (in top-right corner - front of movement)
    const eyeX = this.width / 2 - 10;
    const eyeY = -this.height / 2 + 10;

    ctx.fillStyle = this.skin.eyeColor;
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
      // Use skin's glow color with alpha for pulse
      const pulseColor = this.skin.id === 'rainbow'
        ? `hsla(${(this.animationTime * 0.1) % 360}, 100%, 60%, ${0.3 * pulse})`
        : this.colorWithAlpha(glowColor, 0.3 * pulse);
      ctx.strokeStyle = pulseColor;
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

  // Helper to convert any color format to rgba with specified alpha
  private colorWithAlpha(color: string, alpha: number): string {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // Handle rgba - replace alpha value
    if (color.startsWith('rgba')) {
      return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
    }
    // Handle rgb - convert to rgba
    if (color.startsWith('rgb')) {
      return color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    }
    // Fallback - return as-is
    return color;
  }
}
