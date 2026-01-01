import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 4: Phase Shift - Introduces phase platforms and complex movement

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 100;

export const Level4: LevelConfig = {
  id: 4,
  name: 'Phase Shift',
  backgroundColor: '#0a1a2a',
  accentColor: '#b794f4',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 5000,

  platforms: [
    // Start
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Warmup
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 220,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 420,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // First phase platform
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 640,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 860,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Phase platforms with offset timing
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 1080,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 0,
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 1280,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1500, // Offset by half cycle
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 1480,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 0,
    },

    // Safe landing
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 1700,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Complex section: moving + phase
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 1920,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.5 },
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 2140,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 2360,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.5, startOffset: Math.PI },
    },

    // Bounce into phase section
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 2580,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 2900,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 3120,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Phase ladder
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 3340,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 0,
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 3540,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1000,
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 3740,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 2000,
    },

    // Crumble + phase combo
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 3960,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 4160,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 4360,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },

    // Final safe zone
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 4580,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 4800,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    { x: SCREEN_WIDTH / 2, y: 320 },
    { x: SCREEN_WIDTH / 2, y: 530 },
    { x: SCREEN_WIDTH / 2, y: 750 },
    { x: SCREEN_WIDTH / 2 - 80, y: 1180 },
    { x: SCREEN_WIDTH / 2 + 80, y: 1380 },
    { x: SCREEN_WIDTH / 2 - 80, y: 1580 },
    { x: SCREEN_WIDTH / 2, y: 2030 },
    { x: SCREEN_WIDTH / 2, y: 2250 },
    { x: SCREEN_WIDTH / 2, y: 2470 },
    { x: SCREEN_WIDTH / 2, y: 2750 },
    { x: SCREEN_WIDTH / 2, y: 3010 },
    { x: SCREEN_WIDTH / 2, y: 3440 },
    { x: SCREEN_WIDTH / 2, y: 3640 },
    { x: SCREEN_WIDTH / 2, y: 3840 },
    { x: SCREEN_WIDTH / 2, y: 4060 },
    { x: SCREEN_WIDTH / 2, y: 4260 },
    { x: SCREEN_WIDTH / 2, y: 4460 },
    { x: SCREEN_WIDTH / 2 - 30, y: 4700 },
    { x: SCREEN_WIDTH / 2 + 30, y: 4700 },
  ],
};
