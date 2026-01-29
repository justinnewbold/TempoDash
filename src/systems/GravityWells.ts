import { GAME_WIDTH } from '../constants';

export interface GravityWellConfig {
  x: number;
  y: number;
  radius: number;
  strength: number; // Positive = attract toward center, negative = repel from center
}

class GravityWell {
  x: number;
  y: number;
  radius: number;
  strength: number;
  private animationTime = 0;
  private pulsePhase = 0;

  constructor(config: GravityWellConfig) {
    this.x = config.x;
    this.y = config.y;
    this.radius = config.radius;
    this.strength = config.strength;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;
  }

  /**
   * Calculate gravitational force on the player.
   * Returns force vector { fx, fy } to be applied to player velocity.
   */
  applyForce(playerX: number, playerY: number, deltaTime: number): { fx: number; fy: number } {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Outside radius = no effect
    if (distance > this.radius || distance < 5) {
      return { fx: 0, fy: 0 };
    }

    // Force increases as player gets closer (inverse distance, capped)
    const normalizedDist = distance / this.radius; // 0 at center, 1 at edge
    const falloff = 1 - normalizedDist; // 1 at center, 0 at edge
    const forceMagnitude = this.strength * falloff * (deltaTime / 1000);

    // Direction: toward center if attract (positive), away if repel (negative)
    const dirX = dx / distance;
    const dirY = dy / distance;

    return {
      fx: dirX * forceMagnitude,
      fy: dirY * forceMagnitude,
    };
  }

  isPlayerInRange(playerX: number, playerY: number): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.x - cameraX;

    // Skip if off screen
    if (screenX + this.radius < -50 || screenX - this.radius > GAME_WIDTH + 50) return;

    ctx.save();

    const isAttract = this.strength > 0;
    const baseColor = isAttract ? '138, 43, 226' : '255, 100, 50'; // Purple for attract, orange for repel

    // Pulsing radius effect
    const pulse = Math.sin(this.animationTime * 0.003 + this.pulsePhase) * 0.1 + 1;
    const displayRadius = this.radius * pulse;

    // Outer field boundary (subtle)
    ctx.strokeStyle = `rgba(${baseColor}, 0.2)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.arc(screenX, this.y, displayRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Concentric rings showing field intensity
    const ringCount = 3;
    for (let i = ringCount; i >= 1; i--) {
      const ringRadius = displayRadius * (i / (ringCount + 1));
      const ringAlpha = 0.05 + (1 - i / ringCount) * 0.1;

      ctx.fillStyle = `rgba(${baseColor}, ${ringAlpha})`;
      ctx.beginPath();
      ctx.arc(screenX, this.y, ringRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Animated flow lines showing direction
    const lineCount = 8;
    const flowSpeed = isAttract ? -0.003 : 0.003; // Inward for attract, outward for repel
    for (let i = 0; i < lineCount; i++) {
      const angle = (Math.PI * 2 / lineCount) * i;
      const flowPhase = (this.animationTime * flowSpeed + i * 0.3) % 1;
      const flowDist = isAttract
        ? displayRadius * (1 - flowPhase) // Moving inward
        : displayRadius * flowPhase;      // Moving outward

      const lineAlpha = isAttract
        ? flowPhase * 0.6       // Brighter as it approaches center
        : (1 - flowPhase) * 0.6; // Brighter near center

      const lx = screenX + Math.cos(angle) * flowDist;
      const ly = this.y + Math.sin(angle) * flowDist;
      const lineLen = 8;
      const endX = screenX + Math.cos(angle) * (flowDist - lineLen * (isAttract ? 1 : -1));
      const endY = this.y + Math.sin(angle) * (flowDist - lineLen * (isAttract ? 1 : -1));

      ctx.strokeStyle = `rgba(${baseColor}, ${lineAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Center orb
    const centerGlow = ctx.createRadialGradient(screenX, this.y, 0, screenX, this.y, 15);
    centerGlow.addColorStop(0, `rgba(255, 255, 255, 0.8)`);
    centerGlow.addColorStop(0.4, `rgba(${baseColor}, 0.6)`);
    centerGlow.addColorStop(1, `rgba(${baseColor}, 0)`);
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(screenX, this.y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Icon in center: arrow pointing in (attract) or out (repel)
    ctx.fillStyle = `rgba(255, 255, 255, 0.7)`;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isAttract ? '◉' : '◎', screenX, this.y);

    ctx.restore();
  }
}

export class GravityWellManager {
  private wells: GravityWell[] = [];

  addWell(config: GravityWellConfig): void {
    this.wells.push(new GravityWell(config));
  }

  clear(): void {
    this.wells = [];
  }

  update(deltaTime: number): void {
    for (const well of this.wells) {
      well.update(deltaTime);
    }
  }

  /**
   * Calculate the total gravitational force from all wells on the player.
   */
  applyForces(playerX: number, playerY: number, deltaTime: number): { fx: number; fy: number } {
    let totalFx = 0;
    let totalFy = 0;

    for (const well of this.wells) {
      const force = well.applyForce(playerX, playerY, deltaTime);
      totalFx += force.fx;
      totalFy += force.fy;
    }

    return { fx: totalFx, fy: totalFy };
  }

  /**
   * Check if the player is within any gravity well.
   */
  isPlayerInAnyWell(playerX: number, playerY: number): boolean {
    for (const well of this.wells) {
      if (well.isPlayerInRange(playerX, playerY)) {
        return true;
      }
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    for (const well of this.wells) {
      well.render(ctx, cameraX);
    }
  }

  getWells(): GravityWell[] {
    return this.wells;
  }
}
