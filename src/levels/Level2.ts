import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 2: "Neon Dreams" - 140 BPM
// Beat interval: 150px (350 px/s ÷ 140 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// STRATEGY: Moving Platform Mastery - learn to time jumps with dynamic platforms
// Features: Vertical, horizontal, and circular moving platforms
// Coins are placed ON moving platforms for extra challenge

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 450; // pixels per beat at 140 BPM (2x length)

const level2Config: LevelConfig = {
  id: 2,
  name: 'Neon Dreams',
  bpm: 140,
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 40, y: GROUND_Y - 80, width: 60, height: 80 },
  checkpoints: [
    { x: BEAT * 10, y: GROUND_Y - 50, name: 'Vertical Movers' },
    { x: BEAT * 20, y: GROUND_Y - 50, name: 'Horizontal Movers' },
    { x: BEAT * 30, y: GROUND_Y - 50, name: 'Synchronized Pair' },
  ],
  background: {
    type: 'neon',
    primaryColor: '#0d0221',
    secondaryColor: '#1a0533',
    accentColor: '#ff00ff',
    particles: {
      count: 40,
      color: 'rgba(255, 0, 255, 0.5)',
      minSize: 1,
      maxSize: 4,
      speed: 40,
      direction: 'up',
    },
    effects: ['grid', 'scanlines', 'pulse'],
  },
  coins: [
    // Coins on moving platforms - risky but rewarding
    { x: BEAT * 12.3, y: GROUND_Y - 80 },  // On first vertical mover
    { x: BEAT * 17, y: GROUND_Y - 50 },     // On horizontal mover
    { x: BEAT * 21, y: GROUND_Y - 100 },    // On circular mover
    { x: BEAT * 29, y: GROUND_Y - 70 },     // On elevator
    { x: BEAT * 34.5, y: GROUND_Y - 90 },   // On synchronized pair
  ],
  powerUps: [
    // Shield before the lava section with horizontal movers
    { type: 'shield', x: BEAT * 14, y: GROUND_Y - 60 },
    // Magnet for the coin-rich circular mover section
    { type: 'magnet', x: BEAT * 20, y: GROUND_Y - 60 },
    // Slowmo before the synchronized pair - timing is crucial
    { type: 'slowmo', x: BEAT * 32, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Safe zone to observe first moving platform =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 1 (Beats 4-8): Single spike, then first moving platform ahead =====
    { x: BEAT * 4.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 2.5, height: GROUND_HEIGHT, type: 'solid' },
    // Brief gap - landing zone
    { x: BEAT * 8, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 2 (Beats 9.5-14): VERTICAL MOVERS - Wave pattern =====
    // Three vertically moving platforms with staggered timing
    {
      x: BEAT * 10, y: GROUND_Y - 50, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 40, speed: 2, startOffset: 0 }
    },
    { x: BEAT * 10, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    {
      x: BEAT * 11.5, y: GROUND_Y - 50, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 40, speed: 2, startOffset: 1 }
    },
    { x: BEAT * 11.5, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    {
      x: BEAT * 13, y: GROUND_Y - 50, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 40, speed: 2, startOffset: 2 }
    },
    { x: BEAT * 13, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // Recovery platform
    { x: BEAT * 14.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 3 (Beats 16-20): HORIZONTAL MOVERS - Catch the ride =====
    // Horizontal platform moves toward player
    {
      x: BEAT * 16.5, y: GROUND_Y - 40, width: 120, height: 20, type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2.5, startOffset: 0 }
    },
    { x: BEAT * 16, y: GROUND_Y, width: BEAT * 2.5, height: 20, type: 'lava' },

    // Second horizontal mover going opposite direction
    {
      x: BEAT * 19, y: GROUND_Y - 40, width: 120, height: 20, type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2.5, startOffset: 1.5 }
    },
    { x: BEAT * 18.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },

    // Landing zone
    { x: BEAT * 20.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 4 (Beats 22-26): CIRCULAR MOVER - The spinner =====
    {
      x: BEAT * 22.5, y: GROUND_Y - 60, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'circular', distance: 40, speed: 1.5, startOffset: 0 }
    },
    { x: BEAT * 22, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },

    // Jump to second circular platform
    {
      x: BEAT * 24.5, y: GROUND_Y - 60, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'circular', distance: 40, speed: 1.5, startOffset: 1.5 }
    },
    { x: BEAT * 24, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },

    // Recovery
    { x: BEAT * 26.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 5 (Beats 28-32): ELEVATOR SECTION - Ride up, jump off =====
    // Slow elevator going up
    {
      x: BEAT * 28.5, y: GROUND_Y - 30, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 80, speed: 1.5, startOffset: 0 }
    },
    { x: BEAT * 28.5, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // Jump to high platform
    { x: BEAT * 30.5, y: GROUND_Y - 100, width: BEAT * 1.5, height: 20, type: 'solid' },

    // Drop down with bounce
    { x: BEAT * 32.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },

    // ===== PHRASE 6 (Beats 33-37): SYNCHRONIZED PAIR - Two movers in sync =====
    // Two platforms moving in opposite vertical directions
    {
      x: BEAT * 34, y: GROUND_Y - 40, width: 90, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 50, speed: 2, startOffset: 0 }
    },
    {
      x: BEAT * 35.5, y: GROUND_Y - 90, width: 90, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 50, speed: 2, startOffset: 1.75 }
    },
    { x: BEAT * 33.5, y: GROUND_Y, width: BEAT * 3.5, height: 20, type: 'lava' },

    // ===== PHRASE 7 (Beats 37-40): Final approach =====
    { x: BEAT * 37.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 39, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    // Final platform to goal
    { x: BEAT * 39.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level2 extends Level {
  constructor() {
    super(level2Config);
  }
}
