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

export interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  movePattern?: MovePattern;
  color?: string;
  linkedId?: string;        // For teleporters
  direction?: 'left' | 'right';  // For conveyors
  windStrength?: number;    // For wind platforms
}

export type PlatformType =
  | 'solid'      // Normal platform
  | 'bounce'     // Bouncy platform
  | 'crumble'    // Crumbles after touching
  | 'moving'     // Moving platform
  | 'ice'        // Slippery platform
  | 'lava'       // Deadly platform
  | 'phase'      // Phases in and out
  | 'conveyor'   // Pushes player left/right
  | 'lowgravity' // Reduced gravity zone
  | 'reverse'    // Reverses gravity
  | 'wind'       // Periodic wind gusts
  | 'lightning'  // Electrified periodically (deadly when active)
  | 'cloud'      // Sinks when standing on it
  | 'teleporter' // Warps to linked teleporter
  | 'speedboost' // Launches player forward
  | 'glitch';    // Unpredictable behavior

export interface MovePattern {
  type: 'horizontal' | 'vertical' | 'circular';
  distance: number;
  speed: number;
  startOffset?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  platforms: PlatformConfig[];
  playerStart: Vector2;
  goal: Rectangle;
  background: BackgroundConfig;
  music?: string;
}

export interface BackgroundConfig {
  type: BackgroundType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  particles?: ParticleConfig;
  effects?: BackgroundEffect[];
}

export type BackgroundType =
  | 'city'       // Level 1 - City night
  | 'neon'       // Level 2 - Neon synthwave
  | 'crystal'    // Level 3 - Crystal Caverns
  | 'space'      // Level 4 - Zero-G Station
  | 'storm'      // Level 5 - Storm Surge
  | 'digital';   // Level 6 - Digital Realm

export interface ParticleConfig {
  count: number;
  color: string;
  minSize: number;
  maxSize: number;
  speed: number;
  direction: 'up' | 'down' | 'random';
}

export type BackgroundEffect =
  | 'stars'
  | 'rain'
  | 'snow'
  | 'waves'
  | 'grid'
  | 'pulse'
  | 'aurora'
  | 'scanlines'
  | 'crystals'
  | 'lightning'
  | 'datastream'
  | 'nebula'
  | 'stormclouds'
  | 'circuitboard'
  | 'glitcheffect';

export interface GameState {
  currentLevel: number;
  lives: number;
  score: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver';
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}
