export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const PLAYER = {
  WIDTH: 40,
  HEIGHT: 40,
  SPEED: 350, // Auto-scroll speed (pixels per second)
  JUMP_FORCE: 600,
  GRAVITY: 2000,
  MAX_FALL_SPEED: 1000,
  BOUNCE_MULTIPLIER: 1.3,
  ROTATION_SPEED: 360, // Degrees per second when in air

  // Air jumps
  MAX_AIR_JUMPS: 4, // Can perform four air jumps (5 total jumps)
  JUMP_MULTIPLIERS: [1.0, 1.275, 0.7, 1.5, 0.5] as readonly number[], // Per-jump force multipliers

  // Dash
  DASH_DURATION: 225, // ms
  DASH_SPEED_MULT: 2.5,

  // Wall mechanics
  WALL_SLIDE_SPEED: 100,
  WALL_JUMP_COOLDOWN: 200, // ms

  // Boomerang bounce
  BOOMERANG_INITIAL_VELOCITY: -350,
  BOOMERANG_RETURN_ACCEL: 400,
  BOOMERANG_WINDOW: 800, // ms
  RESCUE_DASH_SPEED: 500,

  // Input buffering
  COYOTE_TIME: 80, // ms grace period after leaving platform
  JUMP_BUFFER_TIME: 100, // ms early jump press remembered

  // Flying mode
  FLYING_LIFT_FORCE: 800,
  FLYING_GRAVITY: 600,
  FLYING_MAX_UP: -400,
  FLYING_MAX_DOWN: 400,
  FLYING_TILT_DIVISOR: 400,
  FLYING_TILT_MAX: 30, // degrees

  // Conveyor
  CONVEYOR_BASE_SPEED: 150, // px/s
};

export const PLATFORM = {
  CRUMBLE_DELAY: 500,
  CRUMBLE_DURATION: 300,
  PHASE_ON_TIME: 2000,
  PHASE_OFF_TIME: 1500,
  BEAT_SOLID_WINDOW: 0.4,
  SECRET_REVEAL_DISTANCE: 150,
  GLASS_HITS_TO_BREAK: 2,
  WIND_DEFAULT_STRENGTH: 300,  // Default wind force in px/s²
};

import { SCORING_DEFAULTS } from '../packages/core';

// Scoring constants - gameplay values re-exported from @tempodash/core so mobile shares them.
export const SCORING = {
  BASE_LEVEL_SCORE: SCORING_DEFAULTS.BASE_LEVEL_SCORE,
  ATTEMPT_PENALTY: SCORING_DEFAULTS.ATTEMPT_PENALTY,
  COIN_BONUS: SCORING_DEFAULTS.COIN_BONUS,
  MIN_LEVEL_SCORE: SCORING_DEFAULTS.MIN_LEVEL_SCORE,

  GEM_RUBY: SCORING_DEFAULTS.GEM_RUBY,
  GEM_SAPPHIRE: SCORING_DEFAULTS.GEM_SAPPHIRE,
  GEM_EMERALD: SCORING_DEFAULTS.GEM_EMERALD,

  COMBO_DURATION: SCORING_DEFAULTS.COMBO_DURATION,
  NEAR_MISS_DURATION: 500, // ms for near miss window - web-only
  CHALLENGE_COMPLETE_DISTANCE: 500, // meters - web-only
};

// Timing constants
export const TIMING = {
  DEATH_RESPAWN_DELAY: 500, // ms before respawn
  ACHIEVEMENT_NOTIFICATION: 3000, // ms
  ENCOURAGEMENT_DURATION: 3000, // ms
  MILESTONE_DURATION: 1500, // ms
  QUICK_RESTART_HOLD: 300, // ms to hold for restart
  CHECKPOINT_FEEDBACK: 500, // ms

  // Beat sync
  BEAT_PERFECT_WINDOW: 50, // ms
  BEAT_GOOD_WINDOW: 150, // ms

  // Assist mode
  ASSIST_OFFER_DEATHS: 5,
};

// Speed system constants
export const SPEED = {
  INCREASE_PER_JUMP: 0.01,
  MAX_MULTIPLIER: 3.0,
  INITIAL: 1.0,
};

export const COLORS = {
  PLAYER: '#00ffaa',
  PLAYER_TRAIL: 'rgba(0, 255, 170, 0.3)',

  // Platform colors by type
  PLATFORM: {
    solid: '#4a5568',
    bounce: '#f6ad55',
    crumble: '#fc8181',
    moving: '#63b3ed',
    ice: '#90cdf4',
    lava: '#f56565',
    phase: '#b794f4',
    spike: '#ffffff',
    conveyor: '#48bb78',   // Green - industrial feel
    gravity: '#ed64a6',    // Pink - magical/gravity
    sticky: '#ecc94b',     // Yellow - sticky/honey
    glass: '#e2e8f0',      // Light gray - transparent glass
    slowmo: '#00c8ff',     // Cyan - time warp
    wall: '#718096',       // Dark gray - metallic wall
    secret: '#ffd700',     // Gold - hidden treasure
    wind: '#7ec8e3',       // Light blue - airy wind
  },

  // Level 1 - City Night
  LEVEL1: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#0f3460',
    highlight: '#e94560',
  },

  // Level 2 - Neon Synthwave
  LEVEL2: {
    primary: '#0d0221',
    secondary: '#1a0533',
    accent: '#ff00ff',
    highlight: '#00ffff',
    grid: '#ff0080',
    sun: '#ff6b00',
  },

  GOAL: '#ffd700',
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
};

export const ANIMATION = {
  PARTICLE_COUNT: 50,
  STAR_COUNT: 100,
  GRID_SPACING: 50,
  WAVE_AMPLITUDE: 20,
  WAVE_FREQUENCY: 0.02,
  PULSE_SPEED: 0.002,
  AURORA_BANDS: 5,
};
