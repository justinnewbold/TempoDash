// Performance management system for adaptive quality and optimization
// Handles framerate monitoring, quality scaling, and progressive enhancement

import { ParticleQuality, FramerateCap } from '../types';

export interface PerformanceSettings {
  particleQuality: ParticleQuality;
  shadowQuality: 'high' | 'low' | 'off';
  backgroundEffects: boolean;
  framerateCap: FramerateCap;
}

export interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  frameTime: number;
  avgFrameTime: number;
  droppedFrames: number;
}

// Particle multipliers based on quality setting
export const PARTICLE_MULTIPLIERS: Record<ParticleQuality, number> = {
  high: 1.0,
  medium: 0.5,
  low: 0.25
};

// Shadow blur values based on quality setting
export const SHADOW_BLUR_VALUES: Record<'high' | 'low' | 'off', number> = {
  high: 10,
  low: 4,
  off: 0
};

export class PerformanceManager {
  private static instance: PerformanceManager;

  // Current settings
  private settings: PerformanceSettings = {
    particleQuality: 'high',
    shadowQuality: 'high',
    backgroundEffects: true,
    framerateCap: 60
  };

  // FPS tracking
  private frameTimestamps: number[] = [];
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private droppedFrames = 0;
  private readonly FPS_SAMPLE_SIZE = 60;

  // Progressive enhancement
  private autoAdjustEnabled = true;
  private qualityCheckInterval = 2000; // Check every 2 seconds
  private lastQualityCheck = 0;
  private targetFps = 55; // Target slightly below cap to prevent jitter
  private consecutiveLowFpsFrames = 0;
  private consecutiveHighFpsFrames = 0;

  // Frame limiting
  private frameInterval = 1000 / 60; // Default 60fps
  private lastRenderTime = 0;

  private constructor() {
    this.updateFrameInterval();
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  // Update settings
  setSettings(settings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.updateFrameInterval();
  }

  getSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  private updateFrameInterval(): void {
    if (this.settings.framerateCap === 0) {
      this.frameInterval = 0; // Unlimited
      this.targetFps = 120;
    } else {
      this.frameInterval = 1000 / this.settings.framerateCap;
      this.targetFps = this.settings.framerateCap - 5;
    }
  }

  // Check if enough time has passed for next frame (for frame limiting)
  shouldRenderFrame(currentTime: number): boolean {
    if (this.frameInterval === 0) return true;
    
    if (currentTime - this.lastRenderTime >= this.frameInterval) {
      this.lastRenderTime = currentTime;
      return true;
    }
    return false;
  }

  // Record frame timing for FPS calculation
  recordFrame(timestamp: number): void {
    const now = timestamp || performance.now();
    
    // Track frame time
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.frameTimes.push(frameTime);
      if (this.frameTimes.length > this.FPS_SAMPLE_SIZE) {
        this.frameTimes.shift();
      }

      // Detect dropped frames (frame took > 2x expected time)
      const expectedFrameTime = this.frameInterval || (1000 / 60);
      if (frameTime > expectedFrameTime * 2) {
        this.droppedFrames++;
      }
    }
    
    this.frameTimestamps.push(now);
    if (this.frameTimestamps.length > this.FPS_SAMPLE_SIZE) {
      this.frameTimestamps.shift();
    }
    
    this.lastFrameTime = now;

    // Progressive enhancement check
    if (this.autoAdjustEnabled && now - this.lastQualityCheck > this.qualityCheckInterval) {
      this.checkAndAdjustQuality();
      this.lastQualityCheck = now;
    }
  }

  // Get current FPS
  getFps(): number {
    if (this.frameTimestamps.length < 2) return 60;
    const duration = this.frameTimestamps[this.frameTimestamps.length - 1] - this.frameTimestamps[0];
    return Math.round((this.frameTimestamps.length - 1) / (duration / 1000));
  }

  // Get average frame time
  getAvgFrameTime(): number {
    if (this.frameTimes.length === 0) return 16.67;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.getFps(),
      avgFps: this.getFps(),
      frameTime: this.frameTimes[this.frameTimes.length - 1] || 16.67,
      avgFrameTime: this.getAvgFrameTime(),
      droppedFrames: this.droppedFrames
    };
  }

  // Progressive enhancement - auto-adjust quality based on performance
  private checkAndAdjustQuality(): void {
    const currentFps = this.getFps();
    
    if (currentFps < this.targetFps - 10) {
      this.consecutiveLowFpsFrames++;
      this.consecutiveHighFpsFrames = 0;
      
      // Reduce quality after sustained low FPS
      if (this.consecutiveLowFpsFrames >= 3) {
        this.reduceQuality();
        this.consecutiveLowFpsFrames = 0;
      }
    } else if (currentFps > this.targetFps + 5) {
      this.consecutiveHighFpsFrames++;
      this.consecutiveLowFpsFrames = 0;
      
      // Increase quality after sustained high FPS
      if (this.consecutiveHighFpsFrames >= 5) {
        this.increaseQuality();
        this.consecutiveHighFpsFrames = 0;
      }
    } else {
      // Reset counters when FPS is stable
      this.consecutiveLowFpsFrames = 0;
      this.consecutiveHighFpsFrames = 0;
    }
  }

  private reduceQuality(): void {
    // Priority: shadows -> particles -> background
    if (this.settings.shadowQuality === 'high') {
      this.settings.shadowQuality = 'low';
    } else if (this.settings.shadowQuality === 'low') {
      this.settings.shadowQuality = 'off';
    } else if (this.settings.particleQuality === 'high') {
      this.settings.particleQuality = 'medium';
    } else if (this.settings.particleQuality === 'medium') {
      this.settings.particleQuality = 'low';
    } else if (this.settings.backgroundEffects) {
      this.settings.backgroundEffects = false;
    }
  }

  private increaseQuality(): void {
    // Priority: background -> particles -> shadows
    if (!this.settings.backgroundEffects) {
      this.settings.backgroundEffects = true;
    } else if (this.settings.particleQuality === 'low') {
      this.settings.particleQuality = 'medium';
    } else if (this.settings.particleQuality === 'medium') {
      this.settings.particleQuality = 'high';
    } else if (this.settings.shadowQuality === 'off') {
      this.settings.shadowQuality = 'low';
    } else if (this.settings.shadowQuality === 'low') {
      this.settings.shadowQuality = 'high';
    }
  }

  // Get particle count multiplier based on current quality
  getParticleMultiplier(): number {
    return PARTICLE_MULTIPLIERS[this.settings.particleQuality];
  }

  // Get shadow blur value based on current quality
  getShadowBlur(): number {
    return SHADOW_BLUR_VALUES[this.settings.shadowQuality];
  }

  // Check if background effects should render
  shouldRenderBackgroundEffects(): boolean {
    return this.settings.backgroundEffects;
  }

  // Enable/disable auto quality adjustment
  setAutoAdjust(enabled: boolean): void {
    this.autoAdjustEnabled = enabled;
  }

  // Reset dropped frames counter
  resetDroppedFrames(): void {
    this.droppedFrames = 0;
  }
}

// Export singleton instance
export const performanceManager = PerformanceManager.getInstance();
