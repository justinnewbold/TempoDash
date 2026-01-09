import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 11: "Conveyor Chaos" - 148 BPM
// STRATEGY: Master the conveyor belts - they push you forward or backward!
// Features: Heavy use of conveyor belts combined with ice and bounce
// Theme: Industrial factory with conveyor belt madness

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 426; // pixels per beat at 148 BPM (2x length)

const level11Config: LevelConfig = {
  id: 11,
  name: 'Conveyor Chaos',
  bpm: 148,
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 52, y: GROUND_Y - 80, width: 60, height: 80 },
  checkpoints: [
    { x: BEAT * 13, y: GROUND_Y - 50, name: 'Factory Floor' },
    { x: BEAT * 26, y: GROUND_Y - 50, name: 'Speed Lines' },
    { x: BEAT * 39, y: GROUND_Y - 50, name: 'Final Assembly' },
  ],
  background: {
    type: 'city',
    primaryColor: '#1a1a2e',
    secondaryColor: '#16213e',
    accentColor: '#ff7b00',
    particles: {
      count: 50,
      color: 'rgba(255, 123, 0, 0.4)',
      minSize: 1,
      maxSize: 4,
      speed: 40,
      direction: 'up',
    },
    effects: ['grid', 'pulse'],
  },
  coins: [
    { x: BEAT * 6, y: GROUND_Y - 80 },
    { x: BEAT * 10, y: GROUND_Y - 60 },
    { x: BEAT * 16, y: GROUND_Y - 100 },
    { x: BEAT * 22, y: GROUND_Y - 70 },
    { x: BEAT * 28, y: GROUND_Y - 90 },
    { x: BEAT * 34, y: GROUND_Y - 80 },
    { x: BEAT * 40, y: GROUND_Y - 100 },
    { x: BEAT * 46, y: GROUND_Y - 60 },
  ],
  powerUps: [
    { type: 'shield', x: BEAT * 4, y: GROUND_Y - 60 },
    { type: 'slowmo', x: BEAT * 18, y: GROUND_Y - 60 },
    { type: 'magnet', x: BEAT * 32, y: GROUND_Y - 60 },
    { type: 'doublePoints', x: BEAT * 44, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Safe zone to learn conveyor basics =====
    { x: 0, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
    // First conveyor - pushes forward (helpful)
    { x: BEAT * 2.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'conveyor', conveyorSpeed: 1 },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 1 (Beats 6-13): Learn reverse conveyors =====
    // Reverse conveyor - pushes backward!
    { x: BEAT * 7, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'conveyor', conveyorSpeed: -1 },
    { x: BEAT * 6.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 9.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    // Forward conveyor over lava
    { x: BEAT * 11.5, y: GROUND_Y - 30, width: BEAT * 2, height: 20, type: 'conveyor', conveyorSpeed: 1.5 },
    { x: BEAT * 11, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },

    // ===== SECTION 2 (Beats 14-20): Conveyor staircase =====
    { x: BEAT * 14, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 15.5, y: GROUND_Y - 40, width: 120, height: 20, type: 'conveyor', conveyorSpeed: 0.8 },
    { x: BEAT * 17, y: GROUND_Y - 80, width: 120, height: 20, type: 'conveyor', conveyorSpeed: -0.8 },
    { x: BEAT * 18.5, y: GROUND_Y - 120, width: 120, height: 20, type: 'conveyor', conveyorSpeed: 0.8 },
    { x: BEAT * 15, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    { x: BEAT * 20, y: GROUND_Y - 60, width: BEAT * 1, height: 20, type: 'solid' },

    // ===== SECTION 3 (Beats 21-27): Conveyor + bounce combo =====
    { x: BEAT * 21.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 23, y: GROUND_Y - 100, width: 150, height: 20, type: 'conveyor', conveyorSpeed: -1.2 },
    { x: BEAT * 21, y: GROUND_Y, width: BEAT * 3.5, height: 20, type: 'lava' },
    { x: BEAT * 25, y: GROUND_Y - 50, width: BEAT * 2, height: 20, type: 'conveyor', conveyorSpeed: 1 },
    { x: BEAT * 24.5, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },
    { x: BEAT * 27.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 4 (Beats 28-34): Speed lines - fast conveyors =====
    { x: BEAT * 29, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'conveyor', conveyorSpeed: 2 },
    { x: BEAT * 31.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 32, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'conveyor', conveyorSpeed: -1.5 },
    { x: BEAT * 34.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 35, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 5 (Beats 36-42): Conveyor + ice combo =====
    { x: BEAT * 37, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'ice' },
    { x: BEAT * 39, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'conveyor', conveyorSpeed: 1.5 },
    { x: BEAT * 38.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 41.5, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'ice' },
    { x: BEAT * 43.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 6 (Beats 43-48): Final assembly =====
    { x: BEAT * 45, y: GROUND_Y - 40, width: 100, height: 20, type: 'conveyor', conveyorSpeed: 1 },
    { x: BEAT * 44.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 47, y: GROUND_Y - 80, width: 100, height: 20, type: 'conveyor', conveyorSpeed: -0.5 },
    { x: BEAT * 46.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 49, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 48.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },

    // ===== FINALE: Victory platform =====
    { x: BEAT * 51, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level11 extends Level {
  constructor() {
    super(level11Config);
  }
}
