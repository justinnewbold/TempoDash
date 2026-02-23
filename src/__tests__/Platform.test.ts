import { describe, it, expect } from 'vitest';
import { Platform } from '../entities/Platform';

describe('Platform', () => {
  describe('initialization', () => {
    it('creates a solid platform with correct position', () => {
      const platform = new Platform({ x: 100, y: 200, width: 150, height: 20, type: 'solid' });
      expect(platform.x).toBe(100);
      expect(platform.y).toBe(200);
      expect(platform.width).toBe(150);
      expect(platform.height).toBe(20);
      expect(platform.type).toBe('solid');
    });

    it('creates each platform type without error', () => {
      const types = [
        'solid', 'bounce', 'crumble', 'moving', 'ice', 'lava',
        'phase', 'spike', 'conveyor', 'gravity', 'sticky', 'glass',
        'slowmo', 'wall', 'secret'
      ] as const;

      for (const type of types) {
        const p = new Platform({ x: 0, y: 0, width: 100, height: 20, type });
        expect(p.type).toBe(type);
      }
    });
  });

  describe('isCollidable', () => {
    it('returns true for a normal solid platform', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'solid' });
      expect(platform.isCollidable()).toBe(true);
    });

    it('returns false for a destroyed platform', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'solid' });
      platform.isDestroyed = true;
      expect(platform.isCollidable()).toBe(false);
    });

    it('returns false for phased platform', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'phase' });
      platform.isPhased = true;
      expect(platform.isCollidable()).toBe(false);
    });

    it('returns false for unrevealed secret platform', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'secret' });
      // Secret platforms need reveal progress > 0.3
      expect(platform.isCollidable()).toBe(false);
    });
  });

  describe('crumble', () => {
    it('starts crumbling when triggered', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'crumble' });
      platform.startCrumble();

      // Advance time past crumble delay + duration (simulating ~2 seconds)
      for (let i = 0; i < 200; i++) {
        platform.update(16);
      }

      expect(platform.isDestroyed).toBe(true);
    });

    it('does not crumble non-crumble platforms', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'solid' });
      platform.startCrumble();

      for (let i = 0; i < 200; i++) {
        platform.update(16);
      }

      expect(platform.isDestroyed).toBe(false);
    });
  });

  describe('glass', () => {
    it('breaks after 2 hits', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'glass' });

      expect(platform.onGlassLanding()).toBe(false); // First hit - cracks
      expect(platform.getGlassState()).toBe(1);

      expect(platform.onGlassLanding()).toBe(true); // Second hit - breaks
      expect(platform.getGlassState()).toBe(2);
    });

    it('does not break non-glass platforms', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'solid' });
      expect(platform.onGlassLanding()).toBe(false);
    });
  });

  describe('secret reveal', () => {
    it('reveals when player is close enough', () => {
      const platform = new Platform({ x: 100, y: 100, width: 80, height: 20, type: 'secret' });

      // Player at center of platform (very close)
      const revealed = platform.checkSecretReveal(140, 110);
      expect(revealed).toBe(true);
      expect(platform.isSecretRevealed()).toBe(true);
    });

    it('does not reveal when player is far away', () => {
      const platform = new Platform({ x: 100, y: 100, width: 80, height: 20, type: 'secret' });

      // Player is 500px away
      const revealed = platform.checkSecretReveal(600, 100);
      expect(revealed).toBe(false);
      expect(platform.isSecretRevealed()).toBe(false);
    });

    it('does not re-reveal already revealed platform', () => {
      const platform = new Platform({ x: 100, y: 100, width: 80, height: 20, type: 'secret' });

      platform.checkSecretReveal(140, 110); // First reveal
      const secondResult = platform.checkSecretReveal(140, 110); // Already revealed
      expect(secondResult).toBe(false);
    });
  });

  describe('moving platform', () => {
    it('changes position over time when has horizontal move pattern', () => {
      const platform = new Platform({
        x: 100, y: 100, width: 100, height: 20, type: 'moving',
        movePattern: { type: 'horizontal', distance: 50, speed: 2 }
      });

      const startX = platform.x;

      // Advance several frames
      for (let i = 0; i < 60; i++) {
        platform.update(16);
      }

      expect(platform.x).not.toBe(startX);
    });

    it('non-moving platform stays put', () => {
      const platform = new Platform({ x: 100, y: 100, width: 100, height: 20, type: 'solid' });
      const startX = platform.x;

      for (let i = 0; i < 60; i++) {
        platform.update(16);
      }

      expect(platform.x).toBe(startX);
    });
  });

  describe('beat pulse', () => {
    it('triggers and decays over time', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'solid' });

      platform.triggerBeatPulse();
      expect(platform.getBeatPulse()).toBe(1);

      // Advance time to decay
      platform.update(200);
      expect(platform.getBeatPulse()).toBeLessThan(1);
    });

    it('debounces rapid triggers', () => {
      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'solid' });

      platform.triggerBeatPulse();
      expect(platform.getBeatPulse()).toBe(1);

      // Second trigger before decay below 0.5 should be ignored
      platform.update(50); // Small decay
      platform.triggerBeatPulse();
      // Should not reset to 1 since pulse > 0.5
      expect(platform.getBeatPulse()).toBeLessThan(1);
    });
  });

  describe('getBounds', () => {
    it('returns correct rectangle', () => {
      const platform = new Platform({ x: 50, y: 75, width: 200, height: 30, type: 'solid' });
      const bounds = platform.getBounds();

      expect(bounds.x).toBe(50);
      expect(bounds.y).toBe(75);
      expect(bounds.width).toBe(200);
      expect(bounds.height).toBe(30);
    });
  });

  describe('rhythm lock', () => {
    it('makes non-deadly platforms intangible off-beat', () => {
      Platform.setRhythmLockEnabled(true);
      Platform.updateBeatSolidity(0.5); // Mid-beat = off-beat

      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'solid' });
      expect(platform.isCollidable()).toBe(false);

      // Cleanup
      Platform.setRhythmLockEnabled(false);
    });

    it('keeps deadly platforms collidable off-beat', () => {
      Platform.setRhythmLockEnabled(true);
      Platform.updateBeatSolidity(0.5); // Mid-beat = off-beat

      const spike = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'spike' });
      const lava = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'lava' });

      expect(spike.isCollidable()).toBe(true);
      expect(lava.isCollidable()).toBe(true);

      // Cleanup
      Platform.setRhythmLockEnabled(false);
    });

    it('makes platforms solid on-beat', () => {
      Platform.setRhythmLockEnabled(true);
      Platform.updateBeatSolidity(0.0); // Right on the beat

      const platform = new Platform({ x: 0, y: 0, width: 100, height: 20, type: 'solid' });
      expect(platform.isCollidable()).toBe(true);

      // Cleanup
      Platform.setRhythmLockEnabled(false);
    });
  });
});
