import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 2: Double Trouble - Teaches double jump and introduces moving platforms

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 100;

export const Level2: LevelConfig = {
  id: 2,
  name: 'Double Trouble',
  description: 'Master the double jump and ride moving platforms.',
  difficulty: 'easy',
  backgroundColor: '#0d0221',
  accentColor: '#ff00ff',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 4000,

  platforms: [
    // Start
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Quick jumps
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

    // First double jump gap
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 650,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Moving platform introduction
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 850,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.5 },
    },

    // Static landing after moving
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 1050,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Alternating left-right with gaps
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1250,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 50,
      y: 1480,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1710,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Moving platform vertical
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 1950,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'vertical', distance: 60, speed: 1.2 },
    },

    // Bounce combo
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 2200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 - 50,
      y: 2550,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Double jump challenge section
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 2800,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 60,
      y: 3100,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Moving platform duo
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 3350,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2 },
    },
    {
      x: SCREEN_WIDTH / 2 + 60,
      y: 3600,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2, startOffset: Math.PI },
    },

    // Final stretch
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 3850,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Path coins
    { x: SCREEN_WIDTH / 2, y: 290 },
    { x: SCREEN_WIDTH / 2, y: 510 },

    // Double jump reward
    { x: SCREEN_WIDTH / 2, y: 750 },

    // Moving platform coins
    { x: SCREEN_WIDTH / 2, y: 950 },

    // Alternating coins
    { x: SCREEN_WIDTH / 2 - 80, y: 1360 },
    { x: SCREEN_WIDTH / 2 + 100, y: 1590 },
    { x: SCREEN_WIDTH / 2 - 80, y: 1820 },

    // Bounce chain coins
    { x: SCREEN_WIDTH / 2, y: 2350 },
    { x: SCREEN_WIDTH / 2, y: 2450 },

    // Challenge coins
    { x: SCREEN_WIDTH / 2 - 80, y: 2950 },
    { x: SCREEN_WIDTH / 2 + 100, y: 3250 },

    // Final coins
    { x: SCREEN_WIDTH / 2 - 40, y: 3750 },
    { x: SCREEN_WIDTH / 2, y: 3750 },
    { x: SCREEN_WIDTH / 2 + 40, y: 3750 },
  ],
};
