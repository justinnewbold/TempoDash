import { Level } from './Level';
import { Level1 } from './Level1';
import { Level2 } from './Level2';
import { Level3 } from './Level3';

export { Level, Level1, Level2, Level3 };

export function createLevel(levelId: number): Level {
  switch (levelId) {
    case 1:
      return new Level1();
    case 2:
      return new Level2();
    case 3:
      return new Level3();
    default:
      return new Level1();
  }
}

export const TOTAL_LEVELS = 3;
