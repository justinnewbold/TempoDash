import { CONFIG } from '../constants';

export type HoleType = 'normal' | 'wide' | 'crystal';

interface CrystalSpike {
  x: number;
  height: number;
  hue: number;
  pulsePhase: number;
}

export class Hole {
  x: number;
  width: number;
  passed = false;
  type: HoleType;

  // Visual effects
  private crystalSpikes: CrystalSpike[] = [];
  private glowPhase = Math.random() * Math.PI * 2;
  private drips: { x: number; y: number; speed: number }[] = [];

  // Warning system
  private warningPlayed = false;
  private warningIntensity = 0;
  private readonly warningDistance = 150; // How far ahead to start warning

  // Frame time cache for render (passed from game loop)
  private _frameTime = 0;

  constructor(x: number, width?: number, type?: HoleType) {
    this.x = x;
    this.type = type ?? (Math.random() > 0.7 ? 'crystal' : 'normal');

    // Width varies by type
    if (this.type === 'wide') {
      this.width = 100 + Math.random() * 40; // 100-140px
    } else if (this.type === 'crystal') {
      this.width = 80 + Math.random() * 30; // 80-110px
      this.initCrystalSpikes();
    } else {
      this.width = width ?? 60 + Math.random() * 40; // 60-100px
    }

    // Initialize drip particles
    this.initDrips();
  }

