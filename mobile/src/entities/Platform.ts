import { PlatformConfig, PlatformType, MovePattern, Rectangle } from '../types';
import { COLORS, PLATFORM } from '../constants';

export class Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  movePattern?: MovePattern;
  conveyorSpeed: number;

  private startX: number;
  private startY: number;
  private moveTime = 0;

  // Crumble state
  private crumbleTimer = 0;
  private isCrumbling = false;
  crumbleProgress = 0;
  isDestroyed = false;

  // Phase state
  private phaseTimer = 0;
  isPhased = false;

  // Glass state
  glassHits = 0;
  private readonly glassMaxHits = 3;
  isGlassBroken = false;

  // Secret state
  isRevealed = false;

  // Lava state
  private lavaTimer = 0;
  lavaPulse = 0;

  constructor(config: PlatformConfig) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.type = config.type;
    this.movePattern = config.movePattern;
    this.conveyorSpeed = config.conveyorSpeed || 0;

    this.startX = config.x;
    this.startY = config.y;

    if (config.movePattern?.startOffset) {
      this.moveTime = config.movePattern.startOffset;
    }

    if (config.phaseOffset) {
      this.phaseTimer = config.phaseOffset;
    }
  }

  update(deltaTime: number): void {
    if (this.isDestroyed || this.isGlassBroken) return;

    // Handle movement
    if (this.movePattern) {
      this.updateMovement(deltaTime);
    }

    // Handle crumbling
    if (this.type === 'crumble' && this.isCrumbling) {
      this.crumbleTimer += deltaTime;
      if (this.crumbleTimer >= PLATFORM.CRUMBLE_DELAY) {
        this.crumbleProgress = Math.min(
          1,
          (this.crumbleTimer - PLATFORM.CRUMBLE_DELAY) / PLATFORM.CRUMBLE_DURATION
        );
        if (this.crumbleProgress >= 1) {
          this.isDestroyed = true;
        }
      }
    }

    // Handle phasing
    if (this.type === 'phase') {
      this.phaseTimer += deltaTime;
      const cycleTime = PLATFORM.PHASE_ON_TIME + PLATFORM.PHASE_OFF_TIME;
      const cyclePosition = this.phaseTimer % cycleTime;
      this.isPhased = cyclePosition > PLATFORM.PHASE_ON_TIME;
    }

    // Handle lava pulse
    if (this.type === 'lava') {
      this.lavaTimer += deltaTime;
      this.lavaPulse = Math.sin(this.lavaTimer * 0.005) * 0.3 + 0.7;
    }
  }

  private updateMovement(deltaTime: number): void {
    if (!this.movePattern) return;

    this.moveTime += deltaTime * 0.001 * this.movePattern.speed;

    switch (this.movePattern.type) {
      case 'horizontal':
        this.x = this.startX + Math.sin(this.moveTime) * this.movePattern.distance;
        break;
      case 'vertical':
        this.y = this.startY + Math.sin(this.moveTime) * this.movePattern.distance;
        break;
      case 'circular':
        this.x = this.startX + Math.cos(this.moveTime) * this.movePattern.distance;
        this.y = this.startY + Math.sin(this.moveTime) * this.movePattern.distance;
        break;
    }
  }

  startCrumble(): void {
    if (this.type === 'crumble' && !this.isCrumbling) {
      this.isCrumbling = true;
    }
  }

  hitGlass(): boolean {
    if (this.type === 'glass') {
      this.glassHits++;
      if (this.glassHits >= this.glassMaxHits) {
        this.isGlassBroken = true;
        return true; // Glass broke
      }
    }
    return false;
  }

  reveal(): void {
    if (this.type === 'secret') {
      this.isRevealed = true;
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

  getStableKey(): string {
    return `${this.startX}-${this.startY}-${this.type}-${this.width}`;
  }

  isCollidable(): boolean {
    if (this.isDestroyed || this.isGlassBroken) return false;
    if (this.isPhased) return false;
    if (this.type === 'secret' && !this.isRevealed) return false;
    return true;
  }

  getColor(): string {
    const colorMap: Record<string, string> = {
      solid: COLORS.PLATFORM.solid,
      bounce: COLORS.PLATFORM.bounce,
      crumble: COLORS.PLATFORM.crumble,
      moving: COLORS.PLATFORM.moving,
      spike: COLORS.PLATFORM.spike,
      phase: COLORS.PLATFORM.phase,
      conveyor: COLORS.PLATFORM.conveyor,
      gravity: COLORS.PLATFORM.gravity,
      sticky: COLORS.PLATFORM.sticky,
      glass: COLORS.PLATFORM.glass,
      slowmo: COLORS.PLATFORM.slowmo,
      wall: COLORS.PLATFORM.wall,
      secret: COLORS.PLATFORM.secret,
      ice: COLORS.PLATFORM.ice,
      lava: COLORS.PLATFORM.lava,
    };
    return colorMap[this.type] || COLORS.PLATFORM.solid;
  }

  getHighlightColor(): string {
    const highlights: Record<string, string> = {
      solid: COLORS.PLATFORM.solidHighlight,
      bounce: COLORS.PLATFORM.bounceHighlight,
      conveyor: COLORS.PLATFORM.conveyorHighlight,
      gravity: COLORS.PLATFORM.gravityHighlight,
      sticky: COLORS.PLATFORM.stickyHighlight,
      glass: COLORS.PLATFORM.glassHighlight,
      slowmo: COLORS.PLATFORM.slowmoHighlight,
      wall: COLORS.PLATFORM.wallHighlight,
      secret: COLORS.PLATFORM.secretHighlight,
      ice: COLORS.PLATFORM.iceHighlight,
      lava: COLORS.PLATFORM.lavaHighlight,
    };
    return highlights[this.type] || this.getColor();
  }
}
