// Ghost replay system - records and replays best runs
import { PLAYER } from '../constants';

interface GhostFrame {
  x: number;
  y: number;
  rotation: number;
  isGrounded: boolean;
  isDashing: boolean;
}

interface GhostData {
  levelId: number;
  frames: GhostFrame[];
  completionTime: number;
  totalFrames: number;
}

// Compressed ghost data for storage
interface CompressedGhostData {
  levelId: number;
  completionTime: number;
  // Delta-encoded frames for smaller storage
  data: string;
}

export class GhostReplay {
  private recordingFrames: GhostFrame[] = [];
  private isRecording = false;
  private recordStartTime = 0;

  private playbackFrames: GhostFrame[] = [];
  private playbackIndex = 0;
  private isPlayingBack = false;

  private currentGhostData: GhostData | null = null;

  // Storage key prefix
  private static readonly STORAGE_PREFIX = 'tempoDash_ghost_';
  private static readonly RECORD_INTERVAL = 2; // Record every 2 frames for storage efficiency
  private frameCounter = 0;

  startRecording(_levelId: number): void {
    this.recordingFrames = [];
    this.isRecording = true;
    this.recordStartTime = performance.now();
    this.frameCounter = 0;
  }

  getCurrentGhostData(): GhostData | null {
    return this.currentGhostData;
  }

  stopRecording(): GhostData | null {
    if (!this.isRecording) return null;

    this.isRecording = false;
    const completionTime = performance.now() - this.recordStartTime;

    if (this.recordingFrames.length === 0) return null;

    return {
      levelId: 0, // Will be set by caller
      frames: [...this.recordingFrames],
      completionTime,
      totalFrames: this.recordingFrames.length,
    };
  }

  recordFrame(x: number, y: number, rotation: number, isGrounded: boolean, isDashing: boolean): void {
    if (!this.isRecording) return;

    this.frameCounter++;
    // Only record every Nth frame for storage efficiency
    if (this.frameCounter % GhostReplay.RECORD_INTERVAL !== 0) return;

    this.recordingFrames.push({
      x,
      y,
      rotation,
      isGrounded,
      isDashing,
    });
  }

  startPlayback(ghostData: GhostData): void {
    this.playbackFrames = ghostData.frames;
    this.playbackIndex = 0;
    this.isPlayingBack = true;
    this.currentGhostData = ghostData;
  }

  stopPlayback(): void {
    this.isPlayingBack = false;
    this.playbackIndex = 0;
    this.playbackFrames = [];
    this.currentGhostData = null;
  }

  // Call this each frame during playback
  advancePlayback(): void {
    if (!this.isPlayingBack) return;

    // Advance based on record interval
    this.playbackIndex++;
  }

  getCurrentFrame(): GhostFrame | null {
    if (!this.isPlayingBack || this.playbackIndex >= this.playbackFrames.length) {
      return null;
    }
    return this.playbackFrames[this.playbackIndex];
  }

  // Interpolate ghost position for smooth playback
  getInterpolatedFrame(subFrameProgress: number): GhostFrame | null {
    if (!this.isPlayingBack) return null;

    const currentIndex = Math.floor(this.playbackIndex / GhostReplay.RECORD_INTERVAL);
    const nextIndex = currentIndex + 1;

    if (currentIndex >= this.playbackFrames.length) return null;

    const current = this.playbackFrames[currentIndex];
    if (nextIndex >= this.playbackFrames.length) return current;

    const next = this.playbackFrames[nextIndex];
    const t = (this.playbackIndex % GhostReplay.RECORD_INTERVAL) / GhostReplay.RECORD_INTERVAL + subFrameProgress / GhostReplay.RECORD_INTERVAL;

    return {
      x: current.x + (next.x - current.x) * t,
      y: current.y + (next.y - current.y) * t,
      rotation: current.rotation + (next.rotation - current.rotation) * t,
      isGrounded: current.isGrounded,
      isDashing: current.isDashing || next.isDashing,
    };
  }

  isPlaying(): boolean {
    return this.isPlayingBack;
  }

  isRecordingActive(): boolean {
    return this.isRecording;
  }

  getPlaybackProgress(): number {
    if (!this.isPlayingBack || this.playbackFrames.length === 0) return 0;
    return this.playbackIndex / (this.playbackFrames.length * GhostReplay.RECORD_INTERVAL);
  }

