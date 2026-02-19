import { describe, it, expect, beforeEach } from 'vitest';
import { RhythmSystem } from '../game/RhythmSystem';

describe('RhythmSystem', () => {
  let rhythm: RhythmSystem;

  beforeEach(() => {
    rhythm = new RhythmSystem();
    rhythm.setBPM(120);
  });

  describe('reset', () => {
    it('resets all state', () => {
      rhythm.consecutiveOnBeatJumps = 5;
      rhythm.levelRhythmHits = 10;
      rhythm.rhythmMultiplier = 1.5;
      rhythm.reset();

      expect(rhythm.consecutiveOnBeatJumps).toBe(0);
      expect(rhythm.levelRhythmHits).toBe(0);
      expect(rhythm.rhythmMultiplier).toBe(1);
    });
  });

  describe('setBPM', () => {
    it('sets BPM', () => {
      rhythm.setBPM(140);
      expect(rhythm.currentBPM).toBe(140);
    });

    it('defaults to 128 for falsy values', () => {
      rhythm.setBPM(0);
      expect(rhythm.currentBPM).toBe(128);
    });
  });

  describe('onPlayerJump', () => {
    it('increments total rhythm count', () => {
      rhythm.onPlayerJump(false);
      rhythm.onPlayerJump(false);
      expect(rhythm.levelRhythmTotal).toBe(2);
    });

    it('returns timing result', () => {
      const result = rhythm.onPlayerJump(true);
      expect(['perfect', 'good', 'miss']).toContain(result.timing);
    });
  });

  describe('update', () => {
    it('decays rhythm multiplier when no on-beat jumps', () => {
      rhythm.rhythmMultiplier = 1.5;
      rhythm.consecutiveOnBeatJumps = 0;
      rhythm.update(1000);
      expect(rhythm.rhythmMultiplier).toBeLessThan(1.5);
    });

    it('does not go below 1.0', () => {
      rhythm.rhythmMultiplier = 1.0;
      rhythm.consecutiveOnBeatJumps = 0;
      rhythm.update(10000);
      expect(rhythm.rhythmMultiplier).toBe(1);
    });

    it('removes expired beat indicators', () => {
      rhythm.beatIndicators.push({ time: 0.1, intensity: 1 });
      rhythm.update(200);
      expect(rhythm.beatIndicators).toHaveLength(0);
    });

    it('removes expired accuracy feedback', () => {
      rhythm.beatAccuracy.push({ time: Date.now(), accuracy: 'perfect', timer: 50 });
      rhythm.update(100);
      expect(rhythm.beatAccuracy).toHaveLength(0);
    });
  });

  describe('getAccuracyPercent', () => {
    it('returns 0 with no jumps', () => {
      expect(rhythm.getAccuracyPercent()).toBe(0);
    });

    it('calculates percentage correctly', () => {
      rhythm.levelRhythmHits = 7;
      rhythm.levelRhythmTotal = 10;
      expect(rhythm.getAccuracyPercent()).toBe(70);
    });
  });
});
