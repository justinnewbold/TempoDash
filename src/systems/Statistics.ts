// Statistics tracking and display system
import { SaveData } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export interface SessionStats {
  jumps: number;
  dashes: number;
  deaths: number;
  coinsCollected: number;
  distanceTraveled: number;
  playTime: number;
  maxCombo: number;
  levelsCompleted: number;
  bounces: number;
}

export interface LevelStats {
  attempts: number;
  bestTime: number;
  lastTime: number;
  deathLocations: { x: number; y: number }[];
}

export class StatisticsManager {
  private sessionStats: SessionStats = this.createEmptySession();
  private levelStats: Map<number, LevelStats> = new Map();

  private sessionStartTime = Date.now();

  private createEmptySession(): SessionStats {
    return {
      jumps: 0,
      dashes: 0,
      deaths: 0,
      coinsCollected: 0,
      distanceTraveled: 0,
      playTime: 0,
      maxCombo: 0,
      levelsCompleted: 0,
      bounces: 0,
    };
  }

  // Track events
  recordJump(): void {
    this.sessionStats.jumps++;
  }

  recordDash(): void {
    this.sessionStats.dashes++;
  }

  recordDeath(levelId: number, x: number, y: number): void {
    this.sessionStats.deaths++;

    let stats = this.levelStats.get(levelId);
    if (!stats) {
      stats = { attempts: 0, bestTime: Infinity, lastTime: 0, deathLocations: [] };
      this.levelStats.set(levelId, stats);
    }
    stats.attempts++;

    // Keep last 50 death locations per level
    stats.deathLocations.push({ x, y });
    if (stats.deathLocations.length > 50) {
      stats.deathLocations.shift();
    }
  }

  recordCoin(): void {
    this.sessionStats.coinsCollected++;
  }

  recordBounce(): void {
    this.sessionStats.bounces++;
  }

  recordDistance(distance: number): void {
    this.sessionStats.distanceTraveled += distance;
  }

  recordCombo(combo: number): void {
    if (combo > this.sessionStats.maxCombo) {
      this.sessionStats.maxCombo = combo;
    }
  }

  recordLevelComplete(levelId: number, time: number): void {
    this.sessionStats.levelsCompleted++;

    let stats = this.levelStats.get(levelId);
    if (!stats) {
      stats = { attempts: 0, bestTime: Infinity, lastTime: 0, deathLocations: [] };
      this.levelStats.set(levelId, stats);
    }
    // Count completion as an attempt (so levels beaten first try show 1 attempt, not 0)
    stats.attempts++;
    stats.lastTime = time;
    if (time < stats.bestTime) {
      stats.bestTime = time;
    }
  }

  updatePlayTime(): void {
    this.sessionStats.playTime = Date.now() - this.sessionStartTime;
  }

  getSessionStats(): SessionStats {
    this.updatePlayTime();
    return { ...this.sessionStats };
  }

  getLevelStats(levelId: number): LevelStats | undefined {
    return this.levelStats.get(levelId);
  }

  // Get death heatmap data for a level
  getDeathHeatmap(levelId: number): { x: number; y: number }[] {
    return this.levelStats.get(levelId)?.deathLocations ?? [];
  }

