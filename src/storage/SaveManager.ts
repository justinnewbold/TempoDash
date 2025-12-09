import { SaveData, SKINS } from '../types';
import { STORAGE_KEYS, LEVELS, HARDCORE_UNLOCK_SCORE } from '../constants';

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

  // Tutorial tracking
  hasSeenTutorial(): boolean {
    return localStorage.getItem(STORAGE_KEYS.HAS_SEEN_TUTORIAL) === 'true';
  }

  setHasSeenTutorial(): void {
    localStorage.setItem(STORAGE_KEYS.HAS_SEEN_TUTORIAL, 'true');
  }

  // Volume settings
  getMusicVolume(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME);
    return saved !== null ? parseFloat(saved) : 0.35;
  }

  setMusicVolume(volume: number): void {
    localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, volume.toString());
  }

  getSfxVolume(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.SFX_VOLUME);
    return saved !== null ? parseFloat(saved) : 0.6;
  }

  setSfxVolume(volume: number): void {
    localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, volume.toString());
  }

  // ============ Daily Login Streak ============

  checkAndUpdateLoginStreak(): { streak: number; isNewDay: boolean; bonusPoints: number } {
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_DATE);
    const currentStreak = parseInt(localStorage.getItem(STORAGE_KEYS.LOGIN_STREAK) || '0');
    const bonusClaimed = localStorage.getItem(STORAGE_KEYS.STREAK_BONUS_CLAIMED) === today;

    let newStreak = currentStreak;
    let isNewDay = false;
    let bonusPoints = 0;

    if (lastLogin !== today) {
      isNewDay = true;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastLogin === yesterday.toDateString()) {
        // Consecutive day - increase streak
        newStreak = currentStreak + 1;
      } else if (lastLogin === null) {
        // First login ever
        newStreak = 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }

      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_DATE, today);
      localStorage.setItem(STORAGE_KEYS.LOGIN_STREAK, newStreak.toString());
    }

    // Calculate bonus (10 points per streak day, max 100)
    if (isNewDay && !bonusClaimed) {
      bonusPoints = Math.min(newStreak * 10, 100);
    }

    return { streak: newStreak, isNewDay, bonusPoints };
  }

  claimStreakBonus(points: number): void {
    const today = new Date().toDateString();
    localStorage.setItem(STORAGE_KEYS.STREAK_BONUS_CLAIMED, today);
    this.data.totalPoints += points;
    this.save();
  }

  getLoginStreak(): number {
    return parseInt(localStorage.getItem(STORAGE_KEYS.LOGIN_STREAK) || '0');
  }

  // ============ Hardcore Mode ============

  isHardcoreUnlocked(): boolean {
    return localStorage.getItem(STORAGE_KEYS.HARDCORE_UNLOCKED) === 'true';
  }

  checkHardcoreUnlock(score: number): boolean {
    if (!this.isHardcoreUnlocked() && score >= HARDCORE_UNLOCK_SCORE) {
      localStorage.setItem(STORAGE_KEYS.HARDCORE_UNLOCKED, 'true');
      return true; // Just unlocked!
    }
    return false;
  }

  getBestScoreForHardcoreProgress(): number {
    return parseInt(localStorage.getItem(STORAGE_KEYS.BEST_SCORE_FOR_HARDCORE) || '0');
  }

  updateBestScoreForHardcore(score: number): void {
    const current = this.getBestScoreForHardcoreProgress();
    if (score > current) {
      localStorage.setItem(STORAGE_KEYS.BEST_SCORE_FOR_HARDCORE, score.toString());
    }
  }

  // ============ Contextual Tips ============

  hasSeenTip(tipId: string): boolean {
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIPS_SEEN) || '[]');
    return seen.includes(tipId);
  }

  markTipSeen(tipId: string): void {
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIPS_SEEN) || '[]');
    if (!seen.includes(tipId)) {
      seen.push(tipId);
      localStorage.setItem(STORAGE_KEYS.TIPS_SEEN, JSON.stringify(seen));
    }
  }

  resetTips(): void {
    localStorage.removeItem(STORAGE_KEYS.TIPS_SEEN);
  }
}
