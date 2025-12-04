import { Level } from './Level';
import { Level1 } from './Level1';
import { Level2 } from './Level2';

export { Level, Level1, Level2 };

export function createLevel(levelId: number): Level {
  switch (levelId) {
    case 1:
      return new Level1();
    case 2:
      return new Level2();
    default:
      return new Level1();
  }
}

export const TOTAL_LEVELS = 2;
