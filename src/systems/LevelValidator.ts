/**
 * LevelValidator - Validates level configs for playability issues.
 * Catches broken custom levels and configuration errors before gameplay.
 */

import { LevelConfig } from '../types';
import { PLAYER, GAME_HEIGHT } from '../constants';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  element?: { type: string; index: number };
}

export class LevelValidator {
  /**
   * Validate a level config and return any issues found.
   * Returns empty array if the level is valid.
   */
  validate(config: LevelConfig): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    this.checkPlayerStart(config, issues);
    this.checkGoal(config, issues);
    this.checkGoalReachable(config, issues);
    this.checkPlatforms(config, issues);
    this.checkCoins(config, issues);
    this.checkDeadlySpawn(config, issues);

    return issues;
  }

  /** Check if the level has critical errors that prevent play */
  hasErrors(config: LevelConfig): boolean {
    return this.validate(config).some(i => i.severity === 'error');
  }

  private checkPlayerStart(config: LevelConfig, issues: ValidationIssue[]): void {
    if (!config.playerStart) {
      issues.push({ severity: 'error', message: 'Missing player start position' });
      return;
    }

    const { x, y } = config.playerStart;
    if (x < 0 || y < 0) {
      issues.push({
        severity: 'warning',
        message: `Player start is at negative coordinates (${x}, ${y})`,
      });
    }

    if (y > GAME_HEIGHT + 100) {
      issues.push({
        severity: 'error',
        message: 'Player start is below the screen — player will immediately die',
      });
    }
  }

  private checkGoal(config: LevelConfig, issues: ValidationIssue[]): void {
    if (!config.goal) {
      issues.push({ severity: 'error', message: 'Missing goal/finish zone' });
      return;
    }

    if (config.goal.width <= 0 || config.goal.height <= 0) {
      issues.push({ severity: 'error', message: 'Goal has zero or negative dimensions' });
    }
  }

  private checkGoalReachable(config: LevelConfig, issues: ValidationIssue[]): void {
    if (!config.playerStart || !config.goal) return;

    // Check if goal is to the right of start (basic reachability)
    if (config.goal.x < config.playerStart.x) {
      issues.push({
        severity: 'warning',
        message: 'Goal is to the left of player start — may be unreachable with auto-scroll',
      });
    }

    // Check if there's a wide gap with no platforms near the goal
    const goalX = config.goal.x;
    const nearGoalPlatforms = config.platforms.filter(p =>
      p.x + p.width >= goalX - 300 && p.x <= goalX + config.goal.width + 100
    );

    if (nearGoalPlatforms.length === 0) {
      issues.push({
        severity: 'warning',
        message: 'No platforms near the goal — player may not be able to reach it',
      });
    }
  }

  private checkPlatforms(config: LevelConfig, issues: ValidationIssue[]): void {
    if (config.platforms.length === 0) {
      issues.push({ severity: 'error', message: 'Level has no platforms' });
      return;
    }

    // Check for platforms with invalid dimensions
    config.platforms.forEach((p, i) => {
      if (p.width <= 0 || p.height <= 0) {
        issues.push({
          severity: 'error',
          message: `Platform ${i} has zero or negative dimensions (${p.width}x${p.height})`,
          element: { type: 'platform', index: i },
        });
      }

      if (p.y > GAME_HEIGHT + 200) {
        issues.push({
          severity: 'warning',
          message: `Platform ${i} is far below screen at y=${p.y}`,
          element: { type: 'platform', index: i },
        });
      }
    });

    // Check for very large gaps that might be unjumpable
    const sorted = [...config.platforms]
      .filter(p => p.type !== 'spike' && p.type !== 'lava')
      .sort((a, b) => a.x - b.x);

    const maxJumpDistance = PLAYER.SPEED * 1.5; // ~525px at base speed
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].x - (sorted[i].x + sorted[i].width);
      if (gap > maxJumpDistance) {
        issues.push({
          severity: 'warning',
          message: `Large gap of ${Math.round(gap)}px between platforms ${i} and ${i + 1} may be unjumpable`,
        });
      }
    }
  }

  private checkCoins(config: LevelConfig, issues: ValidationIssue[]): void {
    if (!config.coins) return;

    config.coins.forEach((coin, i) => {
      if (coin.y > GAME_HEIGHT + 100) {
        issues.push({
          severity: 'warning',
          message: `Coin ${i} is below the screen at y=${coin.y}`,
          element: { type: 'coin', index: i },
        });
      }
    });
  }

  private checkDeadlySpawn(config: LevelConfig, issues: ValidationIssue[]): void {
    if (!config.playerStart) return;

    const px = config.playerStart.x;
    const py = config.playerStart.y;
    const pw = PLAYER.WIDTH;
    const ph = PLAYER.HEIGHT;

    // Check if player spawns on top of a deadly platform
    for (let i = 0; i < config.platforms.length; i++) {
      const plat = config.platforms[i];
      if (plat.type !== 'lava' && plat.type !== 'spike') continue;

      // AABB overlap check
      if (
        px + pw > plat.x &&
        px < plat.x + plat.width &&
        py + ph > plat.y &&
        py < plat.y + plat.height
      ) {
        issues.push({
          severity: 'error',
          message: `Player spawns overlapping deadly ${plat.type} platform ${i}`,
          element: { type: 'platform', index: i },
        });
      }
    }
  }
}
