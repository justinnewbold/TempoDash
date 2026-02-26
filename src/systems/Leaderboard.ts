// Leaderboard Service
// Provides local leaderboard storage with API integration hooks for future backend

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  levelId: number | 'endless' | 'challenge';
  timestamp: number;
  metadata?: {
    coinsCollected?: number;
    deathCount?: number;
    timeMs?: number;
    comboMax?: number;
  };
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  playerRank?: number;
  totalEntries: number;
}

export type LeaderboardType = 'level' | 'endless' | 'challenge';

// Configuration for backend integration (to be implemented)
interface LeaderboardConfig {
  apiBaseUrl?: string;
  apiKey?: string;
  enableOnline: boolean;
}

const STORAGE_KEY = 'tempodash_leaderboard';
const MAX_LOCAL_ENTRIES = 100;

export class LeaderboardService {
  private config: LeaderboardConfig;
  private localData: Record<string, LeaderboardEntry[]>;
  private playerName: string;

  constructor(config?: Partial<LeaderboardConfig>) {
    this.config = {
      enableOnline: false, // Default to offline mode until backend is ready
      ...config,
    };
    this.localData = this.loadLocalData();
    this.playerName = this.loadPlayerName();
  }

  private loadLocalData(): Record<string, LeaderboardEntry[]> {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load leaderboard data:', e);
    }
    return {};
  }

  private saveLocalData(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.localData));
    } catch (e) {
      console.warn('Failed to save leaderboard data:', e);
    }
  }

  private loadPlayerName(): string {
    try {
      return localStorage.getItem('tempodash_player_name') || 'Player';
    } catch {
      return 'Player';
    }
  }

  // Set player name for leaderboard entries
  setPlayerName(name: string): void {
    this.playerName = name.trim() || 'Player';
    try {
      localStorage.setItem('tempodash_player_name', this.playerName);
    } catch {
      // Ignore storage errors
    }
  }

  getPlayerName(): string {
    return this.playerName;
  }

  // Get leaderboard key for a specific type
  private getLeaderboardKey(type: LeaderboardType, levelId?: number): string {
    switch (type) {
      case 'level':
        return `level_${levelId}`;
      case 'endless':
        return 'endless';
      case 'challenge':
        return 'challenge';
      default:
        return 'unknown';
    }
  }

  // Submit a score to the leaderboard
  async submitScore(
    type: LeaderboardType,
    score: number,
    levelId?: number,
    metadata?: LeaderboardEntry['metadata']
  ): Promise<{ rank: number; isNewHighScore: boolean }> {
    const key = this.getLeaderboardKey(type, levelId);
    const entry: LeaderboardEntry = {
      id: this.generateId(),
      playerName: this.playerName,
      score,
      levelId: type === 'level' ? levelId! : type,
      timestamp: Date.now(),
      metadata,
    };

    // Check if this is a new high score for this player
    const existingEntries = this.localData[key] || [];
    const playerBest = existingEntries
      .filter(e => e.playerName === this.playerName)
      .sort((a, b) => b.score - a.score)[0];
    const isNewHighScore = !playerBest || score > playerBest.score;

    // If online mode is enabled, try to submit to backend
    if (this.config.enableOnline && this.config.apiBaseUrl) {
      try {
        await this.submitToBackend(entry);
      } catch (e) {
        console.warn('Failed to submit to online leaderboard:', e);
      }
    }

    // Always save locally
    if (!this.localData[key]) {
      this.localData[key] = [];
    }

    // Deduplicate: remove existing entry from same player if new score is better
    const existingIdx = this.localData[key].findIndex(e => e.playerName === entry.playerName);
    if (existingIdx !== -1) {
      if (this.localData[key][existingIdx].score >= entry.score) {
        // Existing score is better or equal, keep it
        const rank = this.localData[key].sort((a, b) => b.score - a.score)
          .findIndex(e => e.playerName === entry.playerName) + 1;
        return { rank, isNewHighScore };
      }
      this.localData[key].splice(existingIdx, 1);
    }

    // Add new entry
    this.localData[key].push(entry);

    // Sort by score descending
    this.localData[key].sort((a, b) => b.score - a.score);

    // Calculate rank before slicing (entry may fall outside top N)
    const rank = this.localData[key].findIndex(e => e.id === entry.id) + 1;

    // Keep only top entries
    if (this.localData[key].length > MAX_LOCAL_ENTRIES) {
      this.localData[key] = this.localData[key].slice(0, MAX_LOCAL_ENTRIES);
    }

    this.saveLocalData();

    // Return 0 for rank if entry was sliced off (not in top N)
    const stillInBoard = this.localData[key].some(e => e.id === entry.id);
    return { rank: stillInBoard ? rank : 0, isNewHighScore };
  }

  // Get leaderboard entries
  async getLeaderboard(
    type: LeaderboardType,
    levelId?: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<LeaderboardResponse> {
    const key = this.getLeaderboardKey(type, levelId);

    // If online mode is enabled, try to fetch from backend
    if (this.config.enableOnline && this.config.apiBaseUrl) {
      try {
        return await this.fetchFromBackend(key, limit, offset);
      } catch (e) {
        console.warn('Failed to fetch online leaderboard, using local:', e);
      }
    }

    // Use local data
    const entries = this.localData[key] || [];
    const paginatedEntries = entries.slice(offset, offset + limit);

    // Find player's rank
    const playerEntry = entries.find(e => e.playerName === this.playerName);
    const playerRank = playerEntry ? entries.indexOf(playerEntry) + 1 : undefined;

    return {
      entries: paginatedEntries,
      playerRank,
      totalEntries: entries.length,
    };
  }

  // Get player's personal best for a specific leaderboard
  getPersonalBest(type: LeaderboardType, levelId?: number): LeaderboardEntry | null {
    const key = this.getLeaderboardKey(type, levelId);
    const entries = this.localData[key] || [];
    const playerEntries = entries.filter(e => e.playerName === this.playerName);
    return playerEntries.length > 0 ? playerEntries[0] : null;
  }

  // Get player's rank for a specific leaderboard
  getPlayerRank(type: LeaderboardType, levelId?: number): number | null {
    const key = this.getLeaderboardKey(type, levelId);
    const entries = this.localData[key] || [];
    const playerEntry = entries.find(e => e.playerName === this.playerName);
    return playerEntry ? entries.indexOf(playerEntry) + 1 : null;
  }

  // Clear local leaderboard data
  clearLocalData(): void {
    this.localData = {};
    this.saveLocalData();
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Backend API methods (to be implemented when backend is ready)
  private async submitToBackend(entry: LeaderboardEntry): Promise<void> {
    if (!this.config.apiBaseUrl) return;

    const response = await fetch(`${this.config.apiBaseUrl}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error(`Backend submission failed: ${response.status}`);
    }
  }

  private async fetchFromBackend(
    key: string,
    limit: number,
    offset: number
  ): Promise<LeaderboardResponse> {
    if (!this.config.apiBaseUrl) {
      return { entries: [], totalEntries: 0 };
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/leaderboard/${key}?limit=${limit}&offset=${offset}`,
      {
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend fetch failed: ${response.status}`);
    }

    return response.json();
  }

  // Enable/disable online mode
  setOnlineMode(enabled: boolean): void {
    this.config.enableOnline = enabled;
  }

  // Configure backend API
  configureBackend(apiBaseUrl: string, apiKey?: string): void {
    this.config.apiBaseUrl = apiBaseUrl;
    this.config.apiKey = apiKey;
    this.config.enableOnline = true;
  }

  // Check if online mode is available
  isOnlineEnabled(): boolean {
    return this.config.enableOnline && !!this.config.apiBaseUrl;
  }
}

// Singleton instance
let leaderboardInstance: LeaderboardService | null = null;

export function getLeaderboardService(): LeaderboardService {
  if (!leaderboardInstance) {
    leaderboardInstance = new LeaderboardService();
  }
  return leaderboardInstance;
}
