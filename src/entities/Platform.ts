import { PlatformConfig, PlatformType, MovePattern, Rectangle } from '../types';
import { COLORS, PLATFORM } from '../constants';

export class Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  movePattern?: MovePattern;
  color: string;

  // Static colorblind mode setting
  private static colorblindMode = false;

  static setColorblindMode(enabled: boolean): void {
    Platform.colorblindMode = enabled;
  }

  // Rhythm Lock mode - platforms only solid on beat
  private static rhythmLockEnabled = false;
  private static beatSolidity = 0; // 0-1 where 1 = fully solid (on beat)
  private static readonly BEAT_SOLID_WINDOW = 0.4; // Platforms solid when beatSolidity > this

  static setRhythmLockEnabled(enabled: boolean): void {
    Platform.rhythmLockEnabled = enabled;
  }

  static isRhythmLockEnabled(): boolean {
    return Platform.rhythmLockEnabled;
  }

  // Update beat solidity (called from Game on each frame)
  // beatProgress: 0-1 representing position in beat cycle (0 = beat, 1 = just before next beat)
  static updateBeatSolidity(beatProgress: number): void {
    // Creates a window of solidity around each beat
    // Platforms are solid right after a beat and right before the next
    const windowSize = 0.25; // How much of the beat cycle the platform is solid

    if (beatProgress < windowSize) {
      // Just after a beat - solid, decreasing
      Platform.beatSolidity = 1 - (beatProgress / windowSize);
    } else if (beatProgress > (1 - windowSize)) {
      // Just before next beat - increasing toward solid
      Platform.beatSolidity = (beatProgress - (1 - windowSize)) / windowSize;
    } else {
      // In between beats - not solid
      Platform.beatSolidity = 0;
    }
  }

  static getBeatSolidity(): number {
    return Platform.beatSolidity;
  }

  // Check if platforms are currently solid in rhythm lock mode
  static isOnBeat(): boolean {
    return Platform.beatSolidity > Platform.BEAT_SOLID_WINDOW;
  }

  private startX: number;
  private startY: number;
  private moveTime = 0;
  private crumbleTimer = 0;
  private isCrumbling = false;
  private crumbleProgress = 0;
  private phaseTimer = 0;
  isPhased = false;
  isDestroyed = false;

  // New platform type properties
  conveyorSpeed = 1;           // -1 to 1, negative = left
  private glassHits = 0;       // Breaks after 2 hits
  private glassBreaking = false;
  private conveyorAnimTime = 0;

  // Secret platform properties
  private secretRevealed = false;
  private secretRevealProgress = 0;

  // Beat visualization (pulse effect)
  private beatPulse = 0;

  constructor(config: PlatformConfig) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.type = config.type;
    this.movePattern = config.movePattern;
    this.color = config.color || COLORS.PLATFORM[config.type];

    this.startX = config.x;
    this.startY = config.y;

    if (config.movePattern?.startOffset) {
      this.moveTime = config.movePattern.startOffset;
    }

    // Conveyor default speed
    if (config.conveyorSpeed !== undefined) {
      this.conveyorSpeed = config.conveyorSpeed;
    }
  }

  update(deltaTime: number): void {
    if (this.isDestroyed) return;

    // Handle movement
    if (this.movePattern && this.type === 'moving') {
      this.updateMovement(deltaTime);
    }

    // Handle crumbling
    if (this.type === 'crumble' && this.isCrumbling) {
      this.crumbleTimer += deltaTime;
      if (this.crumbleTimer >= PLATFORM.CRUMBLE_DELAY) {
        this.crumbleProgress = Math.min(
          1,
          (this.crumbleTimer - PLATFORM.CRUMBLE_DELAY) / PLATFORM.CRUMBLE_DURATION
        );
        if (this.crumbleProgress >= 1) {
          this.isDestroyed = true;
        }
      }
    }

    // Handle phasing
    if (this.type === 'phase') {
      this.phaseTimer += deltaTime;
      const cycleTime = PLATFORM.PHASE_ON_TIME + PLATFORM.PHASE_OFF_TIME;
      const cyclePosition = this.phaseTimer % cycleTime;
      this.isPhased = cyclePosition > PLATFORM.PHASE_ON_TIME;
    }

    // Handle conveyor animation
    if (this.type === 'conveyor') {
      this.conveyorAnimTime += deltaTime * 0.005 * this.conveyorSpeed;
    }

    // Handle glass breaking animation
    if (this.type === 'glass' && this.glassBreaking) {
      this.crumbleTimer += deltaTime;
      this.crumbleProgress = Math.min(1, this.crumbleTimer / 300);
      if (this.crumbleProgress >= 1) {
        this.isDestroyed = true;
      }
    }

    // Handle secret platform reveal animation
    if (this.type === 'secret' && this.secretRevealed) {
      this.secretRevealProgress = Math.min(1, this.secretRevealProgress + deltaTime * 0.003);
    }

    // Decay beat pulse
    if (this.beatPulse > 0) {
      this.beatPulse = Math.max(0, this.beatPulse - deltaTime * 0.003);
    }
  }

  // Trigger beat pulse for visualization
  triggerBeatPulse(): void {
    this.beatPulse = 1;
  }

  getBeatPulse(): number {
    return this.beatPulse;
  }

  // Check if player is near and should reveal secret
  checkSecretReveal(playerX: number, playerY: number): boolean {
    if (this.type !== 'secret' || this.secretRevealed) return false;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const distance = Math.sqrt(
      Math.pow(playerX - centerX, 2) + Math.pow(playerY - centerY, 2)
    );

    if (distance < 150) {
      this.secretRevealed = true;
      return true;
    }
    return false;
  }

  isSecretRevealed(): boolean {
    return this.type !== 'secret' || this.secretRevealed;
  }

  private updateMovement(deltaTime: number): void {
    if (!this.movePattern) return;

    this.moveTime += deltaTime * 0.001 * this.movePattern.speed;

    switch (this.movePattern.type) {
      case 'horizontal':
        this.x = this.startX + Math.sin(this.moveTime) * this.movePattern.distance;
        break;
      case 'vertical':
        this.y = this.startY + Math.sin(this.moveTime) * this.movePattern.distance;
        break;
      case 'circular':
        this.x = this.startX + Math.cos(this.moveTime) * this.movePattern.distance;
        this.y = this.startY + Math.sin(this.moveTime) * this.movePattern.distance;
        break;
    }
  }

  startCrumble(): void {
    if (this.type === 'crumble' && !this.isCrumbling) {
      this.isCrumbling = true;
    }
  }

  // Handle glass platform landing - returns true if glass breaks
  onGlassLanding(): boolean {
    if (this.type !== 'glass' || this.glassBreaking) return false;

    this.glassHits++;
    if (this.glassHits >= 2) {
      this.glassBreaking = true;
      return true;
    }
    return false;
  }

  // Get glass crack state (0 = pristine, 1 = cracked, 2+ = breaking)
  getGlassState(): number {
    return this.glassHits;
  }

  getBounds(): Rectangle {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  isCollidable(): boolean {
    if (this.isDestroyed || this.isPhased) return false;
    // Secret platforms only collidable after revealed (with some progress)
    if (this.type === 'secret' && this.secretRevealProgress < 0.3) return false;

    // Rhythm Lock mode - safe platforms only solid on beat
    // Deadly platforms (spike, lava) are ALWAYS collidable (still dangerous!)
    if (Platform.rhythmLockEnabled) {
      const isDeadlyPlatform = this.type === 'spike' || this.type === 'lava';
      if (!isDeadlyPlatform && !Platform.isOnBeat()) {
        return false; // Safe platforms are intangible off-beat
      }
    }

    return true;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number = 0, gameWidth: number = 540): void {
    if (this.isDestroyed) return;

    // Skip rendering if off-screen (use logical game width, not canvas pixel width)
    const screenX = this.x - cameraX;
    if (screenX + this.width < -100 || screenX > gameWidth + 100) {
      return;
    }

    ctx.save();

    // Handle phase transparency
    if (this.type === 'phase') {
      const alpha = this.isPhased ? 0.2 : 1;
      ctx.globalAlpha = alpha;
    }

    // Handle rhythm lock visual feedback
    if (Platform.rhythmLockEnabled) {
      const isDeadly = this.type === 'spike' || this.type === 'lava';
      if (!isDeadly) {
        // Safe platforms fade based on beat solidity
        const solidity = Platform.beatSolidity;
        const minAlpha = 0.15; // Minimum visibility so players can see timing
        const alpha = minAlpha + (1 - minAlpha) * solidity;
        ctx.globalAlpha *= alpha;

        // Add pulsing glow when on beat
        if (solidity > 0.5) {
          ctx.shadowColor = '#ff00aa';
          ctx.shadowBlur = 15 * solidity;
        }
      }
    }

    // Handle crumble shake
    if (this.isCrumbling && this.crumbleProgress < 1) {
      const shake = (1 - this.crumbleProgress) * 3;
      ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake
      );
      ctx.globalAlpha = 1 - this.crumbleProgress;
    }

    // Draw platform base with camera offset
    this.drawPlatform(ctx, screenX);

    ctx.restore();
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, screenX: number): void {
    const gradient = ctx.createLinearGradient(
      screenX,
      this.y,
      screenX,
      this.y + this.height
    );

    switch (this.type) {
      case 'spike':
        // Draw triangular spikes (Geometry Dash style)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        const spikeCount = Math.floor(this.width / this.height);
        const spikeWidth = this.width / spikeCount;
        for (let i = 0; i < spikeCount; i++) {
          ctx.beginPath();
          ctx.moveTo(screenX + i * spikeWidth, this.y + this.height);
          ctx.lineTo(screenX + i * spikeWidth + spikeWidth / 2, this.y);
          ctx.lineTo(screenX + (i + 1) * spikeWidth, this.y + this.height);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        break;

      case 'bounce':
        gradient.addColorStop(0, '#ffc107');
        gradient.addColorStop(1, '#ff9800');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Bounce indicator lines
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const lineX = screenX + (this.width / 4) * (i + 1);
          ctx.beginPath();
          ctx.moveTo(lineX - 5, this.y + this.height / 2);
          ctx.lineTo(lineX, this.y + 5);
          ctx.lineTo(lineX + 5, this.y + this.height / 2);
          ctx.stroke();
        }
        break;

      case 'ice':
        gradient.addColorStop(0, 'rgba(200, 240, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(150, 200, 255, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Ice shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(screenX + 5, this.y + 3, this.width * 0.3, 4);
        break;

      case 'lava':
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff2200');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Lava bubbles
        ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
        const time = Date.now() * 0.003;
        for (let i = 0; i < 3; i++) {
          const bubbleX = screenX + (this.width / 4) * (i + 1);
          const bubbleY = this.y + 5 + Math.sin(time + i) * 3;
          ctx.beginPath();
          ctx.arc(bubbleX, bubbleY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'crumble':
        gradient.addColorStop(0, '#a0522d');
        gradient.addColorStop(1, '#8b4513');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Crack lines
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + this.width * 0.3, this.y);
        ctx.lineTo(screenX + this.width * 0.4, this.y + this.height);
        ctx.moveTo(screenX + this.width * 0.7, this.y);
        ctx.lineTo(screenX + this.width * 0.6, this.y + this.height);
        ctx.stroke();
        break;

      case 'moving':
        gradient.addColorStop(0, '#4fc3f7');
        gradient.addColorStop(1, '#0288d1');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Movement arrows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(screenX + 10, this.y + this.height / 2);
        ctx.lineTo(screenX + 20, this.y + this.height / 2 - 5);
        ctx.lineTo(screenX + 20, this.y + this.height / 2 + 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(screenX + this.width - 10, this.y + this.height / 2);
        ctx.lineTo(screenX + this.width - 20, this.y + this.height / 2 - 5);
        ctx.lineTo(screenX + this.width - 20, this.y + this.height / 2 + 5);
        ctx.fill();
        break;

      case 'phase':
        const phaseGradient = ctx.createLinearGradient(
          screenX,
          this.y,
          screenX + this.width,
          this.y
        );
        phaseGradient.addColorStop(0, '#9c27b0');
        phaseGradient.addColorStop(0.5, '#e040fb');
        phaseGradient.addColorStop(1, '#9c27b0');
        ctx.fillStyle = phaseGradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Phase particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const phaseTime = Date.now() * 0.005;
        for (let i = 0; i < 5; i++) {
          const px = screenX + (this.width / 6) * (i + 1);
          const py = this.y + this.height / 2 + Math.sin(phaseTime + i) * 5;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'conveyor':
        // Industrial green conveyor belt
        gradient.addColorStop(0, '#38a169');
        gradient.addColorStop(1, '#276749');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Animated conveyor lines
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 3;
        const lineSpacing = 20;
        const offset = (this.conveyorAnimTime * 50) % lineSpacing;
        for (let lx = -lineSpacing + offset; lx < this.width + lineSpacing; lx += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(screenX + lx, this.y);
          ctx.lineTo(screenX + lx + 10, this.y + this.height);
          ctx.stroke();
        }
        // Direction arrows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const arrowDir = this.conveyorSpeed > 0 ? 1 : -1;
        for (let i = 0; i < 3; i++) {
          const ax = screenX + (this.width / 4) * (i + 1);
          ctx.beginPath();
          ctx.moveTo(ax - 5 * arrowDir, this.y + this.height / 2 - 3);
          ctx.lineTo(ax + 5 * arrowDir, this.y + this.height / 2);
          ctx.lineTo(ax - 5 * arrowDir, this.y + this.height / 2 + 3);
          ctx.fill();
        }
        break;

      case 'gravity':
        // Magical pink/purple gradient
        const gravGradient = ctx.createLinearGradient(screenX, this.y, screenX + this.width, this.y + this.height);
        gravGradient.addColorStop(0, '#d53f8c');
        gravGradient.addColorStop(0.5, '#805ad5');
        gravGradient.addColorStop(1, '#d53f8c');
        ctx.fillStyle = gravGradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Floating particles effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const gravTime = Date.now() * 0.003;
        for (let i = 0; i < 4; i++) {
          const gx = screenX + (this.width / 5) * (i + 1);
          const gy = this.y + this.height / 2 + Math.sin(gravTime + i * 0.8) * 8;
          ctx.beginPath();
          ctx.arc(gx, gy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // Up/down arrows
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        const arrowY = this.y + this.height / 2;
        ctx.beginPath();
        ctx.moveTo(screenX + this.width / 2, arrowY - 6);
        ctx.lineTo(screenX + this.width / 2 - 4, arrowY);
        ctx.lineTo(screenX + this.width / 2 + 4, arrowY);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + this.width / 2, arrowY + 6);
        ctx.lineTo(screenX + this.width / 2 - 4, arrowY);
        ctx.lineTo(screenX + this.width / 2 + 4, arrowY);
        ctx.closePath();
        ctx.stroke();
        break;

      case 'sticky':
        // Yellow/amber honey-like platform
        gradient.addColorStop(0, '#ecc94b');
        gradient.addColorStop(1, '#d69e2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Dripping honey effect
        ctx.fillStyle = '#d69e2e';
        for (let i = 0; i < 4; i++) {
          const dx = screenX + (this.width / 5) * (i + 1);
          const dripHeight = 5 + Math.sin(Date.now() * 0.002 + i) * 3;
          ctx.beginPath();
          ctx.ellipse(dx, this.y + this.height + dripHeight / 2, 4, dripHeight, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(screenX + 5, this.y + 3, this.width * 0.4, 4);
        break;

      case 'glass':
        // Transparent glass platform
        ctx.fillStyle = this.glassHits === 0
          ? 'rgba(226, 232, 240, 0.6)'
          : 'rgba(226, 232, 240, 0.4)';
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Reflection shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(screenX + 5, this.y + 2, this.width * 0.6, 3);
        // Cracks if hit once
        if (this.glassHits >= 1) {
          ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
          ctx.lineWidth = 1;
          // Draw crack pattern
          const cx = screenX + this.width / 2;
          const cy = this.y + this.height / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 15, cy - 8);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 12, cy - 6);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 8, cy + 7);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 10, cy + 5);
          ctx.stroke();
        }
        // Border
        ctx.strokeStyle = 'rgba(200, 220, 240, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, this.y, this.width, this.height);
        break;

      case 'slowmo':
        // Cyan/blue time-warp zone
        const slowmoGradient = ctx.createRadialGradient(
          screenX + this.width / 2, this.y + this.height / 2, 0,
          screenX + this.width / 2, this.y + this.height / 2, Math.max(this.width, this.height)
        );
        slowmoGradient.addColorStop(0, 'rgba(0, 200, 255, 0.4)');
        slowmoGradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.2)');
        slowmoGradient.addColorStop(1, 'rgba(0, 100, 255, 0.1)');
        ctx.fillStyle = slowmoGradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Clock/time particles
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        const slowTime = Date.now() * 0.001; // Slow animation
        const clockX = screenX + this.width / 2;
        const clockY = this.y + this.height / 2;
        ctx.beginPath();
        ctx.arc(clockX, clockY, 15, 0, Math.PI * 2);
        ctx.stroke();
        // Clock hands
        ctx.beginPath();
        ctx.moveTo(clockX, clockY);
        ctx.lineTo(clockX + Math.cos(slowTime) * 10, clockY + Math.sin(slowTime) * 10);
        ctx.stroke();
        // Dashed border
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
        ctx.strokeRect(screenX, this.y, this.width, this.height);
        ctx.setLineDash([]);
        break;

      case 'wall':
        // Vertical wall for wall-jumping (dark metallic)
        const wallGradient = ctx.createLinearGradient(screenX, this.y, screenX + this.width, this.y);
        wallGradient.addColorStop(0, '#4a5568');
        wallGradient.addColorStop(0.5, '#718096');
        wallGradient.addColorStop(1, '#4a5568');
        ctx.fillStyle = wallGradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Grip texture lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let wy = this.y + 10; wy < this.y + this.height; wy += 15) {
          ctx.beginPath();
          ctx.moveTo(screenX + 3, wy);
          ctx.lineTo(screenX + this.width - 3, wy);
          ctx.stroke();
        }
        // Wall jump arrows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const wallCenterY = this.y + this.height / 2;
        ctx.beginPath();
        ctx.moveTo(screenX + this.width + 5, wallCenterY - 10);
        ctx.lineTo(screenX + this.width + 15, wallCenterY);
        ctx.lineTo(screenX + this.width + 5, wallCenterY + 10);
        ctx.fill();
        break;

      case 'secret':
        // Hidden platform - only visible when revealed
        if (!this.secretRevealed) {
          // Draw faint shimmer hint
          const shimmerTime = Date.now() * 0.003;
          ctx.globalAlpha = 0.1 + Math.sin(shimmerTime) * 0.05;
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.fillRect(screenX, this.y, this.width, this.height);
          ctx.globalAlpha = 1;
        } else {
          // Fade in golden platform
          ctx.globalAlpha = this.secretRevealProgress;
          const secretGradient = ctx.createLinearGradient(screenX, this.y, screenX, this.y + this.height);
          secretGradient.addColorStop(0, '#ffd700');
          secretGradient.addColorStop(0.5, '#ffec8b');
          secretGradient.addColorStop(1, '#ffd700');
          ctx.fillStyle = secretGradient;
          ctx.fillRect(screenX, this.y, this.width, this.height);
          // Sparkle effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          const sparkleTime = Date.now() * 0.005;
          for (let i = 0; i < 3; i++) {
            const sx = screenX + (this.width / 4) * (i + 1);
            const sy = this.y + this.height / 2 + Math.sin(sparkleTime + i) * 5;
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          // "SECRET" text
          if (this.secretRevealProgress > 0.5) {
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = 'rgba(139, 69, 19, 0.8)';
            ctx.textAlign = 'center';
            ctx.fillText('SECRET', screenX + this.width / 2, this.y + this.height / 2 + 4);
          }
          ctx.globalAlpha = 1;
        }
        break;

      default: // solid
        gradient.addColorStop(0, '#5a6a7a');
        gradient.addColorStop(1, '#3a4a5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(screenX, this.y, this.width, 3);
        break;
    }

    // Border (except for spikes)
    if (this.type !== 'spike') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, this.y, this.width, this.height);
    }

    // Draw colorblind mode patterns/icons
    if (Platform.colorblindMode) {
      this.drawColorblindPattern(ctx, screenX);
    }
  }

  // Draw distinctive patterns for colorblind accessibility
  private drawColorblindPattern(ctx: CanvasRenderingContext2D, screenX: number): void {
    const centerX = screenX + this.width / 2;
    const centerY = this.y + this.height / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    switch (this.type) {
      case 'spike':
      case 'lava':
        // Skull/danger icon - X pattern
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 8, centerY - 8);
        ctx.lineTo(centerX + 8, centerY + 8);
        ctx.moveTo(centerX + 8, centerY - 8);
        ctx.lineTo(centerX - 8, centerY + 8);
        ctx.stroke();
        break;

      case 'bounce':
        // Up arrow (spring)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX - 8, centerY + 2);
        ctx.lineTo(centerX - 3, centerY + 2);
        ctx.lineTo(centerX - 3, centerY + 10);
        ctx.lineTo(centerX + 3, centerY + 10);
        ctx.lineTo(centerX + 3, centerY + 2);
        ctx.lineTo(centerX + 8, centerY + 2);
        ctx.closePath();
        ctx.fill();
        break;

      case 'ice':
        // Snowflake pattern - asterisk
        ctx.strokeStyle = 'rgba(0, 0, 100, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + Math.cos(angle) * 10, centerY + Math.sin(angle) * 10);
          ctx.stroke();
        }
        break;

      case 'crumble':
        // Broken/cracked - dashed lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(screenX + 5, this.y + 5, this.width - 10, this.height - 10);
        ctx.setLineDash([]);
        break;

      case 'moving':
        // Double-headed arrow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY);
        ctx.lineTo(centerX - 5, centerY - 6);
        ctx.lineTo(centerX - 5, centerY + 6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + 12, centerY);
        ctx.lineTo(centerX + 5, centerY - 6);
        ctx.lineTo(centerX + 5, centerY + 6);
        ctx.closePath();
        ctx.fill();
        break;

      case 'phase':
        // Ghost/dotted circle
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        break;

      case 'conveyor':
        // Triple chevrons
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        const dir = this.conveyorSpeed > 0 ? 1 : -1;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX + i * 8 - 4 * dir, centerY - 6);
          ctx.lineTo(centerX + i * 8 + 4 * dir, centerY);
          ctx.lineTo(centerX + i * 8 - 4 * dir, centerY + 6);
          ctx.stroke();
        }
        break;

      case 'gravity':
        // Up-down arrows
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        // Up arrow
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 12);
        ctx.lineTo(centerX - 6, centerY - 4);
        ctx.lineTo(centerX + 6, centerY - 4);
        ctx.closePath();
        ctx.fill();
        // Down arrow
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + 12);
        ctx.lineTo(centerX - 6, centerY + 4);
        ctx.lineTo(centerX + 6, centerY + 4);
        ctx.closePath();
        ctx.fill();
        break;

      case 'sticky':
        // Dots pattern (honey drops)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(centerX + (i - 1) * 12, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'glass':
        // Diamond pattern
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX + 10, centerY);
        ctx.lineTo(centerX, centerY + 10);
        ctx.lineTo(centerX - 10, centerY);
        ctx.closePath();
        ctx.stroke();
        break;

      case 'slowmo':
        // Clock icon
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - 7);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + 5, centerY);
        ctx.stroke();
        break;

      case 'wall':
        // Vertical bars
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX + i * 6, centerY - 10);
          ctx.lineTo(centerX + i * 6, centerY + 10);
          ctx.stroke();
        }
        break;

      case 'secret':
        // Question mark
        if (this.secretRevealed) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillText('?', centerX, centerY);
        }
        break;

      case 'solid':
      default:
        // Simple square
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 6, centerY - 6, 12, 12);
        break;
    }

    ctx.restore();
  }
}
