import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 5: "Volcanic Descent" - 145 BPM
// Beat interval: 145px (350 px/s ÷ 145 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// Design: Dangerous lava pits, bounce pads over lava, intense heat

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 145; // pixels per beat at 145 BPM

const level5Config: LevelConfig = {
  id: 5,
  name: 'Volcanic Descent',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 44, y: GROUND_Y - 80, width: 60, height: 80 }, // 44 beats
  background: {
    type: 'volcano',
    primaryColor: '#1a0a00',
    secondaryColor: '#2d1200',
    accentColor: '#ff4400',
    particles: {
      count: 60,
      color: 'rgba(255, 100, 0',
      minSize: 2,
      maxSize: 5,
      speed: 50,
      direction: 'up',
    },
    effects: ['embers', 'pulse'],
  },
  coins: [
    // Coin above first lava pit
    { x: BEAT * 5, y: GROUND_Y - 100 },
    // Coin on elevated platform
    { x: BEAT * 14, y: GROUND_Y - 140 },
    // Risky coin above lava river
    { x: BEAT * 22, y: GROUND_Y - 60 },
    // Coin at top of staircase
    { x: BEAT * 30, y: GROUND_Y - 180 },
    // Final coin before goal
    { x: BEAT * 40, y: GROUND_Y - 100 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Safe starting zone =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 1 (Beats 4-8): First lava pit =====
    // Small lava pit - jump over
    { x: BEAT * 4, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 6, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 2 (Beats 8-12): Spikes and lava combo =====
    { x: BEAT * 8.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 9, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    // Lava + elevated platform
    { x: BEAT * 10.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 11.5, y: GROUND_Y - 60, width: BEAT * 1.5, height: 20, type: 'solid' },

    // ===== PHRASE 3 (Beats 12-16): Bounce over lava =====
    { x: BEAT * 13, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 14, y: GROUND_Y - 100, width: BEAT * 1.5, height: 20, type: 'solid' },
    { x: BEAT * 14, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    // Land on this platform
    { x: BEAT * 15.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 4 (Beats 16-20): Lava river with stepping stones =====
    // Continuous lava with platforms above
    { x: BEAT * 16.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 17, y: GROUND_Y - 50, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 18, y: GROUND_Y - 50, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 19, y: GROUND_Y - 50, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 20, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 5 (Beats 20-24): Double jump challenge over lava =====
    // Large lava gap requiring double jump
    { x: BEAT * 21, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },
    { x: BEAT * 24, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 6 (Beats 24-28): Spike and lava gauntlet =====
    { x: BEAT * 25, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 25.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 26.5, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'lava' },
    { x: BEAT * 28, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 7 (Beats 28-32): Volcanic staircase =====
    { x: BEAT * 29, y: GROUND_Y - 40, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 29, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    { x: BEAT * 29.8, y: GROUND_Y - 80, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 30.6, y: GROUND_Y - 120, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 31.4, y: GROUND_Y - 160, width: BEAT * 0.8, height: 20, type: 'solid' },
    // Drop down to safe platform
    { x: BEAT * 32.5, y: GROUND_Y - 80, width: BEAT * 1.5, height: 20, type: 'solid' },

    // ===== PHRASE 8 (Beats 32-36): Lava bounce combo =====
    { x: BEAT * 34, y: GROUND_Y, width: BEAT * 1, height: 20, type: 'lava' },
    { x: BEAT * 34.5, y: GROUND_Y - 40, width: 60, height: 20, type: 'bounce' },
    { x: BEAT * 36, y: GROUND_Y - 100, width: BEAT * 1.5, height: 20, type: 'solid' },
    { x: BEAT * 36, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'lava' },

    // ===== PHRASE 9 (Beats 36-40): Triple jump finale =====
    { x: BEAT * 37.5, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    // Lava with multiple platforms
    { x: BEAT * 38.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 39, y: GROUND_Y - 50, width: BEAT * 0.6, height: 20, type: 'solid' },
    { x: BEAT * 39.8, y: GROUND_Y - 50, width: BEAT * 0.6, height: 20, type: 'solid' },
    { x: BEAT * 40.6, y: GROUND_Y - 50, width: BEAT * 0.6, height: 20, type: 'solid' },
    { x: BEAT * 41.4, y: GROUND_Y - 50, width: BEAT * 0.6, height: 20, type: 'solid' },

    // ===== PHRASE 10 (Beats 40-44): Final run to goal =====
    { x: BEAT * 42.5, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 43.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    // Final platform to goal
    { x: BEAT * 44, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level5 extends Level {
  constructor() {
    super(level5Config);
  }
}
