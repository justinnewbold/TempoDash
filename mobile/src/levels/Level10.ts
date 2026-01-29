import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 10: Inferno - Lava platforms, crumbling floors, and deadly spikes

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level10: LevelConfig = {
  id: 10,
  name: 'Inferno',
  description: 'Molten lava rises beneath you. Crumbling rock and deadly spikes block your escape.',
  difficulty: 'hard',
  backgroundColor: '#1a0500',
  accentColor: '#ff5722',

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

    // Warmup with ominous lava hints
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 210,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 400,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // First lava platform introduction
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 590,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 770,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Crumble over lava
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 950,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 1130,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 1310,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },

    // Spike barrier
    {
      x: SCREEN_WIDTH / 2 - 150,
      y: 1470,
      width: 60,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1500,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 90,
      y: 1470,
      width: 60,
      height: 30,
      type: 'spike',
    },

    // Lava zigzag with spikes
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 1700,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1880,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 2060,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'lava',
    },

    // Safe checkpoint
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 2250,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Moving platforms over lava pools
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2450,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2 },
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 2640,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2830,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2.2, startOffset: Math.PI },
    },

    // Crumble gauntlet
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3020,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 3200,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 3380,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3560,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Lava + spike corridor
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 3720,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3820,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 3980,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4080,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Mid-level rest
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 4280,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Inferno gauntlet - the hardest section
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 4480,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 4660,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 4840,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 5020,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },

    // Bounce escape
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },

    // Post-bounce landing
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5530,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Final spike run
    {
      x: SCREEN_WIDTH / 2 - 150,
      y: 5700,
      width: 50,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5730,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 100,
      y: 5700,
      width: 50,
      height: 30,
      type: 'spike',
    },

    // Last lava hurdle
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 5930,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'lava',
    },

    // Victory stretch
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 6130,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 6330,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Pre-goal
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 6580,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Coin celebration area
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 6850,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 7300,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Warmup coins
    { x: SCREEN_WIDTH / 2, y: 305 },
    { x: SCREEN_WIDTH / 2 + 70, y: 495 },

    // Lava intro coins
    { x: SCREEN_WIDTH / 2, y: 680 },

    // Crumble over lava coins
    { x: SCREEN_WIDTH / 2 - 80, y: 1040 },
    { x: SCREEN_WIDTH / 2 + 70, y: 1220 },
    { x: SCREEN_WIDTH / 2 - 80, y: 1400 },

    // Lava zigzag coins
    { x: SCREEN_WIDTH / 2 + 80, y: 1790 },
    { x: SCREEN_WIDTH / 2 - 90, y: 1970 },
    { x: SCREEN_WIDTH / 2 + 80, y: 2155 },

    // Moving over lava coins
    { x: SCREEN_WIDTH / 2, y: 2550 },
    { x: SCREEN_WIDTH / 2, y: 2735 },
    { x: SCREEN_WIDTH / 2, y: 2925 },

    // Crumble gauntlet coins
    { x: SCREEN_WIDTH / 2, y: 3110 },
    { x: SCREEN_WIDTH / 2 + 90, y: 3290 },
    { x: SCREEN_WIDTH / 2 - 90, y: 3470 },

    // Spike corridor coin - risky reward
    { x: SCREEN_WIDTH / 2, y: 3920 },

    // Inferno gauntlet coins
    { x: SCREEN_WIDTH / 2 - 90, y: 4570 },
    { x: SCREEN_WIDTH / 2 + 80, y: 4750 },
    { x: SCREEN_WIDTH / 2 - 90, y: 4930 },
    { x: SCREEN_WIDTH / 2 + 80, y: 5110 },

    // Post-bounce coin
    { x: SCREEN_WIDTH / 2, y: 5370 },

    // Victory stretch coins
    { x: SCREEN_WIDTH / 2, y: 6030 },

    // Goal celebration coins
    { x: SCREEN_WIDTH / 2 - 50, y: 7100 },
    { x: SCREEN_WIDTH / 2, y: 7100 },
    { x: SCREEN_WIDTH / 2 + 50, y: 7100 },
  ],

  powerUps: [
    // Shield early to survive the lava introduction
    { x: SCREEN_WIDTH / 2, y: 860, type: 'shield' },
    // Double points for the inferno gauntlet high-risk section
    { x: SCREEN_WIDTH / 2, y: 4380, type: 'doublePoints' },
  ],
};
