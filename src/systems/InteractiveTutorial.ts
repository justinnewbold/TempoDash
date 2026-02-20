/**
 * InteractiveTutorial - Guided in-game tutorial that teaches mechanics
 * through actual gameplay rather than static text pages.
 *
 * Each step waits for the player to perform an action before progressing.
 * Replaces the static 4-page tutorial with learn-by-doing approach.
 */

import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export interface TutorialStep {
  id: string;
  prompt: string;         // Main instruction text
  subtext?: string;        // Additional detail text
  highlight?: {            // Optional screen area to highlight
    x: number;
    y: number;
    width: number;
    height: number;
  };
  condition: () => boolean; // Returns true when step is complete
  timeLimit?: number;       // Auto-advance after N ms (for passive steps)
}

export class InteractiveTutorial {
  private steps: TutorialStep[] = [];
  private currentStepIndex = 0;
  private stepTimer = 0;
  private active = false;
  private completedSteps = new Set<string>();

  // Animation
  private promptAlpha = 0;
  private arrowBounce = 0;

  /** Whether the tutorial is currently running */
  get isActive(): boolean {
    return this.active;
  }

  /** Get current step (or null if tutorial is done) */
  get currentStep(): TutorialStep | null {
    if (!this.active || this.currentStepIndex >= this.steps.length) return null;
    return this.steps[this.currentStepIndex];
  }

  /**
   * Start the interactive tutorial with the given steps.
   * Typically called on the player's first playthrough.
   */
  start(steps: TutorialStep[]): void {
    this.steps = steps;
    this.currentStepIndex = 0;
    this.stepTimer = 0;
    this.active = true;
    this.promptAlpha = 0;
  }

  /** Skip / dismiss the tutorial */
  skip(): void {
    this.active = false;
    this.steps = [];
  }

  /** Update the tutorial state */
  update(deltaTime: number): void {
    if (!this.active) return;

    const step = this.currentStep;
    if (!step) {
      this.active = false;
      return;
    }

    // Fade in prompt
    if (this.promptAlpha < 1) {
      this.promptAlpha = Math.min(1, this.promptAlpha + deltaTime / 300);
    }

    // Arrow bounce animation
    this.arrowBounce += deltaTime / 500;

    // Check if current step is complete
    this.stepTimer += deltaTime;

    const timeExpired = step.timeLimit && this.stepTimer >= step.timeLimit;
    const conditionMet = step.condition();

    if (conditionMet || timeExpired) {
      this.completedSteps.add(step.id);
      this.currentStepIndex++;
      this.stepTimer = 0;
      this.promptAlpha = 0;

      if (this.currentStepIndex >= this.steps.length) {
        this.active = false;
      }
    }
  }

  /** Render the tutorial overlay */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const step = this.currentStep;
    if (!step) return;

    ctx.save();

    // Highlight area (if specified)
    if (step.highlight) {
      const h = step.highlight;
      // Darken everything except the highlight
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

      // Top
      ctx.fillRect(0, 0, GAME_WIDTH, h.y);
      // Bottom
      ctx.fillRect(0, h.y + h.height, GAME_WIDTH, GAME_HEIGHT - h.y - h.height);
      // Left
      ctx.fillRect(0, h.y, h.x, h.height);
      // Right
      ctx.fillRect(h.x + h.width, h.y, GAME_WIDTH - h.x - h.width, h.height);

      // Highlight border
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(h.x - 2, h.y - 2, h.width + 4, h.height + 4);
      ctx.setLineDash([]);
    }

    // Prompt box
    const promptY = step.highlight
      ? Math.min(step.highlight.y - 80, GAME_HEIGHT - 120)
      : GAME_HEIGHT - 120;

    ctx.globalAlpha = this.promptAlpha;

    // Background pill
    const text = step.prompt;
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    const textWidth = ctx.measureText(text).width;
    const pillWidth = textWidth + 40;
    const pillX = (GAME_WIDTH - pillWidth) / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.roundRect(pillX, promptY, pillWidth, step.subtext ? 60 : 40, 20);
    ctx.fill();

    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pillX, promptY, pillWidth, step.subtext ? 60 : 40, 20);
    ctx.stroke();

    // Main text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(text, GAME_WIDTH / 2, promptY + 27);

    // Subtext
    if (step.subtext) {
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(step.subtext, GAME_WIDTH / 2, promptY + 50);
    }

    // Bouncing arrow pointing to highlight
    if (step.highlight) {
      const arrowX = step.highlight.x + step.highlight.width / 2;
      const arrowY = step.highlight.y - 15 + Math.sin(this.arrowBounce) * 5;
      ctx.fillStyle = '#00ffaa';
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 8, arrowY - 12);
      ctx.lineTo(arrowX + 8, arrowY - 12);
      ctx.closePath();
      ctx.fill();
    }

    // Progress dots
    const dotStartX = GAME_WIDTH / 2 - (this.steps.length * 12) / 2;
    for (let i = 0; i < this.steps.length; i++) {
      ctx.fillStyle = i < this.currentStepIndex
        ? '#00ffaa'
        : i === this.currentStepIndex
          ? '#ffffff'
          : 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(dotStartX + i * 12, promptY - 15, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Skip hint
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('Press S to skip tutorial', GAME_WIDTH - 20, 20);

    ctx.restore();
  }

  /** Check if a specific step has been completed */
  hasCompleted(stepId: string): boolean {
    return this.completedSteps.has(stepId);
  }
}

/**
 * Create the default tutorial steps for first-time players.
 * Each step requires the player to actually perform the action.
 */
export function createDefaultTutorialSteps(getPlayerState: () => {
  isGrounded: boolean;
  jumpCount: number;
  isDashing: boolean;
  coinsCollected: number;
}): TutorialStep[] {
  let jumpsSeen = 0;
  let landingsSeen = 0;

  return [
    {
      id: 'welcome',
      prompt: 'Welcome to TempoDash!',
      subtext: 'A rhythm platformer — your character moves automatically',
      condition: () => false,
      timeLimit: 3000,
    },
    {
      id: 'first-jump',
      prompt: 'Press SPACE or UP to jump!',
      subtext: 'Tap the screen on mobile',
      condition: () => {
        const state = getPlayerState();
        if (!state.isGrounded) jumpsSeen++;
        return jumpsSeen > 0;
      },
    },
    {
      id: 'multi-jump',
      prompt: 'You can jump up to 5 times in the air!',
      subtext: 'Try jumping multiple times before landing',
      condition: () => {
        const state = getPlayerState();
        if (state.isGrounded && jumpsSeen > 0) landingsSeen++;
        return state.jumpCount >= 2 || landingsSeen > 2;
      },
    },
    {
      id: 'dash',
      prompt: 'Press SHIFT to dash forward!',
      subtext: 'Use dash to cross gaps or save yourself from edges',
      condition: () => getPlayerState().isDashing,
      timeLimit: 15000,
    },
    {
      id: 'collect-coin',
      prompt: 'Collect coins for bonus points!',
      subtext: 'Chain coins together for combo multipliers',
      condition: () => getPlayerState().coinsCollected > 0,
      timeLimit: 10000,
    },
    {
      id: 'good-luck',
      prompt: 'You\'re ready — reach the golden goal!',
      subtext: 'Land on platforms and watch for hazards',
      condition: () => false,
      timeLimit: 2500,
    },
  ];
}
