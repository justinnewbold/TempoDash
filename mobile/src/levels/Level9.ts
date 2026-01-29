import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 9: Gravity Well - Gravity flip platforms and phase timing challenges

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level9: LevelConfig = {
  id: 9,
  name: 'Gravity Well',
  description: 'Gravity warps around you. Phase platforms flicker in and out of existence.',
  difficulty: 'hard',
  backgroundColor: '#2d0a4e',
  accentColor: '#ba68c8',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 7000,

  platforms: [
    // Starting platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Warmup section
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
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 590,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // First gravity platform introduction
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 780,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 980,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Gravity + phase combo introduction
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 1170,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 0,
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 1360,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 1550,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1500,
    },

    // Safe checkpoint
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 1750,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Gravity chain - consecutive gravity platforms
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1940,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 2130,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 2320,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },

    // Solid landing after gravity chain
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2510,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Phase ladder with gravity twist
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 2700,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 0,
    },
    {
      x: SCREEN_WIDTH / 2 + 40,
      y: 2890,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1000,
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 3080,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 3270,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 2000,
    },

    // Mid-level rest
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 3470,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Moving + gravity gauntlet
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3670,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2 },
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3870,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4070,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2, startOffset: Math.PI },
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4270,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },

    // Spike corridor with gravity
    {
      x: SCREEN_WIDTH / 2 - 150,
      y: 4430,
      width: 50,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4470,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 + 100,
      y: 4430,
      width: 50,
      height: 30,
      type: 'spike',
    },

    // Phase timing challenge
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4670,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 0,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4870,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 1000,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5070,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'phase',
      phaseOffset: 2000,
    },

    // Bounce to victory
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5270,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },

    // Post-bounce solid
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5600,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Final gravity pair
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 5800,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'gravity',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 6000,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Victory stretch
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 6200,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Pre-goal
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 6450,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 6800,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
  ],

  coins: [
    // Warmup coins
    { x: SCREEN_WIDTH / 2, y: 305 },
    { x: SCREEN_WIDTH / 2 + 70, y: 495 },
    { x: SCREEN_WIDTH / 2 - 80, y: 685 },

    // Gravity intro coins
    { x: SCREEN_WIDTH / 2, y: 880 },

    // Phase + gravity combo coins
    { x: SCREEN_WIDTH / 2 + 70, y: 1265 },
    { x: SCREEN_WIDTH / 2 - 80, y: 1455 },
    { x: SCREEN_WIDTH / 2 + 70, y: 1645 },

    // Gravity chain coins
    { x: SCREEN_WIDTH / 2, y: 2035 },
    { x: SCREEN_WIDTH / 2 + 80, y: 2225 },
    { x: SCREEN_WIDTH / 2 - 90, y: 2415 },

    // Phase ladder coins
    { x: SCREEN_WIDTH / 2 - 80, y: 2795 },
    { x: SCREEN_WIDTH / 2 + 80, y: 2985 },
    { x: SCREEN_WIDTH / 2, y: 3175 },
    { x: SCREEN_WIDTH / 2 - 80, y: 3365 },

    // Moving + gravity gauntlet coins
    { x: SCREEN_WIDTH / 2, y: 3770 },
    { x: SCREEN_WIDTH / 2, y: 3970 },
    { x: SCREEN_WIDTH / 2, y: 4170 },
    { x: SCREEN_WIDTH / 2, y: 4370 },

    // Phase timing coins
    { x: SCREEN_WIDTH / 2, y: 4770 },
    { x: SCREEN_WIDTH / 2, y: 4970 },
    { x: SCREEN_WIDTH / 2, y: 5170 },

    // Post-bounce coins
    { x: SCREEN_WIDTH / 2, y: 5440 },

    // Final section coins
    { x: SCREEN_WIDTH / 2 + 70, y: 5900 },
    { x: SCREEN_WIDTH / 2 - 80, y: 6100 },

    // Goal area coins
    { x: SCREEN_WIDTH / 2 - 40, y: 6625 },
    { x: SCREEN_WIDTH / 2, y: 6625 },
    { x: SCREEN_WIDTH / 2 + 40, y: 6625 },
  ],

  powerUps: [
    // Double points near the gravity chain for big score potential
    { x: SCREEN_WIDTH / 2, y: 1850, type: 'doublePoints' },
    // Shield for the spike corridor section
    { x: SCREEN_WIDTH / 2, y: 5470, type: 'shield' },
  ],
};
