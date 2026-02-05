import { BackgroundConfig } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, ANIMATION, COLORS } from '../constants';
import { performanceManager } from '../systems/PerformanceManager';

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

interface Ember {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  brightness: number;
}

interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
}

interface LavaFlow {
  x: number;
  width: number;
  speed: number;
  offset: number;
}

interface Coral {
  x: number;
  height: number;
  width: number;
  branches: number;
  hue: number;
}

interface Fish {
  x: number;
  y: number;
  speed: number;
  size: number;
  hue: number;
  direction: number;
}

export class Background {
  private config: BackgroundConfig;
  private time = 0;

  // Cached gradients (lazy initialized on first render)
  private cachedBaseGradient: CanvasGradient | null = null;
  private cachedCtx: CanvasRenderingContext2D | null = null;

  // Cached scanlines pattern for performance
  private cachedScanlinesPattern: CanvasPattern | null = null;
  private cachedScanlinesCtx: CanvasRenderingContext2D | null = null;

  // Effect-specific data
  private stars: Star[] = [];
  private particles: Particle[] = [];
  private gridLines: GridLine[] = [];
  private wavePoints: WavePoint[] = [];
  private auroraBands: AuroraBand[] = [];

  // Level 2 specific
  private sunY = GAME_HEIGHT * 0.65;
  private mountainPoints: number[][] = [];

  // Volcano specific
  private embers: Ember[] = [];
  private lavaFlows: LavaFlow[] = [];
  private volcanoPoints: number[] = [];

  // Ocean specific
  private bubbles: Bubble[] = [];
  private corals: Coral[] = [];
  private fish: Fish[] = [];
  private causticPhase = 0;

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

    if (effects.includes('embers')) {
      this.initializeEmbers();
    }

    if (effects.includes('bubbles')) {
      this.initializeBubbles();
    }

    // Level 2 neon background mountains
    if (this.config.type === 'neon') {
      this.initializeMountains();
    }

    // Level 5 volcano
    if (this.config.type === 'volcano') {
      this.initializeVolcano();
    }

