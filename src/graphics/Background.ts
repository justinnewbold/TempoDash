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

interface Crystal {
  x: number;
  y: number;
  size: number;
  rotation: number;
  hue: number;
}

interface LightningBolt {
  x: number;
  active: boolean;
  timer: number;
  segments: { x: number; y: number }[];
}

interface DataStream {
  x: number;
  chars: string[];
  speed: number;
  offset: number;
}

interface StormCloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
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
  private auroraBands: AuroraBand[] = [];
  private crystals: Crystal[] = [];
  private lightningBolts: LightningBolt[] = [];
  private dataStreams: DataStream[] = [];
  private stormClouds: StormCloud[] = [];

  // Level 2 specific
  private sunY = GAME_HEIGHT * 0.65;
  private mountainPoints: number[][] = [];

  // Glitch effect
  private glitchTimer = 0;
  private glitchActive = false;
  private glitchOffset = 0;

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

    if (effects.includes('aurora')) {
      this.initializeAurora();
    }

    if (effects.includes('crystals')) {
      this.initializeCrystals();
    }

    if (effects.includes('lightning')) {
      this.initializeLightning();
    }

    if (effects.includes('datastream')) {
      this.initializeDataStreams();
    }

    if (effects.includes('stormclouds')) {
      this.initializeStormClouds();
    }

    if (effects.includes('circuitboard')) {
      this.initializeGrid(); // Reuse grid for circuit effect
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
        y: Math.random() * GAME_HEIGHT * 0.7,
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
        speed: Math.random() * (this.config.particles?.speed || 50) + 20,
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

  private initializeCrystals(): void {
    for (let i = 0; i < 15; i++) {
      this.crystals.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT * 0.8 + GAME_HEIGHT * 0.1,
        size: Math.random() * 40 + 20,
        rotation: Math.random() * Math.PI * 2,
        hue: Math.random() * 60 + 260, // Purple to cyan range
      });
    }
  }

  private initializeLightning(): void {
    for (let i = 0; i < 3; i++) {
      this.lightningBolts.push({
        x: GAME_WIDTH * (0.2 + i * 0.3),
        active: false,
        timer: Math.random() * 5000,
        segments: [],
      });
    }
  }

  private initializeDataStreams(): void {
    const chars = '01アイウエオカキクケコサシスセソタチツテト';
    for (let i = 0; i < 20; i++) {
      const streamChars: string[] = [];
      for (let j = 0; j < 15; j++) {
        streamChars.push(chars[Math.floor(Math.random() * chars.length)]);
      }
      this.dataStreams.push({
        x: (GAME_WIDTH / 20) * i + 20,
        chars: streamChars,
        speed: Math.random() * 100 + 50,
        offset: Math.random() * GAME_HEIGHT,
      });
    }
  }

  private initializeStormClouds(): void {
    for (let i = 0; i < 8; i++) {
      this.stormClouds.push({
        x: Math.random() * GAME_WIDTH * 1.5 - GAME_WIDTH * 0.25,
        y: Math.random() * GAME_HEIGHT * 0.3,
        width: Math.random() * 200 + 100,
        height: Math.random() * 60 + 40,
        speed: Math.random() * 20 + 10,
      });
    }
  }

  private initializeMountains(): void {
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

    this.updateParticles(deltaTime);
    this.updateGrid(deltaTime);
    this.updateLightning(deltaTime);
    this.updateDataStreams(deltaTime);
    this.updateStormClouds(deltaTime);
    this.updateGlitch(deltaTime);
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

  private updateLightning(deltaTime: number): void {
    for (const bolt of this.lightningBolts) {
      bolt.timer -= deltaTime;
      if (bolt.timer <= 0) {
        bolt.active = true;
        bolt.timer = Math.random() * 4000 + 2000;
        // Generate lightning segments
        bolt.segments = [];
        let y = 0;
        let x = bolt.x;
        while (y < GAME_HEIGHT * 0.6) {
          bolt.segments.push({ x, y });
          y += Math.random() * 30 + 10;
          x += (Math.random() - 0.5) * 40;
        }
        setTimeout(() => {
          bolt.active = false;
        }, 150);
      }
    }
  }

  private updateDataStreams(deltaTime: number): void {
    for (const stream of this.dataStreams) {
      stream.offset += stream.speed * (deltaTime / 1000);
      if (stream.offset > GAME_HEIGHT + 200) {
        stream.offset = -200;
      }
    }
  }

  private updateStormClouds(deltaTime: number): void {
    for (const cloud of this.stormClouds) {
      cloud.x += cloud.speed * (deltaTime / 1000);
      if (cloud.x > GAME_WIDTH + cloud.width) {
        cloud.x = -cloud.width;
      }
    }
  }

  private updateGlitch(deltaTime: number): void {
    if (this.config.effects?.includes('glitcheffect')) {
      this.glitchTimer -= deltaTime;
      if (this.glitchTimer <= 0) {
        this.glitchActive = !this.glitchActive;
        this.glitchTimer = this.glitchActive ? 50 + Math.random() * 100 : 500 + Math.random() * 2000;
        this.glitchOffset = this.glitchActive ? (Math.random() - 0.5) * 20 : 0;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Apply glitch offset
    if (this.glitchActive) {
      ctx.translate(this.glitchOffset, 0);
    }

    this.drawBaseGradient(ctx);

    switch (this.config.type) {
      case 'city':
        this.drawCityBackground(ctx);
        break;
      case 'neon':
        this.drawNeonBackground(ctx);
        break;
      case 'crystal':
        this.drawCrystalBackground(ctx);
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

    this.renderEffects(ctx);

    ctx.restore();
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
    ctx.fillStyle = 'rgba(20, 30, 50, 0.8)';

    for (let i = 0; i < 15; i++) {
      const x = i * 70 - 20;
      const width = 50 + Math.random() * 30;
      const height = 100 + Math.sin(i * 0.7) * 80;
      ctx.fillRect(x, GAME_HEIGHT - height, width, height);

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
    const sunX = GAME_WIDTH / 2;
    const sunRadius = 120;

    const sunGlow = ctx.createRadialGradient(sunX, this.sunY, 0, sunX, this.sunY, sunRadius * 2);
    sunGlow.addColorStop(0, 'rgba(255, 100, 50, 0.5)');
    sunGlow.addColorStop(0.5, 'rgba(255, 50, 100, 0.2)');
    sunGlow.addColorStop(1, 'rgba(255, 0, 150, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, this.sunY, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, this.sunY, sunRadius, 0, Math.PI * 2);
    ctx.clip();

    const sunGradient = ctx.createLinearGradient(sunX, this.sunY - sunRadius, sunX, this.sunY + sunRadius);
    sunGradient.addColorStop(0, '#ff6b35');
    sunGradient.addColorStop(0.5, '#ff0066');
    sunGradient.addColorStop(1, '#9933ff');
    ctx.fillStyle = sunGradient;
    ctx.fillRect(sunX - sunRadius, this.sunY - sunRadius, sunRadius * 2, sunRadius * 2);

    ctx.fillStyle = this.config.primaryColor;
    for (let i = 0; i < 8; i++) {
      const lineY = this.sunY + i * 20 - 20;
      const lineHeight = 4 + i * 2;
      ctx.fillRect(sunX - sunRadius, lineY, sunRadius * 2, lineHeight);
    }
    ctx.restore();

    this.drawNeonMountains(ctx);
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

      ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 - layer * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 2) {
        if (i === 0) ctx.moveTo(points[i], points[i + 1]);
        else ctx.lineTo(points[i], points[i + 1]);
      }
      ctx.stroke();
    }
  }

  private drawPerspectiveGrid(ctx: CanvasRenderingContext2D): void {
    const horizonY = GAME_HEIGHT * 0.55;
    const vanishX = GAME_WIDTH / 2;

    ctx.strokeStyle = COLORS.LEVEL2.grid;
    ctx.lineWidth = 1;

    for (const line of this.gridLines) {
      if (line.y > horizonY) {
        const progress = (line.y - horizonY) / (GAME_HEIGHT - horizonY);
        ctx.globalAlpha = progress * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, line.y);
        ctx.lineTo(GAME_WIDTH, line.y);
        ctx.stroke();
      }
    }

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

  private drawCrystalBackground(ctx: CanvasRenderingContext2D): void {
    // Cave walls
    ctx.fillStyle = '#150820';

    // Stalactites
    for (let i = 0; i < 12; i++) {
      const x = (GAME_WIDTH / 12) * i + 40;
      const height = 50 + Math.sin(i * 1.2) * 40;
      ctx.beginPath();
      ctx.moveTo(x - 20, 0);
      ctx.lineTo(x, height);
      ctx.lineTo(x + 20, 0);
      ctx.fill();
    }

    // Stalagmites
    for (let i = 0; i < 10; i++) {
      const x = (GAME_WIDTH / 10) * i + 30;
      const height = 40 + Math.cos(i * 1.5) * 30;
      ctx.beginPath();
      ctx.moveTo(x - 15, GAME_HEIGHT);
      ctx.lineTo(x, GAME_HEIGHT - height);
      ctx.lineTo(x + 15, GAME_HEIGHT);
      ctx.fill();
    }

    // Underground lake reflection
    const lakeY = GAME_HEIGHT * 0.85;
    const lakeGradient = ctx.createLinearGradient(0, lakeY, 0, GAME_HEIGHT);
    lakeGradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
    lakeGradient.addColorStop(1, 'rgba(100, 50, 200, 0.2)');
    ctx.fillStyle = lakeGradient;
    ctx.fillRect(0, lakeY, GAME_WIDTH, GAME_HEIGHT - lakeY);
  }

  private drawSpaceBackground(ctx: CanvasRenderingContext2D): void {
    // Nebula clouds
    for (let i = 0; i < 4; i++) {
      const nebulaGradient = ctx.createRadialGradient(
        GAME_WIDTH * (0.15 + i * 0.25),
        GAME_HEIGHT * (0.25 + Math.sin(i) * 0.15),
        0,
        GAME_WIDTH * (0.15 + i * 0.25),
        GAME_HEIGHT * (0.25 + Math.sin(i) * 0.15),
        180
      );
      const hue = 220 + i * 40;
      nebulaGradient.addColorStop(0, `hsla(${hue}, 70%, 40%, 0.25)`);
      nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Distant planet
    const planetX = GAME_WIDTH * 0.85;
    const planetY = GAME_HEIGHT * 0.25;
    const planetGradient = ctx.createRadialGradient(
      planetX - 15, planetY - 15, 0,
      planetX, planetY, 50
    );
    planetGradient.addColorStop(0, '#6366f1');
    planetGradient.addColorStop(0.7, '#4338ca');
    planetGradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = planetGradient;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 50, 0, Math.PI * 2);
    ctx.fill();

    // Planet ring
    ctx.strokeStyle = 'rgba(199, 210, 254, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 75, 15, 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawStormBackground(ctx: CanvasRenderingContext2D): void {
    // Dark stormy gradient already applied by base gradient

    // Storm clouds rendered in effects
  }

  private drawDigitalBackground(ctx: CanvasRenderingContext2D): void {
    // Circuit board pattern
    ctx.strokeStyle = COLORS.LEVEL6.circuit;
    ctx.lineWidth = 1;

    // Horizontal circuit lines
    for (let y = 50; y < GAME_HEIGHT; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      let x = 0;
      while (x < GAME_WIDTH) {
        const segLength = Math.random() * 100 + 50;
        x += segLength;
        ctx.lineTo(Math.min(x, GAME_WIDTH), y);
        if (Math.random() > 0.7 && x < GAME_WIDTH) {
          const turnLength = Math.random() * 30 + 10;
          ctx.lineTo(x, y + turnLength);
          ctx.lineTo(x + 20, y + turnLength);
          ctx.lineTo(x + 20, y);
          x += 20;
        }
      }
      ctx.stroke();
    }

    // Circuit nodes
    ctx.fillStyle = COLORS.LEVEL6.data;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderEffects(ctx: CanvasRenderingContext2D): void {
    const effects = this.config.effects || [];

    if (effects.includes('stars')) {
      this.renderStars(ctx);
    }

    if (effects.includes('nebula')) {
      this.renderNebula(ctx);
    }

    if (effects.includes('crystals')) {
      this.renderCrystals(ctx);
    }

    if (effects.includes('stormclouds')) {
      this.renderStormClouds(ctx);
    }

    if (effects.includes('lightning')) {
      this.renderLightning(ctx);
    }

    if (effects.includes('datastream')) {
      this.renderDataStreams(ctx);
    }

    if (effects.includes('circuitboard')) {
      this.renderCircuitPulse(ctx);
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

    if (effects.includes('rain')) {
      this.renderRain(ctx);
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

      if (star.size > 1.5) {
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderNebula(ctx: CanvasRenderingContext2D): void {
    const pulse = Math.sin(this.time * 0.001) * 0.1 + 0.9;
    for (let i = 0; i < 3; i++) {
      const nebulaGradient = ctx.createRadialGradient(
        GAME_WIDTH * (0.2 + i * 0.3),
        GAME_HEIGHT * (0.3 + Math.sin(i + this.time * 0.0005) * 0.1),
        0,
        GAME_WIDTH * (0.2 + i * 0.3),
        GAME_HEIGHT * (0.3 + Math.sin(i + this.time * 0.0005) * 0.1),
        150 * pulse
      );
      nebulaGradient.addColorStop(0, `rgba(139, 92, 246, ${0.15 * pulse})`);
      nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  private renderCrystals(ctx: CanvasRenderingContext2D): void {
    for (const crystal of this.crystals) {
      ctx.save();
      ctx.translate(crystal.x, crystal.y);
      ctx.rotate(crystal.rotation + Math.sin(this.time * 0.001) * 0.1);

      // Crystal glow
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, crystal.size);
      glow.addColorStop(0, `hsla(${crystal.hue}, 80%, 60%, 0.3)`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, crystal.size, 0, Math.PI * 2);
      ctx.fill();

      // Crystal shape
      ctx.fillStyle = `hsla(${crystal.hue}, 70%, 50%, 0.6)`;
      ctx.beginPath();
      ctx.moveTo(0, -crystal.size * 0.6);
      ctx.lineTo(crystal.size * 0.3, 0);
      ctx.lineTo(0, crystal.size * 0.6);
      ctx.lineTo(-crystal.size * 0.3, 0);
      ctx.closePath();
      ctx.fill();

      // Crystal highlight
      ctx.fillStyle = `hsla(${crystal.hue}, 90%, 80%, 0.4)`;
      ctx.beginPath();
      ctx.moveTo(0, -crystal.size * 0.5);
      ctx.lineTo(crystal.size * 0.1, -crystal.size * 0.2);
      ctx.lineTo(-crystal.size * 0.1, -crystal.size * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  private renderStormClouds(ctx: CanvasRenderingContext2D): void {
    for (const cloud of this.stormClouds) {
      ctx.fillStyle = 'rgba(50, 50, 70, 0.8)';

      // Multiple ellipses for cloud shape
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.width * 0.4, cloud.height * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cloud.x + cloud.width * 0.3, cloud.y - cloud.height * 0.1, cloud.width * 0.35, cloud.height * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cloud.x - cloud.width * 0.25, cloud.y + cloud.height * 0.1, cloud.width * 0.3, cloud.height * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderLightning(ctx: CanvasRenderingContext2D): void {
    for (const bolt of this.lightningBolts) {
      if (bolt.active && bolt.segments.length > 0) {
        // Lightning glow
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
        for (let i = 1; i < bolt.segments.length; i++) {
          ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
        }
        ctx.stroke();

        // Screen flash
        ctx.fillStyle = 'rgba(255, 255, 200, 0.1)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.shadowBlur = 0;
      }
    }
  }

  private renderDataStreams(ctx: CanvasRenderingContext2D): void {
    ctx.font = '14px monospace';

    for (const stream of this.dataStreams) {
      for (let i = 0; i < stream.chars.length; i++) {
        const y = stream.offset + i * 20;
        if (y >= -20 && y <= GAME_HEIGHT + 20) {
          const alpha = i === 0 ? 1 : 0.3 + (1 - i / stream.chars.length) * 0.5;
          ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
          ctx.fillText(stream.chars[i], stream.x, y);
        }
      }
    }
  }

  private renderCircuitPulse(ctx: CanvasRenderingContext2D): void {
    const pulsePos = (this.time * 0.1) % GAME_WIDTH;

    ctx.strokeStyle = COLORS.LEVEL6.data;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.LEVEL6.data;
    ctx.shadowBlur = 10;

    // Animated pulse along circuit lines
    for (let y = 50; y < GAME_HEIGHT; y += 80) {
      const startX = Math.max(0, pulsePos - 50);
      const endX = Math.min(GAME_WIDTH, pulsePos + 50);

      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
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

  private renderRain(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(200, 200, 255, 0.3)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 100; i++) {
      const x = (i * 10 + this.time * 0.5) % GAME_WIDTH;
      const y = (i * 7 + this.time * 0.8) % GAME_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 15);
      ctx.stroke();
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '255, 255, 255';
  }
}
