/**
 * Integration tests — verify that systems work together correctly.
 * These test the interaction between multiple modules rather than
 * individual units.
 */

import { describe, it, expect } from 'vitest';
import { ScoreManager } from '../game/ScoreManager';
import { RhythmSystem } from '../game/RhythmSystem';
import { StateValidator } from '../systems/StateValidator';
import { SpatialGrid, SpatialEntity } from '../systems/SpatialGrid';
import { LevelValidator } from '../systems/LevelValidator';
import { LevelConfig } from '../types';

describe('Integration: ScoreManager + StateValidator', () => {
  it('validates score after level completion', () => {
    const score = new ScoreManager();
    const validator = new StateValidator();
    validator.setEnabled(true);

    score.addGemPoints(500);
    const finalScore = score.calculateLevelScore(3, 5, 1.5);

    validator.validateScore('LevelComplete', finalScore);
    expect(validator.getErrors()).toHaveLength(0);
    expect(finalScore).toBeGreaterThan(0);
  });

  it('detects invalid negative score', () => {
    const validator = new StateValidator();
    validator.setEnabled(true);
    validator.validateScore('Test', -100);
    expect(validator.getErrors()).toHaveLength(1);
  });
});

describe('Integration: ScoreManager + RhythmSystem', () => {
  it('rhythm multiplier affects perceived difficulty tracking', () => {
    const score = new ScoreManager();
    const rhythm = new RhythmSystem();
    rhythm.setBPM(120);

    // Simulate a series of coin collects with rhythm
    score.registerCoinCollect();
    score.registerCoinCollect();
    score.registerCoinCollect();
    expect(score.comboMultiplier).toBe(1.5);

    // Rhythm streak should be trackable alongside combos
    rhythm.consecutiveOnBeatJumps = 5;
    rhythm.update(0);
    expect(rhythm.rhythmMultiplier).toBeGreaterThan(1);

    // Both multipliers can contribute to final scoring
    const rhythmBonus = rhythm.rhythmMultiplier;
    const comboBonus = score.comboMultiplier;
    expect(rhythmBonus * comboBonus).toBeGreaterThan(1);
  });
});

describe('Integration: SpatialGrid + LevelValidator', () => {
  it('spatial grid can index validated level platforms', () => {
    const validator = new LevelValidator();
    const grid = new SpatialGrid<SpatialEntity>(256);

    const level: LevelConfig = {
      id: 1,
      name: 'Test',
      platforms: [
        { x: 0, y: 460, width: 200, height: 40, type: 'solid' },
        { x: 300, y: 400, width: 150, height: 40, type: 'bounce' },
        { x: 600, y: 350, width: 100, height: 40, type: 'moving' },
        { x: 900, y: 460, width: 200, height: 40, type: 'solid' },
      ],
      playerStart: { x: 50, y: 400 },
      goal: { x: 950, y: 400, width: 80, height: 80 },
      background: {
        type: 'city',
        primaryColor: '#000',
        secondaryColor: '#111',
        accentColor: '#222',
      },
    };

    // Validate level first
    expect(validator.hasErrors(level)).toBe(false);

    // Build spatial grid from platforms
    grid.build(level.platforms.map(p => ({
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
    })));

    // Query viewport should find platforms in range (with margin)
    const visible = grid.queryViewport(0, 500, 540, 50);
    expect(visible.size).toBeGreaterThanOrEqual(2);
    expect(visible.size).toBeLessThanOrEqual(3);

    const midVisible = grid.queryViewport(400, 500, 540, 50);
    expect(midVisible.size).toBeGreaterThanOrEqual(1);
  });
});

describe('Integration: Full scoring pipeline', () => {
  it('simulates a complete level run', () => {
    const score = new ScoreManager();
    const rhythm = new RhythmSystem();
    const validator = new StateValidator();
    validator.setEnabled(true);

    rhythm.setBPM(128);

    // Player collects coins
    for (let i = 0; i < 8; i++) {
      score.registerCoinCollect();
    }
    expect(score.comboCount).toBe(8);
    expect(score.comboMultiplier).toBe(2); // floor(8/3)*0.5 + 1 = 2

    // Time passes, combo partially decays
    score.updateCombo(1500);
    expect(score.comboCount).toBe(8); // Timer hasn't fully expired

    // Collect gems
    score.addGemPoints(1000); // Sapphire
    score.addGemPoints(500);  // Ruby

    // Calculate final score
    const attempts = 2;
    const coins = 8;
    const modifierMult = 1.0;
    const finalScore = score.calculateLevelScore(attempts, coins, modifierMult);

    // Validate
    validator.validateScore('FinalScore', finalScore);
    expect(validator.getErrors()).toHaveLength(0);
    expect(finalScore).toBeGreaterThan(0);

    // Score breakdown:
    // base: max(1000 - 50, 100) = 950
    // coins: 8 * 100 = 800
    // gems: 1500
    // total: 950 + 800 + 1500 = 3250
    expect(finalScore).toBe(3250);
  });
});
