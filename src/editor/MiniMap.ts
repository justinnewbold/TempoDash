/**
 * MiniMap - Level overview for quick navigation
 * Shows entire level with current viewport highlighted
 */

import { CustomLevel } from '../types';

export type MiniMapCallback = (worldX: number) => void;

export class MiniMap {
  private isVisible = true;
  private isExpanded = false;

  // Dimensions
  private readonly collapsedWidth = 120;
  private readonly collapsedHeight = 60;
  private readonly expandedWidth = 200;
  private readonly expandedHeight = 100;
  private readonly margin = 12;
  private readonly borderRadius = 8;

  // Position (top-right corner)
  private x = 0;
  private y = 0;

  // Animation
  private currentWidth: number;
  private currentHeight: number;
  private animationSpeed = 0.15;

  // Interaction callback
  private callback: MiniMapCallback;

  constructor(callback: MiniMapCallback) {
    this.callback = callback;
    this.currentWidth = this.collapsedWidth;
    this.currentHeight = this.collapsedHeight;
  }

  setPosition(canvasWidth: number, toolbarHeight: number): void {
    this.x = canvasWidth - this.currentWidth - this.margin;
    this.y = toolbarHeight + this.margin;
  }

  toggle(): void {
    this.isExpanded = !this.isExpanded;
  }

  show(): void {
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }

