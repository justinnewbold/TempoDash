import { SaveData, GameSettings } from '../types';
import { TOTAL_LEVELS } from '../levels';

const SAVE_KEY = 'tempodash_save';

// Points required to unlock each level
export const LEVEL_UNLOCK_COSTS: Record<number, number> = {
  1: 0,      // Level 1 is free
  2: 500,    // Level 2 costs 500 points
  3: 1500,   // Level 3 costs 1500 points
  4: 3000,   // Level 4 costs 3000 points
};

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.3,
  sfxVolume: 0.5,
  screenShake: true,
};

const DEFAULT_SAVE: SaveData = {
  totalPoints: 0,
  unlockedLevels: [1],
  highScores: {},
  settings: { ...DEFAULT_SETTINGS },
};

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SaveData>;
        return {
          totalPoints: parsed.totalPoints ?? DEFAULT_SAVE.totalPoints,
          unlockedLevels: parsed.unlockedLevels ?? [...DEFAULT_SAVE.unlockedLevels],
          highScores: parsed.highScores ?? {},
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
    return { ...DEFAULT_SAVE, unlockedLevels: [...DEFAULT_SAVE.unlockedLevels] };
  }

  private save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  getTotalPoints(): number {
    return this.data.totalPoints;
  }

  addPoints(points: number): void {
    this.data.totalPoints += points;
    this.save();
  }

  spendPoints(points: number): boolean {
    if (this.data.totalPoints >= points) {
      this.data.totalPoints -= points;
      this.save();
      return true;
    }
    return false;
  }

  isLevelUnlocked(levelId: number): boolean {
    return this.data.unlockedLevels.includes(levelId);
  }

  canUnlockLevel(levelId: number): boolean {
    const cost = LEVEL_UNLOCK_COSTS[levelId] ?? Infinity;
    return this.data.totalPoints >= cost && !this.isLevelUnlocked(levelId);
  }

  unlockLevel(levelId: number): boolean {
    if (levelId > TOTAL_LEVELS) return false;

    const cost = LEVEL_UNLOCK_COSTS[levelId] ?? Infinity;
    if (this.spendPoints(cost)) {
      if (!this.data.unlockedLevels.includes(levelId)) {
        this.data.unlockedLevels.push(levelId);
        this.data.unlockedLevels.sort((a, b) => a - b);
      }
      this.save();
      return true;
    }
    return false;
  }

  getHighScore(levelId: number): number {
    return this.data.highScores[levelId] ?? 0;
  }

  setHighScore(levelId: number, score: number): boolean {
    const current = this.getHighScore(levelId);
    if (score > current) {
      this.data.highScores[levelId] = score;
      this.save();
      return true;
    }
    return false;
  }

  getSettings(): GameSettings {
    return { ...this.data.settings };
  }

  updateSettings(settings: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  resetProgress(): void {
    this.data = { ...DEFAULT_SAVE, unlockedLevels: [...DEFAULT_SAVE.unlockedLevels] };
    this.save();
  }
}
