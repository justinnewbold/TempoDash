import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 2: "Neon Dreams" - 140 BPM
// Beat interval: 150px (350 px/s ÷ 140 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// Design: Introduces moving platforms, tighter timing

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 150; // pixels per beat at 140 BPM

const level2Config: LevelConfig = {
  id: 2,
  name: 'Neon Dreams',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 40, y: GROUND_Y - 80, width: 60, height: 80 }, // 40 beats = 6000px
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
    // ===== INTRO (Beats 0-4): Safe zone =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 1 (Beats 4-8): Single spike pattern =====
    { x: BEAT * 4.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 7, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 7.5, y: GROUND_Y, width: BEAT * 0.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 2 (Beats 8-12): Double jump section =====
    // Gap requires well-timed jump
    { x: BEAT * 8.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 9, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    // Longer gap - may need double jump
    { x: BEAT * 10.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 11, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 3 (Beats 12-16): MOVING PLATFORMS - Level 2 unique! =====
    // Moving platform 1 - player arrives at beat 12
    {
      x: BEAT * 12, y: GROUND_Y - 60, width: 120, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 25, speed: 2, startOffset: 0 }
    },
    { x: BEAT * 12, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // Moving platform 2
    {
      x: BEAT * 13.5, y: GROUND_Y - 60, width: 120, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 25, speed: 2, startOffset: 1.5 }
    },
    { x: BEAT * 13.5, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // Moving platform 3
    {
      x: BEAT * 15, y: GROUND_Y - 60, width: 120, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 25, speed: 2, startOffset: 3 }
    },
    { x: BEAT * 15, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // ===== PHRASE 4 (Beats 16-20): Recovery and bounce =====
    { x: BEAT * 16.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // Bounce pad launches player
    { x: BEAT * 18.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 20, y: GROUND_Y - 100, width: BEAT * 1, height: 20, type: 'solid' },

    // ===== PHRASE 5 (Beats 20-24): Descent with spikes =====
    { x: BEAT * 21.5, y: GROUND_Y - 60, width: BEAT * 1, height: 20, type: 'solid' },
    { x: BEAT * 23, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 6 (Beats 24-28): Triple spike gauntlet =====
    { x: BEAT * 24.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 25, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 26, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 26.5, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 27.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 28, y: GROUND_Y, width: BEAT * 0.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 7 (Beats 28-32): More moving platforms =====
    {
      x: BEAT * 29, y: GROUND_Y - 50, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 20, speed: 2.5, startOffset: 0 }
    },
    { x: BEAT * 29, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    {
      x: BEAT * 30.5, y: GROUND_Y - 50, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 20, speed: 2.5, startOffset: 1.5 }
    },
    { x: BEAT * 30.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    // ===== PHRASE 8 (Beats 32-36): Bounce chain =====
    { x: BEAT * 32, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 33.5, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 35, y: GROUND_Y - 80, width: 70, height: 20, type: 'bounce' },

    // ===== PHRASE 9 (Beats 36-40): Final approach =====
    { x: BEAT * 36.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 38, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 38.5, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    // Final platform to goal
    { x: BEAT * 39.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level2 extends Level {
  constructor() {
    super(level2Config);
  }
}
