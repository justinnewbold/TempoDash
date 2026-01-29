import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 8: Glass Bridge - Fragile glass platforms that shatter after landing

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level8: LevelConfig = {
  id: 8,
  name: 'Glass Bridge',
  description: 'Fragile glass platforms shatter underfoot. Every step must be precise.',
  difficulty: 'hard',
  backgroundColor: '#1a1a2e',
  accentColor: '#e0e0e0',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 6500,

  platforms: [
    // Starting platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Warmup solids
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 210,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 390,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // First glass platform - wide and forgiving
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 570,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 + 20,
      y: 750,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },

    // Safe checkpoint
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 930,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Glass staircase - alternating sides
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1110,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1290,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1470,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1650,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },

    // Solid breather
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1830,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Glass with spikes below - precision required
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 1980,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2080,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 2230,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2330,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },

    // Safe landing
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 2530,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Glass + moving combo
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2730,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.5 },
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2930,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3130,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.8, startOffset: Math.PI },
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3330,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },

    // Checkpoint
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 3530,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Glass bridge run - consecutive glass with tight spacing
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3720,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 3900,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 4080,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 4260,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 4440,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },

    // Bounce to safety
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4620,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },

    // Post-bounce landing
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4950,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Final glass pair
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 5150,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 5350,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },

    // Victory platform
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5570,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Pre-goal
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 5800,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 6300,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Warmup coins
    { x: SCREEN_WIDTH / 2, y: 300 },
    { x: SCREEN_WIDTH / 2 - 80, y: 480 },

    // First glass coins
    { x: SCREEN_WIDTH / 2, y: 660 },
    { x: SCREEN_WIDTH / 2 + 60, y: 840 },

    // Glass staircase coins
    { x: SCREEN_WIDTH / 2 - 90, y: 1200 },
    { x: SCREEN_WIDTH / 2 + 90, y: 1380 },
    { x: SCREEN_WIDTH / 2 - 90, y: 1560 },
    { x: SCREEN_WIDTH / 2 + 90, y: 1740 },

    // Spike section coins - risky reward
    { x: SCREEN_WIDTH / 2, y: 2180 },
    { x: SCREEN_WIDTH / 2, y: 2430 },

    // Moving + glass coins
    { x: SCREEN_WIDTH / 2, y: 2830 },
    { x: SCREEN_WIDTH / 2, y: 3030 },
    { x: SCREEN_WIDTH / 2, y: 3230 },
    { x: SCREEN_WIDTH / 2, y: 3430 },

    // Glass bridge run coins
    { x: SCREEN_WIDTH / 2, y: 3810 },
    { x: SCREEN_WIDTH / 2 + 70, y: 3990 },
    { x: SCREEN_WIDTH / 2 - 80, y: 4170 },
    { x: SCREEN_WIDTH / 2 + 70, y: 4350 },
    { x: SCREEN_WIDTH / 2 - 80, y: 4530 },

    // Post-bounce coins
    { x: SCREEN_WIDTH / 2, y: 4790 },

    // Final glass coins
    { x: SCREEN_WIDTH / 2 + 70, y: 5250 },
    { x: SCREEN_WIDTH / 2 - 80, y: 5460 },

    // Goal area coins
    { x: SCREEN_WIDTH / 2 - 40, y: 6100 },
    { x: SCREEN_WIDTH / 2, y: 6100 },
    { x: SCREEN_WIDTH / 2 + 40, y: 6100 },
  ],

  powerUps: [
    // Slowmo power-up to help time glass landings
    { x: SCREEN_WIDTH / 2, y: 1020, type: 'slowmo' },
    // Shield for the spike + glass section
    { x: SCREEN_WIDTH / 2, y: 3630, type: 'shield' },
  ],
};
