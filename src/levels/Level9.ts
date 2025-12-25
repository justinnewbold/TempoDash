import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 9: "The Chase" - 160 BPM (Fast-paced)
// Beat interval: 197px (350 px/s ÷ 160 BPM × 60 × 1.5)
// STRATEGY: Escape the wall of death - no stopping allowed!
// Features: Chase mode (wall of death), fast platforming, few obstacles
// Theme: Pure speed and survival - the wall is always coming!

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 394; // pixels per beat at 160 BPM (2x length)

const level9Config: LevelConfig = {
  id: 9,
  name: 'The Chase',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 64, y: GROUND_Y - 50, width: 80, height: 100 }, // Long level - survive to the end!
  background: {
    type: 'inferno',
    primaryColor: '#1a0505',
    secondaryColor: '#2d0a0a',
    accentColor: '#ff4400',
    particles: {
      count: 80,
      color: 'rgba(255, 100, 0, 0.6)',
      minSize: 2,
      maxSize: 6,
      speed: 50,
      direction: 'up',
    },
    effects: ['embers', 'pulse'],
  },
  // Enable chase mode - the wall of death!
  chaseMode: {
    enabled: true,
    initialDelay: 3000,    // 3 seconds before wall starts
    baseSpeed: 0.9,        // Slightly slower than player
    accelerationRate: 0.00008, // Slowly catches up
  },
  coins: [
    // Coins are placed to encourage forward momentum
    { x: BEAT * 2, y: GROUND_Y - 80 },
    { x: BEAT * 4, y: GROUND_Y - 60 },
    { x: BEAT * 6, y: GROUND_Y - 100 },
    { x: BEAT * 8, y: GROUND_Y - 60 },
    { x: BEAT * 10, y: GROUND_Y - 80 },
    { x: BEAT * 12, y: GROUND_Y - 100 },
    { x: BEAT * 15, y: GROUND_Y - 60 },
    { x: BEAT * 18, y: GROUND_Y - 80 },
    { x: BEAT * 21, y: GROUND_Y - 100 },
    { x: BEAT * 24, y: GROUND_Y - 60 },
    { x: BEAT * 27, y: GROUND_Y - 80 },
    { x: BEAT * 30, y: GROUND_Y - 120 },
    { x: BEAT * 33, y: GROUND_Y - 60 },
    { x: BEAT * 36, y: GROUND_Y - 100 },
    { x: BEAT * 39, y: GROUND_Y - 80 },
    { x: BEAT * 42, y: GROUND_Y - 60 },
    { x: BEAT * 45, y: GROUND_Y - 100 },
    { x: BEAT * 48, y: GROUND_Y - 80 },
    { x: BEAT * 51, y: GROUND_Y - 120 },
    { x: BEAT * 54, y: GROUND_Y - 60 },
    { x: BEAT * 57, y: GROUND_Y - 100 },
    { x: BEAT * 60, y: GROUND_Y - 80 },
  ],
  powerUps: [
    // Shield to survive mistakes
    { type: 'shield', x: BEAT * 8, y: GROUND_Y - 60 },
    // Slowmo for tricky sections
    { type: 'slowmo', x: BEAT * 20, y: GROUND_Y - 60 },
    // Shield again for mid-section
    { type: 'shield', x: BEAT * 32, y: GROUND_Y - 60 },
    // Slowmo for the finale
    { type: 'slowmo', x: BEAT * 50, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-6): Get Running! =====
    { x: 0, y: GROUND_Y, width: BEAT * 5, height: GROUND_HEIGHT, type: 'solid' },
    // First small gap
    { x: BEAT * 5.5, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 1 (Beats 8-16): Fast Gaps =====
    { x: BEAT * 9, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 11.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 14, y: GROUND_Y, width: BEAT * 2.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 2 (Beats 16-24): Stepping Stones =====
    { x: BEAT * 17, y: GROUND_Y - 30, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 18.5, y: GROUND_Y, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 20, y: GROUND_Y - 40, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 21.5, y: GROUND_Y, width: BEAT * 2.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 3 (Beats 24-32): Bounce Forward =====
    { x: BEAT * 24.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 26, y: GROUND_Y - 60, width: 140, height: 20, type: 'solid' },
    { x: BEAT * 28, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 29.5, y: GROUND_Y - 80, width: 140, height: 20, type: 'solid' },
    { x: BEAT * 31.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 4 (Beats 32-40): Danger Zone =====
    { x: BEAT * 34, y: GROUND_Y - 50, width: 150, height: 20, type: 'solid' },
    { x: BEAT * 33.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 36, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 38.5, y: GROUND_Y - 40, width: 130, height: 20, type: 'solid' },
    { x: BEAT * 38, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'lava' },
    { x: BEAT * 40, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 5 (Beats 40-48): Moving Escape =====
    {
      x: BEAT * 42.5, y: GROUND_Y - 30, width: 120, height: 20, type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 3, startOffset: 0 }
    },
    { x: BEAT * 42, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 44.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 47, y: GROUND_Y - 50, width: 140, height: 20, type: 'solid' },
    { x: BEAT * 46.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },

    // ===== SECTION 6 (Beats 48-56): Crumble Run =====
    { x: BEAT * 49, y: GROUND_Y, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 50.5, y: GROUND_Y, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 52, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 54.5, y: GROUND_Y - 40, width: 140, height: 20, type: 'solid' },
    { x: BEAT * 54, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 56.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== FINALE (Beats 56-64): Sprint to Safety =====
    { x: BEAT * 59, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 60.5, y: GROUND_Y - 80, width: 160, height: 20, type: 'solid' },
    { x: BEAT * 58.5, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },
    // Final safe zone - you made it!
    { x: BEAT * 62.5, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level9 extends Level {
  constructor() {
    super(level9Config);
  }
}
