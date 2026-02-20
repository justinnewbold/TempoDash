import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateValidator } from '../systems/StateValidator';

describe('StateValidator', () => {
  let validator: StateValidator;

  beforeEach(() => {
    validator = new StateValidator();
    validator.setEnabled(true);
    validator.clearErrors();
  });

  describe('assertRange', () => {
    it('does not report values within range', () => {
      validator.assertRange('Test', 'value', 5, 0, 10);
      expect(validator.getErrors()).toHaveLength(0);
    });

    it('reports values below range', () => {
      validator.assertRange('Test', 'value', -1, 0, 10);
      expect(validator.getErrors()).toHaveLength(1);
      expect(validator.getErrors()[0].message).toContain('out of range');
    });

    it('reports values above range', () => {
      validator.assertRange('Test', 'value', 11, 0, 10);
      expect(validator.getErrors()).toHaveLength(1);
    });

    it('reports NaN', () => {
      validator.assertRange('Test', 'value', NaN, 0, 10);
      expect(validator.getErrors()).toHaveLength(1);
    });
  });

  describe('assertNonNegative', () => {
    it('accepts zero', () => {
      validator.assertNonNegative('Test', 'value', 0);
      expect(validator.getErrors()).toHaveLength(0);
    });

    it('accepts positive values', () => {
      validator.assertNonNegative('Test', 'value', 42);
      expect(validator.getErrors()).toHaveLength(0);
    });

    it('reports negative values', () => {
      validator.assertNonNegative('Test', 'value', -1);
      expect(validator.getErrors()).toHaveLength(1);
    });

    it('reports NaN', () => {
      validator.assertNonNegative('Test', 'value', NaN);
      expect(validator.getErrors()).toHaveLength(1);
    });
  });

  describe('assertDefined', () => {
    it('accepts non-null values', () => {
      validator.assertDefined('Test', 'value', 'hello');
      validator.assertDefined('Test', 'value', 0);
      validator.assertDefined('Test', 'value', false);
      expect(validator.getErrors()).toHaveLength(0);
    });

    it('reports null', () => {
      validator.assertDefined('Test', 'value', null);
      expect(validator.getErrors()).toHaveLength(1);
    });

    it('reports undefined', () => {
      validator.assertDefined('Test', 'value', undefined);
      expect(validator.getErrors()).toHaveLength(1);
    });
  });

  describe('validateGameState', () => {
    it('accepts valid game state', () => {
      validator.validateGameState({
        score: 1000,
        lives: 3,
        currentLevel: 1,
        gameStatus: 'playing',
      });
      expect(validator.getErrors()).toHaveLength(0);
    });

    it('reports negative score', () => {
      validator.validateGameState({
        score: -100,
        lives: 3,
        currentLevel: 1,
        gameStatus: 'playing',
      });
      expect(validator.getErrors()).toHaveLength(1);
    });

    it('reports zero level', () => {
      validator.validateGameState({
        score: 0,
        lives: 3,
        currentLevel: 0,
        gameStatus: 'playing',
      });
      expect(validator.getErrors()).toHaveLength(1);
    });
  });

  describe('error callback', () => {
    it('calls callback on error', () => {
      const callback = vi.fn();
      validator.onError(callback);
      validator.assertRange('Test', 'value', -1, 0, 10);
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('disabled mode', () => {
    it('skips all validations when disabled', () => {
      validator.setEnabled(false);
      validator.assertRange('Test', 'value', -999, 0, 10);
      validator.assertNonNegative('Test', 'value', -1);
      validator.assertDefined('Test', 'value', null);
      expect(validator.getErrors()).toHaveLength(0);
    });
  });

  describe('error limit', () => {
    it('limits error history', () => {
      for (let i = 0; i < 100; i++) {
        validator.assertRange('Test', 'value', -1, 0, 10);
      }
      expect(validator.getErrors().length).toBeLessThanOrEqual(50);
    });
  });
});
