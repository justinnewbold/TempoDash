import { InputState } from '../types';
import { GAME_WIDTH } from '../constants';

export class InputManager {
  private state: InputState = {
    jump: false,
    jumpPressed: false,
    dash: false,
    dashPressed: false,
  };

  private previousJump = false;
  private previousDash = false;
  private canvas: HTMLCanvasElement | null = null;
  private isMobile = false;

  constructor() {
    this.isMobile = this.detectMobile();
    this.setupListeners();
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window);
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupCanvasListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('blur', () => this.resetAll());
  }

  private setupCanvasListeners(): void {
    if (!this.canvas) return;

    // Mouse click for jump (right side of screen for dash on desktop too)
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const rect = this.canvas!.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (GAME_WIDTH / rect.width);

      // Right third of screen = dash, rest = jump
      if (x > GAME_WIDTH * 0.7) {
        this.state.dash = true;
      } else {
        this.state.jump = true;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.state.jump = false;
      this.state.dash = false;
    });

    // Touch support for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();

      // Two-finger tap = dash
      if (e.touches.length >= 2) {
        this.state.dash = true;
        this.state.jump = false; // Cancel jump if going to dash
        return;
      }

      // Single touch - check position
      const rect = this.canvas!.getBoundingClientRect();
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) * (GAME_WIDTH / rect.width);

      // Right third of screen = dash zone
      if (x > GAME_WIDTH * 0.7) {
        this.state.dash = true;
      } else {
        this.state.jump = true;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      // Only reset if no touches remain
      if (e.touches.length === 0) {
        this.state.jump = false;
        this.state.dash = false;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', () => {
      this.state.jump = false;
      this.state.dash = false;
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        e.preventDefault(); // Prevent page scroll
        this.state.jump = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.dash = true;
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.state.jump = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.dash = false;
        break;
    }
  }

  private resetAll(): void {
    this.state.jump = false;
    this.state.jumpPressed = false;
    this.state.dash = false;
    this.state.dashPressed = false;
  }

  update(): InputState {
    this.state.jumpPressed = this.state.jump && !this.previousJump;
    this.state.dashPressed = this.state.dash && !this.previousDash;
    this.previousJump = this.state.jump;
    this.previousDash = this.state.dash;
    return { ...this.state };
  }

  getState(): InputState {
    return { ...this.state };
  }

  // Check if running on mobile
  isMobileDevice(): boolean {
    return this.isMobile;
  }
}
