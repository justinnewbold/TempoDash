// Difficulty Modifier System for enhanced replayability

export type ModifierId =
  | 'speedDemon'
  | 'noDoubleJump'
  | 'fragile'
  | 'mirrorMode'
  | 'timeAttack'
  | 'invisible';

export interface Modifier {
  id: ModifierId;
  name: string;
  description: string;
  icon: string;
  scoreMultiplier: number;
  color: string;
}

export const MODIFIERS: Record<ModifierId, Modifier> = {
  speedDemon: {
    id: 'speedDemon',
    name: 'Speed Demon',
    description: '1.5x game speed',
    icon: '⚡',
    scoreMultiplier: 1.5,
    color: '#ff4444',
  },
  noDoubleJump: {
    id: 'noDoubleJump',
    name: 'Grounded',
    description: 'No air jumps allowed',
    icon: '🦶',
    scoreMultiplier: 1.3,
    color: '#44ff44',
  },
  fragile: {
    id: 'fragile',
    name: 'Fragile',
    description: 'Shield power-ups disabled',
    icon: '💔',
    scoreMultiplier: 1.2,
    color: '#ff88ff',
  },
  mirrorMode: {
    id: 'mirrorMode',
    name: 'Mirror Mode',
    description: 'Left and right controls swapped',
    icon: '🪞',
    scoreMultiplier: 1.4,
    color: '#88ffff',
  },
  timeAttack: {
    id: 'timeAttack',
    name: 'Time Attack',
    description: '60 second time limit',
    icon: '⏱️',
    scoreMultiplier: 1.25,
    color: '#ffff44',
  },
  invisible: {
    id: 'invisible',
    name: 'Invisible',
    description: 'Platforms fade after landing',
    icon: '👻',
    scoreMultiplier: 1.5,
    color: '#aaaaff',
  },
};

export class ModifierManager {
  private activeModifiers: Set<ModifierId> = new Set();
  private timeRemaining: number = 0; // For time attack mode
  private static readonly TIME_ATTACK_DURATION = 60000; // 60 seconds

  // Enable/disable a modifier
  toggleModifier(id: ModifierId): boolean {
    if (this.activeModifiers.has(id)) {
      this.activeModifiers.delete(id);
      return false;
    } else {
      this.activeModifiers.add(id);
      return true;
    }
  }

  // Check if a modifier is active
  isActive(id: ModifierId): boolean {
    return this.activeModifiers.has(id);
  }

  // Get all active modifiers
  getActiveModifiers(): ModifierId[] {
    return Array.from(this.activeModifiers);
  }

  // Get active modifier details
  getActiveModifierDetails(): Modifier[] {
    return this.getActiveModifiers().map(id => MODIFIERS[id]);
  }

  // Get combined score multiplier
  getScoreMultiplier(): number {
    let multiplier = 1.0;
    for (const id of this.activeModifiers) {
      multiplier *= MODIFIERS[id].scoreMultiplier;
    }
    return multiplier;
  }

  // Clear all modifiers
  clearAll(): void {
    this.activeModifiers.clear();
    this.timeRemaining = 0;
  }

  // Reset for new level (call at level start)
  resetForLevel(): void {
    if (this.isActive('timeAttack')) {
      this.timeRemaining = ModifierManager.TIME_ATTACK_DURATION;
    }
  }

  // Update time attack timer
  update(deltaTime: number): void {
    if (this.isActive('timeAttack') && this.timeRemaining > 0) {
      this.timeRemaining -= deltaTime;
    }
  }

  // Check if time attack expired
  isTimeExpired(): boolean {
    return this.isActive('timeAttack') && this.timeRemaining <= 0;
  }

  // Get remaining time for time attack
  getTimeRemaining(): number {
    return Math.max(0, this.timeRemaining);
  }

  // Get speed multiplier (for speed demon)
  getSpeedMultiplier(): number {
    return this.isActive('speedDemon') ? 1.5 : 1.0;
  }

  // Check if double jump is disabled
  isDoubleJumpDisabled(): boolean {
    return this.isActive('noDoubleJump');
  }

  // Check if shield power-ups should be disabled
  isShieldDisabled(): boolean {
    return this.isActive('fragile');
  }

  // Check if controls are mirrored
  isMirrored(): boolean {
    return this.isActive('mirrorMode');
  }

  // Check if platforms should fade
  shouldPlatformsFade(): boolean {
    return this.isActive('invisible');
  }

  // Get display string for active modifiers
  getActiveModifiersDisplay(): string {
    const active = this.getActiveModifierDetails();
    if (active.length === 0) return '';
    return active.map(m => `${m.icon} ${m.name}`).join(' | ');
  }

  // Get total active count
  getActiveCount(): number {
    return this.activeModifiers.size;
  }

  // Save/load modifier state
  serialize(): ModifierId[] {
    return this.getActiveModifiers();
  }

  deserialize(ids: ModifierId[]): void {
    this.activeModifiers.clear();
    for (const id of ids) {
      if (MODIFIERS[id]) {
        this.activeModifiers.add(id);
      }
    }
  }
}
