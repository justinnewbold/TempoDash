import { SaveData, GameSettings, PlayerSkin, ACHIEVEMENTS, Achievement } from '../types';
import { TOTAL_LEVELS } from '../levels';

const SAVE_KEY = 'tempodash_save';

// Points required to unlock each level
export const LEVEL_UNLOCK_COSTS: Record<number, number> = {
  1: 0,      // Level 1 is free
  2: 500,    // Level 2 costs 500 points
  3: 1500,   // Level 3 costs 1500 points
  4: 3000,   // Level 4 costs 3000 points
  5: 5000,   // Level 5 costs 5000 points
  6: 7500,   // Level 6 costs 7500 points
  7: 10000,  // Level 7 costs 10000 points
  8: 15000,  // Level 8 costs 15000 points
};

// Available player skins
export const PLAYER_SKINS: PlayerSkin[] = [
  {
    id: 'default',
    name: 'Cyan Cube',
    primaryColor: '#00ffaa',
    secondaryColor: '#00cc88',
    glowColor: '#00ffaa',
    eyeColor: '#ffffff',
    trailColor: 'rgba(0, 255, 170, 0.3)',
    cost: 0,
  },
  {
    id: 'fire',
    name: 'Inferno',
    primaryColor: '#ff6600',
    secondaryColor: '#ff3300',
    glowColor: '#ff4400',
    eyeColor: '#ffff00',
    trailColor: 'rgba(255, 100, 0, 0.3)',
    cost: 500,
  },
  {
    id: 'ice',
    name: 'Frost',
    primaryColor: '#88ddff',
    secondaryColor: '#44aaff',
    glowColor: '#66ccff',
    eyeColor: '#ffffff',
    trailColor: 'rgba(136, 221, 255, 0.3)',
    cost: 500,
  },
  {
    id: 'purple',
    name: 'Mystic',
    primaryColor: '#aa44ff',
    secondaryColor: '#8822dd',
    glowColor: '#bb66ff',
    eyeColor: '#ffccff',
    trailColor: 'rgba(170, 68, 255, 0.3)',
    cost: 750,
  },
  {
    id: 'gold',
    name: 'Golden',
    primaryColor: '#ffd700',
    secondaryColor: '#ffaa00',
    glowColor: '#ffdd44',
    eyeColor: '#ffffff',
    trailColor: 'rgba(255, 215, 0, 0.3)',
    cost: 1000,
  },
  {
    id: 'rainbow',
    name: 'Prismatic',
    primaryColor: '#ff0000',  // Will cycle through colors
    secondaryColor: '#ff00ff',
    glowColor: '#ffffff',
    eyeColor: '#ffffff',
    trailColor: 'rgba(255, 255, 255, 0.4)',
    cost: 2000,
  },
];

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.3,
  sfxVolume: 0.5,
  screenShake: true,
  selectedSkin: 'default',
  tutorialShown: false,
  // Accessibility options
  colorblindMode: 'normal',
  reducedMotion: false,
  hapticFeedback: true,
};

