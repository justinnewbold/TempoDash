import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

const level6Config: LevelConfig = {
  id: 6,
  name: 'Digital Realm',
  playerStart: { x: 50, y: GAME_HEIGHT - 150 },
  goal: { x: GAME_WIDTH - 80, y: 80, width: 50, height: 60 },
  background: {
    type: 'digital',
    primaryColor: '#001a00',
    secondaryColor: '#002200',
    accentColor: '#00ff00',
    particles: {
      count: 50,
      color: 'rgba(0, 255, 0',
      minSize: 1,
      maxSize: 3,
      speed: 100,
      direction: 'down',
    },
    effects: ['circuitboard', 'datastream', 'scanlines', 'glitcheffect'],
  },
  platforms: [
    // Starting area
    { x: 0, y: GAME_HEIGHT - 40, width: 150, height: 40, type: 'solid' },

    // First teleporter pair
    { x: 180, y: GAME_HEIGHT - 80, width: 80, height: 25, type: 'teleporter', linkedId: 'tp1' },
    { x: 500, y: GAME_HEIGHT - 200, width: 80, height: 25, type: 'teleporter', linkedId: 'tp1' },

    // Speed boost introduction
    { x: 300, y: GAME_HEIGHT - 100, width: 120, height: 20, type: 'speedboost' },
    { x: 480, y: GAME_HEIGHT - 80, width: 80, height: 20, type: 'solid' },

    // Glitch platforms - unpredictable!
    { x: 600, y: GAME_HEIGHT - 120, width: 80, height: 20, type: 'glitch' },
    { x: 720, y: GAME_HEIGHT - 160, width: 80, height: 20, type: 'glitch' },
    { x: 840, y: GAME_HEIGHT - 120, width: 80, height: 20, type: 'solid' },

    // Second teleporter pair - vertical transport
    { x: 50, y: GAME_HEIGHT - 200, width: 80, height: 25, type: 'teleporter', linkedId: 'tp2' },
    { x: 50, y: GAME_HEIGHT - 450, width: 80, height: 25, type: 'teleporter', linkedId: 'tp2' },

    // Speed boost highway
    { x: 160, y: GAME_HEIGHT - 200, width: 100, height: 20, type: 'speedboost' },
    { x: 300, y: GAME_HEIGHT - 200, width: 100, height: 20, type: 'speedboost' },
    { x: 440, y: GAME_HEIGHT - 200, width: 80, height: 20, type: 'solid' },

    // Mixed platform section
    { x: 540, y: GAME_HEIGHT - 260, width: 80, height: 20, type: 'phase' },
    { x: 660, y: GAME_HEIGHT - 300, width: 80, height: 20, type: 'crumble' },
    { x: 780, y: GAME_HEIGHT - 260, width: 80, height: 20, type: 'solid' },

    // Third teleporter pair - across the map
    { x: 850, y: GAME_HEIGHT - 200, width: 80, height: 25, type: 'teleporter', linkedId: 'tp3' },
    { x: 100, y: GAME_HEIGHT - 350, width: 80, height: 25, type: 'teleporter', linkedId: 'tp3' },

    // Glitch gauntlet
    { x: 200, y: GAME_HEIGHT - 380, width: 70, height: 20, type: 'glitch' },
    { x: 300, y: GAME_HEIGHT - 420, width: 70, height: 20, type: 'glitch' },
    { x: 400, y: GAME_HEIGHT - 380, width: 70, height: 20, type: 'glitch' },
    { x: 500, y: GAME_HEIGHT - 420, width: 80, height: 20, type: 'solid' },

    // Speed boost ramp up
    { x: 580, y: GAME_HEIGHT - 380, width: 100, height: 20, type: 'speedboost' },
    { x: 720, y: GAME_HEIGHT - 350, width: 80, height: 20, type: 'bounce' },

    // Upper teleporter network
    { x: 800, y: GAME_HEIGHT - 420, width: 70, height: 25, type: 'teleporter', linkedId: 'tp4' },
    { x: 300, y: GAME_HEIGHT - 500, width: 70, height: 25, type: 'teleporter', linkedId: 'tp4' },

    // Moving data platforms
    {
      x: 400,
      y: GAME_HEIGHT - 480,
      width: 80,
      height: 20,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2.5 },
    },
    {
      x: 550,
      y: GAME_HEIGHT - 460,
      width: 70,
      height: 20,
      type: 'moving',
      movePattern: { type: 'vertical', distance: 40, speed: 2 },
    },

    // Final speed boost chain
    { x: 650, y: GAME_HEIGHT - 500, width: 80, height: 20, type: 'speedboost' },
    { x: 780, y: GAME_HEIGHT - 480, width: 80, height: 20, type: 'solid' },

    // Final teleporter to goal area
    { x: 850, y: GAME_HEIGHT - 520, width: 70, height: 25, type: 'teleporter', linkedId: 'tp5' },
    { x: GAME_WIDTH - 180, y: 200, width: 70, height: 25, type: 'teleporter', linkedId: 'tp5' },

    // Goal platform
    { x: GAME_WIDTH - 120, y: 160, width: 100, height: 20, type: 'solid' },

    // Alternative path with glitch platforms
    { x: 700, y: GAME_HEIGHT - 550, width: 60, height: 20, type: 'glitch' },
    { x: 800, y: GAME_HEIGHT - 580, width: 80, height: 20, type: 'phase' },

    // Decorative/challenge platforms
    { x: 150, y: GAME_HEIGHT - 280, width: 60, height: 20, type: 'ice' },
    { x: 650, y: GAME_HEIGHT - 220, width: 60, height: 20, type: 'lava' },
  ],
};

export class Level6 extends Level {
  constructor() {
    super(level6Config);
  }
}
