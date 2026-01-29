import { LevelConfig } from '../types';
import { Level1 } from './Level1';
import { Level2 } from './Level2';
import { Level3 } from './Level3';
import { Level4 } from './Level4';
import { Level5 } from './Level5';
import { Level6 } from './Level6';
import { Level7 } from './Level7';
import { Level8 } from './Level8';
import { Level9 } from './Level9';
import { Level10 } from './Level10';
import { Level11 } from './Level11';
import { Level12 } from './Level12';
import { Level13 } from './Level13';
import { Level14 } from './Level14';
import { Level15 } from './Level15';

export const LEVELS: LevelConfig[] = [Level1, Level2, Level3, Level4, Level5, Level6, Level7, Level8, Level9, Level10, Level11, Level12, Level13, Level14, Level15];

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find((level) => level.id === id);
}

export { Level1, Level2, Level3, Level4, Level5, Level6, Level7, Level8, Level9, Level10, Level11, Level12, Level13, Level14, Level15 };
