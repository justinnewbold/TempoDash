import { describe, it, expect } from 'vitest';
import { LEVEL_CARDS } from '../config/LevelMetadata';
import { POWER_UP_CONFIG } from '../systems/PowerUps';

// Static-data invariants that the rest of the code assumes but does not
// re-check at runtime. hexToRgba in particular silently produces NaN for
// non-`#rrggbb` input, so a single typo in LEVEL_CARDS or POWER_UP_CONFIG
// would render as a transparent grey instead of failing loudly.
const HEX6 = /^#[0-9a-fA-F]{6}$/;

describe('Config integrity', () => {
  for (const card of LEVEL_CARDS) {
    it(`LEVEL_CARDS[${card.name}] colour is a 6-digit hex`, () => {
      expect(card.color).toMatch(HEX6);
    });

    it(`LEVEL_CARDS[${card.name}] difficulty is 1..5`, () => {
      expect(card.difficulty).toBeGreaterThanOrEqual(1);
      expect(card.difficulty).toBeLessThanOrEqual(5);
      expect(Number.isInteger(card.difficulty)).toBe(true);
    });
  }

  for (const [type, info] of Object.entries(POWER_UP_CONFIG)) {
    it(`POWER_UP_CONFIG[${type}] colour is a 6-digit hex`, () => {
      expect(info.color).toMatch(HEX6);
    });

    it(`POWER_UP_CONFIG[${type}] duration is positive`, () => {
      expect(info.duration).toBeGreaterThan(0);
    });
  }
});
