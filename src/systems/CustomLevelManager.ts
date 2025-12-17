import { CustomLevel, BackgroundConfig, PlatformConfig, CoinConfig, Vector2, Rectangle } from '../types';
import { GAME_HEIGHT } from '../constants';

const STORAGE_KEY = 'tempodash_custom_levels';

// Default background for new levels
const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'city',
  primaryColor: '#0a0a1a',
  secondaryColor: '#151530',
  accentColor: '#00ffff',
  particles: {
    count: 30,
    color: 'rgba(255, 255, 255',
    minSize: 1,
    maxSize: 3,
    speed: 30,
    direction: 'up',
  },
  effects: ['stars'],
};

export class CustomLevelManager {
  private levels: CustomLevel[] = [];

  constructor() {
    this.loadFromStorage();
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

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.levels));
    } catch (e) {
      console.error('Failed to save custom levels:', e);
    }
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

  // Save a level (create or update)
  saveLevel(level: CustomLevel): void {
    level.updatedAt = Date.now();

    const existingIndex = this.levels.findIndex(l => l.id === level.id);
    if (existingIndex >= 0) {
      this.levels[existingIndex] = level;
    } else {
      this.levels.push(level);
    }

    this.saveToStorage();
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
