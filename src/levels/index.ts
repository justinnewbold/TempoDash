import { Level } from './Level';
import { Level1 } from './Level1';
import { Level2 } from './Level2';
import { Level3 } from './Level3';
import { Level4 } from './Level4';
import { Level5 } from './Level5';
import { Level6 } from './Level6';
import { Level7 } from './Level7';

export { Level, Level1, Level2, Level3, Level4, Level5, Level6, Level7 };

export function createLevel(levelId: number): Level {
  switch (levelId) {
    case 1:
      return new Level1();
    case 2:
      return new Level2();
    case 3:
      return new Level3();
    case 4:
      return new Level4();
    case 5:
      return new Level5();
    case 6:
      return new Level6();
    case 7:
      return new Level7();
    default:
      return new Level1();
  }
}

export const TOTAL_LEVELS = 7;
