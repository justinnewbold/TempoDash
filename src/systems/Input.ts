import { InputState } from '../types';
import { TOUCH_ZONES } from '../config/UIConstants';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

// UI exclusion zone (area where touches should not trigger game input)
interface ExclusionZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class InputManager {
  private state: InputState = {
    jump: false,
    jumpPressed: false,
    dash: false,
    dashPressed: false,
  };

  private previousJump = false;
  private previousDash = false;
  private canvas: HTMLCanvasElement | null = null;
  private isMobile = false;
  private hapticEnabled = true;

  // UI exclusion zones - touches in these areas don't trigger game input
  private exclusionZones: ExclusionZone[] = [];
  // Callback for when a touch is in an exclusion zone (for UI handling)
  private onExcludedTouch: ((x: number, y: number) => void) | null = null;

  constructor() {
    this.isMobile = this.detectMobile();
    this.setupListeners();
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window);
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupCanvasListeners();
  }

  setHapticEnabled(enabled: boolean): void {
    this.hapticEnabled = enabled;
  }

  // Set UI exclusion zones where touches should NOT trigger game input
  setExclusionZones(zones: ExclusionZone[]): void {
    this.exclusionZones = zones;
  }

  // Set callback for when touch is in exclusion zone
  setExcludedTouchCallback(callback: ((x: number, y: number) => void) | null): void {
    this.onExcludedTouch = callback;
  }

  // Check if a point is within any exclusion zone
  private isInExclusionZone(gameX: number, gameY: number): boolean {
    for (const zone of this.exclusionZones) {
      if (gameX >= zone.x && gameX <= zone.x + zone.width &&
          gameY >= zone.y && gameY <= zone.y + zone.height) {
        return true;
      }
    }
    return false;
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('blur', () => this.resetAll());
  }

  private setupCanvasListeners(): void {
    if (!this.canvas) return;

    // Mouse click for jump
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.state.jump = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.state.jump = false;
    });

    // Touch support for mobile with zone detection
    this.canvas.addEventListener('touchstart', (e) => {
      // Check if any touch is in an exclusion zone
      const hasExcludedTouch = this.handleTouchStart(e);
      // Only prevent default if no touches were in exclusion zones
      if (!hasExcludedTouch) {
        e.preventDefault();
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      // Check if any touch was in exclusion zone
      const hasExcludedTouch = this.handleTouchEnd(e);
      if (!hasExcludedTouch) {
        e.preventDefault();
      }
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', () => {
      this.state.jump = false;
      this.state.dash = false;
    });
  }

  private handleTouchStart(e: TouchEvent): boolean {
    if (!this.canvas) return false;

    const canvasRect = this.canvas.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    let hasExcludedTouch = false;

    // Check each touch point
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const touchX = touch.clientX - canvasRect.left;
      const touchY = touch.clientY - canvasRect.top;

      // Convert to game coordinates
      const gameX = (touchX / canvasWidth) * GAME_WIDTH;
      const gameY = (touchY / canvasHeight) * GAME_HEIGHT;

      // Check if touch is in an exclusion zone (UI button area)
      if (this.isInExclusionZone(gameX, gameY)) {
        hasExcludedTouch = true;
        // Call the callback for UI handling
        if (this.onExcludedTouch) {
          this.onExcludedTouch(gameX, gameY);
        }
        continue; // Skip this touch for game input
      }

      const relativeX = touchX / canvasWidth;

      // Left zone (35% of screen) = dash
      if (relativeX < TOUCH_ZONES.LEFT_ZONE_WIDTH) {
        this.state.dash = true;
        this.triggerHaptic('light');
      } else {
        // Right zone (65% of screen) = jump
        this.state.jump = true;
        this.triggerHaptic('medium');
      }
    }

    return hasExcludedTouch;
  }

  private handleTouchEnd(e: TouchEvent): boolean {
    if (!this.canvas) return false;

    const canvasRect = this.canvas.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    // Check if any ended touch was in an exclusion zone
    let hasExcludedTouch = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchX = touch.clientX - canvasRect.left;
      const touchY = touch.clientY - canvasRect.top;
      const gameX = (touchX / canvasWidth) * GAME_WIDTH;
      const gameY = (touchY / canvasHeight) * GAME_HEIGHT;

      if (this.isInExclusionZone(gameX, gameY)) {
        hasExcludedTouch = true;
      }
    }

    // If no touches remain, reset both states
    if (e.touches.length === 0) {
      this.state.jump = false;
      this.state.dash = false;
      return hasExcludedTouch;
    }

    // Check remaining touches to determine which states should stay active
    let hasLeftTouch = false;
    let hasRightTouch = false;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const touchX = touch.clientX - canvasRect.left;
      const touchY = touch.clientY - canvasRect.top;
      const gameX = (touchX / canvasWidth) * GAME_WIDTH;
      const gameY = (touchY / canvasHeight) * GAME_HEIGHT;

      // Skip touches in exclusion zones
      if (this.isInExclusionZone(gameX, gameY)) {
        continue;
      }

      const relativeX = touchX / canvasWidth;

      if (relativeX < TOUCH_ZONES.LEFT_ZONE_WIDTH) {
        hasLeftTouch = true;
      } else {
        hasRightTouch = true;
      }
    }

    this.state.dash = hasLeftTouch;
    this.state.jump = hasRightTouch;

    return hasExcludedTouch;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        e.preventDefault(); // Prevent page scroll
        this.state.jump = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.dash = true;
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.state.jump = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.dash = false;
        break;
    }
  }

  private resetAll(): void {
    this.state.jump = false;
    this.state.jumpPressed = false;
    this.state.dash = false;
    this.state.dashPressed = false;
  }

  // Trigger haptic feedback (vibration) on supported devices
  triggerHaptic(intensity: 'light' | 'medium' | 'heavy' = 'medium'): void {
    if (!this.hapticEnabled || !this.isMobile) return;
    if (!('vibrate' in navigator)) return;

    try {
      const durations = {
        light: 10,
        medium: 25,
        heavy: 50,
      };
      navigator.vibrate(durations[intensity]);
    } catch {
      // Vibration not supported or blocked
    }
  }

  // Trigger haptic pattern for special events
  triggerHapticPattern(pattern: number[]): void {
    if (!this.hapticEnabled || !this.isMobile) return;
    if (!('vibrate' in navigator)) return;

    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration not supported or blocked
    }
  }

  update(): InputState {
    this.state.jumpPressed = this.state.jump && !this.previousJump;
    this.state.dashPressed = this.state.dash && !this.previousDash;
    this.previousJump = this.state.jump;
    this.previousDash = this.state.dash;
    return { ...this.state };
  }

  getState(): InputState {
    return { ...this.state };
  }

  // Check if running on mobile
  isMobileDevice(): boolean {
    return this.isMobile;
  }
}
