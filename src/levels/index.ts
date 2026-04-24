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
import { Level16 } from './Level16';

export { Level, Level1, Level2, Level3, Level4, Level5, Level6, Level7, Level8, Level9, Level10, Level11, Level12, Level13, Level14, Level15, Level16 };

// Indexed by levelId - 1. Append new levels here; TOTAL_LEVELS derives from length.
const LEVEL_FACTORIES: Array<() => Level> = [
  () => new Level1(),
  () => new Level2(),
  () => new Level3(),
  () => new Level4(),
  () => new Level5(),
  () => new Level6(),
  () => new Level7(),
  () => new Level8(),
  () => new Level9(),
  () => new Level10(),
  () => new Level11(),
  () => new Level12(),
  () => new Level13(),
  () => new Level14(),
  () => new Level15(),
  () => new Level16(),
];

export function createLevel(levelId: number): Level {
  const factory = LEVEL_FACTORIES[levelId - 1];
  return factory ? factory() : new Level1();
}

export const TOTAL_LEVELS = LEVEL_FACTORIES.length;
