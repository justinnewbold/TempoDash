import { describe, it, expect } from 'vitest';
import { LevelValidator } from '../systems/LevelValidator';
import { LevelConfig } from '../types';

function makeLevel(overrides?: Partial<LevelConfig>): LevelConfig {
  return {
    id: 1,
    name: 'Test',
    platforms: [
      { x: 0, y: 460, width: 200, height: 40, type: 'solid' },
      { x: 300, y: 460, width: 200, height: 40, type: 'solid' },
    ],
    playerStart: { x: 50, y: 400 },
    goal: { x: 400, y: 400, width: 80, height: 80 },
    background: {
      type: 'city',
      primaryColor: '#000',
      secondaryColor: '#111',
      accentColor: '#222',
    },
    ...overrides,
  };
}

describe('LevelValidator', () => {
  const validator = new LevelValidator();

  it('accepts a valid level with no issues', () => {
    const issues = validator.validate(makeLevel());
    const errors = issues.filter(i => i.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('reports missing player start', () => {
    const issues = validator.validate(makeLevel({ playerStart: undefined as any }));
    expect(issues.some(i => i.message.includes('Missing player start'))).toBe(true);
  });

  it('reports missing goal', () => {
    const issues = validator.validate(makeLevel({ goal: undefined as any }));
    expect(issues.some(i => i.message.includes('Missing goal'))).toBe(true);
  });

  it('reports no platforms', () => {
    const issues = validator.validate(makeLevel({ platforms: [] }));
    expect(issues.some(i => i.message.includes('no platforms'))).toBe(true);
  });

  it('reports zero-dimension platforms', () => {
    const issues = validator.validate(makeLevel({
      platforms: [{ x: 0, y: 460, width: 0, height: 40, type: 'solid' }],
    }));
    expect(issues.some(i => i.message.includes('zero or negative dimensions'))).toBe(true);
  });

  it('reports player spawning on deadly platform', () => {
    const issues = validator.validate(makeLevel({
      playerStart: { x: 50, y: 450 },
      platforms: [
        { x: 0, y: 440, width: 200, height: 40, type: 'lava' },
      ],
    }));
    expect(issues.some(i => i.message.includes('deadly'))).toBe(true);
  });

  it('warns about goal behind player start', () => {
    const issues = validator.validate(makeLevel({
      playerStart: { x: 500, y: 400 },
      goal: { x: 100, y: 400, width: 80, height: 80 },
    }));
    expect(issues.some(i => i.message.includes('left of player start'))).toBe(true);
  });

  it('warns about large gaps', () => {
    const issues = validator.validate(makeLevel({
      platforms: [
        { x: 0, y: 460, width: 100, height: 40, type: 'solid' },
        { x: 800, y: 460, width: 100, height: 40, type: 'solid' },
      ],
    }));
    expect(issues.some(i => i.message.includes('Large gap'))).toBe(true);
  });

  it('hasErrors returns true for broken levels', () => {
    expect(validator.hasErrors(makeLevel({ platforms: [] }))).toBe(true);
  });

  it('hasErrors returns false for valid levels', () => {
    expect(validator.hasErrors(makeLevel())).toBe(false);
  });
});
