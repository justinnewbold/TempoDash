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
  private airJumpsRemaining = 4; // Can perform four air jumps (5 total jumps)

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

  // Wall sliding/jumping state
  private isWallSliding = false;
  private wallJumpCooldown = 0;
  private static readonly WALL_SLIDE_SPEED = 100; // Slower falling when sliding
  private static readonly WALL_JUMP_COOLDOWN = 200; // ms cooldown between wall jumps

  // Boomerang bounce state (when hitting platform edge)
  private boomerangVelocityX = 0;
  private boomerangActive = false;
  private boomerangTimer = 0;
  private static readonly BOOMERANG_INITIAL_VELOCITY = -350; // Initial backward velocity (more dramatic)
  private static readonly BOOMERANG_RETURN_ACCEL = 400; // Forward acceleration to create boomerang curve
  private static readonly BOOMERANG_WINDOW = 800; // ms window to tap for rescue dash
  private static readonly RESCUE_DASH_SPEED = 500; // Forward burst speed for rescue

  // Rescue dash state
  isInRescueWindow = false; // Exposed so Game can show indicator
  private rescueDashTriggered = false;

  // Slow-mo zone state
  isInSlowMo = false;

  // Coyote time (grace period after leaving a platform)
  private coyoteTimer = 0;
  private static readonly COYOTE_TIME = 80; // ms - brief grace period to still jump after walking off edge

  // Jump buffering (queue jump input slightly before landing)
  private jumpBufferTimer = 0;
  private static readonly JUMP_BUFFER_TIME = 100; // ms - how early before landing a jump press is remembered

  // Landing event for sound feedback
  landingEvent = false;

  // Flying mode state
  private flyingMode = false;
  private static readonly FLYING_LIFT_FORCE = 800;  // Upward force when holding jump
  private static readonly FLYING_GRAVITY = 600;     // Downward force when not holding

  // Particle effect events (cleared each frame after being read)
  edgeBounceEvent: { x: number; y: number; direction: 'left' | 'right' } | null = null;
  bounceEvent: { x: number; y: number; width: number } | null = null;
  wallSlideEvent: { x: number; y: number; side: 'left' | 'right' } | null = null;
  gravityFlipEvent: { x: number; y: number; flipped: boolean } | null = null;

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

  setFlyingMode(enabled: boolean): void {
    this.flyingMode = enabled;
  }

  isFlyingMode(): boolean {
    return this.flyingMode;
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
    this.airJumpsRemaining = 4;
    this.isDashing = false;
    this.dashTimer = 0;
    this.onConveyor = null;
    this.isStuck = false;
    this.gravityFlipped = false;
    this.isWallSliding = false;
    this.wallJumpCooldown = 0;
    this.isInSlowMo = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.landingEvent = false;
    this.boomerangVelocityX = 0;
    this.boomerangActive = false;
    this.boomerangTimer = 0;
    this.isInRescueWindow = false;
    this.rescueDashTriggered = false;
    this.clearEvents();
  }

  // Clear particle effect events (called after Game reads them)
  clearEvents(): void {
    this.edgeBounceEvent = null;
    this.bounceEvent = null;
    this.wallSlideEvent = null;
    this.gravityFlipEvent = null;
    this.landingEvent = false;
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

    // Save previous frame's wall slide state for wall jump input check
    const wasWallSliding = this.isWallSliding;

    // Reset conveyor and wall states each frame (will be re-set in collision handling)
    this.onConveyor = null;
    this.isWallSliding = false;
    this.isInSlowMo = false;

    // Update wall jump cooldown
    if (this.wallJumpCooldown > 0) {
      this.wallJumpCooldown -= deltaTime;
    }

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

    // Track coyote time - grace period after leaving a platform
    if (this.isGrounded) {
      this.coyoteTimer = Player.COYOTE_TIME;
    } else {
      this.coyoteTimer -= deltaTime;
    }

    // Track jump buffer - remember jump presses slightly before landing
    if (input.jumpPressed) {
      this.jumpBufferTimer = Player.JUMP_BUFFER_TIME;
    } else {
      this.jumpBufferTimer -= deltaTime;
    }

    // Auto-move forward at constant speed (faster when dashing, affected by speed multiplier)
    // Sticky platforms slow/stop forward movement
    const stickySlow = this.isStuck ? 0.3 : 1;
    const speedMult = this.isDashing ? Player.DASH_SPEED_MULT : 1;
    this.x += PLAYER.SPEED * speedMult * speedMultiplier * stickySlow * (deltaTime / 1000);

    // Boomerang physics: when hit platform edge, player moves back then forward again
    if (this.boomerangActive) {
      this.boomerangTimer += deltaTime;

      // Check for rescue dash input during the rescue window
      if (this.boomerangTimer < Player.BOOMERANG_WINDOW) {
        this.isInRescueWindow = true;

        // If player taps jump during rescue window, trigger rescue dash
        if (input.jumpPressed && !this.rescueDashTriggered) {
          this.rescueDashTriggered = true;
          // Cancel boomerang backward motion and dash forward
          this.boomerangVelocityX = Player.RESCUE_DASH_SPEED;
          // Give extra upward boost for the save
          this.velocityY = -PLAYER.JUMP_FORCE * 0.9;
          // Trigger a dash effect
          this.isDashing = true;
          this.dashTimer = 300; // Short dash
        }
      } else {
        this.isInRescueWindow = false;
      }

      // Apply boomerang velocity to position
      this.x += this.boomerangVelocityX * (deltaTime / 1000);

      // Accelerate forward to create boomerang curve (back -> forward)
      // If rescue dash was triggered, accelerate faster
      const accelMult = this.rescueDashTriggered ? 2.0 : 1.0;
      this.boomerangVelocityX += Player.BOOMERANG_RETURN_ACCEL * accelMult * (deltaTime / 1000);

      // Once we've swung back forward past a threshold, end the boomerang
      if (this.boomerangVelocityX >= 200) {
        this.boomerangVelocityX = 0;
        this.boomerangActive = false;
        this.boomerangTimer = 0;
        this.isInRescueWindow = false;
        this.rescueDashTriggered = false;
      }
    }

    // Flying mode: hold to fly up, release to fall
    if (this.flyingMode) {
      if (input.jump) {
        // Apply lift force when holding jump
        this.velocityY -= Player.FLYING_LIFT_FORCE * (deltaTime / 1000);
        // Cap upward velocity
        if (this.velocityY < -400) {
          this.velocityY = -400;
        }
      } else {
        // Apply gravity when not holding
        this.velocityY += Player.FLYING_GRAVITY * (deltaTime / 1000);
        // Cap downward velocity
        if (this.velocityY > 400) {
          this.velocityY = 400;
        }
      }
      // Keep player within screen bounds vertically
      if (this.y < 20) {
        this.y = 20;
        this.velocityY = Math.max(0, this.velocityY);
      }
      if (this.y > GAME_HEIGHT - this.height - 20) {
        this.y = GAME_HEIGHT - this.height - 20;
        this.velocityY = Math.min(0, this.velocityY);
      }
    } else {
      // Normal mode: Handle jumping with coyote time and jump buffering
      // Coyote time: can still ground-jump briefly after walking off edge
      // Jump buffer: pressing jump slightly before landing queues the jump
      const canCoyoteJump = this.coyoteTimer > 0;
      const hasBufferedJump = this.jumpBufferTimer > 0;

      if ((input.jump || hasBufferedJump) && (this.isGrounded || canCoyoteJump) && !this.isStuck) {
        this.velocityY = -PLAYER.JUMP_FORCE;
        this.isGrounded = false;
        this.airJumpsRemaining = 4; // Reset air jumps on ground jump
        this.coyoteTimer = 0; // Consume coyote time
        this.jumpBufferTimer = 0; // Consume jump buffer
      } else if (input.jumpPressed && !this.isGrounded && this.coyoteTimer <= 0 && this.airJumpsRemaining > 0 && allowAirJumps) {
        // Air jumps (5 total jumps: 1 ground + 4 air)
        // Disabled when "Grounded" modifier is active
        // Jump 2 (airJumpsRemaining=4): normal double jump (1.275x)
        // Jump 3 (airJumpsRemaining=3): weaker triple jump (0.7x)
        // Jump 4 (airJumpsRemaining=2): higher jump (1.5x)
        // Jump 5 (airJumpsRemaining=1): forward dash
        let jumpMultiplier: number;
        if (this.airJumpsRemaining === 4) {
          jumpMultiplier = 1.275; // 2nd jump - normal double jump
        } else if (this.airJumpsRemaining === 3) {
          jumpMultiplier = 0.7; // 3rd jump - weaker
        } else if (this.airJumpsRemaining === 2) {
          jumpMultiplier = 1.5; // 4th jump - higher
        } else {
          jumpMultiplier = 0.5; // 5th jump - minimal vertical, forward dash instead
        }
        this.velocityY = -PLAYER.JUMP_FORCE * jumpMultiplier;

        // 5th jump (last air jump) triggers forward dash
        if (this.airJumpsRemaining === 1) {
          this.isDashing = true;
          this.dashTimer = Player.DASH_DURATION;
        }

        this.airJumpsRemaining--;
      }

      // Wall jump - can jump off walls even without air jumps (use previous frame's state)
      if (input.jumpPressed && wasWallSliding && this.wallJumpCooldown <= 0) {
        this.velocityY = -PLAYER.JUMP_FORCE * 0.9;
        this.wallJumpCooldown = Player.WALL_JUMP_COOLDOWN;
        this.isWallSliding = false;
        // Reset air jumps on wall jump
        this.airJumpsRemaining = Math.max(this.airJumpsRemaining, 1);
      }

      // Apply gravity (flipped if on gravity platform)
      // Slow-mo zones reduce gravity effect
      const slowMoMult = this.isInSlowMo ? 0.4 : 1;
      const gravityDir = this.gravityFlipped ? -1 : 1;
      this.velocityY += PLAYER.GRAVITY * gravityDir * slowMoMult * (deltaTime / 1000);
    }

    // Clamp fall speed (wall sliding reduces it further)
    const maxFall = this.isWallSliding ? Player.WALL_SLIDE_SPEED : PLAYER.MAX_FALL_SPEED;
    if (this.gravityFlipped) {
      // When gravity is flipped, falling is negative velocityY
      if (this.velocityY < -maxFall) {
        this.velocityY = -maxFall;
      }
    } else {
      if (this.velocityY > maxFall) {
        this.velocityY = maxFall;
      }
    }

    // Apply vertical velocity
    this.y += this.velocityY * (deltaTime / 1000);

    // Handle rotation
    if (this.flyingMode) {
      // In flying mode, tilt based on velocity (like a plane)
      const targetTilt = (this.velocityY / 400) * 30; // Max 30 degrees tilt
      this.rotation += (targetTilt - this.rotation) * 0.1; // Smooth interpolation
    } else if (!this.isGrounded) {
      // Normal mode: spin in air like Geometry Dash
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

    // Reset gravity flip when landing on solid ground (not a gravity platform)
    // Gravity flip persists in the air and resets on the next solid landing
    if (this.isGrounded && this.gravityFlipped) {
      this.gravityFlipped = false;
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
            this.bounceEvent = { x: bounds.x, y: bounds.y, width: bounds.width };
            continue;  // Skip edge bounce handling for top collision
          }
          break;  // Allow side collisions to fall through to edge bounce handling

        case 'glass':
          if (collision === 'top') {
            platform.onGlassLanding();
          }
          break;

        case 'crumble':
          if (collision === 'top') {
            platform.startCrumble();
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
            // Always launch upward (away from platform) regardless of flip state
            this.velocityY = -PLAYER.JUMP_FORCE;
            this.y = bounds.y - this.height;
            this.gravityFlipEvent = { x: this.x + this.width / 2, y: this.y + this.height / 2, flipped: this.gravityFlipped };
            continue;  // Skip edge bounce handling for top collision
          }
          break;  // Allow side collisions to fall through to edge bounce handling

        case 'wall':
          // Wall platforms allow wall sliding instead of death on side collision
          if (collision === 'left' || collision === 'right') {
            this.isWallSliding = true;
            // Stop horizontal movement into wall but allow sliding down
            if (collision === 'left') {
              this.x = bounds.x - this.width;
              this.wallSlideEvent = { x: this.x + this.width, y: this.y + this.height / 2, side: 'left' };
            } else {
              this.x = bounds.x + bounds.width;
              this.wallSlideEvent = { x: this.x, y: this.y + this.height / 2, side: 'right' };
            }
            continue;  // Skip edge bounce only for side collisions
          }
          break;  // Allow top/bottom collisions to resolve normally

        case 'slowmo':
          // Slow-mo zones affect player regardless of collision direction
          this.isInSlowMo = true;
          // Don't resolve collision - it's a zone, not solid
          continue;

        case 'secret':
          // Secret platforms check reveal distance (handled elsewhere)
          // Once revealed, they behave like solid platforms
          break;
      }

      // Edge bounce: if hitting side but at least 25% of player body is above platform edge,
      // trigger boomerang bounce - player swings back then forward like a boomerang
      if (collision === 'left') {
        const playerTop = this.y;
        const platformTop = bounds.y;
        const overlapAbove = platformTop - playerTop; // How much of player is above platform

        // If at least 25% of player height is above platform top, trigger boomerang bounce
        if (overlapAbove >= this.height * 0.25) {
          // Push away from the platform edge (back to the left)
          this.x = bounds.x - this.width - 5;
          // Give strong upward velocity - arcs up dramatically
          this.velocityY = -PLAYER.JUMP_FORCE * 1.1;
          // Trigger boomerang effect - player swings backwards then forwards
          this.boomerangVelocityX = Player.BOOMERANG_INITIAL_VELOCITY;
          this.boomerangActive = true;
          this.boomerangTimer = 0;
          this.isInRescueWindow = true;
          this.rescueDashTriggered = false;
          // Reset all jumps - give player full air jumps to recover
          this.airJumpsRemaining = 4;
          // Emit edge bounce event for visual feedback
          this.edgeBounceEvent = { x: bounds.x, y: bounds.y, direction: 'left' };
          continue;
        }

        // Otherwise it's a real side collision = death
        this.isDead = true;
        return;
      }

      if (collision === 'right') {
        const playerTop = this.y;
        const platformTop = bounds.y;
        const overlapAbove = platformTop - playerTop;

        if (overlapAbove >= this.height * 0.25) {
          // Push away from the platform edge (back to the right)
          this.x = bounds.x + bounds.width + 5;
          // Give strong upward velocity - arcs up dramatically
          this.velocityY = -PLAYER.JUMP_FORCE * 1.1;
          // Trigger boomerang effect - player swings backwards then forwards
          this.boomerangVelocityX = Player.BOOMERANG_INITIAL_VELOCITY;
          this.boomerangActive = true;
          this.boomerangTimer = 0;
          this.isInRescueWindow = true;
          this.rescueDashTriggered = false;
          // Reset all jumps - give player full air jumps to recover
          this.airJumpsRemaining = 4;
          // Emit edge bounce event for visual feedback
          this.edgeBounceEvent = { x: bounds.x + bounds.width, y: bounds.y, direction: 'right' };
          continue;
        }

        // Otherwise it's a real side collision = death
        this.isDead = true;
        return;
      }

      // Resolve collision
      this.resolveCollision(platform, collision);
    }

    // Reset rotation target when first landing and emit landing event
    if (!wasGrounded && this.isGrounded) {
      this.targetRotation = Math.round(this.rotation / 90) * 90;
      this.landingEvent = true;
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
        this.airJumpsRemaining = 4; // Reset air jumps on landing
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

  getRotation(): number {
    return this.rotation;
  }

  getIsWallSliding(): boolean {
    return this.isWallSliding;
  }

  getAirJumpsRemaining(): number {
    return this.airJumpsRemaining;
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
      // Handle both 3-char (#fff) and 6-char (#ffffff) hex colors
      let r: number, g: number, b: number;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
      // Guard against NaN from malformed hex
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return `rgba(255, 255, 255, ${alpha})`; // Fallback to white
      }
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
