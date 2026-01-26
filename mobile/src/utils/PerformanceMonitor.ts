/**
 * Performance Monitor - Diagnostic tool for game performance
 * Tracks FPS, frame times, and identifies bottlenecks
 */

interface PerformanceStats {
  fps: number;
  avgFrameTime: number;
  maxFrameTime: number;
  dropped: number;
  updateTime: number;
  renderTime: number;
}

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private droppedFrames = 0;
  private updateTimes: number[] = [];
  private renderTimes: number[] = [];
  private isLogging = false;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.frameTimes = [];
    this.lastFrameTime = Date.now();
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.updateTimes = [];
    this.renderTimes = [];
  }

  startFrame(): void {
    const now = Date.now();
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.frameTimes.push(frameTime);

      // Keep only last 60 frames
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
      }

      // Detect dropped frames (>20ms = dropped frame at 60fps)
      if (frameTime > 20) {
        this.droppedFrames++;
      }
    }
    this.lastFrameTime = now;
    this.frameCount++;
  }

  recordUpdateTime(time: number): void {
    this.updateTimes.push(time);
    if (this.updateTimes.length > 60) {
      this.updateTimes.shift();
    }
  }

  recordRenderTime(time: number): void {
    this.renderTimes.push(time);
    if (this.renderTimes.length > 60) {
      this.renderTimes.shift();
    }
  }

  getStats(): PerformanceStats {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;

    const maxFrameTime = this.frameTimes.length > 0
      ? Math.max(...this.frameTimes)
      : 0;

    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;

    const avgUpdateTime = this.updateTimes.length > 0
      ? this.updateTimes.reduce((a, b) => a + b, 0) / this.updateTimes.length
      : 0;

    const avgRenderTime = this.renderTimes.length > 0
      ? this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length
      : 0;

    return {
      fps: Math.round(fps),
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      maxFrameTime: Math.round(maxFrameTime * 100) / 100,
      dropped: this.droppedFrames,
      updateTime: Math.round(avgUpdateTime * 100) / 100,
      renderTime: Math.round(avgRenderTime * 100) / 100,
    };
  }

  enableLogging(): void {
    this.isLogging = true;
  }

  disableLogging(): void {
    this.isLogging = false;
  }

  logStats(): void {
    if (!this.isLogging) return;

    const stats = this.getStats();
    console.log('=== PERFORMANCE STATS ===');
    console.log(`FPS: ${stats.fps}`);
    console.log(`Avg Frame Time: ${stats.avgFrameTime}ms`);
    console.log(`Max Frame Time: ${stats.maxFrameTime}ms`);
    console.log(`Dropped Frames: ${stats.dropped}`);
    console.log(`Avg Update Time: ${stats.updateTime}ms`);
    console.log(`Avg Render Time: ${stats.renderTime}ms`);

    // Warnings
    if (stats.fps < 30) {
      console.warn('⚠️ CRITICAL: FPS below 30!');
    } else if (stats.fps < 50) {
      console.warn('⚠️ WARNING: FPS below 50');
    }

    if (stats.avgFrameTime > 16.67) {
      console.warn('⚠️ WARNING: Frame time exceeds 16.67ms (60fps target)');
    }

    if (stats.updateTime > 10) {
      console.warn('⚠️ BOTTLENECK: Update logic is taking too long');
    }

    if (stats.renderTime > 10) {
      console.warn('⚠️ BOTTLENECK: Render logic is taking too long');
    }

    console.log('========================\n');
  }

  // Log stats every second
  startPeriodicLogging(intervalMs = 1000): NodeJS.Timeout {
    this.enableLogging();
    return setInterval(() => this.logStats(), intervalMs);
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();
