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
}

export type PlatformType =
  | 'solid'      // Normal platform
  | 'bounce'     // Bouncy platform
  | 'crumble'    // Crumbles after touching
  | 'moving'     // Moving platform
  | 'ice'        // Slippery platform
  | 'lava'       // Deadly platform
  | 'phase'      // Phases in and out
  | 'spike';     // Deadly spike obstacle

export interface MovePattern {
  type: 'horizontal' | 'vertical' | 'circular';
  distance: number;
  speed: number;
  startOffset?: number;
}

export interface CoinConfig {
  x: number;
  y: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  platforms: PlatformConfig[];
  coins?: CoinConfig[];
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
  | 'space'      // Level 3 - Space
  | 'forest';    // Level 4 - Mystical forest

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
  | 'scanlines';

export interface GameState {
  currentLevel: number;
  lives: number;
  score: number;
  gameStatus: MenuState;
}

export type MenuState =
  | 'mainMenu'
  | 'levelSelect'
  | 'settings'
  | 'playing'
  | 'paused'
  | 'levelComplete'
  | 'gameOver';

export interface SaveData {
  totalPoints: number;
  unlockedLevels: number[];
  highScores: Record<number, number>;
  settings: GameSettings;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
  dash: boolean;
  dashPressed: boolean;
}
