import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

const level1Config: LevelConfig = {
  id: 1,
  name: 'City Nights',
  playerStart: { x: 50, y: GAME_HEIGHT - 150 },
  goal: { x: GAME_WIDTH - 80, y: 100, width: 50, height: 60 },
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
    // Ground level platforms
    { x: 0, y: GAME_HEIGHT - 40, width: 200, height: 40, type: 'solid' },
    { x: 250, y: GAME_HEIGHT - 40, width: 150, height: 40, type: 'solid' },
    { x: 450, y: GAME_HEIGHT - 40, width: 200, height: 40, type: 'solid' },

    // First tier - learning basic jumps
    { x: 100, y: GAME_HEIGHT - 120, width: 120, height: 20, type: 'solid' },
    { x: 280, y: GAME_HEIGHT - 140, width: 100, height: 20, type: 'solid' },
    { x: 440, y: GAME_HEIGHT - 160, width: 100, height: 20, type: 'solid' },

    // Second tier - introduce bounce platform
    { x: 50, y: GAME_HEIGHT - 240, width: 80, height: 20, type: 'solid' },
    { x: 180, y: GAME_HEIGHT - 260, width: 80, height: 20, type: 'bounce' },
    { x: 320, y: GAME_HEIGHT - 280, width: 100, height: 20, type: 'solid' },
    { x: 480, y: GAME_HEIGHT - 240, width: 120, height: 20, type: 'solid' },

    // Third tier - moving platform introduction
    {
      x: 100,
      y: GAME_HEIGHT - 360,
      width: 100,
      height: 20,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 1.5 },
    },
    { x: 280, y: GAME_HEIGHT - 380, width: 80, height: 20, type: 'solid' },
    { x: 420, y: GAME_HEIGHT - 360, width: 100, height: 20, type: 'solid' },

    // Upper section
    { x: 550, y: GAME_HEIGHT - 300, width: 80, height: 20, type: 'solid' },
    { x: 680, y: GAME_HEIGHT - 250, width: 100, height: 20, type: 'solid' },
    { x: 820, y: GAME_HEIGHT - 200, width: 80, height: 20, type: 'solid' },

    // Path to goal
    { x: 700, y: GAME_HEIGHT - 350, width: 80, height: 20, type: 'solid' },
    { x: 580, y: GAME_HEIGHT - 420, width: 100, height: 20, type: 'solid' },
    { x: 720, y: GAME_HEIGHT - 440, width: 100, height: 20, type: 'solid' },
    { x: 860, y: GAME_HEIGHT - 380, width: 100, height: 20, type: 'solid' },

    // Final approach
    { x: GAME_WIDTH - 150, y: 180, width: 120, height: 20, type: 'solid' },
  ],
};

export class Level1 extends Level {
  constructor() {
    super(level1Config);
  }
}
