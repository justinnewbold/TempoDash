import { CustomLevel, BackgroundConfig, PlatformConfig, CoinConfig, Vector2, Rectangle } from '../types';
import { GAME_HEIGHT } from '../constants';

const STORAGE_KEY = 'tempodash_custom_levels';

// Level template types
export type LevelTemplate = 'blank' | 'tutorial' | 'speedrun' | 'puzzle';

export interface TemplateInfo {
  id: LevelTemplate;
  name: string;
  description: string;
  icon: string;
}
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

    // Check path completability
    const pathCheck = this.checkCompletability(level);
    if (!pathCheck.reachable) {
      warnings.push(`Goal may not be reachable: ${pathCheck.reason}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Check if there's a possible path from start to goal
  private checkCompletability(level: CustomLevel): { reachable: boolean; reason: string } {
    if (!level.playerStart || !level.goal || !level.platforms || level.platforms.length === 0) {
      return { reachable: false, reason: 'Missing required elements' };
    }

    // Game physics constants (approximate)
    const PLAYER_WIDTH = 30;
    const PLAYER_HEIGHT = 30;
    const MAX_JUMP_HEIGHT = 150; // Approximate max jump height
    const MAX_JUMP_DISTANCE = 250; // Approximate max horizontal jump distance
    const DASH_DISTANCE = 100; // Approximate dash distance

    // Build a list of safe platforms (exclude deadly ones for initial check)
    const safePlatforms = level.platforms.filter(p =>
      p.type !== 'lava' && p.type !== 'spike'
    );

    if (safePlatforms.length === 0) {
      return { reachable: false, reason: 'No safe platforms' };
    }

    // Find start and goal platform indices
    let startPlatformIdx = -1;
    let goalPlatformIdx = -1;

    for (let i = 0; i < safePlatforms.length; i++) {
      const p = safePlatforms[i];
      const pTop = p.y;

      // Check if player start is on this platform
      const playerBottom = level.playerStart.y + PLAYER_HEIGHT;
      if (p.x <= level.playerStart.x &&
          p.x + p.width >= level.playerStart.x + PLAYER_WIDTH &&
          Math.abs(playerBottom - pTop) < 60) {
        startPlatformIdx = i;
      }

      // Check if goal is on/near this platform
      const goalBottom = level.goal.y + level.goal.height;
      if (p.x <= level.goal.x + level.goal.width &&
          p.x + p.width >= level.goal.x &&
          Math.abs(goalBottom - pTop) < 60) {
        goalPlatformIdx = i;
      }
    }

    if (startPlatformIdx === -1) {
      return { reachable: false, reason: 'No platform under player start' };
    }

    // Build reachability graph using BFS with iteration limit to prevent freezing
    const visited = new Set<number>();
    const queue: number[] = [startPlatformIdx];
    visited.add(startPlatformIdx);
    const MAX_BFS_ITERATIONS = 5000;
    let bfsIterations = 0;

    while (queue.length > 0 && bfsIterations < MAX_BFS_ITERATIONS) {
      bfsIterations++;
      const current = queue.shift()!;
      const currentP = safePlatforms[current];

      // Check if we can reach the goal from current platform
      if (goalPlatformIdx !== -1 && current === goalPlatformIdx) {
        return { reachable: true, reason: '' };
      }

      // Check if goal is directly reachable (even without a platform under it)
      const canReachGoalDirectly = this.canReachPoint(
        currentP,
        level.goal.x + level.goal.width / 2,
        level.goal.y + level.goal.height,
        MAX_JUMP_HEIGHT,
        MAX_JUMP_DISTANCE,
        DASH_DISTANCE
      );
      if (canReachGoalDirectly) {
        return { reachable: true, reason: '' };
      }

      // Check which other platforms are reachable
      for (let i = 0; i < safePlatforms.length; i++) {
        if (visited.has(i)) continue;

        const targetP = safePlatforms[i];
        const canReach = this.canReachPlatform(
          currentP, targetP,
          MAX_JUMP_HEIGHT, MAX_JUMP_DISTANCE, DASH_DISTANCE
        );

        if (canReach) {
          visited.add(i);
          queue.push(i);
        }
      }
    }

    // If we have a goal platform index and didn't reach it
    if (goalPlatformIdx !== -1) {
      return { reachable: false, reason: 'Goal platform is not reachable' };
    }

    return { reachable: false, reason: 'No clear path to goal' };
  }

  // Check if a platform can reach a specific point
  private canReachPoint(
    from: PlatformConfig,
    targetX: number,
    targetY: number,
    maxJumpHeight: number,
    maxJumpDist: number,
    dashDist: number
  ): boolean {
    const fromCenterX = from.x + from.width / 2;
    const fromTop = from.y;

    const dx = Math.abs(targetX - fromCenterX);
    const dy = targetY - fromTop; // Positive = target is below

    // Can jump down (falling)
    if (dy > 0 && dx < maxJumpDist + dashDist) {
      return true;
    }

    // Can jump up
    if (dy < 0 && Math.abs(dy) <= maxJumpHeight && dx < maxJumpDist + dashDist) {
      return true;
    }

    // Horizontal with slight height difference
    if (Math.abs(dy) < maxJumpHeight * 0.5 && dx < maxJumpDist + dashDist) {
      return true;
    }

    return false;
  }

  // Check if one platform can reach another
  private canReachPlatform(
    from: PlatformConfig,
    to: PlatformConfig,
    maxJumpHeight: number,
    maxJumpDist: number,
    dashDist: number
  ): boolean {
    // Calculate edges and centers
    const fromRight = from.x + from.width;
    const fromTop = from.y;
    const toLeft = to.x;
    const toRight = to.x + to.width;
    const toTop = to.y;

    // Horizontal gap
    let horizontalGap = 0;
    if (toLeft > fromRight) {
      horizontalGap = toLeft - fromRight;
    } else if (from.x > toRight) {
      horizontalGap = from.x - toRight;
    }
    // If platforms overlap horizontally, gap is 0

    // Vertical difference (positive = target is below)
    const verticalDiff = toTop - fromTop;

    // Can fall down to platform
    if (verticalDiff > 0 && horizontalGap < maxJumpDist + dashDist) {
      return true;
    }

    // Can jump up to platform
    if (verticalDiff < 0 && Math.abs(verticalDiff) <= maxJumpHeight + 20) {
      if (horizontalGap < maxJumpDist + dashDist) {
        return true;
      }
    }

    // Platforms at similar height
    if (Math.abs(verticalDiff) < maxJumpHeight * 0.3) {
      if (horizontalGap < maxJumpDist + dashDist) {
        return true;
      }
    }

    // Consider bounce platforms
    if (from.type === 'bounce') {
      // Bounce gives extra height
      if (verticalDiff < 0 && Math.abs(verticalDiff) <= maxJumpHeight * 2) {
        if (horizontalGap < maxJumpDist + dashDist + 50) {
          return true;
        }
      }
    }

    return false;
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

  // Available level templates
  static getTemplates(): TemplateInfo[] {
    return [
      { id: 'blank', name: 'Blank', description: 'Empty canvas with start and goal', icon: '📄' },
      { id: 'tutorial', name: 'Tutorial', description: 'Teaching layout with platform types', icon: '📚' },
      { id: 'speedrun', name: 'Speedrun', description: 'Long, fast-paced challenge', icon: '⚡' },
      { id: 'puzzle', name: 'Puzzle', description: 'Complex precision platforming', icon: '🧩' },
    ];
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

  // Create a level from a template
  createFromTemplate(template: LevelTemplate, name: string = '', author: string = 'Player'): CustomLevel {
    const groundY = GAME_HEIGHT - 40;
    const now = Date.now();

    switch (template) {
      case 'tutorial':
        return this.createTutorialTemplate(name || 'Tutorial Level', author, groundY, now);
      case 'speedrun':
        return this.createSpeedrunTemplate(name || 'Speedrun Level', author, groundY, now);
      case 'puzzle':
        return this.createPuzzleTemplate(name || 'Puzzle Level', author, groundY, now);
      case 'blank':
      default:
        return this.createNewLevel(name || 'Untitled Level', author);
    }
  }

  // Tutorial template - introduces platform types progressively
  private createTutorialTemplate(name: string, author: string, groundY: number, now: number): CustomLevel {
    const platforms: PlatformConfig[] = [
      // Section 1: Basic jumping
      { x: 0, y: groundY, width: 300, height: 40, type: 'solid' },
      { x: 400, y: groundY, width: 150, height: 40, type: 'solid' },
      { x: 650, y: groundY - 50, width: 150, height: 40, type: 'solid' },

      // Section 2: Bounce platforms
      { x: 900, y: groundY, width: 100, height: 40, type: 'bounce' },
      { x: 1100, y: groundY - 100, width: 150, height: 40, type: 'solid' },

      // Section 3: Moving platforms
      { x: 1350, y: groundY - 80, width: 120, height: 30, type: 'moving',
        movePattern: { type: 'horizontal', distance: 100, speed: 80 } },
      { x: 1600, y: groundY - 40, width: 150, height: 40, type: 'solid' },

      // Section 4: Ice and crumble
      { x: 1850, y: groundY - 60, width: 150, height: 30, type: 'ice' },
      { x: 2100, y: groundY - 100, width: 100, height: 30, type: 'crumble' },
      { x: 2300, y: groundY - 60, width: 150, height: 40, type: 'solid' },

      // Section 5: Hazards
      { x: 2500, y: groundY, width: 80, height: 20, type: 'spike' },
      { x: 2600, y: groundY - 80, width: 150, height: 40, type: 'solid' },

      // Goal platform
      { x: 2850, y: groundY, width: 200, height: 40, type: 'solid' },
    ];

    const coins: CoinConfig[] = [
      { x: 450, y: groundY - 60 },
      { x: 700, y: groundY - 110 },
      { x: 950, y: groundY - 100 },
      { x: 1400, y: groundY - 140 },
      { x: 1900, y: groundY - 120 },
      { x: 2350, y: groundY - 120 },
      { x: 2650, y: groundY - 140 },
    ];

    return {
      id: this.generateId(),
      name,
      author,
      createdAt: now,
      updatedAt: now,
      bpm: 100, // Slower tempo for learning
      background: { ...DEFAULT_BACKGROUND },
      playerStart: { x: 100, y: groundY - 50 },
      goal: { x: 2900, y: groundY - 80, width: 60, height: 80 },
      platforms,
      coins,
    };
  }

  // Speedrun template - fast-paced linear challenge
  private createSpeedrunTemplate(name: string, author: string, groundY: number, now: number): CustomLevel {
    const platforms: PlatformConfig[] = [
      // Starting area
      { x: 0, y: groundY, width: 200, height: 40, type: 'solid' },

      // Fast sequence with bounces
      { x: 280, y: groundY, width: 80, height: 40, type: 'bounce' },
      { x: 440, y: groundY - 80, width: 80, height: 40, type: 'bounce' },
      { x: 600, y: groundY - 160, width: 80, height: 40, type: 'bounce' },
      { x: 760, y: groundY - 80, width: 100, height: 40, type: 'solid' },

      // Moving platform gauntlet
      { x: 950, y: groundY - 60, width: 100, height: 30, type: 'moving',
        movePattern: { type: 'vertical', distance: 80, speed: 120 } },
      { x: 1150, y: groundY - 120, width: 100, height: 30, type: 'moving',
        movePattern: { type: 'vertical', distance: 80, speed: 120 } },
      { x: 1350, y: groundY - 60, width: 100, height: 30, type: 'moving',
        movePattern: { type: 'vertical', distance: 80, speed: 120 } },

      // Conveyor speedway
      { x: 1550, y: groundY - 40, width: 400, height: 30, type: 'conveyor', conveyorSpeed: 0.8 },

      // Final sprint
      { x: 2050, y: groundY - 80, width: 80, height: 40, type: 'solid' },
      { x: 2200, y: groundY - 120, width: 80, height: 40, type: 'solid' },
      { x: 2350, y: groundY - 160, width: 80, height: 40, type: 'solid' },
      { x: 2500, y: groundY - 120, width: 80, height: 40, type: 'bounce' },

      // Goal platform
      { x: 2700, y: groundY - 200, width: 150, height: 40, type: 'solid' },
    ];

    const coins: CoinConfig[] = [
      { x: 320, y: groundY - 60 },
      { x: 480, y: groundY - 140 },
      { x: 640, y: groundY - 220 },
      { x: 800, y: groundY - 140 },
      { x: 1000, y: groundY - 120 },
      { x: 1200, y: groundY - 180 },
      { x: 1400, y: groundY - 120 },
      { x: 1750, y: groundY - 100 },
      { x: 2100, y: groundY - 140 },
      { x: 2250, y: groundY - 180 },
      { x: 2400, y: groundY - 220 },
      { x: 2540, y: groundY - 200 },
    ];

    return {
      id: this.generateId(),
      name,
      author,
      createdAt: now,
      updatedAt: now,
      bpm: 160, // Fast tempo
      background: {
        type: 'neon',
        primaryColor: '#0a0a2a',
        secondaryColor: '#1a0a3a',
        accentColor: '#ff00ff',
        particles: {
          count: 40,
          color: 'rgba(255, 0, 255, 0.5)',
          minSize: 1,
          maxSize: 3,
          speed: 50,
          direction: 'up',
        },
        effects: ['grid', 'pulse'],
      },
      playerStart: { x: 80, y: groundY - 50 },
      goal: { x: 2750, y: groundY - 280, width: 60, height: 80 },
      platforms,
      coins,
    };
  }

  // Puzzle template - precision platforming with tricky layouts
  private createPuzzleTemplate(name: string, author: string, groundY: number, now: number): CustomLevel {
    const platforms: PlatformConfig[] = [
      // Starting area
      { x: 0, y: groundY, width: 150, height: 40, type: 'solid' },

      // Puzzle 1: Phase timing
      { x: 250, y: groundY - 40, width: 100, height: 30, type: 'phase', phaseOffset: 0 },
      { x: 400, y: groundY - 80, width: 100, height: 30, type: 'phase', phaseOffset: 500 },
      { x: 550, y: groundY - 120, width: 100, height: 30, type: 'phase', phaseOffset: 1000 },
      { x: 700, y: groundY - 80, width: 120, height: 40, type: 'solid' },

      // Puzzle 2: Gravity flip challenge
      { x: 900, y: groundY - 40, width: 100, height: 30, type: 'gravity' },
      { x: 1050, y: 100, width: 150, height: 30, type: 'solid' }, // Ceiling platform
      { x: 1250, y: 100, width: 100, height: 30, type: 'gravity' },
      { x: 1400, y: groundY - 80, width: 120, height: 40, type: 'solid' },

      // Puzzle 3: Crumble path choice
      { x: 1600, y: groundY - 60, width: 80, height: 30, type: 'crumble' },
      { x: 1720, y: groundY - 100, width: 80, height: 30, type: 'crumble' },
      { x: 1600, y: groundY - 160, width: 80, height: 30, type: 'glass' },
      { x: 1720, y: groundY - 200, width: 80, height: 30, type: 'glass' },
      { x: 1860, y: groundY - 140, width: 100, height: 40, type: 'solid' },

      // Puzzle 4: Sticky wall climb
      { x: 2050, y: groundY - 200, width: 30, height: 180, type: 'sticky' },
      { x: 2150, y: groundY - 280, width: 30, height: 180, type: 'sticky' },
      { x: 2250, y: groundY - 200, width: 120, height: 40, type: 'solid' },

      // Puzzle 5: Slowmo precision
      { x: 2450, y: groundY - 100, width: 60, height: 150, type: 'slowmo' },
      { x: 2400, y: groundY, width: 40, height: 20, type: 'spike' },
      { x: 2460, y: groundY, width: 40, height: 20, type: 'spike' },
      { x: 2520, y: groundY - 180, width: 80, height: 30, type: 'solid' },

      // Goal platform
      { x: 2700, y: groundY - 140, width: 150, height: 40, type: 'solid' },
    ];

    const coins: CoinConfig[] = [
      // Phase section coins
      { x: 300, y: groundY - 100 },
      { x: 450, y: groundY - 140 },
      { x: 600, y: groundY - 180 },
      // Gravity section coins
      { x: 1100, y: 60 },
      { x: 1300, y: 60 },
      // Crumble path coins
      { x: 1640, y: groundY - 120 },
      { x: 1760, y: groundY - 160 },
      // Sticky wall coins
      { x: 2080, y: groundY - 140 },
      { x: 2180, y: groundY - 220 },
      // Slowmo section coin
      { x: 2480, y: groundY - 40 },
      // Goal coin
      { x: 2750, y: groundY - 200 },
    ];

    return {
      id: this.generateId(),
      name,
      author,
      createdAt: now,
      updatedAt: now,
      bpm: 90, // Slower for thinking
      background: {
        type: 'space',
        primaryColor: '#050510',
        secondaryColor: '#0a0a20',
        accentColor: '#00ffaa',
        particles: {
          count: 50,
          color: 'rgba(255, 255, 255, 0.8)',
          minSize: 1,
          maxSize: 2,
          speed: 10,
          direction: 'random',
        },
        effects: ['stars'],
      },
      playerStart: { x: 60, y: groundY - 50 },
      goal: { x: 2750, y: groundY - 220, width: 60, height: 80 },
      platforms,
      coins,
    };
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
    flyingMode?: boolean;
  } {
    return {
      id: -1, // Custom levels use -1
      name: level.name,
      platforms: level.platforms,
      coins: level.coins,
      playerStart: level.playerStart,
      goal: level.goal,
      background: level.background,
      flyingMode: level.flyingMode,
    };
  }

  // Get level count
  getLevelCount(): number {
    return this.levels.length;
  }
}
