// Centralized UI constants for consistent styling and layout

// Button dimensions
export const UI_BUTTONS = {
  MENU_BUTTON: {
    width: 200,
    height: 50,
  },
  SMALL_BUTTON: {
    width: 100,
    height: 40,
  },
  BACK_BUTTON: {
    x: 20,
    y: 20,
    width: 100,
    height: 40,
  },
};

// Main menu button positions (Y coordinates)
export const MAIN_MENU_LAYOUT = {
  TITLE_Y: 130,
  POINTS_Y: 220,
  ENDLESS_HIGH_Y: 242,
  PLAY_BUTTON_Y: 260,
  ENDLESS_BUTTON_Y: 318,
  EDITOR_BUTTON_Y: 378,
  CUSTOM_LEVELS_BUTTON_Y: 378,
  SKINS_BUTTON_Y: 438,
  ACHIEVEMENTS_BUTTON_Y: 438,
  SETTINGS_BUTTON_Y: 498,
  CONTROLS_HINT_Y: 540,
  BUTTON_OFFSET_X: 55, // Offset for side-by-side buttons
};

// Level select layout
export const LEVEL_SELECT_LAYOUT = {
  CARD_WIDTH: 130,
  CARD_HEIGHT: 190,
  CARD_GAP: 25,
  CARD_Y: 180,
  DOT_SIZE: 6,
  DOT_GAP: 20,
};

// Settings layout
export const SETTINGS_LAYOUT = {
  SLIDER_WIDTH: 250,
  SLIDER_HEIGHT: 20,
  TOGGLE_WIDTH: 60,
  TOGGLE_HEIGHT: 30,
  MUSIC_VOLUME_Y: 200,
  SFX_VOLUME_Y: 290,
  SCREEN_SHAKE_Y: 385,
  COLORBLIND_Y: 455,
  REDUCED_MOTION_Y: 525,
};

// Skins layout
export const SKINS_LAYOUT = {
  CARD_WIDTH: 140,
  CARD_HEIGHT: 160,
  COLS: 3,
  GAP: 30,
  START_Y: 140,
  PREVIEW_SIZE: 50,
};

// Achievements layout
export const ACHIEVEMENTS_LAYOUT = {
  CARD_WIDTH: 170,
  CARD_HEIGHT: 85,
  COLS: 4,
  GAP: 15,
  START_Y: 125,
};

// Playing UI layout
export const PLAYING_UI = {
  PROGRESS_BAR: {
    width: 300,
    height: 6,
    y: 15,
  },
  PERCENTAGE_Y: 38,
  LEVEL_NAME_Y: 28,
  ATTEMPT_Y: 48,
  PRACTICE_ATTEMPT_Y: 62,
  SPEED_Y_OFFSET: 16, // Added below attempt
  COINS_Y: 28,
  BEAT_INDICATOR: {
    x: 30, // From right edge
    y: 30, // From bottom edge
    radius: 15,
  },
};

// Combo display
export const COMBO_DISPLAY = {
  BASE_FONT_SIZE: 28,
  Y_POSITION: 80,
  DISPLAY_DURATION: 500, // ms
  SCALE_FACTOR: 0.3,
};

// Animation timing
export const ANIMATION_TIMING = {
  COMBO_DURATION: 1500, // ms to maintain combo
  DEATH_FLASH_DURATION: 300, // ms
  ACHIEVEMENT_NOTIFICATION_DURATION: 3000, // ms
  ORIENTATION_HINT_DURATION: 3000, // ms
  CHECKPOINT_FEEDBACK_DURATION: 500, // ms
};

// Touch zones for mobile (as percentage of screen width)
export const TOUCH_ZONES = {
  LEFT_ZONE_WIDTH: 0.35, // 35% of screen for dash
  RIGHT_ZONE_WIDTH: 0.65, // 65% of screen for jump
};

// Speed indicator thresholds
export const SPEED_THRESHOLDS = {
  WARNING: 0.10, // Orange at 10%
  DANGER: 0.20, // Red at 20%
  MAX: 0.50, // Cap at 50%
};

// Colors
export const UI_COLORS = {
  PRIMARY: '#00ffff',
  SECONDARY: '#ff00ff',
  ACCENT: '#ffd700',
  SUCCESS: '#00ffaa',
  WARNING: '#ffaa00',
  DANGER: '#ff4444',
  TEXT: '#ffffff',
  TEXT_DIM: 'rgba(255, 255, 255, 0.7)',
  TEXT_FAINT: 'rgba(255, 255, 255, 0.5)',
  OVERLAY: 'rgba(0, 0, 0, 0.8)',
  SPEED_SAFE: '#00ffaa',
  SPEED_WARNING: '#ffaa00',
  SPEED_DANGER: '#ff4444',
};

// Accessibility color palettes
export const COLORBLIND_PALETTES = {
  normal: {
    solid: '#4a9eff',
    bounce: '#ff6b9d',
    ice: '#88ddff',
    lava: '#ff4400',
    spike: '#ff0000',
    moving: '#9966ff',
    phase: '#66ffaa',
    crumble: '#aa8866',
  },
  deuteranopia: {
    solid: '#4a9eff',
    bounce: '#ffb347',
    ice: '#88ddff',
    lava: '#ff6b6b',
    spike: '#ffffff',
    moving: '#a0a0ff',
    phase: '#87ceeb',
    crumble: '#d2691e',
  },
  protanopia: {
    solid: '#4a9eff',
    bounce: '#ffd700',
    ice: '#88ddff',
    lava: '#ff6b6b',
    spike: '#ffffff',
    moving: '#a0a0ff',
    phase: '#87ceeb',
    crumble: '#d2691e',
  },
  tritanopia: {
    solid: '#ff6b9d',
    bounce: '#00ffaa',
    ice: '#ffb6c1',
    lava: '#ff4500',
    spike: '#ffffff',
    moving: '#ff69b4',
    phase: '#98fb98',
    crumble: '#daa520',
  },
};

export type ColorblindMode = keyof typeof COLORBLIND_PALETTES;
