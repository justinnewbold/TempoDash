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

/** Default key bindings */
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  jump: ['ArrowUp', 'KeyW', 'Space'],
  dash: ['ShiftLeft', 'ShiftRight'],
};

/** Key binding configuration */
export interface KeyBindings {
  jump: string[];
  dash: string[];
}

export class InputManager {
  private state: InputState = {
    jump: false,
    jumpPressed: false,
    dash: false,
    dashPressed: false,
  };

  // Configurable key bindings
  private keyBindings: KeyBindings = { ...DEFAULT_KEY_BINDINGS };

  private previousJump = false;
  private previousDash = false;
  private canvas: HTMLCanvasElement | null = null;
  private isMobile = false;
  private hapticEnabled = true;

  // Gamepad state tracking (for proper button release detection)
  private gamepadJumpWasPressed = false;
  private gamepadDashWasPressed = false;

  // UI exclusion zones - touches in these areas don't trigger game input
  private exclusionZones: ExclusionZone[] = [];
  // Callback for when a touch is in an exclusion zone (for UI handling)
  private onExcludedTouch: ((x: number, y: number) => void) | null = null;

  // Bound event handlers for cleanup
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundBlur: () => void;
  private boundMouseDown: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: (() => void) | null = null;
  private boundTouchStart: ((e: TouchEvent) => void) | null = null;
  private boundTouchEnd: ((e: TouchEvent) => void) | null = null;
  private boundTouchCancel: (() => void) | null = null;

  constructor() {
    this.isMobile = this.detectMobile();

    // Bind handlers once for cleanup
    this.boundKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.boundKeyUp = (e: KeyboardEvent) => this.handleKeyUp(e);
    this.boundBlur = () => this.resetAll();

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
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
  }

  private setupCanvasListeners(): void {
    if (!this.canvas) return;

    // Create bound handlers for canvas events
    this.boundMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      this.state.jump = true;
    };
    this.boundMouseUp = () => {
      this.state.jump = false;
    };
    this.boundTouchStart = (e: TouchEvent) => {
      const hasExcludedTouch = this.handleTouchStart(e);
      if (!hasExcludedTouch) {
        e.preventDefault();
      }
    };
    this.boundTouchEnd = (e: TouchEvent) => {
      const hasExcludedTouch = this.handleTouchEnd(e);
      if (!hasExcludedTouch) {
        e.preventDefault();
      }
    };
    this.boundTouchCancel = () => {
      this.state.jump = false;
      this.state.dash = false;
    };

    // Add listeners with bound handlers
    this.canvas.addEventListener('mousedown', this.boundMouseDown);
    this.canvas.addEventListener('mouseup', this.boundMouseUp);
    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.boundTouchCancel);
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

  /** Set custom key bindings */
  setKeyBindings(bindings: Partial<KeyBindings>): void {
    if (bindings.jump) this.keyBindings.jump = [...bindings.jump];
    if (bindings.dash) this.keyBindings.dash = [...bindings.dash];
  }

  /** Get current key bindings */
  getKeyBindings(): KeyBindings {
    return { jump: [...this.keyBindings.jump], dash: [...this.keyBindings.dash] };
  }

  /** Reset key bindings to defaults */
  resetKeyBindings(): void {
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS };
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.keyBindings.jump.includes(e.code)) {
      e.preventDefault();
      this.state.jump = true;
    } else if (this.keyBindings.dash.includes(e.code)) {
      this.state.dash = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (this.keyBindings.jump.includes(e.code)) {
      this.state.jump = false;
    } else if (this.keyBindings.dash.includes(e.code)) {
      this.state.dash = false;
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

  update(): Readonly<InputState> {
    // Poll gamepad state (Gamepad API is poll-based, not event-based)
    this.pollGamepad();

    this.state.jumpPressed = this.state.jump && !this.previousJump;
    this.state.dashPressed = this.state.dash && !this.previousDash;
    this.previousJump = this.state.jump;
    this.previousDash = this.state.dash;
    return this.state; // Return direct reference - avoid allocation every frame
  }

  /** Poll connected gamepads for jump/dash input (standard mapping) */
  private pollGamepad(): void {
    if (!navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || !gp.connected) continue;

      // Standard mapping: A/Cross = jump (button 0), D-pad up (12), left stick up
      const gpJump = gp.buttons[0]?.pressed ||
                     gp.buttons[12]?.pressed ||
                     gp.axes[1] < -0.5;

      // B/Circle (1), X/Square (2), shoulder buttons (4, 5) = dash
      const gpDash = gp.buttons[1]?.pressed || gp.buttons[2]?.pressed ||
                     gp.buttons[4]?.pressed || gp.buttons[5]?.pressed;

      // Gamepad overrides: set true when pressed, set false when released
      // (only affects state if gamepad provides input, doesn't clear keyboard/touch)
      if (gpJump) {
        this.state.jump = true;
      } else if (this.gamepadJumpWasPressed) {
        this.state.jump = false;
      }
      if (gpDash) {
        this.state.dash = true;
      } else if (this.gamepadDashWasPressed) {
        this.state.dash = false;
      }
      this.gamepadJumpWasPressed = gpJump;
      this.gamepadDashWasPressed = gpDash;

      // Only use first connected gamepad
      break;
    }
  }

  getState(): Readonly<InputState> {
    return this.state; // Return direct reference - avoid allocation every frame
  }

  // Check if running on mobile
  isMobileDevice(): boolean {
    return this.isMobile;
  }

  /**
   * Clean up all event listeners
   */
  destroy(): void {
    // Remove window listeners
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('blur', this.boundBlur);

    // Remove canvas listeners
    if (this.canvas) {
      if (this.boundMouseDown) {
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
      }
      if (this.boundMouseUp) {
        this.canvas.removeEventListener('mouseup', this.boundMouseUp);
      }
      if (this.boundTouchStart) {
        this.canvas.removeEventListener('touchstart', this.boundTouchStart);
      }
      if (this.boundTouchEnd) {
        this.canvas.removeEventListener('touchend', this.boundTouchEnd);
      }
      if (this.boundTouchCancel) {
        this.canvas.removeEventListener('touchcancel', this.boundTouchCancel);
      }
    }
  }
}
