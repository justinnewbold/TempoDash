/**
 * StateValidator - Dev-mode runtime assertions for catching invalid game state.
 * Only runs assertions in development mode. No-ops in production.
 */

// Detect dev mode via hostname (avoids Vite type issues in strict mode)
const IS_DEV = typeof window !== 'undefined' && window.location?.hostname === 'localhost';

interface ValidationError {
  system: string;
  message: string;
  value: unknown;
  timestamp: number;
}

export class StateValidator {
  private errors: ValidationError[] = [];
  private maxErrors = 50;
  private enabled = IS_DEV;
  private errorCallback: ((error: ValidationError) => void) | null = null;

  /** Set a callback for when validation errors occur */
  onError(callback: (error: ValidationError) => void): void {
    this.errorCallback = callback;
  }

  /** Enable or disable validation */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Get recent validation errors */
  getErrors(): readonly ValidationError[] {
    return this.errors;
  }

  /** Clear error history */
  clearErrors(): void {
    this.errors = [];
  }

  private report(system: string, message: string, value: unknown): void {
    if (!this.enabled) return;

    const error: ValidationError = {
      system,
      message,
      value,
      timestamp: performance.now(),
    };

    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    if (this.errorCallback) {
      this.errorCallback(error);
    }

    console.warn(`[StateValidator] ${system}: ${message}`, value);
  }

  // --- Assertions ---

  /** Assert a value is within a numeric range */
  assertRange(system: string, name: string, value: number, min: number, max: number): void {
    if (!this.enabled) return;
    if (value < min || value > max || Number.isNaN(value)) {
      this.report(system, `${name} out of range [${min}, ${max}]`, value);
    }
  }

  /** Assert a value is not negative */
  assertNonNegative(system: string, name: string, value: number): void {
    if (!this.enabled) return;
    if (value < 0 || Number.isNaN(value)) {
      this.report(system, `${name} is negative or NaN`, value);
    }
  }

  /** Assert a value is a positive integer */
  assertPositiveInt(system: string, name: string, value: number): void {
    if (!this.enabled) return;
    if (value < 1 || !Number.isInteger(value)) {
      this.report(system, `${name} should be a positive integer`, value);
    }
  }

  /** Assert a value is not null/undefined */
  assertDefined<T>(system: string, name: string, value: T | null | undefined): void {
    if (!this.enabled) return;
    if (value === null || value === undefined) {
      this.report(system, `${name} is ${value}`, value);
    }
  }

  /** Assert a boolean condition */
  assert(system: string, message: string, condition: boolean): void {
    if (!this.enabled) return;
    if (!condition) {
      this.report(system, message, condition);
    }
  }

  // --- Game-specific validations ---

  /** Validate core game state after update */
  validateGameState(state: {
    score: number;
    lives: number;
    currentLevel: number;
    gameStatus: string;
  }): void {
    if (!this.enabled) return;
    this.assertNonNegative('GameState', 'score', state.score);
    this.assertRange('GameState', 'lives', state.lives, 0, 99);
    this.assertPositiveInt('GameState', 'currentLevel', state.currentLevel);
  }

  /** Validate player physics state */
  validatePlayerState(player: {
    x: number;
    y: number;
    velocityY: number;
    width: number;
    height: number;
  }): void {
    if (!this.enabled) return;
    this.assert('Player', 'x is finite', Number.isFinite(player.x));
    this.assert('Player', 'y is finite', Number.isFinite(player.y));
    this.assertRange('Player', 'velocityY', player.velocityY, -5000, 5000);
  }

  /** Validate scoring calculations */
  validateScore(system: string, score: number): void {
    if (!this.enabled) return;
    this.assertNonNegative(system, 'score', score);
    this.assert(system, 'score is finite', Number.isFinite(score));
  }

  /** Validate combo state */
  validateCombo(combo: number, multiplier: number): void {
    if (!this.enabled) return;
    this.assertNonNegative('Combo', 'comboCount', combo);
    this.assertRange('Combo', 'multiplier', multiplier, 1, 100);
  }

  /** Validate speed multiplier */
  validateSpeedMultiplier(speed: number, maxSpeed: number): void {
    if (!this.enabled) return;
    this.assertRange('Speed', 'speedMultiplier', speed, 0.1, maxSpeed + 0.01);
  }
}

/** Singleton instance */
export const stateValidator = new StateValidator();
