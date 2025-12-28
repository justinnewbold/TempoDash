// Level Replay Theater - Record, save, and playback full gameplay replays
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export interface ReplayFrame {
  time: number;
  playerX: number;
  playerY: number;
  playerVelocityX: number;
  playerVelocityY: number;
  rotation: number;
  isJumping: boolean;
  isDashing: boolean;
  isGrounded: boolean;
  cameraX: number;
}

export interface ReplayHighlight {
  type: 'close_call' | 'big_jump' | 'combo' | 'speed_boost' | 'coin_chain';
  time: number;
  duration: number;
  description: string;
  intensity: number;  // 0-1 for importance
}

export interface ReplayData {
  id: string;
  levelId: number;
  playerName: string;
  frames: ReplayFrame[];
  highlights: ReplayHighlight[];
  totalTime: number;
  completedAt: number;
  score: number;
  deaths: number;
  maxCombo: number;
}

export class ReplaySystem {
  private isRecording = false;
  private isPlaying = false;
  private isPaused = false;
  private currentReplay: ReplayData | null = null;
  private recordingFrames: ReplayFrame[] = [];
  private recordingHighlights: ReplayHighlight[] = [];
  private recordingStartTime = 0;

  // Playback state
  private playbackTime = 0;
  private playbackSpeed = 1.0;
  private currentFrameIndex = 0;

  // Highlight detection state
  private lastPlayerY = 0;
  private lastNearMiss = 0;
  private comboStartTime = 0;
  private currentCombo = 0;
  private coinChainCount = 0;
  private lastCoinTime = 0;

  constructor() {}

  // Start recording a new replay
  startRecording(_levelId: number): void {
    this.isRecording = true;
    this.recordingFrames = [];
    this.recordingHighlights = [];
    this.recordingStartTime = performance.now();
    this.lastPlayerY = 0;
    this.lastNearMiss = 0;
    this.comboStartTime = 0;
    this.currentCombo = 0;
    this.coinChainCount = 0;
    this.lastCoinTime = 0;
  }

  // Record a frame
  recordFrame(
    playerX: number,
    playerY: number,
    velocityX: number,
    velocityY: number,
    rotation: number,
    isJumping: boolean,
    isDashing: boolean,
    isGrounded: boolean,
    cameraX: number
  ): void {
    if (!this.isRecording) return;

    const time = performance.now() - this.recordingStartTime;

    this.recordingFrames.push({
      time,
      playerX,
      playerY,
      playerVelocityX: velocityX,
      playerVelocityY: velocityY,
      rotation,
      isJumping,
      isDashing,
      isGrounded,
      cameraX,
    });

    // Detect big jumps
    if (isJumping && !isGrounded) {
      const jumpHeight = this.lastPlayerY - playerY;
      if (jumpHeight > 150) {
        this.addHighlight('big_jump', time, 500, `Huge ${Math.round(jumpHeight)}px jump!`, jumpHeight / 300);
      }
    }
    this.lastPlayerY = playerY;
  }

  // Record a near miss (close call)
  recordNearMiss(distance: number): void {
    if (!this.isRecording) return;

    const time = performance.now() - this.recordingStartTime;
    if (time - this.lastNearMiss > 1000) {  // Debounce
      this.addHighlight('close_call', time, 300, `Close call! ${Math.round(distance)}px away`, 1 - distance / 50);
      this.lastNearMiss = time;
    }
  }

  // Record combo milestone
  recordCombo(comboCount: number): void {
    if (!this.isRecording) return;

    const time = performance.now() - this.recordingStartTime;

    if (comboCount > this.currentCombo) {
      if (this.currentCombo === 0) {
        this.comboStartTime = time;
      }
      this.currentCombo = comboCount;

      // Highlight at combo milestones
      if (comboCount === 10 || comboCount === 25 || comboCount === 50 || comboCount === 100) {
        this.addHighlight('combo', time, 1000, `${comboCount}x COMBO!`, Math.min(1, comboCount / 50));
      }
    } else if (comboCount < this.currentCombo && this.currentCombo >= 10) {
      // Combo ended
      const duration = time - this.comboStartTime;
      this.addHighlight('combo', this.comboStartTime, duration, `${this.currentCombo}x combo streak!`, Math.min(1, this.currentCombo / 50));
      this.currentCombo = 0;
    }
  }

