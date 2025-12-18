/**
 * ContextMenu - Long-press context menu for editor
 * Mobile-friendly with large touch targets
 */

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
}

export type ContextMenuCallback = (actionId: string) => void;

export class ContextMenu {
  private isVisible = false;
  private x = 0;
  private y = 0;
  private items: ContextMenuItem[] = [];
  private callback: ContextMenuCallback;

  // Animation
  private opacity = 0;
  private scale = 0.8;
  private targetOpacity = 0;
  private targetScale = 0.8;
  private animationSpeed = 0.2;

  // Dimensions
  private readonly itemHeight = 52;
  private readonly menuWidth = 180;
  private readonly padding = 8;
  private readonly borderRadius = 12;

  constructor(callback: ContextMenuCallback) {
    this.callback = callback;
  }

  show(x: number, y: number, items: ContextMenuItem[], canvasWidth: number, canvasHeight: number): void {
    this.items = items;
    this.isVisible = true;
    this.targetOpacity = 1;
    this.targetScale = 1;

    // Calculate menu height
    const menuHeight = this.items.length * this.itemHeight + this.padding * 2;

    // Position menu, keeping it on screen
    this.x = Math.min(x, canvasWidth - this.menuWidth - 10);
    this.y = Math.min(y, canvasHeight - menuHeight - 10);

    // Keep minimum distance from edges
    this.x = Math.max(10, this.x);
    this.y = Math.max(10, this.y);
  }

  hide(): void {
    this.targetOpacity = 0;
    this.targetScale = 0.8;
  }

  isOpen(): boolean {
    return this.isVisible || this.opacity > 0;
  }

  update(_deltaTime: number): void {
    // Animate opacity
    const opacityDiff = this.targetOpacity - this.opacity;
    if (Math.abs(opacityDiff) > 0.01) {
      this.opacity += opacityDiff * this.animationSpeed;
    } else {
      this.opacity = this.targetOpacity;
    }

    // Animate scale
    const scaleDiff = this.targetScale - this.scale;
    if (Math.abs(scaleDiff) > 0.01) {
      this.scale += scaleDiff * this.animationSpeed;
    } else {
      this.scale = this.targetScale;
    }

    // Hide when fully faded
    if (this.opacity <= 0.01) {
      this.isVisible = false;
      this.items = [];
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible && this.opacity <= 0) return;

    const menuHeight = this.items.length * this.itemHeight + this.padding * 2;

    ctx.save();

    // Apply transform for animation
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x + this.menuWidth / 2, this.y + menuHeight / 2);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-(this.x + this.menuWidth / 2), -(this.y + menuHeight / 2));

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 5;

    // Background
    ctx.fillStyle = '#2a2a3e';
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.menuWidth, menuHeight, this.borderRadius);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Border
    ctx.strokeStyle = '#4a4a5e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Menu items
    let itemY = this.y + this.padding;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      // Hover effect (for touch, this will be the active item)
      if (!item.disabled) {
        ctx.fillStyle = '#3a3a4e';
        ctx.beginPath();
        if (i === 0 && i === this.items.length - 1) {
          ctx.roundRect(this.x + 4, itemY, this.menuWidth - 8, this.itemHeight, 8);
        } else if (i === 0) {
          ctx.roundRect(this.x + 4, itemY, this.menuWidth - 8, this.itemHeight, [8, 8, 0, 0]);
        } else if (i === this.items.length - 1) {
          ctx.roundRect(this.x + 4, itemY, this.menuWidth - 8, this.itemHeight, [0, 0, 8, 8]);
        } else {
          ctx.rect(this.x + 4, itemY, this.menuWidth - 8, this.itemHeight);
        }
        // Don't fill hover state by default - just prepare the path
      }

      // Icon placeholder
      if (item.icon) {
        ctx.fillStyle = item.disabled ? '#555' : item.danger ? '#ff6666' : '#888';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon, this.x + 28, itemY + 32);
      }

      // Label
      ctx.fillStyle = item.disabled ? '#555' : item.danger ? '#ff6666' : '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, this.x + (item.icon ? 48 : 16), itemY + 32);

      // Separator line (except last item)
      if (i < this.items.length - 1) {
        ctx.strokeStyle = '#3a3a4e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + 16, itemY + this.itemHeight);
        ctx.lineTo(this.x + this.menuWidth - 16, itemY + this.itemHeight);
        ctx.stroke();
      }

      itemY += this.itemHeight;
    }

    ctx.restore();
  }

  // Handle tap on menu
  handleTap(tapX: number, tapY: number): boolean {
    if (!this.isVisible) return false;

    const menuHeight = this.items.length * this.itemHeight + this.padding * 2;

    // Check if tap is outside menu
    if (tapX < this.x || tapX > this.x + this.menuWidth ||
        tapY < this.y || tapY > this.y + menuHeight) {
      this.hide();
      return true; // Consumed the tap (to close menu)
    }

    // Find which item was tapped
    const relY = tapY - this.y - this.padding;
    const itemIndex = Math.floor(relY / this.itemHeight);

    if (itemIndex >= 0 && itemIndex < this.items.length) {
      const item = this.items[itemIndex];
      if (!item.disabled) {
        this.callback(item.id);
        this.hide();
        return true;
      }
    }

    return true;
  }

  // Get standard menu items for different element types
  static getPlatformItems(canCopy: boolean = false): ContextMenuItem[] {
    return [
      { id: 'edit', label: 'Edit Properties', icon: '✏️' },
      { id: 'duplicate', label: 'Duplicate', icon: '📋' },
      { id: 'copy', label: canCopy ? 'Copy' : 'Copy', icon: '📄' },
      { id: 'toFront', label: 'Move to Front', icon: '⬆️' },
      { id: 'toBack', label: 'Move to Back', icon: '⬇️' },
      { id: 'delete', label: 'Delete', icon: '🗑️', danger: true },
    ];
  }

  static getCoinItems(): ContextMenuItem[] {
    return [
      { id: 'duplicate', label: 'Duplicate', icon: '📋' },
      { id: 'delete', label: 'Delete', icon: '🗑️', danger: true },
    ];
  }

  static getEmptySpaceItems(hasClipboard: boolean = false): ContextMenuItem[] {
    return [
      { id: 'paste', label: 'Paste', icon: '📋', disabled: !hasClipboard },
      { id: 'addPlatform', label: 'Add Platform', icon: '▬' },
      { id: 'addCoin', label: 'Add Coin', icon: '●' },
      { id: 'testHere', label: 'Test from Here', icon: '▶️' },
    ];
  }

  static getMultiSelectItems(): ContextMenuItem[] {
    return [
      { id: 'duplicate', label: 'Duplicate All', icon: '📋' },
      { id: 'alignLeft', label: 'Align Left', icon: '⬅️' },
      { id: 'alignCenter', label: 'Align Center', icon: '↔️' },
      { id: 'distribute', label: 'Distribute', icon: '⇔' },
      { id: 'delete', label: 'Delete All', icon: '🗑️', danger: true },
    ];
  }
}
