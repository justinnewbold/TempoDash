import { SaveData, GameSettings, PlayerSkin, ACHIEVEMENTS, Achievement, GhostFrame } from '../types';
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
  // New skins
  {
    id: 'neon',
    name: 'Neon Blaze',
    primaryColor: '#ff00ff',
    secondaryColor: '#00ffff',
    glowColor: '#ff00ff',
    eyeColor: '#00ffff',
    trailColor: 'rgba(255, 0, 255, 0.4)',
    cost: 1500,
  },
  {
    id: 'shadow',
    name: 'Shadow',
    primaryColor: '#222233',
    secondaryColor: '#111122',
    glowColor: '#444466',
    eyeColor: '#ff0000',
    trailColor: 'rgba(50, 50, 80, 0.5)',
    cost: 1500,
  },
  {
    id: 'emerald',
    name: 'Emerald',
    primaryColor: '#00ff66',
    secondaryColor: '#00cc44',
    glowColor: '#00ff88',
    eyeColor: '#aaffaa',
    trailColor: 'rgba(0, 255, 102, 0.3)',
    cost: 750,
  },
  {
    id: 'ruby',
    name: 'Ruby',
    primaryColor: '#ff2244',
    secondaryColor: '#cc0022',
    glowColor: '#ff4466',
    eyeColor: '#ffcccc',
    trailColor: 'rgba(255, 34, 68, 0.3)',
    cost: 750,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    primaryColor: '#1a1a4a',
    secondaryColor: '#0a0a2a',
    glowColor: '#4444aa',
    eyeColor: '#ffff00',
    trailColor: 'rgba(68, 68, 170, 0.4)',
    cost: 1000,
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
  reduceFlash: false,
  showGhost: true,
  highContrast: false,
  assistMode: false,
  showBeatVisualizer: true,
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
  levelStars: {},
  levelDeaths: {},
  bestTimes: {},
  ghostRuns: {},
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
          levelStars: parsed.levelStars ?? {},
          levelDeaths: parsed.levelDeaths ?? {},
          bestTimes: parsed.bestTimes ?? {},
          ghostRuns: parsed.ghostRuns ?? {},
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
      levelStars: {},
      levelDeaths: {},
      bestTimes: {},
      ghostRuns: {},
    };
  }

  private save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  // Get a copy of all save data (for statistics display)
  getData(): SaveData {
    return { ...this.data };
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
      levelStars: {},
      levelDeaths: {},
      bestTimes: {},
      ghostRuns: {},
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

  // --- STAR RATING SYSTEM ---

  /**
   * Calculate stars for a level completion
   * 1 star: Complete level
   * 2 stars: Collect 50%+ coins
   * 3 stars: Collect all coins AND no deaths
   */
  calculateStars(coinsCollected: number, totalCoins: number, deaths: number): number {
    if (totalCoins === 0) {
      // No coins in level - 3 stars if no deaths, else 1 star
      return deaths === 0 ? 3 : 1;
    }

    const coinPercentage = coinsCollected / totalCoins;

    if (coinPercentage >= 1 && deaths === 0) {
      return 3; // Perfect run
    } else if (coinPercentage >= 0.5) {
      return 2; // Good run
    }
    return 1; // Completed
  }

  setLevelStars(levelId: number, stars: number): boolean {
    const current = this.data.levelStars[levelId] ?? 0;
    if (stars > current) {
      this.data.levelStars[levelId] = stars;
      this.save();
      return true;
    }
    return false;
  }

  getLevelStars(levelId: number): number {
    return this.data.levelStars[levelId] ?? 0;
  }

  getTotalStars(): number {
    return Object.values(this.data.levelStars).reduce((sum, s) => sum + s, 0);
  }

  getMaxPossibleStars(): number {
    return TOTAL_LEVELS * 3;
  }

  // --- BEST TIMES ---

  setBestTime(levelId: number, time: number): boolean {
    const current = this.data.bestTimes[levelId];
    if (current === undefined || time < current) {
      this.data.bestTimes[levelId] = time;
      this.save();
      return true;
    }
    return false;
  }

  getBestTime(levelId: number): number | undefined {
    return this.data.bestTimes[levelId];
  }

  // --- SPLIT TIMES ---

  getBestSplitTimes(levelId: number): number[] {
    return this.data.splitTimes?.[levelId] || [];
  }

  setBestSplitTimes(levelId: number, splits: number[]): void {
    if (!this.data.splitTimes) {
      this.data.splitTimes = {};
    }
    // Only save if these are better splits (or first time)
    const existing = this.data.splitTimes[levelId] || [];
    const shouldUpdate = splits.some((time, i) => !existing[i] || time < existing[i]);

    if (shouldUpdate || existing.length === 0) {
      // Save best split for each checkpoint
      this.data.splitTimes[levelId] = splits.map((time, i) =>
        existing[i] ? Math.min(time, existing[i]) : time
      );
      this.save();
    }
  }

  // --- LEVEL DEATHS (for star calculation) ---

  setLevelDeaths(levelId: number, deaths: number): boolean {
    const current = this.data.levelDeaths[levelId];
    if (current === undefined || deaths < current) {
      this.data.levelDeaths[levelId] = deaths;
      this.save();
      return true;
    }
    return false;
  }

  getLevelDeaths(levelId: number): number {
    return this.data.levelDeaths[levelId] ?? Infinity;
  }

  // --- GHOST RUNS ---

  saveGhostRun(levelId: number, frames: GhostFrame[], time: number): boolean {
    const currentBest = this.data.bestTimes[levelId];
    // Only save ghost if it's a new best time
    if (currentBest === undefined || time <= currentBest) {
      this.data.ghostRuns[levelId] = frames;
      this.save();
      return true;
    }
    return false;
  }

  getGhostRun(levelId: number): GhostFrame[] | undefined {
    return this.data.ghostRuns[levelId];
  }

  hasGhostRun(levelId: number): boolean {
    return this.data.ghostRuns[levelId] !== undefined && this.data.ghostRuns[levelId].length > 0;
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

  isReduceFlashEnabled(): boolean {
    return this.data.settings.reduceFlash ?? false;
  }

  setReduceFlash(enabled: boolean): void {
    this.data.settings.reduceFlash = enabled;
    this.save();
  }

  isShowGhostEnabled(): boolean {
    return this.data.settings.showGhost ?? true;
  }

  setShowGhost(enabled: boolean): void {
    this.data.settings.showGhost = enabled;
    this.save();
  }

  isHighContrastEnabled(): boolean {
    return this.data.settings.highContrast ?? false;
  }

  setHighContrast(enabled: boolean): void {
    this.data.settings.highContrast = enabled;
    this.save();
  }

  isAssistModeEnabled(): boolean {
    return this.data.settings.assistMode ?? false;
  }

  setAssistMode(enabled: boolean): void {
    this.data.settings.assistMode = enabled;
    this.save();
  }

  isBeatVisualizerEnabled(): boolean {
    return this.data.settings.showBeatVisualizer ?? true;
  }

  setBeatVisualizer(enabled: boolean): void {
    this.data.settings.showBeatVisualizer = enabled;
    this.save();
  }

  // --- MASTERY BADGES ---

  getLevelMasteryBadges(levelId: number): string[] {
    return this.data.levelMastery?.[levelId] || [];
  }

  addMasteryBadge(levelId: number, badge: string): boolean {
    if (!this.data.levelMastery) {
      this.data.levelMastery = {};
    }
    if (!this.data.levelMastery[levelId]) {
      this.data.levelMastery[levelId] = [];
    }
    if (!this.data.levelMastery[levelId].includes(badge as import('../types').MasteryBadge)) {
      this.data.levelMastery[levelId].push(badge as import('../types').MasteryBadge);
      this.save();
      return true;
    }
    return false;
  }

  hasMasteryBadge(levelId: number, badge: string): boolean {
    return this.data.levelMastery?.[levelId]?.includes(badge as import('../types').MasteryBadge) ?? false;
  }

  getTotalMasteryBadges(): number {
    if (!this.data.levelMastery) return 0;
    return Object.values(this.data.levelMastery).reduce((sum, badges) => sum + badges.length, 0);
  }

  setRhythmAccuracy(levelId: number, accuracy: number): void {
    if (!this.data.rhythmAccuracy) {
      this.data.rhythmAccuracy = {};
    }
    const existing = this.data.rhythmAccuracy[levelId] || 0;
    if (accuracy > existing) {
      this.data.rhythmAccuracy[levelId] = accuracy;
      this.save();
    }
  }

  getRhythmAccuracy(levelId: number): number {
    return this.data.rhythmAccuracy?.[levelId] ?? 0;
  }

  // --- LEADERBOARDS ---

  getPlayerName(): string {
    return this.data.playerName || 'Player';
  }

  setPlayerName(name: string): void {
    this.data.playerName = name.trim().substring(0, 20);
    this.save();
  }

  getLocalLeaderboard(levelId: number): import('../types').LeaderboardEntry[] {
    return this.data.localLeaderboards?.[levelId] || [];
  }

  addLeaderboardEntry(levelId: number, entry: Omit<import('../types').LeaderboardEntry, 'rank'>): void {
    if (!this.data.localLeaderboards) {
      this.data.localLeaderboards = {};
    }
    if (!this.data.localLeaderboards[levelId]) {
      this.data.localLeaderboards[levelId] = [];
    }

    const entries = this.data.localLeaderboards[levelId];

    // Add entry with temporary rank
    entries.push({ ...entry, rank: 0 });

    // Sort by score (descending), then by time (ascending)
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    });

    // Keep only top 10 entries
    this.data.localLeaderboards[levelId] = entries.slice(0, 10);

    // Update ranks
    this.data.localLeaderboards[levelId].forEach((e, i) => {
      e.rank = i + 1;
    });

    this.save();
  }

  getPlayerRank(levelId: number): number | null {
    const entries = this.getLocalLeaderboard(levelId);
    const playerEntry = entries.find(e => e.isPlayer);
    return playerEntry?.rank ?? null;
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
      levelStars: imported.levelStars ?? {},
      levelDeaths: imported.levelDeaths ?? {},
      bestTimes: imported.bestTimes ?? {},
      ghostRuns: imported.ghostRuns ?? {},
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
      levelStars: {},
      levelDeaths: {},
      bestTimes: {},
      ghostRuns: {},
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
