import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

const level2Config: LevelConfig = {
  id: 2,
  name: 'Neon Dreams',
  playerStart: { x: 50, y: GAME_HEIGHT - 150 },
  goal: { x: GAME_WIDTH - 80, y: 80, width: 50, height: 60 },
  background: {
    type: 'neon',
    primaryColor: '#0d0221',
    secondaryColor: '#1a0533',
    accentColor: '#ff00ff',
    particles: {
      count: 40,
      color: 'rgba(255, 0, 255',
      minSize: 1,
      maxSize: 4,
      speed: 40,
      direction: 'up',
    },
    effects: ['grid', 'scanlines', 'pulse'],
  },
  platforms: [
    // Starting area - safe zone
    { x: 0, y: GAME_HEIGHT - 40, width: 180, height: 40, type: 'solid' },

    // First section - introduce ice
    { x: 200, y: GAME_HEIGHT - 60, width: 100, height: 20, type: 'ice' },
    { x: 340, y: GAME_HEIGHT - 80, width: 80, height: 20, type: 'solid' },
    { x: 460, y: GAME_HEIGHT - 60, width: 120, height: 20, type: 'solid' },

    // Lava pit with platforms above
    { x: 200, y: GAME_HEIGHT - 20, width: 400, height: 20, type: 'lava' },

    // Second section - crumbling platforms
    { x: 100, y: GAME_HEIGHT - 160, width: 80, height: 20, type: 'solid' },
    { x: 220, y: GAME_HEIGHT - 180, width: 70, height: 20, type: 'crumble' },
    { x: 330, y: GAME_HEIGHT - 200, width: 70, height: 20, type: 'crumble' },
    { x: 440, y: GAME_HEIGHT - 180, width: 80, height: 20, type: 'solid' },

    // Third section - phase platforms
    { x: 50, y: GAME_HEIGHT - 280, width: 100, height: 20, type: 'phase' },
    { x: 200, y: GAME_HEIGHT - 300, width: 80, height: 20, type: 'solid' },
    { x: 320, y: GAME_HEIGHT - 320, width: 100, height: 20, type: 'phase' },
    { x: 470, y: GAME_HEIGHT - 280, width: 80, height: 20, type: 'solid' },

    // Moving platform gauntlet
    {
      x: 80,
      y: GAME_HEIGHT - 380,
      width: 80,
      height: 20,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 100, speed: 2 },
    },
    {
      x: 280,
      y: GAME_HEIGHT - 400,
      width: 80,
      height: 20,
      type: 'moving',
      movePattern: { type: 'vertical', distance: 50, speed: 1.5 },
    },
    {
      x: 450,
      y: GAME_HEIGHT - 380,
      width: 80,
      height: 20,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2.5, startOffset: 1.5 },
    },

    // Right side vertical climb
    { x: 580, y: GAME_HEIGHT - 100, width: 100, height: 20, type: 'solid' },
    { x: 700, y: GAME_HEIGHT - 160, width: 80, height: 20, type: 'bounce' },
    { x: 600, y: GAME_HEIGHT - 250, width: 90, height: 20, type: 'solid' },
    { x: 720, y: GAME_HEIGHT - 320, width: 80, height: 20, type: 'ice' },
    { x: 620, y: GAME_HEIGHT - 400, width: 100, height: 20, type: 'solid' },

    // Circular moving platform
    {
      x: 750,
      y: GAME_HEIGHT - 450,
      width: 70,
      height: 20,
      type: 'moving',
      movePattern: { type: 'circular', distance: 40, speed: 1.8 },
    },

    // Upper challenge section
    { x: 500, y: GAME_HEIGHT - 460, width: 80, height: 20, type: 'solid' },
    { x: 350, y: GAME_HEIGHT - 440, width: 70, height: 20, type: 'crumble' },
    { x: 200, y: GAME_HEIGHT - 460, width: 100, height: 20, type: 'phase' },
    { x: 50, y: GAME_HEIGHT - 440, width: 80, height: 20, type: 'solid' },

    // Ice slide section
    { x: 100, y: GAME_HEIGHT - 500, width: 150, height: 15, type: 'ice' },
    { x: 300, y: GAME_HEIGHT - 480, width: 100, height: 15, type: 'ice' },

    // Bounce chain to reach goal
    { x: 450, y: GAME_HEIGHT - 500, width: 60, height: 20, type: 'bounce' },
    { x: 560, y: GAME_HEIGHT - 480, width: 60, height: 20, type: 'solid' },
    { x: 680, y: GAME_HEIGHT - 500, width: 60, height: 20, type: 'bounce' },

    // Final approach with danger
    { x: 780, y: GAME_HEIGHT - 420, width: 80, height: 20, type: 'solid' },
    { x: 800, y: GAME_HEIGHT - 340, width: 100, height: 15, type: 'lava' },

    // Platform above lava
    {
      x: 820,
      y: GAME_HEIGHT - 380,
      width: 70,
      height: 20,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 30, speed: 3 },
    },

    // Goal platform
    { x: GAME_WIDTH - 120, y: 160, width: 100, height: 20, type: 'solid' },

    // Alternative path with phase platforms
    { x: 850, y: GAME_HEIGHT - 460, width: 80, height: 20, type: 'phase' },
    { x: GAME_WIDTH - 100, y: GAME_HEIGHT - 380, width: 70, height: 20, type: 'solid' },
    { x: GAME_WIDTH - 80, y: GAME_HEIGHT - 280, width: 60, height: 20, type: 'solid' },
    { x: GAME_WIDTH - 100, y: GAME_HEIGHT - 180, width: 80, height: 20, type: 'bounce' },
  ],
};

export class Level2 extends Level {
  constructor() {
    super(level2Config);
  }
}
