// Core game types for Block Dash / TempoDash

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Obstacle types for the endless runner
export type ObstacleType =
  | 'spike'        // Single triangle spike
  | 'doubleSpike'  // Two spikes in a row
  | 'block'        // Standard block
  | 'tallBlock'    // Tall vertical block
  | 'platform';    // Level 2+: Elevated platform to jump on

// Level 3+: Hole/pit in the ground
export interface Hole {
  x: number;
  width: number;
}

// Level 4+: Gravity zone
export interface GravityZone {
  x: number;
  width: number;
  multiplier: number; // 0.5 = low gravity
}

// Level 5+: Moving obstacle
export interface MovingObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  type: 'horizontal' | 'vertical' | 'circular';
  startX: number;
  startY: number;
  range: number;
  angle?: number;
}

// Level 6: Portal pairs
export interface Portal {
  id: string;
  x: number;
  y: number;
  linkedId: string;
  color: string;
}

// Skin definition
export interface Skin {
  name: string;
  cost: number;
  colors: string[];
  glow: string;
  trail: string;
}

// Skins available in the game
export const SKINS: Record<string, Skin> = {
  cyan: {
    name: 'Classic',
    cost: 0,
    colors: ['#00ffff', '#0088aa'],
    glow: '#00ffff',
    trail: '#00ffff'
  },
  neon: {
    name: 'Neon',
    cost: 500,
    colors: ['#ff00ff', '#00ffff'],
    glow: '#ff00ff',
    trail: '#ff44ff'
  },
  fire: {
    name: 'Fire',
    cost: 1000,
    colors: ['#ff4400', '#ffaa00'],
    glow: '#ff6600',
    trail: '#ff8800'
  },
  ice: {
    name: 'Ice',
    cost: 2000,
    colors: ['#aaffff', '#4488ff'],
    glow: '#88ccff',
    trail: '#aaddff'
  },
  rainbow: {
    name: 'Rainbow',
    cost: 5000,
    colors: ['rainbow'],
    glow: '#ffffff',
    trail: 'rainbow'
  },
  gold: {
    name: 'Gold',
    cost: 10000,
    colors: ['#ffd700', '#ffaa00'],
    glow: '#ffd700',
    trail: '#ffcc00'
  },
  void: {
    name: 'Void',
    cost: 25000,
    colors: ['#330066', '#000000'],
    glow: '#8800ff',
    trail: '#6600cc'
  }
};

// Level configuration
export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  unlockScore: number;  // Total points needed to unlock
  features: LevelFeature[];
  background: BackgroundConfig;
  beatConfig: BeatConfig;
}

export type LevelFeature =
  | 'obstacles'     // Basic obstacles (all levels)
  | 'platforms'     // Level 2+: Elevated platforms
  | 'holes'         // Level 3+: Pits to fall into
  | 'gravity'       // Level 4+: Low gravity zones
  | 'moving'        // Level 5+: Moving obstacles
  | 'portals';      // Level 6: Teleportation portals

export interface BackgroundConfig {
  type: BackgroundType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  groundColor: string;
  lineColor: string;
}

export type BackgroundType =
  | 'city'      // Level 1: Night city
  | 'neon'      // Level 2: Synthwave/neon
  | 'cave'      // Level 3: Crystal cave
  | 'space'     // Level 4: Space station
  | 'storm'     // Level 5: Stormy sky
  | 'digital';  // Level 6: Digital/cyber

// Beat/sound configuration per level
export interface BeatConfig {
  baseNote: number;       // Base frequency for melody
  kickFreq: number;       // Kick drum frequency
  snareFreq: number;      // Snare pitch
  bassNote: number;       // Bass note
  scale: number[];        // Musical scale intervals
  tempo: number;          // Base tempo modifier
}

// Game state
export interface GameState {
  currentLevel: number;
  score: number;
  jumpCount: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver';
  bpm: number;
}

// Saved game data
export interface SaveData {
  totalPoints: number;
  levelHighScores: Record<number, number>;
  unlockedSkins: string[];
  currentSkin: string;
  unlockedLevels: number[];
}

// Particle for visual effects
export interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  size: number;
  hue: number;
}

// Background element for parallax
export interface BgElement {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}
