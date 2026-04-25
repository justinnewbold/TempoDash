import { describe, it, expect } from 'vitest';
import { createLevel, TOTAL_LEVELS } from '../levels';
import { LevelValidator } from '../systems/LevelValidator';
import { LEVEL_CARDS } from '../config/LevelMetadata';
import { LEVEL_MUSIC } from '../systems/Audio';

// Smoke-test every shipped level against the same validator used for custom
// levels. Catches broken player starts, unreachable goals, malformed
// platforms, and deadly-spawn overlaps before ship. Warnings are allowed
// (large gaps are sometimes intentional); errors are not.
describe('Built-in levels', () => {
  const validator = new LevelValidator();

  it('exposes every levelId 1..TOTAL_LEVELS via createLevel', () => {
    for (let id = 1; id <= TOTAL_LEVELS; id++) {
      const level = createLevel(id);
      expect(level.id).toBe(id);
    }
  });

  it('LEVEL_CARDS has exactly TOTAL_LEVELS entries', () => {
    // If these drift, the level-select card at index TOTAL_LEVELS-1 renders
    // as "undefined" with no color and no stars (caused the Level 16 bug).
    expect(LEVEL_CARDS).toHaveLength(TOTAL_LEVELS);
  });

  it('every LEVEL_CARDS entry matches its level config name', () => {
    // Card display name and LevelConfig.name should agree, otherwise the
    // level-select menu and in-game HUD show different titles.
    for (let id = 1; id <= TOTAL_LEVELS; id++) {
      const card = LEVEL_CARDS[id - 1];
      const config = createLevel(id).getConfig();
      expect(card.name, `Level ${id} card/config name mismatch`).toBe(config.name);
    }
  });

  it('LEVEL_MUSIC defines a style for every level', () => {
    // Missing entries fall back to 'noir' silently - cheap to guard against.
    for (let id = 1; id <= TOTAL_LEVELS; id++) {
      expect(LEVEL_MUSIC[id], `Level ${id} missing from LEVEL_MUSIC`).toBeDefined();
    }
  });

  for (let id = 1; id <= TOTAL_LEVELS; id++) {
    it(`Level ${id} passes validator with no errors`, () => {
      const config = createLevel(id).getConfig();
      const issues = validator.validate(config);
      const errors = issues.filter(i => i.severity === 'error');
      if (errors.length > 0) {
        throw new Error(
          `Level ${id} (${config.name}) has ${errors.length} validator error(s):\n` +
            errors.map(e => `  - ${e.message}`).join('\n')
        );
      }
    });
  }
});
