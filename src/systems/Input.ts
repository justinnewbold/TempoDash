import { InputState } from '../types';

export class InputManager {
  private state: InputState = {
    jump: false,
    jumpPressed: false,
    dash: false,
    dashPressed: false,
  };

  private previousJump = false;
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

    // Mouse click for jump
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.state.jump = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.state.jump = false;
    });

    // Touch support for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.state.jump = true;
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      // Only reset if no touches remain
      if (e.touches.length === 0) {
        this.state.jump = false;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', () => {
      this.state.jump = false;
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
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.state.jump = false;
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
    this.previousJump = this.state.jump;
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
