import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Ground Y position
const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;

const level1Config: LevelConfig = {
  id: 1,
  name: 'First Flight',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: 4200, y: GROUND_Y - 80, width: 60, height: 80 },
  background: {
    type: 'city',
    primaryColor: '#0a0a1a',
    secondaryColor: '#151530',
    accentColor: '#e94560',
    particles: {
      count: 30,
      color: 'rgba(255, 255, 255',
      minSize: 1,
      maxSize: 3,
      speed: 30,
      direction: 'down',
    },
    effects: ['stars'],
  },
  platforms: [
    // Starting ground section
    { x: 0, y: GROUND_Y, width: 400, height: GROUND_HEIGHT, type: 'solid' },

    // First gap with single spike
    { x: 450, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 500, y: GROUND_Y, width: 300, height: GROUND_HEIGHT, type: 'solid' },

    // Double spike obstacle
    { x: 850, y: GROUND_Y, width: 60, height: 30, type: 'spike' },
    { x: 930, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Platform section - jump up
    { x: 1180, y: GROUND_Y - 60, width: 120, height: 20, type: 'solid' },
    { x: 1350, y: GROUND_Y - 60, width: 120, height: 20, type: 'solid' },
    { x: 1350, y: GROUND_Y, width: 30, height: 30, type: 'spike' }, // Spike below platform

    // Back to ground with triple spike
    { x: 1520, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },
    { x: 1770, y: GROUND_Y, width: 90, height: 30, type: 'spike' },
    { x: 1880, y: GROUND_Y, width: 300, height: GROUND_HEIGHT, type: 'solid' },

    // Bounce pad section
    { x: 2230, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: 2380, y: GROUND_Y - 100, width: 100, height: 20, type: 'solid' },
    { x: 2380, y: GROUND_Y, width: 30, height: 30, type: 'spike' }, // Spike if you don't bounce high enough

    // Long ground with spikes pattern
    { x: 2530, y: GROUND_Y, width: 150, height: GROUND_HEIGHT, type: 'solid' },
    { x: 2700, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 2750, y: GROUND_Y, width: 100, height: GROUND_HEIGHT, type: 'solid' },
    { x: 2870, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 2920, y: GROUND_Y, width: 100, height: GROUND_HEIGHT, type: 'solid' },
    { x: 3040, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: 3090, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },

    // Elevated platform section
    { x: 3340, y: GROUND_Y - 80, width: 150, height: 20, type: 'solid' },
    { x: 3340, y: GROUND_Y, width: 60, height: 30, type: 'spike' }, // Ground spikes

    { x: 3540, y: GROUND_Y - 80, width: 150, height: 20, type: 'solid' },
    { x: 3540, y: GROUND_Y, width: 60, height: 30, type: 'spike' }, // Ground spikes

    // Final stretch
    { x: 3740, y: GROUND_Y, width: 200, height: GROUND_HEIGHT, type: 'solid' },
    { x: 3990, y: GROUND_Y, width: 60, height: 30, type: 'spike' },
    { x: 4070, y: GROUND_Y, width: 250, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level1 extends Level {
  constructor() {
    super(level1Config);
  }
}
