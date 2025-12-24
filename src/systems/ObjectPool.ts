// Generic object pooling system for performance optimization
// Pre-allocates objects to avoid garbage collection during gameplay

export interface Poolable {
  active: boolean;
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private activeCount = 0;
  private factory: () => T;
  private initialSize: number;
  private maxSize: number;

  constructor(factory: () => T, initialSize: number = 50, maxSize: number = 200) {
    this.factory = factory;
    this.initialSize = initialSize;
    this.maxSize = maxSize;
    this.preallocate();
  }

  private preallocate(): void {
    for (let i = 0; i < this.initialSize; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  acquire(): T | null {
    // Find an inactive object
    for (const obj of this.pool) {
      if (!obj.active) {
        obj.active = true;
        obj.reset();
        this.activeCount++;
        return obj;
      }
    }

    // If no inactive object and we can grow, create a new one
    if (this.pool.length < this.maxSize) {
      const obj = this.factory();
      obj.active = true;
      obj.reset();
      this.pool.push(obj);
      this.activeCount++;
      return obj;
    }

    // Pool exhausted
    return null;
  }

  release(obj: T): void {
    if (obj.active) {
      obj.active = false;
      this.activeCount--;
    }
  }

  releaseAll(): void {
    for (const obj of this.pool) {
      obj.active = false;
    }
    this.activeCount = 0;
  }

  forEach(callback: (obj: T) => void): void {
    for (const obj of this.pool) {
      if (obj.active) {
        callback(obj);
      }
    }
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getTotalCount(): number {
    return this.pool.length;
  }

  // Get all active objects (for iteration)
  *activeObjects(): Generator<T> {
    for (const obj of this.pool) {
      if (obj.active) {
        yield obj;
      }
    }
  }
}

// Death/explosion particle for visual effects
export interface DeathParticle extends Poolable {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  lifetime: number;
  maxLifetime: number;
  active: boolean;
  reset(): void;
}

export function createDeathParticle(): DeathParticle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 5,
    alpha: 1,
    color: '#00ffaa',
    rotation: 0,
    rotationSpeed: 0,
    lifetime: 0,
    maxLifetime: 1000,
    active: false,
    reset() {
      this.lifetime = 0;
      this.alpha = 1;
    }
  };
}

// Coin collect particle
export interface CoinParticle extends Poolable {
  x: number;
  y: number;
  vy: number;
  alpha: number;
  scale: number;
  lifetime: number;
  active: boolean;
  reset(): void;
}

export function createCoinParticle(): CoinParticle {
  return {
    x: 0,
    y: 0,
    vy: -100,
    alpha: 1,
    scale: 1,
    lifetime: 0,
    active: false,
    reset() {
      this.lifetime = 0;
      this.alpha = 1;
      this.scale = 1;
      this.vy = -100;
    }
  };
}

// Floating text (score popups, combo text)
export interface FloatingText extends Poolable {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  alpha: number;
  vy: number;
  lifetime: number;
  maxLifetime: number;
  active: boolean;
  reset(): void;
}

export function createFloatingText(): FloatingText {
  return {
    x: 0,
    y: 0,
    text: '',
    color: '#ffffff',
    fontSize: 20,
    alpha: 1,
    vy: -50,
    lifetime: 0,
    maxLifetime: 1000,
    active: false,
    reset() {
      this.lifetime = 0;
      this.alpha = 1;
    }
  };
}
