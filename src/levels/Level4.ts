import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 4: "Frozen Peak" - 138 BPM
// Beat interval: 152px (350 px/s ÷ 138 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// Design: Ice platforms with slippery momentum, cold atmosphere

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 152; // pixels per beat at 138 BPM

const level4Config: LevelConfig = {
  id: 4,
  name: 'Frozen Peak',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 40, y: GROUND_Y - 80, width: 60, height: 80 }, // 40 beats = ~6080px
  background: {
    type: 'space',
    primaryColor: '#0a1628',
    secondaryColor: '#1a2a4a',
    accentColor: '#88ddff',
    particles: {
      count: 80,
      color: 'rgba(200, 230, 255',
      minSize: 1,
      maxSize: 4,
      speed: 40,
      direction: 'down',
    },
    effects: ['stars', 'aurora'],
  },
  platforms: [
    // ===== INTRO (Beats 0-4): Safe starting zone on ice =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'ice' },

    // ===== PHRASE 1 (Beats 4-8): First spike - get used to ice =====
    { x: BEAT * 4.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'ice' },

    // ===== PHRASE 2 (Beats 8-12): Ice platform hopping =====
    { x: BEAT * 8.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 9, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'ice' },
    // Elevated ice platform (extended to connect better)
    { x: BEAT * 10.5, y: GROUND_Y - 50, width: BEAT * 2, height: 20, type: 'ice' },
    { x: BEAT * 10.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    // ===== PHRASE 3 (Beats 12-16): Mixed ice and solid =====
    { x: BEAT * 12.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 14, y: GROUND_Y, width: 50, height: 30, type: 'spike' },
    { x: BEAT * 15, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'ice' },

    // ===== PHRASE 4 (Beats 16-20): Bounce into ice platforms =====
    { x: BEAT * 16, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 17.5, y: GROUND_Y - 60, width: BEAT * 2.5, height: 20, type: 'ice' },
    // Drop down to ice (connected to avoid death gap)
    { x: BEAT * 20, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'ice' },

    // ===== PHRASE 5 (Beats 20-24): Spike gauntlet on ice =====
    { x: BEAT * 21, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 21.5, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'ice' },
    { x: BEAT * 22.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 23, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'ice' },
    { x: BEAT * 24, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 24.5, y: GROUND_Y, width: BEAT * 0.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 6 (Beats 24-28): Ice staircase =====
    { x: BEAT * 25.5, y: GROUND_Y - 40, width: BEAT * 0.8, height: 20, type: 'ice' },
    { x: BEAT * 26.5, y: GROUND_Y - 80, width: BEAT * 0.8, height: 20, type: 'ice' },
    { x: BEAT * 27.5, y: GROUND_Y - 120, width: BEAT * 0.8, height: 20, type: 'ice' },
    // Drop down with spikes below
    { x: BEAT * 28.5, y: GROUND_Y - 60, width: BEAT * 1, height: 20, type: 'ice' },
    { x: BEAT * 28.5, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // ===== PHRASE 7 (Beats 28-32): Lava hazards in ice world =====
    { x: BEAT * 30, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'ice' },
    { x: BEAT * 31.5, y: GROUND_Y, width: BEAT * 0.8, height: 20, type: 'lava' },
    { x: BEAT * 32.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'ice' },

    // ===== PHRASE 8 (Beats 32-36): Bounce to finale =====
    { x: BEAT * 33.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    // Land on elevated platform
    { x: BEAT * 35, y: GROUND_Y - 80, width: BEAT * 2, height: 20, type: 'ice' },

    // ===== PHRASE 9 (Beats 36-40): Final descent to goal =====
    { x: BEAT * 37.5, y: GROUND_Y - 40, width: BEAT * 1.5, height: 20, type: 'ice' },
    { x: BEAT * 37.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    // Final platform to goal
    { x: BEAT * 39, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'ice' },
  ],
};

export class Level4 extends Level {
  constructor() {
    super(level4Config);
  }
}
