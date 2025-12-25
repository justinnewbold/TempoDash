import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 4: "Frozen Peak" - 138 BPM
// Beat interval: 152px (350 px/s ÷ 138 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// STRATEGY: Momentum Control - ice physics and crumbling platforms
// Ice platforms = slippery, maintain momentum
// Crumble platforms = 500ms before collapse, must move fast!
// Combo: Land on crumble while on ice = quick reactions needed

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 456; // pixels per beat at 138 BPM (2x length)

const level4Config: LevelConfig = {
  id: 4,
  name: 'Frozen Peak',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 40, y: GROUND_Y - 80, width: 60, height: 80 },
  background: {
    type: 'space',
    primaryColor: '#0a1628',
    secondaryColor: '#1a2a4a',
    accentColor: '#88ddff',
    particles: {
      count: 80,
      color: 'rgba(200, 230, 255, 0.5)',
      minSize: 1,
      maxSize: 4,
      speed: 40,
      direction: 'down',
    },
    effects: ['stars', 'aurora'],
  },
  coins: [
    // Coins on dangerous crumble platforms
    { x: BEAT * 10, y: GROUND_Y - 80 },    // On first crumble
    { x: BEAT * 18, y: GROUND_Y - 60 },    // Ice slide coin
    { x: BEAT * 24, y: GROUND_Y - 100 },   // High crumble chain
    { x: BEAT * 30, y: GROUND_Y - 80 },    // Ice staircase coin
    { x: BEAT * 36, y: GROUND_Y - 120 },   // Final challenge coin
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Learn ice feel =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'ice' },

    // ===== PHRASE 1 (Beats 4-8): Ice basics with single spike =====
    { x: BEAT * 4.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'ice' },

    // ===== PHRASE 2 (Beats 8-12): FIRST CRUMBLE - learn the mechanic =====
    // Crumble platforms collapse 500ms after landing!
    { x: BEAT * 8.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 9, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    // First crumble - step on and GO!
    { x: BEAT * 10.5, y: GROUND_Y - 50, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 10.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    // Land here before it crumbles
    { x: BEAT * 12, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 3 (Beats 13.5-17): LONG ICE SLIDE - momentum challenge =====
    // Extended ice slide with spikes - maintain momentum but be ready to jump!
    { x: BEAT * 13.5, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'ice' },
    { x: BEAT * 15, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 17, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    // Continue sliding
    { x: BEAT * 17.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'ice' },

    // ===== PHRASE 4 (Beats 19.5-24): ICE + CRUMBLE COMBO =====
    // Slide onto crumble platform - must keep moving!
    { x: BEAT * 20, y: GROUND_Y - 40, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 19.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    // Jump to next crumble
    { x: BEAT * 21.5, y: GROUND_Y - 40, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 21.5, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'lava' },
    // Another crumble
    { x: BEAT * 23, y: GROUND_Y - 40, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 23, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'lava' },
    // Safety!
    { x: BEAT * 24.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 5 (Beats 26-30): ICE STAIRCASE - slippery ascent =====
    // Each step is ice - careful not to slide off!
    { x: BEAT * 26.5, y: GROUND_Y - 30, width: BEAT * 0.8, height: 20, type: 'ice' },
    { x: BEAT * 27.5, y: GROUND_Y - 60, width: BEAT * 0.8, height: 20, type: 'ice' },
    { x: BEAT * 28.5, y: GROUND_Y - 90, width: BEAT * 0.8, height: 20, type: 'ice' },
    { x: BEAT * 29.5, y: GROUND_Y - 120, width: BEAT * 0.8, height: 20, type: 'ice' },
    { x: BEAT * 26, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },

    // Peak reached - solid ground
    { x: BEAT * 31, y: GROUND_Y - 100, width: BEAT * 1.5, height: 20, type: 'solid' },

    // ===== PHRASE 6 (Beats 32.5-36): CRUMBLE DESCENT =====
    // Descend on crumbling platforms - no time to rest!
    { x: BEAT * 33, y: GROUND_Y - 70, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 34, y: GROUND_Y - 40, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 35, y: GROUND_Y - 80, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 32.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },

    // ===== PHRASE 7 (Beats 36.5-40): FINAL CHALLENGE - ice and crumble =====
    // Bounce up
    { x: BEAT * 36.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    // Land on high crumble
    { x: BEAT * 38, y: GROUND_Y - 100, width: 120, height: 20, type: 'crumble' },
    // Jump to ice slide finish
    { x: BEAT * 39.5, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'ice' },
  ],
};

export class Level4 extends Level {
  constructor() {
    super(level4Config);
  }
}
