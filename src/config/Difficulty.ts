// Player-selected difficulty. Scales game speed and jump forgiveness
// (coyote time + jump buffer windows).

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyPreset {
  label: string;
  speedMultiplier: number;  // Applied to auto-scroll speed
  timingMultiplier: number; // Applied to coyote time and jump buffer
  color: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyPreset> = {
  easy:   { label: 'Easy',   speedMultiplier: 0.85, timingMultiplier: 2.0, color: '#00ffaa' },
  normal: { label: 'Normal', speedMultiplier: 1.0,  timingMultiplier: 1.0, color: '#ffaa00' },
  hard:   { label: 'Hard',   speedMultiplier: 1.15, timingMultiplier: 0.6, color: '#ff4444' },
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'normal', 'hard'];
