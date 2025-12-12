import { BackgroundConfig } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, ANIMATION, COLORS } from '../constants';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface GridLine {
  y: number;
  speed: number;
}

interface WavePoint {
  x: number;
  amplitude: number;
  frequency: number;
  phase: number;
}

interface AuroraBand {
  y: number;
  height: number;
  hue: number;
  speed: number;
  offset: number;
}

export class Background {
  private config: BackgroundConfig;
  private time = 0;

  // Effect-specific data
  private stars: Star[] = [];
  private particles: Particle[] = [];
  private gridLines: GridLine[] = [];
  private wavePoints: WavePoint[] = [];
  private auroraBands: AuroraBand[] = [];

  // Level 2 specific
  private sunY = GAME_HEIGHT * 0.65;
  private mountainPoints: number[][] = [];

  constructor(config: BackgroundConfig) {
    this.config = config;
    this.initializeEffects();
  }

  private initializeEffects(): void {
    const effects = this.config.effects || [];

    if (effects.includes('stars')) {
      this.initializeStars();
    }

    if (this.config.particles) {
      this.initializeParticles();
    }

    if (effects.includes('grid')) {
      this.initializeGrid();
    }

    if (effects.includes('waves')) {
      this.initializeWaves();
    }

    if (effects.includes('aurora')) {
      this.initializeAurora();
    }

    // Level 2 neon background mountains
    if (this.config.type === 'neon') {
      this.initializeMountains();
    }
  }