  update(_deltaTime: number): void {
    const targetWidth = this.isExpanded ? this.expandedWidth : this.collapsedWidth;
    const targetHeight = this.isExpanded ? this.expandedHeight : this.collapsedHeight;

    // Animate size
    const widthDiff = targetWidth - this.currentWidth;
    const heightDiff = targetHeight - this.currentHeight;

    if (Math.abs(widthDiff) > 0.5) {
      this.currentWidth += widthDiff * this.animationSpeed;
    } else {
      this.currentWidth = targetWidth;
    }

    if (Math.abs(heightDiff) > 0.5) {
      this.currentHeight += heightDiff * this.animationSpeed;
    } else {
      this.currentHeight = targetHeight;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    level: CustomLevel,
    cameraX: number,
    viewportWidth: number,
    canvasWidth: number,
    toolbarHeight: number
  ): void {
    if (!this.isVisible) return;

    this.setPosition(canvasWidth, toolbarHeight);

    // Calculate level bounds
    const levelStart = 0;
    let levelEnd = 1000;

    for (const platform of level.platforms) {
      levelEnd = Math.max(levelEnd, platform.x + platform.width);
    }
    for (const coin of level.coins) {
      levelEnd = Math.max(levelEnd, coin.x + 20);
    }
    if (level.goal) {
      levelEnd = Math.max(levelEnd, level.goal.x + level.goal.width);
    }

    levelEnd += 200; // Add some padding

    const levelWidth = levelEnd - levelStart;
    const scale = this.currentWidth / levelWidth;

    // Background with shadow
    ctx.save();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.currentWidth, this.currentHeight, this.borderRadius);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = '#4a4a5e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Clip to minimap area
    ctx.beginPath();
    ctx.roundRect(this.x + 2, this.y + 2, this.currentWidth - 4, this.currentHeight - 4, this.borderRadius - 2);
    ctx.clip();

    // Ground line
    const groundY = this.y + this.currentHeight - 10;
    ctx.strokeStyle = '#3a3a4e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, groundY);
    ctx.lineTo(this.x + this.currentWidth, groundY);
    ctx.stroke();

    // Platforms
    for (const platform of level.platforms) {
      const px = this.x + (platform.x - levelStart) * scale;
      const py = groundY - (500 - platform.y) * (this.currentHeight / 600);
      const pw = Math.max(2, platform.width * scale);
      const ph = Math.max(1, platform.height * scale * 0.5);

      ctx.fillStyle = this.getPlatformColor(platform.type);
      ctx.fillRect(px, py, pw, ph);
    }

    // Coins (small dots)
    ctx.fillStyle = '#ffd700';
    for (const coin of level.coins) {
      const cx = this.x + (coin.x - levelStart) * scale;
      const cy = groundY - (500 - coin.y) * (this.currentHeight / 600);
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player start
    if (level.playerStart) {
      const px = this.x + (level.playerStart.x - levelStart) * scale;
      const py = groundY - (500 - level.playerStart.y) * (this.currentHeight / 600);
      ctx.fillStyle = '#00ffaa';
      ctx.fillRect(px - 2, py - 4, 4, 4);
    }

    // Goal
    if (level.goal) {
      const gx = this.x + (level.goal.x - levelStart) * scale;
      const gy = groundY - (500 - level.goal.y) * (this.currentHeight / 600);
      const gw = Math.max(4, level.goal.width * scale);
      ctx.fillStyle = 'rgba(0, 255, 100, 0.5)';
      ctx.fillRect(gx, gy - 8, gw, 10);
    }

    ctx.restore();

    // Viewport indicator
    const vpX = this.x + (cameraX - levelStart) * scale;
    const vpWidth = Math.min(this.currentWidth - vpX + this.x, viewportWidth * scale);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      Math.max(this.x, vpX),
      this.y + 4,
      Math.max(10, vpWidth),
      this.currentHeight - 8
    );

    // Expand/collapse indicator
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.isExpanded ? '−' : '+',
      this.x + this.currentWidth - 10,
      this.y + 12
    );
  }

  private getPlatformColor(type: string): string {
    const colors: Record<string, string> = {
      solid: '#4a9eff',
      bounce: '#ff6b9d',
      ice: '#88ddff',
      lava: '#ff4400',
      spike: '#ff0000',
      moving: '#9966ff',
      phase: '#66ffaa',
      crumble: '#aa8866',
      conveyor: '#48bb78',
      gravity: '#ed64a6',
      sticky: '#ecc94b',
      glass: '#e2e8f0',
    };
    return colors[type] || '#4a9eff';
  }

  // Handle tap on minimap
  handleTap(tapX: number, tapY: number, level: CustomLevel): boolean {
    if (!this.isVisible) return false;

    // Check if tap is in minimap bounds
    if (tapX < this.x || tapX > this.x + this.currentWidth ||
        tapY < this.y || tapY > this.y + this.currentHeight) {
      return false;
    }

    // Check expand/collapse button
    if (tapX > this.x + this.currentWidth - 20 && tapY < this.y + 20) {
      this.toggle();
      return true;
    }

    // Calculate world X from tap position (must match render() bounds calculation)
    let levelEnd = 1000;
    for (const platform of level.platforms) {
      levelEnd = Math.max(levelEnd, platform.x + platform.width);
    }
    for (const coin of level.coins) {
      levelEnd = Math.max(levelEnd, coin.x + 20);
    }
    if (level.goal) {
      levelEnd = Math.max(levelEnd, level.goal.x + level.goal.width);
    }
    levelEnd += 200;

    const levelWidth = levelEnd;
    const relX = (tapX - this.x) / this.currentWidth;
    const worldX = relX * levelWidth;

    this.callback(worldX);
    return true;
  }

  // Handle drag on minimap
  handleDrag(tapX: number, tapY: number, level: CustomLevel): boolean {
    if (!this.isVisible) return false;

    // Check if in minimap bounds
    if (tapX < this.x || tapX > this.x + this.currentWidth ||
        tapY < this.y || tapY > this.y + this.currentHeight) {
      return false;
    }

    // Calculate world X (must match render() bounds calculation)
    let levelEnd = 1000;
    for (const platform of level.platforms) {
      levelEnd = Math.max(levelEnd, platform.x + platform.width);
    }
    for (const coin of level.coins) {
      levelEnd = Math.max(levelEnd, coin.x + 20);
    }
    if (level.goal) {
      levelEnd = Math.max(levelEnd, level.goal.x + level.goal.width);
    }
    levelEnd += 200;

    const levelWidth = levelEnd;
    const relX = (tapX - this.x) / this.currentWidth;
    const worldX = relX * levelWidth;

    this.callback(worldX);
    return true;
  }

  handleDragEnd(): void {
    // Called when drag ends, can be used for cleanup
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.currentWidth,
      height: this.currentHeight,
    };
  }
}
