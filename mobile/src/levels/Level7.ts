import { LevelConfig } from '../types';
import { GAME, PLAYER } from '../constants';

// Level 7: Conveyor Chaos - Conveyor belt platforms push the player sideways

const SCREEN_WIDTH = GAME.WIDTH;
const PLATFORM_HEIGHT = 20;
const STANDARD_WIDTH = 90;

export const Level7: LevelConfig = {
  id: 7,
  name: 'Conveyor Chaos',
  description: 'Conveyor belts push you sideways. Fight the current or ride it!',
  difficulty: 'medium',
  backgroundColor: '#1a2744',
  accentColor: '#00bcd4',

  playerStart: { x: SCREEN_WIDTH / 2 - PLAYER.SIZE / 2, y: 50 },
  goalY: 6000,

  platforms: [
    // Starting platform
    {
      x: SCREEN_WIDTH / 2 - 100,
      y: 30,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Warmup solid platforms
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 210,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 390,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // First conveyor introduction - slow speed, pushing right
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 570,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 80,
    },
    // Second conveyor - pushing left
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 750,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: -80,
    },

    // Safe rest after conveyor intro
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 930,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Opposing conveyors zigzag - faster
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1110,
      width: STANDARD_WIDTH + 10,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 100,
    },
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 1290,
      width: STANDARD_WIDTH + 10,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: -100,
    },
    {
      x: SCREEN_WIDTH / 2 - 130,
      y: 1470,
      width: STANDARD_WIDTH + 10,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 110,
    },

    // Spike hazard between conveyors
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 1630,
      width: 50,
      height: 30,
      type: 'spike',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1660,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 + 70,
      y: 1630,
      width: 50,
      height: 30,
      type: 'spike',
    },

    // Conveyor + moving combo
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 1860,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 70, speed: 1.5 },
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 2060,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 120,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2260,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 70, speed: 1.5, startOffset: Math.PI },
    },

    // Mid-level rest area
    {
      x: SCREEN_WIDTH / 2 - 80,
      y: 2460,
      width: 160,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Fast conveyor gauntlet
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2660,
      width: STANDARD_WIDTH + 20,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 130,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 2860,
      width: STANDARD_WIDTH + 20,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: -130,
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3060,
      width: STANDARD_WIDTH + 20,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 140,
    },

    // Bounce pad with conveyors
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 3260,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'bounce',
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 3560,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: -150,
    },

    // Crumble + conveyor trap
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 3760,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },
    {
      x: SCREEN_WIDTH / 2 - 120,
      y: 3940,
      width: STANDARD_WIDTH + 10,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 100,
    },
    {
      x: SCREEN_WIDTH / 2 + 30,
      y: 4120,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'crumble',
    },

    // Final conveyor challenge - maximum speed
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4320,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 4520,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: 150,
    },
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 4720,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'conveyor',
      conveyorSpeed: -150,
    },

    // Victory stretch
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 4920,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },
    {
      x: SCREEN_WIDTH / 2 - 45,
      y: 5120,
      width: STANDARD_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Pre-goal platform
    {
      x: SCREEN_WIDTH / 2 - 60,
      y: 5350,
      width: 120,
      height: PLATFORM_HEIGHT,
      type: 'solid',
    },

    // Goal platform
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
    { x: SCREEN_WIDTH / 2, y: 300 },
    { x: SCREEN_WIDTH / 2 + 70, y: 480 },

    // Conveyor intro coins - placed offset to encourage fighting the belt
    { x: SCREEN_WIDTH / 2 - 30, y: 660 },
    { x: SCREEN_WIDTH / 2 + 30, y: 840 },

    // Zigzag conveyor coins
    { x: SCREEN_WIDTH / 2 - 90, y: 1200 },
    { x: SCREEN_WIDTH / 2 + 70, y: 1380 },
    { x: SCREEN_WIDTH / 2 - 90, y: 1560 },

    // Moving combo coins
    { x: SCREEN_WIDTH / 2, y: 1760 },
    { x: SCREEN_WIDTH / 2, y: 1960 },
    { x: SCREEN_WIDTH / 2, y: 2160 },
    { x: SCREEN_WIDTH / 2, y: 2360 },

    // Fast gauntlet coins
    { x: SCREEN_WIDTH / 2, y: 2760 },
    { x: SCREEN_WIDTH / 2, y: 2960 },
    { x: SCREEN_WIDTH / 2, y: 3160 },

    // Bounce section coins
    { x: SCREEN_WIDTH / 2, y: 3410 },
    { x: SCREEN_WIDTH / 2, y: 3660 },

    // Crumble trap coins
    { x: SCREEN_WIDTH / 2 + 70, y: 3850 },
    { x: SCREEN_WIDTH / 2 - 80, y: 4030 },
    { x: SCREEN_WIDTH / 2 + 70, y: 4220 },

    // Final challenge coins
    { x: SCREEN_WIDTH / 2, y: 4620 },
    { x: SCREEN_WIDTH / 2, y: 4820 },

    // Victory coins
    { x: SCREEN_WIDTH / 2 - 40, y: 5550 },
    { x: SCREEN_WIDTH / 2, y: 5550 },
    { x: SCREEN_WIDTH / 2 + 40, y: 5550 },
  ],

  powerUps: [
    // Magnet power-up to collect coins while fighting conveyors
    { x: SCREEN_WIDTH / 2, y: 1020, type: 'magnet' },
    // Shield for the crumble + conveyor trap section
    { x: SCREEN_WIDTH / 2, y: 4420, type: 'shield' },
  ],
};
