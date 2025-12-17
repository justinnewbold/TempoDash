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
  | 'forest'     // Level 4 - Mystical forest
  | 'volcano'    // Level 5 - Volcanic cavern
  | 'ocean';     // Level 6 - Underwater

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
  | 'embers'
  | 'bubbles';

export interface GameState {
  currentLevel: number;
  lives: number;
  score: number;
  gameStatus: MenuState;
}

export type MenuState =
  | 'mainMenu'
  | 'levelSelect'
  | 'customLevels'
  | 'settings'
  | 'skins'
  | 'playing'
  | 'practice'
  | 'endless'
  | 'paused'
  | 'levelComplete'
  | 'gameOver'
  | 'editor'
  | 'editorTest';

export interface SaveData {
  totalPoints: number;
  unlockedLevels: number[];
  unlockedSkins: string[];
  highScores: Record<number, number>;
  endlessHighScore: number;
  settings: GameSettings;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  selectedSkin: string;
}

export interface PlayerSkin {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  eyeColor: string;
  trailColor: string;
  cost: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
  dash: boolean;
  dashPressed: boolean;
}

// Custom Level Builder Types
export interface CustomLevel {
  id: string;
  name: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  bpm: number;
  background: BackgroundConfig;
  playerStart: Vector2;
  goal: Rectangle;
  platforms: PlatformConfig[];
  coins: CoinConfig[];
}

export interface EditorState {
  selectedTool: EditorTool;
  selectedPlatformType: PlatformType;
  gridSize: number;
  showGrid: boolean;
  selectedElement: SelectedElement | null;
  cameraX: number;
  zoom: number;
  isDragging: boolean;
  dragStart: Vector2 | null;
}

export type EditorTool =
  | 'select'
  | 'platform'
  | 'coin'
  | 'playerStart'
  | 'goal'
  | 'delete'
  | 'pan';

export interface SelectedElement {
  type: 'platform' | 'coin' | 'playerStart' | 'goal';
  index: number;
}

export interface EditorAction {
  type: 'add' | 'remove' | 'modify';
  elementType: 'platform' | 'coin' | 'playerStart' | 'goal' | 'background';
  before: unknown;
  after: unknown;
}
