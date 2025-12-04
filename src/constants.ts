import { LevelConfig } from './types';

// Game dimensions
export const CONFIG = {
  WIDTH: 800,
  HEIGHT: 450,
  GRAVITY: 0.8,
  JUMP_FORCE: -14,
  PLAYER_SIZE: 40,
  GROUND_HEIGHT: 80,
  BASE_OBSTACLE_SPEED: 8,
  MIN_OBSTACLE_GAP: 250,
  MAX_OBSTACLE_GAP: 400,
  MIN_PLATFORM_GAP: 300,
  MAX_PLATFORM_GAP: 500,
  BASE_BPM: 20
};

// Level configurations
export const LEVELS: LevelConfig[] = [
  // Level 1: City Nights - Basic obstacles only
  {
    id: 1,
    name: 'City Nights',
    subtitle: 'The Beginning',
    unlockScore: 0, // Always unlocked
    features: ['obstacles'],
    background: {
      type: 'city',
      primaryColor: '#0f0f23',
      secondaryColor: '#1a1a3e',
      accentColor: '#2d2d5a',
      groundColor: '#2d2d5a',
      lineColor: '#00ffff'
    },
    beatConfig: {
      baseNote: 220,      // A3
      kickFreq: 150,
      snareFreq: 200,
      bassNote: 55,       // A1
      scale: [0, 3, 5, 7, 5, 3, 0, -2, 0, 3, 5, 7, 8, 7, 5, 3], // A minor
      tempo: 1.0
    }
  },
  // Level 2: Neon Dreams - Adds platforms
  {
    id: 2,
    name: 'Neon Dreams',
    subtitle: 'Platform Paradise',
    unlockScore: 1000, // Need 1000 total points
    features: ['obstacles', 'platforms'],
    background: {
      type: 'neon',
      primaryColor: '#1a0033',
      secondaryColor: '#330066',
      accentColor: '#ff00ff',
      groundColor: '#220044',
      lineColor: '#ff00ff'
    },
    beatConfig: {
      baseNote: 261.63,   // C4
      kickFreq: 120,
      snareFreq: 220,
      bassNote: 65.41,    // C2
      scale: [0, 4, 7, 11, 12, 11, 7, 4, 0, 4, 7, 11, 14, 11, 7, 4], // C major 7
      tempo: 1.1
    }
  },
  // Level 3: Crystal Caverns - Adds holes
  {
    id: 3,
    name: 'Crystal Caverns',
    subtitle: 'Mind the Gap',
    unlockScore: 3000, // Need 3000 total points
    features: ['obstacles', 'platforms', 'holes'],
    background: {
      type: 'cave',
      primaryColor: '#0a1628',
      secondaryColor: '#1a3050',
      accentColor: '#44aaff',
      groundColor: '#0d2040',
      lineColor: '#66ccff'
    },
    beatConfig: {
      baseNote: 196,      // G3
      kickFreq: 100,
      snareFreq: 180,
      bassNote: 49,       // G1
      scale: [0, 2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 2, 0, -2], // G minor
      tempo: 1.0
    }
  },
  // Level 4: Zero-G Station - Adds low gravity zones
  {
    id: 4,
    name: 'Zero-G Station',
    subtitle: 'Float & Flow',
    unlockScore: 6000, // Need 6000 total points
    features: ['obstacles', 'platforms', 'holes', 'gravity'],
    background: {
      type: 'space',
      primaryColor: '#000011',
      secondaryColor: '#000033',
      accentColor: '#8844ff',
      groundColor: '#111133',
      lineColor: '#aa66ff'
    },
    beatConfig: {
      baseNote: 293.66,   // D4
      kickFreq: 80,
      snareFreq: 160,
      bassNote: 73.42,    // D2
      scale: [0, 2, 4, 6, 7, 9, 11, 12, 11, 9, 7, 6, 4, 2, 0, -1], // D lydian
      tempo: 0.9
    }
  },
  // Level 5: Storm Surge - Adds moving obstacles
  {
    id: 5,
    name: 'Storm Surge',
    subtitle: 'Dodge & Weave',
    unlockScore: 10000, // Need 10000 total points
    features: ['obstacles', 'platforms', 'holes', 'gravity', 'moving'],
    background: {
      type: 'storm',
      primaryColor: '#1a1a2e',
      secondaryColor: '#2d3a4a',
      accentColor: '#ffcc00',
      groundColor: '#2a2a3e',
      lineColor: '#ffdd44'
    },
    beatConfig: {
      baseNote: 329.63,   // E4
      kickFreq: 140,
      snareFreq: 240,
      bassNote: 82.41,    // E2
      scale: [0, 1, 4, 5, 7, 8, 11, 12, 11, 8, 7, 5, 4, 1, 0, -1], // E phrygian dominant
      tempo: 1.2
    }
  },
  // Level 6: Digital Realm - Adds portals
  {
    id: 6,
    name: 'Digital Realm',
    subtitle: 'Warp Zone',
    unlockScore: 15000, // Need 15000 total points
    features: ['obstacles', 'platforms', 'holes', 'gravity', 'moving', 'portals'],
    background: {
      type: 'digital',
      primaryColor: '#000a00',
      secondaryColor: '#001a00',
      accentColor: '#00ff00',
      groundColor: '#002200',
      lineColor: '#00ff00'
    },
    beatConfig: {
      baseNote: 349.23,   // F4
      kickFreq: 160,
      snareFreq: 260,
      bassNote: 87.31,    // F2
      scale: [0, 3, 5, 6, 7, 10, 12, 15, 12, 10, 7, 6, 5, 3, 0, -2], // F blues
      tempo: 1.3
    }
  }
];

// Storage keys
export const STORAGE_KEYS = {
  TOTAL_POINTS: 'tempoDashTotalPoints',
  LEVEL_HIGH_SCORES: 'tempoDashLevelHighScores',
  SKINS: 'tempoDashSkins',
  CURRENT_SKIN: 'tempoDashCurrentSkin',
  UNLOCKED_LEVELS: 'tempoDashUnlockedLevels',
  ATTEMPTS: 'tempoDashAttempts'
};
