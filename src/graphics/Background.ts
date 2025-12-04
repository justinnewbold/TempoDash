import { BackgroundConfig, BgElement } from '../types';
import { CONFIG } from '../constants';

export class Background {
  private config: BackgroundConfig;
  private bgElements: BgElement[] = [];
  private time = 0;

  constructor(config: BackgroundConfig) {
    this.config = config;
    this.initElements();
  }

  private initElements(): void {
    // Create background floating elements
    for (let i = 0; i < 15; i++) {
      this.bgElements.push({
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * (CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - 100) + 50,
        size: Math.random() * 30 + 10,
        speed: Math.random() * 2 + 1,
        alpha: Math.random() * 0.3 + 0.1
      });
    }
  }

  setConfig(config: BackgroundConfig): void {
    this.config = config;
  }

  update(gameSpeed: number): void {
    this.time += 16 * gameSpeed;

    // Update background elements
    for (const el of this.bgElements) {
      el.x -= el.speed * gameSpeed;
      if (el.x < -50) {
        el.x = CONFIG.WIDTH + 50;
        el.y = Math.random() * (CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - 100) + 50;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, gameRunning: boolean, gameSpeed: number): void {
    // Draw base gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.HEIGHT);
    gradient.addColorStop(0, this.config.primaryColor);
    gradient.addColorStop(0.5, this.config.secondaryColor);
    gradient.addColorStop(1, this.config.accentColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    // Draw background based on type
    switch (this.config.type) {
      case 'city':
        this.drawCityBackground(ctx);
        break;
      case 'neon':
        this.drawNeonBackground(ctx);
        break;
      case 'cave':
        this.drawCaveBackground(ctx);
        break;
      case 'space':
        this.drawSpaceBackground(ctx);
        break;
      case 'storm':
        this.drawStormBackground(ctx);
        break;
      case 'digital':
        this.drawDigitalBackground(ctx);
        break;
    }

    // Draw floating elements
    this.drawBgElements(ctx);

    // Draw ground
    this.drawGround(ctx, gameRunning, gameSpeed);
  }

  private drawBgElements(ctx: CanvasRenderingContext2D): void {
    for (const el of this.bgElements) {
      ctx.fillStyle = `rgba(255, 255, 255, ${el.alpha})`;
      ctx.fillRect(el.x, el.y, el.size, el.size);
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D, gameRunning: boolean, gameSpeed: number): void {
    // Ground gradient
    const groundGradient = ctx.createLinearGradient(
      0, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT,
      0, CONFIG.HEIGHT
    );
    groundGradient.addColorStop(0, this.config.groundColor);
    groundGradient.addColorStop(1, this.config.secondaryColor);
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT, CONFIG.WIDTH, CONFIG.GROUND_HEIGHT);

    // Ground line
    ctx.strokeStyle = this.config.lineColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = this.config.lineColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT);
    ctx.lineTo(CONFIG.WIDTH, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ground pattern lines
    ctx.strokeStyle = `${this.config.lineColor}33`;
    ctx.lineWidth = 1;
    const offset = gameRunning ? (this.time / 20 * gameSpeed) % 50 : 0;
    for (let i = 0; i < CONFIG.WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i - offset, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT);
      ctx.lineTo(i - offset + 30, CONFIG.HEIGHT);
      ctx.stroke();
    }
  }

  private drawCityBackground(ctx: CanvasRenderingContext2D): void {
    // Silhouette buildings
    ctx.fillStyle = 'rgba(20, 30, 50, 0.8)';
    for (let i = 0; i < 15; i++) {
      const x = i * 60 - 20;
      const width = 45 + Math.random() * 20;
      const height = 80 + Math.sin(i * 0.7) * 60;
      ctx.fillRect(x, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - height, width, height);

      // Windows
      ctx.fillStyle = 'rgba(255, 220, 100, 0.3)';
      for (let wy = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - height + 10; wy < CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - 15; wy += 15) {
        for (let wx = x + 6; wx < x + width - 6; wx += 12) {
          if (Math.random() > 0.3) {
            ctx.fillRect(wx, wy, 5, 8);
          }
        }
      }
      ctx.fillStyle = 'rgba(20, 30, 50, 0.8)';
    }

    // Moon
    const moonX = CONFIG.WIDTH * 0.8;
    const moonY = CONFIG.HEIGHT * 0.15;
    ctx.fillStyle = '#f0f0e0';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawNeonBackground(ctx: CanvasRenderingContext2D): void {
    // Synthwave sun
    const sunX = CONFIG.WIDTH / 2;
    const sunY = CONFIG.HEIGHT * 0.5;
    const sunRadius = 100;

    // Sun glow
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
    sunGlow.addColorStop(0, 'rgba(255, 100, 50, 0.4)');
    sunGlow.addColorStop(0.5, 'rgba(255, 0, 100, 0.2)');
    sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Sun with stripes
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.clip();

    const sunGradient = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
    sunGradient.addColorStop(0, '#ff6b35');
    sunGradient.addColorStop(0.5, '#ff0066');
    sunGradient.addColorStop(1, '#9933ff');
    ctx.fillStyle = sunGradient;
    ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

    // Stripes
    ctx.fillStyle = this.config.primaryColor;
    for (let i = 0; i < 6; i++) {
      const lineY = sunY + i * 18 - 10;
      const lineHeight = 4 + i * 2;
      ctx.fillRect(sunX - sunRadius, lineY, sunRadius * 2, lineHeight);
    }
    ctx.restore();

    // Neon grid perspective
    this.drawPerspectiveGrid(ctx);
  }

  private drawPerspectiveGrid(ctx: CanvasRenderingContext2D): void {
    const horizonY = CONFIG.HEIGHT * 0.6;
    const vanishX = CONFIG.WIDTH / 2;

    ctx.strokeStyle = '#ff0080';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i < 15; i++) {
      const y = horizonY + i * (CONFIG.HEIGHT - horizonY) / 15;
      const alpha = i / 15 * 0.5;
      ctx.strokeStyle = `rgba(255, 0, 128, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CONFIG.WIDTH, y);
      ctx.stroke();
    }

    // Vertical perspective lines
    ctx.strokeStyle = 'rgba(255, 0, 128, 0.3)';
    for (let i = 0; i <= 20; i++) {
      const bottomX = (CONFIG.WIDTH / 20) * i;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizonY);
      ctx.lineTo(bottomX, CONFIG.HEIGHT);
      ctx.stroke();
    }
  }

  private drawCaveBackground(ctx: CanvasRenderingContext2D): void {
    // Stalactites from ceiling
    ctx.fillStyle = '#0d1a2d';
    for (let i = 0; i < 12; i++) {
      const x = (CONFIG.WIDTH / 12) * i + 40;
      const height = 40 + Math.sin(i * 1.2) * 30;
      ctx.beginPath();
      ctx.moveTo(x - 15, 0);
      ctx.lineTo(x, height);
      ctx.lineTo(x + 15, 0);
      ctx.fill();
    }

    // Crystal glow effects
    ctx.shadowBlur = 20;
    for (let i = 0; i < 8; i++) {
      const x = 80 + i * 100;
      const y = 100 + Math.sin(i) * 50;
      ctx.shadowColor = `hsl(${200 + i * 20}, 80%, 50%)`;
      ctx.fillStyle = `hsla(${200 + i * 20}, 80%, 50%, 0.3)`;
      ctx.beginPath();
      ctx.arc(x, y, 20 + Math.sin(this.time * 0.002 + i) * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  private drawSpaceBackground(ctx: CanvasRenderingContext2D): void {
    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 80; i++) {
      const x = (i * 13) % CONFIG.WIDTH;
      const y = (i * 7) % (CONFIG.HEIGHT * 0.7);
      const size = Math.sin(i) > 0.5 ? 2 : 1;
      const twinkle = Math.sin(this.time * 0.003 + i) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Nebula
    const nebulaGradient = ctx.createRadialGradient(
      CONFIG.WIDTH * 0.3, CONFIG.HEIGHT * 0.3, 0,
      CONFIG.WIDTH * 0.3, CONFIG.HEIGHT * 0.3, 200
    );
    nebulaGradient.addColorStop(0, 'rgba(138, 68, 255, 0.2)');
    nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebulaGradient;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    // Planet
    const planetX = CONFIG.WIDTH * 0.85;
    const planetY = CONFIG.HEIGHT * 0.25;
    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.arc(planetX, planetY, 35, 0, Math.PI * 2);
    ctx.fill();

    // Ring
    ctx.strokeStyle = 'rgba(199, 210, 254, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 55, 12, 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawStormBackground(ctx: CanvasRenderingContext2D): void {
    // Storm clouds
    ctx.fillStyle = 'rgba(50, 50, 70, 0.7)';
    for (let i = 0; i < 6; i++) {
      const x = (i * 150 + this.time * 0.02) % (CONFIG.WIDTH + 200) - 100;
      const y = 30 + Math.sin(i) * 20;
      // Cloud shapes
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.arc(x + 30, y - 10, 35, 0, Math.PI * 2);
      ctx.arc(x + 60, y, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lightning flash (random)
    if (Math.random() > 0.997) {
      ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

    // Rain
    ctx.strokeStyle = 'rgba(180, 180, 220, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const x = (i * 15 + this.time * 0.3) % CONFIG.WIDTH;
      const y = (i * 11 + this.time * 0.5) % CONFIG.HEIGHT;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 12);
      ctx.stroke();
    }
  }

  private drawDigitalBackground(ctx: CanvasRenderingContext2D): void {
    // Matrix-style falling code
    ctx.font = '12px monospace';
    const chars = '01アイウエオカキク';

    for (let i = 0; i < 25; i++) {
      const x = (CONFIG.WIDTH / 25) * i + 15;
      const offset = (this.time * 0.05 + i * 50) % (CONFIG.HEIGHT + 200) - 100;

      for (let j = 0; j < 12; j++) {
        const y = offset + j * 18;
        if (y > 0 && y < CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT) {
          const alpha = j === 0 ? 1 : 0.5 - j * 0.04;
          ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
          const char = chars[Math.floor((i + j + this.time * 0.01) % chars.length)];
          ctx.fillText(char, x, y);
        }
      }
    }

    // Circuit lines
    ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let y = 60; y < CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CONFIG.WIDTH, y);
      ctx.stroke();
    }

    // Pulsing nodes
    ctx.fillStyle = '#00ff00';
    const pulse = Math.sin(this.time * 0.005) * 0.5 + 0.5;
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 10 + pulse * 10;
    for (let i = 0; i < 8; i++) {
      const x = 80 + i * 100;
      const y = 100 + Math.sin(i * 2) * 60;
      ctx.beginPath();
      ctx.arc(x, y, 3 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}
