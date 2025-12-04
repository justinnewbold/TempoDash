import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

const level4Config: LevelConfig = {
  id: 4,
  name: 'Zero-G Station',
  playerStart: { x: 50, y: GAME_HEIGHT - 150 },
  goal: { x: GAME_WIDTH / 2 - 25, y: 60, width: 50, height: 60 },
  background: {
    type: 'space',
    primaryColor: '#0a0a1a',
    secondaryColor: '#0f0f2a',
    accentColor: '#3b82f6',
    particles: {
      count: 20,
      color: 'rgba(251, 191, 36',
      minSize: 1,
      maxSize: 3,
      speed: 15,
      direction: 'random',
    },
    effects: ['stars', 'nebula'],
  },
  platforms: [
    // Starting platform
    { x: 0, y: GAME_HEIGHT - 40, width: 150, height: 40, type: 'solid' },

    // Introduction to low gravity
    { x: 100, y: GAME_HEIGHT - 180, width: 200, height: 120, type: 'lowgravity' },
    { x: 130, y: GAME_HEIGHT - 200, width: 80, height: 20, type: 'solid' },
    { x: 200, y: GAME_HEIGHT - 280, width: 80, height: 20, type: 'solid' },

    // First reverse gravity platform
    { x: 320, y: GAME_HEIGHT - 200, width: 100, height: 25, type: 'reverse' },

    // Ceiling section (for reversed gravity)
    { x: 300, y: 80, width: 120, height: 20, type: 'solid' },
    { x: 450, y: 100, width: 100, height: 20, type: 'solid' },
    { x: 580, y: 80, width: 80, height: 20, type: 'solid' },

    // Return to normal gravity
    { x: 650, y: 120, width: 100, height: 25, type: 'reverse' },

    // Middle section - alternating gravity
    { x: 600, y: GAME_HEIGHT - 200, width: 100, height: 20, type: 'solid' },
    { x: 480, y: GAME_HEIGHT - 260, width: 80, height: 20, type: 'solid' },
    { x: 350, y: GAME_HEIGHT - 320, width: 100, height: 25, type: 'reverse' },

    // Low gravity zone in center
    { x: 380, y: GAME_HEIGHT - 400, width: 200, height: 150, type: 'lowgravity' },

    // Platforms in low gravity zone
    { x: 400, y: GAME_HEIGHT - 350, width: 60, height: 15, type: 'solid' },
    { x: 490, y: GAME_HEIGHT - 380, width: 60, height: 15, type: 'solid' },
    { x: 400, y: GAME_HEIGHT - 420, width: 60, height: 15, type: 'solid' },

    // Upper ceiling return
    { x: 200, y: 150, width: 100, height: 25, type: 'reverse' },
    { x: 80, y: 120, width: 100, height: 20, type: 'solid' },

    // Moving platforms in space
    {
      x: 700,
      y: GAME_HEIGHT - 350,
      width: 80,
      height: 20,
      type: 'moving',
      movePattern: { type: 'vertical', distance: 80, speed: 1.2 },
    },
    {
      x: 800,
      y: GAME_HEIGHT - 280,
      width: 80,
      height: 20,
      type: 'moving',
      movePattern: { type: 'circular', distance: 50, speed: 1 },
    },

    // Right side ascent
    { x: 850, y: GAME_HEIGHT - 180, width: 80, height: 20, type: 'solid' },
    { x: 780, y: GAME_HEIGHT - 120, width: 80, height: 20, type: 'bounce' },

    // Bounce platforms for vertical movement
    { x: 750, y: GAME_HEIGHT - 450, width: 60, height: 20, type: 'bounce' },
    { x: 850, y: GAME_HEIGHT - 400, width: 80, height: 20, type: 'solid' },

    // Final reverse gravity section
    { x: 700, y: 200, width: 100, height: 25, type: 'reverse' },
    { x: 550, y: 180, width: 80, height: 20, type: 'solid' },

    // Low gravity approach to goal
    { x: 400, y: 50, width: 200, height: 100, type: 'lowgravity' },

    // Goal platform (center top)
    { x: GAME_WIDTH / 2 - 60, y: 140, width: 120, height: 20, type: 'solid' },

    // Additional floating platforms
    { x: 150, y: GAME_HEIGHT - 400, width: 80, height: 20, type: 'phase' },
    { x: 50, y: GAME_HEIGHT - 320, width: 80, height: 20, type: 'solid' },

    // Ice platform for sliding
    { x: 500, y: GAME_HEIGHT - 140, width: 150, height: 20, type: 'ice' },
  ],
};

export class Level4 extends Level {
  constructor() {
    super(level4Config);
  }
}
