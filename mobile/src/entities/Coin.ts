import { CoinConfig, Rectangle } from '../types';

export class Coin {
  x: number;
  y: number;
  readonly size = 28;
  collected = false;
  private animationTime = 0;
  collectAnimation = 0;

  constructor(config: CoinConfig) {
    this.x = config.x;
    this.y = config.y;
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    if (this.collected && this.collectAnimation < 1) {
      this.collectAnimation += deltaTime / 180;
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

    const coinBounds = this.getBounds();
    return (
      playerBounds.x < coinBounds.x + coinBounds.width &&
      playerBounds.x + playerBounds.width > coinBounds.x &&
      playerBounds.y < coinBounds.y + coinBounds.height &&
      playerBounds.y + playerBounds.height > coinBounds.y
    );
  }

  // Get floating offset for animation
  getFloatOffset(): number {
    return Math.sin(this.animationTime * 0.004) * 5;
  }

  // Get rotation for animation
  getRotation(): number {
    return Math.sin(this.animationTime * 0.003) * 0.2;
  }

  // Get stable key for React rendering
  getStableKey(): string {
    return `${this.x}-${this.y}`;
  }
}
