import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 12: "Frost Fortress" - 132 BPM
// STRATEGY: Master ice and glass platforms in a frozen kingdom
// Features: Heavy ice mechanics, glass platforms that break, crumble for precision
// Theme: Frozen castle with icy hazards

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 477; // pixels per beat at 132 BPM (2x length)

const level12Config: LevelConfig = {
  id: 12,
  name: 'Frost Fortress',
  bpm: 132,
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 48, y: GROUND_Y - 80, width: 60, height: 80 },
  checkpoints: [
    { x: BEAT * 12, y: GROUND_Y - 50, name: 'Glass Gallery' },
    { x: BEAT * 24, y: GROUND_Y - 50, name: 'Ice Bridge' },
    { x: BEAT * 36, y: GROUND_Y - 50, name: 'Frozen Throne' },
  ],
  background: {
    type: 'space',
    primaryColor: '#0a1628',
    secondaryColor: '#1a2a4a',
    accentColor: '#88ddff',
    particles: {
      count: 100,
      color: 'rgba(200, 230, 255, 0.6)',
      minSize: 1,
      maxSize: 4,
      speed: 30,
      direction: 'down',
    },
    effects: ['stars', 'aurora'],
  },
  coins: [
    { x: BEAT * 5, y: GROUND_Y - 80 },
    { x: BEAT * 10, y: GROUND_Y - 100 },
    { x: BEAT * 16, y: GROUND_Y - 70 },
    { x: BEAT * 22, y: GROUND_Y - 90 },
    { x: BEAT * 28, y: GROUND_Y - 80 },
    { x: BEAT * 34, y: GROUND_Y - 100 },
    { x: BEAT * 40, y: GROUND_Y - 70 },
    { x: BEAT * 44, y: GROUND_Y - 90 },
  ],
  powerUps: [
    { type: 'shield', x: BEAT * 3, y: GROUND_Y - 60 },
    { type: 'slowmo', x: BEAT * 14, y: GROUND_Y - 60 },
    { type: 'shield', x: BEAT * 26, y: GROUND_Y - 60 },
    { type: 'magnet', x: BEAT * 38, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Learn the ice =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'ice' },

    // ===== SECTION 1 (Beats 4-12): Glass gallery - learn glass platforms =====
    { x: BEAT * 4.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    // Glass platform - breaks on second landing!
    { x: BEAT * 7, y: GROUND_Y - 50, width: 120, height: 20, type: 'glass' },
    { x: BEAT * 6.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 9, y: GROUND_Y - 30, width: 120, height: 20, type: 'glass' },
    { x: BEAT * 8.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 11, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'ice' },

    // ===== SECTION 2 (Beats 12-20): Ice slide with glass jumps =====
    { x: BEAT * 13, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'ice' },
    { x: BEAT * 16.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    // Glass stepping stones
    { x: BEAT * 17.5, y: GROUND_Y - 40, width: 80, height: 20, type: 'glass' },
    { x: BEAT * 17, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'lava' },
    { x: BEAT * 19, y: GROUND_Y - 60, width: 80, height: 20, type: 'glass' },
    { x: BEAT * 18.5, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'lava' },
    { x: BEAT * 20.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 3 (Beats 21-28): Ice bridge gauntlet =====
    // Long ice bridge with spikes - momentum control!
    { x: BEAT * 22, y: GROUND_Y, width: BEAT * 6, height: 20, type: 'ice' },
    { x: BEAT * 23.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 25, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 26.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 28.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 4 (Beats 29-36): Crumble + ice combo =====
    { x: BEAT * 30, y: GROUND_Y - 40, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 29.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 32, y: GROUND_Y - 60, width: BEAT * 2, height: 20, type: 'ice' },
    { x: BEAT * 31.5, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },
    { x: BEAT * 34.5, y: GROUND_Y - 30, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 34, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 36.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'ice' },

    // ===== SECTION 5 (Beats 37-44): Frozen throne approach =====
    // Glass staircase with ice landings
    { x: BEAT * 38, y: GROUND_Y - 40, width: 80, height: 20, type: 'glass' },
    { x: BEAT * 39, y: GROUND_Y - 80, width: BEAT * 1, height: 20, type: 'ice' },
    { x: BEAT * 40.5, y: GROUND_Y - 120, width: 80, height: 20, type: 'glass' },
    { x: BEAT * 37.5, y: GROUND_Y, width: BEAT * 4.5, height: 20, type: 'lava' },
    // Drop down to ice
    { x: BEAT * 42, y: GROUND_Y - 60, width: BEAT * 1.5, height: 20, type: 'ice' },
    { x: BEAT * 44, y: GROUND_Y - 30, width: 80, height: 20, type: 'glass' },
    { x: BEAT * 42, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },

    // ===== FINALE: Frozen throne =====
    { x: BEAT * 45.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 46, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'ice' },
  ],
};

export class Level12 extends Level {
  constructor() {
    super(level12Config);
  }
}
