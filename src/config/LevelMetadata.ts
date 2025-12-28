import { MusicStyle } from '../systems/Audio';

export interface LevelMeta {
  id: number;
  name: string;
  color: string;
  difficulty: number; // 1-5 stars
  musicStyle: MusicStyle;
  unlockCost: number;
  description: string;
}

// Centralized level metadata - all level properties in one place
export const LEVEL_METADATA: LevelMeta[] = [
  {
    id: 1,
    name: 'First Flight',
    color: '#00ffaa',
    difficulty: 1,
    musicStyle: 'noir',
    unlockCost: 0,
    description: 'Learn the basics of jumping and timing',
  },
  {
    id: 2,
    name: 'Neon Dreams',
    color: '#ff00ff',
    difficulty: 2,
    musicStyle: 'funk',
    unlockCost: 500,
    description: 'Navigate the neon cityscape',
  },
  {
    id: 3,
    name: 'Final Ascent',
    color: '#ff6600',
    difficulty: 3,
    musicStyle: 'crystal',
    unlockCost: 1500,
    description: 'Climb to new heights',
  },
  {
    id: 4,
    name: 'Frozen Peak',
    color: '#88ddff',
    difficulty: 3,
    musicStyle: 'focus',
    unlockCost: 3000,
    description: 'Master the icy platforms',
  },
  {
    id: 5,
    name: 'Volcanic Descent',
    color: '#ff4400',
    difficulty: 4,
    musicStyle: 'sludge',
    unlockCost: 5000,
    description: 'Survive the volcanic caverns',
  },
  {
    id: 6,
    name: 'Abyssal Depths',
    color: '#00ccff',
    difficulty: 4,
    musicStyle: 'hazard',
    unlockCost: 7500,
    description: 'Explore the underwater abyss',
  },
  {
    id: 7,
    name: 'The Gauntlet',
    color: '#ff0000',
    difficulty: 5,
    musicStyle: 'energetic',
    unlockCost: 10000,
    description: 'The ultimate test of skill',
  },
  {
    id: 8,
    name: 'Sky Temple',
    color: '#e94560',
    difficulty: 5,
    musicStyle: 'crystal',
    unlockCost: 15000,
    description: 'Ascend the floating temple',
  },
  {
    id: 9,
    name: 'The Chase',
    color: '#ff4400',
    difficulty: 5,
    musicStyle: 'energetic',
    unlockCost: 20000,
    description: 'Escape the wall of death',
  },
  {
    id: 10,
    name: 'Sky Glider',
    color: '#87CEEB',
    difficulty: 3,
    musicStyle: 'focus',
    unlockCost: 12000,
    description: 'Fly through the clouds and avoid obstacles',
  },
  {
    id: 11,
    name: 'Ocean Deep',
    color: '#0066cc',
    difficulty: 3,
    musicStyle: 'hazard',
    unlockCost: 14000,
    description: 'Navigate the depths with floaty underwater physics',
  },
  {
    id: 12,
    name: 'Gravity Shift',
    color: '#ff00ff',
    difficulty: 4,
    musicStyle: 'energetic',
    unlockCost: 18000,
    description: 'Master gravity flipping in the anti-gravity lab',
  },
];

// Helper functions
export function getLevelMeta(levelId: number): LevelMeta | undefined {
  return LEVEL_METADATA.find(l => l.id === levelId);
}

export function getLevelName(levelId: number): string {
  return getLevelMeta(levelId)?.name ?? `Level ${levelId}`;
}

export function getLevelColor(levelId: number): string {
  return getLevelMeta(levelId)?.color ?? '#ffffff';
}

export function getLevelDifficulty(levelId: number): number {
  return getLevelMeta(levelId)?.difficulty ?? 1;
}

export function getLevelMusicStyle(levelId: number): MusicStyle {
  return getLevelMeta(levelId)?.musicStyle ?? 'noir';
}

export function getLevelUnlockCost(levelId: number): number {
  return getLevelMeta(levelId)?.unlockCost ?? Infinity;
}

export const TOTAL_LEVELS = LEVEL_METADATA.length;
