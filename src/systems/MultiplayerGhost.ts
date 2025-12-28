// Multiplayer Ghost Race System - Race against other players' best runs
import { GhostFrame } from '../types';
import { GAME_WIDTH } from '../constants';

export interface GhostRaceData {
  id: string;
  levelId: number;
  playerName: string;
  frames: GhostFrame[];
  completionTime: number;
  timestamp: number;
}

interface RaceGhost {
  data: GhostRaceData;
  currentFrame: number;
  elapsedTime: number;
  finished: boolean;
  position: { x: number; y: number; rotation: number };
  color: string;
}

export class MultiplayerGhostRace {
  private ghosts: RaceGhost[] = [];
  private isRacing = false;
  private raceTime = 0;
  private playerFinished = false;
  private _playerTime = 0;
  private leaderboard: Array<{ name: string; time: number; isPlayer: boolean }> = [];

  // Ghost colors for different players
  private static readonly GHOST_COLORS = [
    'rgba(255, 100, 100, 0.5)',   // Red
    'rgba(100, 255, 100, 0.5)',   // Green
    'rgba(100, 100, 255, 0.5)',   // Blue
    'rgba(255, 255, 100, 0.5)',   // Yellow
    'rgba(255, 100, 255, 0.5)',   // Magenta
    'rgba(100, 255, 255, 0.5)',   // Cyan
  ];

  constructor() {}

  // Generate a shareable code from ghost data
  static generateShareCode(data: GhostRaceData): string {
    const compressed = {
      l: data.levelId,
      n: data.playerName,
      t: data.completionTime,
      f: data.frames.map(f => [
        Math.round(f.x),
        Math.round(f.y),
        Math.round(f.rotation),
        Math.round(f.time),
      ]),
    };
    // Base64 encode the JSON
    return btoa(JSON.stringify(compressed));
  }

  // Parse a share code back to ghost data
  static parseShareCode(code: string): GhostRaceData | null {
    try {
      const decoded = JSON.parse(atob(code));
      return {
        id: Math.random().toString(36).substring(7),
        levelId: decoded.l,
        playerName: decoded.n,
        completionTime: decoded.t,
        timestamp: Date.now(),
        frames: decoded.f.map((f: number[]) => ({
          x: f[0],
          y: f[1],
          rotation: f[2],
          time: f[3],
        })),
      };
    } catch {
      return null;
    }
  }

  // Add a ghost to the race
  addGhost(data: GhostRaceData): void {
    const colorIndex = this.ghosts.length % MultiplayerGhostRace.GHOST_COLORS.length;
    this.ghosts.push({
      data,
      currentFrame: 0,
      elapsedTime: 0,
      finished: false,
      position: { x: 0, y: 0, rotation: 0 },
      color: MultiplayerGhostRace.GHOST_COLORS[colorIndex],
    });
  }

  // Start a race with loaded ghosts
  startRace(): void {
    this.isRacing = true;
    this.raceTime = 0;
    this.playerFinished = false;
    this._playerTime = 0;
    this.leaderboard = [];

    // Reset all ghosts
    for (const ghost of this.ghosts) {
      ghost.currentFrame = 0;
      ghost.elapsedTime = 0;
      ghost.finished = false;
      if (ghost.data.frames.length > 0) {
        ghost.position = {
          x: ghost.data.frames[0].x,
          y: ghost.data.frames[0].y,
          rotation: ghost.data.frames[0].rotation,
        };
      }
    }
  }

  // End the race
  stopRace(): void {
    this.isRacing = false;
  }

  // Player finished the level
  playerFinish(time: number, playerName: string = 'You'): void {
    this.playerFinished = true;
    this._playerTime = time;
    this.leaderboard.push({ name: playerName, time, isPlayer: true });
    this.sortLeaderboard();
  }

  private sortLeaderboard(): void {
    this.leaderboard.sort((a, b) => a.time - b.time);
  }

  getPlayerTime(): number {
    return this._playerTime;
  }

