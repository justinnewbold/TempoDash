import { DEFAULT_SCORING_CONFIG } from './scoring';

// Scoring rules are gameplay design values and intentionally identical across platforms.
// Per-platform physics (gravity, jump force, scroll speed) is NOT shared - those legitimately diverge.
export const SCORING_DEFAULTS = {
  BASE_LEVEL_SCORE: DEFAULT_SCORING_CONFIG.baseLevelScore,
  ATTEMPT_PENALTY: DEFAULT_SCORING_CONFIG.attemptPenalty,
  COIN_BONUS: DEFAULT_SCORING_CONFIG.coinBonus,
  MIN_LEVEL_SCORE: DEFAULT_SCORING_CONFIG.minLevelScore,
  COMBO_DURATION: DEFAULT_SCORING_CONFIG.comboDuration,
  GEM_RUBY: DEFAULT_SCORING_CONFIG.gemValues.ruby,
  GEM_SAPPHIRE: DEFAULT_SCORING_CONFIG.gemValues.sapphire,
  GEM_EMERALD: DEFAULT_SCORING_CONFIG.gemValues.emerald,
} as const;

export const GEM_VALUES: Record<'ruby' | 'sapphire' | 'emerald', number> = {
  ruby: SCORING_DEFAULTS.GEM_RUBY,
  sapphire: SCORING_DEFAULTS.GEM_SAPPHIRE,
  emerald: SCORING_DEFAULTS.GEM_EMERALD,
};
