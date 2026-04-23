// Geometry primitives shared by every entity on both platforms.
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

// Superset of platform kinds; mobile ignores types it has not implemented yet.
export type PlatformType =
  | 'solid'
  | 'bounce'
  | 'crumble'
  | 'moving'
  | 'ice'
  | 'lava'
  | 'phase'
  | 'spike'
  | 'conveyor'
  | 'gravity'
  | 'sticky'
  | 'glass'
  | 'slowmo'
  | 'wall'
  | 'secret'
  | 'wind';

export interface MovePattern {
  type: 'horizontal' | 'vertical' | 'circular';
  distance: number;
  speed: number;
  startOffset?: number;
}

export interface CoinConfig {
  x: number;
  y: number;
  isMagnet?: boolean;
}

export type GemType = 'ruby' | 'sapphire' | 'emerald';

export interface GemConfig {
  x: number;
  y: number;
  type: GemType;
}

export type PowerUpType = 'shield' | 'magnet' | 'slowmo' | 'doublePoints';

export interface PowerUpConfig {
  type: PowerUpType;
  x: number;
  y: number;
}

// Recorded player pose sample for ghost playback.
export interface GhostFrame {
  x: number;
  y: number;
  rotation: number;
  time: number;
}
