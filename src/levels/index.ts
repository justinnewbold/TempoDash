import { Level } from './Level';
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

export { Level, Level1, Level2, Level3, Level4, Level5, Level6, Level7, Level8, Level9, Level10, Level11, Level12, Level13, Level14, Level15 };

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
    case 8:
      return new Level8();
    case 9:
      return new Level9();
    case 10:
      return new Level10();
    case 11:
      return new Level11();
    case 12:
      return new Level12();
    case 13:
      return new Level13();
    case 14:
      return new Level14();
    case 15:
      return new Level15();
    default:
      return new Level1();
  }
}

export const TOTAL_LEVELS = 15;
