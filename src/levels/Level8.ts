import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 8: "Sky Temple" - 142 BPM
// Beat interval: 222px (350 px/s ÷ 142 BPM × 60 × 1.5)
// STRATEGY: Vertical Mastery - ascend the floating temple
// Features: Heavy use of bounce pads, floating platforms, and vertical navigation
// Theme: Serene but challenging - precision over chaos

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 222; // pixels per beat at 142 BPM (1.5x for longer levels)

const level8Config: LevelConfig = {
  id: 8,
  name: 'Sky Temple',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 56, y: GROUND_Y - 160, width: 60, height: 80 }, // Goal is elevated - reach the temple peak
  background: {
    type: 'space',
    primaryColor: '#1a0a2e',
    secondaryColor: '#16213e',
    accentColor: '#e94560',
    particles: {
      count: 60,
      color: 'rgba(255, 215, 0, 0.4)',
      minSize: 2,
      maxSize: 5,
      speed: 20,
      direction: 'up',
    },
    effects: ['stars', 'pulse'],
  },
  coins: [
    // Coins guide the vertical paths
    { x: BEAT * 4, y: GROUND_Y - 100 },
    { x: BEAT * 8, y: GROUND_Y - 140 },
    { x: BEAT * 12, y: GROUND_Y - 80 },
    { x: BEAT * 16, y: GROUND_Y - 160 },
    { x: BEAT * 20, y: GROUND_Y - 120 },
    { x: BEAT * 24, y: GROUND_Y - 100 },
    { x: BEAT * 28, y: GROUND_Y - 180 },
    { x: BEAT * 32, y: GROUND_Y - 140 },
    { x: BEAT * 36, y: GROUND_Y - 100 },
    { x: BEAT * 40, y: GROUND_Y - 160 },
    { x: BEAT * 44, y: GROUND_Y - 120 },
    { x: BEAT * 48, y: GROUND_Y - 180 },
    { x: BEAT * 52, y: GROUND_Y - 140 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Temple entrance =====
    { x: 0, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },
    // First bounce - learn the vertical theme
    { x: BEAT * 3, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },

    // ===== SECTION 1 (Beats 4-10): Rising Steps =====
    { x: BEAT * 4.5, y: GROUND_Y - 60, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 6, y: GROUND_Y - 100, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 7.5, y: GROUND_Y - 140, width: 100, height: 20, type: 'solid' },
    // Drop with spike avoidance
    { x: BEAT * 9, y: GROUND_Y - 60, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 9.5, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },

    // ===== SECTION 2 (Beats 10-16): Floating Gardens =====
    { x: BEAT * 10.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    // Moving platform ascent
    {
      x: BEAT * 12, y: GROUND_Y - 80, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 60, speed: 1.5, startOffset: 0 }
    },
    { x: BEAT * 11.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    // Floating solid platforms
    { x: BEAT * 14, y: GROUND_Y - 100, width: 80, height: 20, type: 'solid' },
    { x: BEAT * 15.5, y: GROUND_Y - 60, width: 100, height: 20, type: 'solid' },

    // ===== SECTION 3 (Beats 16-22): Bounce Chain =====
    { x: BEAT * 17, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 18.5, y: GROUND_Y - 80, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 20, y: GROUND_Y - 160, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 16.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    // Descend carefully
    { x: BEAT * 21.5, y: GROUND_Y - 100, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 22.5, y: GROUND_Y - 40, width: 100, height: 20, type: 'solid' },

    // ===== SECTION 4 (Beats 22-28): Phase Temple =====
    { x: BEAT * 23.5, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    // Phase platforms rising
    { x: BEAT * 24.5, y: GROUND_Y - 50, width: 90, height: 20, type: 'phase' },
    { x: BEAT * 26, y: GROUND_Y - 90, width: 90, height: 20, type: 'phase' },
    { x: BEAT * 27.5, y: GROUND_Y - 130, width: 90, height: 20, type: 'phase' },
    { x: BEAT * 24, y: GROUND_Y, width: BEAT * 4.5, height: 20, type: 'lava' },
    // Safe landing after phase section
    { x: BEAT * 28.5, y: GROUND_Y - 80, width: 100, height: 20, type: 'solid' },

    // ===== SECTION 5 (Beats 28-34): Ice Bridge =====
    { x: BEAT * 30, y: GROUND_Y - 40, width: BEAT * 2, height: 20, type: 'ice' },
    { x: BEAT * 29.5, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },
    // Gap jump on ice
    { x: BEAT * 32.5, y: GROUND_Y - 40, width: BEAT * 1.5, height: 20, type: 'ice' },
    { x: BEAT * 32, y: GROUND_Y, width: BEAT * 2.5, height: 20, type: 'lava' },
    // Transition platform
    { x: BEAT * 34.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 6 (Beats 34-40): Vertical Maze =====
    // Ascending with moving platforms
    {
      x: BEAT * 36, y: GROUND_Y - 60, width: 80, height: 20, type: 'moving',
      movePattern: { type: 'horizontal', distance: 50, speed: 2, startOffset: 0 }
    },
    { x: BEAT * 35.5, y: GROUND_Y, width: BEAT * 3, height: 20, type: 'lava' },
    { x: BEAT * 38, y: GROUND_Y - 100, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 39.5, y: GROUND_Y - 140, width: 100, height: 20, type: 'solid' },
    // Bounce to continue
    { x: BEAT * 40.5, y: GROUND_Y - 100, width: 70, height: 20, type: 'bounce' },

    // ===== SECTION 7 (Beats 40-46): Temple Spires =====
    { x: BEAT * 42, y: GROUND_Y - 180, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 41, y: GROUND_Y, width: BEAT * 2.5, height: 20, type: 'lava' },
    // Descending crumble staircase
    { x: BEAT * 43.5, y: GROUND_Y - 140, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 44.5, y: GROUND_Y - 100, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 45.5, y: GROUND_Y - 60, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 43, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },

    // ===== SECTION 8 (Beats 46-52): Final Ascent =====
    { x: BEAT * 47, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 48.5, y: GROUND_Y - 100, width: 80, height: 20, type: 'phase' },
    {
      x: BEAT * 50, y: GROUND_Y - 140, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 40, speed: 2, startOffset: 0.5 }
    },
    { x: BEAT * 46.5, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    // High platform
    { x: BEAT * 51.5, y: GROUND_Y - 180, width: 100, height: 20, type: 'solid' },

    // ===== FINALE (Beats 52-56): Temple Peak =====
    // Last challenge - bounce to victory
    { x: BEAT * 53, y: GROUND_Y - 140, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 52.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    // Final elevated platform to goal
    { x: BEAT * 55, y: GROUND_Y - 180, width: BEAT * 3, height: 20, type: 'solid' },
  ],
};

export class Level8 extends Level {
  constructor() {
    super(level8Config);
  }
}