  private initCrystalSpikes(): void {
    const numSpikes = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numSpikes; i++) {
      this.crystalSpikes.push({
        x: this.width * (0.15 + (i / numSpikes) * 0.7),
        height: 15 + Math.random() * 20,
        hue: 180 + Math.random() * 60, // Cyan to blue
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  private initDrips(): void {
    for (let i = 0; i < 3; i++) {
      this.drips.push({
        x: Math.random() * this.width,
        y: Math.random() * CONFIG.GROUND_HEIGHT,
        speed: 1 + Math.random() * 2
      });
    }
  }

  update(speed: number, beatPulse: number = 0): void {
    this.x -= CONFIG.BASE_OBSTACLE_SPEED * speed;
    this.glowPhase += 0.05 * speed;

    // Update crystal spike glow
    for (const spike of this.crystalSpikes) {
      spike.pulsePhase += 0.08 * speed;
    }

    // Sync with beat
    if (beatPulse > 0.5) {
      this.glowPhase = 0;
    }

    // Update drips
    for (const drip of this.drips) {
      drip.y += drip.speed * speed;
      if (drip.y > CONFIG.GROUND_HEIGHT) {
        drip.y = 0;
        drip.x = Math.random() * this.width;
      }
    }
  }

  // Check if player fell into the hole
  checkDeath(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    const playerBottom = playerY + playerHeight;
    const playerCenterX = playerX + playerWidth / 2;

    // Player is at ground level and center is over the hole
    if (playerBottom >= groundY - 5) {
      if (playerCenterX > this.x + 10 && playerCenterX < this.x + this.width - 10) {
        return true;
      }
    }
    return false;
  }

  // Check if player is approaching the hole (for warning)
  checkApproaching(playerX: number, playerWidth: number): boolean {
    const playerRight = playerX + playerWidth;
    const distanceToHole = this.x - playerRight;

    // Calculate warning intensity based on distance
    if (distanceToHole > 0 && distanceToHole < this.warningDistance) {
      this.warningIntensity = 1 - (distanceToHole / this.warningDistance);
      return !this.warningPlayed;
    }

    // Reset warning when player passes or is far away
    if (distanceToHole < -this.width) {
      this.warningPlayed = false;
    }

    this.warningIntensity = 0;
    return false;
  }

  // Mark warning as played
  markWarningPlayed(): void {
    this.warningPlayed = true;
  }

  // Check if player successfully crossed the hole
  checkPassed(playerX: number): boolean {
    if (!this.passed && playerX > this.x + this.width) {
      this.passed = true;
      return true;
    }
    return false;
  }

  // Get bonus points for crossing (crystal holes worth more)
  getCrossBonus(): number {
    switch (this.type) {
      case 'crystal':
        return 75; // More valuable
      case 'wide':
        return 50; // Harder to cross
      default:
        return 30; // Normal holes
    }
  }

  // Get current warning intensity (0-1)
  getWarningIntensity(): number {
    return this.warningIntensity;
  }

  render(ctx: CanvasRenderingContext2D, _groundColor: string, frameTime?: number): void {
    this._frameTime = frameTime ?? Date.now();
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    const glowIntensity = Math.sin(this.glowPhase) * 0.3 + 0.7;

    // Warning effect when player approaches
    if (this.warningIntensity > 0) {
      this.renderWarningEffect(ctx, groundY);
    }

    // Draw the hole (dark pit)
    ctx.fillStyle = '#000000';
    ctx.fillRect(this.x, groundY, this.width, CONFIG.GROUND_HEIGHT);

    // Gradient into darkness - themed by type
    const gradient = ctx.createLinearGradient(this.x, groundY, this.x, CONFIG.HEIGHT);
    if (this.type === 'crystal') {
      gradient.addColorStop(0, 'rgba(0, 20, 40, 0.9)');
      gradient.addColorStop(0.3, 'rgba(0, 40, 60, 0.95)');
      gradient.addColorStop(1, '#000011');
    } else {
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      gradient.addColorStop(0.5, 'rgba(20, 0, 40, 0.9)');
      gradient.addColorStop(1, '#000000');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, groundY, this.width, CONFIG.GROUND_HEIGHT);

    // Crystal spikes at bottom (for crystal type)
    if (this.type === 'crystal') {
      this.renderCrystalSpikes(ctx, groundY);
    }

    // Render drip particles
    this.renderDrips(ctx, groundY);

    // Edge effects based on type
    if (this.type === 'crystal') {
      // Crystal edge glow
      ctx.shadowColor = `hsla(200, 100%, 60%, ${glowIntensity})`;
      ctx.shadowBlur = 15 * glowIntensity;

      // Crystal formations at edges
      this.renderEdgeCrystals(ctx, groundY, glowIntensity);
    } else {
      // Standard warning stripes at edges
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(this.x - 5, groundY - 3, 10, 3);
      ctx.fillRect(this.x + this.width - 5, groundY - 3, 10, 3);
    }

    // Danger glow lines
    const dangerColor = this.type === 'crystal' ? '#44aaff' : '#ff0000';
    ctx.shadowColor = dangerColor;
    ctx.shadowBlur = 10 * glowIntensity;
    ctx.strokeStyle = dangerColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, groundY);
    ctx.lineTo(this.x, groundY + 30);
    ctx.moveTo(this.x + this.width, groundY);
    ctx.lineTo(this.x + this.width, groundY + 30);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Reflection hint on ground near hole
    const reflectionGradient = ctx.createLinearGradient(
      this.x - 20, groundY - 10,
      this.x + this.width + 20, groundY - 10
    );
    reflectionGradient.addColorStop(0, 'transparent');
    reflectionGradient.addColorStop(0.3, `${dangerColor}22`);
    reflectionGradient.addColorStop(0.7, `${dangerColor}22`);
    reflectionGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = reflectionGradient;
    ctx.fillRect(this.x - 20, groundY - 8, this.width + 40, 8);
  }

  private renderCrystalSpikes(ctx: CanvasRenderingContext2D, _groundY: number): void {
    for (const spike of this.crystalSpikes) {
      const pulse = Math.sin(spike.pulsePhase) * 0.3 + 0.7;
      const spikeX = this.x + spike.x;
      const spikeY = CONFIG.HEIGHT - spike.height;

      // Spike glow
      ctx.shadowColor = `hsl(${spike.hue}, 100%, 50%)`;
      ctx.shadowBlur = 8 * pulse;

      // Crystal spike shape
      const gradient = ctx.createLinearGradient(spikeX, CONFIG.HEIGHT, spikeX, spikeY);
      gradient.addColorStop(0, `hsla(${spike.hue}, 80%, 30%, 0.8)`);
      gradient.addColorStop(0.5, `hsla(${spike.hue}, 90%, 50%, ${0.6 * pulse})`);
      gradient.addColorStop(1, `hsla(${spike.hue}, 100%, 70%, ${0.9 * pulse})`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(spikeX - 4, CONFIG.HEIGHT);
      ctx.lineTo(spikeX, spikeY);
      ctx.lineTo(spikeX + 4, CONFIG.HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Bright tip
      ctx.fillStyle = `hsla(${spike.hue}, 100%, 80%, ${pulse})`;
      ctx.beginPath();
      ctx.arc(spikeX, spikeY + 2, 2 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  private renderEdgeCrystals(ctx: CanvasRenderingContext2D, groundY: number, glowIntensity: number): void {
    // Left edge crystals
    this.drawSmallCrystal(ctx, this.x - 3, groundY, 12, 200, glowIntensity);
    this.drawSmallCrystal(ctx, this.x + 5, groundY, 8, 210, glowIntensity);

    // Right edge crystals
    this.drawSmallCrystal(ctx, this.x + this.width + 3, groundY, 12, 200, glowIntensity);
    this.drawSmallCrystal(ctx, this.x + this.width - 5, groundY, 8, 210, glowIntensity);
  }

  private drawSmallCrystal(ctx: CanvasRenderingContext2D, x: number, groundY: number, height: number, hue: number, intensity: number): void {
    ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.7 * intensity})`;
    ctx.beginPath();
    ctx.moveTo(x - 3, groundY);
    ctx.lineTo(x, groundY - height);
    ctx.lineTo(x + 3, groundY);
    ctx.closePath();
    ctx.fill();
  }

  private renderDrips(ctx: CanvasRenderingContext2D, groundY: number): void {
    ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
    for (const drip of this.drips) {
      ctx.beginPath();
      ctx.ellipse(
        this.x + drip.x,
        groundY + drip.y,
        1.5,
        3,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  private renderWarningEffect(ctx: CanvasRenderingContext2D, groundY: number): void {
    const intensity = this.warningIntensity;
    const dangerColor = this.type === 'crystal' ? [68, 170, 255] : [255, 80, 80];

    // Pulsing warning glow ahead of the hole
    const pulseRate = Math.sin(this._frameTime * 0.01) * 0.3 + 0.7;
    const glowAlpha = intensity * pulseRate * 0.4;

    // Warning beam from above
    const beamGradient = ctx.createLinearGradient(
      this.x + this.width / 2, 0,
      this.x + this.width / 2, groundY
    );
    beamGradient.addColorStop(0, `rgba(${dangerColor.join(',')}, 0)`);
    beamGradient.addColorStop(0.7, `rgba(${dangerColor.join(',')}, ${glowAlpha * 0.3})`);
    beamGradient.addColorStop(1, `rgba(${dangerColor.join(',')}, ${glowAlpha})`);

    ctx.fillStyle = beamGradient;
    ctx.fillRect(this.x - 10, 0, this.width + 20, groundY);

    // Danger indicator arrows
    if (intensity > 0.3) {
      const arrowY = groundY - 40 - Math.sin(this._frameTime * 0.008) * 10;
      const arrowAlpha = (intensity - 0.3) * 1.4;

      ctx.save();
      ctx.translate(this.x + this.width / 2, arrowY);

      // Arrow pointing down
      ctx.fillStyle = `rgba(${dangerColor.join(',')}, ${arrowAlpha})`;
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-4, -15);
      ctx.lineTo(4, -15);
      ctx.lineTo(4, 0);
      ctx.lineTo(10, 0);
      ctx.closePath();
      ctx.fill();

      // Glow
      ctx.shadowColor = `rgb(${dangerColor.join(',')})`;
      ctx.shadowBlur = 10 * intensity;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    // Edge warning pulses
    const edgePulse = Math.sin(this._frameTime * 0.015) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(${dangerColor.join(',')}, ${intensity * edgePulse * 0.6})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(this.x, groundY - 30);
    ctx.lineTo(this.x, groundY);
    ctx.moveTo(this.x + this.width, groundY - 30);
    ctx.lineTo(this.x + this.width, groundY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
