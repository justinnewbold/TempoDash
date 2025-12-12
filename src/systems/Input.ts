import { InputState } from '../types';

export class InputManager {
  private state: InputState = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  };

  private previousJump = false;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('blur', () => this.resetAll());
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
