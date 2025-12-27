import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 10: "Sky Glider" - 140 BPM
// Beat interval: 450px (350 px/s ÷ 140 BPM × 60 × 3)
// STRATEGY: Flying mode level - hold to fly up, release to fall
// Avoid obstacles while navigating through the sky
// Theme: Soaring through clouds with spike obstacles

const GROUND_Y = GAME_HEIGHT - 40;
const CENTER_Y = GAME_HEIGHT / 2;
const BEAT = 450; // pixels per beat at 140 BPM

const level10Config: LevelConfig = {
  id: 10,
  name: 'Sky Glider',
  bpm: 140,
  flyingMode: true,  // Enable flying mode
  playerStart: { x: 100, y: CENTER_Y },
  goal: { x: BEAT * 48, y: CENTER_Y - 40, width: 80, height: 100 },
  checkpoints: [
    { x: BEAT * 12, y: CENTER_Y, name: 'First Wave' },
    { x: BEAT * 24, y: CENTER_Y, name: 'Narrow Pass' },
    { x: BEAT * 36, y: CENTER_Y, name: 'Final Stretch' },
  ],
  background: {
    type: 'sky',
    primaryColor: '#87CEEB',
    secondaryColor: '#E0F6FF',
    accentColor: '#FFD700',
    particles: {
      count: 40,
      color: 'rgba(255, 255, 255, 0.8)',
      minSize: 20,
      maxSize: 60,
      speed: 20,
      direction: 'down',  // Clouds moving past
    },
    effects: ['aurora'],
  },
  coins: [
    // Section 1: Introduction - coins guide the path
    { x: BEAT * 2, y: CENTER_Y - 60 },
    { x: BEAT * 3, y: CENTER_Y + 60 },
    { x: BEAT * 4, y: CENTER_Y - 40 },
    { x: BEAT * 5, y: CENTER_Y + 40 },

    // Section 2: Wave pattern coins
    { x: BEAT * 8, y: CENTER_Y - 80 },
    { x: BEAT * 9, y: CENTER_Y },
    { x: BEAT * 10, y: CENTER_Y + 80 },
    { x: BEAT * 11, y: CENTER_Y },

    // Section 3: Through the gaps
    { x: BEAT * 14, y: CENTER_Y },
    { x: BEAT * 16, y: CENTER_Y - 100 },
    { x: BEAT * 18, y: CENTER_Y + 100 },

    // Section 4: Narrow corridor
    { x: BEAT * 22, y: CENTER_Y - 20 },
    { x: BEAT * 24, y: CENTER_Y + 20 },
    { x: BEAT * 26, y: CENTER_Y },

    // Section 5: Weaving
    { x: BEAT * 30, y: CENTER_Y - 60 },
    { x: BEAT * 32, y: CENTER_Y + 60 },
    { x: BEAT * 34, y: CENTER_Y - 40 },

    // Section 6: Final approach
    { x: BEAT * 38, y: CENTER_Y },
    { x: BEAT * 40, y: CENTER_Y - 80 },
    { x: BEAT * 42, y: CENTER_Y + 80 },
    { x: BEAT * 44, y: CENTER_Y },
    { x: BEAT * 46, y: CENTER_Y - 40 },
  ],
  powerUps: [
    { type: 'shield', x: BEAT * 12, y: CENTER_Y },
    { type: 'slowmo', x: BEAT * 24, y: CENTER_Y },
    { type: 'shield', x: BEAT * 36, y: CENTER_Y },
  ],
  platforms: [
    // ===== SECTION 1 (Beats 0-6): Safe intro - learn to fly =====
    // No obstacles, just get used to flying

    // ===== SECTION 2 (Beats 6-12): Single obstacles =====
    // Top spike
    { x: BEAT * 6, y: 40, width: 40, height: 80, type: 'spike' },
    // Bottom spike
    { x: BEAT * 7.5, y: GROUND_Y - 80, width: 40, height: 80, type: 'spike' },
    // Middle spike
    { x: BEAT * 9, y: CENTER_Y - 40, width: 40, height: 80, type: 'spike' },
    // Top spike
    { x: BEAT * 10.5, y: 60, width: 40, height: 60, type: 'spike' },

    // ===== SECTION 3 (Beats 12-18): Gaps to fly through =====
    // Top and bottom spikes with gap in middle
    { x: BEAT * 12.5, y: 20, width: 60, height: 120, type: 'spike' },
    { x: BEAT * 12.5, y: GROUND_Y - 140, width: 60, height: 120, type: 'spike' },

    // Offset gap - higher
    { x: BEAT * 14.5, y: 20, width: 60, height: 80, type: 'spike' },
    { x: BEAT * 14.5, y: GROUND_Y - 100, width: 60, height: 100, type: 'spike' },

    // Offset gap - lower
    { x: BEAT * 16.5, y: 20, width: 60, height: 160, type: 'spike' },
    { x: BEAT * 16.5, y: GROUND_Y - 80, width: 60, height: 80, type: 'spike' },

    // ===== SECTION 4 (Beats 18-24): Wave pattern =====
    // Alternating top/bottom spikes creating wave path
    { x: BEAT * 18.5, y: 30, width: 50, height: 100, type: 'spike' },
    { x: BEAT * 19.5, y: GROUND_Y - 100, width: 50, height: 100, type: 'spike' },
    { x: BEAT * 20.5, y: 40, width: 50, height: 110, type: 'spike' },
    { x: BEAT * 21.5, y: GROUND_Y - 110, width: 50, height: 110, type: 'spike' },
    { x: BEAT * 22.5, y: 30, width: 50, height: 100, type: 'spike' },
    { x: BEAT * 23.5, y: GROUND_Y - 100, width: 50, height: 100, type: 'spike' },

    // ===== SECTION 5 (Beats 24-30): Narrow corridors =====
    // Tight passage at center
    { x: BEAT * 25, y: 20, width: 80, height: CENTER_Y - 60, type: 'spike' },
    { x: BEAT * 25, y: CENTER_Y + 40, width: 80, height: CENTER_Y - 60, type: 'spike' },

    // Tight passage higher
    { x: BEAT * 27, y: 20, width: 80, height: CENTER_Y - 100, type: 'spike' },
    { x: BEAT * 27, y: CENTER_Y, width: 80, height: CENTER_Y - 20, type: 'spike' },

    // Tight passage lower
    { x: BEAT * 29, y: 20, width: 80, height: CENTER_Y - 20, type: 'spike' },
    { x: BEAT * 29, y: CENTER_Y + 100, width: 80, height: CENTER_Y - 120, type: 'spike' },

    // ===== SECTION 6 (Beats 30-36): Moving obstacles =====
    // Vertical moving spike
    {
      x: BEAT * 31, y: CENTER_Y - 40, width: 50, height: 80, type: 'spike',
    },
    {
      x: BEAT * 33, y: CENTER_Y - 60, width: 50, height: 80, type: 'spike',
    },
    {
      x: BEAT * 35, y: CENTER_Y + 20, width: 50, height: 80, type: 'spike',
    },

    // ===== SECTION 7 (Beats 36-42): Staggered spikes =====
    // Multiple spikes at different heights
    { x: BEAT * 37, y: 40, width: 40, height: 60, type: 'spike' },
    { x: BEAT * 37.5, y: CENTER_Y - 30, width: 40, height: 60, type: 'spike' },
    { x: BEAT * 38, y: GROUND_Y - 100, width: 40, height: 60, type: 'spike' },

    { x: BEAT * 39.5, y: 60, width: 40, height: 70, type: 'spike' },
    { x: BEAT * 40, y: CENTER_Y + 20, width: 40, height: 60, type: 'spike' },
    { x: BEAT * 40.5, y: GROUND_Y - 130, width: 40, height: 70, type: 'spike' },

    // ===== SECTION 8 (Beats 42-48): Final gauntlet =====
    // Dense but fair obstacle course
    { x: BEAT * 42, y: 20, width: 50, height: 100, type: 'spike' },
    { x: BEAT * 42.5, y: GROUND_Y - 100, width: 50, height: 100, type: 'spike' },

    { x: BEAT * 43.5, y: CENTER_Y - 40, width: 40, height: 80, type: 'spike' },

    { x: BEAT * 44.5, y: 30, width: 50, height: 90, type: 'spike' },
    { x: BEAT * 45, y: GROUND_Y - 90, width: 50, height: 90, type: 'spike' },

    { x: BEAT * 46, y: CENTER_Y + 30, width: 40, height: 70, type: 'spike' },

    // Final clear path to goal
  ],
};

export class Level10 extends Level {
  constructor() {
    super(level10Config);
  }
}
