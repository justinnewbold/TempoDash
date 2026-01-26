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

const TRAIL_BUFFER_SIZE = 15;

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

  // Events for haptics/audio
  jumpEvent = false;
  landEvent = false;
  bounceEvent = false;
  deathEvent = false;

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
  }

  clearEvents(): void {
    this.jumpEvent = false;
    this.landEvent = false;
    this.bounceEvent = false;
    this.deathEvent = false;
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

    // Check if fallen off bottom of screen (relative to camera)
    // Camera follows player, so check if player is too far below their expected position
    const screenY = this.getScreenY(this.y - PLAYER.SCROLL_SPEED * 2);
    if (screenY > GAME.HEIGHT + 200) {
      this.isDead = true;
      this.deathEvent = true;
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
        case 'spike':
          this.isDead = true;
          this.deathEvent = true;
          return;

        case 'bounce':
          if (collision === 'bottom') {
            // Player lands on top (remember Y is inverted for vertical scroll)
            this.velocityY = PLAYER.JUMP_FORCE * PLAYER.BOUNCE_MULTIPLIER;
            this.y = bounds.y + bounds.height + this.height;
            this.bounceEvent = true;
            this.airJumpsRemaining = 1; // Reset double jump on bounce
          }
          continue;
      }

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
