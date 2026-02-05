// Gradient and Pattern caching for improved rendering performance
// Caches commonly used gradients and patterns to avoid recreation every frame

export interface GradientConfig {
  type: 'linear' | 'radial';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  r0?: number;
  r1?: number;
  stops: Array<{ offset: number; color: string }>;
}

export class GradientCache {
  private static instance: GradientCache;
  private cache: Map<string, CanvasGradient> = new Map();
  private ctx: CanvasRenderingContext2D | null = null;
  private maxCacheSize = 100;

  private constructor() {}

  static getInstance(): GradientCache {
    if (!GradientCache.instance) {
      GradientCache.instance = new GradientCache();
    }
    return GradientCache.instance;
  }

  // Set the rendering context (call once when canvas is ready)
  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
    // Clear cache when context changes (e.g., canvas resize)
    this.cache.clear();
  }

  // Generate a cache key from gradient config
  private getKey(config: GradientConfig): string {
    return JSON.stringify(config);
  }

  // Get or create a linear gradient
  getLinearGradient(
    x0: number, y0: number, x1: number, y1: number,
    stops: Array<{ offset: number; color: string }>
  ): CanvasGradient | null {
    if (!this.ctx) return null;

    const config: GradientConfig = { type: 'linear', x0, y0, x1, y1, stops };
    const key = this.getKey(config);

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Create new gradient
    const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
    for (const stop of stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }

    // Cache it
    this.addToCache(key, gradient);
    return gradient;
  }

  // Get or create a radial gradient
  getRadialGradient(
    x0: number, y0: number, r0: number,
    x1: number, y1: number, r1: number,
    stops: Array<{ offset: number; color: string }>
  ): CanvasGradient | null {
    if (!this.ctx) return null;

    const config: GradientConfig = { type: 'radial', x0, y0, x1, y1, r0, r1, stops };
    const key = this.getKey(config);

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Create new gradient
    const gradient = this.ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for (const stop of stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }

    // Cache it
    this.addToCache(key, gradient);
    return gradient;
  }

  // Common platform gradients (pre-defined for performance)
  getPlatformGradient(type: string, x: number, y: number, width: number, height: number): CanvasGradient | null {
    if (!this.ctx) return null;

    // Round to reduce cache fragmentation (slight positioning differences create many keys)
    const rx = Math.round(x / 10) * 10;
    const ry = Math.round(y / 10) * 10;
    const rh = Math.round(height / 5) * 5;

    const key = `platform_${type}_${rx}_${ry}_${rh}`;

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Create gradient based on platform type
    const gradient = this.ctx.createLinearGradient(x, y, x, y + height);

    switch (type) {
      case 'solid':
        gradient.addColorStop(0, '#4a5568');
        gradient.addColorStop(1, '#2d3748');
        break;
      case 'bounce':
        gradient.addColorStop(0, '#68d391');
        gradient.addColorStop(1, '#38a169');
        break;
      case 'crumble':
        gradient.addColorStop(0, '#fc8181');
        gradient.addColorStop(1, '#c53030');
        break;
      case 'ice':
        gradient.addColorStop(0, '#90cdf4');
        gradient.addColorStop(1, '#63b3ed');
        break;
      case 'lava':
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff2200');
        break;
      default:
        gradient.addColorStop(0, '#4a5568');
        gradient.addColorStop(1, '#2d3748');
    }

    this.addToCache(key, gradient);
    return gradient;
  }

  private addToCache(key: string, gradient: CanvasGradient): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, gradient);
  }

  // Clear all cached gradients
  clear(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }
}

// Pre-computed color values for common operations
export const CACHED_COLORS = {
  // Platform colors as pre-parsed RGB
  solid: { r: 74, g: 85, b: 104 },
  bounce: { r: 104, g: 211, b: 145 },
  crumble: { r: 252, g: 129, b: 129 },
  ice: { r: 144, g: 205, b: 244 },
  lava: { r: 255, g: 68, b: 68 },

  // Common effect colors
  glow: { r: 0, g: 255, b: 170 },
  coin: { r: 255, g: 215, b: 0 },
  death: { r: 255, g: 50, b: 50 },
  powerUp: { r: 0, g: 255, b: 255 },

  // UI colors
  text: { r: 255, g: 255, b: 255 },
  shadow: { r: 0, g: 0, b: 0 }
};

// Helper to create rgba string from cached color
export function rgba(color: { r: number; g: number; b: number }, alpha: number): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

// Singleton export
export const gradientCache = GradientCache.getInstance();
