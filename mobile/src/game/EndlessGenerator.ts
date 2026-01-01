import { PlatformConfig, CoinConfig, PlatformType } from '../types';
import { GAME, PLAYER } from '../constants';

const SCREEN_WIDTH = GAME.WIDTH;

interface GeneratorState {
  lastY: number;
  lastX: number;
  difficulty: number;
  platformCount: number;
  sectionType: 'easy' | 'medium' | 'hard' | 'bonus';
}

// Platform type weights by difficulty
const PLATFORM_WEIGHTS: Record<string, Record<PlatformType, number>> = {
  easy: { solid: 80, bounce: 15, moving: 5, crumble: 0, spike: 0, phase: 0 },
  medium: { solid: 50, bounce: 20, moving: 15, crumble: 10, spike: 5, phase: 0 },
  hard: { solid: 30, bounce: 15, moving: 20, crumble: 15, spike: 10, phase: 10 },
  bonus: { solid: 40, bounce: 40, moving: 10, crumble: 0, spike: 0, phase: 10 },
};

export class EndlessGenerator {
  private state: GeneratorState;
  private platforms: PlatformConfig[] = [];
  private coins: CoinConfig[] = [];
  private generatedUpTo: number = 0;

  constructor() {
    this.state = {
      lastY: 0,
      lastX: SCREEN_WIDTH / 2,
      difficulty: 0,
      platformCount: 0,
      sectionType: 'easy',
    };

    // Generate initial platforms
    this.generateInitialSection();
  }

  private generateInitialSection(): void {
    // Starting platform
    this.platforms.push({
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: 20,
      type: 'solid',
    });

    this.state.lastY = 30;
    this.state.lastX = SCREEN_WIDTH / 2;

    // Generate first 20 platforms
    for (let i = 0; i < 20; i++) {
      this.generateNextPlatform();
    }
  }

  private selectPlatformType(): PlatformType {
    const weights = PLATFORM_WEIGHTS[this.state.sectionType];
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;

    for (const [type, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return type as PlatformType;
      }
    }

    return 'solid';
  }

  private generateNextPlatform(): void {
    // Calculate vertical gap based on difficulty
    const baseGap = 150;
    const gapVariation = 50 + this.state.difficulty * 10;
    const verticalGap = baseGap + Math.random() * gapVariation;

    // Calculate horizontal position
    const maxHorizontalMove = 100 + this.state.difficulty * 5;
    const horizontalMove = (Math.random() - 0.5) * 2 * maxHorizontalMove;

    // Platform dimensions
    const baseWidth = 120 - this.state.difficulty * 2;
    const width = Math.max(60, baseWidth + (Math.random() - 0.5) * 40);
    const height = 20;

    // New position
    let newX = this.state.lastX + horizontalMove;
    const newY = this.state.lastY + verticalGap;

    // Keep within screen bounds
    newX = Math.max(width / 2 + 20, Math.min(SCREEN_WIDTH - width / 2 - 20, newX));

    // Select platform type
    const type = this.selectPlatformType();

    const platform: PlatformConfig = {
      x: newX - width / 2,
      y: newY,
      width,
      height,
      type,
    };

    // Add movement for moving platforms
    if (type === 'moving') {
      const moveDistance = 40 + Math.random() * 60;
      platform.movePattern = {
        type: Math.random() > 0.7 ? 'vertical' : 'horizontal',
        distance: moveDistance,
        speed: 1 + Math.random() * 1.5,
        startOffset: Math.random() * Math.PI * 2,
      };
    }

    // Add phase offset for phase platforms
    if (type === 'phase') {
      platform.phaseOffset = Math.random() * 3000;
    }

    this.platforms.push(platform);

    // Maybe add coin
    if (Math.random() < 0.4) {
      this.coins.push({
        x: newX,
        y: newY + 60 + Math.random() * 40,
      });
    }

    // Maybe add spike hazard nearby
    if (type !== 'spike' && this.state.difficulty > 2 && Math.random() < 0.15) {
      const spikeX = newX + (Math.random() > 0.5 ? 1 : -1) * (width / 2 + 30);
      if (spikeX > 30 && spikeX < SCREEN_WIDTH - 60) {
        this.platforms.push({
          x: spikeX - 15,
          y: newY,
          width: 30,
          height: 25,
          type: 'spike',
        });
      }
    }

    // Update state
    this.state.lastX = newX;
    this.state.lastY = newY;
    this.state.platformCount++;
    this.generatedUpTo = newY;

    // Update difficulty every 15 platforms
    if (this.state.platformCount % 15 === 0) {
      this.state.difficulty = Math.min(10, this.state.difficulty + 1);
      this.updateSectionType();
    }
  }

  private updateSectionType(): void {
    const random = Math.random();
    if (this.state.difficulty < 2) {
      this.state.sectionType = 'easy';
    } else if (random < 0.1) {
      this.state.sectionType = 'bonus';
    } else if (random < 0.4) {
      this.state.sectionType = 'easy';
    } else if (random < 0.7) {
      this.state.sectionType = 'medium';
    } else {
      this.state.sectionType = 'hard';
    }
  }

  // Generate more content as player progresses
  ensureGeneratedTo(targetY: number): void {
    const buffer = 1500; // Generate 1500px ahead
    while (this.generatedUpTo < targetY + buffer) {
      this.generateNextPlatform();
    }
  }

  // Get platforms in a Y range
  getPlatformsInRange(minY: number, maxY: number): PlatformConfig[] {
    return this.platforms.filter((p) => {
      return p.y + p.height >= minY && p.y <= maxY;
    });
  }

  // Get coins in a Y range
  getCoinsInRange(minY: number, maxY: number): CoinConfig[] {
    return this.coins.filter((c) => c.y >= minY && c.y <= maxY);
  }

  // Get current difficulty level (for display)
  getDifficulty(): number {
    return this.state.difficulty;
  }

  // Get distance traveled (score)
  getDistance(): number {
    return Math.floor(this.state.lastY / 100);
  }

  // Reset for new game
  reset(): void {
    this.platforms = [];
    this.coins = [];
    this.state = {
      lastY: 0,
      lastX: SCREEN_WIDTH / 2,
      difficulty: 0,
      platformCount: 0,
      sectionType: 'easy',
    };
    this.generatedUpTo = 0;
    this.generateInitialSection();
  }
}
