import { describe, it, expect } from 'vitest';
import { checkAABBCollision, applyGravity, calculateJumpVelocity, clamp, lerp } from '../../shared/physics';

describe('shared/physics', () => {
  describe('checkAABBCollision', () => {
    it('returns null for non-overlapping rectangles', () => {
      expect(checkAABBCollision(0, 0, 10, 10, 20, 20, 10, 10)).toBeNull();
    });

    it('returns null for adjacent rectangles (no overlap)', () => {
      expect(checkAABBCollision(0, 0, 10, 10, 10, 0, 10, 10)).toBeNull();
    });

    it('detects top collision', () => {
      // Player falling onto platform from above
      expect(checkAABBCollision(5, 8, 10, 10, 0, 15, 20, 5)).toBe('top');
    });

    it('detects bottom collision', () => {
      // Player hitting platform from below
      expect(checkAABBCollision(5, 7, 10, 10, 0, 0, 20, 10)).toBe('bottom');
    });

    it('detects left collision', () => {
      // Player hitting left edge of platform
      expect(checkAABBCollision(8, 0, 10, 10, 15, 0, 20, 10)).toBe('left');
    });

    it('detects right collision', () => {
      // Player hitting right edge of platform
      expect(checkAABBCollision(7, 0, 10, 10, 0, 0, 10, 10)).toBe('right');
    });
  });

  describe('applyGravity', () => {
    it('increases velocity downward with normal gravity', () => {
      const vy = applyGravity(0, 2000, 1000, 0.016, false);
      expect(vy).toBeCloseTo(32, 0); // 2000 * 0.016
    });

    it('clamps to terminal velocity', () => {
      const vy = applyGravity(990, 2000, 1000, 0.016, false);
      expect(vy).toBe(1000);
    });

    it('applies flipped gravity (negative direction)', () => {
      const vy = applyGravity(0, 2000, 1000, 0.016, true);
      expect(vy).toBeCloseTo(-32, 0);
    });

    it('clamps flipped gravity to negative terminal velocity', () => {
      const vy = applyGravity(-990, 2000, 1000, 0.016, true);
      expect(vy).toBe(-1000);
    });

    it('applies slow-mo multiplier', () => {
      const normal = applyGravity(0, 2000, 1000, 0.016, false, 1.0);
      const slowmo = applyGravity(0, 2000, 1000, 0.016, false, 0.5);
      expect(slowmo).toBeCloseTo(normal * 0.5, 1);
    });
  });

  describe('calculateJumpVelocity', () => {
    const multipliers = [1.0, 1.275, 0.7, 1.5, 0.5];

    it('applies first jump multiplier', () => {
      expect(calculateJumpVelocity(600, 0, multipliers)).toBe(-600);
    });

    it('applies second jump multiplier', () => {
      expect(calculateJumpVelocity(600, 1, multipliers)).toBe(-765);
    });

    it('uses fallback for out-of-range index', () => {
      expect(calculateJumpVelocity(600, 10, multipliers)).toBe(-300); // 0.5 fallback
    });
  });

  describe('clamp', () => {
    it('clamps below minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps above maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('returns value when in range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
  });

  describe('lerp', () => {
    it('returns start value at t=0', () => {
      expect(lerp(0, 100, 0)).toBe(0);
    });

    it('returns end value at t=1', () => {
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it('returns midpoint at t=0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it('clamps t to [0, 1]', () => {
      expect(lerp(0, 100, -1)).toBe(0);
      expect(lerp(0, 100, 2)).toBe(100);
    });
  });
});
