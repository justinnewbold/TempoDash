export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const PLAYER = {
  WIDTH: 32,
  HEIGHT: 48,
  SPEED: 300,
  JUMP_FORCE: 520,
  GRAVITY: 1200,
  MAX_FALL_SPEED: 800,
  BOUNCE_MULTIPLIER: 1.5,
  ICE_FRICTION: 0.98,
  NORMAL_FRICTION: 0.85,
  AIR_CONTROL: 0.6,
  COYOTE_TIME: 100,
  JUMP_BUFFER: 150,
};

export const PLATFORM = {
  CRUMBLE_DELAY: 500,
  CRUMBLE_DURATION: 300,
  PHASE_ON_TIME: 2000,
  PHASE_OFF_TIME: 1500,
  CONVEYOR_SPEED: 150,
  LOW_GRAVITY_MULTIPLIER: 0.4,
  WIND_INTERVAL: 3000,
  WIND_DURATION: 1000,
  LIGHTNING_ON_TIME: 2500,
  LIGHTNING_OFF_TIME: 800,
  CLOUD_SINK_SPEED: 80,
  CLOUD_MAX_SINK: 60,
  SPEED_BOOST_FORCE: 600,
  GLITCH_INTERVAL: 500,
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
    conveyor: '#718096',
    lowgravity: '#9f7aea',
    reverse: '#ed64a6',
    wind: '#48bb78',
    lightning: '#ecc94b',
    cloud: '#e2e8f0',
    teleporter: '#38b2ac',
    speedboost: '#f6e05e',
    glitch: '#fc8181',
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

  // Level 3 - Crystal Caverns
  LEVEL3: {
    primary: '#1a0a2e',
    secondary: '#2d1b4e',
    accent: '#00ffff',
    highlight: '#ff00ff',
    crystal: '#7c3aed',
    glow: '#a78bfa',
  },

  // Level 4 - Zero-G Station
  LEVEL4: {
    primary: '#0a0a1a',
    secondary: '#0f0f2a',
    accent: '#3b82f6',
    highlight: '#60a5fa',
    nebula: '#8b5cf6',
    stars: '#fbbf24',
  },

  // Level 5 - Storm Surge
  LEVEL5: {
    primary: '#1a1a2e',
    secondary: '#2d2d4a',
    accent: '#fbbf24',
    highlight: '#f59e0b',
    lightning: '#fef08a',
    cloud: '#6b7280',
  },

  // Level 6 - Digital Realm
  LEVEL6: {
    primary: '#001a00',
    secondary: '#002200',
    accent: '#00ff00',
    highlight: '#22c55e',
    circuit: '#14532d',
    data: '#4ade80',
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
