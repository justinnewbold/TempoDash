import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 14: Chaos Theory - Every platform type in one brutal level

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level14: LevelConfig = {
  id: 14,
  name: 'Chaos Theory',
  description: 'Every platform type, every hazard, every trick. Pure chaos demands perfect execution.',
  difficulty: 'extreme',
  backgroundColor: '#3e2723',
  accentColor: '#ff8a65',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 9000,

  platforms: [
    // Starting platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 1: Bounce and ice - slippery launch
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 210,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 390,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 620,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 2: Conveyor and gravity
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 800,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 3,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 990,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1170,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 3: Lava and glass hazards
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 1320,
      width: 160,
      height: 30,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1400,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1580,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1760,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 4: Sticky and wall combo
    {
      x: 15,
      y: 1920,
      width: 25,
      height: 80,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1940,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },
    {
      x: SCREEN_WIDTH - 40,
      y: 1920,
      width: 25,
      height: 80,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2130,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2 },
    },

    // Section 5: Secret and slowmo
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 2320,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 2500,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2680,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 6: Phase + crumble gauntlet
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2860,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 3040,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 3220,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1200,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3400,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },

    // Section 7: Spike corridor with moving platform
    {
      x: SCREEN_WIDTH / 2 - 150,
      y: 3550,
      width: 40,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3580,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 110,
      y: 3550,
      width: 40,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3770,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'vertical', distance: 40, speed: 1.5 },
    },

    // Section 8: Ice conveyor chaos
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 3960,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: -3,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4150,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4340,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },

    // Section 9: Gravity flip zone
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 4570,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 4750,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4930,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Section 10: Final push - lava below, glass above
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 5080,
      width: 160,
      height: 30,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5160,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5350,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 5560,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Section 1 coins
    { x: SCREEN_WIDTH / 2, y: 300 },
    { x: SCREEN_WIDTH / 2 + 50, y: 500 },

    // Section 2 coins
    { x: SCREEN_WIDTH / 2, y: 895 },
    { x: SCREEN_WIDTH / 2, y: 1080 },

    // Section 3 coins
    { x: SCREEN_WIDTH / 2, y: 1490 },
    { x: SCREEN_WIDTH / 2 - 90, y: 1670 },
    { x: SCREEN_WIDTH / 2 + 50, y: 1850 },

    // Section 4 coins
    { x: SCREEN_WIDTH / 2, y: 2035 },
    { x: SCREEN_WIDTH / 2, y: 2225 },

    // Section 5 coins
    { x: SCREEN_WIDTH / 2 - 90, y: 2410 },
    { x: SCREEN_WIDTH / 2 + 50, y: 2590 },
    { x: SCREEN_WIDTH / 2, y: 2770 },

    // Section 6 coins
    { x: SCREEN_WIDTH / 2, y: 2950 },
    { x: SCREEN_WIDTH / 2 + 50, y: 3130 },
    { x: SCREEN_WIDTH / 2 - 90, y: 3310 },

    // Section 7 coins
    { x: SCREEN_WIDTH / 2, y: 3490 },
    { x: SCREEN_WIDTH / 2, y: 3675 },

    // Section 8 coins
    { x: SCREEN_WIDTH / 2, y: 4055 },
    { x: SCREEN_WIDTH / 2, y: 4245 },

    // Section 9 coins
    { x: SCREEN_WIDTH / 2 + 50, y: 4660 },
    { x: SCREEN_WIDTH / 2 - 90, y: 4840 },
    { x: SCREEN_WIDTH / 2, y: 5020 },

    // Section 10 coins
    { x: SCREEN_WIDTH / 2, y: 5255 },

    // Goal approach coins
    { x: SCREEN_WIDTH / 2 - 50, y: 5460 },
    { x: SCREEN_WIDTH / 2, y: 5460 },
    { x: SCREEN_WIDTH / 2 + 50, y: 5460 },

    // Final coins at goal
    { x: SCREEN_WIDTH / 2 - 30, y: 5520 },
    { x: SCREEN_WIDTH / 2 + 30, y: 5520 },
  ],

  powerUps: [
    { x: SCREEN_WIDTH / 2, y: 700, type: 'shield' },
    { x: SCREEN_WIDTH / 2, y: 2400, type: 'magnet' },
    { x: SCREEN_WIDTH / 2, y: 3900, type: 'slowmo' },
    { x: SCREEN_WIDTH / 2, y: 5100, type: 'doublePoints' },
  ],
};
