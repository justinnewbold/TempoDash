import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 5: The Gauntlet - Combines all mechanics in a challenging finale

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level5: LevelConfig = {
  id: 5,
  name: 'The Gauntlet',
  description: 'A brutal combination of every mechanic. Only the skilled survive.',
  difficulty: 'hard',
  backgroundColor: '#1a0520',
  accentColor: '#ffd700',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 6000,

  platforms: [
    // Epic start
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Quick warmup sequence
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 370,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 540,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },

    // Post-bounce platforms
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 850,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1050,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // First challenge: crumble + moving
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1250,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1450,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 100, speed: 2 },
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1650,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },

    // Spike gauntlet
    {
      x: SCREEN_WIDTH / 2 - 150,
      y: 1820,
      width: 40,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1850,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 110,
      y: 1820,
      width: 40,
      height: 30,
      type: 'spike',
    },

    // Phase section with spikes below
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 2000,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2100,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2300,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1500,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2500,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Bounce chain over spikes
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2700,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 2920,
      width: 200,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3100,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 3320,
      width: 200,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3500,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Moving platform maze
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 3700,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2 },
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 3900,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2, startOffset: Math.PI },
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 4100,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2 },
    },

    // Final crumble gauntlet
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4300,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 4480,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 4660,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4840,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
    },

    // Victory stretch
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5050,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5250,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },

    // Final platform with coins
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5550,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 5800,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Warmup coins
    { x: SCREEN_WIDTH / 2, y: 285 },
    { x: SCREEN_WIDTH / 2, y: 455 },
    { x: SCREEN_WIDTH / 2, y: 700 },

    // Early section
    { x: SCREEN_WIDTH / 2 - 90, y: 950 },
    { x: SCREEN_WIDTH / 2 + 90, y: 1150 },

    // Crumble + moving coins
    { x: SCREEN_WIDTH / 2, y: 1350 },
    { x: SCREEN_WIDTH / 2, y: 1550 },
    { x: SCREEN_WIDTH / 2, y: 1750 },

    // Phase section coins (risky)
    { x: SCREEN_WIDTH / 2, y: 2200 },
    { x: SCREEN_WIDTH / 2, y: 2400 },

    // Bounce chain coins
    { x: SCREEN_WIDTH / 2, y: 2850 },
    { x: SCREEN_WIDTH / 2, y: 3250 },

    // Moving maze coins
    { x: SCREEN_WIDTH / 2 - 90, y: 3800 },
    { x: SCREEN_WIDTH / 2 + 90, y: 4000 },
    { x: SCREEN_WIDTH / 2 - 90, y: 4200 },

    // Final stretch coins
    { x: SCREEN_WIDTH / 2, y: 4400 },
    { x: SCREEN_WIDTH / 2 + 90, y: 4580 },
    { x: SCREEN_WIDTH / 2 - 90, y: 4760 },
    { x: SCREEN_WIDTH / 2, y: 4950 },

    // Victory coins
    { x: SCREEN_WIDTH / 2 - 40, y: 5400 },
    { x: SCREEN_WIDTH / 2, y: 5400 },
    { x: SCREEN_WIDTH / 2 + 40, y: 5400 },

    // Final coin cluster
    { x: SCREEN_WIDTH / 2 - 50, y: 5700 },
    { x: SCREEN_WIDTH / 2, y: 5700 },
    { x: SCREEN_WIDTH / 2 + 50, y: 5700 },
  ],
};