  private initializeStars(): void {
    for (let i = 0; i < ANIMATION.STAR_COUNT; i++) {
      this.stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT * 0.6,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random(),
        twinkleSpeed: Math.random() * 0.003 + 0.001,
      });
    }
  }

  private initializeParticles(): void {
    const count = this.config.particles?.count || ANIMATION.PARTICLE_COUNT;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size:
          Math.random() *
            ((this.config.particles?.maxSize || 4) -
              (this.config.particles?.minSize || 1)) +
          (this.config.particles?.minSize || 1),
        speed:
          Math.random() * (this.config.particles?.speed || 50) + 20,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
  }

  private initializeGrid(): void {
    for (let i = 0; i < 20; i++) {
      this.gridLines.push({
        y: GAME_HEIGHT * 0.5 + i * 30,
        speed: 50 + i * 10,
      });
    }
  }

  private initializeWaves(): void {
    for (let i = 0; i < 5; i++) {
      this.wavePoints.push({
        x: 0,
        amplitude: ANIMATION.WAVE_AMPLITUDE * (1 - i * 0.15),
        frequency: ANIMATION.WAVE_FREQUENCY * (1 + i * 0.3),
        phase: i * 0.5,
      });
    }
  }

  private initializeAurora(): void {
    for (let i = 0; i < ANIMATION.AURORA_BANDS; i++) {
      this.auroraBands.push({
        y: GAME_HEIGHT * 0.1 + i * 40,
        height: 60 + Math.random() * 40,
        hue: 120 + i * 30,
        speed: 0.0005 + Math.random() * 0.001,
        offset: Math.random() * Math.PI * 2,
      });
    }
  }

  private initializeMountains(): void {
    // Create multiple mountain layers
    for (let layer = 0; layer < 3; layer++) {
      const points: number[] = [];
      const segments = 12;
      for (let i = 0; i <= segments; i++) {
        const x = (GAME_WIDTH / segments) * i;
        const baseHeight = GAME_HEIGHT * (0.4 + layer * 0.1);
        const variation = Math.sin(i * 0.8 + layer) * 50 + Math.random() * 30;
        points.push(x, baseHeight + variation);
      }
      this.mountainPoints.push(points);
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    // Update particles
    this.updateParticles(deltaTime);

    // Update grid
    this.updateGrid(deltaTime);
  }

  private updateParticles(deltaTime: number): void {
    const direction = this.config.particles?.direction || 'up';

    for (const particle of this.particles) {
      switch (direction) {
        case 'up':
          particle.y -= particle.speed * (deltaTime / 1000);
          if (particle.y < -10) {
            particle.y = GAME_HEIGHT + 10;
            particle.x = Math.random() * GAME_WIDTH;
          }
          break;
        case 'down':
          particle.y += particle.speed * (deltaTime / 1000);
          if (particle.y > GAME_HEIGHT + 10) {
            particle.y = -10;
            particle.x = Math.random() * GAME_WIDTH;
          }
          break;
        case 'random':
          particle.x += (Math.random() - 0.5) * particle.speed * (deltaTime / 1000);
          particle.y += (Math.random() - 0.5) * particle.speed * (deltaTime / 1000);
          if (particle.x < 0) particle.x = GAME_WIDTH;
          if (particle.x > GAME_WIDTH) particle.x = 0;
          if (particle.y < 0) particle.y = GAME_HEIGHT;
          if (particle.y > GAME_HEIGHT) particle.y = 0;
          break;
      }
    }
  }

  private updateGrid(deltaTime: number): void {
    for (const line of this.gridLines) {
      line.y += line.speed * (deltaTime / 1000);
      if (line.y > GAME_HEIGHT + 50) {
        line.y = GAME_HEIGHT * 0.5;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw base gradient
    this.drawBaseGradient(ctx);

    // Draw type-specific background
    switch (this.config.type) {
      case 'city':
        this.drawCityBackground(ctx);
        break;
      case 'neon':
        this.drawNeonBackground(ctx);
        break;
      case 'space':
        this.drawSpaceBackground(ctx);
        break;
      case 'forest':
        this.drawForestBackground(ctx);
        break;
    }

    // Draw effects
    this.renderEffects(ctx);
  }

  private drawBaseGradient(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, this.config.primaryColor);
    gradient.addColorStop(0.5, this.config.secondaryColor);
    gradient.addColorStop(1, this.config.primaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private drawCityBackground(ctx: CanvasRenderingContext2D): void {
    // Draw distant city silhouette
    ctx.fillStyle = 'rgba(20, 30, 50, 0.8)';

    // Back buildings
    for (let i = 0; i < 15; i++) {
      const x = i * 70 - 20;
      const width = 50 + Math.random() * 30;
      const height = 100 + Math.sin(i * 0.7) * 80;
      ctx.fillRect(x, GAME_HEIGHT - height, width, height);

      // Windows
      ctx.fillStyle = 'rgba(255, 220, 100, 0.3)';
      for (let wy = GAME_HEIGHT - height + 15; wy < GAME_HEIGHT - 20; wy += 20) {
        for (let wx = x + 8; wx < x + width - 8; wx += 15) {
          if (Math.random() > 0.3) {
            ctx.fillRect(wx, wy, 6, 10);
          }
        }
      }
      ctx.fillStyle = 'rgba(20, 30, 50, 0.8)';
    }

    // Moon
    const moonX = GAME_WIDTH * 0.8;
    const moonY = GAME_HEIGHT * 0.15;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 80);
    moonGlow.addColorStop(0, 'rgba(255, 255, 240, 0.3)');
    moonGlow.addColorStop(1, 'rgba(255, 255, 240, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f0f0e0';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawNeonBackground(ctx: CanvasRenderingContext2D): void {
    // Draw synthwave sun
    const sunX = GAME_WIDTH / 2;
    const sunRadius = 120;

    // Sun glow
    const sunGlow = ctx.createRadialGradient(
      sunX,
      this.sunY,
      0,
      sunX,
      this.sunY,
      sunRadius * 2
    );
    sunGlow.addColorStop(0, 'rgba(255, 100, 50, 0.5)');
    sunGlow.addColorStop(0.5, 'rgba(255, 50, 100, 0.2)');
    sunGlow.addColorStop(1, 'rgba(255, 0, 150, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, this.sunY, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Sun body with horizontal lines
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, this.sunY, sunRadius, 0, Math.PI * 2);
    ctx.clip();

    const sunGradient = ctx.createLinearGradient(
      sunX,
      this.sunY - sunRadius,
      sunX,
      this.sunY + sunRadius
    );
    sunGradient.addColorStop(0, '#ff6b35');
    sunGradient.addColorStop(0.5, '#ff0066');
    sunGradient.addColorStop(1, '#9933ff');
    ctx.fillStyle = sunGradient;
    ctx.fillRect(
      sunX - sunRadius,
      this.sunY - sunRadius,
      sunRadius * 2,
      sunRadius * 2
    );

    // Horizontal lines through sun
    ctx.fillStyle = this.config.primaryColor;
    for (let i = 0; i < 8; i++) {
      const lineY = this.sunY + i * 20 - 20;
      const lineHeight = 4 + i * 2;
      ctx.fillRect(sunX - sunRadius, lineY, sunRadius * 2, lineHeight);
    }
    ctx.restore();

    // Draw mountains
    this.drawNeonMountains(ctx);

    // Draw perspective grid
    this.drawPerspectiveGrid(ctx);
  }

  private drawNeonMountains(ctx: CanvasRenderingContext2D): void {
    const colors = ['#1a0533', '#2d0a4e', '#400f6b'];

    for (let layer = 0; layer < this.mountainPoints.length; layer++) {
      const points = this.mountainPoints[layer];

      ctx.beginPath();
      ctx.moveTo(0, GAME_HEIGHT);

      for (let i = 0; i < points.length; i += 2) {
        ctx.lineTo(points[i], points[i + 1]);
      }

      ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
      ctx.closePath();

      ctx.fillStyle = colors[layer] || colors[0];
      ctx.fill();

      // Mountain outline glow
      ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 - layer * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 2) {
        if (i === 0) {
          ctx.moveTo(points[i], points[i + 1]);
        } else {
          ctx.lineTo(points[i], points[i + 1]);
        }
      }
      ctx.stroke();
    }
  }

  private drawPerspectiveGrid(ctx: CanvasRenderingContext2D): void {
    const horizonY = GAME_HEIGHT * 0.55;
    const vanishX = GAME_WIDTH / 2;

    ctx.strokeStyle = COLORS.LEVEL2.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;

    // Horizontal lines (with perspective)
    for (const line of this.gridLines) {
      if (line.y > horizonY) {
        const progress = (line.y - horizonY) / (GAME_HEIGHT - horizonY);
        const alpha = progress * 0.6;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.moveTo(0, line.y);
        ctx.lineTo(GAME_WIDTH, line.y);
        ctx.stroke();
      }
    }

    // Vertical lines (converging to vanishing point)
    ctx.globalAlpha = 0.3;
    const numVerticals = 20;
    for (let i = 0; i <= numVerticals; i++) {
      const bottomX = (GAME_WIDTH / numVerticals) * i;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizonY);
      ctx.lineTo(bottomX, GAME_HEIGHT);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private drawSpaceBackground(ctx: CanvasRenderingContext2D): void {
    // Nebula clouds
    for (let i = 0; i < 3; i++) {
      const nebulaGradient = ctx.createRadialGradient(
        GAME_WIDTH * (0.2 + i * 0.3),
        GAME_HEIGHT * (0.3 + Math.sin(i) * 0.2),
        0,
        GAME_WIDTH * (0.2 + i * 0.3),
        GAME_HEIGHT * (0.3 + Math.sin(i) * 0.2),
        200
      );
      nebulaGradient.addColorStop(0, `rgba(${100 + i * 50}, 50, ${200 - i * 30}, 0.2)`);
      nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  private drawForestBackground(ctx: CanvasRenderingContext2D): void {
    // Mystical fog layers
    for (let i = 0; i < 3; i++) {
      const fogY = GAME_HEIGHT * (0.4 + i * 0.15);
      const fogGradient = ctx.createLinearGradient(0, fogY - 50, 0, fogY + 50);
      fogGradient.addColorStop(0, 'rgba(100, 200, 150, 0)');
      fogGradient.addColorStop(0.5, `rgba(100, 200, 150, ${0.1 - i * 0.02})`);
      fogGradient.addColorStop(1, 'rgba(100, 200, 150, 0)');
      ctx.fillStyle = fogGradient;
      ctx.fillRect(0, fogY - 50, GAME_WIDTH, 100);
    }

    // Tree silhouettes
    ctx.fillStyle = 'rgba(10, 30, 20, 0.6)';
    for (let i = 0; i < 8; i++) {
      const treeX = i * 130 + 50;
      const treeHeight = 200 + Math.sin(i * 1.5) * 80;
      this.drawTree(ctx, treeX, GAME_HEIGHT, treeHeight);
    }
  }

  private drawTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    height: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x - height * 0.3, baseY - height * 0.6);
    ctx.lineTo(x - height * 0.15, baseY - height * 0.6);
    ctx.lineTo(x - height * 0.25, baseY - height * 0.8);
    ctx.lineTo(x - height * 0.1, baseY - height * 0.8);
    ctx.lineTo(x, baseY - height);
    ctx.lineTo(x + height * 0.1, baseY - height * 0.8);
    ctx.lineTo(x + height * 0.25, baseY - height * 0.8);
    ctx.lineTo(x + height * 0.15, baseY - height * 0.6);
    ctx.lineTo(x + height * 0.3, baseY - height * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  private renderEffects(ctx: CanvasRenderingContext2D): void {
    const effects = this.config.effects || [];

    if (effects.includes('stars')) {
      this.renderStars(ctx);
    }

    if (this.config.particles) {
      this.renderParticles(ctx);
    }

    if (effects.includes('aurora')) {
      this.renderAurora(ctx);
    }

    if (effects.includes('scanlines')) {
      this.renderScanlines(ctx);
    }

    if (effects.includes('pulse')) {
      this.renderPulse(ctx);
    }
  }

  private renderStars(ctx: CanvasRenderingContext2D): void {
    for (const star of this.stars) {
      const twinkle = Math.sin(this.time * star.twinkleSpeed) * 0.5 + 0.5;
      const brightness = star.brightness * twinkle;

      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Star glow
      if (star.size > 1.5) {
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    const color = this.config.particles?.color || '#ffffff';

    for (const particle of this.particles) {
      ctx.fillStyle = color.replace(')', `, ${particle.opacity})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderAurora(ctx: CanvasRenderingContext2D): void {
    for (const band of this.auroraBands) {
      const wave = Math.sin(this.time * band.speed + band.offset);
      const y = band.y + wave * 20;

      const auroraGradient = ctx.createLinearGradient(0, y, 0, y + band.height);
      auroraGradient.addColorStop(0, `hsla(${band.hue}, 80%, 50%, 0)`);
      auroraGradient.addColorStop(0.5, `hsla(${band.hue}, 80%, 50%, 0.15)`);
      auroraGradient.addColorStop(1, `hsla(${band.hue}, 80%, 50%, 0)`);

      ctx.fillStyle = auroraGradient;

      ctx.beginPath();
      ctx.moveTo(0, y);

      for (let x = 0; x <= GAME_WIDTH; x += 20) {
        const waveY = y + Math.sin(x * 0.01 + this.time * 0.001 + band.offset) * 15;
        ctx.lineTo(x, waveY);
      }

      ctx.lineTo(GAME_WIDTH, y + band.height);
      ctx.lineTo(0, y + band.height);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderScanlines(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      ctx.fillRect(0, y, GAME_WIDTH, 2);
    }
  }

  private renderPulse(ctx: CanvasRenderingContext2D): void {
    const pulse = Math.sin(this.time * ANIMATION.PULSE_SPEED) * 0.5 + 0.5;
    const pulseGradient = ctx.createRadialGradient(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      0,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH / 2
    );
    pulseGradient.addColorStop(0, `rgba(${this.hexToRgb(this.config.accentColor)}, ${pulse * 0.1})`);
    pulseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pulseGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '255, 255, 255';
  }
}
