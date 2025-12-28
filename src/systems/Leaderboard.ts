// Local Leaderboard System - Track best times and scores
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  time: number;
  date: number;
  deaths: number;
  maxCombo: number;
}

export interface LevelLeaderboard {
  levelId: number;
  entries: LeaderboardEntry[];
}

export class LeaderboardManager {
  private leaderboards: Map<number, LevelLeaderboard> = new Map();
  private endlessLeaderboard: LeaderboardEntry[] = [];
  private readonly MAX_ENTRIES = 10;
  private readonly STORAGE_KEY = 'tempodash_leaderboards';

  constructor() {
    this.load();
  }

  // Add a new entry to a level leaderboard
  addLevelEntry(levelId: number, entry: Omit<LeaderboardEntry, 'date'>): number {
    const fullEntry: LeaderboardEntry = {
      ...entry,
      date: Date.now(),
    };

    let leaderboard = this.leaderboards.get(levelId);
    if (!leaderboard) {
      leaderboard = { levelId, entries: [] };
      this.leaderboards.set(levelId, leaderboard);
    }

    leaderboard.entries.push(fullEntry);

    // Sort by time (fastest first), then by score (highest first)
    leaderboard.entries.sort((a, b) => {
      if (a.time !== b.time) return a.time - b.time;
      return b.score - a.score;
    });

    // Keep only top entries
    leaderboard.entries = leaderboard.entries.slice(0, this.MAX_ENTRIES);

    this.save();

    // Return rank (1-indexed), or -1 if not in top entries
    const index = leaderboard.entries.findIndex(e => e === fullEntry);
    return index >= 0 ? index + 1 : -1;
  }

  // Add a new entry to endless leaderboard
  addEndlessEntry(entry: Omit<LeaderboardEntry, 'date'>): number {
    const fullEntry: LeaderboardEntry = {
      ...entry,
      date: Date.now(),
    };

    this.endlessLeaderboard.push(fullEntry);

    // Sort by score (highest first)
    this.endlessLeaderboard.sort((a, b) => b.score - a.score);

    // Keep only top entries
    this.endlessLeaderboard = this.endlessLeaderboard.slice(0, this.MAX_ENTRIES);

    this.save();

    // Return rank (1-indexed), or -1 if not in top entries
    const index = this.endlessLeaderboard.findIndex(e => e === fullEntry);
    return index >= 0 ? index + 1 : -1;
  }

  // Get leaderboard for a level
  getLevelLeaderboard(levelId: number): LeaderboardEntry[] {
    return this.leaderboards.get(levelId)?.entries || [];
  }

  // Get endless leaderboard
  getEndlessLeaderboard(): LeaderboardEntry[] {
    return this.endlessLeaderboard;
  }

  // Get best time for a level
  getBestTime(levelId: number): number | null {
    const entries = this.getLevelLeaderboard(levelId);
    return entries.length > 0 ? entries[0].time : null;
  }

  // Get best score for a level
  getBestScore(levelId: number): number | null {
    const entries = this.getLevelLeaderboard(levelId);
    if (entries.length === 0) return null;
    return Math.max(...entries.map(e => e.score));
  }

  // Check if a time would make the leaderboard
  wouldMakeLeaderboard(levelId: number, time: number): boolean {
    const entries = this.getLevelLeaderboard(levelId);
    if (entries.length < this.MAX_ENTRIES) return true;
    return time < entries[entries.length - 1].time;
  }

  // Render leaderboard UI
  render(ctx: CanvasRenderingContext2D, levelId: number | 'endless', scrollOffset: number = 0): void {
    const entries = levelId === 'endless'
      ? this.endlessLeaderboard
      : this.getLevelLeaderboard(levelId);

    ctx.save();

    // Background panel
    const panelX = 50;
    const panelY = 100;
    const panelWidth = GAME_WIDTH - 100;
    const panelHeight = GAME_HEIGHT - 180;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Title
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.fillText(
      levelId === 'endless' ? 'ENDLESS LEADERBOARD' : `LEVEL ${levelId} LEADERBOARD`,
      GAME_WIDTH / 2,
      panelY + 40
    );
    ctx.shadowBlur = 0;

    // Column headers
    const headerY = panelY + 75;
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'left';
    ctx.fillText('RANK', panelX + 20, headerY);
    ctx.fillText('PLAYER', panelX + 70, headerY);
    ctx.textAlign = 'right';
    ctx.fillText('TIME', panelX + panelWidth - 200, headerY);
    ctx.fillText('SCORE', panelX + panelWidth - 100, headerY);
    ctx.fillText('COMBO', panelX + panelWidth - 20, headerY);

    // Entries
    const entryHeight = 35;
    const startY = panelY + 100 - scrollOffset;

    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX, panelY + 80, panelWidth, panelHeight - 100);
    ctx.clip();

    if (entries.length === 0) {
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#666';
      ctx.fillText('No entries yet. Be the first!', GAME_WIDTH / 2, startY + 50);
    } else {
      entries.forEach((entry, index) => {
        const y = startY + index * entryHeight;
        const rank = index + 1;

        // Row background (alternating)
        if (index % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.fillRect(panelX + 10, y - 12, panelWidth - 20, entryHeight - 5);
        }

        // Rank with medal for top 3
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        if (rank === 1) {
          ctx.fillStyle = '#ffd700';
          ctx.fillText('🥇', panelX + 20, y + 5);
        } else if (rank === 2) {
          ctx.fillStyle = '#c0c0c0';
          ctx.fillText('🥈', panelX + 20, y + 5);
        } else if (rank === 3) {
          ctx.fillStyle = '#cd7f32';
          ctx.fillText('🥉', panelX + 20, y + 5);
        } else {
          ctx.fillStyle = '#666';
          ctx.fillText(`${rank}.`, panelX + 20, y + 5);
        }

        // Player name
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(entry.playerName.substring(0, 12), panelX + 70, y + 5);

        // Time
        ctx.textAlign = 'right';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(this.formatTime(entry.time), panelX + panelWidth - 200, y + 5);

        // Score
        ctx.fillStyle = '#ffff00';
        ctx.fillText(entry.score.toLocaleString(), panelX + panelWidth - 100, y + 5);

        // Max combo
        ctx.fillStyle = '#ff6600';
        ctx.fillText(`${entry.maxCombo}x`, panelX + panelWidth - 20, y + 5);
      });
    }

    ctx.restore();

    ctx.restore();
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 10);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
  }

  // Save to localStorage
  private save(): void {
    const data = {
      levels: Object.fromEntries(
        Array.from(this.leaderboards.entries()).map(([id, lb]) => [id, lb.entries])
      ),
      endless: this.endlessLeaderboard,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Load from localStorage
  private load(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);

        // Load level leaderboards
        if (parsed.levels) {
          for (const [levelId, entries] of Object.entries(parsed.levels)) {
            this.leaderboards.set(Number(levelId), {
              levelId: Number(levelId),
              entries: entries as LeaderboardEntry[],
            });
          }
        }

        // Load endless leaderboard
        if (parsed.endless) {
          this.endlessLeaderboard = parsed.endless;
        }
      }
    } catch {
      // Reset on error
      this.leaderboards = new Map();
      this.endlessLeaderboard = [];
    }
  }

  // Clear all leaderboards
  clearAll(): void {
    this.leaderboards = new Map();
    this.endlessLeaderboard = [];
    this.save();
  }

  // Clear a specific level's leaderboard
  clearLevel(levelId: number): void {
    this.leaderboards.delete(levelId);
    this.save();
  }
}
