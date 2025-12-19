import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 1: "First Flight" - 128 BPM
// Beat interval: 164px (350 px/s ÷ 128 BPM × 60)
// Jump distance: 210px, Jump height: 90px
// STRATEGY: Tutorial level - coin trails guide the player
// Coins show WHERE to jump and WHEN, teaching rhythm-based gameplay

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 164; // pixels per beat at 128 BPM

const level1Config: LevelConfig = {
  id: 1,
  name: 'First Flight',
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 32, y: GROUND_Y - 80, width: 60, height: 80 }, // 32 beats = ~5248px
  background: {
    type: 'city',
    primaryColor: '#0a0a1a',
    secondaryColor: '#151530',
    accentColor: '#e94560',
    particles: {
      count: 30,
      color: 'rgba(255, 255, 255, 0.5)',
      minSize: 1,
      maxSize: 3,
      speed: 30,
      direction: 'down',
    },
    effects: ['stars'],
  },
  coins: [
    // TUTORIAL: Coin trail teaches jump timing
    // Coin 1-2: Arc showing jump trajectory over first spike
    { x: BEAT * 4.3, y: GROUND_Y - 70 },
    { x: BEAT * 4.6, y: GROUND_Y - 90 },
    // Coin 3-4: Rhythm trail for double spike section
    { x: BEAT * 8.5, y: GROUND_Y - 80 },
    { x: BEAT * 10.5, y: GROUND_Y - 80 },
    // Coin 5: Shows gap jump distance
    { x: BEAT * 12.5, y: GROUND_Y - 60 },
    // Coin 6-7: Bounce pad height teaching
    { x: BEAT * 17, y: GROUND_Y - 100 },
    { x: BEAT * 17.5, y: GROUND_Y - 120 },
    // Coin 8: Landing spot indicator
    { x: BEAT * 18, y: GROUND_Y - 90 },
    // Coin 9-10: Platform hop guide
    { x: BEAT * 24.5, y: GROUND_Y - 80 },
    { x: BEAT * 26, y: GROUND_Y - 80 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-4): Safe starting zone =====
    { x: 0, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 1 (Beats 4-8): First spike - single jump =====
    // Spike at beat 4.5 - player jumps on beat 4
    { x: BEAT * 4.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 5, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 2 (Beats 8-12): Two spikes with rhythm =====
    // Spike on beat 8.5, land, spike on beat 10.5
    { x: BEAT * 8.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 9, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 10.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 11, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 3 (Beats 12-16): Gap jump + spike =====
    // Gap from beat 12-13 (164px gap - easy jump)
    { x: BEAT * 13, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 14.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 15, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 4 (Beats 16-20): Bounce pad introduction =====
    { x: BEAT * 16, y: GROUND_Y, width: 80, height: 20, type: 'bounce' },
    // Bounce sends player higher - land on elevated platform
    { x: BEAT * 17.5, y: GROUND_Y - 80, width: BEAT * 1.5, height: 20, type: 'solid' },
    // Drop back down
    { x: BEAT * 19, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 5 (Beats 20-24): Double spike pattern =====
    { x: BEAT * 20.5, y: GROUND_Y, width: 50, height: 30, type: 'spike' },
    { x: BEAT * 21.5, y: GROUND_Y, width: BEAT * 2.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 6 (Beats 24-28): Platform hopping =====
    // Elevated platform at beat 24
    { x: BEAT * 24, y: GROUND_Y - 60, width: BEAT * 1, height: 20, type: 'solid' },
    { x: BEAT * 24, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    // Second platform
    { x: BEAT * 25.5, y: GROUND_Y - 60, width: BEAT * 1, height: 20, type: 'solid' },
    { x: BEAT * 25.5, y: GROUND_Y, width: 40, height: 30, type: 'spike' },
    // Return to ground
    { x: BEAT * 27, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PHRASE 7 (Beats 28-32): Final run to goal =====
    { x: BEAT * 28.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 29, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 30.5, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    // Final platform to goal
    { x: BEAT * 31, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level1 extends Level {
  constructor() {
    super(level1Config);
  }
}
