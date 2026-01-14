// Time Rewind System
// Record player state, allow rewinding on death

interface RewindFrame {
  x: number;
  y: number;
  velocityY: number;
  rotation: number;
  timestamp: number;
  cameraX: number;
}

export class TimeRewindManager {
  private frames: RewindFrame[] = [];
  private isRewinding = false;
  private rewindProgress = 0;  // 0-1 progress through rewind
  private rewindStartIndex = 0;
  private rewindTargetIndex = 0;
  private rewindSpeed = 3;  // Frames per update during rewind visualization

  // Configuration
  private static readonly MAX_REWIND_TIME = 3000;    // 3 seconds of history
  private static readonly FRAME_INTERVAL = 16;       // Record every ~16ms (60fps)
  private static readonly MAX_REWINDS_PER_LEVEL = 3;

  private rewindsRemaining = TimeRewindManager.MAX_REWINDS_PER_LEVEL;
  private lastRecordTime = 0;
  private rewindVisualTimer = 0;

  // Visual effect state
  private rewindFlashOpacity = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.frames = [];
    this.isRewinding = false;
    this.rewindProgress = 0;
    this.rewindsRemaining = TimeRewindManager.MAX_REWINDS_PER_LEVEL;
    this.lastRecordTime = 0;
    this.rewindFlashOpacity = 0;
  }

  // Reset rewinds for new level (keeps recording)
  resetRewindsForLevel(): void {
    this.rewindsRemaining = TimeRewindManager.MAX_REWINDS_PER_LEVEL;
  }

  // Call this every frame during normal gameplay to record player state
  recordFrame(x: number, y: number, velocityY: number, rotation: number, cameraX: number): void {
    if (this.isRewinding) return;

    const now = performance.now();
    if (now - this.lastRecordTime < TimeRewindManager.FRAME_INTERVAL) return;

    this.lastRecordTime = now;

    this.frames.push({
      x,
      y,
      velocityY,
      rotation,
      timestamp: now,
      cameraX,
    });

    // Remove old frames beyond max rewind time
    const cutoffTime = now - TimeRewindManager.MAX_REWIND_TIME;
    while (this.frames.length > 0 && this.frames[0].timestamp < cutoffTime) {
      this.frames.shift();
    }
  }

  // Check if player can rewind (has rewinds left and enough history)
  canRewind(): boolean {
    return this.rewindsRemaining > 0 && this.frames.length > 10 && !this.isRewinding;
  }

  // Start the rewind process
  startRewind(): boolean {
    if (!this.canRewind()) return false;

    this.isRewinding = true;
    this.rewindsRemaining--;
    this.rewindStartIndex = this.frames.length - 1;
    // Rewind to about 2 seconds ago, or as far as we can
    const targetTime = performance.now() - 2000;
    this.rewindTargetIndex = this.frames.findIndex(f => f.timestamp >= targetTime);
    if (this.rewindTargetIndex < 0) this.rewindTargetIndex = 0;
    this.rewindProgress = 0;
    this.rewindVisualTimer = 0;
    this.rewindFlashOpacity = 0.8;

    return true;
  }

  // Update rewind animation
  update(deltaTime: number): RewindFrame | null {
    // Decay flash effect
    if (this.rewindFlashOpacity > 0) {
      this.rewindFlashOpacity = Math.max(0, this.rewindFlashOpacity - deltaTime * 0.002);
    }

    if (!this.isRewinding) return null;

    this.rewindVisualTimer += deltaTime;

    // Calculate current frame index based on progress
    const totalFrames = this.rewindStartIndex - this.rewindTargetIndex;
    const progressPerFrame = 1 / totalFrames;
    this.rewindProgress += progressPerFrame * this.rewindSpeed;

    if (this.rewindProgress >= 1) {
      // Rewind complete
      this.isRewinding = false;
      this.rewindProgress = 1;

      // Return the target frame and clear history after it
      const targetFrame = this.frames[this.rewindTargetIndex];
      this.frames = this.frames.slice(0, this.rewindTargetIndex + 1);

      return targetFrame;
    }

    return null;
  }

  // Get current visual frame for rewind effect (interpolated)
  getCurrentRewindFrame(): RewindFrame | null {
    if (!this.isRewinding || this.frames.length === 0) return null;

    const currentIndex = Math.floor(
      this.rewindStartIndex - (this.rewindStartIndex - this.rewindTargetIndex) * this.rewindProgress
    );
    return this.frames[Math.max(0, Math.min(currentIndex, this.frames.length - 1))];
  }

  // Get all frames for trail effect during rewind
  getRewindTrailFrames(count: number = 10): RewindFrame[] {
    if (!this.isRewinding || this.frames.length === 0) return [];

    const currentIndex = Math.floor(
      this.rewindStartIndex - (this.rewindStartIndex - this.rewindTargetIndex) * this.rewindProgress
    );

    const trailFrames: RewindFrame[] = [];
    for (let i = 0; i < count && currentIndex + i < this.frames.length; i++) {
      trailFrames.push(this.frames[currentIndex + i]);
    }
    return trailFrames;
  }

  isInRewind(): boolean {
    return this.isRewinding;
  }

  getRewindProgress(): number {
    return this.rewindProgress;
  }

  getRewindsRemaining(): number {
    return this.rewindsRemaining;
  }

  getMaxRewinds(): number {
    return TimeRewindManager.MAX_REWINDS_PER_LEVEL;
  }

  getRewindFlashOpacity(): number {
    return this.rewindFlashOpacity;
  }

  hasRewindsLeft(): boolean {
    return this.rewindsRemaining > 0;
  }

  // Clear recording (call when transitioning screens)
  clearRecording(): void {
    this.frames = [];
    this.lastRecordTime = 0;
  }

  // Render rewind visual effect
  render(ctx: CanvasRenderingContext2D, cameraX: number, playerWidth: number, playerHeight: number): void {
    if (!this.isRewinding) return;

    const trailFrames = this.getRewindTrailFrames(15);

    // Draw trail of player positions going backwards
    for (let i = 0; i < trailFrames.length; i++) {
      const frame = trailFrames[i];
      const alpha = (1 - i / trailFrames.length) * 0.5;
      const screenX = frame.x - cameraX;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(screenX + playerWidth / 2, frame.y + playerHeight / 2);
      ctx.rotate((frame.rotation * Math.PI) / 180);

      // Ghostly blue player silhouette
      ctx.fillStyle = '#00aaff';
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 10;
      ctx.fillRect(-playerWidth / 2, -playerHeight / 2, playerWidth, playerHeight);

      ctx.restore();
    }

    // Current rewind position (brighter)
    const currentFrame = this.getCurrentRewindFrame();
    if (currentFrame) {
      const screenX = currentFrame.x - cameraX;

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.translate(screenX + playerWidth / 2, currentFrame.y + playerHeight / 2);
      ctx.rotate((currentFrame.rotation * Math.PI) / 180);

      ctx.fillStyle = '#44ddff';
      ctx.shadowColor = '#44ddff';
      ctx.shadowBlur = 20;
      ctx.fillRect(-playerWidth / 2, -playerHeight / 2, playerWidth, playerHeight);

      // Rewind icon in center
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏪', 0, 0);

      ctx.restore();
    }
  }

  // Render rewind flash overlay
  renderFlash(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.rewindFlashOpacity <= 0) return;

    ctx.save();
    ctx.fillStyle = `rgba(0, 170, 255, ${this.rewindFlashOpacity * 0.3})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
