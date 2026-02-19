/**
 * Shared scoring logic used by both web and mobile platforms.
 * Ensures scoring rules are consistent across platforms.
 */

/** Scoring configuration */
export interface ScoringConfig {
  baseLevelScore: number;
  attemptPenalty: number;
  coinBonus: number;
  minLevelScore: number;
  comboDuration: number;
  gemValues: Record<string, number>;
}

/** Default scoring config */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  baseLevelScore: 1000,
  attemptPenalty: 50,
  coinBonus: 100,
  minLevelScore: 100,
  comboDuration: 2000,
  gemValues: {
    ruby: 500,
    sapphire: 1000,
    emerald: 2000,
  },
};

/**
 * Calculate level completion score.
 * This is the authoritative scoring formula for both platforms.
 */
export function calculateLevelCompletionScore(
  attempts: number,
  coinsCollected: number,
  accumulatedGemBonus: number,
  modifierMultiplier: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  const attemptPenalty = (attempts - 1) * config.attemptPenalty;
  const coinBonus = coinsCollected * config.coinBonus;
  const rawScore = Math.max(config.baseLevelScore - attemptPenalty, config.minLevelScore)
    + coinBonus
    + accumulatedGemBonus;

  return Math.floor(rawScore * modifierMultiplier);
}

/**
 * Calculate combo multiplier based on coin count.
 * Every 3 consecutive coins increases multiplier by 0.5x.
 */
export function calculateComboMultiplier(comboCount: number): number {
  return 1 + Math.floor(comboCount / 3) * 0.5;
}

/**
 * Get the point value for a gem type.
 */
export function getGemValue(
  gemType: string,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  return config.gemValues[gemType] ?? 0;
}
