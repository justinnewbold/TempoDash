import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 1: Tutorial - Teaches basic jumping
// Vertical layout: player starts at bottom, goal at top
// Platforms are positioned with Y increasing upward

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 120;

export const Level1: LevelConfig = {
  id: 1,
  name: 'First Steps',
  backgroundColor: '#1a1a2e',
  accentColor: '#00ffaa',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 3500, // Goal at top

  platforms: [
    // Starting platform (ground)
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Basic jump sequence - teaching single jumps
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 180,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 350,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 520,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Offset platforms - teaching horizontal positioning
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 700,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 20,
      y: 880,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 1060,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Introduce coins with guiding platforms
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 1250,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 1450,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Wider platform for breathing room
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 1650,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Teaching double jump - bigger gap
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 1900,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Introduce bounce platform
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 2100,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },

    // After bounce
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 2400,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Zigzag pattern
    {
      x: SCREEN_WIDTH / 2 - 140,
      y: 2580,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 2760,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 140,
      y: 2940,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Final stretch
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 3120,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 3350,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Early coins - showing the path
    { x: SCREEN_WIDTH / 2, y: 260 },
    { x: SCREEN_WIDTH / 2, y: 430 },

    // Offset coins
    { x: SCREEN_WIDTH / 2 - 60, y: 790 },
    { x: SCREEN_WIDTH / 2 + 80, y: 970 },

    // Coin line
    { x: SCREEN_WIDTH / 2 - 30, y: 1350 },
    { x: SCREEN_WIDTH / 2, y: 1350 },
    { x: SCREEN_WIDTH / 2 + 30, y: 1350 },

    // Double jump reward
    { x: SCREEN_WIDTH / 2, y: 2000 },

    // Post-bounce coins
    { x: SCREEN_WIDTH / 2, y: 2250 },
    { x: SCREEN_WIDTH / 2, y: 2300 },

    // Zigzag coins
    { x: SCREEN_WIDTH / 2 - 80, y: 2670 },
    { x: SCREEN_WIDTH / 2 + 100, y: 2850 },
    { x: SCREEN_WIDTH / 2 - 80, y: 3030 },

    // Final coins
    { x: SCREEN_WIDTH / 2 - 30, y: 3250 },
    { x: SCREEN_WIDTH / 2 + 30, y: 3250 },
  ],
};
