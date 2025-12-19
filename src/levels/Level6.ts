import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 6: "Abyssal Depths" - 135 BPM
// Beat interval: 156px (350 px/s ÷ 135 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// STRATEGY: Speed Run - DON'T STOP MOVING!
// Nearly all platforms are crumble - they collapse 500ms after landing
// No safe spots to rest - continuous forward momentum required
// The ultimate test: everything you learned, at max intensity

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 156; // pixels per beat at 135 BPM

const level6Config: LevelConfig = {
  id: 6,
  name: 'Abyssal Depths',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 48, y: GROUND_Y - 80, width: 60, height: 80 },
  background: {
    type: 'ocean',
    primaryColor: '#001a33',
    secondaryColor: '#002244',
    accentColor: '#00ccff',
    particles: {
      count: 40,
      color: 'rgba(150, 220, 255, 0.5)',
      minSize: 3,
      maxSize: 8,
      speed: 30,
      direction: 'up',
    },
    effects: ['bubbles', 'waves'],
  },
  coins: [
    // Coins placed mid-air - grab while jumping between crumble platforms
    { x: BEAT * 6, y: GROUND_Y - 70 },
    { x: BEAT * 12, y: GROUND_Y - 80 },
    { x: BEAT * 18, y: GROUND_Y - 90 },
    { x: BEAT * 24, y: GROUND_Y - 100 },
    { x: BEAT * 32, y: GROUND_Y - 120 },
    { x: BEAT * 38, y: GROUND_Y - 80 },
    { x: BEAT * 44, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-3): Brief safe start - observe the chaos ahead =====
    { x: 0, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 1 (Beats 3-8): CRUMBLE INTRODUCTION - learn to keep moving =====
    // First crumble platform - step on it and GO!
    { x: BEAT * 3.5, y: GROUND_Y, width: 120, height: GROUND_HEIGHT, type: 'crumble' },
    { x: BEAT * 5, y: GROUND_Y, width: 120, height: GROUND_HEIGHT, type: 'crumble' },
    { x: BEAT * 6.5, y: GROUND_Y, width: 120, height: GROUND_HEIGHT, type: 'crumble' },
    // Brief solid recovery
    { x: BEAT * 8, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SECTION 2 (Beats 9-14): ELEVATED CRUMBLE RUN =====
    // Crumble platforms getting higher
    { x: BEAT * 9.5, y: GROUND_Y - 30, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 9.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    { x: BEAT * 11, y: GROUND_Y - 50, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 11, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    { x: BEAT * 12.5, y: GROUND_Y - 70, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 14, y: GROUND_Y - 50, width: 100, height: 20, type: 'crumble' },
    // Drop down
    { x: BEAT * 15.5, y: GROUND_Y, width: 80, height: GROUND_HEIGHT, type: 'crumble' },

    // ===== SECTION 3 (Beats 16.5-22): MIXED MECHANICS GAUNTLET =====
    // Crumble + moving platform combo!
    {
      x: BEAT * 17, y: GROUND_Y - 40, width: 100, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 30, speed: 2, startOffset: 0 }
    },
    { x: BEAT * 17, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // Crumble sequence
    { x: BEAT * 18.5, y: GROUND_Y - 40, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 18.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 20, y: GROUND_Y - 40, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 21.5, y: GROUND_Y - 40, width: 80, height: 20, type: 'crumble' },
    // Bounce to escape lava
    { x: BEAT * 23, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },

    // ===== SECTION 4 (Beats 24-30): PHASE + CRUMBLE NIGHTMARE =====
    // Phase platform that you must time, followed by crumbles
    { x: BEAT * 25, y: GROUND_Y - 80, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 24.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    // Crumble chain after phase
    { x: BEAT * 27, y: GROUND_Y - 60, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 28.5, y: GROUND_Y - 40, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 30, y: GROUND_Y - 60, width: 80, height: 20, type: 'crumble' },
    { x: BEAT * 27, y: GROUND_Y, width: BEAT * 4.5, height: 20, type: 'lava' },
    // Landing after crumble chain
    { x: BEAT * 31.5, y: GROUND_Y, width: 80, height: GROUND_HEIGHT, type: 'crumble' },

    // ===== SECTION 5 (Beats 32.5-38): THE ABYSS - vertical descent =====
    // Falling through crumbling platforms!
    { x: BEAT * 33, y: GROUND_Y - 120, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 34, y: GROUND_Y - 90, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 35, y: GROUND_Y - 60, width: 100, height: 20, type: 'crumble' },
    { x: BEAT * 36, y: GROUND_Y - 30, width: 100, height: 20, type: 'crumble' },
    // Bounce at bottom to escape
    { x: BEAT * 37, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 32.5, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    // Launch to high platform
    { x: BEAT * 38.5, y: GROUND_Y - 100, width: 100, height: 20, type: 'crumble' },

    // ===== SECTION 6 (Beats 39.5-44): FINAL CRUMBLE SPRINT =====
    // No time to think - just go!
    { x: BEAT * 40, y: GROUND_Y - 60, width: 90, height: 20, type: 'crumble' },
    { x: BEAT * 41.5, y: GROUND_Y - 40, width: 90, height: 20, type: 'crumble' },
    { x: BEAT * 43, y: GROUND_Y - 20, width: 90, height: 20, type: 'crumble' },
    { x: BEAT * 39.5, y: GROUND_Y, width: BEAT * 4.5, height: 20, type: 'lava' },

    // ===== FINALE (Beats 44-48): THE ONLY SAFE GROUND =====
    // You made it! Solid ground at last
    { x: BEAT * 44.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 45, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 46.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    // Final solid platform to goal
    { x: BEAT * 47, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level6 extends Level {
  constructor() {
    super(level6Config);
  }
}
