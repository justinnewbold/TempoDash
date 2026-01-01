import { LevelConfig } from '../types';
import { Level1 } from './Level1';
import { Level2 } from './Level2';
import { Level3 } from './Level3';
import { Level4 } from './Level4';
import { Level5 } from './Level5';

export const LEVELS: LevelConfig[] = [Level1, Level2, Level3, Level4, Level5];

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find((level) => level.id === id);
}

export { Level1, Level2, Level3, Level4, Level5 };
