/**
 * PropertyInspector - Slide-up panel for editing element properties
 * Mobile-first design with large touch targets
 */

import { PlatformConfig, CoinConfig, Vector2, PlatformType } from '../types';

export type InspectorElement =
  | { type: 'platform'; data: PlatformConfig; index: number }
  | { type: 'coin'; data: CoinConfig; index: number }
  | { type: 'playerStart'; data: Vector2 }
  | { type: 'goal'; data: { x: number; y: number; width: number; height: number } };

export interface PropertyChange {
  elementType: string;
  index?: number;
  property: string;
  value: number | string | boolean | object;
}

export type PropertyChangeCallback = (change: PropertyChange) => void;

const PLATFORM_TYPES: PlatformType[] = ['solid', 'bounce', 'ice', 'lava', 'spike', 'moving', 'phase', 'crumble'];

const PLATFORM_COLORS: Record<PlatformType, string> = {
  solid: '#4a9eff',
  bounce: '#ff6b9d',
  ice: '#88ddff',
  lava: '#ff4400',
  spike: '#ff0000',
  moving: '#9966ff',
  phase: '#66ffaa',
  crumble: '#aa8866',
};

export class PropertyInspector {
  private element: InspectorElement | null = null;
  private isVisible = false;
  private panelHeight = 0;
  private targetHeight = 0;
  private animationSpeed = 0.15;

  // Panel dimensions
  private readonly minHeight = 280;
  private readonly maxHeight = 450;
  private readonly headerHeight = 48;
  private readonly rowHeight = 52;
  private readonly buttonSize = 48;
  private readonly padding = 16;

  // Callback for property changes
  private onChange: PropertyChangeCallback;

  // Hold-to-repeat state
  private holdTimer: number | null = null;
  private holdButton: { property: string; delta: number } | null = null;
  private holdInterval: number | null = null;

  constructor(onChange: PropertyChangeCallback) {
    this.onChange = onChange;
  }

  show(element: InspectorElement): void {
    this.element = element;
    this.isVisible = true;
    this.targetHeight = this.calculateHeight();
  }

  hide(): void {
    this.isVisible = false;
    this.targetHeight = 0;
  }

  toggle(element: InspectorElement): void {
    if (this.isVisible && this.element?.type === element.type &&
        ('index' in this.element && 'index' in element && this.element.index === element.index)) {
      this.hide();
    } else {
      this.show(element);
    }
  }

  isOpen(): boolean {
    return this.isVisible || this.panelHeight > 0;
  }

  getHeight(): number {
    return this.panelHeight;
  }

  private calculateHeight(): number {
    if (!this.element) return this.minHeight;

    let rows = 3; // Header + type + position (X/Y)

    if (this.element.type === 'platform') {
      rows += 1; // Size row
      if (this.element.data.type === 'moving') {
        rows += 2; // Pattern + distance/speed
      } else if (this.element.data.type === 'phase') {
        rows += 1; // Phase offset
      }
    }

    return Math.min(this.maxHeight, this.headerHeight + rows * this.rowHeight + this.padding * 2);
  }

  update(_deltaTime: number): void {
    // Animate panel height
    const diff = this.targetHeight - this.panelHeight;
    if (Math.abs(diff) > 1) {
      this.panelHeight += diff * this.animationSpeed;
    } else {
      this.panelHeight = this.targetHeight;
    }

    // Clear element when fully hidden
    if (!this.isVisible && this.panelHeight === 0) {
      this.element = null;
    }
  }

  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (this.panelHeight <= 0) return;

    const panelY = canvasHeight - this.panelHeight;

