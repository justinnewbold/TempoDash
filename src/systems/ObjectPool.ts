// Generic object pooling system for performance optimization
// Pre-allocates objects to avoid garbage collection during gameplay
// Uses free list for O(1) acquire/release operations

export interface Poolable {
  active: boolean;
  _poolIndex: number; // Internal index for O(1) operations
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private freeList: number[] = []; // Stack of free indices for O(1) acquire
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
      obj._poolIndex = i;
      this.pool.push(obj);
      this.freeList.push(i); // All objects start free
    }
  }

  acquire(): T | null {
    // O(1) acquire from free list
    if (this.freeList.length > 0) {
      const index = this.freeList.pop()!;
      const obj = this.pool[index];
      obj.active = true;
      obj.reset();
      this.activeCount++;
      return obj;
    }

    // If no free object and we can grow, create a new one
    if (this.pool.length < this.maxSize) {
      const obj = this.factory();
      obj.active = true;
      obj._poolIndex = this.pool.length;
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
      this.freeList.push(obj._poolIndex); // O(1) return to free list
      this.activeCount--;
    }
  }

  releaseAll(): void {
    this.freeList.length = 0; // Clear free list
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
      this.freeList.push(i);
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

  getFreeCount(): number {
    return this.freeList.length;
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
    _poolIndex: 0,
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
    _poolIndex: 0,
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
    _poolIndex: 0,
    reset() {
      this.lifetime = 0;
      this.alpha = 1;
    }
  };
}

// Trail particle (follows player movement)
export interface TrailParticle extends Poolable {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export function createTrailParticle(): TrailParticle {
  return {
    x: 0,
    y: 0,
    size: 10,
    alpha: 0.5,
    color: '#00ffaa',
    lifetime: 0,
    maxLifetime: 300,
    active: false,
    _poolIndex: 0,
    reset() {
      this.lifetime = 0;
      this.alpha = 0.5;
    }
  };
}

// Dust particle (for landings and jumps)
export interface DustParticle extends Poolable {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  lifetime: number;
}

export function createDustParticle(): DustParticle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 4,
    alpha: 0.6,
    lifetime: 0,
    active: false,
    _poolIndex: 0,
    reset() {
      this.lifetime = 0;
      this.alpha = 0.6;
    }
  };
}

// Burst particle (for edge bounce, bounce platforms, power-ups)
export interface BurstParticle extends Poolable {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export function createBurstParticle(): BurstParticle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 6,
    alpha: 1,
    color: '#ffff00',
    lifetime: 0,
    maxLifetime: 300,
    active: false,
    _poolIndex: 0,
    reset() {
      this.lifetime = 0;
      this.alpha = 1;
    }
  };
}

// Spark particle (for wall slides, friction effects)
export interface SparkParticle extends Poolable {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  lifetime: number;
}

export function createSparkParticle(): SparkParticle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 2,
    alpha: 1,
    color: '#ffaa00',
    lifetime: 0,
    active: false,
    _poolIndex: 0,
    reset() {
      this.lifetime = 0;
      this.alpha = 1;
    }
  };
}
