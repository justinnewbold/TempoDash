import { BackgroundConfig, BgElement } from '../types';
import { CONFIG } from '../constants';

interface NeonShape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'triangle' | 'circle' | 'diamond' | 'hexagon';
  hue: number;
  pulsePhase: number;
}

interface LightBeam {
  x: number;
  angle: number;
  width: number;
  speed: number;
  hue: number;
}

interface NeonSign {
  x: number;
  y: number;
  text: string;
  flickerPhase: number;
  hue: number;
}

// Level 3 cave-specific elements
interface CaveCrystal {
  x: number;
  y: number;
  size: number;
  hue: number;
  pulsePhase: number;
  angle: number;
}

interface CaveMushroom {
  x: number;
  y: number;
  size: number;
  hue: number;
  glowPhase: number;
}

interface WaterDrip {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export class Background {
  private config: BackgroundConfig;
  private bgElements: BgElement[] = [];
  private time = 0;

  // Level 2 neon-specific elements
  private neonShapes: NeonShape[] = [];
  private lightBeams: LightBeam[] = [];
  private neonSigns: NeonSign[] = [];
  private particleRain: { x: number; y: number; speed: number; size: number }[] = [];
  private beatPulse = 0;

  // Level 3 cave-specific elements
  private caveCrystals: CaveCrystal[] = [];
  private caveMushrooms: CaveMushroom[] = [];
  private waterDrips: WaterDrip[] = [];

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

    // Initialize neon-specific elements for Level 2
    if (this.config.type === 'neon') {
      this.initNeonElements();
    }

    // Initialize cave-specific elements for Level 3
    if (this.config.type === 'cave') {
      this.initCaveElements();
    }
  }

  private initCaveElements(): void {
    // Large glowing crystals (background decorations)
    for (let i = 0; i < 10; i++) {
      this.caveCrystals.push({
        x: Math.random() * CONFIG.WIDTH,
        y: 50 + Math.random() * 150,
        size: 20 + Math.random() * 40,
        hue: 180 + Math.random() * 80, // Cyan to purple range
        pulsePhase: Math.random() * Math.PI * 2,
        angle: (Math.random() - 0.5) * 0.5 // Slight tilt
      });
    }

    // Bioluminescent mushrooms along the ground
    for (let i = 0; i < 8; i++) {
      this.caveMushrooms.push({
        x: Math.random() * CONFIG.WIDTH,
        y: CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - 5,
        size: 8 + Math.random() * 12,
        hue: 280 + Math.random() * 60, // Purple to magenta
        glowPhase: Math.random() * Math.PI * 2
      });
    }

    // Water drips from ceiling
    for (let i = 0; i < 15; i++) {
      this.waterDrips.push({
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * (CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT),
        speed: 1.5 + Math.random() * 2,
        size: 1 + Math.random() * 2
      });
    }
  }