    // Panel background with shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, panelY - 10, canvasWidth, 10);

    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, panelY, canvasWidth, this.panelHeight);

    // Drag handle
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.roundRect(canvasWidth / 2 - 20, panelY + 8, 40, 4, 2);
    ctx.fill();

    if (!this.element) return;

    let y = panelY + this.headerHeight;

    // Header with element type
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.getElementTitle(), this.padding, panelY + 32);

    // Close button
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(canvasWidth - this.padding - 16, panelY + 24, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('×', canvasWidth - this.padding - 16, panelY + 30);

    ctx.textAlign = 'left';

    // Type selector (for platforms)
    if (this.element.type === 'platform') {
      this.renderTypeSelector(ctx, this.padding, y, canvasWidth - this.padding * 2);
      y += this.rowHeight;
    }

    // Position row
    this.renderNumberRow(ctx, 'Position', [
      { label: 'X', property: 'x', value: this.getProperty('x') as number },
      { label: 'Y', property: 'y', value: this.getProperty('y') as number },
    ], this.padding, y, canvasWidth - this.padding * 2);
    y += this.rowHeight;

    // Size row (platforms and goal only)
    if (this.element.type === 'platform' || this.element.type === 'goal') {
      this.renderNumberRow(ctx, 'Size', [
        { label: 'W', property: 'width', value: this.getProperty('width') as number },
        { label: 'H', property: 'height', value: this.getProperty('height') as number },
      ], this.padding, y, canvasWidth - this.padding * 2);
      y += this.rowHeight;
    }

    // Moving platform options
    if (this.element.type === 'platform' && this.element.data.type === 'moving') {
      this.renderMovePatternSelector(ctx, this.padding, y, canvasWidth - this.padding * 2);
      y += this.rowHeight;

      const movePattern = this.element.data.movePattern || { distance: 80, speed: 1 };
      this.renderSliderRow(ctx, 'Movement', [
        { label: 'Distance', property: 'movePattern.distance', value: movePattern.distance || 80, min: 20, max: 300 },
        { label: 'Speed', property: 'movePattern.speed', value: movePattern.speed || 1, min: 0.5, max: 3, step: 0.1 },
      ], this.padding, y, canvasWidth - this.padding * 2);
      y += this.rowHeight;
    }

    // Phase platform options
    if (this.element.type === 'platform' && this.element.data.type === 'phase') {
      const phaseOffset = this.element.data.phaseOffset || 0;
      this.renderSliderRow(ctx, 'Phase', [
        { label: 'Offset', property: 'phaseOffset', value: phaseOffset, min: 0, max: 1, step: 0.1 },
      ], this.padding, y, canvasWidth - this.padding * 2);
      y += this.rowHeight;
    }
  }

  private getElementTitle(): string {
    if (!this.element) return '';

    switch (this.element.type) {
      case 'platform':
        return `Platform (${this.element.data.type})`;
      case 'coin':
        return 'Coin';
      case 'playerStart':
        return 'Player Start';
      case 'goal':
        return 'Goal Zone';
    }
  }

  private getProperty(name: string): number | string | boolean | undefined {
    if (!this.element) return undefined;

    if (name.includes('.')) {
      const parts = name.split('.');
      let obj: Record<string, unknown> = this.element.data as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]] as Record<string, unknown>;
        if (!obj) return undefined;
      }
      return obj[parts[parts.length - 1]] as number | string | boolean;
    }

    return (this.element.data as Record<string, unknown>)[name] as number | string | boolean;
  }

  private renderTypeSelector(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    const buttonWidth = (width - 8 * (PLATFORM_TYPES.length - 1)) / PLATFORM_TYPES.length;
    const buttonHeight = 40;

    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.fillText('Type:', x, y + 14);

    let bx = x;
    const currentType = (this.element as { type: 'platform'; data: PlatformConfig }).data.type;

    for (const type of PLATFORM_TYPES) {
      const isSelected = type === currentType;

      ctx.fillStyle = isSelected ? PLATFORM_COLORS[type] : '#3a3a4e';
      ctx.beginPath();
      ctx.roundRect(bx, y + 20, buttonWidth, buttonHeight, 6);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(type.substring(0, 4).toUpperCase(), bx + buttonWidth / 2, y + 44);
      ctx.textAlign = 'left';

      bx += buttonWidth + 8;
    }
  }

  private renderMovePatternSelector(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    const patterns = ['vertical', 'horizontal', 'circular'] as const;
    const buttonWidth = (width - 16) / 3;
    const buttonHeight = 40;
    const movePattern = (this.element as { type: 'platform'; data: PlatformConfig }).data.movePattern;
    const currentPattern = movePattern?.type || 'vertical';

    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.fillText('Pattern:', x, y + 14);

    let bx = x;
    for (const pattern of patterns) {
      const isSelected = pattern === currentPattern;

      ctx.fillStyle = isSelected ? '#9966ff' : '#3a3a4e';
      ctx.beginPath();
      ctx.roundRect(bx, y + 20, buttonWidth, buttonHeight, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pattern.charAt(0).toUpperCase() + pattern.slice(1, 5), bx + buttonWidth / 2, y + 44);
      ctx.textAlign = 'left';

      bx += buttonWidth + 8;
    }
  }

  private renderNumberRow(
    ctx: CanvasRenderingContext2D,
    label: string,
    fields: { label: string; property: string; value: number }[],
    x: number,
    y: number,
    width: number
  ): void {
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.fillText(label + ':', x, y + 14);

    const fieldWidth = (width - 16) / fields.length;
    let fx = x;

    for (const field of fields) {
      // Label
      ctx.fillStyle = '#888';
      ctx.font = '10px sans-serif';
      ctx.fillText(field.label, fx, y + 30);

      // Minus button
      ctx.fillStyle = '#3a3a4e';
      ctx.beginPath();
      ctx.roundRect(fx + 20, y + 18, this.buttonSize, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('−', fx + 20 + this.buttonSize / 2, y + 40);

      // Value display
      ctx.fillStyle = '#2a2a3e';
      ctx.beginPath();
      ctx.roundRect(fx + 20 + this.buttonSize + 4, y + 18, fieldWidth - this.buttonSize * 2 - 32, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.fillText(Math.round(field.value).toString(), fx + 20 + this.buttonSize + 4 + (fieldWidth - this.buttonSize * 2 - 32) / 2, y + 40);

      // Plus button
      ctx.fillStyle = '#3a3a4e';
      ctx.beginPath();
      ctx.roundRect(fx + fieldWidth - this.buttonSize - 4, y + 18, this.buttonSize, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('+', fx + fieldWidth - this.buttonSize - 4 + this.buttonSize / 2, y + 40);

      ctx.textAlign = 'left';
      fx += fieldWidth + 8;
    }
  }

  private renderSliderRow(
    ctx: CanvasRenderingContext2D,
    label: string,
    fields: { label: string; property: string; value: number; min: number; max: number; step?: number }[],
    x: number,
    y: number,
    width: number
  ): void {
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.fillText(label + ':', x, y + 14);

    const fieldWidth = (width - 8) / fields.length;
    let fx = x;

    for (const field of fields) {
      // Label and value
      ctx.fillStyle = '#888';
      ctx.font = '10px sans-serif';
      ctx.fillText(field.label, fx, y + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      const displayValue = field.step && field.step < 1
        ? field.value.toFixed(1)
        : Math.round(field.value).toString();
      ctx.fillText(displayValue, fx + fieldWidth - 8, y + 30);
      ctx.textAlign = 'left';

      // Slider track
      const trackY = y + 40;
      const trackWidth = fieldWidth - 16;

      ctx.fillStyle = '#3a3a4e';
      ctx.beginPath();
      ctx.roundRect(fx, trackY, trackWidth, 16, 8);
      ctx.fill();

      // Slider fill
      const progress = (field.value - field.min) / (field.max - field.min);
      ctx.fillStyle = '#9966ff';
      ctx.beginPath();
      ctx.roundRect(fx, trackY, trackWidth * progress, 16, 8);
      ctx.fill();

      // Slider thumb
      const thumbX = fx + trackWidth * progress;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(thumbX, trackY + 8, 10, 0, Math.PI * 2);
      ctx.fill();

      fx += fieldWidth + 8;
    }
  }

  // Handle touch/click on the inspector panel
  handleInput(x: number, y: number, canvasHeight: number, isStart: boolean, isEnd: boolean): boolean {
    if (this.panelHeight <= 0) return false;

    const panelY = canvasHeight - this.panelHeight;

    // Check if touch is in panel area
    if (y < panelY) {
      if (isEnd) {
        // Tap outside panel - close it
        this.hide();
      }
      return false;
    }

    if (!this.element) return true;

    // Close button
    const closeX = x;
    const closeY = y - panelY;
    if (closeY < this.headerHeight && closeX > x - 40) {
      if (isEnd) this.hide();
      return true;
    }

    // Handle type selector buttons (platforms)
    if (this.element.type === 'platform') {
      const typeY = this.headerHeight + 20;
      if (closeY >= typeY && closeY <= typeY + 40) {
        if (isEnd) {
          const width = 300; // Approximate
          const buttonWidth = width / PLATFORM_TYPES.length;
          const typeIndex = Math.floor((x - this.padding) / buttonWidth);
          if (typeIndex >= 0 && typeIndex < PLATFORM_TYPES.length) {
            this.onChange({
              elementType: 'platform',
              index: this.element.index,
              property: 'type',
              value: PLATFORM_TYPES[typeIndex],
            });
          }
        }
        return true;
      }
    }

    // Handle number field buttons
    if (isStart) {
      const result = this.detectNumberButton(x, y, canvasHeight);
      if (result) {
        this.holdButton = result;
        this.applyNumberChange(result.property, result.delta);

        // Start hold-to-repeat
        this.holdTimer = window.setTimeout(() => {
          this.holdInterval = window.setInterval(() => {
            if (this.holdButton) {
              this.applyNumberChange(this.holdButton.property, this.holdButton.delta);
            }
          }, 100);
        }, 400);

        return true;
      }
    }

    if (isEnd) {
      this.cancelHold();
    }

    return true;
  }

  private detectNumberButton(x: number, y: number, canvasHeight: number): { property: string; delta: number } | null {
    const panelY = canvasHeight - this.panelHeight;
    const relY = y - panelY;

    // Determine which row we're in
    let rowY = this.headerHeight;

    if (this.element?.type === 'platform') {
      rowY += this.rowHeight; // Skip type row
    }

    // Position row
    if (relY >= rowY && relY < rowY + this.rowHeight) {
      return this.detectButtonInRow(x, ['x', 'y']);
    }
    rowY += this.rowHeight;

    // Size row
    if ((this.element?.type === 'platform' || this.element?.type === 'goal') &&
        relY >= rowY && relY < rowY + this.rowHeight) {
      return this.detectButtonInRow(x, ['width', 'height']);
    }

    return null;
  }

  private detectButtonInRow(x: number, properties: string[]): { property: string; delta: number } | null {
    const width = 300; // Approximate canvas width for panel
    const fieldWidth = (width - 16) / properties.length;

    for (let i = 0; i < properties.length; i++) {
      const fx = this.padding + i * (fieldWidth + 8);

      // Minus button area
      if (x >= fx + 20 && x <= fx + 20 + this.buttonSize) {
        return { property: properties[i], delta: -10 };
      }

      // Plus button area
      if (x >= fx + fieldWidth - this.buttonSize - 4 && x <= fx + fieldWidth - 4) {
        return { property: properties[i], delta: 10 };
      }
    }

    return null;
  }

  private applyNumberChange(property: string, delta: number): void {
    if (!this.element) return;

    const currentValue = this.getProperty(property) as number || 0;
    const newValue = Math.max(0, currentValue + delta);

    this.onChange({
      elementType: this.element.type,
      index: 'index' in this.element ? this.element.index : undefined,
      property,
      value: newValue,
    });
  }

  private cancelHold(): void {
    if (this.holdTimer !== null) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.holdInterval !== null) {
      clearInterval(this.holdInterval);
      this.holdInterval = null;
    }
    this.holdButton = null;
  }

  destroy(): void {
    this.cancelHold();
  }
}
