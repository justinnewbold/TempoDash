import { Vector2, Rectangle, PlayerSkin, DEFAULT_SKIN } from '../types';
import { PLAYER, GAME } from '../constants';
import { Platform } from './Platform';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
  rotation: number;
  active: boolean;
}

interface DashAfterimage {
  x: number;
  y: number;
  alpha: number;
  active: boolean;
}

const TRAIL_BUFFER_SIZE = 15;
const DASH_AFTERIMAGE_SIZE = 8;
const DASH_DURATION = 200; // ms
const DASH_DISTANCE = 150; // pixels
const DASH_COOLDOWN = 1500; // ms
const DASH_SPEED = (DASH_DISTANCE / DASH_DURATION) * 1000; // pixels per second

export class Player {
  x: number;
  y: number; // World Y position (increases as player goes up)
  width = PLAYER.SIZE;
  height = PLAYER.SIZE;
  velocityY = 0;

  isGrounded = false;
  isDead = false;
  private rotation = 0;

  private trailBuffer: TrailPoint[] = [];
  private trailHead = 0;

  private animationTime = 0;
  private airJumpsRemaining = 1; // One double jump

  private skin: PlayerSkin = DEFAULT_SKIN;

  // Dash ability state
  isDashing = false;
  private dashTime = 0;
  private dashDirection = 0; // -1 left, 1 right
  private dashCooldown = 0;
  private dashAfterimages: DashAfterimage[] = [];
  private dashAfterimageTimer = 0;

  // Events for haptics/audio
  jumpEvent = false;
  landEvent = false;
  bounceEvent = false;
  deathEvent = false;
  dashEvent = false;

  constructor(startPosition: Vector2) {
    this.x = startPosition.x;
    this.y = startPosition.y;

    // Pre-allocate trail buffer
    for (let i = 0; i < TRAIL_BUFFER_SIZE; i++) {
      this.trailBuffer.push({ x: 0, y: 0, alpha: 0, rotation: 0, active: false });
    }

    // Pre-allocate dash afterimage buffer
    for (let i = 0; i < DASH_AFTERIMAGE_SIZE; i++) {
      this.dashAfterimages.push({ x: 0, y: 0, alpha: 0, active: false });
    }
  }

  setSkin(skin: PlayerSkin): void {
    this.skin = skin;
  }

  getSkin(): PlayerSkin {
    return this.skin;
  }

  reset(position: Vector2): void {
    this.x = position.x;
    this.y = position.y;
    this.velocityY = 0;
    this.isGrounded = false;
    this.isDead = false;
    this.rotation = 0;
    this.airJumpsRemaining = 1;
    this.clearEvents();

    for (let i = 0; i < TRAIL_BUFFER_SIZE; i++) {
      this.trailBuffer[i].active = false;
    }
    this.trailHead = 0;

    // Reset dash state
    this.isDashing = false;
    this.dashTime = 0;
    this.dashDirection = 0;
    this.dashCooldown = 0;
    this.dashAfterimageTimer = 0;
    for (let i = 0; i < DASH_AFTERIMAGE_SIZE; i++) {
      this.dashAfterimages[i].active = false;
    }
  }

  clearEvents(): void {
    this.jumpEvent = false;
    this.landEvent = false;
    this.bounceEvent = false;
    this.deathEvent = false;
    this.dashEvent = false;
  }

  dash(direction: number): void {
    // Can only dash if not currently dashing and cooldown is ready
    if (this.isDashing || this.dashCooldown > 0 || this.isDead) return;

    this.isDashing = true;
    this.dashTime = 0;
    this.dashDirection = direction;
    this.dashCooldown = DASH_COOLDOWN;
    this.dashEvent = true;
    this.dashAfterimageTimer = 0;
  }

  canDash(): boolean {
    return !this.isDashing && this.dashCooldown <= 0 && !this.isDead;
  }

  getDashCooldownPercent(): number {
    return Math.max(0, 1 - this.dashCooldown / DASH_COOLDOWN);
  }