    // Level 6 ocean
    if (this.config.type === 'ocean') {
      this.initializeOcean();
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

  private initializeEmbers(): void {
    for (let i = 0; i < 50; i++) {
      this.embers.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 80 + 40,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 2 + 1,
        brightness: Math.random() * 0.5 + 0.5,
      });
    }
  }

  private initializeBubbles(): void {
    for (let i = 0; i < 30; i++) {
      this.bubbles.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 15 + 5,
        speed: Math.random() * 40 + 20,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.2,
      });
    }
  }

  private initializeVolcano(): void {
    // Volcano silhouette points
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      const x = (GAME_WIDTH / segments) * i;
      let y = GAME_HEIGHT * 0.6;

      // Create volcano shape in the center
      const centerDist = Math.abs(i - segments / 2) / (segments / 2);
      if (centerDist < 0.4) {
        // Volcano peak
        y = GAME_HEIGHT * 0.25 + centerDist * 200;
      } else {
        // Slopes
        y = GAME_HEIGHT * 0.5 + Math.sin(i * 0.5) * 30;
      }
      this.volcanoPoints.push(x, y);
    }

    // Lava flows
    for (let i = 0; i < 5; i++) {
      this.lavaFlows.push({
        x: GAME_WIDTH * 0.4 + Math.random() * GAME_WIDTH * 0.2,
        width: Math.random() * 20 + 10,
        speed: Math.random() * 0.5 + 0.3,
        offset: Math.random() * Math.PI * 2,
      });
    }

    // Initialize embers for volcano
    this.initializeEmbers();
  }

  private initializeOcean(): void {
    // Coral formations
    for (let i = 0; i < 8; i++) {
      this.corals.push({
        x: i * (GAME_WIDTH / 6) + Math.random() * 80,
        height: Math.random() * 100 + 60,
        width: Math.random() * 40 + 20,
        branches: Math.floor(Math.random() * 4) + 2,
        hue: Math.random() * 60 + 300, // Pink/purple/coral colors
      });
    }

    // Fish
    for (let i = 0; i < 12; i++) {
      this.fish.push({
        x: Math.random() * GAME_WIDTH * 2,
        y: Math.random() * GAME_HEIGHT * 0.6 + GAME_HEIGHT * 0.1,
        speed: Math.random() * 30 + 20,
        size: Math.random() * 10 + 5,
        hue: Math.random() * 360,
        direction: Math.random() > 0.5 ? 1 : -1,
      });
    }

    // Initialize bubbles for ocean
    this.initializeBubbles();
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.causticPhase += deltaTime * 0.001;

    // Update particles
    this.updateParticles(deltaTime);

    // Update grid
    this.updateGrid(deltaTime);

    // Update embers
    this.updateEmbers(deltaTime);

    // Update bubbles
    this.updateBubbles(deltaTime);

    // Update fish
    this.updateFish(deltaTime);
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

  private updateEmbers(deltaTime: number): void {
    for (const ember of this.embers) {
      ember.y -= ember.speed * (deltaTime / 1000);
      ember.wobble += ember.wobbleSpeed * (deltaTime / 1000);
      ember.x += Math.sin(ember.wobble) * 0.5;

      if (ember.y < -20) {
        ember.y = GAME_HEIGHT + 20;
        ember.x = Math.random() * GAME_WIDTH;
      }
    }
  }

  private updateBubbles(deltaTime: number): void {
    for (const bubble of this.bubbles) {
      bubble.y -= bubble.speed * (deltaTime / 1000);
      bubble.wobble += bubble.wobbleSpeed * (deltaTime / 1000);
      bubble.x += Math.sin(bubble.wobble) * 0.8;

      if (bubble.y < -bubble.size) {
        bubble.y = GAME_HEIGHT + bubble.size;
        bubble.x = Math.random() * GAME_WIDTH;
      }
    }
  }

  private updateFish(deltaTime: number): void {
    for (const fish of this.fish) {
      fish.x += fish.speed * fish.direction * (deltaTime / 1000);

      // Wrap around screen
      if (fish.direction > 0 && fish.x > GAME_WIDTH + 50) {
        fish.x = -50;
        fish.y = Math.random() * GAME_HEIGHT * 0.5 + GAME_HEIGHT * 0.1;
      } else if (fish.direction < 0 && fish.x < -50) {
        fish.x = GAME_WIDTH + 50;
        fish.y = Math.random() * GAME_HEIGHT * 0.5 + GAME_HEIGHT * 0.1;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number = 0): void {
    // Draw base gradient
    this.drawBaseGradient(ctx);

    // Draw type-specific background with parallax
    switch (this.config.type) {
      case 'city':
        this.drawCityBackground(ctx, cameraX);
        break;
      case 'neon':
        this.drawNeonBackground(ctx, cameraX);
        break;
      case 'space':
        this.drawSpaceBackground(ctx);
        break;
      case 'forest':
        this.drawForestBackground(ctx, cameraX);
        break;
      case 'volcano':
        this.drawVolcanoBackground(ctx, cameraX);
        break;
      case 'ocean':
        this.drawOceanBackground(ctx, cameraX);
        break;
      case 'inferno':
        this.drawInfernoBackground(ctx, cameraX);
        break;
      case 'sky':
        this.drawSkyBackground(ctx, cameraX);
        break;
    }

    // Draw effects
    this.renderEffects(ctx, cameraX);
  }

  private drawBaseGradient(ctx: CanvasRenderingContext2D): void {
    // Cache gradient on first use (or if context changed)
    if (!this.cachedBaseGradient || this.cachedCtx !== ctx) {
      this.cachedBaseGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      this.cachedBaseGradient.addColorStop(0, this.config.primaryColor);
      this.cachedBaseGradient.addColorStop(0.5, this.config.secondaryColor);
      this.cachedBaseGradient.addColorStop(1, this.config.primaryColor);
      this.cachedCtx = ctx;
    }
    ctx.fillStyle = this.cachedBaseGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private drawCityBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    // Parallax factor for buildings (slower than camera)
    const parallax = cameraX * 0.1;

    // Draw distant city silhouette with parallax
    ctx.fillStyle = 'rgba(20, 30, 50, 0.8)';

    // Back buildings - repeating pattern
    const buildingWidth = 70;
    const startBuilding = Math.floor(parallax / buildingWidth) - 1;
    const endBuilding = startBuilding + Math.ceil(GAME_WIDTH / buildingWidth) + 2;

    for (let i = startBuilding; i < endBuilding; i++) {
      const x = i * buildingWidth - parallax % buildingWidth;
      const width = 50 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 30;
      const height = 100 + Math.sin(i * 0.7) * 80;

      ctx.fillStyle = 'rgba(20, 30, 50, 0.8)';
      ctx.fillRect(x, GAME_HEIGHT - height, width, height);

      // Windows (deterministic based on building index)
      ctx.fillStyle = 'rgba(255, 220, 100, 0.3)';
      for (let wy = GAME_HEIGHT - height + 15; wy < GAME_HEIGHT - 20; wy += 20) {
        for (let wx = x + 8; wx < x + width - 8; wx += 15) {
          // Use deterministic "random" based on position
          const seed = (Math.sin(i * 12.9898 + wy * 78.233) * 43758.5453) % 1;
          if (seed > 0.3) {
            ctx.fillRect(wx, wy, 6, 10);
          }
        }
      }
    }

    // Moon (fixed position, very slow parallax)
    const moonX = GAME_WIDTH * 0.8 - cameraX * 0.02;
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

  private drawNeonBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    // Draw synthwave sun (slow parallax)
    const sunX = GAME_WIDTH / 2 - cameraX * 0.02;
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
    this.drawNeonMountains(ctx, cameraX);

    // Draw perspective grid
    this.drawPerspectiveGrid(ctx, cameraX);
  }

  private drawNeonMountains(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const colors = ['#1a0533', '#2d0a4e', '#400f6b'];

    // Apply parallax to mountains (different speed per layer)
    for (let layer = 0; layer < this.mountainPoints.length; layer++) {
      const points = this.mountainPoints[layer];
      const parallaxFactor = 0.05 + layer * 0.03;
      const offsetX = cameraX * parallaxFactor;

      ctx.beginPath();
      ctx.moveTo(0, GAME_HEIGHT);

      for (let i = 0; i < points.length; i += 2) {
        // Apply parallax offset to x coordinates, wrap around screen
        const x = ((points[i] - offsetX) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
        ctx.lineTo(x, points[i + 1]);
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
        const x = ((points[i] - offsetX) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
        if (i === 0) {
          ctx.moveTo(x, points[i + 1]);
        } else {
          ctx.lineTo(x, points[i + 1]);
        }
      }
      ctx.stroke();
    }
  }

  private drawPerspectiveGrid(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const horizonY = GAME_HEIGHT * 0.55;
    const vanishX = GAME_WIDTH / 2 - cameraX * 0.02;

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

  private drawForestBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    // Parallax factor for trees
    const parallax = cameraX * 0.15;

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

    // Tree silhouettes with parallax
    ctx.fillStyle = 'rgba(10, 30, 20, 0.6)';
    const treeSpacing = 130;
    const startTree = Math.floor(parallax / treeSpacing) - 1;
    const endTree = startTree + Math.ceil(GAME_WIDTH / treeSpacing) + 2;

    for (let i = startTree; i < endTree; i++) {
      const treeX = i * treeSpacing + 50 - parallax % treeSpacing;
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

  private drawVolcanoBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const parallax = cameraX * 0.05;

    // Fiery sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT * 0.6);
    skyGradient.addColorStop(0, '#1a0500');
    skyGradient.addColorStop(0.3, '#3d0a00');
    skyGradient.addColorStop(0.6, '#5c1500');
    skyGradient.addColorStop(1, '#8b2500');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.6);

    // Distant volcano silhouette with glow
    const volcanoX = GAME_WIDTH / 2 - parallax * 0.5;

    // Volcano glow (lava inside crater)
    const craterGlow = ctx.createRadialGradient(
      volcanoX, GAME_HEIGHT * 0.2, 0,
      volcanoX, GAME_HEIGHT * 0.2, 150
    );
    craterGlow.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
    craterGlow.addColorStop(0.3, 'rgba(255, 50, 0, 0.4)');
    craterGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = craterGlow;
    ctx.beginPath();
    ctx.arc(volcanoX, GAME_HEIGHT * 0.2, 150, 0, Math.PI * 2);
    ctx.fill();

    // Volcano shape
    ctx.beginPath();
    ctx.moveTo(volcanoX - 300, GAME_HEIGHT * 0.7);
    ctx.lineTo(volcanoX - 80, GAME_HEIGHT * 0.2);
    ctx.lineTo(volcanoX - 40, GAME_HEIGHT * 0.25);
    ctx.lineTo(volcanoX + 40, GAME_HEIGHT * 0.25);
    ctx.lineTo(volcanoX + 80, GAME_HEIGHT * 0.2);
    ctx.lineTo(volcanoX + 300, GAME_HEIGHT * 0.7);
    ctx.closePath();

    const volcanoGradient = ctx.createLinearGradient(volcanoX, GAME_HEIGHT * 0.2, volcanoX, GAME_HEIGHT * 0.7);
    volcanoGradient.addColorStop(0, '#2d1200');
    volcanoGradient.addColorStop(0.5, '#1a0a00');
    volcanoGradient.addColorStop(1, '#0d0500');
    ctx.fillStyle = volcanoGradient;
    ctx.fill();

    // Lava flows on volcano
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;
    for (const flow of this.lavaFlows) {
      const flowX = volcanoX + (flow.x - GAME_WIDTH / 2) * 0.3;
      const wobble = Math.sin(this.time * flow.speed + flow.offset) * 5;
      ctx.beginPath();
      ctx.moveTo(flowX + wobble, GAME_HEIGHT * 0.25);
      ctx.quadraticCurveTo(
        flowX + wobble * 2, GAME_HEIGHT * 0.45,
        flowX + wobble * 0.5, GAME_HEIGHT * 0.65
      );
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Ground lava pools
    const lavaGround = ctx.createLinearGradient(0, GAME_HEIGHT * 0.7, 0, GAME_HEIGHT);
    lavaGround.addColorStop(0, '#2d0500');
    lavaGround.addColorStop(0.3, '#4d0a00');
    lavaGround.addColorStop(1, '#1a0500');
    ctx.fillStyle = lavaGround;
    ctx.fillRect(0, GAME_HEIGHT * 0.7, GAME_WIDTH, GAME_HEIGHT * 0.3);

    // Animated lava pools
    for (let i = 0; i < 5; i++) {
      const poolX = ((i * 200 + 50 - parallax * 0.2) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
      const poolY = GAME_HEIGHT * 0.8 + Math.sin(i * 2) * 20;
      const pulse = Math.sin(this.time * 0.002 + i) * 0.3 + 0.7;

      const poolGlow = ctx.createRadialGradient(poolX, poolY, 0, poolX, poolY, 40 * pulse);
      poolGlow.addColorStop(0, 'rgba(255, 150, 0, 0.8)');
      poolGlow.addColorStop(0.5, 'rgba(255, 80, 0, 0.4)');
      poolGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = poolGlow;
      ctx.beginPath();
      ctx.ellipse(poolX, poolY, 50 * pulse, 20 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smoke/ash clouds
    ctx.fillStyle = 'rgba(50, 30, 20, 0.3)';
    for (let i = 0; i < 4; i++) {
      const cloudX = volcanoX + Math.sin(this.time * 0.0005 + i * 2) * 100;
      const cloudY = GAME_HEIGHT * 0.1 + i * 30;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 60 + i * 20, 0, Math.PI * 2);
      ctx.arc(cloudX + 40, cloudY - 10, 50 + i * 15, 0, Math.PI * 2);
      ctx.arc(cloudX - 30, cloudY + 10, 40 + i * 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawOceanBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const parallax = cameraX * 0.08;

    // Deep ocean gradient
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    oceanGradient.addColorStop(0, '#001a33');
    oceanGradient.addColorStop(0.3, '#002244');
    oceanGradient.addColorStop(0.6, '#003366');
    oceanGradient.addColorStop(1, '#001a2e');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Caustic light rays from surface
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 8; i++) {
      const rayX = ((i * 150 - parallax * 0.3) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
      const rayWidth = 30 + Math.sin(this.causticPhase + i) * 15;
      const rayGradient = ctx.createLinearGradient(rayX, 0, rayX + rayWidth, GAME_HEIGHT * 0.7);
      rayGradient.addColorStop(0, '#88ddff');
      rayGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
      ctx.fillStyle = rayGradient;
      ctx.beginPath();
      ctx.moveTo(rayX, 0);
      ctx.lineTo(rayX + rayWidth, 0);
      ctx.lineTo(rayX + rayWidth * 2, GAME_HEIGHT * 0.7);
      ctx.lineTo(rayX + rayWidth, GAME_HEIGHT * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Underwater caustic pattern (wavy light on surfaces)
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let y = 50; y < GAME_HEIGHT; y += 80) {
      ctx.beginPath();
      for (let x = 0; x < GAME_WIDTH; x += 10) {
        const waveY = y + Math.sin((x + this.time * 0.05) * 0.03 + this.causticPhase) * 15;
        if (x === 0) {
          ctx.moveTo(x, waveY);
        } else {
          ctx.lineTo(x, waveY);
        }
      }
      ctx.stroke();
    }

    // Coral formations
    for (const coral of this.corals) {
      const coralX = ((coral.x - parallax * 0.2) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
      this.drawCoral(ctx, coralX, GAME_HEIGHT, coral);
    }

    // Fish
    for (const fish of this.fish) {
      const fishX = ((fish.x - parallax * 0.15) % (GAME_WIDTH + 100)) - 50;
      this.drawFish(ctx, fishX, fish.y, fish);
    }

    // Seaweed
    ctx.strokeStyle = 'rgba(0, 100, 50, 0.5)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 10; i++) {
      const seaweedX = ((i * 120 + 30 - parallax * 0.25) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
      const seaweedHeight = 80 + Math.sin(i * 1.5) * 40;
      ctx.beginPath();
      ctx.moveTo(seaweedX, GAME_HEIGHT);
      for (let y = 0; y < seaweedHeight; y += 10) {
        const wobble = Math.sin((this.time * 0.002) + y * 0.1 + i) * 8;
        ctx.lineTo(seaweedX + wobble, GAME_HEIGHT - y);
      }
      ctx.stroke();
    }

    // Floating particles (plankton)
    ctx.fillStyle = 'rgba(150, 220, 255, 0.4)';
    for (let i = 0; i < 30; i++) {
      const planktonX = ((i * 37 + this.time * 0.02) % GAME_WIDTH);
      const planktonY = (i * 23 + Math.sin(this.time * 0.001 + i) * 30) % GAME_HEIGHT;
      ctx.beginPath();
      ctx.arc(planktonX, planktonY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCoral(ctx: CanvasRenderingContext2D, x: number, baseY: number, coral: Coral): void {
    const hsl = `hsl(${coral.hue}, 60%, 40%)`;
    const hslLight = `hsl(${coral.hue}, 70%, 55%)`;

    ctx.fillStyle = hsl;
    ctx.strokeStyle = hslLight;
    ctx.lineWidth = 2;

    // Main coral body
    ctx.beginPath();
    ctx.moveTo(x - coral.width / 2, baseY);
    ctx.quadraticCurveTo(x - coral.width / 2, baseY - coral.height * 0.7, x, baseY - coral.height);
    ctx.quadraticCurveTo(x + coral.width / 2, baseY - coral.height * 0.7, x + coral.width / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Coral branches
    for (let i = 0; i < coral.branches; i++) {
      const branchX = x - coral.width / 3 + (i / coral.branches) * coral.width * 0.66;
      const branchHeight = coral.height * (0.4 + Math.random() * 0.3);
      const branchY = baseY - coral.height * 0.3;

      ctx.beginPath();
      ctx.moveTo(branchX, branchY);
      ctx.quadraticCurveTo(
        branchX + (Math.random() - 0.5) * 20,
        branchY - branchHeight / 2,
        branchX + (Math.random() - 0.5) * 15,
        branchY - branchHeight
      );
      ctx.stroke();

      // Branch tip
      ctx.beginPath();
      ctx.arc(branchX + (Math.random() - 0.5) * 15, branchY - branchHeight, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawFish(ctx: CanvasRenderingContext2D, x: number, y: number, fish: Fish): void {
    ctx.save();
    ctx.translate(x, y);
    if (fish.direction < 0) {
      ctx.scale(-1, 1);
    }

    // Fish body
    ctx.fillStyle = `hsla(${fish.hue}, 70%, 50%, 0.8)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.size, fish.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-fish.size * 0.8, 0);
    ctx.lineTo(-fish.size * 1.5, -fish.size * 0.4);
    ctx.lineTo(-fish.size * 1.5, fish.size * 0.4);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(fish.size * 0.4, -fish.size * 0.1, fish.size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(fish.size * 0.45, -fish.size * 0.1, fish.size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawInfernoBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const parallax = cameraX * 0.06;

    // Intense fiery sky gradient - more aggressive than volcano
    const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGradient.addColorStop(0, '#0a0000');
    skyGradient.addColorStop(0.2, '#1a0500');
    skyGradient.addColorStop(0.4, '#3d0800');
    skyGradient.addColorStop(0.6, '#5c1000');
    skyGradient.addColorStop(0.8, '#7d1800');
    skyGradient.addColorStop(1, '#3d0500');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Pulsing danger glow from left (the wall is coming!)
    const pulse = Math.sin(this.time * 0.003) * 0.3 + 0.5;
    const dangerGlow = ctx.createLinearGradient(0, 0, GAME_WIDTH * 0.4, 0);
    dangerGlow.addColorStop(0, `rgba(255, 50, 0, ${pulse * 0.4})`);
    dangerGlow.addColorStop(0.5, `rgba(255, 100, 0, ${pulse * 0.2})`);
    dangerGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = dangerGlow;
    ctx.fillRect(0, 0, GAME_WIDTH * 0.4, GAME_HEIGHT);

    // Cracks in the ground with lava glow
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 15;
    for (let i = 0; i < 8; i++) {
      const crackX = ((i * 140 - parallax * 0.3) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
      const crackY = GAME_HEIGHT * 0.7 + (i % 3) * 40;
      ctx.beginPath();
      ctx.moveTo(crackX, crackY);
      for (let j = 0; j < 5; j++) {
        const nextX = crackX + (j + 1) * 20 + Math.sin(this.time * 0.002 + i + j) * 5;
        const nextY = crackY + Math.sin(j * 2 + i) * 30;
        ctx.lineTo(nextX, nextY);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Ground - charred and cracked
    const groundGradient = ctx.createLinearGradient(0, GAME_HEIGHT * 0.75, 0, GAME_HEIGHT);
    groundGradient.addColorStop(0, '#1a0800');
    groundGradient.addColorStop(0.5, '#2d0a00');
    groundGradient.addColorStop(1, '#0d0400');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GAME_HEIGHT * 0.75, GAME_WIDTH, GAME_HEIGHT * 0.25);

    // Distant fire pillars
    for (let i = 0; i < 5; i++) {
      const pillarX = ((i * 200 + 100 - parallax * 0.15) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
      const pillarHeight = 150 + Math.sin(i * 1.5) * 50;
      const flicker = Math.sin(this.time * 0.005 + i * 2) * 20;

      // Fire pillar glow
      const fireGlow = ctx.createRadialGradient(
        pillarX, GAME_HEIGHT * 0.65, 0,
        pillarX, GAME_HEIGHT * 0.65, 60 + flicker
      );
      fireGlow.addColorStop(0, 'rgba(255, 200, 0, 0.4)');
      fireGlow.addColorStop(0.5, 'rgba(255, 100, 0, 0.2)');
      fireGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = fireGlow;
      ctx.beginPath();
      ctx.arc(pillarX, GAME_HEIGHT * 0.65, 60 + flicker, 0, Math.PI * 2);
      ctx.fill();

      // Fire column
      const fireGradient = ctx.createLinearGradient(pillarX, GAME_HEIGHT * 0.7, pillarX, GAME_HEIGHT * 0.7 - pillarHeight);
      fireGradient.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
      fireGradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.4)');
      fireGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
      ctx.fillStyle = fireGradient;
      ctx.fillRect(pillarX - 15, GAME_HEIGHT * 0.7 - pillarHeight + flicker, 30, pillarHeight);
    }

    // Smoke clouds drifting right
    ctx.fillStyle = 'rgba(30, 20, 20, 0.3)';
    for (let i = 0; i < 6; i++) {
      const cloudX = ((i * 180 + this.time * 0.03) % (GAME_WIDTH + 200)) - 100;
      const cloudY = 80 + (i % 3) * 60;
      const cloudSize = 60 + (i % 2) * 30;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
      ctx.arc(cloudX + cloudSize * 0.6, cloudY - 10, cloudSize * 0.7, 0, Math.PI * 2);
      ctx.arc(cloudX + cloudSize * 1.1, cloudY + 5, cloudSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSkyBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const parallax = cameraX * 0.05;

    // Beautiful sky gradient - light blue to white
    const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGradient.addColorStop(0, '#4A90D9');
    skyGradient.addColorStop(0.3, '#87CEEB');
    skyGradient.addColorStop(0.6, '#B0E0E6');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sun in the corner
    const sunX = GAME_WIDTH * 0.85 - parallax * 0.02;
    const sunY = GAME_HEIGHT * 0.15;

    // Sun glow
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
    sunGlow.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    sunGlow.addColorStop(0.3, 'rgba(255, 240, 150, 0.4)');
    sunGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
    ctx.fill();

    // Sun body
    ctx.fillStyle = '#FFE566';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fill();

    // Cloud layers (fluffy clouds at different depths)
    this.drawClouds(ctx, parallax * 0.3, GAME_HEIGHT * 0.15, 0.6, 80);
    this.drawClouds(ctx, parallax * 0.5, GAME_HEIGHT * 0.35, 0.7, 100);
    this.drawClouds(ctx, parallax * 0.8, GAME_HEIGHT * 0.55, 0.8, 120);
    this.drawClouds(ctx, parallax * 1.0, GAME_HEIGHT * 0.75, 0.9, 100);

    // Birds in the distance
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const birdX = ((i * 200 + 100 - parallax * 0.4 + this.time * 0.02) % (GAME_WIDTH + 200)) - 100;
      const birdY = 80 + Math.sin(i * 2 + this.time * 0.003) * 30 + (i % 3) * 40;
      const wingFlap = Math.sin(this.time * 0.01 + i * 2) * 8;

      ctx.beginPath();
      ctx.moveTo(birdX - 10, birdY + wingFlap);
      ctx.quadraticCurveTo(birdX, birdY - 5, birdX + 10, birdY + wingFlap);
      ctx.stroke();
    }
  }

  private drawClouds(ctx: CanvasRenderingContext2D, parallax: number, baseY: number, opacity: number, size: number): void {
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

    // Draw multiple clouds at this layer
    for (let i = 0; i < 6; i++) {
      const cloudX = ((i * 220 + 50 - parallax) % (GAME_WIDTH + 200)) - 100;
      const cloudY = baseY + Math.sin(i * 1.5) * 30;
      const cloudSize = size + Math.sin(i * 2.3) * 20;

      // Fluffy cloud shape
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, cloudSize * 0.6, 0, Math.PI * 2);
      ctx.arc(cloudX + cloudSize * 0.5, cloudY - cloudSize * 0.2, cloudSize * 0.5, 0, Math.PI * 2);
      ctx.arc(cloudX + cloudSize, cloudY, cloudSize * 0.55, 0, Math.PI * 2);
      ctx.arc(cloudX + cloudSize * 0.3, cloudY + cloudSize * 0.2, cloudSize * 0.4, 0, Math.PI * 2);
      ctx.arc(cloudX + cloudSize * 0.7, cloudY + cloudSize * 0.15, cloudSize * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderEffects(ctx: CanvasRenderingContext2D, cameraX: number): void {
    // Skip expensive background effects if disabled for performance
    if (!performanceManager.shouldRenderBackgroundEffects()) {
      return;
    }

    const effects = this.config.effects || [];

    if (effects.includes('stars')) {
      this.renderStars(ctx, cameraX);
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

    if (effects.includes('embers')) {
      this.renderEmbers(ctx);
    }

    if (effects.includes('bubbles')) {
      this.renderBubbles(ctx);
    }
  }

  private renderStars(ctx: CanvasRenderingContext2D, cameraX: number): void {
    // Stars have very slow parallax
    const parallax = cameraX * 0.03;

    for (const star of this.stars) {
      const twinkle = Math.sin(this.time * star.twinkleSpeed) * 0.5 + 0.5;
      const brightness = star.brightness * twinkle;

      // Wrap star position with parallax
      let starX = ((star.x - parallax) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;

      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(starX, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Star glow
      if (star.size > 1.5) {
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
        ctx.beginPath();
        ctx.arc(starX, star.y, star.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    const color = this.config.particles?.color || 'rgba(255, 255, 255, 0.5)';
    ctx.fillStyle = color;
    ctx.globalAlpha = 1;

    for (const particle of this.particles) {
      // Set alpha directly without string parsing
      ctx.globalAlpha = particle.opacity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderAurora(ctx: CanvasRenderingContext2D): void {
    for (const band of this.auroraBands) {
      const wave = Math.sin(this.time * band.speed + band.offset);
      const y = band.y + wave * 20;

      // Draw simplified aurora without creating new gradients every frame
      ctx.fillStyle = `hsla(${band.hue}, 80%, 50%, 0.1)`;
      ctx.beginPath();
      ctx.moveTo(0, y);

      // Fewer points for wave = better performance
      for (let x = 0; x <= GAME_WIDTH; x += 40) {
        const waveY = y + Math.sin(x * 0.01 + this.time * 0.0005 + band.offset) * 10;
        ctx.lineTo(x, waveY);
      }

      ctx.lineTo(GAME_WIDTH, y + band.height);
      ctx.lineTo(0, y + band.height);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderScanlines(ctx: CanvasRenderingContext2D): void {
    // Create and cache scanlines pattern on first use
    if (!this.cachedScanlinesPattern || this.cachedScanlinesCtx !== ctx) {
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 1;
      patternCanvas.height = 4;
      const patternCtx = patternCanvas.getContext('2d');
      if (patternCtx) {
        patternCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        patternCtx.fillRect(0, 0, 1, 2);
        // Bottom 2 pixels are transparent (default)
        this.cachedScanlinesPattern = ctx.createPattern(patternCanvas, 'repeat');
        this.cachedScanlinesCtx = ctx;
      }
    }

    if (this.cachedScanlinesPattern) {
      ctx.fillStyle = this.cachedScanlinesPattern;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
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

  private renderEmbers(ctx: CanvasRenderingContext2D): void {
    for (const ember of this.embers) {
      const flicker = Math.sin(this.time * 0.01 + ember.wobble) * 0.3 + 0.7;
      const alpha = ember.brightness * flicker;

      // Ember glow
      const glowGradient = ctx.createRadialGradient(
        ember.x, ember.y, 0,
        ember.x, ember.y, ember.size * 3
      );
      glowGradient.addColorStop(0, `rgba(255, 150, 0, ${alpha * 0.8})`);
      glowGradient.addColorStop(0.5, `rgba(255, 80, 0, ${alpha * 0.3})`);
      glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, ember.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Ember core
      ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderBubbles(ctx: CanvasRenderingContext2D): void {
    for (const bubble of this.bubbles) {
      // Bubble body
      ctx.strokeStyle = `rgba(150, 220, 255, ${bubble.opacity})`;
      ctx.fillStyle = `rgba(100, 200, 255, ${bubble.opacity * 0.2})`;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bubble highlight
      ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.6})`;
      ctx.beginPath();
      ctx.arc(
        bubble.x - bubble.size * 0.3,
        bubble.y - bubble.size * 0.3,
        bubble.size * 0.25,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
