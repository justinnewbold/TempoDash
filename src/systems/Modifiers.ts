// Difficulty Modifier System for enhanced replayability

export type ModifierId =
  | 'speedDemon'
  | 'noDoubleJump'
  | 'fragile'
  | 'mirrorMode'
  | 'timeAttack'
  | 'invisible'
  // New fun modifiers
  | 'bigHead'
  | 'neonMode'
  | 'chaosMode'
  | 'lowGravity'
  | 'hyperSpeed'
  | 'tinyMode'
  | 'rainbowTrail'
  | 'earthquakeMode'
  // Rhythm-based modifier
  | 'rhythmLock';

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
  // New fun modifiers
  bigHead: {
    id: 'bigHead',
    name: 'Big Head Mode',
    description: 'Player is 2x bigger (easier to see, harder to fit)',
    icon: '🎃',
    scoreMultiplier: 0.8,
    color: '#ffaa00',
  },
  neonMode: {
    id: 'neonMode',
    name: 'Neon Dreams',
    description: 'Everything glows with neon outlines',
    icon: '💜',
    scoreMultiplier: 1.0,
    color: '#ff00ff',
  },
  chaosMode: {
    id: 'chaosMode',
    name: 'Chaos Mode',
    description: 'Platform types randomize as you play',
    icon: '🎲',
    scoreMultiplier: 1.3,
    color: '#ff6600',
  },
  lowGravity: {
    id: 'lowGravity',
    name: 'Moon Bounce',
    description: 'Reduced gravity, floaty jumps',
    icon: '🌙',
    scoreMultiplier: 0.9,
    color: '#aaffff',
  },
  hyperSpeed: {
    id: 'hyperSpeed',
    name: 'Hyper Speed',
    description: '2x game speed for the brave',
    icon: '🚀',
    scoreMultiplier: 2.0,
    color: '#ff0000',
  },
  tinyMode: {
    id: 'tinyMode',
    name: 'Tiny Mode',
    description: 'Player is 0.5x size (easier to dodge)',
    icon: '🐜',
    scoreMultiplier: 1.1,
    color: '#88ff88',
  },
  rainbowTrail: {
    id: 'rainbowTrail',
    name: 'Rainbow Trail',
    description: 'Leave a beautiful rainbow trail',
    icon: '🌈',
    scoreMultiplier: 1.0,
    color: '#ff0088',
  },
  earthquakeMode: {
    id: 'earthquakeMode',
    name: 'Earthquake',
    description: 'Screen constantly shakes',
    icon: '🌋',
    scoreMultiplier: 1.2,
    color: '#884400',
  },
  rhythmLock: {
    id: 'rhythmLock',
    name: 'Rhythm Lock',
    description: 'Platforms only solid on the beat!',
    icon: '🎵',
    scoreMultiplier: 1.8,
    color: '#ff00aa',
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

  // Get speed multiplier (for speed demon and hyper speed)
  getSpeedMultiplier(): number {
    let speed = 1.0;
    if (this.isActive('speedDemon')) speed *= 1.5;
    if (this.isActive('hyperSpeed')) speed *= 2.0;
    return speed;
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

  // ===== NEW FUN MODIFIER HELPERS =====

  // Get player scale (for big head / tiny mode)
  getPlayerScale(): number {
    if (this.isActive('bigHead')) return 2.0;
    if (this.isActive('tinyMode')) return 0.5;
    return 1.0;
  }

  // Check if neon mode is active
  isNeonMode(): boolean {
    return this.isActive('neonMode');
  }

  // Check if chaos mode is active (random platform types)
  isChaosMode(): boolean {
    return this.isActive('chaosMode');
  }

  // Get gravity multiplier (for low gravity)
  getGravityMultiplier(): number {
    return this.isActive('lowGravity') ? 0.5 : 1.0;
  }

  // Check if rainbow trail is active
  isRainbowTrail(): boolean {
    return this.isActive('rainbowTrail');
  }

  // Check if earthquake mode is active
  isEarthquakeMode(): boolean {
    return this.isActive('earthquakeMode');
  }

  // Get earthquake shake intensity
  getEarthquakeIntensity(): number {
    return this.isActive('earthquakeMode') ? 3 : 0;
  }

  // Check if rhythm lock mode is active
  isRhythmLockMode(): boolean {
    return this.isActive('rhythmLock');
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
