import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game dimensions - portrait mode, vertical scrolling
export const GAME = {
  WIDTH: SCREEN_WIDTH,
  HEIGHT: SCREEN_HEIGHT,
  // Visible game area (excluding UI)
  PLAY_AREA_TOP: 100, // Space for score/UI at top
  PLAY_AREA_BOTTOM: 150, // Space for controls hint at bottom
};

// Player constants - adjusted for vertical scrolling
export const PLAYER = {
  SIZE: 44, // Square player
  SCROLL_SPEED: 300, // Auto-scroll speed upward (pixels per second)
  JUMP_FORCE: 650, // Initial jump velocity
  GRAVITY: 2200, // Gravity acceleration
  MAX_FALL_SPEED: 900, // Terminal velocity
  BOUNCE_MULTIPLIER: 1.4, // Bounce platform multiplier
  ROTATION_SPEED: 400, // Degrees per second when in air
  // Player stays in bottom 1/3 of screen, world scrolls down
  SCREEN_Y_POSITION: SCREEN_HEIGHT * 0.65,
};

// Platform constants
export const PLATFORM = {
  CRUMBLE_DELAY: 400,
  CRUMBLE_DURATION: 250,
  PHASE_ON_TIME: 1800,
  PHASE_OFF_TIME: 1200,
};

// Colors - dark theme for mobile
export const COLORS = {
  BACKGROUND: '#0a0a1a',
  BACKGROUND_GRADIENT: ['#0a0a1a', '#1a1a2e', '#16213e'],

  PLAYER: {
    primary: '#00ffaa',
    secondary: '#00cc88',
    glow: '#00ffaa',
    trail: 'rgba(0, 255, 170, 0.3)',
  },

  PLATFORM: {
    solid: '#4a5568',
    solidHighlight: '#5a6a7a',
    bounce: '#f6ad55',
    bounceHighlight: '#ffc107',
    crumble: '#a0522d',
    moving: '#4fc3f7',
    spike: '#ffffff',
    phase: '#b794f4',
  },

  COIN: {
    primary: '#ffd700',
    highlight: '#ffed4a',
    border: '#daa520',
  },

  UI: {
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    accent: '#00ffaa',
    danger: '#ff4757',
    success: '#2ed573',
    card: 'rgba(255, 255, 255, 0.1)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
  },

  GOAL: '#ffd700',
};

// Animation timings
export const ANIMATION = {
  MENU_TRANSITION: 300,
  BUTTON_PRESS: 100,
  DEATH_DELAY: 800,
  LEVEL_COMPLETE_DELAY: 1000,
};

// Haptic patterns
export const HAPTICS = {
  JUMP: 'light' as const,
  LAND: 'light' as const,
  COIN: 'light' as const,
  BOUNCE: 'medium' as const,
  DEATH: 'heavy' as const,
  BUTTON: 'light' as const,
  SUCCESS: 'success' as const,
};
