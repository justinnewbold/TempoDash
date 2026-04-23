import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 16: "Stellar Circuit" - 150 BPM
// STRATEGY: Cosmic raceway with portal shortcuts and gem treasures
// Features: Portals, all three gem types, moving platforms, gravity flips
// Theme: Interstellar circuit racing through a starfield

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 420; // pixels per beat at 150 BPM (2x length)

const level16Config: LevelConfig = {
  id: 16,
  name: 'Stellar Circuit',
  bpm: 150,
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 44, y: GROUND_Y - 80, width: 60, height: 80 },
  checkpoints: [
    { x: BEAT * 12, y: GROUND_Y - 50, name: 'Orbit Entry' },
    { x: BEAT * 24, y: GROUND_Y - 50, name: 'Portal Nexus' },
    { x: BEAT * 36, y: GROUND_Y - 50, name: 'Asteroid Field' },
  ],
  background: {
    type: 'space',
    primaryColor: '#050018',
    secondaryColor: '#1a0a3a',
    accentColor: '#8855ff',
    particles: {
      count: 80,
      color: 'rgba(200, 180, 255, 0.75)',
      minSize: 1,
      maxSize: 4,
      speed: 60,
      direction: 'random',
    },
    effects: ['stars', 'aurora'],
  },
  portals: [
    // Shortcut portal pair across a lava chasm
    { id: 'p1-in', x: BEAT * 20.5, y: GROUND_Y - 90, linkedPortalId: 'p1-out', color: '#aa66ff' },
    { id: 'p1-out', x: BEAT * 23, y: GROUND_Y - 90, linkedPortalId: 'p1-in', color: '#aa66ff' },
  ],
  gems: [
    // Rare treasures tucked off the golden path
    { x: BEAT * 7.5, y: GROUND_Y - 180, type: 'sapphire' },
    { x: BEAT * 18, y: GROUND_Y - 220, type: 'emerald' },
    { x: BEAT * 33.5, y: GROUND_Y - 200, type: 'ruby' },
  ],
  coins: [
    // Intro trail
    { x: BEAT * 3, y: GROUND_Y - 80 },
    { x: BEAT * 4, y: GROUND_Y - 100 },
    { x: BEAT * 5, y: GROUND_Y - 80 },
    // Orbit hop arc
    { x: BEAT * 8.5, y: GROUND_Y - 120 },
    { x: BEAT * 9.5, y: GROUND_Y - 140 },
    { x: BEAT * 10.5, y: GROUND_Y - 120 },
    // Moving platform ride
    { x: BEAT * 14, y: GROUND_Y - 100 },
    { x: BEAT * 15, y: GROUND_Y - 100 },
    // Pre-portal approach
    { x: BEAT * 19, y: GROUND_Y - 80 },
    { x: BEAT * 20, y: GROUND_Y - 110 },
    // Asteroid field rewards
    { x: BEAT * 27, y: GROUND_Y - 90 },
    { x: BEAT * 29, y: GROUND_Y - 130 },
    { x: BEAT * 31, y: GROUND_Y - 90 },
    // Gravity flip coins
    { x: BEAT * 37.5, y: 140 },
    { x: BEAT * 38.5, y: 140 },
    // Final dash
    { x: BEAT * 41, y: GROUND_Y - 100 },
    { x: BEAT * 42, y: GROUND_Y - 80 },
  ],
  powerUps: [
    { type: 'shield', x: BEAT * 6, y: GROUND_Y - 60 },
    { type: 'magnet', x: BEAT * 16, y: GROUND_Y - 60 },
    { type: 'doublePoints', x: BEAT * 28, y: GROUND_Y - 60 },
    { type: 'slowmo', x: BEAT * 39, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== INTRO (Beats 0-6): Launch pad =====
    { x: 0, y: GROUND_Y, width: BEAT * 6, height: GROUND_HEIGHT, type: 'solid' },

    // ===== ORBIT ENTRY (Beats 6-12): Bounce arcs to high coins =====
    { x: BEAT * 6.5, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 8, y: GROUND_Y - 150, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 9.5, y: GROUND_Y - 170, width: 90, height: 20, type: 'glass' },
    { x: BEAT * 11, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },
    // Gap with lava
    { x: BEAT * 7.2, y: GROUND_Y, width: BEAT * 3.5, height: 20, type: 'lava' },

    // ===== MOVING CORRIDOR (Beats 12-20): Horizontal platforms over void =====
    { x: BEAT * 12.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    {
      x: BEAT * 14, y: GROUND_Y - 60, width: 90, height: 20, type: 'moving',
      movePattern: { type: 'horizontal', distance: 80, speed: 2.2, startOffset: 0 },
    },
    {
      x: BEAT * 16, y: GROUND_Y - 90, width: 90, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 50, speed: 2.5, startOffset: 0.5 },
    },
    { x: BEAT * 13.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 18, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== PORTAL NEXUS (Beats 20-26): Teleport across the chasm =====
    // Platform hosting the entry portal
    { x: BEAT * 20, y: GROUND_Y - 60, width: 80, height: 20, type: 'solid' },
    // Wide chasm of lava spanning the portal jump
    { x: BEAT * 20.5, y: GROUND_Y, width: BEAT * 2.5, height: 20, type: 'lava' },
    // Landing platform for exit portal
    { x: BEAT * 22.8, y: GROUND_Y - 60, width: 100, height: 20, type: 'solid' },
    { x: BEAT * 24, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== ASTEROID FIELD (Beats 26-34): Crumble stepping stones =====
    { x: BEAT * 26, y: GROUND_Y - 50, width: 70, height: 20, type: 'crumble' },
    { x: BEAT * 27.2, y: GROUND_Y - 80, width: 70, height: 20, type: 'crumble' },
    { x: BEAT * 28.4, y: GROUND_Y - 110, width: 70, height: 20, type: 'crumble' },
    { x: BEAT * 29.6, y: GROUND_Y - 80, width: 70, height: 20, type: 'crumble' },
    { x: BEAT * 30.8, y: GROUND_Y - 50, width: 70, height: 20, type: 'crumble' },
    { x: BEAT * 25.8, y: GROUND_Y, width: BEAT * 6, height: 20, type: 'lava' },
    { x: BEAT * 32, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== GRAVITY FLIP (Beats 34-40): Run along the ceiling =====
    { x: BEAT * 34.5, y: GROUND_Y, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 35.5, y: 120, width: BEAT * 3, height: 20, type: 'solid' },
    { x: BEAT * 37, y: 140, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 38.5, y: 120, width: 80, height: 20, type: 'gravity' },
    { x: BEAT * 34.5, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    { x: BEAT * 39.5, y: GROUND_Y, width: BEAT * 1.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== FINAL APPROACH (Beats 40-44): Dash to the goal =====
    { x: BEAT * 41.2, y: GROUND_Y, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 41.8, y: GROUND_Y, width: BEAT * 0.8, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 43, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 43.5, y: GROUND_Y, width: BEAT * 3, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level16 extends Level {
  constructor() {
    super(level16Config);
  }
}
