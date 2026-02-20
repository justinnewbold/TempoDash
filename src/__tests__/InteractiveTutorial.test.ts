import { describe, it, expect, beforeEach } from 'vitest';
import { InteractiveTutorial, TutorialStep } from '../systems/InteractiveTutorial';

function makeStep(id: string, opts?: Partial<TutorialStep>): TutorialStep {
  return {
    id,
    prompt: `Step ${id}`,
    condition: () => false,
    ...opts,
  };
}

describe('InteractiveTutorial', () => {
  let tutorial: InteractiveTutorial;

  beforeEach(() => {
    tutorial = new InteractiveTutorial();
  });

  it('is not active by default', () => {
    expect(tutorial.isActive).toBe(false);
  });

  it('starts with provided steps', () => {
    tutorial.start([makeStep('1'), makeStep('2')]);
    expect(tutorial.isActive).toBe(true);
    expect(tutorial.currentStep?.id).toBe('1');
  });

  it('advances when condition is met', () => {
    let done = false;
    tutorial.start([
      makeStep('1', { condition: () => done }),
      makeStep('2'),
    ]);

    tutorial.update(16);
    expect(tutorial.currentStep?.id).toBe('1');

    done = true;
    tutorial.update(16);
    expect(tutorial.currentStep?.id).toBe('2');
  });

  it('auto-advances after time limit', () => {
    tutorial.start([
      makeStep('1', { timeLimit: 100 }),
      makeStep('2'),
    ]);

    tutorial.update(50);
    expect(tutorial.currentStep?.id).toBe('1');

    tutorial.update(60);
    expect(tutorial.currentStep?.id).toBe('2');
  });

  it('deactivates after all steps complete', () => {
    let done = false;
    tutorial.start([
      makeStep('1', { condition: () => done }),
    ]);

    done = true;
    tutorial.update(16);
    expect(tutorial.isActive).toBe(false);
  });

  it('tracks completed steps', () => {
    let done = false;
    tutorial.start([
      makeStep('step-a', { condition: () => done }),
      makeStep('step-b'),
    ]);

    expect(tutorial.hasCompleted('step-a')).toBe(false);
    done = true;
    tutorial.update(16);
    expect(tutorial.hasCompleted('step-a')).toBe(true);
  });

  it('can be skipped', () => {
    tutorial.start([makeStep('1'), makeStep('2'), makeStep('3')]);
    tutorial.skip();
    expect(tutorial.isActive).toBe(false);
  });

  it('returns null step when not active', () => {
    expect(tutorial.currentStep).toBeNull();
  });
});
