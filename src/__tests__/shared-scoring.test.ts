import { describe, it, expect } from 'vitest';
import { calculateLevelCompletionScore, calculateComboMultiplier, getGemValue } from '../../shared/scoring';

describe('shared/scoring', () => {
  describe('calculateLevelCompletionScore', () => {
    it('returns base score with no modifiers', () => {
      expect(calculateLevelCompletionScore(1, 0, 0, 1.0)).toBe(1000);
    });

    it('applies attempt penalty', () => {
      expect(calculateLevelCompletionScore(5, 0, 0, 1.0)).toBe(800);
    });

    it('floors at minimum score', () => {
      expect(calculateLevelCompletionScore(100, 0, 0, 1.0)).toBe(100);
    });

    it('adds coin bonus', () => {
      expect(calculateLevelCompletionScore(1, 10, 0, 1.0)).toBe(2000);
    });

    it('adds gem bonus', () => {
      expect(calculateLevelCompletionScore(1, 0, 500, 1.0)).toBe(1500);
    });

    it('applies modifier multiplier to total', () => {
      expect(calculateLevelCompletionScore(1, 0, 0, 2.0)).toBe(2000);
    });

    it('combines all factors', () => {
      // base: max(1000 - 2*50, 100) = 900
      // coins: 5 * 100 = 500
      // gems: 1000
      // raw: 900 + 500 + 1000 = 2400
      // final: floor(2400 * 1.5) = 3600
      expect(calculateLevelCompletionScore(3, 5, 1000, 1.5)).toBe(3600);
    });

    it('handles zero attempts (edge case)', () => {
      // (0-1) * 50 = -50 penalty = bonus
      // max(1000 + 50, 100) = 1050
      expect(calculateLevelCompletionScore(0, 0, 0, 1.0)).toBe(1050);
    });
  });

  describe('calculateComboMultiplier', () => {
    it('returns 1x for 0-2 combo', () => {
      expect(calculateComboMultiplier(0)).toBe(1);
      expect(calculateComboMultiplier(1)).toBe(1);
      expect(calculateComboMultiplier(2)).toBe(1);
    });

    it('returns 1.5x for 3-5 combo', () => {
      expect(calculateComboMultiplier(3)).toBe(1.5);
      expect(calculateComboMultiplier(5)).toBe(1.5);
    });

    it('returns 2x for 6-8 combo', () => {
      expect(calculateComboMultiplier(6)).toBe(2);
      expect(calculateComboMultiplier(8)).toBe(2);
    });

    it('scales linearly', () => {
      expect(calculateComboMultiplier(9)).toBe(2.5);
      expect(calculateComboMultiplier(12)).toBe(3);
    });
  });

  describe('getGemValue', () => {
    it('returns correct values for each gem type', () => {
      expect(getGemValue('ruby')).toBe(500);
      expect(getGemValue('sapphire')).toBe(1000);
      expect(getGemValue('emerald')).toBe(2000);
    });

    it('returns 0 for unknown gem type', () => {
      expect(getGemValue('diamond')).toBe(0);
    });
  });
});
