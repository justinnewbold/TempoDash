import type {
  Vector2,
  Rectangle,
  PlatformType,
  MovePattern,
  CoinConfig,
  PowerUpType,
  PowerUpConfig,
} from '../../../packages/core';

export type {
  Vector2,
  Rectangle,
  PlatformType,
  MovePattern,
  CoinConfig,
  PowerUpType,
  PowerUpConfig,
};

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
