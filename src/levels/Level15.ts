import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 15: "Ultimate Challenge" - 170 BPM (FASTEST + LONGEST)
// STRATEGY: EVERYTHING - The ultimate test combining all mechanics!
// Features: All platform types, all hazards, intense difficulty
// Theme: Final boss level - neon chaos dimension

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 370; // pixels per beat at 170 BPM (2x length)

const level15Config: LevelConfig = {
  id: 15,
  name: 'Ultimate Challenge',
  bpm: 170,
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 80, y: GROUND_Y - 80, width: 60, height: 80 }, // 80 beats - LONGEST!
  checkpoints: [
    { x: BEAT * 20, y: GROUND_Y - 50, name: 'Phase One' },
    { x: BEAT * 40, y: GROUND_Y - 50, name: 'Phase Two' },
    { x: BEAT * 60, y: GROUND_Y - 50, name: 'Final Phase' },
  ],
  // Enable chase mode for extra pressure!
  chaseMode: {
    enabled: true,
    initialDelay: 5000,
    baseSpeed: 0.85,
    accelerationRate: 0.0001,
  },
  background: {
    type: 'neon',
    primaryColor: '#0a0000',
    secondaryColor: '#1a0505',
    accentColor: '#ff0066',
    particles: {
      count: 120,
      color: 'rgba(255, 0, 102, 0.6)',
      minSize: 1,
      maxSize: 6,
      speed: 100,
      direction: 'up',
    },
    effects: ['grid', 'pulse', 'scanlines'],
  },
  coins: [
    { x: BEAT * 4, y: GROUND_Y - 80 },
    { x: BEAT * 10, y: GROUND_Y - 100 },
    { x: BEAT * 16, y: GROUND_Y - 120 },
    { x: BEAT * 22, y: GROUND_Y - 80 },
    { x: BEAT * 28, y: GROUND_Y - 140 },
    { x: BEAT * 34, y: GROUND_Y - 100 },
    { x: BEAT * 40, y: GROUND_Y - 120 },
    { x: BEAT * 46, y: GROUND_Y - 80 },
    { x: BEAT * 52, y: GROUND_Y - 160 },
    { x: BEAT * 58, y: GROUND_Y - 100 },
    { x: BEAT * 64, y: GROUND_Y - 140 },
    { x: BEAT * 70, y: GROUND_Y - 80 },
    { x: BEAT * 76, y: GROUND_Y - 120 },
  ],
  powerUps: [
    // Strategic power-ups for survival
    { type: 'shield', x: BEAT * 2, y: GROUND_Y - 60 },
    { type: 'slowmo', x: BEAT * 12, y: GROUND_Y - 60 },
    { type: 'shield', x: BEAT * 24, y: GROUND_Y - 60 },
    { type: 'magnet', x: BEAT * 36, y: GROUND_Y - 60 },
    { type: 'slowmo', x: BEAT * 48, y: GROUND_Y - 60 },
    { type: 'shield', x: BEAT * 60, y: GROUND_Y - 60 },
    { type: 'doublePoints', x: BEAT * 72, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Brief calm before the storm =====
    { x: 0, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHASE 1 (Beats 3-20): Spike & Platform Gauntlet =====
    { x: BEAT * 3.5, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 4, y: GROUND_Y, width: BEAT * 0.6, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 4.8, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 5.2, y: GROUND_Y, width: BEAT * 0.6, height: GROUND_HEIGHT, type: 'solid' },
    // Phase platforms
    { x: BEAT * 6.5, y: GROUND_Y - 50, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 6, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    { x: BEAT * 8, y: GROUND_Y - 70, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 7.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    // Moving platform
    {
      x: BEAT * 10, y: GROUND_Y - 50, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 40, speed: 3, startOffset: 0 }
    },
    { x: BEAT * 9.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 12, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    // Crumble chain
    { x: BEAT * 13.5, y: GROUND_Y - 40, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 15, y: GROUND_Y - 60, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 16.5, y: GROUND_Y - 40, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 13, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    { x: BEAT * 18, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHASE 2 (Beats 20-40): Ice & Conveyor Madness =====
    { x: BEAT * 20, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'ice' },
    { x: BEAT * 22.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 23, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'conveyor', conveyorSpeed: 1.5 },
    { x: BEAT * 25.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 26, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    // Bounce to high platform
    { x: BEAT * 27.5, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 29, y: GROUND_Y - 120, width: 100, height: 20, type: 'ice' },
    { x: BEAT * 27, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    // Glass stepping stones
    { x: BEAT * 31.5, y: GROUND_Y - 60, width: 80, height: 20, type: 'glass' },
    { x: BEAT * 33, y: GROUND_Y - 80, width: 80, height: 20, type: 'glass' },
    { x: BEAT * 31, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 35, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    // Gravity flip section
    { x: BEAT * 36.5, y: GROUND_Y, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 37.5, y: 100, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 39, y: 100, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 40, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHASE 3 (Beats 40-60): Wall & Vertical Challenge =====
    // Wall climbing section
    { x: BEAT * 42, y: GROUND_Y - 150, width: 30, height: 150, type: 'wall' },
    { x: BEAT * 43.5, y: GROUND_Y - 180, width: 30, height: 180, type: 'wall' },
    { x: BEAT * 41.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 45, y: GROUND_Y - 100, width: 100, height: 20, type: 'solid' },
    // Moving + phase combo
    {
      x: BEAT * 47, y: GROUND_Y - 60, width: 80, height: 20, type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 2.5, startOffset: 0 }
    },
    { x: BEAT * 46.5, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },
    { x: BEAT * 49.5, y: GROUND_Y - 80, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 51, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    // Conveyor + crumble
    { x: BEAT * 52.5, y: GROUND_Y - 40, width: 100, height: 20, type: 'conveyor', conveyorSpeed: -1 },
    { x: BEAT * 54, y: GROUND_Y - 60, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 52, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 56, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 57.5, y: GROUND_Y - 140, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 55.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 59.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== FINAL PHASE (Beats 60-76): EVERYTHING =====
    // Rapid spike sequence
    { x: BEAT * 61.5, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 62, y: GROUND_Y, width: 60, height: GROUND_HEIGHT, type: 'crumble' },
    { x: BEAT * 63, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 63.5, y: GROUND_Y, width: 60, height: GROUND_HEIGHT, type: 'crumble' },
    // Phase over lava
    { x: BEAT * 65, y: GROUND_Y - 60, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 64.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    // Ice slide with spikes
    { x: BEAT * 67, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'ice' },
    { x: BEAT * 68, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 69.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    // Wall jump finale
    { x: BEAT * 71, y: GROUND_Y - 120, width: 30, height: 120, type: 'wall' },
    { x: BEAT * 72.5, y: GROUND_Y - 150, width: 30, height: 150, type: 'wall' },
    { x: BEAT * 70.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 74, y: GROUND_Y - 80, width: 100, height: 20, type: 'crumble' },
    // Final bounce to victory
    { x: BEAT * 76, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 75.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },

    // ===== VICTORY: You made it! =====
    { x: BEAT * 78, y: GROUND_Y, width: BEAT * 5, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level15 extends Level {
  constructor() {
    super(level15Config);
  }
}
