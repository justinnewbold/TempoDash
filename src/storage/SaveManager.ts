import { SaveData, SKINS } from '../types';
import { STORAGE_KEYS, LEVELS } from '../constants';

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    const totalPoints = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_POINTS) || '0');
    const levelHighScores = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEVEL_HIGH_SCORES) || '{}');
    const unlockedSkins = JSON.parse(localStorage.getItem(STORAGE_KEYS.SKINS) || '["cyan"]');
    const currentSkin = localStorage.getItem(STORAGE_KEYS.CURRENT_SKIN) || 'cyan';
    const unlockedLevels = JSON.parse(localStorage.getItem(STORAGE_KEYS.UNLOCKED_LEVELS) || '[1]');

    return {
      totalPoints,
      levelHighScores,
      unlockedSkins,
      currentSkin,
      unlockedLevels
    };
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEYS.TOTAL_POINTS, this.data.totalPoints.toString());
    localStorage.setItem(STORAGE_KEYS.LEVEL_HIGH_SCORES, JSON.stringify(this.data.levelHighScores));
    localStorage.setItem(STORAGE_KEYS.SKINS, JSON.stringify(this.data.unlockedSkins));
    localStorage.setItem(STORAGE_KEYS.CURRENT_SKIN, this.data.currentSkin);
    localStorage.setItem(STORAGE_KEYS.UNLOCKED_LEVELS, JSON.stringify(this.data.unlockedLevels));
  }

  getTotalPoints(): number {
    return this.data.totalPoints;
  }

  getLevelHighScore(levelId: number): number {
    return this.data.levelHighScores[levelId] || 0;
  }

  // Submit a score for a level - returns true if it's a new high score
  submitScore(levelId: number, score: number): boolean {
    const currentHigh = this.getLevelHighScore(levelId);
    const isNewHigh = score > currentHigh;

    if (isNewHigh) {
      // Calculate the difference to add to total points
      const difference = score - currentHigh;
      this.data.totalPoints += difference;
      this.data.levelHighScores[levelId] = score;

      // Check for new level unlocks
      this.checkLevelUnlocks();

      // Check for new skin unlocks
      this.checkSkinUnlocks();

      this.save();
    }

    return isNewHigh;
  }

  private checkLevelUnlocks(): void {
    for (const level of LEVELS) {
      if (!this.data.unlockedLevels.includes(level.id)) {
        if (this.data.totalPoints >= level.unlockScore) {
          this.data.unlockedLevels.push(level.id);
        }
      }
    }
  }

  private checkSkinUnlocks(): void {
    for (const [skinId, skin] of Object.entries(SKINS)) {
      if (!this.data.unlockedSkins.includes(skinId)) {
        if (this.data.totalPoints >= skin.cost) {
          this.data.unlockedSkins.push(skinId);
        }
      }
    }
  }

  isLevelUnlocked(levelId: number): boolean {
    return this.data.unlockedLevels.includes(levelId);
  }

  getUnlockedLevels(): number[] {
    return [...this.data.unlockedLevels];
  }

  isSkinUnlocked(skinId: string): boolean {
    return this.data.unlockedSkins.includes(skinId);
  }

  getUnlockedSkins(): string[] {
    return [...this.data.unlockedSkins];
  }

  getCurrentSkin(): string {
    return this.data.currentSkin;
  }

  setCurrentSkin(skinId: string): boolean {
    if (this.isSkinUnlocked(skinId)) {
      this.data.currentSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  getAttemptNumber(): number {
    return parseInt(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '1');
  }

  incrementAttempt(): number {
    const attempt = this.getAttemptNumber() + 1;
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, attempt.toString());
    return attempt;
  }

  // Get newly unlocked skins since last check
  getNewlyUnlockedSkins(): string[] {
    const newSkins: string[] = [];
    for (const [skinId, skin] of Object.entries(SKINS)) {
      if (!this.data.unlockedSkins.includes(skinId) && this.data.totalPoints >= skin.cost) {
        newSkins.push(skinId);
      }
    }
    return newSkins;
  }

  // Get newly unlocked levels since last check
  getNewlyUnlockedLevels(): number[] {
    const newLevels: number[] = [];
    for (const level of LEVELS) {
      if (!this.data.unlockedLevels.includes(level.id) && this.data.totalPoints >= level.unlockScore) {
        newLevels.push(level.id);
      }
    }
    return newLevels;
  }
}
