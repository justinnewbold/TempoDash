import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 6: Ice Cavern - Introduces slippery ice platforms with moving hazards

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level6: LevelConfig = {
  id: 6,
  name: 'Ice Cavern',
  description: 'Slippery ice platforms fill this frozen cave. Watch your footing!',
  difficulty: 'medium',
  backgroundColor: '#0d1b2a',
  accentColor: '#b3e5fc',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 5500,

  platforms: [
    // Starting platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Warmup - solid platforms before the ice begins
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 380,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // First ice platform introduction
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 560,
      width: STANDARD_WIDTH + 20,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 740,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },

    // Safe landing after first ice section
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 920,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Ice zigzag section
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 1100,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 1280,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 1460,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },

    // Spike hazard with narrow passage
    {
      x: SCREEN_WIDTH / 2 - 150,
      y: 1620,
      width: 50,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1650,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 100,
      y: 1620,
      width: 50,
      height: 30,
      type: 'spike',
    },

    // Moving ice platforms
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1850,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.5 },
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2050,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2250,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.8, startOffset: Math.PI },
    },

    // Mid-level rest
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 2450,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Ice and bounce combo
    {
      x: SCREEN_WIDTH / 2 + 20,
      y: 2650,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 - 110,
      y: 2830,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 + 20,
      y: 3150,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },

    // Spike gauntlet over ice
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 3300,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3400,
      width: STANDARD_WIDTH + 20,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },

    // Moving platforms ascending
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 3600,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2 },
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 3800,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2, startOffset: Math.PI },
    },

    // Final ice gauntlet
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4000,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 4200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 4400,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },

    // Victory stretch
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4600,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4800,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Pre-goal coin platform
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 5000,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 5300,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Warmup coins
    { x: SCREEN_WIDTH / 2, y: 290 },
    { x: SCREEN_WIDTH / 2 + 80, y: 470 },

    // Ice introduction coins
    { x: SCREEN_WIDTH / 2, y: 650 },
    { x: SCREEN_WIDTH / 2 - 80, y: 830 },

    // Ice zigzag coins
    { x: SCREEN_WIDTH / 2 + 70, y: 1190 },
    { x: SCREEN_WIDTH / 2 - 80, y: 1370 },
    { x: SCREEN_WIDTH / 2 + 70, y: 1550 },

    // Moving section coins
    { x: SCREEN_WIDTH / 2, y: 1750 },
    { x: SCREEN_WIDTH / 2, y: 1950 },
    { x: SCREEN_WIDTH / 2, y: 2150 },
    { x: SCREEN_WIDTH / 2, y: 2350 },

    // Bounce combo coins
    { x: SCREEN_WIDTH / 2 + 60, y: 2740 },
    { x: SCREEN_WIDTH / 2 - 70, y: 2990 },
    { x: SCREEN_WIDTH / 2 + 60, y: 3230 },

    // Moving ascent coins
    { x: SCREEN_WIDTH / 2 - 90, y: 3700 },
    { x: SCREEN_WIDTH / 2 + 90, y: 3900 },

    // Final ice gauntlet coins
    { x: SCREEN_WIDTH / 2, y: 4100 },
    { x: SCREEN_WIDTH / 2 + 80, y: 4300 },

    // Victory coins
    { x: SCREEN_WIDTH / 2 - 40, y: 5150 },
    { x: SCREEN_WIDTH / 2, y: 5150 },
    { x: SCREEN_WIDTH / 2 + 40, y: 5150 },
  ],

  powerUps: [
    // Shield early on to ease the ice introduction
    { x: SCREEN_WIDTH / 2, y: 500, type: 'shield' },
    // Slowmo for the moving platform section
    { x: SCREEN_WIDTH / 2, y: 2550, type: 'slowmo' },
  ],
};