const DEFAULT_SAVE: SaveData = {
  totalPoints: 0,
  unlockedLevels: [1],
  unlockedSkins: ['default'],
  highScores: {},
  endlessHighScore: 0,
  settings: { ...DEFAULT_SETTINGS },
  achievements: [],
  levelCoins: {},
  totalDeaths: 0,
  totalCoinsCollected: 0,
  totalLevelsCompleted: 0,
  totalPlayTime: 0,
  longestCombo: 0,
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
          unlockedSkins: parsed.unlockedSkins ?? [...DEFAULT_SAVE.unlockedSkins],
          highScores: parsed.highScores ?? {},
          endlessHighScore: parsed.endlessHighScore ?? 0,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          achievements: parsed.achievements ?? [],
          levelCoins: parsed.levelCoins ?? {},
          totalDeaths: parsed.totalDeaths ?? 0,
          totalCoinsCollected: parsed.totalCoinsCollected ?? 0,
          totalLevelsCompleted: parsed.totalLevelsCompleted ?? 0,
          totalPlayTime: parsed.totalPlayTime ?? 0,
          longestCombo: parsed.longestCombo ?? 0,
        };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
    return {
      ...DEFAULT_SAVE,
      unlockedLevels: [...DEFAULT_SAVE.unlockedLevels],
      unlockedSkins: [...DEFAULT_SAVE.unlockedSkins],
      achievements: [],
      levelCoins: {},
    };
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

  // Unlock a level without spending points (used for auto-unlock after completing previous level)
  grantLevel(levelId: number): boolean {
    if (levelId > TOTAL_LEVELS) return false;
    if (this.data.unlockedLevels.includes(levelId)) return false;

    this.data.unlockedLevels.push(levelId);
    this.data.unlockedLevels.sort((a, b) => a - b);
    this.save();
    return true;
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

  // Skin management
  isSkinUnlocked(skinId: string): boolean {
    return this.data.unlockedSkins.includes(skinId);
  }

  canUnlockSkin(skinId: string): boolean {
    const skin = PLAYER_SKINS.find(s => s.id === skinId);
    if (!skin) return false;
    return this.data.totalPoints >= skin.cost && !this.isSkinUnlocked(skinId);
  }

  unlockSkin(skinId: string): boolean {
    const skin = PLAYER_SKINS.find(s => s.id === skinId);
    if (!skin) return false;

    if (this.spendPoints(skin.cost)) {
      if (!this.data.unlockedSkins.includes(skinId)) {
        this.data.unlockedSkins.push(skinId);
      }
      this.save();
      return true;
    }
    return false;
  }

  getSelectedSkin(): PlayerSkin {
    const skinId = this.data.settings.selectedSkin;
    const skin = PLAYER_SKINS.find(s => s.id === skinId);
    return skin ?? PLAYER_SKINS[0];
  }

  selectSkin(skinId: string): boolean {
    if (this.isSkinUnlocked(skinId)) {
      this.data.settings.selectedSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  resetProgress(): void {
    this.data = {
      ...DEFAULT_SAVE,
      unlockedLevels: [...DEFAULT_SAVE.unlockedLevels],
      unlockedSkins: [...DEFAULT_SAVE.unlockedSkins],
      achievements: [],
      levelCoins: {},
    };
    this.save();
  }

  // Endless mode
  getEndlessHighScore(): number {
    return this.data.endlessHighScore;
  }

  setEndlessHighScore(score: number): boolean {
    if (score > this.data.endlessHighScore) {
      this.data.endlessHighScore = score;
      this.save();
      return true;
    }
    return false;
  }

  // Tutorial
  hasTutorialBeenShown(): boolean {
    return this.data.settings.tutorialShown;
  }

  markTutorialShown(): void {
    this.data.settings.tutorialShown = true;
    this.save();
  }

  // Achievement system
  hasAchievement(achievementId: string): boolean {
    return this.data.achievements.includes(achievementId);
  }

  unlockAchievement(achievementId: string): Achievement | null {
    if (this.hasAchievement(achievementId)) return null;

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return null;

    this.data.achievements.push(achievementId);
    this.save();
    return achievement;
  }

  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => this.data.achievements.includes(a.id));
  }

  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS;
  }

  getAchievementProgress(): { unlocked: number; total: number } {
    return {
      unlocked: this.data.achievements.length,
      total: ACHIEVEMENTS.length,
    };
  }

  // Stats tracking
  recordDeath(): void {
    this.data.totalDeaths++;
    this.save();
  }

  getTotalDeaths(): number {
    return this.data.totalDeaths;
  }

  recordCoinsCollected(count: number): void {
    this.data.totalCoinsCollected += count;
    this.save();
  }

  getTotalCoinsCollected(): number {
    return this.data.totalCoinsCollected;
  }

  recordLevelComplete(): void {
    this.data.totalLevelsCompleted++;
    this.save();
  }

  getTotalLevelsCompleted(): number {
    return this.data.totalLevelsCompleted;
  }

  addPlayTime(ms: number): void {
    this.data.totalPlayTime += ms;
    this.save();
  }

  getTotalPlayTime(): number {
    return this.data.totalPlayTime;
  }

  updateLongestCombo(combo: number): boolean {
    if (combo > this.data.longestCombo) {
      this.data.longestCombo = combo;
      this.save();
      return true;
    }
    return false;
  }

  getLongestCombo(): number {
    return this.data.longestCombo;
  }

  // Level coin tracking
  setLevelCoins(levelId: number, coins: number): boolean {
    const current = this.data.levelCoins[levelId] ?? 0;
    if (coins > current) {
      this.data.levelCoins[levelId] = coins;
      this.save();
      return true;
    }
    return false;
  }

  getLevelCoins(levelId: number): number {
    return this.data.levelCoins[levelId] ?? 0;
  }

  getAllLevelCoins(): Record<number, number> {
    return { ...this.data.levelCoins };
  }

  // --- ACCESSIBILITY SETTINGS ---

  getColorblindMode(): GameSettings['colorblindMode'] {
    return this.data.settings.colorblindMode;
  }

  setColorblindMode(mode: GameSettings['colorblindMode']): void {
    this.data.settings.colorblindMode = mode;
    this.save();
  }

  isReducedMotionEnabled(): boolean {
    return this.data.settings.reducedMotion;
  }

  setReducedMotion(enabled: boolean): void {
    this.data.settings.reducedMotion = enabled;
    this.save();
  }

  isHapticFeedbackEnabled(): boolean {
    return this.data.settings.hapticFeedback;
  }

  setHapticFeedback(enabled: boolean): void {
    this.data.settings.hapticFeedback = enabled;
    this.save();
  }

  // --- EXPORT / IMPORT ---

  exportData(): string {
    return JSON.stringify({
      version: 1,
      exportDate: new Date().toISOString(),
      data: this.data,
    }, null, 2);
  }

  importData(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate structure
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON format' };
      }

      // Check for version (allows for future migrations)
      if (parsed.version && parsed.data) {
        // Versioned export format
        const importedData = parsed.data as Partial<SaveData>;
        if (!this.validateSaveData(importedData)) {
          return { success: false, error: 'Invalid save data structure' };
        }
        this.data = this.mergeSaveData(importedData);
      } else {
        // Legacy format (direct save data)
        if (!this.validateSaveData(parsed)) {
          return { success: false, error: 'Invalid save data structure' };
        }
        this.data = this.mergeSaveData(parsed);
      }

      this.save();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to parse JSON' };
    }
  }

  private validateSaveData(data: unknown): data is Partial<SaveData> {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;

    // Check for critical fields (if present, they must be valid types)
    if ('totalPoints' in d && typeof d.totalPoints !== 'number') return false;
    if ('unlockedLevels' in d && !Array.isArray(d.unlockedLevels)) return false;
    if ('unlockedSkins' in d && !Array.isArray(d.unlockedSkins)) return false;
    if ('highScores' in d && typeof d.highScores !== 'object') return false;
    if ('settings' in d && typeof d.settings !== 'object') return false;
    if ('achievements' in d && !Array.isArray(d.achievements)) return false;

    return true;
  }

  private mergeSaveData(imported: Partial<SaveData>): SaveData {
    return {
      totalPoints: imported.totalPoints ?? DEFAULT_SAVE.totalPoints,
      unlockedLevels: imported.unlockedLevels ?? [...DEFAULT_SAVE.unlockedLevels],
      unlockedSkins: imported.unlockedSkins ?? [...DEFAULT_SAVE.unlockedSkins],
      highScores: imported.highScores ?? {},
      endlessHighScore: imported.endlessHighScore ?? 0,
      settings: { ...DEFAULT_SETTINGS, ...imported.settings },
      achievements: imported.achievements ?? [],
      levelCoins: imported.levelCoins ?? {},
      totalDeaths: imported.totalDeaths ?? 0,
      totalCoinsCollected: imported.totalCoinsCollected ?? 0,
      totalLevelsCompleted: imported.totalLevelsCompleted ?? 0,
      totalPlayTime: imported.totalPlayTime ?? 0,
      longestCombo: imported.longestCombo ?? 0,
    };
  }

  // Reset all save data
  resetAllData(): void {
    this.data = {
      ...DEFAULT_SAVE,
      unlockedLevels: [...DEFAULT_SAVE.unlockedLevels],
      unlockedSkins: [...DEFAULT_SAVE.unlockedSkins],
      settings: { ...DEFAULT_SETTINGS },
      achievements: [],
      levelCoins: {},
      highScores: {},
    };
    this.save();
  }

  // --- STORAGE USAGE ---

  getStorageUsage(): { used: number; available: number; percentage: number } {
    try {
      const saveData = localStorage.getItem(SAVE_KEY) ?? '';
      const customLevels = localStorage.getItem('tempodash_custom_levels') ?? '';
      const used = new Blob([saveData + customLevels]).size;

      // LocalStorage limit is typically 5MB per origin
      const available = 5 * 1024 * 1024; // 5 MB
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch {
      return { used: 0, available: 5 * 1024 * 1024, percentage: 0 };
    }
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
