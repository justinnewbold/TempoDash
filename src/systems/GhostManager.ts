import { GhostFrame } from '../types';

const RECORD_INTERVAL = 50; // Record position every 50ms

export class GhostManager {
  private isRecording = false;
  private isPlaying = false;
  private frames: GhostFrame[] = [];
  private playbackIndex = 0;
  private recordTimer = 0;
  private playbackTime = 0;
  private ghostX = 0;
  private ghostY = 0;
  private ghostRotation = 0;
  private ghostOpacity = 0.5;

  startRecording(): void {
    this.isRecording = true;
    this.frames = [];
    this.recordTimer = 0;
  }

  stopRecording(): GhostFrame[] {
    this.isRecording = false;
    return [...this.frames];
  }

  recordFrame(x: number, y: number, rotation: number, time: number): void {
    if (!this.isRecording) return;

    this.recordTimer += time;
    if (this.recordTimer >= RECORD_INTERVAL) {
      this.frames.push({
        x,
        y,
        rotation,
        time: this.frames.length * RECORD_INTERVAL,
      });
      this.recordTimer = 0;
    }
  }

  startPlayback(frames: GhostFrame[]): void {
    if (frames.length === 0) return;
    this.frames = frames;
    this.isPlaying = true;
    this.playbackIndex = 0;
    this.playbackTime = 0;
    this.ghostX = frames[0].x;
    this.ghostY = frames[0].y;
    this.ghostRotation = frames[0].rotation;
  }

  stopPlayback(): void {
    this.isPlaying = false;
    this.playbackIndex = 0;
  }

  update(deltaTime: number): void {
    if (!this.isPlaying || this.frames.length === 0) return;

    this.playbackTime += deltaTime;

    // Find the appropriate frame based on time
    while (
      this.playbackIndex < this.frames.length - 1 &&
      this.frames[this.playbackIndex + 1].time <= this.playbackTime
    ) {
      this.playbackIndex++;
    }

    // Interpolate between frames for smooth playback
    const currentFrame = this.frames[this.playbackIndex];
    const nextFrame = this.frames[Math.min(this.playbackIndex + 1, this.frames.length - 1)];

    if (currentFrame.time !== nextFrame.time) {
      const t = (this.playbackTime - currentFrame.time) / (nextFrame.time - currentFrame.time);
      const clampedT = Math.max(0, Math.min(1, t));

      this.ghostX = currentFrame.x + (nextFrame.x - currentFrame.x) * clampedT;
      this.ghostY = currentFrame.y + (nextFrame.y - currentFrame.y) * clampedT;
      this.ghostRotation = currentFrame.rotation + (nextFrame.rotation - currentFrame.rotation) * clampedT;
    } else {
      this.ghostX = currentFrame.x;
      this.ghostY = currentFrame.y;
      this.ghostRotation = currentFrame.rotation;
    }

    // End playback when we've gone through all frames
    if (this.playbackIndex >= this.frames.length - 1) {
      this.isPlaying = false;
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    if (!this.isPlaying) return;

    const screenX = this.ghostX - cameraX;
    const screenY = this.ghostY;

    ctx.save();
    ctx.globalAlpha = this.ghostOpacity;

    // Draw ghost player (semi-transparent cube)
    ctx.translate(screenX + 15, screenY + 15);
    ctx.rotate(this.ghostRotation);

    // Ghost body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.fillRect(-15, -15, 30, 30);
    ctx.strokeRect(-15, -15, 30, 30);

    // Ghost eyes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(-8, -6, 6, 6);
    ctx.fillRect(2, -6, 6, 6);

    ctx.restore();
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getRecordedFrames(): GhostFrame[] {
    return [...this.frames];
  }

  getPlaybackProgress(): number {
    if (this.frames.length === 0) return 0;
    return this.playbackIndex / (this.frames.length - 1);
  }
}
