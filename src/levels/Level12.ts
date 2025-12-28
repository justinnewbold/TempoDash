import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 12: "Gravity Shift" - 130 BPM
// Beat interval: 400px
// STRATEGY: Gravity constantly flips - player must time jumps carefully
// Jump to trigger gravity flip, navigate ceiling and floor
// Theme: Anti-gravity laboratory with frequent gravity changes

const GROUND_Y = GAME_HEIGHT - 40;
const CEILING_Y = 40;
const CENTER_Y = GAME_HEIGHT / 2;
const BEAT = 400; // pixels per beat at 130 BPM

const level12Config: LevelConfig = {
  id: 12,
  name: 'Gravity Shift',
  bpm: 130,
  gravityFlipMode: true,  // Enable gravity flip mode
  playerStart: { x: 100, y: GROUND_Y - 60 },
  goal: { x: BEAT * 36, y: CENTER_Y - 40, width: 80, height: 100 },
  checkpoints: [
    { x: BEAT * 9, y: GROUND_Y - 60, name: 'First Flip' },
    { x: BEAT * 18, y: CEILING_Y + 60, name: 'Midway' },
    { x: BEAT * 27, y: GROUND_Y - 60, name: 'Final Section' },
  ],
  background: {
    type: 'grid',
    primaryColor: '#0a0a1a',      // Dark lab background
    secondaryColor: '#1a1a3a',    // Slightly lighter
    accentColor: '#ff00ff',       // Magenta accents (used for grid lines)
    particles: {
      count: 30,
      color: 'rgba(255, 0, 255, 0.4)',
      minSize: 2,
      maxSize: 6,
      speed: 40,
      direction: 'up',  // Will change with gravity
    },
    effects: ['pulse', 'grid'],
  },
  coins: [
    // Section 1: Floor run
    { x: BEAT * 2, y: GROUND_Y - 80 },
    { x: BEAT * 3, y: GROUND_Y - 100 },
    { x: BEAT * 4, y: GROUND_Y - 120 },

    // Section 2: After first flip (on ceiling)
    { x: BEAT * 6, y: CEILING_Y + 80 },
    { x: BEAT * 7, y: CEILING_Y + 100 },
    { x: BEAT * 8, y: CEILING_Y + 80 },

    // Section 3: Alternating
    { x: BEAT * 10, y: GROUND_Y - 100 },
    { x: BEAT * 11, y: CEILING_Y + 100 },
    { x: BEAT * 12, y: GROUND_Y - 80 },
    { x: BEAT * 13, y: CEILING_Y + 80 },

    // Section 4: Center path
    { x: BEAT * 16, y: CENTER_Y - 20 },
    { x: BEAT * 17, y: CENTER_Y + 20 },
    { x: BEAT * 18, y: CENTER_Y },

    // Section 5: Rapid switching
    { x: BEAT * 21, y: GROUND_Y - 60 },
    { x: BEAT * 22, y: CEILING_Y + 60 },
    { x: BEAT * 23, y: GROUND_Y - 60 },
    { x: BEAT * 24, y: CEILING_Y + 60 },

    // Section 6: Final stretch
    { x: BEAT * 28, y: CENTER_Y - 40 },
    { x: BEAT * 30, y: CENTER_Y + 40 },
    { x: BEAT * 32, y: CENTER_Y },
    { x: BEAT * 34, y: CENTER_Y - 30 },
  ],
  powerUps: [
    { type: 'shield', x: BEAT * 9, y: GROUND_Y - 100 },
    { type: 'slowmo', x: BEAT * 18, y: CENTER_Y },
    { type: 'shield', x: BEAT * 27, y: CEILING_Y + 100 },
  ],
  platforms: [
    // ===== SECTION 1 (Beats 0-5): Intro on ground =====
    // Starting floor
    { x: 0, y: GROUND_Y, width: BEAT * 5, height: 40, type: 'solid' },

    // Ceiling (will be floor when gravity flips)
    { x: 0, y: 0, width: BEAT * 5, height: 40, type: 'solid' },

    // ===== SECTION 2 (Beats 5-9): First gravity flip zone =====
    // Gravity platform triggers the flip
    { x: BEAT * 5, y: GROUND_Y - 20, width: 100, height: 40, type: 'gravity' },

    // Now on ceiling
    { x: BEAT * 5.5, y: 0, width: BEAT * 4, height: 40, type: 'solid' },

    // Small platform below for orientation
    { x: BEAT * 6.5, y: GROUND_Y, width: 80, height: 40, type: 'solid' },

    // ===== SECTION 3 (Beats 9-14): Alternating gravity =====
    // Gravity flip back to floor
    { x: BEAT * 9, y: CEILING_Y + 20, width: 80, height: 40, type: 'gravity' },

    // Floor section
    { x: BEAT * 9.5, y: GROUND_Y, width: 200, height: 40, type: 'solid' },

    // Quick flip to ceiling
    { x: BEAT * 11, y: GROUND_Y - 20, width: 80, height: 40, type: 'gravity' },
    { x: BEAT * 11.5, y: 0, width: 200, height: 40, type: 'solid' },

    // Back to floor
    { x: BEAT * 13, y: CEILING_Y + 20, width: 80, height: 40, type: 'gravity' },
    { x: BEAT * 13.5, y: GROUND_Y, width: 200, height: 40, type: 'solid' },

    // ===== SECTION 4 (Beats 14-18): Center platforms =====
    // Flip to ceiling
    { x: BEAT * 14.5, y: GROUND_Y - 20, width: 80, height: 40, type: 'gravity' },

    // Ceiling run
    { x: BEAT * 15, y: 0, width: BEAT * 2, height: 40, type: 'solid' },

    // Spikes on ceiling to avoid
    { x: BEAT * 16, y: CEILING_Y, width: 60, height: 40, type: 'spike' },

    // Gravity flip to center platform approach
    { x: BEAT * 17, y: CEILING_Y + 20, width: 80, height: 40, type: 'gravity' },

    // Center floating platforms
    { x: BEAT * 17.5, y: CENTER_Y - 20, width: 120, height: 40, type: 'solid' },
    { x: BEAT * 18.5, y: CENTER_Y + 40, width: 100, height: 40, type: 'solid' },

    // ===== SECTION 5 (Beats 18-24): Rapid switching =====
    // Need to keep flipping between floor and ceiling
    { x: BEAT * 19, y: CENTER_Y + 80, width: 80, height: 40, type: 'gravity' },
    { x: BEAT * 19.5, y: GROUND_Y, width: 150, height: 40, type: 'solid' },

    // Floor spike
    { x: BEAT * 20.5, y: GROUND_Y - 40, width: 50, height: 40, type: 'spike' },

    // Quick flip
    { x: BEAT * 21, y: GROUND_Y - 20, width: 80, height: 40, type: 'gravity' },
    { x: BEAT * 21.5, y: 0, width: 150, height: 40, type: 'solid' },

    // Ceiling spike
    { x: BEAT * 22.5, y: CEILING_Y, width: 50, height: 40, type: 'spike' },

    // Flip again
    { x: BEAT * 23, y: CEILING_Y + 20, width: 80, height: 40, type: 'gravity' },
    { x: BEAT * 23.5, y: GROUND_Y, width: 150, height: 40, type: 'solid' },

    // More spikes
    { x: BEAT * 24.5, y: GROUND_Y - 40, width: 50, height: 40, type: 'spike' },

    // ===== SECTION 6 (Beats 24-30): Mixed platform challenge =====
    { x: BEAT * 25, y: GROUND_Y - 20, width: 80, height: 40, type: 'gravity' },
    { x: BEAT * 25.5, y: 0, width: 200, height: 40, type: 'solid' },

    // Moving spike on ceiling
    {
      x: BEAT * 26.5, y: CEILING_Y, width: 50, height: 50, type: 'spike',
      movePattern: { type: 'horizontal', distance: 100, speed: 80 },
    },

    // Flip to floor
    { x: BEAT * 27.5, y: CEILING_Y + 20, width: 80, height: 40, type: 'gravity' },
    { x: BEAT * 28, y: GROUND_Y, width: 200, height: 40, type: 'solid' },

    // Bounce for extra height/distance
    { x: BEAT * 29, y: GROUND_Y - 20, width: 80, height: 20, type: 'bounce' },

    // Flip midair
    { x: BEAT * 29.5, y: CENTER_Y, width: 80, height: 40, type: 'gravity' },
    { x: BEAT * 30, y: 0, width: 150, height: 40, type: 'solid' },

    // ===== SECTION 7 (Beats 30-36): Final gauntlet =====
    // Complex pattern of flips
    { x: BEAT * 31, y: CEILING_Y + 20, width: 80, height: 40, type: 'gravity' },

    // Center platform sequence
    { x: BEAT * 31.5, y: CENTER_Y + 60, width: 100, height: 40, type: 'solid' },
    { x: BEAT * 32.5, y: CENTER_Y - 40, width: 100, height: 40, type: 'solid' },

    // Gravity at center height
    { x: BEAT * 33, y: CENTER_Y - 80, width: 80, height: 40, type: 'gravity' },
    { x: BEAT * 33.5, y: 0, width: 150, height: 40, type: 'solid' },

    // Final flip to goal
    { x: BEAT * 34.5, y: CEILING_Y + 20, width: 80, height: 40, type: 'gravity' },

    // Approach to goal
    { x: BEAT * 35, y: CENTER_Y, width: 200, height: 40, type: 'solid' },

    // Goal area floor
    { x: BEAT * 35.5, y: GROUND_Y, width: BEAT * 2, height: 40, type: 'solid' },
    { x: BEAT * 35.5, y: 0, width: BEAT * 2, height: 40, type: 'solid' },
  ],
};

export class Level12 extends Level {
  constructor() {
    super(level12Config);
  }
}
