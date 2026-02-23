import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../entities/Player';
import { Platform } from '../entities/Platform';
import { InputState } from '../types';

// Helper: create a default input state
function noInput(): InputState {
  return { jump: false, jumpPressed: false, dash: false, dashPressed: false };
}

function jumpInput(): InputState {
  return { jump: true, jumpPressed: true, dash: false, dashPressed: false };
}

// Helper: create a solid platform below the player
function solidPlatform(x: number, y: number, width = 200, height = 20): Platform {
  return new Platform({ x, y, width, height, type: 'solid' });
}

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player({ x: 100, y: 100 });
  });

  describe('initialization', () => {
    it('starts at the given position', () => {
      expect(player.x).toBe(100);
      expect(player.y).toBe(100);
    });

    it('starts not dead', () => {
      expect(player.isDead).toBe(false);
    });

    it('starts not grounded (no platform below)', () => {
      expect(player.isGrounded).toBe(false);
    });

    it('has zero vertical velocity initially', () => {
      expect(player.velocityY).toBe(0);
    });
  });

  describe('gravity', () => {
    it('accelerates downward when not grounded', () => {
      player.update(16, noInput(), [], 1.0);
      expect(player.velocityY).toBeGreaterThan(0);
    });

    it('falls further with longer delta time', () => {
      const p1 = new Player({ x: 100, y: 100 });
      const p2 = new Player({ x: 100, y: 100 });

      p1.update(8, noInput(), [], 1.0);
      p2.update(16, noInput(), [], 1.0);

      expect(p2.velocityY).toBeGreaterThan(p1.velocityY);
    });
  });

  describe('auto-scroll', () => {
    it('moves rightward automatically', () => {
      const startX = player.x;
      player.update(16, noInput(), [], 1.0);
      expect(player.x).toBeGreaterThan(startX);
    });

    it('moves faster with higher speed multiplier', () => {
      const p1 = new Player({ x: 100, y: 100 });
      const p2 = new Player({ x: 100, y: 100 });

      p1.update(16, noInput(), [], 1.0);
      p2.update(16, noInput(), [], 2.0);

      const distance1 = p1.x - 100;
      const distance2 = p2.x - 100;
      expect(distance2).toBeCloseTo(distance1 * 2, 0);
    });
  });

  describe('jumping', () => {
    it('applies negative velocity on jump press when grounded', () => {
      // Place player on a platform to be grounded
      const platform = solidPlatform(50, 120, 200, 20);
      // First frame: land on platform
      player.y = 100;
      player.velocityY = 10;
      player.update(16, noInput(), [platform], 1.0);

      // Now jump
      player.update(16, jumpInput(), [platform], 1.0);
      expect(player.velocityY).toBeLessThan(0);
    });

    it('allows air jumps when not grounded', () => {
      // Player is in the air, not grounded
      player.velocityY = 100; // falling
      player.update(16, noInput(), [], 1.0); // one frame to establish airborne
      const velBefore = player.velocityY;

      player.update(16, jumpInput(), [], 1.0);
      // Air jump should be used (velocity should decrease)
      expect(player.velocityY).toBeLessThan(velBefore);
    });

    it('disallows air jumps when allowAirJumps is false', () => {
      // One frame to be airborne
      player.update(16, noInput(), [], 1.0);
      const velAfterFall = player.velocityY;

      // Try to jump with air jumps disabled
      player.update(16, jumpInput(), [], 1.0, false);

      // Velocity should still be increasing (falling), not jumping
      expect(player.velocityY).toBeGreaterThan(velAfterFall);
    });
  });

  describe('coyote time', () => {
    it('allows jump shortly after leaving platform', () => {
      // Land on platform
      const platform = solidPlatform(50, 120, 200, 20);
      player.y = 100;
      player.velocityY = 10;
      player.update(16, noInput(), [platform], 1.0);

      // Walk off the platform (no platform below)
      player.update(16, noInput(), [], 1.0);

      // Jump within coyote window (80ms, we're at ~16ms)
      player.update(16, jumpInput(), [], 1.0);

      // Should have jumped (negative velocity)
      expect(player.velocityY).toBeLessThan(0);
    });
  });

  describe('getBounds', () => {
    it('returns current position and dimensions', () => {
      const bounds = player.getBounds();
      expect(bounds.x).toBe(player.x);
      expect(bounds.y).toBe(player.y);
      expect(bounds.width).toBe(player.width);
      expect(bounds.height).toBe(player.height);
    });
  });

  describe('collision with platforms', () => {
    it('lands on solid platform (stops falling)', () => {
      const platform = solidPlatform(80, 130, 200, 20);
      player.y = 110;
      player.velocityY = 50;

      player.update(16, noInput(), [platform], 1.0);

      // Player should be on top of the platform
      expect(player.isGrounded).toBe(true);
      expect(player.velocityY).toBe(0);
    });

    it('dies on spike platform', () => {
      const spike = new Platform({ x: 80, y: 130, width: 200, height: 20, type: 'spike' });
      player.y = 110;
      player.velocityY = 50;

      player.update(16, noInput(), [spike], 1.0);

      expect(player.isDead).toBe(true);
    });

    it('dies on lava platform', () => {
      const lava = new Platform({ x: 80, y: 130, width: 200, height: 20, type: 'lava' });
      player.y = 110;
      player.velocityY = 50;

      player.update(16, noInput(), [lava], 1.0);

      expect(player.isDead).toBe(true);
    });

    it('bounces on bounce platform', () => {
      const bounce = new Platform({ x: 80, y: 130, width: 200, height: 20, type: 'bounce' });
      player.y = 110;
      player.velocityY = 50;

      player.update(16, noInput(), [bounce], 1.0);

      // Should bounce (negative velocity, stronger than normal jump)
      expect(player.velocityY).toBeLessThan(0);
    });

    it('ignores destroyed platforms', () => {
      const platform = solidPlatform(80, 130, 200, 20);
      platform.isDestroyed = true;
      player.y = 110;
      player.velocityY = 50;

      player.update(16, noInput(), [platform], 1.0);

      // Should fall through destroyed platform
      expect(player.isGrounded).toBe(false);
    });
  });
});