  private initNeonElements(): void {
    // Floating geometric shapes
    const shapeTypes: NeonShape['type'][] = ['triangle', 'circle', 'diamond', 'hexagon'];
    for (let i = 0; i < 12; i++) {
      this.neonShapes.push({
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * (CONFIG.HEIGHT * 0.5) + 30,
        size: 15 + Math.random() * 25,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        hue: Math.random() * 60 + 280, // Purple to pink range
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Light beams
    for (let i = 0; i < 4; i++) {
      this.lightBeams.push({
        x: CONFIG.WIDTH * (0.2 + i * 0.2),
        angle: -0.3 + Math.random() * 0.6,
        width: 30 + Math.random() * 20,
        speed: 0.003 + Math.random() * 0.002,
        hue: 280 + Math.random() * 60
      });
    }

    // Neon signs
    const signs = ['NEON', 'DASH', '♪', '★', '◆'];
    for (let i = 0; i < 3; i++) {
      this.neonSigns.push({
        x: 100 + i * 280,
        y: 40 + Math.random() * 30,
        text: signs[Math.floor(Math.random() * signs.length)],
        flickerPhase: Math.random() * 100,
        hue: 300 + Math.random() * 40
      });
    }

    // Particle rain
    for (let i = 0; i < 40; i++) {
      this.particleRain.push({
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * CONFIG.HEIGHT,
        speed: 1 + Math.random() * 2,
        size: 1 + Math.random() * 2
      });
    }
  }

  setBeatPulse(pulse: number): void {
    this.beatPulse = pulse;
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

    // Update neon-specific elements
    if (this.config.type === 'neon') {
      this.updateNeonElements(gameSpeed);
    }

    // Update cave-specific elements
    if (this.config.type === 'cave') {
      this.updateCaveElements(gameSpeed);
    }

    // Decay beat pulse
    this.beatPulse *= 0.9;
  }

  private updateCaveElements(gameSpeed: number): void {
    // Update crystal glow phases
    for (const crystal of this.caveCrystals) {
      crystal.pulsePhase += 0.03 * gameSpeed;
      crystal.x -= 0.3 * gameSpeed;
      if (crystal.x < -60) {
        crystal.x = CONFIG.WIDTH + 60;
        crystal.y = 50 + Math.random() * 150;
        crystal.size = 20 + Math.random() * 40;
      }
    }

    // Update mushroom glow phases
    for (const mushroom of this.caveMushrooms) {
      mushroom.glowPhase += 0.05 * gameSpeed;
      mushroom.x -= 0.5 * gameSpeed;
      if (mushroom.x < -20) {
        mushroom.x = CONFIG.WIDTH + 20;
        mushroom.size = 8 + Math.random() * 12;
      }
    }

    // Update water drips
    for (const drip of this.waterDrips) {
      drip.y += drip.speed * gameSpeed;
      if (drip.y > CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT) {
        drip.y = -10;
        drip.x = Math.random() * CONFIG.WIDTH;
        drip.size = 1 + Math.random() * 2;
      }
    }
  }

  private updateNeonElements(gameSpeed: number): void {
    // Update floating shapes
    for (const shape of this.neonShapes) {
      shape.rotation += shape.rotationSpeed * gameSpeed;
      shape.pulsePhase += 0.05 * gameSpeed;
      shape.x -= 0.5 * gameSpeed;
      if (shape.x < -50) {
        shape.x = CONFIG.WIDTH + 50;
        shape.y = Math.random() * (CONFIG.HEIGHT * 0.5) + 30;
      }
    }

    // Update light beams (sweeping motion)
    for (const beam of this.lightBeams) {
      beam.angle = Math.sin(this.time * beam.speed) * 0.5;
    }

    // Update neon signs
    for (const sign of this.neonSigns) {
      sign.flickerPhase += 0.1 * gameSpeed;
    }

    // Update particle rain
    for (const particle of this.particleRain) {
      particle.y += particle.speed * gameSpeed;
      particle.x -= 0.3 * gameSpeed;
      if (particle.y > CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT) {
        particle.y = -10;
        particle.x = Math.random() * CONFIG.WIDTH;
      }
      if (particle.x < 0) {
        particle.x = CONFIG.WIDTH;
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
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;

    // Ground gradient - customized for cave
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, CONFIG.HEIGHT);

    if (this.config.type === 'cave') {
      // Rocky cave floor gradient
      groundGradient.addColorStop(0, '#1a2838');
      groundGradient.addColorStop(0.3, '#0d1a28');
      groundGradient.addColorStop(1, '#050a10');
    } else {
      groundGradient.addColorStop(0, this.config.groundColor);
      groundGradient.addColorStop(1, this.config.secondaryColor);
    }

    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, CONFIG.WIDTH, CONFIG.GROUND_HEIGHT);

    // Cave-specific ground details
    if (this.config.type === 'cave') {
      this.drawCaveGroundDetails(ctx, groundY, gameRunning, gameSpeed);
    }

    // Ground line
    ctx.strokeStyle = this.config.lineColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = this.config.lineColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CONFIG.WIDTH, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ground pattern lines (skip for cave - it has its own pattern)
    if (this.config.type !== 'cave') {
      ctx.strokeStyle = `${this.config.lineColor}33`;
      ctx.lineWidth = 1;
      const offset = gameRunning ? (this.time / 20 * gameSpeed) % 50 : 0;
      for (let i = 0; i < CONFIG.WIDTH; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i - offset, groundY);
        ctx.lineTo(i - offset + 30, CONFIG.HEIGHT);
        ctx.stroke();
      }
    }
  }

  private drawCaveGroundDetails(ctx: CanvasRenderingContext2D, groundY: number, gameRunning: boolean, gameSpeed: number): void {
    const offset = gameRunning ? (this.time / 15 * gameSpeed) % 80 : 0;

    // Embedded crystals in the ground
    for (let i = 0; i < CONFIG.WIDTH + 80; i += 80) {
      const x = i - offset;
      if (x < -40 || x > CONFIG.WIDTH + 40) continue;

      // Small embedded crystals
      const crystalY = groundY + 15 + Math.sin(i * 0.1) * 5;
      const crystalSize = 8 + Math.sin(i * 0.2) * 3;
      const hue = 180 + (i % 60);
      const pulse = Math.sin(this.time * 0.003 + i * 0.1) * 0.3 + 0.7 + this.beatPulse * 0.2;

      // Crystal glow
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 8 * pulse;

      // Crystal shape
      const crystalGradient = ctx.createLinearGradient(x, crystalY + crystalSize, x, crystalY - crystalSize);
      crystalGradient.addColorStop(0, `hsla(${hue}, 60%, 20%, 0.6)`);
      crystalGradient.addColorStop(0.5, `hsla(${hue}, 80%, 40%, ${0.5 * pulse})`);
      crystalGradient.addColorStop(1, `hsla(${hue}, 100%, 60%, ${0.8 * pulse})`);

      ctx.fillStyle = crystalGradient;
      ctx.beginPath();
      ctx.moveTo(x, crystalY - crystalSize);
      ctx.lineTo(x + crystalSize * 0.4, crystalY);
      ctx.lineTo(x, crystalY + crystalSize * 0.3);
      ctx.lineTo(x - crystalSize * 0.4, crystalY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Rocky texture lines
    ctx.strokeStyle = 'rgba(100, 130, 160, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CONFIG.WIDTH + 60; i += 60) {
      const x = i - offset * 0.8;
      if (x < -30 || x > CONFIG.WIDTH + 30) continue;

      // Jagged rock lines
      ctx.beginPath();
      ctx.moveTo(x, groundY + 5);
      ctx.lineTo(x + 10, groundY + 20 + Math.sin(i) * 8);
      ctx.lineTo(x + 25, groundY + 35);
      ctx.lineTo(x + 40, groundY + 50 + Math.cos(i) * 10);
      ctx.stroke();
    }

    // Small pebbles/stones
    ctx.fillStyle = 'rgba(60, 80, 100, 0.4)';
    for (let i = 0; i < CONFIG.WIDTH + 40; i += 40) {
      const x = (i - offset * 1.2 + 1000) % (CONFIG.WIDTH + 40);
      const stoneY = groundY + 25 + Math.sin(i * 0.3) * 15;
      const stoneSize = 3 + Math.sin(i * 0.5) * 2;

      ctx.beginPath();
      ctx.ellipse(x, stoneY, stoneSize, stoneSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
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
    // Light beams (behind everything)
    this.drawLightBeams(ctx);

    // Particle rain
    this.drawParticleRain(ctx);

    // Synthwave sun with beat pulse
    const sunX = CONFIG.WIDTH / 2;
    const sunY = CONFIG.HEIGHT * 0.5;
    const sunRadius = 100 + this.beatPulse * 10;

    // Sun glow - pulses with beat
    const glowSize = sunRadius * 2 + this.beatPulse * 30;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowSize);
    sunGlow.addColorStop(0, `rgba(255, 100, 50, ${0.4 + this.beatPulse * 0.2})`);
    sunGlow.addColorStop(0.5, `rgba(255, 0, 100, ${0.2 + this.beatPulse * 0.1})`);
    sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, glowSize, 0, Math.PI * 2);
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

    // Floating geometric shapes
    this.drawNeonShapes(ctx);

    // Neon signs
    this.drawNeonSigns(ctx);
  }

  private drawLightBeams(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const beam of this.lightBeams) {
      const gradient = ctx.createLinearGradient(
        beam.x, CONFIG.HEIGHT,
        beam.x + Math.sin(beam.angle) * 300, 0
      );
      gradient.addColorStop(0, `hsla(${beam.hue}, 100%, 50%, ${0.1 + this.beatPulse * 0.1})`);
      gradient.addColorStop(0.5, `hsla(${beam.hue}, 100%, 50%, ${0.05 + this.beatPulse * 0.05})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(beam.x - beam.width / 2, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT);
      ctx.lineTo(beam.x + Math.sin(beam.angle) * 400 - beam.width * 2, 0);
      ctx.lineTo(beam.x + Math.sin(beam.angle) * 400 + beam.width * 2, 0);
      ctx.lineTo(beam.x + beam.width / 2, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawParticleRain(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = `rgba(255, 0, 255, ${0.3 + this.beatPulse * 0.2})`;
    for (const particle of this.particleRain) {
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size * 3);
    }
  }

  private drawNeonShapes(ctx: CanvasRenderingContext2D): void {
    for (const shape of this.neonShapes) {
      const pulse = Math.sin(shape.pulsePhase) * 0.3 + 0.7 + this.beatPulse * 0.3;
      const size = shape.size * (0.9 + pulse * 0.2);

      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);

      ctx.strokeStyle = `hsla(${shape.hue}, 100%, 60%, ${pulse * 0.8})`;
      ctx.shadowColor = `hsl(${shape.hue}, 100%, 50%)`;
      ctx.shadowBlur = 10 + this.beatPulse * 10;
      ctx.lineWidth = 2;

      ctx.beginPath();
      switch (shape.type) {
        case 'triangle':
          ctx.moveTo(0, -size);
          ctx.lineTo(size * 0.866, size * 0.5);
          ctx.lineTo(-size * 0.866, size * 0.5);
          ctx.closePath();
          break;
        case 'circle':
          ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
          break;
        case 'diamond':
          ctx.moveTo(0, -size);
          ctx.lineTo(size * 0.6, 0);
          ctx.lineTo(0, size);
          ctx.lineTo(-size * 0.6, 0);
          ctx.closePath();
          break;
        case 'hexagon':
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = Math.cos(angle) * size * 0.6;
            const py = Math.sin(angle) * size * 0.6;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
      }
      ctx.stroke();

      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  private drawNeonSigns(ctx: CanvasRenderingContext2D): void {
    for (const sign of this.neonSigns) {
      // Flicker effect
      const flicker = Math.sin(sign.flickerPhase * 3) > -0.8 ? 1 : 0.3;
      const brightness = flicker * (0.8 + this.beatPulse * 0.2);

      ctx.save();
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';

      // Glow
      ctx.shadowColor = `hsl(${sign.hue}, 100%, 50%)`;
      ctx.shadowBlur = 15 + this.beatPulse * 10;
      ctx.fillStyle = `hsla(${sign.hue}, 100%, 70%, ${brightness})`;
      ctx.fillText(sign.text, sign.x, sign.y);

      // Bright center
      ctx.shadowBlur = 5;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
      ctx.fillText(sign.text, sign.x, sign.y);

      ctx.restore();
    }
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
    // Dark cave atmosphere overlay
    const atmosphereGradient = ctx.createRadialGradient(
      CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.3, 50,
      CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.3, CONFIG.WIDTH
    );
    atmosphereGradient.addColorStop(0, 'rgba(30, 50, 80, 0.1)');
    atmosphereGradient.addColorStop(1, 'rgba(0, 0, 10, 0.4)');
    ctx.fillStyle = atmosphereGradient;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    // Stalactites from ceiling with detail
    for (let i = 0; i < 15; i++) {
      const x = (CONFIG.WIDTH / 15) * i + 30;
      const height = 30 + Math.sin(i * 1.2) * 25 + Math.cos(i * 0.8) * 15;

      // Stalactite gradient
      const stalGradient = ctx.createLinearGradient(x, 0, x, height);
      stalGradient.addColorStop(0, '#1a2a3d');
      stalGradient.addColorStop(0.5, '#0d1a2d');
      stalGradient.addColorStop(1, '#0a1520');

      ctx.fillStyle = stalGradient;
      ctx.beginPath();
      ctx.moveTo(x - 12, 0);
      ctx.quadraticCurveTo(x - 6, height * 0.4, x, height);
      ctx.quadraticCurveTo(x + 6, height * 0.4, x + 12, 0);
      ctx.fill();

      // Highlight on stalactite
      ctx.strokeStyle = 'rgba(100, 150, 180, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 8, 0);
      ctx.quadraticCurveTo(x - 4, height * 0.3, x - 1, height * 0.8);
      ctx.stroke();
    }

    // Draw water drips
    this.drawWaterDrips(ctx);

    // Draw animated glowing crystals
    this.drawCaveCrystals(ctx);

    // Draw bioluminescent mushrooms
    this.drawCaveMushrooms(ctx);

    // Ambient crystal light pools on ground
    for (let i = 0; i < 6; i++) {
      const poolX = (CONFIG.WIDTH / 6) * i + 70;
      const poolY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - 2;
      const poolGlow = ctx.createRadialGradient(poolX, poolY, 0, poolX, poolY, 40);
      const hue = 200 + i * 15;
      poolGlow.addColorStop(0, `hsla(${hue}, 80%, 50%, ${0.15 + this.beatPulse * 0.1})`);
      poolGlow.addColorStop(0.5, `hsla(${hue}, 70%, 40%, 0.05)`);
      poolGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = poolGlow;
      ctx.fillRect(poolX - 50, poolY - 30, 100, 35);
    }

    // Cave mist effect at bottom
    const mistGradient = ctx.createLinearGradient(0, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - 60, 0, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT);
    mistGradient.addColorStop(0, 'transparent');
    mistGradient.addColorStop(0.5, 'rgba(150, 180, 200, 0.05)');
    mistGradient.addColorStop(1, 'rgba(100, 150, 180, 0.1)');
    ctx.fillStyle = mistGradient;
    ctx.fillRect(0, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - 60, CONFIG.WIDTH, 60);
  }

  private drawCaveCrystals(ctx: CanvasRenderingContext2D): void {
    for (const crystal of this.caveCrystals) {
      const pulse = Math.sin(crystal.pulsePhase) * 0.3 + 0.7 + this.beatPulse * 0.3;
      const size = crystal.size * (0.9 + pulse * 0.15);

      ctx.save();
      ctx.translate(crystal.x, crystal.y);
      ctx.rotate(crystal.angle);

      // Crystal glow aura
      ctx.shadowColor = `hsl(${crystal.hue}, 100%, 60%)`;
      ctx.shadowBlur = 20 * pulse + this.beatPulse * 15;

      // Main crystal body
      const crystalGradient = ctx.createLinearGradient(-size / 2, size, size / 2, -size);
      crystalGradient.addColorStop(0, `hsla(${crystal.hue}, 70%, 20%, 0.8)`);
      crystalGradient.addColorStop(0.4, `hsla(${crystal.hue}, 80%, 40%, ${0.6 * pulse})`);
      crystalGradient.addColorStop(0.8, `hsla(${crystal.hue}, 90%, 60%, ${0.8 * pulse})`);
      crystalGradient.addColorStop(1, `hsla(${crystal.hue}, 100%, 80%, ${pulse})`);

      ctx.fillStyle = crystalGradient;
      ctx.beginPath();
      // Crystal shape - hexagonal prism look
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.3, -size * 0.6);
      ctx.lineTo(size * 0.35, size * 0.3);
      ctx.lineTo(0, size * 0.5);
      ctx.lineTo(-size * 0.35, size * 0.3);
      ctx.lineTo(-size * 0.3, -size * 0.6);
      ctx.closePath();
      ctx.fill();

      // Crystal highlight
      ctx.fillStyle = `hsla(${crystal.hue}, 100%, 90%, ${0.3 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, -size * 0.8);
      ctx.lineTo(size * 0.15, -size * 0.5);
      ctx.lineTo(size * 0.1, -size * 0.2);
      ctx.lineTo(-size * 0.15, -size * 0.4);
      ctx.closePath();
      ctx.fill();

      // Bright tip
      ctx.fillStyle = `hsla(${crystal.hue}, 100%, 95%, ${pulse})`;
      ctx.beginPath();
      ctx.arc(0, -size * 0.9, 3 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  private drawCaveMushrooms(ctx: CanvasRenderingContext2D): void {
    for (const mushroom of this.caveMushrooms) {
      const glow = Math.sin(mushroom.glowPhase) * 0.4 + 0.6 + this.beatPulse * 0.2;
      const size = mushroom.size;

      ctx.save();
      ctx.translate(mushroom.x, mushroom.y);

      // Mushroom glow
      ctx.shadowColor = `hsl(${mushroom.hue}, 100%, 60%)`;
      ctx.shadowBlur = 12 * glow;

      // Stem
      ctx.fillStyle = `hsla(${mushroom.hue - 30}, 40%, 30%, 0.8)`;
      ctx.fillRect(-size * 0.15, -size * 0.6, size * 0.3, size * 0.7);

      // Cap
      const capGradient = ctx.createRadialGradient(0, -size * 0.8, 0, 0, -size * 0.8, size * 0.6);
      capGradient.addColorStop(0, `hsla(${mushroom.hue}, 80%, 60%, ${glow})`);
      capGradient.addColorStop(0.5, `hsla(${mushroom.hue}, 70%, 40%, ${0.8 * glow})`);
      capGradient.addColorStop(1, `hsla(${mushroom.hue}, 60%, 25%, 0.7)`);

      ctx.fillStyle = capGradient;
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.6, size * 0.5, size * 0.35, 0, Math.PI, 0);
      ctx.fill();

      // Glowing spots on cap
      ctx.fillStyle = `hsla(${mushroom.hue + 20}, 100%, 80%, ${glow * 0.8})`;
      for (let i = 0; i < 3; i++) {
        const spotX = (i - 1) * size * 0.25;
        const spotY = -size * 0.7 - Math.abs(i - 1) * size * 0.1;
        ctx.beginPath();
        ctx.arc(spotX, spotY, 2 + glow, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  private drawWaterDrips(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = `rgba(150, 200, 255, ${0.5 + this.beatPulse * 0.2})`;
    for (const drip of this.waterDrips) {
      // Elongated droplet shape
      ctx.beginPath();
      ctx.ellipse(drip.x, drip.y, drip.size, drip.size * 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Small splash effect when near ground
      const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
      if (drip.y > groundY - 20 && drip.y < groundY) {
        const splashProgress = (drip.y - (groundY - 20)) / 20;
        ctx.globalAlpha = 1 - splashProgress;
        ctx.beginPath();
        ctx.arc(drip.x, groundY - 2, 3 * splashProgress, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
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
