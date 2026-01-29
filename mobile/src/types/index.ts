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
  conveyorSpeed?: number;
}

export type PlatformType =
  | 'solid'
  | 'bounce'
  | 'crumble'
  | 'moving'
  | 'spike'
  | 'phase'
  | 'conveyor'
  | 'gravity'
  | 'sticky'
  | 'glass'
  | 'slowmo'
  | 'wall'
  | 'secret'
  | 'ice'
  | 'lava';

export interface MovePattern {
  type: 'horizontal' | 'vertical' | 'circular';
  distance: number;
  speed: number;
  startOffset?: number;
}

export type PowerUpType = 'shield' | 'magnet' | 'slowmo' | 'doublePoints';

export interface PowerUpConfig {
  x: number;
  y: number;
  type: PowerUpType;
}

export interface CoinConfig {
  x: number;
  y: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  platforms: PlatformConfig[];
  coins: CoinConfig[];
  powerUps?: PowerUpConfig[];
  playerStart: Vector2;
  goalY: number; // Y position of goal line (top of level)
  backgroundColor: string;
  accentColor: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface GameState {
  score: number;
  coinsCollected: number;
  isPlaying: boolean;
  isDead: boolean;
  isComplete: boolean;
  combo: number;
  maxCombo: number;
  scoreMultiplier: number;
  activePowerUp: PowerUpType | null;
  powerUpTimeRemaining: number;
  hasShield: boolean;
}

export interface SaveData {
  totalPoints: number;
  unlockedLevels: number[];
  highScores: Record<number, number>;
  endlessHighScore: number;
  settings: GameSettings;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  hapticFeedback: boolean;
  reducedMotion: boolean;
}

export interface PlayerSkin {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
}

export const DEFAULT_SKIN: PlayerSkin = {
  id: 'default',
  name: 'Cyan Cube',
  primaryColor: '#00ffaa',
  secondaryColor: '#00cc88',
  glowColor: '#00ffaa',
};
