import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 12: Secret Passage - Hidden platforms reveal themselves when you get close

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level12: LevelConfig = {
  id: 12,
  name: 'Secret Passage',
  description: 'Not everything is as it seems. Hidden platforms appear only when you draw near. Trust your instincts.',
  difficulty: 'hard',
  backgroundColor: '#263238',
  accentColor: '#607d8b',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 8000,

  platforms: [
    // Starting platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 1: Gentle intro with visible + secret
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 210,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 60,
      y: 390,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 570,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 2: Secret chain - leap of faith
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 750,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 930,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1110,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 3: Secrets mixed with crumble
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1290,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1470,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1650,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1830,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },

    // Section 4: Breather on solid ground
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2010,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 5: Secret + moving combo
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.5 },
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 2390,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 2570,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2 },
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2750,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },

    // Section 6: Secret corridor with spikes
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 2900,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2980,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 3160,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 3340,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },

    // Section 7: Phase + secret - timing and discovery
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3520,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3700,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3880,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1500,
    },

    // Section 8: Final secret gauntlet
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 4060,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 4240,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4420,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 4620,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 4800,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },

    // Solid rest before goal
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4980,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 5200,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Section 1 coins
    { x: SCREEN_WIDTH / 2, y: 300 },
    { x: SCREEN_WIDTH / 2 + 60, y: 480 },

    // Section 2 coins
    { x: SCREEN_WIDTH / 2 - 90, y: 840 },
    { x: SCREEN_WIDTH / 2 + 50, y: 1020 },

    // Section 3 coins
    { x: SCREEN_WIDTH / 2 + 50, y: 1380 },
    { x: SCREEN_WIDTH / 2 - 90, y: 1560 },
    { x: SCREEN_WIDTH / 2, y: 1740 },
    { x: SCREEN_WIDTH / 2 + 50, y: 1920 },

    // Section 5 coins
    { x: SCREEN_WIDTH / 2, y: 2100 },
    { x: SCREEN_WIDTH / 2, y: 2295 },
    { x: SCREEN_WIDTH / 2 - 90, y: 2480 },
    { x: SCREEN_WIDTH / 2 + 50, y: 2660 },

    // Section 6 coins
    { x: SCREEN_WIDTH / 2, y: 3070 },
    { x: SCREEN_WIDTH / 2 + 50, y: 3250 },
    { x: SCREEN_WIDTH / 2 - 90, y: 3430 },

    // Section 7 coins
    { x: SCREEN_WIDTH / 2, y: 3610 },
    { x: SCREEN_WIDTH / 2, y: 3790 },

    // Section 8 coins
    { x: SCREEN_WIDTH / 2 - 90, y: 4150 },
    { x: SCREEN_WIDTH / 2 + 50, y: 4330 },
    { x: SCREEN_WIDTH / 2, y: 4520 },
    { x: SCREEN_WIDTH / 2 - 90, y: 4710 },
    { x: SCREEN_WIDTH / 2 + 50, y: 4890 },

    // Goal approach coins
    { x: SCREEN_WIDTH / 2 - 40, y: 5100 },
    { x: SCREEN_WIDTH / 2 + 40, y: 5100 },
  ],

  powerUps: [
    { x: SCREEN_WIDTH / 2, y: 1200, type: 'shield' },
    { x: SCREEN_WIDTH / 2, y: 3600, type: 'shield' },
  ],
};
