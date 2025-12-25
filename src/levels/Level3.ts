import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 3: "Phase Shift" - 150 BPM (renamed from "Final Ascent")
// Beat interval: 140px (350 px/s ÷ 150 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// STRATEGY: Phase Platform Puzzles - patience and pattern recognition
// Phase platforms: On 2000ms, Off 1500ms, Cycle 3500ms
// Features: Synchronized phase groups, offset timing windows, "now or never" moments

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 420; // pixels per beat at 150 BPM (2x length)

const level3Config: LevelConfig = {
  id: 3,
  name: 'Phase Shift',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 48, y: GROUND_Y - 80, width: 60, height: 80 },
  background: {
    type: 'neon',
    primaryColor: '#0a0a0a',
    secondaryColor: '#1a0a1a',
    accentColor: '#00ff88',
    particles: {
      count: 60,
      color: 'rgba(0, 255, 136, 0.5)',
      minSize: 1,
      maxSize: 5,
      speed: 60,
      direction: 'up',
    },
    effects: ['grid', 'scanlines', 'pulse'],
  },
  coins: [
    // Coins require perfect phase timing to collect
    { x: BEAT * 14, y: GROUND_Y - 80 },   // On alternating phase platform
    { x: BEAT * 22, y: GROUND_Y - 100 },  // During synchronized section
    { x: BEAT * 32, y: GROUND_Y - 80 },   // Between phase windows
    { x: BEAT * 40, y: GROUND_Y - 60 },   // On staircase phase
    { x: BEAT * 45, y: GROUND_Y - 100 },  // Final gauntlet coin
  ],
  powerUps: [
    // Shield before the first lava section - teaches players about power-ups
    { type: 'shield', x: BEAT * 11, y: GROUND_Y - 80 },
    // Double points before the synchronized phase section (coin-rich area)
    { type: 'doublePoints', x: BEAT * 17, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Safe zone, observe phase behavior =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 1 (Beats 4-8): Learn phase timing with safe fallback =====
    // First phase platform with solid platform below as safety net
    { x: BEAT * 5, y: GROUND_Y - 60, width: 120, height: 20, type: 'phase' },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    // Gap to next platform
    { x: BEAT * 7, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 2 (Beats 8-12): Two phase platforms - timing matters =====
    { x: BEAT * 9, y: GROUND_Y - 50, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 9, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    // Second phase with slight offset (player arrives when solid)
    { x: BEAT * 11, y: GROUND_Y - 50, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 11, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    // ===== PHRASE 3 (Beats 12-16): ALTERNATING PHASES - opposite timing =====
    // These two phase at different times - pick the right one!
    { x: BEAT * 13, y: GROUND_Y - 80, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 14.5, y: GROUND_Y - 40, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 12.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },

    // Recovery
    { x: BEAT * 16.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 4 (Beats 18-22): SYNCHRONIZED GROUP - all phase together =====
    // Three platforms that phase in/out at the same time
    // Player must cross all three in one "window"
    { x: BEAT * 18.5, y: GROUND_Y - 60, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 20, y: GROUND_Y - 60, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 21.5, y: GROUND_Y - 60, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 18, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },

    // Recovery
    { x: BEAT * 23, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 5 (Beats 24-28): Bounce into phase =====
    { x: BEAT * 24.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    // Must time bounce to land when phase is solid
    { x: BEAT * 26.5, y: GROUND_Y - 100, width: 120, height: 20, type: 'phase' },
    { x: BEAT * 26, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    // Drop to safety
    { x: BEAT * 28.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 6 (Beats 30-34): PHASE STAIRCASE - ascending phases =====
    // Each step is a phase platform at different heights
    { x: BEAT * 30.5, y: GROUND_Y - 30, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 31.5, y: GROUND_Y - 60, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 32.5, y: GROUND_Y - 90, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 33.5, y: GROUND_Y - 120, width: 80, height: 20, type: 'phase' },
    { x: BEAT * 30, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },

    // High solid platform - made it!
    { x: BEAT * 35, y: GROUND_Y - 100, width: BEAT * 1.5, height: 20, type: 'solid' },

    // ===== PHRASE 7 (Beats 36-40): Descent with phase platforms =====
    { x: BEAT * 37, y: GROUND_Y - 60, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 38.5, y: GROUND_Y - 30, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 36.5, y: GROUND_Y, width: BEAT * 3.5, height: 20, type: 'lava' },

    // Landing zone
    { x: BEAT * 40, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 8 (Beats 42-46): FINAL GAUNTLET - mixed phase and moving =====
    // Phase platform that also moves!
    {
      x: BEAT * 42, y: GROUND_Y - 50, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 30, speed: 2, startOffset: 0 }
    },
    { x: BEAT * 42, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // Final phase challenge
    { x: BEAT * 44, y: GROUND_Y - 60, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 44, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // Sprint to goal
    { x: BEAT * 46, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level3 extends Level {
  constructor() {
    super(level3Config);
  }
}
