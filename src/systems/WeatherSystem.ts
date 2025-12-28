// Weather effects system - handles rain, snow, and wind visual effects
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export type WeatherType = 'none' | 'rain' | 'snow' | 'wind';

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  lifetime: number;
  active: boolean;
}

export class WeatherSystem {
  private particles: WeatherParticle[] = [];
  private currentWeather: WeatherType = 'none';
  private intensity: number = 1.0;  // 0.0 to 1.0
  private windStrength: number = 0;
  private spawnTimer: number = 0;

  private static readonly MAX_PARTICLES = 200;
  private static readonly RAIN_SPAWN_RATE = 10;   // particles per frame at intensity 1
  private static readonly SNOW_SPAWN_RATE = 5;
  private static readonly WIND_SPAWN_RATE = 3;

  constructor() {
    // Pre-allocate particles
    for (let i = 0; i < WeatherSystem.MAX_PARTICLES; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 1,
        alpha: 1,
        lifetime: 0,
        active: false,
      });
    }
  }

  setWeather(type: WeatherType, intensity: number = 1.0): void {
    this.currentWeather = type;
    this.intensity = Math.max(0, Math.min(1, intensity));

    // Clear particles when weather changes
    if (type === 'none') {
      this.clear();
    }
  }

  getWeather(): WeatherType {
    return this.currentWeather;
  }

  setWindStrength(strength: number): void {
    this.windStrength = strength;
  }

  private acquireParticle(): WeatherParticle | null {
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.lifetime = 0;
        return p;
      }
    }
    return null;
  }

  private spawnRainDrop(cameraX: number): void {
    const p = this.acquireParticle();
    if (!p) return;

    p.x = cameraX + Math.random() * (GAME_WIDTH + 100) - 50;
    p.y = -10 - Math.random() * 50;
    p.vx = this.windStrength * 50 + (Math.random() - 0.5) * 20;
    p.vy = 600 + Math.random() * 200;
    p.size = 1 + Math.random() * 2;
    p.alpha = 0.4 + Math.random() * 0.3;
  }

  private spawnSnowflake(cameraX: number): void {
    const p = this.acquireParticle();
    if (!p) return;

    p.x = cameraX + Math.random() * (GAME_WIDTH + 100) - 50;
    p.y = -10 - Math.random() * 30;
    p.vx = this.windStrength * 30 + (Math.random() - 0.5) * 50;
    p.vy = 50 + Math.random() * 100;
    p.size = 2 + Math.random() * 4;
    p.alpha = 0.6 + Math.random() * 0.4;
  }

  private spawnWindParticle(cameraX: number): void {
    const p = this.acquireParticle();
    if (!p) return;

    const fromLeft = this.windStrength > 0;
    p.x = fromLeft ? cameraX - 20 : cameraX + GAME_WIDTH + 20;
    p.y = Math.random() * GAME_HEIGHT;
    p.vx = this.windStrength * 300 + (fromLeft ? 200 : -200);
    p.vy = (Math.random() - 0.5) * 50;
    p.size = 1 + Math.random() * 2;
    p.alpha = 0.2 + Math.random() * 0.2;
  }

  update(deltaTime: number, cameraX: number): void {
    if (this.currentWeather === 'none') return;

    const dt = deltaTime / 1000;

    // Spawn new particles
    this.spawnTimer += deltaTime;
    const spawnInterval = 16; // ~60fps spawn rate

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;

      let spawnCount = 0;
      switch (this.currentWeather) {
        case 'rain':
          spawnCount = Math.floor(WeatherSystem.RAIN_SPAWN_RATE * this.intensity);
          for (let i = 0; i < spawnCount; i++) {
            this.spawnRainDrop(cameraX);
          }
          break;

        case 'snow':
          spawnCount = Math.floor(WeatherSystem.SNOW_SPAWN_RATE * this.intensity);
          for (let i = 0; i < spawnCount; i++) {
            this.spawnSnowflake(cameraX);
          }
          break;

        case 'wind':
          spawnCount = Math.floor(WeatherSystem.WIND_SPAWN_RATE * this.intensity);
          for (let i = 0; i < spawnCount; i++) {
            this.spawnWindParticle(cameraX);
          }
          break;
      }
    }

    // Update particles
    for (const p of this.particles) {
      if (!p.active) continue;

      p.lifetime += deltaTime;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Add sway for snow
      if (this.currentWeather === 'snow') {
        p.x += Math.sin(p.lifetime * 0.003 + p.y * 0.01) * 30 * dt;
      }

      // Deactivate particles that are off screen
      const screenX = p.x - cameraX;
      if (screenX < -50 || screenX > GAME_WIDTH + 50 || p.y > GAME_HEIGHT + 50) {
        p.active = false;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    if (this.currentWeather === 'none') return;

    ctx.save();

    for (const p of this.particles) {
      if (!p.active) continue;

      const screenX = p.x - cameraX;
      if (screenX < -20 || screenX > GAME_WIDTH + 20) continue;

      ctx.globalAlpha = p.alpha;

      switch (this.currentWeather) {
        case 'rain':
          // Draw rain as angled lines
          ctx.strokeStyle = '#aaddff';
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(screenX, p.y);
          ctx.lineTo(screenX + p.vx * 0.02, p.y + p.vy * 0.02);
          ctx.stroke();
          break;

        case 'snow':
          // Draw snowflakes as circles with glow
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;

        case 'wind':
          // Draw wind as horizontal lines/streaks
          ctx.strokeStyle = 'rgba(200, 220, 255, 0.4)';
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(screenX, p.y);
          ctx.lineTo(screenX + p.vx * 0.05, p.y);
          ctx.stroke();
          break;
      }
    }

    ctx.restore();
  }

  clear(): void {
    for (const p of this.particles) {
      p.active = false;
    }
  }

  getActiveCount(): number {
    let count = 0;
    for (const p of this.particles) {
      if (p.active) count++;
    }
    return count;
  }
}
