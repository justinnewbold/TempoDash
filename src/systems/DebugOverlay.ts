// Debug overlay for development and performance monitoring
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
  memoryUsed: number;
  activeParticles: number;
  platformCount: number;
  coinCount: number;
}

interface FrameTimeSample {
  time: number;
  value: number;
}

export class DebugOverlay {
  private enabled = false;
  private showHitboxes = false;
  private showGrid = false;

  // Performance tracking
  private frameTimeHistory: FrameTimeSample[] = [];
  private maxHistoryLength = 60;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateTimer = 0;
  private currentFps = 0;

  // Timing measurements
  private updateStartTime = 0;
  private renderStartTime = 0;
  private lastUpdateDuration = 0;
  private lastRenderDuration = 0;

  // Game state references
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    updateTime: 0,
    renderTime: 0,
    memoryUsed: 0,
    activeParticles: 0,
    platformCount: 0,
    coinCount: 0,
  };

  constructor() {
    // Listen for debug toggle key
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        e.preventDefault();
        this.toggle();
      }
      if (e.code === 'F4' && this.enabled) {
        e.preventDefault();
        this.showHitboxes = !this.showHitboxes;
      }
      if (e.code === 'F5' && this.enabled) {
        e.preventDefault();
        this.showGrid = !this.showGrid;
      }
    });
  }

  toggle(): void {
    this.enabled = !this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  shouldShowHitboxes(): boolean {
    return this.enabled && this.showHitboxes;
  }

  shouldShowGrid(): boolean {
    return this.enabled && this.showGrid;
  }

  // Call at the start of update
  beginUpdate(): void {
    this.updateStartTime = performance.now();
  }

  // Call at the end of update
  endUpdate(): void {
    this.lastUpdateDuration = performance.now() - this.updateStartTime;
  }

  // Call at the start of render
  beginRender(): void {
    this.renderStartTime = performance.now();
  }

  // Call at the end of render
  endRender(): void {
    this.lastRenderDuration = performance.now() - this.renderStartTime;
  }

  // Update frame timing
  updateFrame(currentTime: number): void {
    if (this.lastFrameTime > 0) {
      const frameTime = currentTime - this.lastFrameTime;
      this.frameTimeHistory.push({ time: currentTime, value: frameTime });

      // Keep history limited
      if (this.frameTimeHistory.length > this.maxHistoryLength) {
        this.frameTimeHistory.shift();
      }

      this.metrics.frameTime = frameTime;
    }
    this.lastFrameTime = currentTime;

    // Update FPS counter every 500ms
    this.frameCount++;
    this.fpsUpdateTimer += this.metrics.frameTime;
    if (this.fpsUpdateTimer >= 500) {
      this.currentFps = Math.round(this.frameCount / (this.fpsUpdateTimer / 1000));
      this.metrics.fps = this.currentFps;
      this.frameCount = 0;
      this.fpsUpdateTimer = 0;
    }

    this.metrics.updateTime = this.lastUpdateDuration;
    this.metrics.renderTime = this.lastRenderDuration;

    // Memory usage (if available)
    if ((performance as unknown as { memory?: { usedJSHeapSize: number } }).memory) {
      this.metrics.memoryUsed = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1024 / 1024;
    }
  }

  // Update game-related metrics
  updateGameMetrics(activeParticles: number, platformCount: number, coinCount: number): void {
    this.metrics.activeParticles = activeParticles;
    this.metrics.platformCount = platformCount;
    this.metrics.coinCount = coinCount;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number = 0): void {
    if (!this.enabled) return;

    // Draw debug overlay background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, 5, 200, 180);

    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    // FPS with color coding
    const fpsColor = this.metrics.fps >= 55 ? '#00ff00' : this.metrics.fps >= 30 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = fpsColor;
    ctx.fillText(`FPS: ${this.metrics.fps}`, 10, 20);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Frame: ${this.metrics.frameTime.toFixed(2)}ms`, 10, 35);
    ctx.fillText(`Update: ${this.metrics.updateTime.toFixed(2)}ms`, 10, 50);
    ctx.fillText(`Render: ${this.metrics.renderTime.toFixed(2)}ms`, 10, 65);

    if (this.metrics.memoryUsed > 0) {
      ctx.fillText(`Memory: ${this.metrics.memoryUsed.toFixed(1)}MB`, 10, 80);
    }

    ctx.fillStyle = '#88ffff';
    ctx.fillText(`Particles: ${this.metrics.activeParticles}`, 10, 100);
    ctx.fillText(`Platforms: ${this.metrics.platformCount}`, 10, 115);
    ctx.fillText(`Coins: ${this.metrics.coinCount}`, 10, 130);

    ctx.fillStyle = '#ffff88';
    ctx.fillText(`Camera X: ${Math.round(cameraX)}`, 10, 150);

    ctx.fillStyle = '#888888';
    ctx.fillText(`F3: Toggle | F4: Hitboxes | F5: Grid`, 10, 170);

    // Draw frame time graph
    this.renderFrameTimeGraph(ctx);

    // Draw grid if enabled
    if (this.showGrid) {
      this.renderGrid(ctx, cameraX);
    }
  }

  private renderFrameTimeGraph(ctx: CanvasRenderingContext2D): void {
    const graphX = GAME_WIDTH - 205;
    const graphY = 5;
    const graphWidth = 200;
    const graphHeight = 60;
    const targetFrameTime = 16.67; // 60fps
    const maxFrameTime = 50;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(graphX, graphY, graphWidth, graphHeight);

    // Target line (60fps)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const targetY = graphY + graphHeight - (targetFrameTime / maxFrameTime) * graphHeight;
    ctx.moveTo(graphX, targetY);
    ctx.lineTo(graphX + graphWidth, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Frame time line
    if (this.frameTimeHistory.length > 1) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let i = 0; i < this.frameTimeHistory.length; i++) {
        const x = graphX + (i / this.maxHistoryLength) * graphWidth;
        const value = Math.min(this.frameTimeHistory[i].value, maxFrameTime);
        const y = graphY + graphHeight - (value / maxFrameTime) * graphHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Frame Time', graphX + graphWidth - 5, graphY + 12);
    ctx.fillText('16.67ms', graphX + graphWidth - 5, targetY - 2);
  }

  private renderGrid(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const gridSize = 50;
    const startX = Math.floor(cameraX / gridSize) * gridSize - cameraX;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = startX; x < GAME_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Grid coordinates
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    for (let x = startX; x < GAME_WIDTH; x += gridSize) {
      const worldX = x + cameraX;
      ctx.fillText(String(Math.round(worldX)), x + 2, 12);
    }

    for (let y = gridSize; y < GAME_HEIGHT; y += gridSize) {
      ctx.fillText(String(y), 2, y - 2);
    }
  }

  renderHitbox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string = '#ff0000'): void {
    if (!this.shouldShowHitboxes()) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  }
}
