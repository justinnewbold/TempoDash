import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 3: Danger Zone - Introduces spikes and crumble platforms

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 100;

export const Level3: LevelConfig = {
  id: 3,
  name: 'Danger Zone',
  backgroundColor: '#1a0a0a',
  accentColor: '#ff4444',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 4500,

  platforms: [
    // Start safe zone
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // First jumps
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 380,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // First spike - on the side, teaching awareness
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 580,
      width: 40,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 560,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Crumble platform introduction
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 760,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 960,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Spikes below platform (punishment for missing)
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 1080,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 1180,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Crumble chain
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1380,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1580,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1780,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },

    // Safe landing
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 2000,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Spike corridor
    {
      x: SCREEN_WIDTH / 2 - 150,
      y: 2200,
      width: 40,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 2180,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 110,
      y: 2200,
      width: 40,
      height: 30,
      type: 'spike',
    },

    // Moving through spikes
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 2400,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 100, speed: 1.5 },
    },

    // Spike floor with platforms above
    {
      x: SCREEN_WIDTH / 2 - 150,
      y: 2550,
      width: 300,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 2650,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 2650,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Bounce over spikes
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 2850,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 3050,
      width: 160,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 3200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Final crumble gauntlet
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 3400,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 3600,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 3800,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 4000,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 4250,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    { x: SCREEN_WIDTH / 2, y: 290 },
    { x: SCREEN_WIDTH / 2, y: 470 },
    { x: SCREEN_WIDTH / 2, y: 660 },
    { x: SCREEN_WIDTH / 2, y: 860 },
    { x: SCREEN_WIDTH / 2 - 80, y: 1480 },
    { x: SCREEN_WIDTH / 2 + 90, y: 1680 },
    { x: SCREEN_WIDTH / 2 - 80, y: 1880 },
    { x: SCREEN_WIDTH / 2, y: 2300 },
    { x: SCREEN_WIDTH / 2, y: 2750 },
    { x: SCREEN_WIDTH / 2, y: 3000 },
    { x: SCREEN_WIDTH / 2, y: 3500 },
    { x: SCREEN_WIDTH / 2, y: 3700 },
    { x: SCREEN_WIDTH / 2, y: 3900 },
    { x: SCREEN_WIDTH / 2 - 30, y: 4150 },
    { x: SCREEN_WIDTH / 2 + 30, y: 4150 },
  ],
};
