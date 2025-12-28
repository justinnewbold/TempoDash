// Mobile Touch Controls Overlay - On-screen buttons for mobile devices
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

interface TouchButton {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  icon: string;
  color: string;
  isPressed: boolean;
  opacity: number;
}

export class TouchControls {
  private buttons: Map<string, TouchButton> = new Map();
  private isEnabled = true;
  private isMobile = false;
  private opacity = 0.6;
  private scale = 1.0;
  private activeTouches: Map<number, string> = new Map();

  constructor() {
    this.detectMobile();
    this.setupButtons();
  }

  private detectMobile(): void {
    this.isMobile = 'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
  }

  private setupButtons(): void {
    const btnSize = 70;
    const padding = 20;

    // Jump button (right side, bottom)
    this.buttons.set('jump', {
      id: 'jump',
      x: GAME_WIDTH - btnSize - padding,
      y: GAME_HEIGHT - btnSize - padding,
      width: btnSize,
      height: btnSize,
      label: 'JUMP',
      icon: '⬆',
      color: '#00ffff',
      isPressed: false,
      opacity: this.opacity,
    });

    // Dash button (right side, above jump)
    this.buttons.set('dash', {
      id: 'dash',
      x: GAME_WIDTH - btnSize - padding,
      y: GAME_HEIGHT - btnSize * 2 - padding * 2,
      width: btnSize,
      height: btnSize,
      label: 'DASH',
      icon: '➡',
      color: '#ff00ff',
      isPressed: false,
      opacity: this.opacity,
    });

    // Pause button (top right)
    this.buttons.set('pause', {
      id: 'pause',
      x: GAME_WIDTH - 50 - padding,
      y: padding,
      width: 50,
      height: 50,
      label: '',
      icon: '⏸',
      color: '#ffffff',
      isPressed: false,
      opacity: this.opacity * 0.5,
    });
  }

  // Enable/disable touch controls
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Set opacity (0-1)
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
    for (const button of this.buttons.values()) {
      button.opacity = this.opacity;
    }
  }

  // Set scale (0.5-2.0)
  setScale(scale: number): void {
    this.scale = Math.max(0.5, Math.min(2, scale));
    this.setupButtons(); // Recreate with new scale
  }

  // Check if a button is pressed
  isButtonPressed(buttonId: string): boolean {
    const button = this.buttons.get(buttonId);
    return button?.isPressed || false;
  }

  // Handle touch start
  handleTouchStart(touches: TouchList, canvasRect: DOMRect, scaleX: number, scaleY: number): void {
    if (!this.isEnabled || !this.isMobile) return;

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const x = (touch.clientX - canvasRect.left) * scaleX;
      const y = (touch.clientY - canvasRect.top) * scaleY;

      for (const button of this.buttons.values()) {
        if (this.isPointInButton(x, y, button)) {
          button.isPressed = true;
          this.activeTouches.set(touch.identifier, button.id);
        }
      }
    }
  }

  // Handle touch move
  handleTouchMove(touches: TouchList, canvasRect: DOMRect, scaleX: number, scaleY: number): void {
    if (!this.isEnabled || !this.isMobile) return;

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const x = (touch.clientX - canvasRect.left) * scaleX;
      const y = (touch.clientY - canvasRect.top) * scaleY;

      const boundButtonId = this.activeTouches.get(touch.identifier);
      if (boundButtonId) {
        const button = this.buttons.get(boundButtonId);
        if (button && !this.isPointInButton(x, y, button)) {
          // Finger moved out of button
          button.isPressed = false;
          this.activeTouches.delete(touch.identifier);
        }
      }
    }
  }

  // Handle touch end
  handleTouchEnd(touches: TouchList): void {
    if (!this.isEnabled || !this.isMobile) return;

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const boundButtonId = this.activeTouches.get(touch.identifier);
      if (boundButtonId) {
        const button = this.buttons.get(boundButtonId);
        if (button) {
          button.isPressed = false;
        }
        this.activeTouches.delete(touch.identifier);
      }
    }
  }

  // Clear all button states
  clearAll(): void {
    for (const button of this.buttons.values()) {
      button.isPressed = false;
    }
    this.activeTouches.clear();
  }

  private isPointInButton(x: number, y: number, button: TouchButton): boolean {
    const scaledWidth = button.width * this.scale;
    const scaledHeight = button.height * this.scale;
    return x >= button.x && x <= button.x + scaledWidth &&
           y >= button.y && y <= button.y + scaledHeight;
  }

  // Render touch controls
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isEnabled || !this.isMobile) return;

    ctx.save();

    for (const button of this.buttons.values()) {
      const scaledWidth = button.width * this.scale;
      const scaledHeight = button.height * this.scale;

      // Button background
      const alpha = button.isPressed ? 0.8 : button.opacity;
      ctx.fillStyle = button.isPressed
        ? button.color
        : `rgba(0, 0, 0, ${alpha * 0.5})`;

      ctx.beginPath();
      ctx.roundRect(button.x, button.y, scaledWidth, scaledHeight, 15);
      ctx.fill();

      // Button border
      ctx.strokeStyle = button.color;
      ctx.lineWidth = button.isPressed ? 4 : 2;
      ctx.globalAlpha = alpha;
      ctx.stroke();

      // Button icon
      ctx.globalAlpha = alpha;
      ctx.font = `${24 * this.scale}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = button.isPressed ? '#000000' : button.color;
      ctx.fillText(
        button.icon,
        button.x + scaledWidth / 2,
        button.y + scaledHeight / 2 + 8 * this.scale
      );

      // Button label (smaller, below icon)
      if (button.label) {
        ctx.font = `${10 * this.scale}px "Segoe UI", sans-serif`;
        ctx.fillStyle = button.isPressed ? '#000000' : 'rgba(255,255,255,0.7)';
        ctx.fillText(
          button.label,
          button.x + scaledWidth / 2,
          button.y + scaledHeight - 8 * this.scale
        );
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Check if touch controls should be shown
  shouldShow(): boolean {
    return this.isEnabled && this.isMobile;
  }

  // Get button for hit testing from external code
  getButtonAt(x: number, y: number): string | null {
    for (const button of this.buttons.values()) {
      if (this.isPointInButton(x, y, button)) {
        return button.id;
      }
    }
    return null;
  }
}
