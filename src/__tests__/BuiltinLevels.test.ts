import { describe, it, expect } from 'vitest';
import { createLevel, TOTAL_LEVELS } from '../levels';
import { LevelValidator } from '../systems/LevelValidator';

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
