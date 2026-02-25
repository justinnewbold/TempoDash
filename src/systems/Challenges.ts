// Daily and Weekly Challenge System
// Seeded procedural challenges that are the same for all players

import { PlatformType } from '../types';

export type ChallengeType = 'dailySprint' | 'dailyCoinRush' | 'weeklyEndurance' | 'weeklyGauntlet';

export interface Challenge {
  id: string;
  type: ChallengeType;
  name: string;
  description: string;
  icon: string;
  seed: number;
  startTime: number; // Unix timestamp
  endTime: number;
  isWeekly: boolean;
}

export interface ChallengeProgress {
  challengeId: string;
  completed: boolean;
  bestScore: number;
  attempts: number;
  completedAt?: number;
}

export interface ChallengeData {
  currentStreak: number;
  longestStreak: number;
  lastParticipationDate: string; // YYYY-MM-DD
  totalChallengesCompleted: number;
  challengeHistory: Record<string, ChallengeProgress>;
}

// Gauntlet stage definition
export interface GauntletStage {
  stageNumber: number; // 1-5
  seed: number;
  targetDistance: number; // meters to complete
  platformTypes: PlatformType[]; // allowed platform types
  speedMultiplier: number; // base speed scaling
  name: string;
}

// Streak reward milestones
export interface StreakReward {
  streakRequired: number;
  type: 'skin' | 'achievement' | 'points';
  rewardId: string;
  name: string;
  description: string;
  icon: string;
}

export const STREAK_REWARDS: StreakReward[] = [
  { streakRequired: 3, type: 'points', rewardId: 'streak_3', name: '500 Bonus Points', description: '3-day streak reward', icon: '💎' },
  { streakRequired: 5, type: 'points', rewardId: 'streak_5', name: '1000 Bonus Points', description: '5-day streak reward', icon: '💎' },
  { streakRequired: 7, type: 'achievement', rewardId: 'challenge_streak', name: 'Challenger Badge', description: 'Complete 7 daily challenges in a row', icon: '📅' },
  { streakRequired: 10, type: 'skin', rewardId: 'streak_flame', name: 'Streak Flame Skin', description: 'Exclusive skin for 10-day streak', icon: '🔥' },
  { streakRequired: 14, type: 'points', rewardId: 'streak_14', name: '2500 Bonus Points', description: '14-day streak reward', icon: '💎' },
  { streakRequired: 21, type: 'skin', rewardId: 'streak_champion', name: 'Champion Skin', description: 'Exclusive skin for 21-day streak', icon: '🏆' },
  { streakRequired: 30, type: 'points', rewardId: 'streak_30', name: '5000 Bonus Points', description: '30-day streak reward', icon: '👑' },
];

