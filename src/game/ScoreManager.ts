/**
 * ScoreManager - Centralized scoring logic extracted from Game.ts.
 * Handles level completion scoring, combo tracking, and score calculations.
 */

import { SCORING } from '../constants';

export class ScoreManager {
  // Combo state
  comboCount = 0;
  comboTimer = 0;
  comboMultiplier = 1;
  nearMissTimer = 0;
  nearMissCount = 0;
  comboMeterPulse = 0;

  // Level score tracking
  levelScoreThisRun = 0;

  /** Reset all scoring state for a new level/restart */
  reset(): void {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;
    this.nearMissTimer = 0;
    this.nearMissCount = 0;
    this.comboMeterPulse = 0;
    this.levelScoreThisRun = 0;
  }

  /** Add gem points during gameplay */
  addGemPoints(value: number): void {
    this.levelScoreThisRun += value;
  }

  /**
   * Calculate final level completion score.
   * Preserves accumulated gem bonus and applies modifier multiplier.
   */
  calculateLevelScore(
    attempts: number,
    coinsCollected: number,
    modifierMultiplier: number
  ): number {
    const attemptPenalty = (attempts - 1) * SCORING.ATTEMPT_PENALTY;
    const coinBonus = coinsCollected * SCORING.COIN_BONUS;
    const gemBonus = this.levelScoreThisRun; // Accumulated gem points
    const rawScore = Math.max(SCORING.BASE_LEVEL_SCORE - attemptPenalty, SCORING.MIN_LEVEL_SCORE) + coinBonus + gemBonus;

    this.levelScoreThisRun = Math.floor(rawScore * modifierMultiplier);
    return this.levelScoreThisRun;
  }

  /** Update combo timer, returns true if combo expired */
  updateCombo(deltaTime: number): boolean {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMultiplier = 1;
        return true; // Combo expired
      }
    }

    if (this.nearMissTimer > 0) {
      this.nearMissTimer -= deltaTime;
      if (this.nearMissTimer <= 0) {
        this.nearMissCount = 0;
      }
    }

    // Decay meter pulse
    if (this.comboMeterPulse > 0) {
      this.comboMeterPulse -= deltaTime / 200;
      if (this.comboMeterPulse < 0) this.comboMeterPulse = 0;
    }

    return false;
  }

  /** Register a coin collection, returns the combo multiplier */
  registerCoinCollect(): number {
    this.comboCount++;
    this.comboTimer = SCORING.COMBO_DURATION;
    this.comboMultiplier = 1 + Math.floor(this.comboCount / 3) * 0.5;
    this.comboMeterPulse = 1;
    return this.comboMultiplier;
  }

  /** Register a near miss */
  registerNearMiss(): void {
    this.nearMissCount++;
    this.nearMissTimer = SCORING.NEAR_MISS_DURATION;
  }

  /** Get the combo fill percentage for the UI meter */
  getComboFillPercent(): number {
    if (this.comboTimer <= 0) return 0;
    return Math.max(0, Math.min(1, this.comboTimer / SCORING.COMBO_DURATION));
  }
}
