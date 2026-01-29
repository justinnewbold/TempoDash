import { PowerUpConfig, PowerUpType, Rectangle } from '../types';
import { POWERUP } from '../constants';

export class PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  collected = false;
  readonly size = POWERUP.SIZE;
  private animationTime = 0;
  collectAnimation = 0;

  constructor(config: PowerUpConfig) {
    this.x = config.x;
    this.y = config.y;
    this.type = config.type;
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    if (this.collected && this.collectAnimation < 1) {
      this.collectAnimation += deltaTime / 200;
    }
  }

  collect(): void {
    if (!this.collected) {
      this.collected = true;
      this.collectAnimation = 0;
    }
  }

  getBounds(): Rectangle {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size,
    };
  }

  checkCollision(playerBounds: Rectangle): boolean {
    if (this.collected) return false;

    const bounds = this.getBounds();
    return (
      playerBounds.x < bounds.x + bounds.width &&
      playerBounds.x + playerBounds.width > bounds.x &&
      playerBounds.y < bounds.y + bounds.height &&
      playerBounds.y + playerBounds.height > bounds.y
    );
  }

  getFloatOffset(): number {
    return Math.sin(this.animationTime * 0.003) * 8;
  }

  getPulse(): number {
    return Math.sin(this.animationTime * 0.005) * 0.2 + 1.0;
  }

  getStableKey(): string {
    return `powerup-${this.x}-${this.y}-${this.type}`;
  }

  getDuration(): number {
    switch (this.type) {
      case 'shield': return POWERUP.SHIELD_DURATION;
      case 'magnet': return POWERUP.MAGNET_DURATION;
      case 'slowmo': return POWERUP.SLOWMO_DURATION;
      case 'doublePoints': return POWERUP.DOUBLE_POINTS_DURATION;
    }
  }

  getColor(): string {
    const colors: Record<PowerUpType, string> = {
      shield: '#2196f3',
      magnet: '#e91e63',
      slowmo: '#9c27b0',
      doublePoints: '#ff9800',
    };
    return colors[this.type];
  }

  getIcon(): string {
    const icons: Record<PowerUpType, string> = {
      shield: 'S',
      magnet: 'M',
      slowmo: 'T',
      doublePoints: '2x',
    };
    return icons[this.type];
  }
}