// Seeded random number generator for consistent challenge generation
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Simple mulberry32 PRNG
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Get random integer between min and max (inclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Pick random element from array
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export const CHALLENGE_TYPES: Record<ChallengeType, { name: string; description: string; icon: string; isWeekly: boolean }> = {
  dailySprint: {
    name: 'Daily Sprint',
    description: 'Complete the seeded level as fast as possible',
    icon: '🏃',
    isWeekly: false,
  },
  dailyCoinRush: {
    name: 'Coin Dash',
    description: 'Collect coins! Grab magnet coins to attract nearby coins',
    icon: '💰',
    isWeekly: false,
  },
  weeklyEndurance: {
    name: 'Weekly Endurance',
    description: 'Survive as long as possible in hard endless mode',
    icon: '🏆',
    isWeekly: true,
  },
  weeklyGauntlet: {
    name: 'Weekly Gauntlet',
    description: 'Complete 5 seeded challenge levels back-to-back',
    icon: '⚔️',
    isWeekly: true,
  },
};

export class ChallengeManager {
  private data: ChallengeData;
  private static readonly STORAGE_KEY = 'tempodash_challenges';

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): ChallengeData {
    try {
      const saved = localStorage.getItem(ChallengeManager.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load challenge data:', e);
    }

    return {
      currentStreak: 0,
      longestStreak: 0,
      lastParticipationDate: '',
      totalChallengesCompleted: 0,
      challengeHistory: {},
    };
  }

  private saveData(): void {
    try {
      localStorage.setItem(ChallengeManager.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save challenge data:', e);
    }
  }

  // Get date string in YYYY-MM-DD format
  private getDateString(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  // Get the week number of the year
  private getWeekNumber(date: Date = new Date()): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Generate a seed from a date string
  private generateSeed(dateStr: string, salt: string = ''): number {
    let hash = 0;
    const str = dateStr + salt;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get the current daily challenge
  getDailyChallenge(): Challenge {
    const today = this.getDateString();
    const seed = this.generateSeed(today, 'daily');
    const rng = new SeededRandom(seed);

    // Alternate between sprint and coin rush based on day
    const type: ChallengeType = rng.next() > 0.5 ? 'dailySprint' : 'dailyCoinRush';
    const info = CHALLENGE_TYPES[type];

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    return {
      id: `daily_${today}`,
      type,
      name: info.name,
      description: info.description,
      icon: info.icon,
      seed,
      startTime: startOfDay.getTime(),
      endTime: endOfDay.getTime(),
      isWeekly: false,
    };
  }

  // Get the current weekly challenge
  getWeeklyChallenge(): Challenge {
    const now = new Date();
    const weekNum = this.getWeekNumber(now);
    const year = now.getFullYear();
    const weekId = `${year}_W${weekNum}`;
    const seed = this.generateSeed(weekId, 'weekly');
    const rng = new SeededRandom(seed);

    // Alternate between endurance and gauntlet
    const type: ChallengeType = rng.next() > 0.5 ? 'weeklyEndurance' : 'weeklyGauntlet';
    const info = CHALLENGE_TYPES[type];

    // Calculate start and end of week (Monday to Sunday)
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      id: `weekly_${weekId}`,
      type,
      name: info.name,
      description: info.description,
      icon: info.icon,
      seed,
      startTime: monday.getTime(),
      endTime: sunday.getTime(),
      isWeekly: true,
    };
  }

  // Get all current challenges
  getCurrentChallenges(): Challenge[] {
    return [this.getDailyChallenge(), this.getWeeklyChallenge()];
  }

  // Get time remaining for a challenge
  getTimeRemaining(challenge: Challenge): { hours: number; minutes: number; seconds: number } {
    const now = Date.now();
    const remaining = Math.max(0, challenge.endTime - now);

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  }

  // Format time remaining as string
  formatTimeRemaining(challenge: Challenge): string {
    const { hours, minutes, seconds } = this.getTimeRemaining(challenge);

    if (challenge.isWeekly) {
      const days = Math.floor(hours / 24);
      const h = hours % 24;
      if (days > 0) {
        return `${days}d ${h}h`;
      }
      return `${h}h ${minutes}m`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  }

  // Record a challenge attempt
  recordAttempt(challengeId: string, score: number, completed: boolean): void {
    if (!this.data.challengeHistory[challengeId]) {
      this.data.challengeHistory[challengeId] = {
        challengeId,
        completed: false,
        bestScore: 0,
        attempts: 0,
      };
    }

    const progress = this.data.challengeHistory[challengeId];
    progress.attempts++;

    if (score > progress.bestScore) {
      progress.bestScore = score;
    }

    if (completed && !progress.completed) {
      progress.completed = true;
      progress.completedAt = Date.now();
      this.data.totalChallengesCompleted++;
    }

    // Update streak
    this.updateStreak();
    this.saveData();
  }

  // Update daily participation streak
  private updateStreak(): void {
    const today = this.getDateString();
    const yesterday = this.getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

    if (this.data.lastParticipationDate === today) {
      // Already participated today, no change
      return;
    }

    if (this.data.lastParticipationDate === yesterday) {
      // Continued streak
      this.data.currentStreak++;
    } else {
      // Streak broken, start new
      this.data.currentStreak = 1;
    }

    this.data.lastParticipationDate = today;

    if (this.data.currentStreak > this.data.longestStreak) {
      this.data.longestStreak = this.data.currentStreak;
    }
  }

  // Get progress for a specific challenge
  getProgress(challengeId: string): ChallengeProgress | null {
    return this.data.challengeHistory[challengeId] || null;
  }

  // Get streak information
  getStreakInfo(): { current: number; longest: number; participatedToday: boolean } {
    const today = this.getDateString();
    return {
      current: this.data.currentStreak,
      longest: this.data.longestStreak,
      participatedToday: this.data.lastParticipationDate === today,
    };
  }

  // Get total completed challenges
  getTotalCompleted(): number {
    return this.data.totalChallengesCompleted;
  }

  // Generate procedural endless platforms for challenge mode
  generateChallengePlatforms(seed: number, startX: number, count: number): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: PlatformType;
  }> {
    const rng = new SeededRandom(seed + startX);
    const platforms: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      type: PlatformType;
    }> = [];

    const GROUND_Y = 460; // Match game constant
    let currentX = startX;

    const platformTypes: PlatformType[] = ['solid', 'solid', 'solid', 'bounce', 'crumble', 'moving', 'phase'];

    for (let i = 0; i < count; i++) {
      const width = rng.nextInt(80, 150);
      const gap = rng.nextInt(120, 220);
      const heightOffset = rng.nextInt(0, 80);
      const type = rng.pick(platformTypes);

      platforms.push({
        x: currentX + gap,
        y: GROUND_Y - heightOffset,
        width,
        height: 20,
        type,
      });

      currentX += gap + width;
    }

    return platforms;
  }

  // Generate coins for challenge mode
  generateChallengeCoins(seed: number, platforms: Array<{ x: number; y: number; width: number }>): Array<{ x: number; y: number }> {
    const rng = new SeededRandom(seed);
    const coins: Array<{ x: number; y: number }> = [];

    for (const platform of platforms) {
      // 40% chance of coin above platform
      if (rng.next() < 0.4) {
        coins.push({
          x: platform.x + platform.width / 2,
          y: platform.y - 40 - rng.nextInt(0, 30),
        });
      }
    }

    return coins;
  }

  // Generate a massive amount of coins for Coin Rush mode, including magnet coins
  generateCoinRushCoins(
    seed: number,
    platforms: Array<{ x: number; y: number; width: number; height: number }>
  ): Array<{ x: number; y: number; isMagnet: boolean }> {
    const rng = new SeededRandom(seed + 7777); // Different salt for coin placement
    const coins: Array<{ x: number; y: number; isMagnet: boolean }> = [];
    const GROUND_Y = 460;

    let magnetCounter = 0;

    for (const platform of platforms) {
      const platCenterX = platform.x + platform.width / 2;
      const platTop = platform.y;

      // Place a cluster of 3-5 coins above every platform
      const clusterSize = rng.nextInt(3, 5);
      for (let c = 0; c < clusterSize; c++) {
        const offsetX = (c - Math.floor(clusterSize / 2)) * 28;
        coins.push({
          x: platCenterX + offsetX,
          y: platTop - 40 - rng.nextInt(0, 15),
          isMagnet: false,
        });
      }

      // Place an arc of coins in the air between platforms (jump path)
      if (rng.next() < 0.7) {
        const arcStartX = platform.x + platform.width + 20;
        const arcCount = rng.nextInt(3, 6);
        for (let a = 0; a < arcCount; a++) {
          const t = a / (arcCount - 1 || 1);
          const arcX = arcStartX + t * 120;
          // Parabolic arc peaking at midpoint
          const arcY = GROUND_Y - 80 - Math.sin(t * Math.PI) * rng.nextInt(60, 120);
          coins.push({ x: arcX, y: arcY, isMagnet: false });
        }
      }

      // Vertical coin column above some platforms
      if (rng.next() < 0.4) {
        const colCount = rng.nextInt(2, 4);
        for (let v = 0; v < colCount; v++) {
          coins.push({
            x: platCenterX,
            y: platTop - 50 - v * 30,
            isMagnet: false,
          });
        }
      }

      magnetCounter++;

      // Every ~5 platforms, place a magnet coin
      if (magnetCounter >= 5) {
        coins.push({
          x: platCenterX,
          y: platTop - 70 - rng.nextInt(10, 40),
          isMagnet: true,
        });
        magnetCounter = 0;
      }
    }

    // Add some extra floating coin trails between gaps
    for (let i = 0; i < platforms.length - 1; i++) {
      const p1 = platforms[i];
      const p2 = platforms[i + 1];
      const gapStart = p1.x + p1.width;
      const gapEnd = p2.x;
      const gapWidth = gapEnd - gapStart;

      if (gapWidth > 80 && rng.next() < 0.6) {
        const trailCount = Math.min(Math.floor(gapWidth / 30), 6);
        for (let t = 0; t < trailCount; t++) {
          const frac = (t + 1) / (trailCount + 1);
          coins.push({
            x: gapStart + frac * gapWidth,
            y: GROUND_Y - 60 - rng.nextInt(20, 80),
            isMagnet: false,
          });
        }
      }
    }

    return coins;
  }

  // Generate 5 gauntlet stages with increasing difficulty
  generateGauntletStages(seed: number): GauntletStage[] {
    const rng = new SeededRandom(seed + 9999);
    const stages: GauntletStage[] = [];

    const stageConfigs: Array<{
      name: string;
      types: PlatformType[];
      targetDistance: number;
      speed: number;
    }> = [
      { name: 'The Warm-Up', types: ['solid', 'solid', 'bounce'], targetDistance: 300, speed: 1.0 },
      { name: 'Shifting Ground', types: ['solid', 'moving', 'phase', 'crumble'], targetDistance: 350, speed: 1.1 },
      { name: 'Hazard Run', types: ['solid', 'bounce', 'ice', 'conveyor', 'crumble'], targetDistance: 400, speed: 1.2 },
      { name: 'The Gauntlet', types: ['solid', 'moving', 'phase', 'ice', 'gravity', 'bounce'], targetDistance: 450, speed: 1.3 },
      { name: 'Final Stand', types: ['solid', 'crumble', 'phase', 'moving', 'ice', 'gravity', 'bounce'], targetDistance: 500, speed: 1.4 },
    ];

    for (let i = 0; i < 5; i++) {
      const config = stageConfigs[i];
      stages.push({
        stageNumber: i + 1,
        seed: seed + rng.nextInt(1000, 9999),
        targetDistance: config.targetDistance,
        platformTypes: config.types,
        speedMultiplier: config.speed,
        name: config.name,
      });
    }

    return stages;
  }

  // Generate platforms for a specific gauntlet stage
  generateGauntletPlatforms(stage: GauntletStage, startX: number, count: number): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: PlatformType;
  }> {
    const rng = new SeededRandom(stage.seed + startX);
    const platforms: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      type: PlatformType;
    }> = [];

    const GROUND_Y = 460;
    let currentX = startX;

    for (let i = 0; i < count; i++) {
      // Harder stages get narrower platforms and bigger gaps
      const difficultyScale = stage.stageNumber / 5;
      const minWidth = Math.max(60, 100 - difficultyScale * 30);
      const maxWidth = Math.max(80, 150 - difficultyScale * 40);
      const minGap = 100 + difficultyScale * 30;
      const maxGap = 200 + difficultyScale * 40;

      const width = rng.nextInt(minWidth, maxWidth);
      const gap = rng.nextInt(minGap, maxGap);
      const heightOffset = rng.nextInt(0, 60 + stage.stageNumber * 15);
      const type = rng.pick(stage.platformTypes);

      platforms.push({
        x: currentX + gap,
        y: GROUND_Y - heightOffset,
        width,
        height: 20,
        type,
      });

      currentX += gap + width;
    }

    return platforms;
  }

  // Check and return newly earned streak rewards
  getNewStreakRewards(): StreakReward[] {
    const rewards: StreakReward[] = [];
    for (const reward of STREAK_REWARDS) {
      if (this.data.currentStreak >= reward.streakRequired) {
        // Check if this reward was already claimed
        const claimedKey = `claimed_${reward.rewardId}`;
        if (!this.data.challengeHistory[claimedKey]) {
          rewards.push(reward);
        }
      }
    }
    return rewards;
  }

  // Mark a streak reward as claimed
  claimStreakReward(rewardId: string): void {
    const claimedKey = `claimed_${rewardId}`;
    this.data.challengeHistory[claimedKey] = {
      challengeId: claimedKey,
      completed: true,
      bestScore: 0,
      attempts: 0,
      completedAt: Date.now(),
    };
    this.saveData();
  }

  // Get the next upcoming streak reward
  getNextStreakReward(): StreakReward | null {
    for (const reward of STREAK_REWARDS) {
      if (this.data.currentStreak < reward.streakRequired) {
        return reward;
      }
    }
    return null;
  }

  // Get all challenge data for SaveManager integration
  getChallengeData(): ChallengeData {
    return { ...this.data };
  }

  // Load challenge data from SaveManager
  loadFromSaveData(data: ChallengeData): void {
    this.data = { ...data };
    this.saveData();
  }
}
