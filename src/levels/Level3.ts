import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

const level3Config: LevelConfig = {
  id: 3,
  name: 'Crystal Caverns',
  playerStart: { x: 50, y: GAME_HEIGHT - 150 },
  goal: { x: GAME_WIDTH - 80, y: 80, width: 50, height: 60 },
  background: {
    type: 'crystal',
    primaryColor: '#1a0a2e',
    secondaryColor: '#2d1b4e',
    accentColor: '#00ffff',
    particles: {
      count: 35,
      color: 'rgba(167, 139, 250',
      minSize: 2,
      maxSize: 5,
      speed: 20,
      direction: 'random',
    },
    effects: ['crystals', 'pulse'],
  },
  platforms: [
    // Starting area
    { x: 0, y: GAME_HEIGHT - 40, width: 150, height: 40, type: 'solid' },

    // Conveyor introduction - left side descent
    { x: 150, y: GAME_HEIGHT - 60, width: 120, height: 20, type: 'conveyor', direction: 'right' },
    { x: 300, y: GAME_HEIGHT - 100, width: 100, height: 20, type: 'solid' },
    { x: 420, y: GAME_HEIGHT - 140, width: 120, height: 20, type: 'conveyor', direction: 'left' },

    // Low gravity zone
    { x: 50, y: GAME_HEIGHT - 200, width: 150, height: 80, type: 'lowgravity' },
    { x: 50, y: GAME_HEIGHT - 280, width: 80, height: 20, type: 'solid' },
    { x: 180, y: GAME_HEIGHT - 320, width: 80, height: 20, type: 'solid' },

    // Conveyor gauntlet
    { x: 300, y: GAME_HEIGHT - 240, width: 100, height: 20, type: 'conveyor', direction: 'right' },
    { x: 420, y: GAME_HEIGHT - 280, width: 100, height: 20, type: 'conveyor', direction: 'right' },
    { x: 540, y: GAME_HEIGHT - 240, width: 80, height: 20, type: 'solid' },

    // Mixed section
    { x: 620, y: GAME_HEIGHT - 180, width: 80, height: 20, type: 'crumble' },
    { x: 720, y: GAME_HEIGHT - 140, width: 100, height: 20, type: 'conveyor', direction: 'left' },
    { x: 840, y: GAME_HEIGHT - 100, width: 80, height: 20, type: 'solid' },

    // Vertical climb with low gravity
    { x: 700, y: GAME_HEIGHT - 280, width: 120, height: 100, type: 'lowgravity' },
    { x: 720, y: GAME_HEIGHT - 350, width: 80, height: 20, type: 'solid' },
    { x: 620, y: GAME_HEIGHT - 420, width: 80, height: 20, type: 'bounce' },

    // Upper conveyor maze
    { x: 450, y: GAME_HEIGHT - 380, width: 120, height: 20, type: 'conveyor', direction: 'left' },
    { x: 300, y: GAME_HEIGHT - 420, width: 120, height: 20, type: 'conveyor', direction: 'right' },
    { x: 150, y: GAME_HEIGHT - 380, width: 100, height: 20, type: 'solid' },

    // Low gravity jumping section
    { x: 50, y: GAME_HEIGHT - 450, width: 200, height: 120, type: 'lowgravity' },
    { x: 80, y: GAME_HEIGHT - 480, width: 60, height: 20, type: 'solid' },
    { x: 180, y: GAME_HEIGHT - 500, width: 60, height: 20, type: 'solid' },

    // Moving platform bridge
    {
      x: 280,
      y: GAME_HEIGHT - 480,
      width: 80,
      height: 20,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 1.5 },
    },
    { x: 420, y: GAME_HEIGHT - 500, width: 80, height: 20, type: 'solid' },

    // Final approach with conveyors
    { x: 520, y: GAME_HEIGHT - 480, width: 100, height: 20, type: 'conveyor', direction: 'right' },
    { x: 640, y: GAME_HEIGHT - 460, width: 80, height: 20, type: 'phase' },
    { x: 740, y: GAME_HEIGHT - 440, width: 100, height: 20, type: 'conveyor', direction: 'right' },

    // Goal platform
    { x: GAME_WIDTH - 120, y: 160, width: 100, height: 20, type: 'solid' },

    // Crystal decorative platforms (solid but thin)
    { x: 860, y: GAME_HEIGHT - 380, width: 60, height: 15, type: 'solid' },
    { x: 880, y: GAME_HEIGHT - 300, width: 60, height: 15, type: 'solid' },
    { x: 860, y: GAME_HEIGHT - 220, width: 60, height: 15, type: 'bounce' },
  ],
};

export class Level3 extends Level {
  constructor() {
    super(level3Config);
  }
}
