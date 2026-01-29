import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 13: Slowmo Symphony - Time bends around you; precision is everything

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level13: LevelConfig = {
  id: 13,
  name: 'Slowmo Symphony',
  description: 'Time slows to a crawl on blue platforms. Use every precious moment to navigate crumbling paths and phase traps.',
  difficulty: 'extreme',
  backgroundColor: '#1a237e',
  accentColor: '#42a5f5',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 8500,

  platforms: [
    // Starting platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 1: Slowmo intro
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 210,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 400,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 580,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },

    // Section 2: Slowmo into crumble - use the slow time to plan
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 760,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 940,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1120,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1300,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },

    // Section 3: Phase platforms in slowmo
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1480,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1660,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1840,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1000,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2020,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },

    // Section 4: Spike hazard between slowmo
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 2170,
      width: 40,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2210,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 80,
      y: 2170,
      width: 40,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2400,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },

    // Section 5: Crumble chain with slowmo safety nets
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 2590,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 2770,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 2950,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3130,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },

    // Section 6: Extreme precision - phase + spike + slowmo
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 3280,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3370,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3560,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3750,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 800,
    },

    // Section 7: Moving slowmo platforms
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3940,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4130,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2.5 },
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4320,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },

    // Section 8: Final approach - crumble + slowmo
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 4510,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 4690,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4870,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 5100,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Section 1 coins
    { x: SCREEN_WIDTH / 2, y: 305 },
    { x: SCREEN_WIDTH / 2, y: 490 },
    { x: SCREEN_WIDTH / 2 + 50, y: 670 },

    // Section 2 coins
    { x: SCREEN_WIDTH / 2 - 90, y: 850 },
    { x: SCREEN_WIDTH / 2 + 50, y: 1030 },
    { x: SCREEN_WIDTH / 2, y: 1210 },
    { x: SCREEN_WIDTH / 2 - 90, y: 1390 },

    // Section 3 coins
    { x: SCREEN_WIDTH / 2, y: 1570 },
    { x: SCREEN_WIDTH / 2 + 50, y: 1750 },
    { x: SCREEN_WIDTH / 2 - 90, y: 1930 },

    // Section 4 coins
    { x: SCREEN_WIDTH / 2, y: 2110 },
    { x: SCREEN_WIDTH / 2, y: 2305 },

    // Section 5 coins
    { x: SCREEN_WIDTH / 2 + 50, y: 2680 },
    { x: SCREEN_WIDTH / 2 - 90, y: 2860 },
    { x: SCREEN_WIDTH / 2 + 50, y: 3040 },

    // Section 6 coins
    { x: SCREEN_WIDTH / 2, y: 3465 },
    { x: SCREEN_WIDTH / 2, y: 3655 },
    { x: SCREEN_WIDTH / 2, y: 3845 },

    // Section 7 coins
    { x: SCREEN_WIDTH / 2, y: 4035 },
    { x: SCREEN_WIDTH / 2, y: 4225 },

    // Section 8 coins
    { x: SCREEN_WIDTH / 2 + 50, y: 4600 },
    { x: SCREEN_WIDTH / 2 - 90, y: 4780 },

    // Goal approach coins
    { x: SCREEN_WIDTH / 2 - 50, y: 4980 },
    { x: SCREEN_WIDTH / 2, y: 4980 },
    { x: SCREEN_WIDTH / 2 + 50, y: 4980 },
    { x: SCREEN_WIDTH / 2, y: 5050 },
  ],

  powerUps: [
    { x: SCREEN_WIDTH / 2, y: 2100, type: 'doublePoints' },
    { x: SCREEN_WIDTH / 2, y: 4000, type: 'doublePoints' },
  ],
};
