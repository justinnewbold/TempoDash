import { InputState } from '../types';

export class InputManager {
  private state: InputState = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  };

  private previousJump = false;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.setupListeners();
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
      this.state.jump = false;
    }, { passive: false });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.state.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.state.right = true;
        break;
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
      case 'ArrowLeft':
      case 'KeyA':
        this.state.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.state.right = false;
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.state.jump = false;
        break;
    }
  }

  private resetAll(): void {
    this.state.left = false;
    this.state.right = false;
    this.state.jump = false;
    this.state.jumpPressed = false;
  }

  update(): InputState {
    this.state.jumpPressed = this.state.jump && !this.previousJump;
    this.previousJump = this.state.jump;
    return { ...this.state };
  }

  getState(): InputState {
    return { ...this.state };
  }
}
