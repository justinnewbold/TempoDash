import { PlatformConfig, PlatformType, MovePattern, Rectangle } from '../types';
import { COLORS, PLATFORM } from '../constants';

export class Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  movePattern?: MovePattern;

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

  constructor(config: PlatformConfig) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.type = config.type;
    this.movePattern = config.movePattern;

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
    if (this.isDestroyed) return;

    // Handle movement
    if (this.movePattern && this.type === 'moving') {
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

  getBounds(): Rectangle {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  // Get stable position for use in React keys
  getStableKey(): string {
    return `${this.startX}-${this.startY}-${this.type}-${this.width}`;
  }

  isCollidable(): boolean {
    return !this.isDestroyed && !this.isPhased;
  }

  // Get the color for this platform type
  getColor(): string {
    return COLORS.PLATFORM[this.type] || COLORS.PLATFORM.solid;
  }

  getHighlightColor(): string {
    const highlights: Record<string, string> = {
      solid: COLORS.PLATFORM.solidHighlight,
      bounce: COLORS.PLATFORM.bounceHighlight,
    };
    return highlights[this.type] || this.getColor();
  }
}
