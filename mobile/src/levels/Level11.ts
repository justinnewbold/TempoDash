import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 11: Sticky Situation - Sticky platforms slow you down, walls block your path

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level11: LevelConfig = {
  id: 11,
  name: 'Sticky Situation',
  description: 'Sticky platforms drag you down while walls block your escape. Time your jumps carefully.',
  difficulty: 'hard',
  backgroundColor: '#1b3a1a',
  accentColor: '#8bc34a',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 7500,

  platforms: [
    // Starting platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 1: Intro to sticky
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 390,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 570,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },

    // Section 2: Wall introduction - walls to avoid
    {
      x: 10,
      y: 740,
      width: 30,
      height: 80,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 750,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH - 40,
      y: 740,
      width: 30,
      height: 80,
      type: 'wall',
    },

    // Section 3: Sticky + moving combo
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 940,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1130,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.5 },
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1320,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },

    // Section 4: Wall corridor with phase platforms
    {
      x: 20,
      y: 1490,
      width: 25,
      height: 100,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1510,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH - 45,
      y: 1490,
      width: 25,
      height: 100,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1700,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1500,
    },

    // Section 5: Sticky gauntlet
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1890,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 2070,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2250,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 6: Moving platforms between walls
    {
      x: 15,
      y: 2420,
      width: 25,
      height: 70,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2440,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2 },
    },
    {
      x: SCREEN_WIDTH - 40,
      y: 2420,
      width: 25,
      height: 70,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2630,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2, startOffset: Math.PI },
    },

    // Section 7: Tricky sticky + wall maze
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 2820,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },
    {
      x: SCREEN_WIDTH / 2 + 80,
      y: 2800,
      width: 25,
      height: 60,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 3000,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },
    {
      x: SCREEN_WIDTH / 2 - 110,
      y: 2980,
      width: 25,
      height: 60,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3190,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 8: Phase and sticky finale
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3380,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3570,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },

    // Goal platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 3750,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Section 1 coins
    { x: SCREEN_WIDTH / 2, y: 295 },
    { x: SCREEN_WIDTH / 2, y: 480 },
    { x: SCREEN_WIDTH / 2 + 50, y: 660 },

    // Section 2 coins
    { x: SCREEN_WIDTH / 2, y: 845 },

    // Section 3 coins
    { x: SCREEN_WIDTH / 2 - 90, y: 1035 },
    { x: SCREEN_WIDTH / 2 + 50, y: 1225 },
    { x: SCREEN_WIDTH / 2, y: 1415 },

    // Section 4 coins
    { x: SCREEN_WIDTH / 2, y: 1605 },
    { x: SCREEN_WIDTH / 2, y: 1795 },

    // Section 5 coins
    { x: SCREEN_WIDTH / 2 - 90, y: 1980 },
    { x: SCREEN_WIDTH / 2 + 50, y: 2160 },

    // Section 6 coins
    { x: SCREEN_WIDTH / 2, y: 2340 },
    { x: SCREEN_WIDTH / 2 - 40, y: 2535 },
    { x: SCREEN_WIDTH / 2 + 40, y: 2535 },
    { x: SCREEN_WIDTH / 2, y: 2725 },

    // Section 7 coins
    { x: SCREEN_WIDTH / 2 - 90, y: 2910 },
    { x: SCREEN_WIDTH / 2 + 50, y: 3095 },
    { x: SCREEN_WIDTH / 2, y: 3285 },

    // Section 8 coins
    { x: SCREEN_WIDTH / 2, y: 3475 },
    { x: SCREEN_WIDTH / 2 - 30, y: 3660 },
    { x: SCREEN_WIDTH / 2 + 30, y: 3660 },
  ],

  powerUps: [
    { x: SCREEN_WIDTH / 2, y: 1200, type: 'magnet' },
    { x: SCREEN_WIDTH / 2, y: 2900, type: 'slowmo' },
  ],
};
