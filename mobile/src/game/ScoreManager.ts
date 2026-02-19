/**
 * Mobile ScoreManager - Uses shared scoring logic for consistency with web.
 * Manages combo tracking, level scoring, and gem bonus accumulation.
 */

import { COMBO } from '../constants';

// Import shared scoring functions (copied locally until monorepo is set up)
function calculateComboMultiplier(comboCount: number): number {
  return 1 + Math.floor(comboCount / 3) * 0.5;
}

export class ScoreManager {
  // Combo state
  comboCount = 0;
  comboTimer = 0;
  comboMultiplier = 1;
  maxCombo = 0;

  // Level score tracking
  levelScore = 0;

  /** Reset all scoring state */
  reset(): void {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;
    this.levelScore = 0;
  }

  /** Register a coin collection, returns updated multiplier */
  registerCoinCollect(): number {
    this.comboCount++;
    this.comboTimer = COMBO.TIMEOUT;
    this.comboMultiplier = calculateComboMultiplier(this.comboCount);
    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }
    return this.comboMultiplier;
  }

  /** Update combo timer, returns true if combo expired */
  update(deltaTime: number): boolean {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMultiplier = 1;
        return true;
      }
    }
    return false;
  }

  /** Get combo fill percentage for UI */
  getComboFillPercent(): number {
    if (this.comboTimer <= 0) return 0;
    return Math.max(0, Math.min(1, this.comboTimer / COMBO.TIMEOUT));
  }

  /** Add gem/bonus points */
  addPoints(value: number): void {
    this.levelScore += value;
  }

  /** Get the current score including bonuses */
  getCurrentScore(): number {
    return this.levelScore;
  }
}