  // Save ghost data to localStorage
  saveGhost(levelId: number, ghostData: GhostData): void {
    const compressed = this.compressGhostData({ ...ghostData, levelId });
    const key = `${GhostReplay.STORAGE_PREFIX}${levelId}`;

    // Check if this is faster than existing ghost
    const existingData = this.loadGhost(levelId);
    if (existingData && existingData.completionTime <= ghostData.completionTime) {
      return; // Don't save slower ghost
    }

    try {
      localStorage.setItem(key, JSON.stringify(compressed));
    } catch (e) {
      console.warn('Failed to save ghost data:', e);
    }
  }

  loadGhost(levelId: number): GhostData | null {
    const key = `${GhostReplay.STORAGE_PREFIX}${levelId}`;
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const compressed: CompressedGhostData = JSON.parse(data);
      return this.decompressGhostData(compressed);
    } catch (e) {
      console.warn('Failed to load ghost data:', e);
      return null;
    }
  }

  deleteGhost(levelId: number): void {
    const key = `${GhostReplay.STORAGE_PREFIX}${levelId}`;
    localStorage.removeItem(key);
  }

  // Compress ghost data for efficient storage
  private compressGhostData(ghostData: GhostData): CompressedGhostData {
    // Use delta encoding for positions
    const frames = ghostData.frames;
    const encoded: number[] = [];

    let lastX = 0;
    let lastY = 0;
    let lastRotation = 0;

    for (const frame of frames) {
      // Delta encode and round to reduce size
      const dx = Math.round((frame.x - lastX) * 10) / 10;
      const dy = Math.round((frame.y - lastY) * 10) / 10;
      const dr = Math.round(frame.rotation - lastRotation);
      const flags = (frame.isGrounded ? 1 : 0) | (frame.isDashing ? 2 : 0);

      encoded.push(dx, dy, dr, flags);

      lastX = frame.x;
      lastY = frame.y;
      lastRotation = frame.rotation;
    }

    return {
      levelId: ghostData.levelId,
      completionTime: ghostData.completionTime,
      data: encoded.join(','),
    };
  }

  private decompressGhostData(compressed: CompressedGhostData): GhostData {
    const values = compressed.data.split(',').map(Number);
    const frames: GhostFrame[] = [];

    let x = 0;
    let y = 0;
    let rotation = 0;

    // Ensure we have complete 4-value sets before processing
    for (let i = 0; i + 3 < values.length; i += 4) {
      const dx = values[i];
      const dy = values[i + 1];
      const dr = values[i + 2];
      const flags = values[i + 3];

      // Skip if any value is NaN (corrupted data)
      if (isNaN(dx) || isNaN(dy) || isNaN(dr) || isNaN(flags)) continue;

      x += dx;
      y += dy;
      rotation += dr;

      frames.push({
        x,
        y,
        rotation,
        isGrounded: (flags & 1) !== 0,
        isDashing: (flags & 2) !== 0,
      });
    }

    return {
      levelId: compressed.levelId,
      frames,
      completionTime: compressed.completionTime,
      totalFrames: frames.length,
    };
  }

  // Render ghost player
  render(ctx: CanvasRenderingContext2D, cameraX: number, playerSkinColor: string = '#00ffaa'): void {
    const frame = this.getInterpolatedFrame(0);
    if (!frame) return;

    const screenX = frame.x - cameraX;
    const screenY = frame.y;

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.translate(screenX + PLAYER.WIDTH / 2, screenY + PLAYER.HEIGHT / 2);
    ctx.rotate((frame.rotation * Math.PI) / 180);

    // Ghost body (transparent version of player)
    ctx.fillStyle = playerSkinColor;
    ctx.fillRect(-PLAYER.WIDTH / 2, -PLAYER.HEIGHT / 2, PLAYER.WIDTH, PLAYER.HEIGHT);

    // Ghost outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-PLAYER.WIDTH / 2, -PLAYER.HEIGHT / 2, PLAYER.WIDTH, PLAYER.HEIGHT);
    ctx.setLineDash([]);

    // Ghost label
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GHOST', screenX + PLAYER.WIDTH / 2, screenY - 5);
    ctx.restore();
  }
}
