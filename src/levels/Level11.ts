import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 11: "Ocean Deep" - 100 BPM (slower for underwater feel)
// Beat interval: 350px (350 px/s ÷ 100 BPM × 60 × 1.67)
// STRATEGY: Underwater level - floaty physics, slower gravity
// Navigate through underwater obstacles with reduced gravity
// Theme: Deep ocean exploration with water zones and currents

const GROUND_Y = GAME_HEIGHT - 40;
const BEAT = 350; // pixels per beat at 100 BPM

const level11Config: LevelConfig = {
  id: 11,
  name: 'Ocean Deep',
  bpm: 100,
  underwaterMode: true,  // Enable underwater physics
  playerStart: { x: 100, y: GAME_HEIGHT - 100 },
  goal: { x: BEAT * 40, y: GROUND_Y - 60, width: 80, height: 100 },
  checkpoints: [
    { x: BEAT * 10, y: GROUND_Y - 100, name: 'Coral Gardens' },
    { x: BEAT * 20, y: GROUND_Y - 150, name: 'Current Cave' },
    { x: BEAT * 30, y: GROUND_Y - 100, name: 'Abyssal Gate' },
  ],
  background: {
    type: 'gradient',
    primaryColor: '#001830',      // Deep ocean blue
    secondaryColor: '#003366',    // Lighter ocean
    accentColor: '#00ffaa',       // Bioluminescent
    particles: {
      count: 60,
      color: 'rgba(100, 200, 255, 0.5)',  // Bubbles
      minSize: 3,
      maxSize: 10,
      speed: 30,
      direction: 'up',  // Bubbles rise
    },
    effects: ['pulse'],
  },
  coins: [
    // Section 1: Intro - floating coins
    { x: BEAT * 2, y: GROUND_Y - 150 },
    { x: BEAT * 3, y: GROUND_Y - 200 },
    { x: BEAT * 4, y: GROUND_Y - 180 },
    { x: BEAT * 5, y: GROUND_Y - 220 },

    // Section 2: Near water platforms
    { x: BEAT * 8, y: GROUND_Y - 100 },
    { x: BEAT * 9, y: GROUND_Y - 160 },
    { x: BEAT * 11, y: GROUND_Y - 200 },

    // Section 3: Wind current paths
    { x: BEAT * 14, y: GROUND_Y - 300 },
    { x: BEAT * 16, y: GROUND_Y - 250 },
    { x: BEAT * 18, y: GROUND_Y - 350 },

    // Section 4: Deep dive
    { x: BEAT * 22, y: GROUND_Y - 80 },
    { x: BEAT * 24, y: GROUND_Y - 120 },
    { x: BEAT * 26, y: GROUND_Y - 100 },

    // Section 5: Portal area
    { x: BEAT * 30, y: GROUND_Y - 200 },
    { x: BEAT * 32, y: GROUND_Y - 150 },
    { x: BEAT * 34, y: GROUND_Y - 180 },

    // Section 6: Final stretch
    { x: BEAT * 36, y: GROUND_Y - 140 },
    { x: BEAT * 38, y: GROUND_Y - 160 },
  ],
  powerUps: [
    { type: 'shield', x: BEAT * 10, y: GROUND_Y - 180 },
    { type: 'slowmo', x: BEAT * 20, y: GROUND_Y - 220 },
    { type: 'shield', x: BEAT * 30, y: GROUND_Y - 140 },
  ],
  platforms: [
    // ===== SECTION 1 (Beats 0-6): Intro with water zones =====
    // Ground floor
    { x: 0, y: GROUND_Y, width: BEAT * 6, height: 40, type: 'solid' },

    // Water zones to get used to floaty physics
    { x: BEAT * 2, y: GROUND_Y - 200, width: 120, height: 150, type: 'water' },
    { x: BEAT * 4, y: GROUND_Y - 180, width: 100, height: 130, type: 'water' },

    // ===== SECTION 2 (Beats 6-12): Platforms with water =====
    // Stepping stone platforms
    { x: BEAT * 6, y: GROUND_Y - 60, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 7.5, y: GROUND_Y - 120, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 9, y: GROUND_Y - 80, width: 100, height: 20, type: 'solid' },

    // Water zone above platforms
    { x: BEAT * 7, y: GROUND_Y - 280, width: 200, height: 140, type: 'water' },

    // Bounce platform
    { x: BEAT * 10.5, y: GROUND_Y - 40, width: 80, height: 20, type: 'bounce' },

    // ===== SECTION 3 (Beats 12-18): Wind currents =====
    // Platform after gap
    { x: BEAT * 12, y: GROUND_Y - 100, width: 120, height: 20, type: 'solid' },

    // Upward wind zone
    { x: BEAT * 13, y: GROUND_Y - 350, width: 100, height: 250, type: 'wind', windDirection: 'up', windStrength: 1.5 },

    // Floating platforms in wind
    { x: BEAT * 14, y: GROUND_Y - 280, width: 80, height: 20, type: 'solid' },
    { x: BEAT * 15.5, y: GROUND_Y - 320, width: 80, height: 20, type: 'solid' },

    // Another wind zone
    { x: BEAT * 16, y: GROUND_Y - 400, width: 100, height: 200, type: 'wind', windDirection: 'up', windStrength: 1.2 },

    // Landing platform
    { x: BEAT * 17.5, y: GROUND_Y - 200, width: 100, height: 20, type: 'solid' },

    // ===== SECTION 4 (Beats 18-24): Deep dive with obstacles =====
    // Descending platforms
    { x: BEAT * 18.5, y: GROUND_Y - 160, width: 80, height: 20, type: 'solid' },
    { x: BEAT * 19.5, y: GROUND_Y - 100, width: 80, height: 20, type: 'solid' },
    { x: BEAT * 20.5, y: GROUND_Y - 60, width: 80, height: 20, type: 'solid' },

    // Large water zone with obstacles
    { x: BEAT * 21, y: GROUND_Y - 250, width: 300, height: 200, type: 'water' },

    // Spikes in water (need to float around)
    { x: BEAT * 22, y: GROUND_Y - 180, width: 40, height: 60, type: 'spike' },
    { x: BEAT * 23, y: GROUND_Y - 120, width: 40, height: 60, type: 'spike' },

    // Exit platform
    { x: BEAT * 24, y: GROUND_Y - 40, width: 100, height: 20, type: 'solid' },

    // ===== SECTION 5 (Beats 24-30): Portal section =====
    { x: BEAT * 25, y: GROUND_Y - 80, width: 80, height: 20, type: 'solid' },

    // Portal pair - teleport across obstacle
    { x: BEAT * 26, y: GROUND_Y - 100, width: 60, height: 100, type: 'portal', portalTarget: { x: BEAT * 28, y: GROUND_Y - 150 } },

    // Large spike wall (need to use portal)
    { x: BEAT * 27, y: GROUND_Y - 300, width: 60, height: 260, type: 'spike' },

    // Landing after portal
    { x: BEAT * 28, y: GROUND_Y - 60, width: 100, height: 20, type: 'solid' },

    // Water section with wind
    { x: BEAT * 29, y: GROUND_Y - 180, width: 150, height: 120, type: 'water' },
    { x: BEAT * 29, y: GROUND_Y - 180, width: 80, height: 100, type: 'wind', windDirection: 'right', windStrength: 0.8 },

    // ===== SECTION 6 (Beats 30-36): Current maze =====
    { x: BEAT * 30.5, y: GROUND_Y - 100, width: 80, height: 20, type: 'solid' },

    // Horizontal wind current section
    { x: BEAT * 31, y: GROUND_Y - 200, width: 200, height: 80, type: 'wind', windDirection: 'right', windStrength: 1.2 },

    // Platforms within current
    { x: BEAT * 32, y: GROUND_Y - 160, width: 60, height: 20, type: 'solid' },
    { x: BEAT * 33.5, y: GROUND_Y - 120, width: 60, height: 20, type: 'solid' },

    // Final water zone
    { x: BEAT * 34, y: GROUND_Y - 250, width: 180, height: 130, type: 'water' },

    // Last platforms
    { x: BEAT * 35, y: GROUND_Y - 80, width: 80, height: 20, type: 'solid' },

    // ===== SECTION 7 (Beats 36-40): Final approach =====
    // Last obstacles
    { x: BEAT * 36, y: GROUND_Y - 120, width: 80, height: 20, type: 'solid' },
    { x: BEAT * 37, y: GROUND_Y - 80, width: 80, height: 20, type: 'bounce' },

    // Final water zone
    { x: BEAT * 37.5, y: GROUND_Y - 200, width: 150, height: 120, type: 'water' },

    // Landing to goal
    { x: BEAT * 38.5, y: GROUND_Y - 60, width: 200, height: 20, type: 'solid' },

    // Ground at goal
    { x: BEAT * 39.5, y: GROUND_Y, width: BEAT * 2, height: 40, type: 'solid' },
  ],
};

export class Level11 extends Level {
  constructor() {
    super(level11Config);
  }
}
