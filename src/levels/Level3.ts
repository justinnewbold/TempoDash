import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Ground Y position
const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;

const level3Config: LevelConfig = {
  id: 3,
  name: 'Final Ascent',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: 6800, y: GROUND_Y - 80, width: 60, height: 80 },
  background: {
    type: 'neon',
    primaryColor: '#0a0a0a',
    secondaryColor: '#1a0a1a',
    accentColor: '#00ff88',
    particles: {
      count: 60,
      color: 'rgba(0, 255, 136',
      minSize: 1,
      maxSize: 5,
      speed: 60,
      direction: 'up',
    },
    effects: ['grid', 'scanlines', 'pulse'],
  },
  platforms: [
    // Starting safe zone
    { x: 0, y: GROUND_Y, width: 400, height: GROUND_HEIGHT, type: 'solid' },

    // Quick spike intro
    { x: 450, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 500, y: GROUND_Y, width: 150, height: GROUND_HEIGHT, type: 'solid' },
    { x: 700, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 750, y: GROUND_Y, width: 150, height: GROUND_HEIGHT, type: 'solid' },

    // Double spike then platform hop
    { x: 950, y: GROUND_Y, width: 60, height: 30, type: 'spike' },
    { x: 1030, y: GROUND_Y, width: 100, height: GROUND_HEIGHT, type: 'solid' },

    // Elevated platform sequence with spikes below
    { x: 1180, y: GROUND_Y - 60, width: 100, height: 20, type: 'solid' },
    { x: 1180, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    { x: 1330, y: GROUND_Y - 90, width: 100, height: 20, type: 'solid' },
    { x: 1330, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    { x: 1480, y: GROUND_Y - 60, width: 100, height: 20, type: 'solid' },
    { x: 1480, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    // Land and bounce section
    { x: 1630, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },
    { x: 1880, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: 2010, y: GROUND_Y - 140, width: 120, height: 20, type: 'solid' },
    { x: 2010, y: GROUND_Y, width: 60, height: 30, type: 'spike' },

    { x: 2180, y: GROUND_Y - 140, width: 80, height: 20, type: 'bounce' },
    { x: 2310, y: GROUND_Y - 60, width: 150, height: 20, type: 'solid' },

    // Ground recovery
    { x: 2510, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Triple spike gauntlet
    { x: 2760, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 2810, y: GROUND_Y, width: 80, height: GROUND_HEIGHT, type: 'solid' },
    { x: 2910, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 2960, y: GROUND_Y, width: 80, height: GROUND_HEIGHT, type: 'solid' },
    { x: 3060, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 3110, y: GROUND_Y, width: 80, height: GROUND_HEIGHT, type: 'solid' },
    { x: 3210, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 3260, y: GROUND_Y, width: 150, height: GROUND_HEIGHT, type: 'solid' },

    // Lava pit with platforms above
    { x: 3460, y: GROUND_Y, width: 200, height: 30, type: 'lava' },
    { x: 3500, y: GROUND_Y - 80, width: 80, height: 20, type: 'solid' },
    { x: 3620, y: GROUND_Y - 80, width: 80, height: 20, type: 'solid' },

    { x: 3750, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Staircase ascent
    { x: 4000, y: GROUND_Y - 40, width: 80, height: 20, type: 'solid' },
    { x: 4130, y: GROUND_Y - 80, width: 80, height: 20, type: 'solid' },
    { x: 4260, y: GROUND_Y - 120, width: 80, height: 20, type: 'solid' },
    { x: 4390, y: GROUND_Y - 80, width: 80, height: 20, type: 'solid' },
    { x: 4390, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    { x: 4520, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Bounce chain
    { x: 4770, y: GROUND_Y, width: 60, height: 20, type: 'bounce' },
    { x: 4880, y: GROUND_Y - 80, width: 60, height: 20, type: 'bounce' },
    { x: 4990, y: GROUND_Y - 160, width: 100, height: 20, type: 'solid' },

    // High platform section
    { x: 5140, y: GROUND_Y - 160, width: 100, height: 20, type: 'solid' },
    { x: 5290, y: GROUND_Y - 120, width: 100, height: 20, type: 'solid' },
    { x: 5290, y: GROUND_Y, width: 60, height: 30, type: 'spike' },

    { x: 5440, y: GROUND_Y - 80, width: 100, height: 20, type: 'solid' },
    { x: 5590, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Final gauntlet - rapid spikes
    { x: 5840, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 5890, y: GROUND_Y, width: 60, height: GROUND_HEIGHT, type: 'solid' },
    { x: 5970, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 6020, y: GROUND_Y, width: 60, height: GROUND_HEIGHT, type: 'solid' },
    { x: 6100, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 6150, y: GROUND_Y, width: 60, height: GROUND_HEIGHT, type: 'solid' },
    { x: 6230, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 6280, y: GROUND_Y, width: 60, height: GROUND_HEIGHT, type: 'solid' },

    // Victory platform hop
    { x: 6390, y: GROUND_Y - 50, width: 100, height: 20, type: 'solid' },
    { x: 6540, y: GROUND_Y - 50, width: 100, height: 20, type: 'solid' },
    { x: 6540, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    // Final stretch to goal
    { x: 6690, y: GROUND_Y, width: 300, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level3 extends Level {
  constructor() {
    super(level3Config);
  }
}