  // Update ghost positions during race
  update(deltaTime: number): void {
    if (!this.isRacing) return;

    this.raceTime += deltaTime;

    for (const ghost of this.ghosts) {
      if (ghost.finished) continue;

      ghost.elapsedTime += deltaTime;

      // Find the appropriate frame based on elapsed time
      const frames = ghost.data.frames;
      while (ghost.currentFrame < frames.length - 1 &&
             frames[ghost.currentFrame + 1].time <= ghost.elapsedTime) {
        ghost.currentFrame++;
      }

      // Interpolate between frames for smooth movement
      if (ghost.currentFrame < frames.length - 1) {
        const currentFrame = frames[ghost.currentFrame];
        const nextFrame = frames[ghost.currentFrame + 1];
        const frameDuration = nextFrame.time - currentFrame.time;
        const frameProgress = frameDuration > 0
          ? (ghost.elapsedTime - currentFrame.time) / frameDuration
          : 0;

        ghost.position = {
          x: currentFrame.x + (nextFrame.x - currentFrame.x) * frameProgress,
          y: currentFrame.y + (nextFrame.y - currentFrame.y) * frameProgress,
          rotation: currentFrame.rotation + (nextFrame.rotation - currentFrame.rotation) * frameProgress,
        };
      } else if (ghost.currentFrame === frames.length - 1) {
        // Ghost finished
        ghost.finished = true;
        ghost.position = {
          x: frames[frames.length - 1].x,
          y: frames[frames.length - 1].y,
          rotation: frames[frames.length - 1].rotation,
        };
        this.leaderboard.push({
          name: ghost.data.playerName,
          time: ghost.data.completionTime,
          isPlayer: false,
        });
        this.sortLeaderboard();
      }
    }
  }

  // Render all ghosts
  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    if (!this.isRacing) return;

    for (const ghost of this.ghosts) {
      if (ghost.finished && ghost.elapsedTime > ghost.data.completionTime + 2000) {
        continue;  // Stop rendering finished ghosts after 2 seconds
      }

      const screenX = ghost.position.x - cameraX;
      if (screenX < -100 || screenX > GAME_WIDTH + 100) continue;

      ctx.save();
      ctx.translate(screenX + 15, ghost.position.y + 15);
      ctx.rotate((ghost.position.rotation * Math.PI) / 180);

      // Ghost body (semi-transparent)
      ctx.fillStyle = ghost.color;
      ctx.shadowColor = ghost.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(-15, -15, 30, 30);

      // Ghost outline
      ctx.strokeStyle = ghost.color.replace('0.5', '0.8');
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -15, 30, 30);

      ctx.restore();

      // Name label
      ctx.fillStyle = ghost.color.replace('0.5', '0.9');
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ghost.data.playerName, screenX + 15, ghost.position.y - 5);
    }
  }

  // Render race UI (positions, times)
  renderRaceUI(ctx: CanvasRenderingContext2D): void {
    if (!this.isRacing && this.leaderboard.length === 0) return;

    // Race timer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    const timeStr = (this.raceTime / 1000).toFixed(2) + 's';
    ctx.fillText(timeStr, GAME_WIDTH - 20, 30);

    // Leaderboard (top right)
    if (this.leaderboard.length > 0) {
      const boardX = GAME_WIDTH - 180;
      const boardY = 50;
      const rowHeight = 22;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(boardX - 10, boardY - 5, 170, Math.min(6, this.leaderboard.length + 1) * rowHeight + 10);

      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('RACE STANDINGS', boardX, boardY + 12);

      ctx.font = '12px Arial';
      for (let i = 0; i < Math.min(5, this.leaderboard.length); i++) {
        const entry = this.leaderboard[i];
        const y = boardY + 30 + i * rowHeight;

        ctx.fillStyle = entry.isPlayer ? '#00ff00' : '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${entry.name}`, boardX, y);

        ctx.textAlign = 'right';
        ctx.fillText((entry.time / 1000).toFixed(2) + 's', boardX + 150, y);
      }
    }

    // Show ghost indicators for active racers
    let indicatorY = 100 + this.leaderboard.length * 22;
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';

    for (let i = 0; i < this.ghosts.length; i++) {
      const ghost = this.ghosts[i];
      if (ghost.finished) continue;

      ctx.fillStyle = ghost.color;
      ctx.fillRect(GAME_WIDTH - 175, indicatorY, 10, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ghost.data.playerName + ' - racing...', GAME_WIDTH - 160, indicatorY + 9);
      indicatorY += 16;
    }
  }

  isInRace(): boolean {
    return this.isRacing;
  }

  getGhostCount(): number {
    return this.ghosts.length;
  }

  clearGhosts(): void {
    this.ghosts = [];
    this.leaderboard = [];
  }

  getPlayerRank(): number {
    if (!this.playerFinished) return -1;
    return this.leaderboard.findIndex(e => e.isPlayer) + 1;
  }
}
