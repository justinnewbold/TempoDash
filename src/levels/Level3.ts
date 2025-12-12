import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 3: "Final Ascent" - 150 BPM
// Beat interval: 140px (350 px/s ÷ 150 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// Phase platforms: On 2000ms (700px), Off 1500ms (525px), Cycle 3500ms (1225px)
// Design: Fast pace with phase platforms, demanding timing

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 140; // pixels per beat at 150 BPM

// Phase platform cycle: 1225px total (700px solid, 525px phased)
// Place phase platforms at positions where player arrives during solid phase

const level3Config: LevelConfig = {
  id: 3,
  name: 'Final Ascent',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 48, y: GROUND_Y - 80, width: 60, height: 80 }, // 48 beats = ~6720px
  background: {
    type: 'neon',
    primaryColor: '#0a0a0a',
    secondaryColor: '#1a0a1a',
    accentColor: '#00ff88',
    particles: {
      count: 60,
      color: 'rgba(0, 255, 136',
      minSize: 1,
      maxSize: 5,
      speed: 60,
      direction: 'up',
    },
    effects: ['grid', 'scanlines', 'pulse'],
  },
  platforms: [
    // ===== INTRO (Beats 0-4): Safe zone =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 1 (Beats 4-8): Quick spikes to establish rhythm =====
    { x: BEAT * 4.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 6.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 7, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 2 (Beats 8-12): Double spike + platform hop =====
    { x: BEAT * 8.5, y: GROUND_Y, width: 50, height: 30, type: 'spike' },
    { x: BEAT * 9.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    // Elevated hop
    { x: BEAT * 11, y: GROUND_Y - 60, width: BEAT * 1, height: 20, type: 'solid' },
    { x: BEAT * 11, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    // ===== PHRASE 3 (Beats 12-16): PHASE PLATFORMS - Level 3 unique! =====
    // Phase platform 1 - arrives during solid phase (based on cycle timing)
    { x: BEAT * 12.5, y: GROUND_Y - 60, width: 120, height: 20, type: 'phase' },
    { x: BEAT * 12.5, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // Solid platform for recovery
    { x: BEAT * 14.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 4 (Beats 16-20): Bounce + more phase platforms =====
    { x: BEAT * 16.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 18, y: GROUND_Y - 100, width: 100, height: 20, type: 'solid' },

    // Drop to phase platform
    { x: BEAT * 19.5, y: GROUND_Y - 50, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 19.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    // ===== PHRASE 5 (Beats 20-24): Recovery and triple spike =====
    { x: BEAT * 21, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 22.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 23, y: GROUND_Y, width: BEAT * 0.7, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 24, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 24.5, y: GROUND_Y, width: BEAT * 0.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 6 (Beats 24-28): Platform staircase =====
    { x: BEAT * 25.5, y: GROUND_Y - 40, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 26.8, y: GROUND_Y - 80, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 28, y: GROUND_Y - 40, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 28, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    // ===== PHRASE 7 (Beats 28-32): Bounce chain =====
    { x: BEAT * 29.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 31, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 32.5, y: GROUND_Y - 80, width: 70, height: 20, type: 'bounce' },

    // ===== PHRASE 8 (Beats 32-36): High platforms with spikes below =====
    { x: BEAT * 34, y: GROUND_Y - 120, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 35.5, y: GROUND_Y - 80, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 35.5, y: GROUND_Y, width: 50, height: 30, type: 'spike' },

    // ===== PHRASE 9 (Beats 36-40): Phase platform gauntlet =====
    { x: BEAT * 37, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // Three phase platforms in sequence - timed with cycle
    { x: BEAT * 38.5, y: GROUND_Y - 50, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 38.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    { x: BEAT * 40, y: GROUND_Y - 50, width: 100, height: 20, type: 'phase' },
    { x: BEAT * 40, y: GROUND_Y, width: 40, height: 30, type: 'spike' },

    // ===== PHRASE 10 (Beats 40-44): Recovery =====
    { x: BEAT * 41.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 11 (Beats 44-48): Final gauntlet =====
    { x: BEAT * 44, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 44.5, y: GROUND_Y, width: BEAT * 0.7, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 45.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 46, y: GROUND_Y, width: BEAT * 0.7, height: GROUND_HEIGHT, type: 'solid' },

    // Final stretch to goal
    { x: BEAT * 47, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level3 extends Level {
  constructor() {
    super(level3Config);
  }
}
