/**
 * @tempo-dash/shared - Core game logic shared between web and mobile platforms.
 *
 * This module contains the authoritative implementations of:
 * - Physics calculations (gravity, collision, jumping)
 * - Scoring logic (level completion, combos, gems)
 * - Shared types (platform configs, game state, etc.)
 *
 * Both web (src/) and mobile (mobile/src/) should import from here
 * to ensure consistent behavior across platforms.
 */

export * from './types';
export * from './physics';
export * from './scoring';
