/**
 * TouchHandler - Gesture recognition system for mobile-first editor
 * Handles: tap, double-tap, long-press, drag, pinch-zoom, two-finger pan
 */

export interface TouchPoint {
  x: number;
  y: number;
  id: number;
  startX: number;
  startY: number;
  startTime: number;
}

export interface GestureEvent {
  type: 'tap' | 'doubletap' | 'longpress' | 'dragstart' | 'drag' | 'dragend' |
        'pinchstart' | 'pinch' | 'pinchend' | 'panstart' | 'pan' | 'panend';
  x: number;
  y: number;
  // For drag events
  deltaX?: number;
  deltaY?: number;
  startX?: number;
  startY?: number;
  // For pinch events
  scale?: number;
  centerX?: number;
  centerY?: number;
  // For velocity (momentum scrolling)
  velocityX?: number;
  velocityY?: number;
}

export type GestureCallback = (event: GestureEvent) => void;

export class TouchHandler {
  private canvas: HTMLCanvasElement;
  private touches: Map<number, TouchPoint> = new Map();
  private callback: GestureCallback;

  // Gesture detection state
  private lastTapTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;
  private longPressTimer: number | null = null;
  private isDragging = false;
  private isPinching = false;
  private isPanning = false;
  private initialPinchDistance = 0;
  private currentScale = 1;

  // Velocity tracking for momentum
  private velocityX = 0;
  private velocityY = 0;
  private lastMoveTime = 0;
  private lastMoveX = 0;
  private lastMoveY = 0;

  // Configuration
  private static readonly TAP_THRESHOLD = 10; // Max movement for tap
  private static readonly TAP_DURATION = 300; // Max ms for tap
  private static readonly DOUBLE_TAP_DELAY = 300; // Max ms between taps
  private static readonly LONG_PRESS_DELAY = 500; // ms to trigger long press
  private static readonly DOUBLE_TAP_DISTANCE = 30; // Max distance between taps

