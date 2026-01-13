import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 14: "Wall Runner" - 165 BPM (VERY FAST)
// STRATEGY: Master wall jumping - a new movement mechanic!
// Features: Heavy use of wall platforms for wall-sliding and wall-jumping
// Theme: Urban parkour through neon-lit alleyways

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 382; // pixels per beat at 165 BPM (2x length)

const level14Config: LevelConfig = {
  id: 14,
  name: 'Wall Runner',
  bpm: 165,
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 60, y: GROUND_Y - 80, width: 60, height: 80 },
  checkpoints: [
    { x: BEAT * 15, y: GROUND_Y - 50, name: 'First Walls' },
    { x: BEAT * 30, y: GROUND_Y - 50, name: 'Vertical Climb' },
    { x: BEAT * 45, y: GROUND_Y - 50, name: 'Final Run' },
  ],
  background: {
    type: 'city',
    primaryColor: '#0a0a1a',
    secondaryColor: '#151530',
    accentColor: '#00ffff',
    particles: {
      count: 50,
      color: 'rgba(0, 255, 255, 0.4)',
      minSize: 1,
      maxSize: 3,
      speed: 60,
      direction: 'down',
    },
    effects: ['grid', 'scanlines'],
  },
  coins: [
    { x: BEAT * 8, y: GROUND_Y - 100 },
    { x: BEAT * 16, y: GROUND_Y - 150 },
    { x: BEAT * 24, y: GROUND_Y - 80 },
    { x: BEAT * 32, y: GROUND_Y - 180 },
    { x: BEAT * 40, y: GROUND_Y - 100 },
    { x: BEAT * 48, y: GROUND_Y - 140 },
    { x: BEAT * 54, y: GROUND_Y - 80 },
  ],
  powerUps: [
    { type: 'shield', x: BEAT * 5, y: GROUND_Y - 60 },
    { type: 'slowmo', x: BEAT * 20, y: GROUND_Y - 60 },
    { type: 'shield', x: BEAT * 35, y: GROUND_Y - 60 },
    { type: 'magnet', x: BEAT * 50, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-6): Safe zone, first wall =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },
    // First wall - slide down it!
    { x: BEAT * 5, y: GROUND_Y - 150, width: 30, height: 150, type: 'wall' },
    { x: BEAT * 6.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 1 (Beats 8-16): Learn wall jumping =====
    // Wall jump sequence
    { x: BEAT * 9, y: GROUND_Y - 120, width: 30, height: 120, type: 'wall' },
    { x: BEAT * 10.5, y: GROUND_Y - 150, width: 30, height: 150, type: 'wall' },
    { x: BEAT * 8.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 12, y: GROUND_Y - 60, width: 100, height: 20, type: 'solid' },
    // Another wall climb
    { x: BEAT * 14, y: GROUND_Y - 180, width: 30, height: 180, type: 'wall' },
    { x: BEAT * 13.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 15.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 2 (Beats 17-24): Wall corridors =====
    // Walls on both sides - navigate through
    { x: BEAT * 17.5, y: GROUND_Y - 100, width: 30, height: 100, type: 'wall' },
    { x: BEAT * 19.5, y: GROUND_Y - 120, width: 30, height: 120, type: 'wall' },
    { x: BEAT * 17, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 19, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 21, y: GROUND_Y - 80, width: 30, height: 80, type: 'wall' },
    { x: BEAT * 20.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 23, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 3 (Beats 25-32): Vertical climb =====
    // Ascending wall jumps
    { x: BEAT * 25.5, y: GROUND_Y - 180, width: 30, height: 180, type: 'wall' },
    { x: BEAT * 27, y: GROUND_Y - 200, width: 30, height: 200, type: 'wall' },
    { x: BEAT * 25, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 29, y: GROUND_Y - 150, width: 100, height: 20, type: 'solid' },
    // Continue climbing
    { x: BEAT * 30.5, y: GROUND_Y - 220, width: 30, height: 150, type: 'wall' },
    { x: BEAT * 32, y: GROUND_Y - 180, width: 30, height: 130, type: 'wall' },
    { x: BEAT * 30, y: GROUND_Y, width: BEAT * 3.5, height: 20, type: 'lava' },
    { x: BEAT * 33.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 4 (Beats 34-44): Mixed wall + bounce =====
    { x: BEAT * 35, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 36.5, y: GROUND_Y - 180, width: 30, height: 150, type: 'wall' },
    { x: BEAT * 34.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 38, y: GROUND_Y - 100, width: 100, height: 20, type: 'solid' },
    // Wall and crumble
    { x: BEAT * 40, y: GROUND_Y - 150, width: 30, height: 150, type: 'wall' },
    { x: BEAT * 41.5, y: GROUND_Y - 60, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 39.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 43.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 5 (Beats 45-54): Final parkour =====
    // Intense wall jumping finale
    { x: BEAT * 45.5, y: GROUND_Y - 100, width: 30, height: 100, type: 'wall' },
    { x: BEAT * 47, y: GROUND_Y - 130, width: 30, height: 130, type: 'wall' },
    { x: BEAT * 48.5, y: GROUND_Y - 160, width: 30, height: 160, type: 'wall' },
    { x: BEAT * 45, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    { x: BEAT * 50, y: GROUND_Y - 80, width: 100, height: 20, type: 'solid' },
    // Final walls
    { x: BEAT * 52, y: GROUND_Y - 140, width: 30, height: 140, type: 'wall' },
    { x: BEAT * 53.5, y: GROUND_Y - 100, width: 30, height: 100, type: 'wall' },
    { x: BEAT * 51.5, y: GROUND_Y, width: BEAT * 3.5, height: 20, type: 'lava' },

    // ===== FINALE: Victory =====
    { x: BEAT * 55, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 55.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 57, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 57.5, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level14 extends Level {
  constructor() {
    super(level14Config);
  }
}
