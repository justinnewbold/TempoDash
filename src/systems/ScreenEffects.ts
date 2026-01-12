// Advanced Screen Effects System for visual polish and game feel
// Handles freeze-frames, camera zoom, chromatic aberration, slow-mo, weather, etc.

import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export interface ScreenEffectsConfig {
  freezeFramesEnabled: boolean;
  cameraZoomEnabled: boolean;
  chromaticAberrationEnabled: boolean;
  slowMoEnabled: boolean;
  weatherEnabled: boolean;
}

type WeatherType = 'none' | 'rain' | 'snow' | 'lightning' | 'particles';

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  type: 'rain' | 'snow' | 'spark';
}

export class ScreenEffects {
  // Freeze-frame system
  private freezeFrameTimer = 0;
  private freezeFrameDuration = 0;

  // Camera zoom system
  private zoomLevel = 1.0;
  private targetZoom = 1.0;
  private zoomCenterX = GAME_WIDTH / 2;
  private zoomCenterY = GAME_HEIGHT / 2;

  // Chromatic aberration
  private chromaticIntensity = 0;
  private chromaticDecay = 0.95;

  // Slow-mo kill cam
  private slowMoFactor = 1.0;
  private slowMoTargetFactor = 1.0;
  private slowMoTimer = 0;
  private killCamActive = false;

  // Vignette effect
  private vignetteIntensity = 0;
  private vignetteTargetIntensity = 0;

  // Screen flash (beyond just death flash - for impacts, combos, etc.)
  private flashColor = '#ffffff';
  private flashOpacity = 0;
  private flashDecay = 0.1;

  // Weather system
  private weatherType: WeatherType = 'none';
  private weatherParticles: WeatherParticle[] = [];
  private weatherIntensity = 1.0;
  private lightningTimer = 0;
  private lightningFlash = 0;

  // Beat drop effect
  private beatDropActive = false;
  private beatDropIntensity = 0;
  private beatDropTimer = 0;

  // Streak/perfect run effects
  private streakGlow = 0;
  private perfectRunActive = false;

  // Configuration
  private config: ScreenEffectsConfig = {
    freezeFramesEnabled: true,
    cameraZoomEnabled: true,
    chromaticAberrationEnabled: true,
    slowMoEnabled: true,
    weatherEnabled: true,
  };