  // Record coin collection for chain detection
  recordCoinCollect(): void {
    if (!this.isRecording) return;

    const time = performance.now() - this.recordingStartTime;

    if (time - this.lastCoinTime < 500) {
      this.coinChainCount++;
      if (this.coinChainCount >= 5) {
        this.addHighlight('coin_chain', time - 500, 1000, `${this.coinChainCount} coin chain!`, Math.min(1, this.coinChainCount / 10));
      }
    } else {
      this.coinChainCount = 1;
    }
    this.lastCoinTime = time;
  }

  // Record speed boost
  recordSpeedBoost(speedMultiplier: number): void {
    if (!this.isRecording) return;

    const time = performance.now() - this.recordingStartTime;
    if (speedMultiplier > 1.5) {
      this.addHighlight('speed_boost', time, 500, `Speed x${speedMultiplier.toFixed(1)}!`, (speedMultiplier - 1) / 2);
    }
  }

  private addHighlight(
    type: ReplayHighlight['type'],
    time: number,
    duration: number,
    description: string,
    intensity: number
  ): void {
    this.recordingHighlights.push({
      type,
      time,
      duration,
      description,
      intensity: Math.max(0, Math.min(1, intensity)),
    });
  }

  // Stop recording and create replay
  stopRecording(levelId: number, playerName: string, score: number, deaths: number, maxCombo: number): ReplayData | null {
    if (!this.isRecording || this.recordingFrames.length === 0) return null;

    this.isRecording = false;

    const totalTime = performance.now() - this.recordingStartTime;

    const replay: ReplayData = {
      id: `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      levelId,
      playerName,
      frames: this.recordingFrames,
      highlights: this.recordingHighlights.sort((a, b) => b.intensity - a.intensity),
      totalTime,
      completedAt: Date.now(),
      score,
      deaths,
      maxCombo,
    };

    return replay;
  }

  // Cancel recording
  cancelRecording(): void {
    this.isRecording = false;
    this.recordingFrames = [];
    this.recordingHighlights = [];
  }

  // Load replay for playback
  loadReplay(replay: ReplayData): void {
    this.currentReplay = replay;
    this.playbackTime = 0;
    this.currentFrameIndex = 0;
    this.playbackSpeed = 1.0;
    this.isPaused = true;
    this.isPlaying = false;
  }

  // Start playback
  play(): void {
    if (!this.currentReplay) return;
    this.isPlaying = true;
    this.isPaused = false;
  }

  // Pause playback
  pause(): void {
    this.isPaused = true;
  }

  // Resume playback
  resume(): void {
    this.isPaused = false;
  }

  // Stop playback
  stop(): void {
    this.isPlaying = false;
    this.isPaused = true;
    this.playbackTime = 0;
    this.currentFrameIndex = 0;
  }

  // Set playback speed
  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.1, Math.min(4.0, speed));
  }

  // Seek to time
  seekTo(time: number): void {
    if (!this.currentReplay) return;

    this.playbackTime = Math.max(0, Math.min(this.currentReplay.totalTime, time));

    // Find the frame at this time
    this.currentFrameIndex = this.currentReplay.frames.findIndex(f => f.time >= this.playbackTime);
    if (this.currentFrameIndex < 0) {
      this.currentFrameIndex = this.currentReplay.frames.length - 1;
    }
  }

  // Seek to next highlight
  seekToNextHighlight(): void {
    if (!this.currentReplay) return;

    const nextHighlight = this.currentReplay.highlights.find(h => h.time > this.playbackTime);
    if (nextHighlight) {
      this.seekTo(nextHighlight.time - 500);  // Start a bit before
    }
  }

  // Seek to previous highlight
  seekToPrevHighlight(): void {
    if (!this.currentReplay) return;

    const prevHighlights = this.currentReplay.highlights.filter(h => h.time < this.playbackTime - 500);
    if (prevHighlights.length > 0) {
      const prevHighlight = prevHighlights[prevHighlights.length - 1];
      this.seekTo(prevHighlight.time - 500);
    }
  }

  // Update playback
  update(deltaTime: number): ReplayFrame | null {
    if (!this.isPlaying || this.isPaused || !this.currentReplay) return null;

    this.playbackTime += deltaTime * this.playbackSpeed;

    // Find current frame
    while (
      this.currentFrameIndex < this.currentReplay.frames.length - 1 &&
      this.currentReplay.frames[this.currentFrameIndex + 1].time <= this.playbackTime
    ) {
      this.currentFrameIndex++;
    }

    // Check if playback ended
    if (this.playbackTime >= this.currentReplay.totalTime) {
      this.isPlaying = false;
      this.isPaused = true;
    }

    return this.currentReplay.frames[this.currentFrameIndex] || null;
  }

  // Get current highlight (if any)
  getCurrentHighlight(): ReplayHighlight | null {
    if (!this.currentReplay) return null;

    return this.currentReplay.highlights.find(
      h => this.playbackTime >= h.time && this.playbackTime <= h.time + h.duration
    ) || null;
  }

  // Get playback progress (0-1)
  getProgress(): number {
    if (!this.currentReplay) return 0;
    return this.playbackTime / this.currentReplay.totalTime;
  }

  // Render playback UI
  renderPlaybackUI(ctx: CanvasRenderingContext2D): void {
    if (!this.currentReplay) return;

    ctx.save();

    // Timeline bar
    const barY = GAME_HEIGHT - 60;
    const barHeight = 8;
    const barX = 50;
    const barWidth = GAME_WIDTH - 100;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 10, barY - 30, barWidth + 20, 80);

    // Timeline background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Highlight markers
    for (const highlight of this.currentReplay.highlights) {
      const x = barX + (highlight.time / this.currentReplay.totalTime) * barWidth;
      const width = (highlight.duration / this.currentReplay.totalTime) * barWidth;

      ctx.fillStyle = this.getHighlightColor(highlight.type, highlight.intensity);
      ctx.fillRect(x, barY - 3, Math.max(3, width), barHeight + 6);
    }

    // Progress fill
    const progress = this.getProgress();
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Playhead
    const playheadX = barX + barWidth * progress;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(playheadX, barY - 8);
    ctx.lineTo(playheadX - 6, barY);
    ctx.lineTo(playheadX + 6, barY);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(playheadX - 1, barY, 2, barHeight + 8);

    // Time display
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.formatTime(this.playbackTime), barX, barY + 30);

    ctx.textAlign = 'right';
    ctx.fillText(this.formatTime(this.currentReplay.totalTime), barX + barWidth, barY + 30);

    // Speed display
    ctx.textAlign = 'center';
    ctx.fillText(`${this.playbackSpeed}x`, GAME_WIDTH / 2, barY + 30);

    // Playback controls hint
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('SPACE: Play/Pause | ←→: Seek | ↑↓: Speed | H: Next Highlight', GAME_WIDTH / 2, barY - 15);

    // Current highlight display
    const highlight = this.getCurrentHighlight();
    if (highlight) {
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      const highlightColor = this.getHighlightColor(highlight.type, highlight.intensity);
      ctx.fillStyle = highlightColor;
      ctx.shadowColor = highlightColor;
      ctx.shadowBlur = 15;
      ctx.fillText(highlight.description, GAME_WIDTH / 2, 80);
      ctx.shadowBlur = 0;
    }

    // Replay info
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Level ${this.currentReplay.levelId}`, 20, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText(`Score: ${this.currentReplay.score} | Combo: ${this.currentReplay.maxCombo}x`, 20, 50);

    // Pause indicator
    if (this.isPaused) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 48px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('⏸', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }

    ctx.restore();
  }

  private getHighlightColor(type: ReplayHighlight['type'], intensity: number): string {
    const alpha = 0.5 + intensity * 0.5;
    switch (type) {
      case 'close_call': return `rgba(255, 68, 68, ${alpha})`;
      case 'big_jump': return `rgba(68, 255, 68, ${alpha})`;
      case 'combo': return `rgba(255, 215, 0, ${alpha})`;
      case 'speed_boost': return `rgba(0, 255, 255, ${alpha})`;
      case 'coin_chain': return `rgba(255, 136, 0, ${alpha})`;
    }
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 10);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
  }

  // Get status
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying && !this.isPaused;
  }

  getCurrentReplay(): ReplayData | null {
    return this.currentReplay;
  }

  // Generate highlight reel (top N highlights)
  getHighlightReel(count: number = 5): ReplayHighlight[] {
    if (!this.currentReplay) return [];
    return this.currentReplay.highlights
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, count);
  }
}
