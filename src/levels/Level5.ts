import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 5: "Volcanic Descent" - 145 BPM
// Beat interval: 145px (350 px/s ÷ 145 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// STRATEGY: Risk vs Reward - choose between safe path or coin-rich danger
// Safe route: Easier but fewer coins
// Danger route: More coins but requires precise jumping over lava
// Each section offers a CHOICE

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 145; // pixels per beat at 145 BPM

const level5Config: LevelConfig = {
  id: 5,
  name: 'Volcanic Descent',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 44, y: GROUND_Y - 80, width: 60, height: 80 },
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
    // RISKY COINS - positioned over lava or on dangerous paths
    // Section 1: Two coins above lava pit (risky jump timing)
    { x: BEAT * 5, y: GROUND_Y - 80 },
    { x: BEAT * 5.5, y: GROUND_Y - 100 },
    // Section 2: Coin on high risky platform over lava
    { x: BEAT * 13, y: GROUND_Y - 140 },
    // Section 3: Stepping stone coins
    { x: BEAT * 18, y: GROUND_Y - 70 },
    { x: BEAT * 19, y: GROUND_Y - 70 },
    { x: BEAT * 20, y: GROUND_Y - 70 },
    // Section 4: Lava river coins (extremely risky)
    { x: BEAT * 27, y: GROUND_Y - 50 },
    { x: BEAT * 28, y: GROUND_Y - 50 },
    // Section 5: Bounce chain high reward
    { x: BEAT * 35, y: GROUND_Y - 150 },
    // Final coin right before goal
    { x: BEAT * 42, y: GROUND_Y - 80 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Safe volcano entrance =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 1 (Beats 4-8): FIRST CHOICE - lava pit =====
    // SAFE: Jump the gap normally
    // RISKY: Longer hang time to grab coins above lava
    { x: BEAT * 4, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },
    // Small stepping stone (optional for coins)
    { x: BEAT * 5.5, y: GROUND_Y - 50, width: 60, height: 15, type: 'solid' },
    // Landing zone
    { x: BEAT * 7, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 2 (Beats 9-14): HIGH ROAD vs LOW ROAD =====
    // LOW (safe): Ground path with spikes
    { x: BEAT * 9.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 10, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 12.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 13, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    // HIGH (risky): Bounce to high platform for coin, risk falling into lava
    { x: BEAT * 9.5, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 11.5, y: GROUND_Y - 120, width: BEAT * 2, height: 20, type: 'solid' },
    // Lava under high route
    { x: BEAT * 11.5, y: GROUND_Y, width: BEAT * 1, height: 20, type: 'lava' },

    // ===== SECTION 3 (Beats 14.5-22): LAVA RIVER - stepping stones =====
    // Long lava section with small platforms
    { x: BEAT * 15, y: GROUND_Y, width: BEAT * 8, height: 20, type: 'lava' },
    // SAFE PATH: Lower, larger platforms
    { x: BEAT * 15.5, y: GROUND_Y - 40, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 17.5, y: GROUND_Y - 40, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 19.5, y: GROUND_Y - 40, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 21.5, y: GROUND_Y - 40, width: 100, height: 20, type: 'solid' },
    // RISKY PATH: Tiny platforms with coins (higher up)
    { x: BEAT * 16.5, y: GROUND_Y - 90, width: 50, height: 15, type: 'solid' },
    { x: BEAT * 18.5, y: GROUND_Y - 90, width: 50, height: 15, type: 'solid' },
    { x: BEAT * 20.5, y: GROUND_Y - 90, width: 50, height: 15, type: 'solid' },
    // Exit the lava river
    { x: BEAT * 23, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 4 (Beats 24.5-30): THE VOLCANO CORE =====
    // Intense lava gauntlet - all about jumping
    { x: BEAT * 25, y: GROUND_Y, width: BEAT * 6, height: 20, type: 'lava' },
    // Bounce pads above lava!
    { x: BEAT * 25.5, y: GROUND_Y - 30, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 27.5, y: GROUND_Y - 30, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 29.5, y: GROUND_Y - 30, width: 70, height: 20, type: 'bounce' },
    // Exit platform
    { x: BEAT * 31, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 5 (Beats 32.5-38): ERUPTION ESCAPE - vertical climb =====
    // Rising lava! (represented by lava below)
    { x: BEAT * 33, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    // Volcanic staircase upward
    { x: BEAT * 33, y: GROUND_Y - 40, width: 80, height: 20, type: 'solid' },
    { x: BEAT * 34, y: GROUND_Y - 80, width: 80, height: 20, type: 'solid' },
    // RISKY: Bounce for high coin
    { x: BEAT * 34.5, y: GROUND_Y - 80, width: 60, height: 20, type: 'bounce' },
    { x: BEAT * 35, y: GROUND_Y - 120, width: 80, height: 20, type: 'solid' },
    // Continue ascent
    { x: BEAT * 36, y: GROUND_Y - 100, width: 80, height: 20, type: 'solid' },
    { x: BEAT * 37, y: GROUND_Y - 60, width: 80, height: 20, type: 'solid' },

    // ===== SECTION 6 (Beats 38-44): FINAL DESCENT TO SAFETY =====
    // Drop down with lava hazards
    { x: BEAT * 38, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 38.5, y: GROUND_Y - 30, width: 80, height: 20, type: 'solid' },
    // Final approach
    { x: BEAT * 40, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 41.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 42, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    // Final platform to goal
    { x: BEAT * 43, y: GROUND_Y, width: BEAT * 2.5, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level5 extends Level {
  constructor() {
    super(level5Config);
  }
}
