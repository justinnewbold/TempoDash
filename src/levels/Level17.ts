import { LevelConfig } from '../types';
import { Level } from './Level';
import { GAME_HEIGHT } from '../constants';

// Level 17: "Magma Rift" - 160 BPM
// STRATEGY: Hard volcanic run - crumbling stones, twin portals, spike rhythm
// Features: Coins, all three gems, all four power-ups, 2 portal pairs, 3 checkpoints
// Theme: Racing through a collapsing magma rift

const GROUND_Y = GAME_HEIGHT - 40;
const GROUND_HEIGHT = 40;
const BEAT = 400; // pixels per beat at 160 BPM (2x length)

const level17Config: LevelConfig = {
  id: 17,
  name: 'Magma Rift',
  bpm: 160,
  playerStart: { x: 100, y: GROUND_Y - 50 },
  goal: { x: BEAT * 48, y: GROUND_Y - 80, width: 60, height: 80 },
  checkpoints: [
    { x: BEAT * 12, y: GROUND_Y - 50, name: 'Ember Gate' },
    { x: BEAT * 24.5, y: GROUND_Y - 50, name: 'Rift Portals' },
    { x: BEAT * 37, y: GROUND_Y - 50, name: 'Caldera' },
  ],
  background: {
    type: 'volcano',
    primaryColor: '#1a0500',
    secondaryColor: '#3d0a00',
    accentColor: '#ff5500',
    particles: {
      count: 70,
      color: 'rgba(255, 140, 40, 0.8)',
      minSize: 1,
      maxSize: 4,
      speed: 80,
      direction: 'up',
    },
    effects: ['embers', 'pulse'],
  },
  portals: [
    // Pair 1: skip the lava sea
    { id: 'm1-in', x: BEAT * 20.1, y: GROUND_Y - 90, linkedPortalId: 'm1-out', color: '#ff7700' },
    { id: 'm1-out', x: BEAT * 22.9, y: GROUND_Y - 150, linkedPortalId: 'm1-in', color: '#ff7700' },
    // Pair 2: risky high route shortcut in the caldera
    { id: 'm2-in', x: BEAT * 32.55, y: GROUND_Y - 210, linkedPortalId: 'm2-out', color: '#ffcc00' },
    { id: 'm2-out', x: BEAT * 36, y: GROUND_Y - 90, linkedPortalId: 'm2-in', color: '#ffcc00' },
  ],
  gems: [
    { x: BEAT * 9.5, y: GROUND_Y - 230, type: 'ruby' },      // top of bounce arc
    { x: BEAT * 17, y: GROUND_Y - 200, type: 'sapphire' },   // above moving platform
    { x: BEAT * 42.5, y: GROUND_Y - 220, type: 'emerald' },  // high glass ledge
  ],
  coins: [
    // Warm-up spikes
    { x: BEAT * 2, y: GROUND_Y - 90 },
    { x: BEAT * 3.5, y: GROUND_Y - 90 },
    { x: BEAT * 5, y: GROUND_Y - 90 },
    // Crumble steps
    { x: BEAT * 7, y: GROUND_Y - 120 },
    { x: BEAT * 8.2, y: GROUND_Y - 150 },
    { x: BEAT * 10.6, y: GROUND_Y - 150 },
    // Moving platforms
    { x: BEAT * 14.3, y: GROUND_Y - 110 },
    { x: BEAT * 16.3, y: GROUND_Y - 140 },
    // Portal approach
    { x: BEAT * 19.2, y: GROUND_Y - 80 },
    { x: BEAT * 23.8, y: GROUND_Y - 190 },
    // Spike rhythm corridor
    { x: BEAT * 26.5, y: GROUND_Y - 110 },
    { x: BEAT * 28.5, y: GROUND_Y - 110 },
    { x: BEAT * 30.5, y: GROUND_Y - 110 },
    // Caldera high route
    { x: BEAT * 32, y: GROUND_Y - 200 },
    { x: BEAT * 32.6, y: GROUND_Y - 230 },
    // Final gauntlet
    { x: BEAT * 39, y: GROUND_Y - 100 },
    { x: BEAT * 41, y: GROUND_Y - 150 },
    { x: BEAT * 44, y: GROUND_Y - 100 },
    { x: BEAT * 46, y: GROUND_Y - 90 },
  ],
  powerUps: [
    { type: 'shield', x: BEAT * 4, y: GROUND_Y - 60 },
    { type: 'magnet', x: BEAT * 13, y: GROUND_Y - 60 },
    { type: 'doublePoints', x: BEAT * 25.5, y: GROUND_Y - 60 },
    { type: 'slowmo', x: BEAT * 38, y: GROUND_Y - 60 },
  ],
  platforms: [
    // ===== WARM-UP (Beats 0-6): Ground with spike rhythm =====
    { x: 0, y: GROUND_Y, width: BEAT * 6, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 2, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 3.5, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 5, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },

    // ===== CRUMBLE STEPS (Beats 6-12): Collapsing stones over lava =====
    // Stones are 120 wide with ~150px edge gaps (single-jump reach is ~210px)
    { x: BEAT * 6, y: GROUND_Y, width: BEAT * 5, height: 20, type: 'lava' },
    { x: BEAT * 6.3, y: GROUND_Y - 40, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 6.975, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 7.65, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 8.325, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 9, y: GROUND_Y - 20, width: 100, height: 20, type: 'bounce' },
    { x: BEAT * 9.75, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 10.425, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 11, y: GROUND_Y, width: BEAT * 2.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== MOVING RIFT (Beats 13.5-19): Moving platforms over lava =====
    { x: BEAT * 13.5, y: GROUND_Y, width: BEAT * 4.5, height: 20, type: 'lava' },
    {
      x: BEAT * 14, y: GROUND_Y - 60, width: 90, height: 20, type: 'moving',
      movePattern: { type: 'horizontal', distance: 90, speed: 2.6, startOffset: 0 },
    },
    {
      x: BEAT * 16, y: GROUND_Y - 90, width: 80, height: 20, type: 'moving',
      movePattern: { type: 'vertical', distance: 60, speed: 2.8, startOffset: 0.5 },
    },
    { x: BEAT * 18, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },

    // ===== RIFT PORTALS (Beats 20-25): Teleport over the lava sea =====
    // Entry portal sits over its platform; exit lands on a wide ledge close to the ground
    { x: BEAT * 20, y: GROUND_Y - 60, width: 120, height: 20, type: 'solid' },
    { x: BEAT * 20, y: GROUND_Y, width: BEAT * 3.5, height: 20, type: 'lava' },
    { x: BEAT * 22.75, y: GROUND_Y - 120, width: 200, height: 20, type: 'solid' },
    { x: BEAT * 23.5, y: GROUND_Y, width: BEAT * 2.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== SPIKE CORRIDOR (Beats 26-31): Tight jumps between spikes =====
    { x: BEAT * 26, y: GROUND_Y, width: BEAT * 5.5, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 26.5, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 27.5, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 28.5, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 29.5, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 30.5, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },

    // ===== CALDERA (Beats 31.5-37): Ground path or high portal route =====
    { x: BEAT * 31.5, y: GROUND_Y, width: BEAT * 4, height: 20, type: 'lava' },
    { x: BEAT * 31.6, y: GROUND_Y - 20, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 32.4, y: GROUND_Y - 180, width: 140, height: 20, type: 'glass' },
    { x: BEAT * 32.4, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 33.075, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 33.75, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 34.425, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 35.5, y: GROUND_Y, width: BEAT * 3.5, height: GROUND_HEIGHT, type: 'solid' },

    // ===== FINAL GAUNTLET (Beats 39-48): Everything at once =====
    { x: BEAT * 39, y: GROUND_Y, width: BEAT * 1.5, height: 20, type: 'lava' },
    { x: BEAT * 39.3, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 39.975, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 40.5, y: GROUND_Y, width: BEAT * 1, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 41, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 41.5, y: GROUND_Y, width: BEAT * 2, height: 20, type: 'lava' },
    { x: BEAT * 42, y: GROUND_Y - 170, width: 100, height: 20, type: 'glass' },
    { x: BEAT * 41.75, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 42.425, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 43.1, y: GROUND_Y - 60, width: 120, height: 20, type: 'crumble' },
    { x: BEAT * 43.5, y: GROUND_Y, width: BEAT * 2, height: GROUND_HEIGHT, type: 'solid' },
    { x: BEAT * 45, y: GROUND_Y - 30, width: 30, height: 30, type: 'spike' },
    { x: BEAT * 45.5, y: GROUND_Y, width: 70, height: 20, type: 'bounce' },
    { x: BEAT * 46, y: GROUND_Y, width: BEAT * 4, height: GROUND_HEIGHT, type: 'solid' },
  ],
};

export class Level17 extends Level {
  constructor() {
    super(level17Config);
  }
}
