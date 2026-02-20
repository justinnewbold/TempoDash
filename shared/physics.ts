/**
 * Shared physics calculations used by both web and mobile platforms.
 * These are the core gameplay physics that should be identical across platforms.
 */

/** AABB collision detection result */
export type CollisionSide = 'top' | 'bottom' | 'left' | 'right' | null;

/**
 * Check AABB collision between two rectangles and return the collision side.
 * Returns the side of rect2 that rect1 is colliding with, or null if no collision.
 */
export function checkAABBCollision(
  r1x: number, r1y: number, r1w: number, r1h: number,
  r2x: number, r2y: number, r2w: number, r2h: number
): CollisionSide {
  // Check if overlapping
  if (
    r1x + r1w <= r2x ||
    r1x >= r2x + r2w ||
    r1y + r1h <= r2y ||
    r1y >= r2y + r2h
  ) {
    return null;
  }

  // Determine collision side by minimum overlap
  const overlapLeft = r1x + r1w - r2x;
  const overlapRight = r2x + r2w - r1x;
  const overlapTop = r1y + r1h - r2y;
  const overlapBottom = r2y + r2h - r1y;

  const minOverlapX = Math.min(overlapLeft, overlapRight);
  const minOverlapY = Math.min(overlapTop, overlapBottom);

  if (minOverlapY < minOverlapX) {
    return overlapTop < overlapBottom ? 'top' : 'bottom';
  } else {
    return overlapLeft < overlapRight ? 'left' : 'right';
  }
}

/**
 * Apply gravity to velocity, respecting terminal velocity.
 * Works for both normal and flipped gravity.
 */
export function applyGravity(
  velocityY: number,
  gravity: number,
  maxFallSpeed: number,
  deltaSeconds: number,
  gravityFlipped: boolean,
  slowMoMultiplier = 1.0
): number {
  const gravityDir = gravityFlipped ? -1 : 1;
  let vy = velocityY + gravity * gravityDir * slowMoMultiplier * deltaSeconds;

  // Clamp terminal velocity (both directions for flipped gravity)
  if (gravityFlipped) {
    if (vy < -maxFallSpeed) vy = -maxFallSpeed;
  } else {
    if (vy > maxFallSpeed) vy = maxFallSpeed;
  }

  return vy;
}

/**
 * Calculate jump velocity with per-jump multiplier.
 * Supports multi-jump with decreasing/varying force per jump.
 */
export function calculateJumpVelocity(
  baseJumpForce: number,
  jumpIndex: number,
  multipliers: readonly number[]
): number {
  const mult = jumpIndex < multipliers.length ? multipliers[jumpIndex] : 0.5;
  return -baseJumpForce * mult;
}

/**
 * Clamp a value to a range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}
