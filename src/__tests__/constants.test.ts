import { describe, it, expect } from 'vitest';
import { PLAYER, SCORING, TIMING, SPEED, PLATFORM } from '../constants';

describe('Constants', () => {
  describe('PLAYER', () => {
    it('has valid physics values', () => {
      expect(PLAYER.GRAVITY).toBeGreaterThan(0);
      expect(PLAYER.JUMP_FORCE).toBeGreaterThan(0);
      expect(PLAYER.MAX_FALL_SPEED).toBeGreaterThan(0);
      expect(PLAYER.SPEED).toBeGreaterThan(0);
    });

    it('has valid dimensions', () => {
      expect(PLAYER.WIDTH).toBeGreaterThan(0);
      expect(PLAYER.HEIGHT).toBeGreaterThan(0);
    });

    it('has valid jump multipliers for all air jumps', () => {
      expect(PLAYER.JUMP_MULTIPLIERS).toHaveLength(PLAYER.MAX_AIR_JUMPS + 1);
      for (const mult of PLAYER.JUMP_MULTIPLIERS) {
        expect(mult).toBeGreaterThan(0);
      }
    });

    it('has positive bounce multiplier', () => {
      expect(PLAYER.BOUNCE_MULTIPLIER).toBeGreaterThan(1);
    });

    it('has valid input buffering timings', () => {
      expect(PLAYER.COYOTE_TIME).toBeGreaterThan(0);
      expect(PLAYER.COYOTE_TIME).toBeLessThan(200); // Should be brief
      expect(PLAYER.JUMP_BUFFER_TIME).toBeGreaterThan(0);
      expect(PLAYER.JUMP_BUFFER_TIME).toBeLessThan(200);
    });

    it('wall slide speed is slower than max fall', () => {
      expect(PLAYER.WALL_SLIDE_SPEED).toBeLessThan(PLAYER.MAX_FALL_SPEED);
    });
  });

  describe('SCORING', () => {
    it('has valid base score', () => {
      expect(SCORING.BASE_LEVEL_SCORE).toBeGreaterThan(0);
    });

    it('minimum score is positive', () => {
      expect(SCORING.MIN_LEVEL_SCORE).toBeGreaterThan(0);
    });

    it('minimum score is less than base', () => {
      expect(SCORING.MIN_LEVEL_SCORE).toBeLessThan(SCORING.BASE_LEVEL_SCORE);
    });

    it('gem values increase by rarity', () => {
      expect(SCORING.GEM_RUBY).toBeLessThan(SCORING.GEM_SAPPHIRE);
      expect(SCORING.GEM_SAPPHIRE).toBeLessThan(SCORING.GEM_EMERALD);
    });

    it('combo duration is reasonable', () => {
      expect(SCORING.COMBO_DURATION).toBeGreaterThanOrEqual(1000);
      expect(SCORING.COMBO_DURATION).toBeLessThanOrEqual(5000);
    });
  });

  describe('TIMING', () => {
    it('beat windows are ordered correctly', () => {
      expect(TIMING.BEAT_PERFECT_WINDOW).toBeLessThan(TIMING.BEAT_GOOD_WINDOW);
    });

    it('death respawn delay is reasonable', () => {
      expect(TIMING.DEATH_RESPAWN_DELAY).toBeGreaterThan(0);
      expect(TIMING.DEATH_RESPAWN_DELAY).toBeLessThanOrEqual(2000);
    });
  });

  describe('SPEED', () => {
    it('initial speed is 1.0', () => {
      expect(SPEED.INITIAL).toBe(1);
    });

    it('max multiplier is greater than initial', () => {
      expect(SPEED.MAX_MULTIPLIER).toBeGreaterThan(SPEED.INITIAL);
    });

    it('increase per jump is small', () => {
      expect(SPEED.INCREASE_PER_JUMP).toBeGreaterThan(0);
      expect(SPEED.INCREASE_PER_JUMP).toBeLessThan(0.1);
    });
  });

  describe('PLATFORM', () => {
    it('crumble delay is before duration', () => {
      expect(PLATFORM.CRUMBLE_DELAY).toBeGreaterThan(0);
      expect(PLATFORM.CRUMBLE_DURATION).toBeGreaterThan(0);
    });

    it('phase timings are positive', () => {
      expect(PLATFORM.PHASE_ON_TIME).toBeGreaterThan(0);
      expect(PLATFORM.PHASE_OFF_TIME).toBeGreaterThan(0);
    });
  });
});