  configure(config: Partial<ScreenEffectsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ===========================================
  // FREEZE-FRAME SYSTEM
  // ===========================================

  /**
   * Trigger a freeze-frame (hitstop) effect
   * @param frames Number of frames to freeze (at 60fps, 3 frames = 50ms)
   */
  triggerFreezeFrame(frames: number = 3): void {
    if (!this.config.freezeFramesEnabled) return;
    this.freezeFrameDuration = frames * (1000 / 60); // Convert frames to ms
    this.freezeFrameTimer = this.freezeFrameDuration;
  }

  /**
   * Check if game should be frozen
   */
  isFrozen(): boolean {
    return this.freezeFrameTimer > 0;
  }

  /**
   * Get the effective delta time (0 during freeze)
   */
  getEffectiveDelta(deltaTime: number): number {
    if (this.freezeFrameTimer > 0) {
      this.freezeFrameTimer -= deltaTime;
      return 0;
    }

    // Apply slow-mo factor
    return deltaTime * this.slowMoFactor;
  }

  // ===========================================
  // CAMERA ZOOM SYSTEM
  // ===========================================

  /**
   * Trigger a zoom pulse (brief zoom in then out)
   */
  triggerZoomPulse(intensity: number = 1.1, duration: number = 200): void {
    if (!this.config.cameraZoomEnabled) return;
    this.targetZoom = intensity;
    setTimeout(() => {
      this.targetZoom = 1.0;
    }, duration / 2);
  }

  /**
   * Set zoom center point
   */
  setZoomCenter(x: number, y: number): void {
    this.zoomCenterX = x;
    this.zoomCenterY = y;
  }

  /**
   * Zoom out for cinematic death cam
   */
  triggerDeathZoom(): void {
    if (!this.config.cameraZoomEnabled) return;
    this.targetZoom = 0.9; // Zoom out slightly
  }

  /**
   * Zoom in for level complete
   */
  triggerVictoryZoom(): void {
    if (!this.config.cameraZoomEnabled) return;
    this.targetZoom = 1.15;
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    return this.zoomLevel;
  }

  /**
   * Get zoom center
   */
  getZoomCenter(): { x: number; y: number } {
    return { x: this.zoomCenterX, y: this.zoomCenterY };
  }

  // ===========================================
  // CHROMATIC ABERRATION
  // ===========================================

  /**
   * Trigger chromatic aberration effect
   */
  triggerChromaticAberration(intensity: number = 8): void {
    if (!this.config.chromaticAberrationEnabled) return;
    this.chromaticIntensity = Math.max(this.chromaticIntensity, intensity);
  }

  /**
   * Get current chromatic aberration offset
   */
  getChromaticOffset(): number {
    return this.chromaticIntensity;
  }

  // ===========================================
  // SLOW-MO KILL CAM
  // ===========================================

  /**
   * Trigger slow-motion kill cam effect
   */
  triggerKillCam(_playerX: number, _playerY: number, duration: number = 800): void {
    if (!this.config.slowMoEnabled) return;

    this.killCamActive = true;
    this.slowMoTargetFactor = 0.2; // 20% speed
    this.slowMoTimer = duration;

    // Also trigger visual effects
    this.triggerChromaticAberration(12);
    this.vignetteTargetIntensity = 0.5;
    this.triggerDeathZoom();
  }

  /**
   * Check if kill cam is active
   */
  isKillCamActive(): boolean {
    return this.killCamActive;
  }

  /**
   * Get current slow-mo factor (1.0 = normal, 0.5 = half speed)
   */
  getSlowMoFactor(): number {
    return this.slowMoFactor;
  }

  // ===========================================
  // VIGNETTE EFFECT
  // ===========================================

  /**
   * Set vignette intensity (0 = none, 1 = full)
   */
  setVignette(intensity: number): void {
    this.vignetteTargetIntensity = Math.max(0, Math.min(1, intensity));
  }

  // ===========================================
  // SCREEN FLASH
  // ===========================================

  /**
   * Trigger a screen flash
   */
  triggerFlash(color: string = '#ffffff', intensity: number = 0.3): void {
    this.flashColor = color;
    this.flashOpacity = Math.max(this.flashOpacity, intensity);
  }

  // ===========================================
  // WEATHER SYSTEM
  // ===========================================

  /**
   * Set weather type
   */
  setWeather(type: WeatherType, intensity: number = 1.0): void {
    if (!this.config.weatherEnabled) {
      this.weatherType = 'none';
      return;
    }

    this.weatherType = type;
    this.weatherIntensity = intensity;

    // Initialize weather particles
    if (type !== 'none') {
      this.initWeatherParticles();
    } else {
      this.weatherParticles = [];
    }
  }

  private initWeatherParticles(): void {
    this.weatherParticles = [];
    const count = this.weatherType === 'rain' ? 100 :
                  this.weatherType === 'snow' ? 50 :
                  this.weatherType === 'particles' ? 30 : 0;

    for (let i = 0; i < count * this.weatherIntensity; i++) {
      this.weatherParticles.push(this.createWeatherParticle());
    }
  }

  private createWeatherParticle(): WeatherParticle {
    const type = this.weatherType === 'rain' ? 'rain' :
                 this.weatherType === 'snow' ? 'snow' : 'spark';

    return {
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT - GAME_HEIGHT,
      vx: type === 'rain' ? -2 : (Math.random() - 0.5) * 2,
      vy: type === 'rain' ? 15 : type === 'snow' ? 2 : -3,
      size: type === 'rain' ? 2 : type === 'snow' ? 3 : 2,
      opacity: 0.3 + Math.random() * 0.4,
      type,
    };
  }

  /**
   * Trigger lightning flash
   */
  triggerLightning(): void {
    this.lightningFlash = 1.0;
    this.lightningTimer = 100 + Math.random() * 200;
  }

  // ===========================================
  // BEAT DROP EFFECT
  // ===========================================

  /**
   * Trigger beat drop visual effect
   */
  triggerBeatDrop(duration: number = 500): void {
    this.beatDropActive = true;
    this.beatDropIntensity = 1.0;
    this.beatDropTimer = duration;

    // Combo effects
    this.triggerZoomPulse(1.15, 300);
    this.triggerChromaticAberration(6);
    this.triggerFlash('#ff00ff', 0.2);
  }

  /**
   * Check if beat drop is active
   */
  isBeatDropActive(): boolean {
    return this.beatDropActive;
  }

  // ===========================================
  // STREAK/PERFECT RUN
  // ===========================================

  /**
   * Set perfect run status (no deaths)
   */
  setPerfectRun(active: boolean): void {
    this.perfectRunActive = active;
    if (active) {
      this.streakGlow = 1.0;
    }
  }

  /**
   * Check if perfect run glow should be rendered
   */
  isPerfectRun(): boolean {
    return this.perfectRunActive;
  }

  // ===========================================
  // UPDATE
  // ===========================================

  update(deltaTime: number): void {
    // Update zoom
    if (this.zoomLevel !== this.targetZoom) {
      const diff = this.targetZoom - this.zoomLevel;
      if (Math.abs(diff) < 0.001) {
        this.zoomLevel = this.targetZoom;
      } else {
        this.zoomLevel += diff * 0.1;
      }
    }

    // Decay chromatic aberration
    this.chromaticIntensity *= this.chromaticDecay;
    if (this.chromaticIntensity < 0.1) {
      this.chromaticIntensity = 0;
    }

    // Update slow-mo
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= deltaTime;
      const t = 1 - (this.slowMoTimer / 800);
      this.slowMoFactor = this.slowMoTargetFactor + (1.0 - this.slowMoTargetFactor) * Math.pow(t, 2);

      if (this.slowMoTimer <= 0) {
        this.killCamActive = false;
        this.slowMoFactor = 1.0;
        this.targetZoom = 1.0;
      }
    } else {
      this.slowMoFactor = 1.0;
    }

    // Update vignette
    this.vignetteIntensity += (this.vignetteTargetIntensity - this.vignetteIntensity) * 0.1;
    if (!this.killCamActive && this.vignetteTargetIntensity > 0) {
      this.vignetteTargetIntensity *= 0.98;
    }

    // Decay flash
    if (this.flashOpacity > 0) {
      this.flashOpacity -= this.flashDecay;
      if (this.flashOpacity < 0) this.flashOpacity = 0;
    }

    // Update weather
    this.updateWeather(deltaTime);

    // Update beat drop
    if (this.beatDropTimer > 0) {
      this.beatDropTimer -= deltaTime;
      this.beatDropIntensity = this.beatDropTimer / 500;
      if (this.beatDropTimer <= 0) {
        this.beatDropActive = false;
        this.beatDropIntensity = 0;
      }
    }

    // Update streak glow
    if (this.perfectRunActive) {
      this.streakGlow = 0.5 + Math.sin(Date.now() / 500) * 0.3;
    }

    // Update lightning
    if (this.lightningFlash > 0) {
      this.lightningFlash -= deltaTime / 100;
    }
    if (this.lightningTimer > 0) {
      this.lightningTimer -= deltaTime;
      if (this.lightningTimer <= 0 && this.weatherType === 'lightning') {
        // Random chance for next lightning
        if (Math.random() < 0.3) {
          this.triggerLightning();
        }
      }
    }
  }