  update(
    deltaTime: number,
    jumpPressed: boolean,
    jumpHeld: boolean,
    platforms: Platform[]
  ): void {
    if (this.isDead) return;

    const dt = deltaTime / 1000;
    this.animationTime += deltaTime;

    // Clear events from previous frame
    this.clearEvents();

    // Update dash cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown -= deltaTime;
      if (this.dashCooldown < 0) this.dashCooldown = 0;
    }

    // Handle dash movement
    if (this.isDashing) {
      this.dashTime += deltaTime;

      // Apply dash velocity
      const dashVelocity = DASH_SPEED * this.dashDirection;
      this.x += dashVelocity * dt;

      // Keep player in bounds during dash
      this.x = Math.max(PLAYER.SIZE / 2, Math.min(GAME.WIDTH - PLAYER.SIZE / 2, this.x));

      // Create afterimages during dash
      this.dashAfterimageTimer += deltaTime;
      if (this.dashAfterimageTimer >= 20) { // Every 20ms
        this.addDashAfterimage();
        this.dashAfterimageTimer = 0;
      }

      // End dash after duration
      if (this.dashTime >= DASH_DURATION) {
        this.isDashing = false;
        this.dashTime = 0;
      }
    }

    // Update dash afterimages
    this.updateDashAfterimages(deltaTime);

    // Auto-scroll upward (world Y increases)
    this.y += PLAYER.SCROLL_SPEED * dt;

    // Handle jumping
    if (jumpPressed) {
      if (this.isGrounded) {
        // Ground jump
        this.velocityY = PLAYER.JUMP_FORCE;
        this.isGrounded = false;
        this.airJumpsRemaining = 1;
        this.jumpEvent = true;
      } else if (this.airJumpsRemaining > 0) {
        // Double jump (slightly weaker)
        this.velocityY = PLAYER.JUMP_FORCE * 0.85;
        this.airJumpsRemaining--;
        this.jumpEvent = true;
      }
    }

    // Apply gravity (inverted for vertical scrolling - positive Y is up)
    this.velocityY -= PLAYER.GRAVITY * dt;

    // Clamp fall speed
    if (this.velocityY < -PLAYER.MAX_FALL_SPEED) {
      this.velocityY = -PLAYER.MAX_FALL_SPEED;
    }

    // Apply velocity to position
    this.y += this.velocityY * dt;

    // Update trail
    this.updateTrail(deltaTime);

    // Handle rotation
    if (!this.isGrounded) {
      this.rotation += PLAYER.ROTATION_SPEED * dt;
    } else {
      // Snap to nearest 90 degrees when grounded
      this.rotation = Math.round(this.rotation / 90) * 90;
    }

    // Handle collisions
    this.handleCollisions(platforms);

    // Note: Fall-off-screen death detection is handled by the game engine,
    // which has access to the actual camera position.
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
        case 'spike':
          // Spikes still kill during dash (no invincibility against spikes)
          if (!this.isDashing) {
            this.isDead = true;
            this.deathEvent = true;
            return;
          }
          continue;

        case 'lava':
          // Lava still kills during dash
          if (!this.isDashing) {
            this.isDead = true;
            this.deathEvent = true;
            return;
          }
          continue;

        case 'bounce':
          // Bounce platforms phase through during dash
          if (this.isDashing) continue;

