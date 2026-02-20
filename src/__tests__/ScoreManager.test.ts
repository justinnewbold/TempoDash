import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from '../game/ScoreManager';

describe('ScoreManager', () => {
  let score: ScoreManager;

  beforeEach(() => {
    score = new ScoreManager();
  });

  describe('reset', () => {
    it('resets all state to defaults', () => {
      score.comboCount = 5;
      score.comboMultiplier = 3;
      score.levelScoreThisRun = 1500;
      score.reset();

      expect(score.comboCount).toBe(0);
      expect(score.comboMultiplier).toBe(1);
      expect(score.levelScoreThisRun).toBe(0);
    });
  });

  describe('calculateLevelScore', () => {
    it('calculates base score with no penalties', () => {
      const result = score.calculateLevelScore(1, 0, 1.0);
      expect(result).toBe(1000);
    });

    it('applies attempt penalty', () => {
      const result = score.calculateLevelScore(3, 0, 1.0);
      // 1000 - (3-1)*50 = 900
      expect(result).toBe(900);
    });

    it('floors score at minimum after heavy penalties', () => {
      const result = score.calculateLevelScore(50, 0, 1.0);
      // 1000 - 49*50 = -1450, floored to 100
      expect(result).toBe(100);
    });

    it('adds coin bonus', () => {
      const result = score.calculateLevelScore(1, 5, 1.0);
      // 1000 + 5*100 = 1500
      expect(result).toBe(1500);
    });

    it('preserves accumulated gem bonus', () => {
      score.addGemPoints(500);
      score.addGemPoints(1000);
      const result = score.calculateLevelScore(1, 0, 1.0);
      // 1000 + 1500 (gems) = 2500
      expect(result).toBe(2500);
    });

    it('applies modifier multiplier', () => {
      const result = score.calculateLevelScore(1, 0, 2.0);
      // 1000 * 2.0 = 2000
      expect(result).toBe(2000);
    });

    it('combines all factors correctly', () => {
      score.addGemPoints(500);
      const result = score.calculateLevelScore(3, 5, 1.5);
      // base: max(1000 - 100, 100) = 900
      // coins: 5 * 100 = 500
      // gems: 500
      // raw: 900 + 500 + 500 = 1900
      // final: floor(1900 * 1.5) = 2850
      expect(result).toBe(2850);
    });
  });

  describe('combo tracking', () => {
    it('increments combo on coin collect', () => {
      score.registerCoinCollect();
      expect(score.comboCount).toBe(1);
      expect(score.comboTimer).toBe(2000);
    });

    it('increases multiplier every 3 coins', () => {
      score.registerCoinCollect(); // 1
      score.registerCoinCollect(); // 2
      expect(score.comboMultiplier).toBe(1);
      score.registerCoinCollect(); // 3
      expect(score.comboMultiplier).toBe(1.5);
      score.registerCoinCollect(); // 4
      score.registerCoinCollect(); // 5
      score.registerCoinCollect(); // 6
      expect(score.comboMultiplier).toBe(2);
    });

    it('expires combo when timer runs out', () => {
      score.registerCoinCollect();
      const expired = score.updateCombo(2001); // More than 2000ms
      expect(expired).toBe(true);
      expect(score.comboCount).toBe(0);
      expect(score.comboMultiplier).toBe(1);
    });

    it('maintains combo while timer active', () => {
      score.registerCoinCollect();
      const expired = score.updateCombo(1000);
      expect(expired).toBe(false);
      expect(score.comboCount).toBe(1);
    });
  });

  describe('getComboFillPercent', () => {
    it('returns 0 when no combo active', () => {
      expect(score.getComboFillPercent()).toBe(0);
    });

    it('returns 1 at start of combo', () => {
      score.registerCoinCollect();
      expect(score.getComboFillPercent()).toBe(1);
    });

    it('returns 0.5 halfway through combo', () => {
      score.registerCoinCollect();
      score.updateCombo(1000);
      expect(score.getComboFillPercent()).toBe(0.5);
    });

    it('clamps to [0, 1] range', () => {
      score.registerCoinCollect();
      score.updateCombo(3000); // Way past expiry
      expect(score.getComboFillPercent()).toBe(0);
    });
  });

  describe('near miss tracking', () => {
    it('tracks near misses', () => {
      score.registerNearMiss();
      expect(score.nearMissCount).toBe(1);
      expect(score.nearMissTimer).toBe(500);
    });

    it('resets near miss count when timer expires', () => {
      score.registerNearMiss();
      score.registerNearMiss();
      score.updateCombo(600);
      expect(score.nearMissCount).toBe(0);
    });
  });
});
