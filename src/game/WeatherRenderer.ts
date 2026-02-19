/**
 * WeatherRenderer - Extracted from Game.ts.
 * Handles all weather-related rendering (rain, wind, fog, night, snow, heat).
 */

import { WeatherType } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export class WeatherRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    weather: WeatherType,
    particles: WeatherParticle[],
    options: {
      weatherEnabled: boolean;
      weatherIntensity: number;
      weatherDirection: number;
      fogOpacity: number;
      nightSpotlightRadius: number;
      playerScreenX: number;
      playerScreenY: number;
    }
  ): void {
    if (!options.weatherEnabled || weather === 'clear') return;

    ctx.save();

    switch (weather) {
      case 'rain':
        this.renderRain(ctx, particles);
        break;
      case 'wind':
        this.renderWind(ctx, particles, options.weatherDirection);
        break;
      case 'fog':
        this.renderFog(ctx, particles, options.fogOpacity);
        break;
      case 'night':
        this.renderNight(ctx, options.playerScreenX, options.playerScreenY, options.nightSpotlightRadius);
        break;
      case 'snow':
        this.renderSnow(ctx, particles);
        break;
      case 'heat':
        this.renderHeat(ctx, options.weatherIntensity);
        break;
    }

    ctx.restore();
  }

  renderIndicator(ctx: CanvasRenderingContext2D, weather: WeatherType): void {
    if (weather === 'clear') return;

    ctx.save();
    const icons: Record<WeatherType, string> = {
      clear: '',
      rain: '\u{1F327}\u{FE0F}',
      wind: '\u{1F4A8}',
      fog: '\u{1F32B}\u{FE0F}',
      night: '\u{1F319}',
      snow: '\u{2744}\u{FE0F}',
      heat: '\u{1F525}',
    };

    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.fillText(icons[weather], GAME_WIDTH - 20, 65);
    ctx.restore();
  }

  /** Apply weather physics to player position */
  applyPhysics(
    weather: WeatherType,
    weatherEnabled: boolean,
    weatherDirection: number,
    weatherIntensity: number,
    playerDead: boolean,
    deltaTime: number
  ): number {
    if (!weatherEnabled || playerDead) return 0;

    if (weather === 'wind') {
      return weatherDirection * weatherIntensity * 50 * (deltaTime / 1000);
    }
    return 0;
  }

  private renderRain(ctx: CanvasRenderingContext2D, particles: WeatherParticle[]): void {
    ctx.strokeStyle = 'rgba(150, 180, 255, 0.6)';
    ctx.lineWidth = 1;

    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.02, p.y + p.size * 3);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private renderWind(ctx: CanvasRenderingContext2D, particles: WeatherParticle[], direction: number): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.size * direction, p.y);
      ctx.stroke();
    }
  }

  private renderFog(ctx: CanvasRenderingContext2D, particles: WeatherParticle[], fogOpacity: number): void {
    ctx.globalAlpha = fogOpacity;
    ctx.fillStyle = '#888899';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, 'rgba(200, 200, 210, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }
  }

  private renderNight(ctx: CanvasRenderingContext2D, px: number, py: number, radius: number): void {
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.globalAlpha = 0.3;
    const vignette = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.3,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 20, 0.8)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private renderSnow(ctx: CanvasRenderingContext2D, particles: WeatherParticle[]): void {
    ctx.fillStyle = '#ffffff';
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#aaddff';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private renderHeat(ctx: CanvasRenderingContext2D, intensity: number): void {
    const time = Date.now() / 1000;
    ctx.globalAlpha = 0.03 * intensity;
    ctx.strokeStyle = 'rgba(255, 150, 50, 0.3)';
    ctx.lineWidth = 2;

    for (let y = 0; y < GAME_HEIGHT; y += 30) {
      ctx.beginPath();
      for (let x = 0; x < GAME_WIDTH; x += 10) {
        const waveY = y + Math.sin(x / 50 + time * 3 + y / 20) * 5;
        if (x === 0) {
          ctx.moveTo(x, waveY);
        } else {
          ctx.lineTo(x, waveY);
        }
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}
