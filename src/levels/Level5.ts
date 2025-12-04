import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

const level5Config: LevelConfig = {
  id: 5,
  name: 'Storm Surge',
  playerStart: { x: 50, y: GAME_HEIGHT - 150 },
  goal: { x: GAME_WIDTH - 80, y: 100, width: 50, height: 60 },
  background: {
    type: 'storm',
    primaryColor: '#1a1a2e',
    secondaryColor: '#2d2d4a',
    accentColor: '#fbbf24',
    particles: {
      count: 60,
      color: 'rgba(200, 200, 255',
      minSize: 1,
      maxSize: 2,
      speed: 200,
      direction: 'down',
    },
    effects: ['stormclouds', 'lightning', 'rain'],
  },
  platforms: [
    // Starting safe zone
    { x: 0, y: GAME_HEIGHT - 40, width: 180, height: 40, type: 'solid' },

    // First wind platform - pushes right
    { x: 200, y: GAME_HEIGHT - 80, width: 120, height: 25, type: 'wind', direction: 'right', windStrength: 350 },
    { x: 350, y: GAME_HEIGHT - 120, width: 80, height: 20, type: 'solid' },

    // Cloud platforms that sink
    { x: 450, y: GAME_HEIGHT - 100, width: 100, height: 30, type: 'cloud' },
    { x: 580, y: GAME_HEIGHT - 140, width: 100, height: 30, type: 'cloud' },
    { x: 700, y: GAME_HEIGHT - 100, width: 80, height: 20, type: 'solid' },

    // Lightning platforms section
    { x: 100, y: GAME_HEIGHT - 200, width: 100, height: 20, type: 'lightning' },
    { x: 230, y: GAME_HEIGHT - 240, width: 80, height: 20, type: 'solid' },
    { x: 340, y: GAME_HEIGHT - 280, width: 100, height: 20, type: 'lightning' },
    { x: 470, y: GAME_HEIGHT - 240, width: 80, height: 20, type: 'solid' },

    // Wind tunnel - strong push left
    { x: 550, y: GAME_HEIGHT - 300, width: 150, height: 30, type: 'wind', direction: 'left', windStrength: 500 },
    { x: 380, y: GAME_HEIGHT - 350, width: 80, height: 20, type: 'solid' },

    // Cloud stairway
    { x: 250, y: GAME_HEIGHT - 380, width: 90, height: 30, type: 'cloud' },
    { x: 150, y: GAME_HEIGHT - 430, width: 90, height: 30, type: 'cloud' },
    { x: 50, y: GAME_HEIGHT - 480, width: 100, height: 20, type: 'solid' },

    // Lightning gauntlet
    { x: 180, y: GAME_HEIGHT - 500, width: 80, height: 20, type: 'lightning' },
    { x: 290, y: GAME_HEIGHT - 480, width: 80, height: 20, type: 'solid' },
    { x: 400, y: GAME_HEIGHT - 500, width: 80, height: 20, type: 'lightning' },
    { x: 510, y: GAME_HEIGHT - 480, width: 80, height: 20, type: 'solid' },

    // Wind boost section
    { x: 600, y: GAME_HEIGHT - 450, width: 100, height: 25, type: 'wind', direction: 'right', windStrength: 400 },
    { x: 730, y: GAME_HEIGHT - 420, width: 80, height: 20, type: 'solid' },

    // Moving platforms in the storm
    {
      x: 800,
      y: GAME_HEIGHT - 350,
      width: 80,
      height: 20,
      type: 'moving',
      movePattern: { type: 'vertical', distance: 60, speed: 1.8 },
    },
    {
      x: 700,
      y: GAME_HEIGHT - 280,
      width: 70,
      height: 20,
      type: 'moving',
      movePattern: { type: 'horizontal', distance: 50, speed: 2 },
    },

    // Upper storm section
    { x: 850, y: GAME_HEIGHT - 250, width: 80, height: 20, type: 'solid' },
    { x: 780, y: GAME_HEIGHT - 180, width: 100, height: 30, type: 'cloud' },
    { x: 650, y: GAME_HEIGHT - 150, width: 80, height: 20, type: 'bounce' },

    // Final approach with alternating hazards
    { x: 550, y: GAME_HEIGHT - 200, width: 80, height: 20, type: 'lightning' },
    { x: 680, y: GAME_HEIGHT - 250, width: 100, height: 25, type: 'wind', direction: 'right', windStrength: 300 },
    { x: 820, y: GAME_HEIGHT - 300, width: 80, height: 20, type: 'solid' },

    // Path to goal
    { x: 850, y: GAME_HEIGHT - 380, width: 90, height: 30, type: 'cloud' },
    { x: 780, y: GAME_HEIGHT - 450, width: 80, height: 20, type: 'solid' },

    // Goal platform with wind pushing toward it
    { x: GAME_WIDTH - 150, y: 180, width: 130, height: 20, type: 'solid' },
    { x: GAME_WIDTH - 280, y: 200, width: 100, height: 25, type: 'wind', direction: 'right', windStrength: 200 },
  ],
};

export class Level5 extends Level {
  constructor() {
    super(level5Config);
  }
}
