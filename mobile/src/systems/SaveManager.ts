import * as SecureStore from 'expo-secure-store';

interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  hapticFeedback: boolean;
  reducedMotion: boolean;
}

interface SaveData {
  totalPoints: number;
  highScores: Record<number, number>;
  endlessHighScore: number;
  endlessHighDistance: number;
  unlockedLevels: number[];
  settings: GameSettings;
  totalCoinsCollected: number;
  totalDeaths: number;
  totalPlayTime: number;
}

const SAVE_KEY = 'tempodash_save';

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.7,
  sfxVolume: 1.0,
  hapticFeedback: true,
  reducedMotion: false,
};

const DEFAULT_SAVE: SaveData = {
  totalPoints: 0,
  highScores: {},
  endlessHighScore: 0,
  endlessHighDistance: 0,
  unlockedLevels: [1],
  settings: DEFAULT_SETTINGS,
  totalCoinsCollected: 0,
  totalDeaths: 0,
  totalPlayTime: 0,
};

class SaveManagerClass {
  private data: SaveData = { ...DEFAULT_SAVE };
  private isLoaded = false;

  async load(): Promise<SaveData> {
    if (this.isLoaded) return this.data;

    try {
      const saved = await SecureStore.getItemAsync(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = { ...DEFAULT_SAVE, ...parsed };
      }
      this.isLoaded = true;
    } catch (error) {
      console.warn('Failed to load save data:', error);
      this.data = { ...DEFAULT_SAVE };
    }

    return this.data;
  }

  async save(): Promise<void> {
    try {
      await SecureStore.setItemAsync(SAVE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.warn('Failed to save data:', error);
    }
  }

  getData(): SaveData {
    return this.data;
  }

  getSettings(): GameSettings {
    return this.data.settings;
  }

  async updateSettings(settings: Partial<GameSettings>): Promise<void> {
    this.data.settings = { ...this.data.settings, ...settings };
    await this.save();
  }

  async setHighScore(levelId: number, score: number): Promise<boolean> {
    const current = this.data.highScores[levelId] || 0;
    if (score > current) {
      this.data.highScores[levelId] = score;
      await this.save();
      return true;
    }
    return false;
  }

  async setEndlessHighScore(score: number, distance: number): Promise<boolean> {
    let isNewRecord = false;
    if (score > this.data.endlessHighScore) {
      this.data.endlessHighScore = score;
      isNewRecord = true;
    }
    if (distance > this.data.endlessHighDistance) {
      this.data.endlessHighDistance = distance;
      isNewRecord = true;
    }
    if (isNewRecord) {
      await this.save();
    }
    return isNewRecord;
  }

  async addPoints(points: number): Promise<void> {
    this.data.totalPoints += points;
    await this.save();
  }

  async addCoins(coins: number): Promise<void> {
    this.data.totalCoinsCollected += coins;
    await this.save();
  }

  async incrementDeaths(): Promise<void> {
    this.data.totalDeaths++;
    // Don't save on every death to reduce writes
  }

  async addPlayTime(ms: number): Promise<void> {
    this.data.totalPlayTime += ms;
    // Don't save on every update
  }

  async unlockLevel(levelId: number): Promise<void> {
    if (!this.data.unlockedLevels.includes(levelId)) {
      this.data.unlockedLevels.push(levelId);
      this.data.unlockedLevels.sort((a, b) => a - b);
      await this.save();
    }
  }

  isLevelUnlocked(levelId: number): boolean {
    return this.data.unlockedLevels.includes(levelId);
  }

  getHighScore(levelId: number): number {
    return this.data.highScores[levelId] || 0;
  }

  getEndlessHighScore(): number {
    return this.data.endlessHighScore;
  }

  getEndlessHighDistance(): number {
    return this.data.endlessHighDistance;
  }

  async reset(): Promise<void> {
    this.data = { ...DEFAULT_SAVE };
    await this.save();
  }
}

export const SaveManager = new SaveManagerClass();