  // Format play time as readable string
  formatPlayTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Render statistics dashboard
  renderDashboard(ctx: CanvasRenderingContext2D, saveData: SaveData): void {
    const stats = this.getSessionStats();

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📊 STATISTICS', GAME_WIDTH / 2, 60);

    // Two column layout
    const col1X = GAME_WIDTH * 0.25;
    const col2X = GAME_WIDTH * 0.75;
    let y = 120;
    const lineHeight = 35;

    ctx.font = '18px Arial';
    ctx.textAlign = 'left';

    // Session Stats (Left Column)
    ctx.fillStyle = '#ff00ff';
    ctx.textAlign = 'center';
    ctx.fillText('This Session', col1X, y);
    y += lineHeight;

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    const sessionX = col1X - 100;

    ctx.fillText(`⏱️ Play Time: ${this.formatPlayTime(stats.playTime)}`, sessionX, y);
    y += lineHeight;
    ctx.fillText(`🎯 Jumps: ${stats.jumps}`, sessionX, y);
    y += lineHeight;
    ctx.fillText(`⚡ Dashes: ${stats.dashes}`, sessionX, y);
    y += lineHeight;
    ctx.fillText(`💀 Deaths: ${stats.deaths}`, sessionX, y);
    y += lineHeight;
    ctx.fillText(`🪙 Coins: ${stats.coinsCollected}`, sessionX, y);
    y += lineHeight;
    ctx.fillText(`🔥 Best Combo: ${stats.maxCombo}`, sessionX, y);
    y += lineHeight;
    ctx.fillText(`🏃 Distance: ${Math.round(stats.distanceTraveled)}px`, sessionX, y);
    y += lineHeight;
    ctx.fillText(`🦘 Bounces: ${stats.bounces}`, sessionX, y);

    // All-time Stats (Right Column)
    y = 120;
    ctx.fillStyle = '#00ffaa';
    ctx.textAlign = 'center';
    ctx.fillText('All Time', col2X, y);
    y += lineHeight;

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    const allTimeX = col2X - 100;

    ctx.fillText(`⏱️ Total Play: ${this.formatPlayTime(saveData.totalPlayTime)}`, allTimeX, y);
    y += lineHeight;
    ctx.fillText(`💀 Total Deaths: ${saveData.totalDeaths}`, allTimeX, y);
    y += lineHeight;
    ctx.fillText(`🪙 Total Coins: ${saveData.totalCoinsCollected}`, allTimeX, y);
    y += lineHeight;
    ctx.fillText(`✅ Levels Completed: ${saveData.totalLevelsCompleted}`, allTimeX, y);
    y += lineHeight;
    ctx.fillText(`🔥 Best Combo Ever: ${saveData.longestCombo}`, allTimeX, y);
    y += lineHeight;
    ctx.fillText(`🏃 Endless High: ${saveData.endlessHighScore}m`, allTimeX, y);
    y += lineHeight;
    ctx.fillText(`⭐ Total Points: ${saveData.totalPoints}`, allTimeX, y);
    y += lineHeight;
    ctx.fillText(`🏆 Achievements: ${saveData.achievements?.length ?? 0}`, allTimeX, y);

    // Level-specific stats
    y = GAME_HEIGHT - 120;
    ctx.fillStyle = '#ffff00';
    ctx.textAlign = 'center';
    ctx.fillText('Level Statistics', GAME_WIDTH / 2, y);
    y += 30;

    // Show stats for each attempted level
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    let levelY = y;
    const levelSpacing = 100;

    for (let levelId = 1; levelId <= 8; levelId++) {
      const levelStat = this.levelStats.get(levelId);
      const highScore = saveData.highScores?.[levelId] ?? 0;

      const levelX = 50 + ((levelId - 1) % 8) * levelSpacing;

      ctx.fillStyle = levelStat ? '#00ffaa' : '#666666';
      ctx.fillText(`Level ${levelId}`, levelX, levelY);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      if (levelStat) {
        ctx.fillText(`Attempts: ${levelStat.attempts}`, levelX, levelY + 18);
      }
      if (highScore > 0) {
        ctx.fillText(`High: ${highScore}`, levelX, levelY + 34);
      }
      ctx.font = '14px Arial';
    }

    // Instructions
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to close', GAME_WIDTH / 2, GAME_HEIGHT - 20);
  }

  // Render mini stats during gameplay
  renderMiniStats(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const stats = this.getSessionStats();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, 100, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';

    ctx.fillText(`Jumps: ${stats.jumps}`, x + 5, y + 15);
    ctx.fillText(`Deaths: ${stats.deaths}`, x + 5, y + 30);
    ctx.fillText(`Coins: ${stats.coinsCollected}`, x + 5, y + 45);

    ctx.restore();
  }

  // Reset session stats
  resetSession(): void {
    this.sessionStats = this.createEmptySession();
    this.sessionStartTime = Date.now();
  }
}