  constructor(canvas: HTMLCanvasElement, callback: GestureCallback) {
    this.canvas = canvas;
    this.callback = callback;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });

    // Mouse events (for desktop compatibility)
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
  }

  private getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();

    const now = Date.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const coords = this.getCanvasCoords(touch.clientX, touch.clientY);

      this.touches.set(touch.identifier, {
        id: touch.identifier,
        x: coords.x,
        y: coords.y,
        startX: coords.x,
        startY: coords.y,
        startTime: now,
      });
    }

    if (this.touches.size === 1) {
      // Single touch - could be tap, long press, or drag
      // Start long press timer
      this.longPressTimer = window.setTimeout(() => {
        if (this.touches.size === 1 && !this.isDragging) {
          const currentTouch = Array.from(this.touches.values())[0];
          const distance = Math.hypot(
            currentTouch.x - currentTouch.startX,
            currentTouch.y - currentTouch.startY
          );

          if (distance < TouchHandler.TAP_THRESHOLD) {
            this.callback({
              type: 'longpress',
              x: currentTouch.x,
              y: currentTouch.y,
            });
            this.longPressTimer = null;
          }
        }
      }, TouchHandler.LONG_PRESS_DELAY);

    } else if (this.touches.size === 2) {
      // Two touches - pinch or pan
      this.cancelLongPress();
      this.isDragging = false;

      const touchArray = Array.from(this.touches.values());
      this.initialPinchDistance = Math.hypot(
        touchArray[1].x - touchArray[0].x,
        touchArray[1].y - touchArray[0].y
      );
      this.currentScale = 1;
      this.isPinching = true;
      this.isPanning = true;

      const centerX = (touchArray[0].x + touchArray[1].x) / 2;
      const centerY = (touchArray[0].y + touchArray[1].y) / 2;

      this.callback({
        type: 'pinchstart',
        x: centerX,
        y: centerY,
        centerX,
        centerY,
        scale: 1,
      });

      this.callback({
        type: 'panstart',
        x: centerX,
        y: centerY,
      });

      this.lastMoveX = centerX;
      this.lastMoveY = centerY;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();

    const now = Date.now();

    // Update touch positions
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const existing = this.touches.get(touch.identifier);
      if (existing) {
        const coords = this.getCanvasCoords(touch.clientX, touch.clientY);
        existing.x = coords.x;
        existing.y = coords.y;
      }
    }

    if (this.touches.size === 1) {
      // Single finger drag
      const touch = Array.from(this.touches.values())[0];
      const distance = Math.hypot(
        touch.x - touch.startX,
        touch.y - touch.startY
      );

      if (distance >= TouchHandler.TAP_THRESHOLD) {
        this.cancelLongPress();

        if (!this.isDragging) {
          this.isDragging = true;
          this.callback({
            type: 'dragstart',
            x: touch.startX,
            y: touch.startY,
            startX: touch.startX,
            startY: touch.startY,
          });
          this.lastMoveX = touch.startX;
          this.lastMoveY = touch.startY;
          this.lastMoveTime = now;
        }

        // Calculate velocity
        const dt = (now - this.lastMoveTime) / 1000;
        if (dt > 0) {
          this.velocityX = (touch.x - this.lastMoveX) / dt;
          this.velocityY = (touch.y - this.lastMoveY) / dt;
        }

        this.callback({
          type: 'drag',
          x: touch.x,
          y: touch.y,
          deltaX: touch.x - this.lastMoveX,
          deltaY: touch.y - this.lastMoveY,
          startX: touch.startX,
          startY: touch.startY,
          velocityX: this.velocityX,
          velocityY: this.velocityY,
        });

        this.lastMoveX = touch.x;
        this.lastMoveY = touch.y;
        this.lastMoveTime = now;
      }

    } else if (this.touches.size === 2) {
      // Two finger pinch/pan
      const touchArray = Array.from(this.touches.values());
      const currentDistance = Math.hypot(
        touchArray[1].x - touchArray[0].x,
        touchArray[1].y - touchArray[0].y
      );

      const centerX = (touchArray[0].x + touchArray[1].x) / 2;
      const centerY = (touchArray[0].y + touchArray[1].y) / 2;

      // Pinch
      if (this.initialPinchDistance > 0) {
        this.currentScale = currentDistance / this.initialPinchDistance;

        this.callback({
          type: 'pinch',
          x: centerX,
          y: centerY,
          centerX,
          centerY,
          scale: this.currentScale,
        });
      }

      // Pan
      const dt = (now - this.lastMoveTime) / 1000;
      if (dt > 0) {
        this.velocityX = (centerX - this.lastMoveX) / dt;
        this.velocityY = (centerY - this.lastMoveY) / dt;
      }

      this.callback({
        type: 'pan',
        x: centerX,
        y: centerY,
        deltaX: centerX - this.lastMoveX,
        deltaY: centerY - this.lastMoveY,
        velocityX: this.velocityX,
        velocityY: this.velocityY,
      });

      this.lastMoveX = centerX;
      this.lastMoveY = centerY;
      this.lastMoveTime = now;
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    const now = Date.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.touches.get(touch.identifier);

      if (touchData && this.touches.size === 1) {
        const duration = now - touchData.startTime;
        const distance = Math.hypot(
          touchData.x - touchData.startX,
          touchData.y - touchData.startY
        );

        this.cancelLongPress();

        if (this.isDragging) {
          // End drag
          this.callback({
            type: 'dragend',
            x: touchData.x,
            y: touchData.y,
            startX: touchData.startX,
            startY: touchData.startY,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
          });
          this.isDragging = false;

        } else if (distance < TouchHandler.TAP_THRESHOLD &&
                   duration < TouchHandler.TAP_DURATION) {
          // Check for double tap
          const timeSinceLastTap = now - this.lastTapTime;
          const distanceFromLastTap = Math.hypot(
            touchData.x - this.lastTapX,
            touchData.y - this.lastTapY
          );

          if (timeSinceLastTap < TouchHandler.DOUBLE_TAP_DELAY &&
              distanceFromLastTap < TouchHandler.DOUBLE_TAP_DISTANCE) {
            // Double tap
            this.callback({
              type: 'doubletap',
              x: touchData.x,
              y: touchData.y,
            });
            this.lastTapTime = 0; // Reset to prevent triple-tap
          } else {
            // Single tap
            this.callback({
              type: 'tap',
              x: touchData.x,
              y: touchData.y,
            });
            this.lastTapTime = now;
            this.lastTapX = touchData.x;
            this.lastTapY = touchData.y;
          }
        }
      }

      this.touches.delete(touch.identifier);
    }

    // End pinch/pan if we're back to 0-1 touches
    if (this.touches.size < 2) {
      if (this.isPinching) {
        const x = this.lastMoveX;
        const y = this.lastMoveY;
        this.callback({
          type: 'pinchend',
          x,
          y,
          scale: this.currentScale,
          centerX: x,
          centerY: y,
        });
        this.isPinching = false;
      }

      if (this.isPanning) {
        this.callback({
          type: 'panend',
          x: this.lastMoveX,
          y: this.lastMoveY,
          velocityX: this.velocityX,
          velocityY: this.velocityY,
        });
        this.isPanning = false;
      }
    }
  }

  private cancelLongPress(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  // Mouse event handlers for desktop compatibility
  private mouseDown = false;
  private mouseStartX = 0;
  private mouseStartY = 0;
  private mouseStartTime = 0;

  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // Only left click

    const coords = this.getCanvasCoords(e.clientX, e.clientY);
    this.mouseDown = true;
    this.mouseStartX = coords.x;
    this.mouseStartY = coords.y;
    this.mouseStartTime = Date.now();
    this.lastMoveX = coords.x;
    this.lastMoveY = coords.y;
    this.lastMoveTime = Date.now();

    // Start long press timer for mouse too
    this.longPressTimer = window.setTimeout(() => {
      if (this.mouseDown && !this.isDragging) {
        this.callback({
          type: 'longpress',
          x: coords.x,
          y: coords.y,
        });
        this.longPressTimer = null;
      }
    }, TouchHandler.LONG_PRESS_DELAY);
  }

  private handleMouseMove(e: MouseEvent): void {
    const coords = this.getCanvasCoords(e.clientX, e.clientY);
    const now = Date.now();

    if (this.mouseDown) {
      const distance = Math.hypot(
        coords.x - this.mouseStartX,
        coords.y - this.mouseStartY
      );

      if (distance >= TouchHandler.TAP_THRESHOLD) {
        this.cancelLongPress();

        if (!this.isDragging) {
          this.isDragging = true;
          this.callback({
            type: 'dragstart',
            x: this.mouseStartX,
            y: this.mouseStartY,
            startX: this.mouseStartX,
            startY: this.mouseStartY,
          });
        }

        const dt = (now - this.lastMoveTime) / 1000;
        if (dt > 0) {
          this.velocityX = (coords.x - this.lastMoveX) / dt;
          this.velocityY = (coords.y - this.lastMoveY) / dt;
        }

        this.callback({
          type: 'drag',
          x: coords.x,
          y: coords.y,
          deltaX: coords.x - this.lastMoveX,
          deltaY: coords.y - this.lastMoveY,
          startX: this.mouseStartX,
          startY: this.mouseStartY,
          velocityX: this.velocityX,
          velocityY: this.velocityY,
        });

        this.lastMoveX = coords.x;
        this.lastMoveY = coords.y;
        this.lastMoveTime = now;
      }
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (!this.mouseDown) return;

    const coords = this.getCanvasCoords(e.clientX, e.clientY);
    const now = Date.now();
    const duration = now - this.mouseStartTime;
    const distance = Math.hypot(
      coords.x - this.mouseStartX,
      coords.y - this.mouseStartY
    );

    this.cancelLongPress();

    if (this.isDragging) {
      this.callback({
        type: 'dragend',
        x: coords.x,
        y: coords.y,
        startX: this.mouseStartX,
        startY: this.mouseStartY,
        velocityX: this.velocityX,
        velocityY: this.velocityY,
      });
      this.isDragging = false;

    } else if (distance < TouchHandler.TAP_THRESHOLD &&
               duration < TouchHandler.TAP_DURATION) {
      // Check for double click
      const timeSinceLastTap = now - this.lastTapTime;
      const distanceFromLastTap = Math.hypot(
        coords.x - this.lastTapX,
        coords.y - this.lastTapY
      );

      if (timeSinceLastTap < TouchHandler.DOUBLE_TAP_DELAY &&
          distanceFromLastTap < TouchHandler.DOUBLE_TAP_DISTANCE) {
        this.callback({
          type: 'doubletap',
          x: coords.x,
          y: coords.y,
        });
        this.lastTapTime = 0;
      } else {
        this.callback({
          type: 'tap',
          x: coords.x,
          y: coords.y,
        });
        this.lastTapTime = now;
        this.lastTapX = coords.x;
        this.lastTapY = coords.y;
      }
    }

    this.mouseDown = false;
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    const coords = this.getCanvasCoords(e.clientX, e.clientY);

    // Convert wheel to pinch gesture
    const delta = -e.deltaY * 0.001;
    const scale = 1 + delta;

    this.callback({
      type: 'pinch',
      x: coords.x,
      y: coords.y,
      centerX: coords.x,
      centerY: coords.y,
      scale,
    });
  }

  destroy(): void {
    this.cancelLongPress();
    // Note: Event listeners are automatically cleaned up when canvas is removed
  }
}
