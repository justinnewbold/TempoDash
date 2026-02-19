/**
 * Accessibility system for screen reader announcements and keyboard navigation.
 * Provides a bridge between the Canvas-based game and assistive technologies.
 */

export class AccessibilityManager {
  private announcementElement: HTMLElement | null = null;
  private enabled = true;
  private lastAnnouncement = '';

  constructor() {
    this.announcementElement = document.getElementById('sr-announcements');

    // Detect user preference for reduced motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.onReducedMotionPreference?.();
    }
  }

  /** Callback for when user prefers reduced motion */
  onReducedMotionPreference: (() => void) | null = null;

  /** Enable or disable announcements */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Announce a message to screen readers via ARIA live region.
   * Debounces rapid announcements to avoid overwhelming the user.
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.enabled || !this.announcementElement) return;
    if (message === this.lastAnnouncement) return;

    this.lastAnnouncement = message;
    this.announcementElement.setAttribute('aria-live', priority);

    // Clear then set to trigger re-announcement
    this.announcementElement.textContent = '';
    // Use requestAnimationFrame to ensure the clear is processed first
    requestAnimationFrame(() => {
      if (this.announcementElement) {
        this.announcementElement.textContent = message;
      }
    });
  }

  // --- Game event announcements ---

  announceGameStart(levelName: string): void {
    this.announce(`Starting ${levelName}. Use Space or Up arrow to jump.`);
  }

  announceLevelComplete(levelName: string, score: number): void {
    this.announce(`Level complete! ${levelName}. Score: ${score}.`, 'assertive');
  }

  announcePlayerDeath(attempts: number): void {
    this.announce(`Died. Attempt ${attempts}.`);
  }

  announceCombo(count: number): void {
    if (count >= 10) {
      this.announce(`${count} coin combo!`);
    }
  }

  announceAchievement(name: string): void {
    this.announce(`Achievement unlocked: ${name}`, 'assertive');
  }

  announceMenuChange(menuName: string): void {
    this.announce(menuName);
  }

  announcePause(): void {
    this.announce('Game paused');
  }

  announceResume(): void {
    this.announce('Game resumed');
  }

  announceEndlessDistance(distance: number): void {
    // Only announce at milestones
    if (distance % 100 === 0 && distance > 0) {
      this.announce(`${distance} meters`);
    }
  }

  /** Clean up */
  destroy(): void {
    this.announcementElement = null;
  }
}
