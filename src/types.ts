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
  phaseOffset?: number;
  phaseGroup?: number;
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
  | 'achievements'
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
  // New tracking fields
  achievements: string[];
  levelCoins: Record<number, number>; // levelId -> coins collected (max)
  totalDeaths: number;
  totalCoinsCollected: number;
  totalLevelsCompleted: number;
  totalPlayTime: number; // in milliseconds
  longestCombo: number;
}

// Achievement definitions
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  secret?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_death', name: 'First Steps', description: 'Die for the first time', icon: '💀' },
  { id: 'first_clear', name: 'Victory!', description: 'Complete your first level', icon: '🏆' },
  { id: 'perfect_level', name: 'Perfectionist', description: 'Complete a level without dying', icon: '⭐' },
  { id: 'all_coins_level', name: 'Coin Collector', description: 'Collect all coins in a level', icon: '🪙' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Use dash 50 times', icon: '⚡' },
  { id: 'bouncy', name: 'Bouncy', description: 'Bounce 100 times on bounce platforms', icon: '🦘' },
  { id: 'survivor', name: 'Survivor', description: 'Die 100 times and keep playing', icon: '💪' },
  { id: 'endless_50', name: 'Endurance', description: 'Reach 50m in endless mode', icon: '🏃' },
  { id: 'endless_100', name: 'Marathon', description: 'Reach 100m in endless mode', icon: '🎖️' },
  { id: 'endless_500', name: 'Unstoppable', description: 'Reach 500m in endless mode', icon: '🌟' },
  { id: 'combo_5', name: 'Combo Starter', description: 'Get a 5 coin combo', icon: '🔥' },
  { id: 'combo_10', name: 'Combo Master', description: 'Get a 10 coin combo', icon: '💥' },
  { id: 'all_levels', name: 'Champion', description: 'Complete all levels', icon: '👑' },
  { id: 'all_skins', name: 'Fashionista', description: 'Unlock all skins', icon: '🎨' },
  { id: 'level_creator', name: 'Creator', description: 'Create a custom level', icon: '🛠️' },
  { id: 'dedicated', name: 'Dedicated', description: 'Play for 1 hour total', icon: '⏰', secret: true },
];

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  selectedSkin: string;
  tutorialShown: boolean;
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
