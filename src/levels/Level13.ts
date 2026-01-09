import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 13: "Gravity Flip" - 155 BPM
// STRATEGY: Master gravity-flipping platforms that reverse your direction!
// Features: Heavy use of gravity platforms, sticky platforms to reorient
// Theme: Antigravity research facility gone haywire

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 406; // pixels per beat at 155 BPM (2x length)

const level13Config: LevelConfig = {
  id: 13,
  name: 'Gravity Flip',
  bpm: 155,
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 56, y: GROUND_Y - 80, width: 60, height: 80 },
  checkpoints: [
    { x: BEAT * 14, y: GROUND_Y - 50, name: 'First Flip' },
    { x: BEAT * 28, y: GROUND_Y - 50, name: 'Flip Zone' },
    { x: BEAT * 42, y: GROUND_Y - 50, name: 'Final Lab' },
  ],
  background: {
    type: 'neon',
    primaryColor: '#0d0221',
    secondaryColor: '#1a0533',
    accentColor: '#9933ff',
    particles: {
      count: 60,
      color: 'rgba(153, 51, 255, 0.5)',
      minSize: 1,
      maxSize: 5,
      speed: 50,
      direction: 'up',
    },
    effects: ['grid', 'pulse', 'scanlines'],
  },
  coins: [
    { x: BEAT * 6, y: GROUND_Y - 100 },
    { x: BEAT * 12, y: 100 }, // Upside down coin!
    { x: BEAT * 20, y: GROUND_Y - 80 },
    { x: BEAT * 26, y: 120 },
    { x: BEAT * 34, y: GROUND_Y - 90 },
    { x: BEAT * 42, y: 100 },
    { x: BEAT * 50, y: GROUND_Y - 70 },
  ],
  powerUps: [
    { type: 'shield', x: BEAT * 4, y: GROUND_Y - 60 },
    { type: 'slowmo', x: BEAT * 16, y: GROUND_Y - 60 },
    { type: 'shield', x: BEAT * 30, y: GROUND_Y - 60 },
    { type: 'doublePoints', x: BEAT * 44, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-6): Safe zone, then first gravity flip =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },
    // First gravity platform - sends you UP!
    { x: BEAT * 5, y: GROUND_Y, width: 100, height: 20, type: 'gravity' },
    // Ceiling platform to land on after flip
    { x: BEAT * 6.5, y: 60, width: BEAT * 2, height: 20, type: 'solid' },
    // Fall back down
    { x: BEAT * 9, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 1 (Beats 10-18): Learn gravity rhythm =====
    { x: BEAT * 11, y: GROUND_Y, width: 100, height: 20, type: 'gravity' },
    { x: BEAT * 12.5, y: 80, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 14, y: 80, width: 100, height: 20, type: 'gravity' },
    // Land back on ground
    { x: BEAT * 15.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 2 (Beats 18-26): Rapid flips =====
    // Quick succession of gravity flips
    { x: BEAT * 18.5, y: GROUND_Y, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 19.5, y: 100, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 21, y: 100, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 22, y: GROUND_Y, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 23.5, y: GROUND_Y, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 24.5, y: 80, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 26, y: 80, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 27, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 3 (Beats 28-36): Sticky + gravity combo =====
    // Sticky platform to pause and prepare
    { x: BEAT * 29, y: GROUND_Y - 40, width: 100, height: 20, type: 'sticky' },
    { x: BEAT * 28.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    // Jump off sticky to gravity
    { x: BEAT * 31, y: GROUND_Y, width: 100, height: 20, type: 'gravity' },
    { x: BEAT * 32.5, y: 100, width: 100, height: 20, type: 'sticky' },
    { x: BEAT * 32, y: 60, width: 40, height: 30, type: 'spike' },
    // Gravity back to normal
    { x: BEAT * 34.5, y: 100, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 35.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 4 (Beats 37-44): Gravity gauntlet =====
    // Extended gravity flip section with hazards
    { x: BEAT * 38, y: GROUND_Y, width: BEAT * 8, height: 20, type: 'lava' },
    { x: BEAT * 38.5, y: GROUND_Y - 40, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 39.5, y: 120, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 41, y: 120, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 42, y: GROUND_Y - 60, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 43.5, y: GROUND_Y - 60, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 44.5, y: 100, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 46, y: 100, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 47, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 5 (Beats 48-54): Final approach =====
    { x: BEAT * 49.5, y: GROUND_Y, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 50.5, y: 80, width: 150, height: 20, type: 'solid' },
    { x: BEAT * 52.5, y: 80, width: 80, height: 20, type: 'gravity' },
    // Land on victory
    { x: BEAT * 54, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level13 extends Level {
  constructor() {
    super(level13Config);
  }
}