  private updateWeather(deltaTime: number): void {
    if (this.weatherType === 'none') return;

    const dt = deltaTime / 16; // Normalize to 60fps

    for (const particle of this.weatherParticles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      // Wrap around
      if (particle.y > GAME_HEIGHT) {
        particle.y = -10;
        particle.x = Math.random() * GAME_WIDTH;
      }
      if (particle.x < 0) particle.x = GAME_WIDTH;
      if (particle.x > GAME_WIDTH) particle.x = 0;

      // Snow sway
      if (particle.type === 'snow') {
        particle.vx = Math.sin(particle.y / 50 + particle.x / 100) * 0.5;
      }
    }

    // Spawn lightning occasionally
    if (this.weatherType === 'lightning' && this.lightningTimer <= 0) {
      if (Math.random() < 0.001 * this.weatherIntensity) {
        this.triggerLightning();
      }
    }
  }

  // ===========================================
  // RENDER
  // ===========================================

  /**
   * Apply pre-render transforms (call before main render)
   */
  applyPreRender(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Apply zoom
    if (this.zoomLevel !== 1.0) {
      const cx = this.zoomCenterX;
      const cy = this.zoomCenterY;
      ctx.translate(cx, cy);
      ctx.scale(this.zoomLevel, this.zoomLevel);
      ctx.translate(-cx, -cy);
    }
  }

