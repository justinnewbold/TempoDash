import { CustomLevel, BackgroundConfig, PlatformConfig, CoinConfig, Vector2, Rectangle } from '../types';
import { GAME_HEIGHT } from '../constants';

const STORAGE_KEY = 'tempodash_custom_levels';
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit (leaving room for other data)
const MAX_LEVEL_LENGTH = 50000; // Maximum level length in pixels
const MIN_PLATFORM_SIZE = 20; // Minimum platform dimension

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Default background for new levels
const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'city',
  primaryColor: '#0a0a1a',
  secondaryColor: '#151530',
  accentColor: '#00ffff',
  particles: {
    count: 30,
    color: 'rgba(255, 255, 255, 0.5)',
    minSize: 1,
    maxSize: 3,
    speed: 30,
    direction: 'up',
  },
  effects: ['stars'],
};

export class CustomLevelManager {
  private levels: CustomLevel[] = [];
  private lastSaveError: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  getLastSaveError(): string | null {
    return this.lastSaveError;
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.levels = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load custom levels:', e);
      this.levels = [];
    }
  }

  private getStorageSize(): number {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total * 2; // UTF-16 uses 2 bytes per character
  }

  private saveToStorage(): boolean {
    this.lastSaveError = null;
    try {
      const data = JSON.stringify(this.levels);
      const dataSize = data.length * 2;

      // Check if we're approaching the limit
      const currentSize = this.getStorageSize();
      if (currentSize + dataSize > MAX_STORAGE_SIZE) {
        this.lastSaveError = `Storage limit reached (${Math.round(currentSize / 1024)}KB used). Delete some levels to save new ones.`;
        console.error(this.lastSaveError);
        return false;
      }

      localStorage.setItem(STORAGE_KEY, data);
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.lastSaveError = 'Storage quota exceeded. Delete some levels to make room.';
      } else {
        this.lastSaveError = 'Failed to save level. Please try again.';
      }
      console.error('Failed to save custom levels:', e);
      return false;
    }
  }

  // Validate a level before playing
  validateLevel(level: CustomLevel): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!level.name || level.name.trim() === '') {
      errors.push('Level must have a name');
    }

    if (!level.platforms || level.platforms.length === 0) {
      errors.push('Level must have at least one platform');
    }

    if (!level.playerStart) {
      errors.push('Level must have a player start position');
    }

    if (!level.goal) {
      errors.push('Level must have a goal');
    }

    // Validate platforms
    let hasValidStartPlatform = false;
    let hasValidGoalPlatform = false;

    for (let i = 0; i < level.platforms.length; i++) {
      const p = level.platforms[i];

      // Check platform dimensions
      if (p.width < MIN_PLATFORM_SIZE) {
        errors.push(`Platform ${i + 1} is too narrow (min ${MIN_PLATFORM_SIZE}px)`);
      }
      if (p.height < MIN_PLATFORM_SIZE) {
        errors.push(`Platform ${i + 1} is too short (min ${MIN_PLATFORM_SIZE}px)`);
      }
      if (p.width > 5000) {
        warnings.push(`Platform ${i + 1} is very wide (${p.width}px)`);
      }

      // Check if platform is within reasonable bounds
      if (p.x < -500) {
        warnings.push(`Platform ${i + 1} is far to the left of the start`);
      }
      if (p.x > MAX_LEVEL_LENGTH) {
        warnings.push(`Platform ${i + 1} is beyond the recommended level length`);
      }
      if (p.y < 0 || p.y > GAME_HEIGHT + 100) {
        warnings.push(`Platform ${i + 1} may be off-screen (y=${p.y})`);
      }

      // Check if player start has a platform beneath it
      if (level.playerStart) {
        const playerBottom = level.playerStart.y + 40; // Player height
        if (p.x <= level.playerStart.x &&
            p.x + p.width >= level.playerStart.x + 30 && // Player width
            Math.abs(playerBottom - p.y) < 50) {
          hasValidStartPlatform = true;
        }
      }

      // Check if goal has a platform beneath it
      if (level.goal) {
        const goalBottom = level.goal.y + level.goal.height;
        if (p.x <= level.goal.x &&
            p.x + p.width >= level.goal.x + level.goal.width &&
            Math.abs(goalBottom - p.y) < 50) {
          hasValidGoalPlatform = true;
        }
      }
    }

    if (!hasValidStartPlatform && level.platforms.length > 0) {
      warnings.push('Player start position may not have a platform beneath it');
    }

    if (!hasValidGoalPlatform && level.platforms.length > 0) {
      warnings.push('Goal may not have a platform beneath it');
    }

    // Validate player start position
    if (level.playerStart) {
      if (level.playerStart.x < 0 || level.playerStart.x > MAX_LEVEL_LENGTH) {
        errors.push('Player start position is out of bounds');
      }
      if (level.playerStart.y < 0 || level.playerStart.y > GAME_HEIGHT) {
        errors.push('Player start Y position is off-screen');
      }
    }

    // Validate goal position
    if (level.goal) {
      if (level.goal.x < 0 || level.goal.x > MAX_LEVEL_LENGTH) {
        errors.push('Goal position is out of bounds');
      }
      if (level.goal.width < 20 || level.goal.height < 20) {
        errors.push('Goal is too small');
      }
      if (level.goal.x <= level.playerStart.x + 100) {
        warnings.push('Goal is very close to the start');
      }
    }

    // Validate coins (if present)
    if (level.coins && Array.isArray(level.coins)) {
      for (let i = 0; i < level.coins.length; i++) {
        const coin = level.coins[i];
        if (coin.x < 0 || coin.x > MAX_LEVEL_LENGTH) {
          warnings.push(`Coin ${i + 1} may be out of bounds`);
        }
        if (coin.y < 0 || coin.y > GAME_HEIGHT) {
          warnings.push(`Coin ${i + 1} may be off-screen`);
        }
      }
    }

    // Validate BPM
    if (level.bpm < 60 || level.bpm > 200) {
      warnings.push(`BPM ${level.bpm} is outside the recommended range (60-200)`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Check if a level is playable (no critical errors)
  isLevelPlayable(level: CustomLevel): boolean {
    const result = this.validateLevel(level);
    return result.valid;
  }

  // Generate a unique ID
  private generateId(): string {
    return `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a new empty level
  createNewLevel(name: string = 'Untitled Level', author: string = 'Player'): CustomLevel {
    const groundY = GAME_HEIGHT - 40;

    const level: CustomLevel = {
      id: this.generateId(),
      name,
      author,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      bpm: 128,
      background: { ...DEFAULT_BACKGROUND },
      playerStart: { x: 100, y: groundY - 50 },
      goal: { x: 2000, y: groundY - 80, width: 60, height: 80 },
      platforms: [
        // Starting platform
        { x: 0, y: groundY, width: 400, height: 40, type: 'solid' },
        // Goal platform
        { x: 1900, y: groundY, width: 200, height: 40, type: 'solid' },
      ],
      coins: [],
    };

    return level;
  }

  // Save a level (create or update) - returns true on success
  saveLevel(level: CustomLevel): boolean {
    level.updatedAt = Date.now();

    const existingIndex = this.levels.findIndex(l => l.id === level.id);
    if (existingIndex >= 0) {
      this.levels[existingIndex] = level;
    } else {
      this.levels.push(level);
    }

    const success = this.saveToStorage();
    if (!success && existingIndex < 0) {
      // Roll back the addition if save failed
      this.levels.pop();
    }
    return success;
  }

  // Get storage usage info
  getStorageInfo(): { used: number; max: number; percentage: number } {
    const used = this.getStorageSize();
    return {
      used,
      max: MAX_STORAGE_SIZE,
      percentage: Math.round((used / MAX_STORAGE_SIZE) * 100)
    };
  }

  // Delete a level
  deleteLevel(levelId: string): boolean {
    const index = this.levels.findIndex(l => l.id === levelId);
    if (index >= 0) {
      this.levels.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Get a level by ID
  getLevel(levelId: string): CustomLevel | null {
    return this.levels.find(l => l.id === levelId) || null;
  }

  // Get all levels
  getAllLevels(): CustomLevel[] {
    return [...this.levels].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Duplicate a level
  duplicateLevel(levelId: string): CustomLevel | null {
    const original = this.getLevel(levelId);
    if (!original) return null;

    const duplicate: CustomLevel = {
      ...JSON.parse(JSON.stringify(original)),
      id: this.generateId(),
      name: `${original.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.levels.push(duplicate);
    this.saveToStorage();
    return duplicate;
  }

  // Export level as JSON string
  exportLevel(levelId: string): string | null {
    const level = this.getLevel(levelId);
    if (!level) return null;
    return JSON.stringify(level, null, 2);
  }

  // Import level from JSON string
  importLevel(jsonString: string): CustomLevel | null {
    try {
      const level = JSON.parse(jsonString) as CustomLevel;

      // Validate required fields
      if (!level.name || !level.platforms || !level.playerStart || !level.goal) {
        throw new Error('Invalid level format');
      }

      // Ensure coins array exists
      if (!level.coins || !Array.isArray(level.coins)) {
        level.coins = [];
      }

      // Ensure background exists
      if (!level.background) {
        level.background = { ...DEFAULT_BACKGROUND };
      }

      // Assign new ID to avoid conflicts
      level.id = this.generateId();
      level.createdAt = Date.now();
      level.updatedAt = Date.now();
      level.name = `${level.name} (Imported)`;

      this.levels.push(level);
      this.saveToStorage();
      return level;
    } catch (e) {
      console.error('Failed to import level:', e);
      return null;
    }
  }

  // Convert CustomLevel to LevelConfig format for playing
  toLevelConfig(level: CustomLevel): {
    id: number;
    name: string;
    platforms: PlatformConfig[];
    coins: CoinConfig[];
    playerStart: Vector2;
    goal: Rectangle;
    background: BackgroundConfig;
  } {
    return {
      id: -1, // Custom levels use -1
      name: level.name,
      platforms: level.platforms,
      coins: level.coins,
      playerStart: level.playerStart,
      goal: level.goal,
      background: level.background,
    };
  }

  // Get level count
  getLevelCount(): number {
    return this.levels.length;
  }
}
