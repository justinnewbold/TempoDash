// Score and combo tracking system
// Extracted from Game.ts - owns combo state, score-per-run accumulation,
// and high-score persistence via SaveManager.

import { SaveManager } from './SaveManager';

export class ScoreManager {
  // Combo system
  private _comboCount = 0;
  private _comboTimer = 0;
  private _comboDisplayTimer = 0;
  private _comboMultiplier = 1;
  private _nearMissTimer = 0;
  private _nearMissCount = 0;
  private _comboMeterPulse = 0;

  // Score accumulated in the current run (gem pickups + level completion bonus)
  private _levelScoreThisRun = 0;

  // 2 seconds to maintain combo
  static readonly COMBO_DURATION = 2000;

  constructor(private save: SaveManager) {}

  // Clears combo state and per-run score. Called from all restart paths
  // and on death; mirrors the behavior previously inlined in Game.ts.
  reset(): void {
    this._comboCount = 0;
    this._comboTimer = 0;
    this._comboDisplayTimer = 0;
    this._comboMultiplier = 1;
    this._nearMissTimer = 0;
    this._nearMissCount = 0;
    this._comboMeterPulse = 0;
    this._levelScoreThisRun = 0;
  }

  // Reset combo state only (used on death respawn where per-run score
  // is intentionally preserved across respawns in the existing code).
  resetCombo(): void {
    this._comboCount = 0;
    this._comboTimer = 0;
    this._comboDisplayTimer = 0;
    this._comboMultiplier = 1;
    this._nearMissTimer = 0;
    this._comboMeterPulse = 0;
  }

  // Accessors / mutators for combo state
  get comboCount(): number { return this._comboCount; }
  set comboCount(v: number) { this._comboCount = v; }

  get comboTimer(): number { return this._comboTimer; }
  set comboTimer(v: number) { this._comboTimer = v; }

  get comboDuration(): number { return ScoreManager.COMBO_DURATION; }

  get comboDisplayTimer(): number { return this._comboDisplayTimer; }
  set comboDisplayTimer(v: number) { this._comboDisplayTimer = v; }

  get comboMultiplier(): number { return this._comboMultiplier; }
  set comboMultiplier(v: number) { this._comboMultiplier = v; }

  get nearMissTimer(): number { return this._nearMissTimer; }
  set nearMissTimer(v: number) { this._nearMissTimer = v; }

  get nearMissCount(): number { return this._nearMissCount; }
  set nearMissCount(v: number) { this._nearMissCount = v; }

  get comboMeterPulse(): number { return this._comboMeterPulse; }
  set comboMeterPulse(v: number) { this._comboMeterPulse = v; }

  get levelScoreThisRun(): number { return this._levelScoreThisRun; }
  set levelScoreThisRun(v: number) { this._levelScoreThisRun = v; }

  // Recompute multiplier tier from the current combo count.
  updateComboMultiplier(): void {
    if (this._comboCount >= 25) {
      this._comboMultiplier = 4;
    } else if (this._comboCount >= 20) {
      this._comboMultiplier = 3;
    } else if (this._comboCount >= 15) {
      this._comboMultiplier = 2.5;
    } else if (this._comboCount >= 10) {
      this._comboMultiplier = 2;
    } else if (this._comboCount >= 5) {
      this._comboMultiplier = 1.5;
    } else {
      this._comboMultiplier = 1;
    }
  }

  // Decay combo timers (called every frame). nearMissTimer is decayed separately
  // by Game so its decay happens mid-update (preserves original call order).
  updateTimers(deltaTime: number): void {
    if (this._comboTimer > 0) {
      this._comboTimer -= deltaTime;
      if (this._comboTimer <= 0) {
        this._comboCount = 0;
        this._comboMultiplier = 1;
      }
    }
    if (this._comboDisplayTimer > 0) {
      this._comboDisplayTimer -= deltaTime;
    }
    if (this._comboMeterPulse > 0) {
      this._comboMeterPulse -= deltaTime / 200;
    }
  }

  addLevelScore(points: number): void {
    this._levelScoreThisRun += points;
  }

  // Persist total points and per-level high score for the completed level.
  commitLevelScore(levelId: number): boolean {
    this.save.addPoints(this._levelScoreThisRun);
    return this.save.setHighScore(levelId, this._levelScoreThisRun);
  }

  updateLongestCombo(): void {
    this.save.updateLongestCombo(this._comboCount);
  }
}
