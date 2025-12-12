import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Ground Y position
const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;

const level2Config: LevelConfig = {
  id: 2,
  name: 'Neon Dreams',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: 5500, y: GROUND_Y - 80, width: 60, height: 80 },
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
    // Starting safe zone
    { x: 0, y: GROUND_Y, width: 500, height: GROUND_HEIGHT, type: 'solid' },

    // First spike
    { x: 550, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 600, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Double jump section
    { x: 850, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 900, y: GROUND_Y, width: 100, height: GROUND_HEIGHT, type: 'solid' },
    { x: 1050, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 1100, y: GROUND_Y, width: 250, height: GROUND_HEIGHT, type: 'solid' },

    // LEVEL 2 UNIQUE: Moving platforms with spikes below
    { x: 1400, y: GROUND_Y - 70, width: 120, height: 20, type: 'moving', movePattern: { type: 'vertical', distance: 30, speed: 2 } },
    { x: 1400, y: GROUND_Y, width: 60, height: 30, type: 'spike' },

    { x: 1570, y: GROUND_Y - 70, width: 120, height: 20, type: 'moving', movePattern: { type: 'vertical', distance: 40, speed: 2.5 } },
    { x: 1570, y: GROUND_Y, width: 60, height: 30, type: 'spike' },

    { x: 1740, y: GROUND_Y - 70, width: 120, height: 20, type: 'moving', movePattern: { type: 'vertical', distance: 30, speed: 3 } },
    { x: 1740, y: GROUND_Y, width: 60, height: 30, type: 'spike' },

    // Land back on ground
    { x: 1910, y: GROUND_Y, width: 250, height: GROUND_HEIGHT, type: 'solid' },

    // Bounce pad sequence
    { x: 2210, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: 2360, y: GROUND_Y - 120, width: 100, height: 20, type: 'solid' },
    { x: 2510, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: 2660, y: GROUND_Y - 120, width: 100, height: 20, type: 'solid' },

    // Spikes after bounce section
    { x: 2810, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },
    { x: 3060, y: GROUND_Y, width: 90, height: 30, type: 'spike' },
    { x: 3170, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Triple spike jump
    { x: 3420, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 3480, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 3540, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 3600, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Staircase section
    { x: 3850, y: GROUND_Y - 50, width: 100, height: 20, type: 'solid' },
    { x: 4000, y: GROUND_Y - 100, width: 100, height: 20, type: 'solid' },
    { x: 4150, y: GROUND_Y - 50, width: 100, height: 20, type: 'solid' },
    { x: 4150, y: GROUND_Y, width: 60, height: 30, type: 'spike' },

    { x: 4300, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Lava pit jump
    { x: 4550, y: GROUND_Y, width: 100, height: 30, type: 'lava' },
    { x: 4700, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Quick spikes pattern
    { x: 4950, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 5010, y: GROUND_Y, width: 80, height: GROUND_HEIGHT, type: 'solid' },
    { x: 5120, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 5180, y: GROUND_Y, width: 80, height: GROUND_HEIGHT, type: 'solid' },
    { x: 5290, y: GROUND_Y, width: 30, height: 30, type: 'spike' },

    // Final platform to goal
    { x: 5350, y: GROUND_Y, width: 300, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level2 extends Level {
  constructor() {
    super(level2Config);
  }
}
