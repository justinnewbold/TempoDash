import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 7: "The Gauntlet" - 160 BPM (FASTEST)
// Beat interval: 131px (350 px/s ÷ 160 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// STRATEGY: PURE CHAOS - Everything at once, no mercy
// Combines ALL mechanics: moving, phase, ice, crumble, lava, bounce
// The ultimate test - only the best will survive

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 131; // pixels per beat at 160 BPM - FAST!

const level7Config: LevelConfig = {
  id: 7,
  name: 'The Gauntlet',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 64, y: GROUND_Y - 80, width: 60, height: 80 }, // 64 beats - LONGEST LEVEL
  background: {
    type: 'neon',
    primaryColor: '#0a0000',
    secondaryColor: '#1a0505',
    accentColor: '#ff0000',
    particles: {
      count: 100,
      color: 'rgba(255, 50, 50, 0.5)',
      minSize: 1,
      maxSize: 6,
      speed: 80,
      direction: 'up',
    },
    effects: ['grid', 'pulse', 'scanlines'],
  },
  coins: [
    // Coins everywhere - high risk, high reward
    { x: BEAT * 5, y: GROUND_Y - 100 },
    { x: BEAT * 9, y: GROUND_Y - 80 },
    { x: BEAT * 14, y: GROUND_Y - 120 },
    { x: BEAT * 19, y: GROUND_Y - 60 },
    { x: BEAT * 24, y: GROUND_Y - 140 },
    { x: BEAT * 29, y: GROUND_Y - 80 },
    { x: BEAT * 34, y: GROUND_Y - 100 },
    { x: BEAT * 39, y: GROUND_Y - 70 },
    { x: BEAT * 44, y: GROUND_Y - 130 },
    { x: BEAT * 49, y: GROUND_Y - 90 },
    { x: BEAT * 54, y: GROUND_Y - 110 },
    { x: BEAT * 59, y: GROUND_Y - 80 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-2): Minimal safe zone - chaos begins immediately =====
    { x: 0, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 1 (Beats 2-8): SPIKE STORM - rapid fire spikes =====
    { x: BEAT * 2.5, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 3, y: GROUND_Y, width: BEAT * 0.6, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 3.8, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 4.2, y: GROUND_Y, width: BEAT * 0.6, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 5, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 5.4, y: GROUND_Y, width: BEAT * 0.6, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 6.2, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    { x: BEAT * 6.8, y: GROUND_Y, width: BEAT * 1.2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 2 (Beats 8-14): MOVING MAYHEM - fast moving platforms =====
    {
      x: BEAT * 8.5, y: GROUND_Y - 50, width: 80, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 50, speed: 3, startOffset: 0 }
    },
    { x: BEAT * 8.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    {
      x: BEAT * 10, y: GROUND_Y - 50, width: 80, height: 20, type: 'moving',
      movePattern: { type: 'horizontal', distance: 60, speed: 3.5, startOffset: 0.5 }
    },
    { x: BEAT * 9.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    {
      x: BEAT * 12, y: GROUND_Y - 60, width: 80, height: 20, type: 'moving',
      movePattern: { type: 'circular', distance: 40, speed: 2.5, startOffset: 0 }
    },
    { x: BEAT * 11.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    // Brief landing
    { x: BEAT * 13.5, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 3 (Beats 14-20): PHASE FRENZY - rapid phase platforms =====
    { x: BEAT * 14.5, y: GROUND_Y - 50, width: 70, height: 20, type: 'phase' },
    { x: BEAT * 14.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    { x: BEAT * 16, y: GROUND_Y - 70, width: 70, height: 20, type: 'phase' },
    { x: BEAT * 17.5, y: GROUND_Y - 50, width: 70, height: 20, type: 'phase' },
    { x: BEAT * 15.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    // Bounce out of phase section
    { x: BEAT * 19, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },

    // ===== SECTION 4 (Beats 20-26): ICE + CRUMBLE COMBO - slippery death =====
    { x: BEAT * 21, y: GROUND_Y - 80, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 22.5, y: GROUND_Y - 50, width: BEAT * 1.5, height: 20, type: 'ice' },
    { x: BEAT * 24, y: GROUND_Y - 30, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 20.5, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    { x: BEAT * 25.5, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'ice' },

    // ===== SECTION 5 (Beats 26-32): BOUNCE HELL - precision bouncing =====
    { x: BEAT * 26.5, y: GROUND_Y, width: 60, height: 20, type: 'bounce' },
    { x: BEAT * 28, y: GROUND_Y - 60, width: 60, height: 20, type: 'bounce' },
    { x: BEAT * 29.5, y: GROUND_Y - 120, width: 60, height: 20, type: 'bounce' },
    { x: BEAT * 26, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    // Land on moving platform!
    {
      x: BEAT * 31, y: GROUND_Y - 80, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 40, speed: 2, startOffset: 0 }
    },

    // ===== SECTION 6 (Beats 32-38): THE MIXER - everything at once! =====
    // Moving platform over lava
    { x: BEAT * 32.5, y: GROUND_Y, width: BEAT * 6, height: 20, type: 'lava' },
    {
      x: BEAT * 33.5, y: GROUND_Y - 40, width: 70, height: 20, type: 'moving',
      movePattern: { type: 'horizontal', distance: 50, speed: 2.5, startOffset: 0 }
    },
    // Phase platform mid-air
    { x: BEAT * 35.5, y: GROUND_Y - 70, width: 80, height: 20, type: 'phase' },
    // Crumble after phase
    { x: BEAT * 37, y: GROUND_Y - 40, width: 80, height: 20, type: 'crumble' },
    // Ice landing
    { x: BEAT * 38.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'ice' },

    // ===== SECTION 7 (Beats 39-46): VERTICAL NIGHTMARE - extreme height =====
    // Ascending crumble staircase
    { x: BEAT * 40, y: GROUND_Y - 30, width: 70, height: 20, type: 'crumble' },
    { x: BEAT * 41, y: GROUND_Y - 60, width: 70, height: 20, type: 'crumble' },
    { x: BEAT * 42, y: GROUND_Y - 90, width: 70, height: 20, type: 'crumble' },
    { x: BEAT * 43, y: GROUND_Y - 120, width: 70, height: 20, type: 'crumble' },
    { x: BEAT * 44, y: GROUND_Y - 150, width: 70, height: 20, type: 'phase' },
    { x: BEAT * 39.5, y: GROUND_Y, width: BEAT * 6, height: 20, type: 'lava' },
    // High bounce to escape
    { x: BEAT * 45, y: GROUND_Y - 120, width: 60, height: 20, type: 'bounce' },
    // Drop down through chaos
    { x: BEAT * 46, y: GROUND_Y - 80, width: 80, height: 20, type: 'crumble' },

    // ===== SECTION 8 (Beats 47-54): SPEED GAUNTLET - pure reaction =====
    { x: BEAT * 47.5, y: GROUND_Y, width: BEAT * 0.5, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 48.2, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 48.6, y: GROUND_Y, width: 70, height: GROUND_HEIGHT, type: 'crumble' },
    { x: BEAT * 49.5, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 50, y: GROUND_Y, width: 70, height: GROUND_HEIGHT, type: 'crumble' },
    { x: BEAT * 51, y: GROUND_Y, width: 25, height: 30, type: 'spike' },
    { x: BEAT * 51.5, y: GROUND_Y, width: 70, height: GROUND_HEIGHT, type: 'crumble' },
    { x: BEAT * 52.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    { x: BEAT * 53, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 9 (Beats 54-60): FINAL CHAOS - maximum difficulty =====
    // Phase + Moving combo
    {
      x: BEAT * 54.5, y: GROUND_Y - 50, width: 80, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 40, speed: 3, startOffset: 0 }
    },
    { x: BEAT * 54, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 56.5, y: GROUND_Y - 80, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 56, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    // Ice slide over lava
    { x: BEAT * 58.5, y: GROUND_Y - 30, width: BEAT * 2, height: 20, type: 'ice' },
    { x: BEAT * 58, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },
    // Final crumble jump
    { x: BEAT * 61, y: GROUND_Y - 50, width: 80, height: 20, type: 'crumble' },

    // ===== FINALE (Beats 61-64): THE LAST STAND =====
    { x: BEAT * 62, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 62.5, y: GROUND_Y, width: BEAT * 0.6, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 63.3, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    // VICTORY - solid ground at last
    { x: BEAT * 64, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level7 extends Level {
  constructor() {
    super(level7Config);
  }
}
