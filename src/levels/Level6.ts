import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 6: "Abyssal Depths" - 135 BPM
// Beat interval: 156px (350 px/s ÷ 135 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// Design: Underwater theme with slow-feel, coral platforms, and bubble effects

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 156; // pixels per beat at 135 BPM

const level6Config: LevelConfig = {
  id: 6,
  name: 'Abyssal Depths',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 48, y: GROUND_Y - 80, width: 60, height: 80 }, // 48 beats - longest level
  background: {
    type: 'ocean',
    primaryColor: '#001a33',
    secondaryColor: '#002244',
    accentColor: '#00ccff',
    particles: {
      count: 40,
      color: 'rgba(150, 220, 255',
      minSize: 3,
      maxSize: 8,
      speed: 30,
      direction: 'up',
    },
    effects: ['bubbles', 'waves'],
  },
  coins: [
    // Coin in opening section
    { x: BEAT * 3, y: GROUND_Y - 80 },
    // Coin above coral jump
    { x: BEAT * 10, y: GROUND_Y - 120 },
    // Coin in spike section
    { x: BEAT * 18, y: GROUND_Y - 100 },
    // Coin on elevated coral
    { x: BEAT * 26, y: GROUND_Y - 160 },
    // Hidden coin in trench
    { x: BEAT * 34, y: GROUND_Y - 40 },
    // Final coin before goal
    { x: BEAT * 44, y: GROUND_Y - 100 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Safe coral reef starting zone =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 1 (Beats 4-8): First coral hop =====
    { x: BEAT * 4.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    // Gap then coral platform
    { x: BEAT * 7, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 2 (Beats 8-12): Elevated coral platforms =====
    { x: BEAT * 8.5, y: GROUND_Y - 50, width: BEAT * 1.2, height: 20, type: 'solid' },
    { x: BEAT * 8.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    { x: BEAT * 10, y: GROUND_Y - 80, width: BEAT * 1.2, height: 20, type: 'solid' },
    { x: BEAT * 11.5, y: GROUND_Y - 50, width: BEAT * 1.2, height: 20, type: 'solid' },

    // ===== PHRASE 3 (Beats 12-16): Return to ground with obstacles =====
    { x: BEAT * 13, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 14.5, y: GROUND_Y, width: 50, height: 30, type: 'spike' },
    { x: BEAT * 15.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 4 (Beats 16-20): Bounce on coral =====
    { x: BEAT * 16.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 18, y: GROUND_Y - 100, width: BEAT * 1.5, height: 20, type: 'solid' },
    { x: BEAT * 19.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 5 (Beats 20-24): Triple spike pattern =====
    { x: BEAT * 20.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 21, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 22, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 22.5, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 23.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 24, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 6 (Beats 24-28): Coral staircase up =====
    { x: BEAT * 25, y: GROUND_Y - 40, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 25.8, y: GROUND_Y - 80, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 26.6, y: GROUND_Y - 120, width: BEAT * 0.8, height: 20, type: 'solid' },
    { x: BEAT * 27.4, y: GROUND_Y - 160, width: BEAT * 1, height: 20, type: 'solid' },

    // ===== PHRASE 7 (Beats 28-32): Descent with hazards =====
    { x: BEAT * 28.5, y: GROUND_Y - 120, width: BEAT * 1, height: 20, type: 'solid' },
    { x: BEAT * 29.5, y: GROUND_Y - 80, width: BEAT * 1, height: 20, type: 'solid' },
    { x: BEAT * 30.5, y: GROUND_Y - 40, width: BEAT * 1, height: 20, type: 'solid' },
    { x: BEAT * 31.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 8 (Beats 32-36): Deep trench section =====
    { x: BEAT * 32.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 33, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 35, y: GROUND_Y, width: 50, height: 30, type: 'spike' },
    { x: BEAT * 35.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 9 (Beats 36-40): Bounce combo =====
    { x: BEAT * 36.5, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    { x: BEAT * 38, y: GROUND_Y - 80, width: BEAT * 1.2, height: 20, type: 'solid' },
    { x: BEAT * 39.2, y: GROUND_Y - 80, width: 60, height: 20, type: 'bounce' },
    { x: BEAT * 40.5, y: GROUND_Y - 160, width: BEAT * 1.5, height: 20, type: 'solid' },

    // ===== PHRASE 10 (Beats 40-44): Final descent =====
    { x: BEAT * 42, y: GROUND_Y - 100, width: BEAT * 1, height: 20, type: 'solid' },
    { x: BEAT * 43, y: GROUND_Y - 50, width: BEAT * 1, height: 20, type: 'solid' },
    { x: BEAT * 44, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 11 (Beats 44-48): Final run to goal =====
    { x: BEAT * 45, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 45.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 46.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    // Final platform to goal
    { x: BEAT * 47, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level6 extends Level {
  constructor() {
    super(level6Config);
  }
}