  /**
   * Render post-processing effects (call after main render)
   */
  renderPostEffects(ctx: CanvasRenderingContext2D): void {
    ctx.restore();

    // Render weather
    this.renderWeather(ctx);

    // Screen flash
    if (this.flashOpacity > 0) {
      ctx.fillStyle = this.flashColor.replace(')', `, ${this.flashOpacity})`).replace('rgb', 'rgba');
      if (!this.flashColor.includes('rgba')) {
        // Handle hex colors
        const hex = this.flashColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.flashOpacity})`;
      }
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Lightning flash
    if (this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.8})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Vignette
    if (this.vignetteIntensity > 0.01) {
      this.renderVignette(ctx);
    }

    // Beat drop overlay
    if (this.beatDropActive) {
      this.renderBeatDropOverlay(ctx);
    }

    // Perfect run glow
    if (this.perfectRunActive) {
      this.renderPerfectRunGlow(ctx);
    }
  }

  private renderWeather(ctx: CanvasRenderingContext2D): void {
    if (this.weatherType === 'none') return;

    ctx.save();

    for (const particle of this.weatherParticles) {
      ctx.globalAlpha = particle.opacity;

      if (particle.type === 'rain') {
        ctx.strokeStyle = '#aaddff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x + particle.vx * 2, particle.y + particle.vy * 2);
        ctx.stroke();
      } else if (particle.type === 'snow') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'spark') {
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private renderVignette(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.3,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.9
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteIntensity})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private renderBeatDropOverlay(ctx: CanvasRenderingContext2D): void {
    // Pulsing border effect
    const borderWidth = 10 * this.beatDropIntensity;

    ctx.strokeStyle = `rgba(255, 0, 255, ${this.beatDropIntensity * 0.5})`;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2,
                   GAME_WIDTH - borderWidth, GAME_HEIGHT - borderWidth);

    // Corner flares
    ctx.fillStyle = `rgba(255, 0, 255, ${this.beatDropIntensity * 0.3})`;
    const flareSize = 50 * this.beatDropIntensity;
    ctx.beginPath();
    ctx.arc(0, 0, flareSize, 0, Math.PI / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(GAME_WIDTH, 0, flareSize, Math.PI / 2, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(GAME_WIDTH, GAME_HEIGHT, flareSize, Math.PI, Math.PI * 1.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, GAME_HEIGHT, flareSize, Math.PI * 1.5, Math.PI * 2);
    ctx.fill();
  }

  private renderPerfectRunGlow(ctx: CanvasRenderingContext2D): void {
    // Golden glow around screen edge
    const gradient = ctx.createLinearGradient(0, 0, GAME_WIDTH, 0);
    gradient.addColorStop(0, `rgba(255, 215, 0, ${this.streakGlow * 0.3})`);
    gradient.addColorStop(0.5, `rgba(255, 215, 0, 0)`);
    gradient.addColorStop(1, `rgba(255, 215, 0, ${this.streakGlow * 0.3})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, 5);
    ctx.fillRect(0, GAME_HEIGHT - 5, GAME_WIDTH, 5);

    const gradient2 = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient2.addColorStop(0, `rgba(255, 215, 0, ${this.streakGlow * 0.3})`);
    gradient2.addColorStop(0.5, `rgba(255, 215, 0, 0)`);
    gradient2.addColorStop(1, `rgba(255, 215, 0, ${this.streakGlow * 0.3})`);

    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, 5, GAME_HEIGHT);
    ctx.fillRect(GAME_WIDTH - 5, 0, 5, GAME_HEIGHT);
  }

  /**
   * Render chromatic aberration effect
   * This should be called with a pre-rendered canvas image
   */
  renderChromaticAberration(
    ctx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement
  ): void {
    if (this.chromaticIntensity < 0.5) return;

    const offset = this.chromaticIntensity;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;

    // Red channel - offset left
    ctx.drawImage(sourceCanvas, -offset, 0);

    // Blue channel - offset right
    ctx.drawImage(sourceCanvas, offset, 0);

    ctx.restore();
  }

  // ===========================================
  // RESET
  // ===========================================

  reset(): void {
    this.freezeFrameTimer = 0;
    this.zoomLevel = 1.0;
    this.targetZoom = 1.0;
    this.chromaticIntensity = 0;
    this.slowMoFactor = 1.0;
    this.killCamActive = false;
    this.vignetteIntensity = 0;
    this.vignetteTargetIntensity = 0;
    this.flashOpacity = 0;
    this.beatDropActive = false;
    this.beatDropIntensity = 0;
    this.perfectRunActive = false;
    this.streakGlow = 0;
    this.weatherType = 'none';
    this.weatherParticles = [];
  }
}