          if (collision === 'bottom') {
            // Player lands on top (remember Y is inverted for vertical scroll)
            this.velocityY = PLAYER.JUMP_FORCE * PLAYER.BOUNCE_MULTIPLIER;
            this.y = bounds.y + bounds.height + this.height;
            this.bounceEvent = true;
            this.airJumpsRemaining = 1; // Reset double jump on bounce
          }
          continue;
      }

      // Player is invincible to regular platform collisions during dash
      if (this.isDashing) continue;

      // Resolve collision
      this.resolveCollision(platform, collision);
    }

    // Emit land event
    if (!wasGrounded && this.isGrounded) {
      this.landEvent = true;
    }
  }

  private checkCollision(
    platform: Platform
  ): 'top' | 'bottom' | 'left' | 'right' | null {
    const bounds = platform.getBounds();
    const playerBounds = this.getBounds();

    // Check if overlapping
    if (
      playerBounds.x + playerBounds.width <= bounds.x ||
      playerBounds.x >= bounds.x + bounds.width ||
      playerBounds.y + playerBounds.height <= bounds.y ||
      playerBounds.y >= bounds.y + bounds.height
    ) {
      return null;
    }

    // Determine collision side
    const overlapLeft = playerBounds.x + playerBounds.width - bounds.x;
    const overlapRight = bounds.x + bounds.width - playerBounds.x;
    const overlapBottom = playerBounds.y + playerBounds.height - bounds.y;
    const overlapTop = bounds.y + bounds.height - playerBounds.y;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapY < minOverlapX) {
      // Vertical collision
      return overlapBottom < overlapTop ? 'bottom' : 'top';
    } else {
      // Horizontal collision
      return overlapLeft < overlapRight ? 'left' : 'right';
    }
  }

  private resolveCollision(
    platform: Platform,
    side: 'top' | 'bottom' | 'left' | 'right'
  ): void {
    const bounds = platform.getBounds();

    switch (side) {
      case 'bottom':
        // Player lands on top of platform (Y is up, so bottom collision = landing)
        this.y = bounds.y + bounds.height;
        this.velocityY = 0;
        this.isGrounded = true;
        this.airJumpsRemaining = 1;

        // Handle crumble
        if (platform.type === 'crumble') {
          platform.startCrumble();
        }
        break;

      case 'top':
        // Player hits platform from below
        this.y = bounds.y - this.height;
        if (this.velocityY > 0) {
          this.velocityY = 0;
        }
        break;

      case 'left':
      case 'right':
        // Side collision = death in auto-scroller
        this.isDead = true;
        this.deathEvent = true;
        break;
    }
  }

  private updateTrail(deltaTime: number): void {
    // Add new trail point
    const point = this.trailBuffer[this.trailHead];
    point.x = this.x + this.width / 2;
    point.y = this.y + this.height / 2;
    point.alpha = 0.5;
    point.rotation = this.rotation;
    point.active = true;

    this.trailHead = (this.trailHead + 1) % TRAIL_BUFFER_SIZE;

    // Fade existing points
    const fadeRate = deltaTime / 80;
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

  getRotation(): number {
    return this.rotation;
  }

  getTrail(): TrailPoint[] {
    // OPTIMIZED: Return buffer directly instead of filtering every frame
    // Rendering will skip inactive points
    return this.trailBuffer;
  }

  getDashAfterimages(): DashAfterimage[] {
    return this.dashAfterimages;
  }

  private addDashAfterimage(): void {
    // Find an inactive afterimage or reuse the oldest one
    let targetIndex = -1;
    for (let i = 0; i < DASH_AFTERIMAGE_SIZE; i++) {
      if (!this.dashAfterimages[i].active) {
        targetIndex = i;
        break;
      }
    }

    // If no inactive found, use the first one
    if (targetIndex === -1) targetIndex = 0;

    const afterimage = this.dashAfterimages[targetIndex];
    afterimage.x = this.x + this.width / 2;
    afterimage.y = this.y + this.height / 2;
    afterimage.alpha = 0.7;
    afterimage.active = true;
  }

  private updateDashAfterimages(deltaTime: number): void {
    const fadeRate = deltaTime / 100;
    for (let i = 0; i < DASH_AFTERIMAGE_SIZE; i++) {
      if (this.dashAfterimages[i].active) {
        this.dashAfterimages[i].alpha -= fadeRate;
        if (this.dashAfterimages[i].alpha <= 0) {
          this.dashAfterimages[i].active = false;
        }
      }
    }
  }

  // Convert world Y to screen Y (for rendering)
  getScreenY(cameraY: number): number {
    // Player appears at fixed screen position, world moves around them
    return PLAYER.SCREEN_Y_POSITION - (this.y - cameraY);
  }

  // Get screen X (centered horizontally, slight offset for visual interest)
  getScreenX(): number {
    return this.x;
  }
}
