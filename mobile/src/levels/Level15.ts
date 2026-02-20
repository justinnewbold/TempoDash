import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 15: The Final Ascent - The ultimate challenge. Everything you've learned, all at once.

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level15: LevelConfig = {
  id: 15,
  name: 'The Final Ascent',
  description: 'The summit awaits. Every platform, every hazard, every trick stands between you and glory. This is the end.',
  difficulty: 'extreme',
  backgroundColor: '#0d0d0d',
  accentColor: '#ffd700',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 7000,

  platforms: [
    // === Starting platform ===
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // === ZONE 1: The Frozen Entry (ice + conveyor) ===
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
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 570,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 3,
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 750,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // === ZONE 2: The Sticky Maze (sticky + wall + moving) ===
    {
      x: 15,
      y: 910,
      width: 25,
      height: 80,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 930,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },
    {
      x: SCREEN_WIDTH - 40,
      y: 910,
      width: 25,
      height: 80,
      type: 'wall',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1120,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2 },
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1310,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'sticky',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1500,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2.5, startOffset: Math.PI },
    },

    // === ZONE 3: The Hidden Path (secret + phase) ===
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1690,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1870,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 2050,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 2230,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2410,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1200,
    },

    // === ZONE 4: The Inferno (lava + glass + bounce) ===
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2600,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 2750,
      width: 160,
      height: 30,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2840,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 3020,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 3250,
      width: 160,
      height: 30,
      type: 'lava',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 3340,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'glass',
    },

    // === ZONE 5: Time Warp (slowmo + gravity + crumble) ===
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3520,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 3700,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 3880,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4060,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'slowmo',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 4240,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },

    // === ZONE 6: The Spike Gauntlet (spike + solid + moving) ===
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4420,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 150,
      y: 4570,
      width: 40,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4610,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 70, speed: 2.5 },
    },
    {
      x: SCREEN_WIDTH / 2 + 110,
      y: 4570,
      width: 40,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 4770,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4860,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // === ZONE 7: The Conveyor Gauntlet (conveyor + ice + phase) ===
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 5050,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: -4,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5240,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5430,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'ice',
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 5620,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 4,
    },

    // === ZONE 8: The Final Gauntlet (everything mixed) ===
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5810,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 5990,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'secret',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 6170,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 6350,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },

    // === Victory stretch ===
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 6600,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // === Goal platform ===
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 6850,
      width: 240,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Zone 1 coins
    { x: SCREEN_WIDTH / 2, y: 300 },
    { x: SCREEN_WIDTH / 2 + 50, y: 480 },
    { x: SCREEN_WIDTH / 2, y: 660 },

    // Zone 2 coins
    { x: SCREEN_WIDTH / 2, y: 1025 },
    { x: SCREEN_WIDTH / 2, y: 1215 },
    { x: SCREEN_WIDTH / 2 + 50, y: 1405 },
    { x: SCREEN_WIDTH / 2 - 90, y: 1595 },

    // Zone 3 coins
    { x: SCREEN_WIDTH / 2, y: 1780 },
    { x: SCREEN_WIDTH / 2 + 50, y: 1960 },
    { x: SCREEN_WIDTH / 2 - 90, y: 2140 },
    { x: SCREEN_WIDTH / 2 + 50, y: 2320 },

    // Zone 4 coins
    { x: SCREEN_WIDTH / 2, y: 2700 },
    { x: SCREEN_WIDTH / 2, y: 2930 },
    { x: SCREEN_WIDTH / 2 + 50, y: 3130 },

    // Zone 5 coins
    { x: SCREEN_WIDTH / 2, y: 3610 },
    { x: SCREEN_WIDTH / 2 + 50, y: 3790 },
    { x: SCREEN_WIDTH / 2 - 90, y: 3970 },
    { x: SCREEN_WIDTH / 2, y: 4150 },

    // Zone 6 coins
    { x: SCREEN_WIDTH / 2, y: 4515 },
    { x: SCREEN_WIDTH / 2, y: 4710 },

    // Zone 7 coins
    { x: SCREEN_WIDTH / 2, y: 5145 },
    { x: SCREEN_WIDTH / 2, y: 5335 },
    { x: SCREEN_WIDTH / 2, y: 5525 },

    // Zone 8 coins
    { x: SCREEN_WIDTH / 2, y: 5900 },
    { x: SCREEN_WIDTH / 2 + 50, y: 6080 },
    { x: SCREEN_WIDTH / 2 - 90, y: 6260 },
    { x: SCREEN_WIDTH / 2, y: 6475 },

    // Victory coins - golden cluster
    { x: SCREEN_WIDTH / 2 - 50, y: 6720 },
    { x: SCREEN_WIDTH / 2, y: 6720 },
    { x: SCREEN_WIDTH / 2 + 50, y: 6720 },

    // Final coins at goal
    { x: SCREEN_WIDTH / 2 - 60, y: 6800 },
    { x: SCREEN_WIDTH / 2, y: 6800 },
    { x: SCREEN_WIDTH / 2 + 60, y: 6800 },
    { x: SCREEN_WIDTH / 2 - 30, y: 6760 },
    { x: SCREEN_WIDTH / 2 + 30, y: 6760 },
  ],

  powerUps: [
    { x: SCREEN_WIDTH / 2, y: 1680, type: 'shield' },
    { x: SCREEN_WIDTH / 2, y: 3500, type: 'slowmo' },
    { x: SCREEN_WIDTH / 2, y: 5000, type: 'magnet' },
    { x: SCREEN_WIDTH / 2, y: 6500, type: 'doublePoints' },
  ],
};
