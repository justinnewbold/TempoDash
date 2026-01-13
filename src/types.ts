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
  conveyorSpeed?: number;  // Speed for conveyor (-1 to 1, negative = left)
}

export type PlatformType =
  | 'solid'      // Normal platform
  | 'bounce'     // Bouncy platform
  | 'crumble'    // Crumbles after touching
  | 'moving'     // Moving platform
  | 'ice'        // Slippery platform
  | 'lava'       // Deadly platform
  | 'phase'      // Phases in and out
  | 'spike'      // Deadly spike obstacle
  | 'conveyor'   // Moves player horizontally while standing
  | 'gravity'    // Flips player gravity on contact
  | 'sticky'     // Player sticks until jump pressed
  | 'glass'      // Breaks after 2nd landing
  | 'slowmo'     // Slows down time while player is in zone
  | 'wall'       // Vertical wall for wall-jumping
  | 'secret';    // Hidden platform revealed on proximity

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

export type PowerUpType = 'shield' | 'magnet' | 'slowmo' | 'doublePoints';

export interface PowerUpConfig {
  type: PowerUpType;
  x: number;
  y: number;
}

export interface ChaseConfig {
  enabled: boolean;
  initialDelay?: number;
  baseSpeed?: number;
  accelerationRate?: number;
}

export interface CheckpointConfig {
  x: number;
  y: number;
  name?: string;  // Optional section name for practice mode
}

export interface LevelConfig {
  id: number;
  name: string;
  platforms: PlatformConfig[];
  coins?: CoinConfig[];
  powerUps?: PowerUpConfig[];
  playerStart: Vector2;
  goal: Rectangle;
  background: BackgroundConfig;
  music?: string;
  chaseMode?: ChaseConfig;  // Optional chase mode (wall of death)
  checkpoints?: CheckpointConfig[];  // Mid-level checkpoints
  totalCoins?: number;  // For star calculation (auto-counted if not set)
  bpm?: number;  // Beats per minute for beat visualization
  flyingMode?: boolean;  // Flying mode - player flies and avoids obstacles
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
  | 'ocean'      // Level 6 - Underwater
  | 'inferno'    // Level 9 - Chase level (wall of death)
  | 'sky';       // Level 10 - Flying level (sky clouds)

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
  | 'challenges'
  | 'playing'
  | 'practice'
  | 'endless'
  | 'challengePlaying'
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
  levelStars: Record<number, number>; // levelId -> stars earned (1-3)
  levelDeaths: Record<number, number>; // levelId -> best run death count
  bestTimes: Record<number, number>; // levelId -> best completion time (ms)
  ghostRuns: Record<number, GhostFrame[]>; // levelId -> ghost data
  totalDeaths: number;
  totalCoinsCollected: number;
  totalLevelsCompleted: number;
  totalPlayTime: number; // in milliseconds
  longestCombo: number;
}

// Ghost replay frame
export interface GhostFrame {
  x: number;
  y: number;
  rotation: number;
  time: number;
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
  // New achievements
  { id: 'endless_1000', name: 'Legendary', description: 'Reach 1000m in endless mode', icon: '🏅' },
  { id: 'combo_20', name: 'Combo Legend', description: 'Get a 20 coin combo', icon: '🌈' },
  { id: 'wall_master', name: 'Wall Runner', description: 'Wall jump 50 times', icon: '🧗' },
  { id: 'shield_saver', name: 'Shield Saver', description: 'Get saved by a shield 10 times', icon: '🛡️' },
  { id: 'near_miss_pro', name: 'Daredevil', description: 'Get 50 near misses', icon: '😱' },
  { id: 'challenge_streak', name: 'Challenger', description: 'Complete 7 daily challenges in a row', icon: '📅' },
  { id: 'gravity_flipper', name: 'Gravity Master', description: 'Use gravity platforms 25 times', icon: '🔄' },
  { id: 'ice_skater', name: 'Ice Skater', description: 'Slide on ice for 500m total', icon: '⛸️' },
  { id: 'conveyor_rider', name: 'Conveyor Pro', description: 'Ride conveyors for 200m total', icon: '🏭' },
  { id: 'power_collector', name: 'Power Hungry', description: 'Collect 100 power-ups', icon: '✨', secret: true },
];

export type ColorblindMode = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  selectedSkin: string;
  tutorialShown: boolean;
  // Accessibility options
  colorblindMode: ColorblindMode;
  reducedMotion: boolean;
  hapticFeedback: boolean;
  reduceFlash: boolean;  // Reduce screen flash effects (death/power-up)
  showGhost: boolean;    // Show ghost replay in levels
  highContrast: boolean; // High contrast mode for better visibility
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
  powerUps?: PowerUpConfig[];
  flyingMode?: boolean;
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
