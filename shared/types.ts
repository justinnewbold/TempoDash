/**
 * Shared types used by both web and mobile platforms.
 * Import from this file instead of duplicating types across codebases.
 */

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
  | 'secret';

export interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  movePattern?: MovePattern;
  phaseOffset?: number;
  phaseGroup?: number;
  conveyorSpeed?: number;
}

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

/** Ghost replay frame for recording/playback */
export interface GhostFrame {
  x: number;
  y: number;
  rotation: number;
  time: number;
}

/** Game state common to both platforms */
export interface BaseGameState {
  score: number;
  isPlaying: boolean;
  isDead: boolean;
  isComplete: boolean;
  combo: number;
  maxCombo: number;
  scoreMultiplier: number;
}

/** Accessibility settings shared across platforms */
export interface AccessibilitySettings {
  colorblindMode: 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  reducedMotion: boolean;
  hapticFeedback: boolean;
  reduceFlash: boolean;
  highContrast: boolean;
  screenReaderAnnouncements: boolean;
}
