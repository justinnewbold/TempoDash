import {
  CustomLevel,
  EditorState,
  EditorTool,
  PlatformType,
  PlatformConfig,
  CoinConfig,
  Vector2,
  BackgroundConfig,
  BackgroundType,
  SelectedElement,
} from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { Background } from '../graphics/Background';
import { TouchHandler, GestureEvent } from './TouchHandler';
import { PropertyInspector, InspectorElement, PropertyChange } from './PropertyInspector';
import { ContextMenu } from './ContextMenu';
import { MiniMap } from './MiniMap';

const PLATFORM_TYPES: PlatformType[] = ['solid', 'bounce', 'ice', 'lava', 'spike', 'moving', 'phase', 'crumble', 'conveyor', 'gravity', 'sticky', 'glass', 'slowmo', 'wall', 'secret', 'portal', 'wind', 'water'];

const PLATFORM_COLORS: Record<PlatformType, string> = {
  solid: '#4a9eff',
  bounce: '#ff6b9d',
  ice: '#88ddff',
  lava: '#ff4400',
  spike: '#ff0000',
  moving: '#9966ff',
  phase: '#66ffaa',
  crumble: '#aa8866',
  conveyor: '#48bb78',
  gravity: '#ed64a6',
  sticky: '#ecc94b',
  glass: '#e2e8f0',
  slowmo: '#00c8ff',
  wall: '#718096',
  secret: '#ffd700',
  portal: '#8a2be2',
  wind: '#b0e0e6',
  water: '#0066cc',
};

const BACKGROUND_TYPES: BackgroundType[] = ['city', 'neon', 'space', 'forest', 'volcano', 'ocean', 'sky', 'gradient', 'grid'];

export class LevelEditor {
  private level: CustomLevel;
  private state: EditorState;
  private background: Background;
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  // Auto-save state
  private hasUnsavedChanges = false;
  private lastSaveTime = Date.now();
  private autoSaveInterval = 30000; // 30 seconds

  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  private mouseWorldX = 0;
  private mouseWorldY = 0;
  private isMouseDown = false;
  private resizeHandle: string | null = null;
  private dragOffset: Vector2 = { x: 0, y: 0 };

  // UI state - responsive layout
  private toolbarHeight = 60;
  private sidebarWidth = 200;
  private isMobileLayout = false;
  private bottomToolbarHeight = 72;

  // Mobile UI components
  private propertyInspector: PropertyInspector;
  private contextMenu: ContextMenu;
  private miniMap: MiniMap;

  // Multi-select support
  private selectedElements: SelectedElement[] = [];
  private isBoxSelecting = false;
  private boxSelectStart: Vector2 | null = null;
  private boxSelectEnd: Vector2 | null = null;

  // Help overlay state
  private showHelpOverlay = false;

  // Zoom state
  private zoom = 1;
  private minZoom = 0.25;
  private maxZoom = 2;

  // Clipboard
  private clipboard: Array<PlatformConfig | CoinConfig> = [];

  // Alignment guides (visual snap feedback)
  private alignmentGuides: { type: 'horizontal' | 'vertical'; position: number; start: number; end: number }[] = [];
  private snapThreshold = 10; // Distance in pixels to trigger snap

  // Platform groups (stored as sets of platform indices)
  private platformGroups: Set<number>[] = [];

  // Canvas reference for touch handling
  private canvas: HTMLCanvasElement | null = null;

  // Callbacks for external actions
  private onSaveCallback: (() => void) | null = null;
  private onPlayCallback: ((testPosition?: Vector2) => void) | null = null;

  // Test from cursor position
  private testStartPosition: Vector2 | null = null;

  constructor(level: CustomLevel) {
    this.level = level;
    this.background = new Background(level.background);

    this.state = {
      selectedTool: 'select',
      selectedPlatformType: 'solid',
      gridSize: 20,
      showGrid: true,
      selectedElement: null,
      cameraX: 0,
      zoom: 1,
      isDragging: false,
      dragStart: null,
    };

    // Initialize mobile UI components
    this.propertyInspector = new PropertyInspector(this.handlePropertyChange.bind(this));
    this.contextMenu = new ContextMenu(this.handleContextMenuAction.bind(this));
    this.miniMap = new MiniMap(this.handleMiniMapNavigation.bind(this));

    this.saveUndoState();
  }

  // Initialize touch handling (call after canvas is available)
  initTouch(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    new TouchHandler(canvas, this.handleGesture.bind(this));
    this.updateLayout(canvas.width, canvas.height);
  }

  // Update layout based on canvas size
  updateLayout(width: number, _height: number): void {
    // Mobile layout if width < 700px (accounting for sidebar)
    this.isMobileLayout = width < 700;

    if (this.isMobileLayout) {
      this.sidebarWidth = 0;
      this.toolbarHeight = 0;
      this.bottomToolbarHeight = 72;
    } else {
      this.sidebarWidth = 200;
      this.toolbarHeight = 60;
      this.bottomToolbarHeight = 0;
    }
  }

  // Handle gesture events from TouchHandler
  private handleGesture(event: GestureEvent): void {
    // Check if context menu is open - it captures taps
    if (this.contextMenu.isOpen()) {
      if (event.type === 'tap') {
        this.contextMenu.handleTap(event.x, event.y);
      }
      return;
    }

    // Check if property inspector captures input
    if (this.propertyInspector.isOpen()) {
      const canvasHeight = this.canvas?.height || GAME_HEIGHT;
      if (event.type === 'tap' || event.type === 'dragstart') {
        if (this.propertyInspector.handleInput(event.x, event.y, canvasHeight, event.type === 'dragstart', event.type === 'tap')) {
          return;
        }
      }
    }

    switch (event.type) {
      case 'tap':
        this.handleTap(event.x, event.y);
        break;
      case 'doubletap':
        this.handleDoubleTap(event.x, event.y);
        break;
      case 'longpress':
        this.handleLongPress(event.x, event.y);
        break;
      case 'dragstart':
        this.handleDragStart(event.x, event.y);
        break;
      case 'drag':
        this.handleDragMove(event.x, event.y, event.deltaX || 0, event.deltaY || 0);
        break;
      case 'dragend':
        this.handleDragEnd(event.x, event.y);
        break;
      case 'pinch':
        this.handlePinchZoom(event.scale || 1, event.centerX || event.x, event.centerY || event.y);
        break;
      case 'pan':
        this.handleTwoFingerPan(event.deltaX || 0, event.deltaY || 0);
        break;
    }
  }

  // Touch gesture handlers
  private handleTap(x: number, y: number): void {
    // Check minimap
    if (this.miniMap.handleTap(x, y, this.level)) {
      return;
    }

    // Check mobile bottom toolbar
    if (this.isMobileLayout && y > (this.canvas?.height || GAME_HEIGHT) - this.bottomToolbarHeight) {
      this.handleBottomToolbarTap(x, y);
      return;
    }

    // Check desktop sidebar/toolbar
    if (!this.isMobileLayout) {
      if (x < this.sidebarWidth) {
        this.handleSidebarClick(x, y);
        return;
      }
      if (y < this.toolbarHeight) {
        this.handleToolbarClick(x, y);
        return;
      }
    }

    // Editor area interaction
    const worldX = this.screenToWorldX(x);
    const worldY = this.screenToWorldY(y);

    switch (this.state.selectedTool) {
      case 'select':
        this.selectElementAt(worldX, worldY);
        break;
      case 'platform':
        this.placePlatformAt(worldX, worldY);
        break;
      case 'coin':
        this.placeCoinAt(worldX, worldY);
        break;
      case 'delete':
        this.deleteElementAt(worldX, worldY);
        break;
    }
  }

  private handleDoubleTap(x: number, y: number): void {
    const worldX = this.screenToWorldX(x);
    const worldY = this.screenToWorldY(y);

    // Find element at position and open property inspector
    const element = this.findElementAt(worldX, worldY);
    if (element) {
      this.openPropertyInspector(element);
    }
  }

  private handleLongPress(x: number, y: number): void {
    const worldX = this.screenToWorldX(x);
    const worldY = this.screenToWorldY(y);

    // Find element at position
    const element = this.findElementAt(worldX, worldY);

    if (element) {
      // Select it first
      this.state.selectedElement = element;

      // Show context menu for element
      const items = element.type === 'platform'
        ? ContextMenu.getPlatformItems(this.clipboard.length > 0)
        : element.type === 'coin'
        ? ContextMenu.getCoinItems()
        : ContextMenu.getPlatformItems();

      this.contextMenu.show(x, y, items, this.canvas?.width || GAME_WIDTH, this.canvas?.height || GAME_HEIGHT);
    } else {
      // Show empty space context menu
      const items = ContextMenu.getEmptySpaceItems(this.clipboard.length > 0);
      this.contextMenu.show(x, y, items, this.canvas?.width || GAME_WIDTH, this.canvas?.height || GAME_HEIGHT);
    }
  }

  private handleDragStart(x: number, y: number): void {
    // Check minimap
    if (this.miniMap.handleDrag(x, y, this.level)) {
      return;
    }

    const worldX = this.screenToWorldX(x);
    const worldY = this.screenToWorldY(y);

    if (this.state.selectedTool === 'select') {
      const element = this.findElementAt(worldX, worldY);
      if (element) {
        this.state.selectedElement = element;
        this.state.isDragging = true;

        // Calculate drag offset
        if (element.type === 'platform') {
          const p = this.level.platforms[element.index];
          if (p) {
            this.dragOffset = { x: worldX - p.x, y: worldY - p.y };

            // Check resize handle
            const handleSize = 15;
            if (worldX >= p.x + p.width - handleSize && worldY >= p.y + p.height - handleSize) {
              this.resizeHandle = 'se';
            }
          }
        } else if (element.type === 'coin') {
          const c = this.level.coins[element.index];
          if (c) this.dragOffset = { x: worldX - c.x, y: worldY - c.y };
        } else if (element.type === 'playerStart') {
          this.dragOffset = { x: worldX - this.level.playerStart.x, y: worldY - this.level.playerStart.y };
        } else if (element.type === 'goal' && this.level.goal) {
          this.dragOffset = { x: worldX - this.level.goal.x, y: worldY - this.level.goal.y };
        }
      } else {
        // Start box selection
        this.isBoxSelecting = true;
        this.boxSelectStart = { x: worldX, y: worldY };
        this.boxSelectEnd = { x: worldX, y: worldY };
      }
    } else if (this.state.selectedTool === 'pan') {
      this.state.dragStart = { x, y };
    }
  }

  private handleDragMove(x: number, y: number, deltaX: number, _deltaY: number): void {
    // Check minimap dragging
    if (this.miniMap.handleDrag(x, y, this.level)) {
      return;
    }

    const worldX = this.screenToWorldX(x);
    const worldY = this.screenToWorldY(y);

    if (this.state.isDragging && this.state.selectedElement) {
      this.handleDrag();
    } else if (this.isBoxSelecting) {
      this.boxSelectEnd = { x: worldX, y: worldY };
    } else if (this.state.selectedTool === 'pan' || this.state.dragStart) {
      // Pan camera
      this.state.cameraX = Math.max(0, this.state.cameraX - deltaX / this.zoom);
    }
  }

  private handleDragEnd(_x: number, _y: number): void {
    this.miniMap.handleDragEnd();
    this.clearAlignmentGuides();

    if (this.state.isDragging) {
      this.saveUndoState();
    }

    if (this.isBoxSelecting && this.boxSelectStart && this.boxSelectEnd) {
      // Complete box selection
      this.selectElementsInBox(this.boxSelectStart, this.boxSelectEnd);
    }

    this.state.isDragging = false;
    this.state.dragStart = null;
    this.resizeHandle = null;
    this.isBoxSelecting = false;
    this.boxSelectStart = null;
    this.boxSelectEnd = null;
  }

  private handlePinchZoom(scale: number, centerX: number, _centerY: number): void {
    const oldZoom = this.zoom;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * scale));

    // Adjust camera to keep center point fixed
    if (oldZoom !== this.zoom) {
      const worldCenterX = this.screenToWorldX(centerX);
      // Recalculate camera after zoom change
      const newScreenX = (worldCenterX - this.state.cameraX) * this.zoom + this.getEditorOffsetX();
      const deltaX = centerX - newScreenX;
      this.state.cameraX -= deltaX / this.zoom;
      this.state.cameraX = Math.max(0, this.state.cameraX);
    }
  }

  private handleTwoFingerPan(deltaX: number, _deltaY: number): void {
    this.state.cameraX = Math.max(0, this.state.cameraX - deltaX / this.zoom);
  }

  // Coordinate conversion helpers
  private screenToWorldX(screenX: number): number {
    return (screenX - this.getEditorOffsetX()) / this.zoom + this.state.cameraX;
  }

  private screenToWorldY(screenY: number): number {
    return (screenY - this.getEditorOffsetY()) / this.zoom;
  }

  private getEditorOffsetX(): number {
    return this.isMobileLayout ? 0 : this.sidebarWidth;
  }

  private getEditorOffsetY(): number {
    return this.isMobileLayout ? 0 : this.toolbarHeight;
  }

  // Element finding
  private findElementAt(worldX: number, worldY: number): SelectedElement | null {
    // Check platforms (reverse order for top-most)
    for (let i = this.level.platforms.length - 1; i >= 0; i--) {
      const p = this.level.platforms[i];
      if (worldX >= p.x && worldX <= p.x + p.width &&
          worldY >= p.y && worldY <= p.y + p.height) {
        return { type: 'platform', index: i };
      }
    }

    // Check coins
    for (let i = this.level.coins.length - 1; i >= 0; i--) {
      const c = this.level.coins[i];
      const dist = Math.hypot(worldX - c.x, worldY - c.y);
      if (dist <= 20) {
        return { type: 'coin', index: i };
      }
    }

    // Check player start
    const ps = this.level.playerStart;
    if (worldX >= ps.x && worldX <= ps.x + 40 &&
        worldY >= ps.y && worldY <= ps.y + 40) {
      return { type: 'playerStart', index: 0 };
    }

    // Check goal
    if (this.level.goal) {
      const g = this.level.goal;
      if (worldX >= g.x && worldX <= g.x + g.width &&
          worldY >= g.y && worldY <= g.y + g.height) {
        return { type: 'goal', index: 0 };
      }
    }

    return null;
  }

  private selectElementAt(worldX: number, worldY: number): void {
    const element = this.findElementAt(worldX, worldY);
    this.state.selectedElement = element;
    this.selectedElements = element ? [element] : [];
  }

  private selectElementsInBox(start: Vector2, end: Vector2): void {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    this.selectedElements = [];

    // Select platforms in box
    for (let i = 0; i < this.level.platforms.length; i++) {
      const p = this.level.platforms[i];
      if (p.x + p.width >= minX && p.x <= maxX &&
          p.y + p.height >= minY && p.y <= maxY) {
        this.selectedElements.push({ type: 'platform', index: i });
      }
    }

    // Select coins in box
    for (let i = 0; i < this.level.coins.length; i++) {
      const c = this.level.coins[i];
      if (c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY) {
        this.selectedElements.push({ type: 'coin', index: i });
      }
    }

    // Set first selected as primary
    if (this.selectedElements.length > 0) {
      this.state.selectedElement = this.selectedElements[0];
    }
  }

  // Calculate alignment guides for snapping feedback
  private calculateAlignmentGuides(draggedElement: SelectedElement, targetX: number, targetY: number): { x: number; y: number } {
    this.alignmentGuides = [];

    // Get bounds of dragged element
    let dragWidth = 0, dragHeight = 0;
    if (draggedElement.type === 'platform') {
      const p = this.level.platforms[draggedElement.index];
      if (!p) return { x: targetX, y: targetY };
      dragWidth = p.width;
      dragHeight = p.height;
    } else if (draggedElement.type === 'coin') {
      dragWidth = 24; // Coin diameter
      dragHeight = 24;
    } else if (draggedElement.type === 'playerStart') {
      dragWidth = 40;
      dragHeight = 40;
    } else if (draggedElement.type === 'goal') {
      dragWidth = this.level.goal.width;
      dragHeight = this.level.goal.height;
    }

    // Edges and center of dragged element
    const dragLeft = targetX;
    const dragRight = targetX + dragWidth;
    const dragTop = targetY;
    const dragBottom = targetY + dragHeight;
    const dragCenterX = targetX + dragWidth / 2;
    const dragCenterY = targetY + dragHeight / 2;

    let snapX = targetX;
    let snapY = targetY;

    // Check alignment with other platforms
    for (let i = 0; i < this.level.platforms.length; i++) {
      // Skip the dragged element
      if (draggedElement.type === 'platform' && draggedElement.index === i) continue;

      const p = this.level.platforms[i];
      const otherLeft = p.x;
      const otherRight = p.x + p.width;
      const otherTop = p.y;
      const otherBottom = p.y + p.height;
      const otherCenterX = p.x + p.width / 2;
      const otherCenterY = p.y + p.height / 2;

      // Vertical alignment (X axis)
      // Left edge to left edge
      if (Math.abs(dragLeft - otherLeft) <= this.snapThreshold) {
        snapX = otherLeft;
        this.alignmentGuides.push({ type: 'vertical', position: otherLeft, start: Math.min(dragTop, otherTop), end: Math.max(dragBottom, otherBottom) });
      }
      // Right edge to right edge
      if (Math.abs(dragRight - otherRight) <= this.snapThreshold) {
        snapX = otherRight - dragWidth;
        this.alignmentGuides.push({ type: 'vertical', position: otherRight, start: Math.min(dragTop, otherTop), end: Math.max(dragBottom, otherBottom) });
      }
      // Left to right
      if (Math.abs(dragLeft - otherRight) <= this.snapThreshold) {
        snapX = otherRight;
        this.alignmentGuides.push({ type: 'vertical', position: otherRight, start: Math.min(dragTop, otherTop), end: Math.max(dragBottom, otherBottom) });
      }
      // Right to left
      if (Math.abs(dragRight - otherLeft) <= this.snapThreshold) {
        snapX = otherLeft - dragWidth;
        this.alignmentGuides.push({ type: 'vertical', position: otherLeft, start: Math.min(dragTop, otherTop), end: Math.max(dragBottom, otherBottom) });
      }
      // Center to center (X)
      if (Math.abs(dragCenterX - otherCenterX) <= this.snapThreshold) {
        snapX = otherCenterX - dragWidth / 2;
        this.alignmentGuides.push({ type: 'vertical', position: otherCenterX, start: Math.min(dragTop, otherTop), end: Math.max(dragBottom, otherBottom) });
      }

      // Horizontal alignment (Y axis)
      // Top to top
      if (Math.abs(dragTop - otherTop) <= this.snapThreshold) {
        snapY = otherTop;
        this.alignmentGuides.push({ type: 'horizontal', position: otherTop, start: Math.min(dragLeft, otherLeft), end: Math.max(dragRight, otherRight) });
      }
      // Bottom to bottom
      if (Math.abs(dragBottom - otherBottom) <= this.snapThreshold) {
        snapY = otherBottom - dragHeight;
        this.alignmentGuides.push({ type: 'horizontal', position: otherBottom, start: Math.min(dragLeft, otherLeft), end: Math.max(dragRight, otherRight) });
      }
      // Top to bottom
      if (Math.abs(dragTop - otherBottom) <= this.snapThreshold) {
        snapY = otherBottom;
        this.alignmentGuides.push({ type: 'horizontal', position: otherBottom, start: Math.min(dragLeft, otherLeft), end: Math.max(dragRight, otherRight) });
      }
      // Bottom to top
      if (Math.abs(dragBottom - otherTop) <= this.snapThreshold) {
        snapY = otherTop - dragHeight;
        this.alignmentGuides.push({ type: 'horizontal', position: otherTop, start: Math.min(dragLeft, otherLeft), end: Math.max(dragRight, otherRight) });
      }
      // Center to center (Y)
      if (Math.abs(dragCenterY - otherCenterY) <= this.snapThreshold) {
        snapY = otherCenterY - dragHeight / 2;
        this.alignmentGuides.push({ type: 'horizontal', position: otherCenterY, start: Math.min(dragLeft, otherLeft), end: Math.max(dragRight, otherRight) });
      }
    }

    return { x: snapX, y: snapY };
  }

  // Clear alignment guides when not dragging
  private clearAlignmentGuides(): void {
    this.alignmentGuides = [];
  }

  // Element placement
  private placePlatformAt(worldX: number, worldY: number): void {
    const snappedX = this.snapToGrid(worldX);
    const snappedY = this.snapToGrid(worldY);

    const newPlatform: PlatformConfig = {
      x: snappedX,
      y: snappedY,
      width: 100,
      height: 20,
      type: this.state.selectedPlatformType,
    };

    if (this.state.selectedPlatformType === 'moving') {
      newPlatform.movePattern = { type: 'vertical', distance: 80, speed: 1, startOffset: 0 };
    }

    this.level.platforms.push(newPlatform);
    this.state.selectedElement = { type: 'platform', index: this.level.platforms.length - 1 };
    this.saveUndoState();
  }

  private placeCoinAt(worldX: number, worldY: number): void {
    const snappedX = this.snapToGrid(worldX);
    const snappedY = this.snapToGrid(worldY);

    this.level.coins.push({ x: snappedX, y: snappedY });
    this.state.selectedElement = { type: 'coin', index: this.level.coins.length - 1 };
    this.saveUndoState();
  }

  private deleteElementAt(worldX: number, worldY: number): void {
    const element = this.findElementAt(worldX, worldY);
    if (element) {
      if (element.type === 'platform') {
        this.level.platforms.splice(element.index, 1);
      } else if (element.type === 'coin') {
        this.level.coins.splice(element.index, 1);
      }
      this.state.selectedElement = null;
      this.saveUndoState();
    }
  }

  // Property inspector
  private openPropertyInspector(element: { type: string; index: number }): void {
    let inspectorElement: InspectorElement;

    if (element.type === 'platform') {
      const platform = this.level.platforms[element.index];
      if (!platform) return;
      inspectorElement = {
        type: 'platform',
        data: platform,
        index: element.index,
      };
    } else if (element.type === 'coin') {
      const coin = this.level.coins[element.index];
      if (!coin) return;
      inspectorElement = {
        type: 'coin',
        data: coin,
        index: element.index,
      };
    } else if (element.type === 'playerStart') {
      inspectorElement = {
        type: 'playerStart',
        data: this.level.playerStart,
      };
    } else if (element.type === 'goal' && this.level.goal) {
      inspectorElement = {
        type: 'goal',
        data: this.level.goal,
      };
    } else {
      return;
    }

    this.propertyInspector.show(inspectorElement);
  }

  private handlePropertyChange(change: PropertyChange): void {
    if (change.elementType === 'platform' && change.index !== undefined) {
      const platform = this.level.platforms[change.index];
      if (platform) {
        if (change.property === 'type') {
          platform.type = change.value as PlatformType;
          if (platform.type === 'moving' && !platform.movePattern) {
            platform.movePattern = { type: 'vertical', distance: 80, speed: 1, startOffset: 0 };
          }
        } else if (change.property === 'x') {
          platform.x = change.value as number;
        } else if (change.property === 'y') {
          platform.y = change.value as number;
        } else if (change.property === 'width') {
          platform.width = change.value as number;
        } else if (change.property === 'height') {
          platform.height = change.value as number;
        } else if (change.property === 'phaseOffset') {
          platform.phaseOffset = change.value as number;
        } else if (change.property.startsWith('movePattern.') && platform.movePattern) {
          const subProp = change.property.split('.')[1];
          if (subProp === 'distance') {
            platform.movePattern.distance = change.value as number;
          } else if (subProp === 'speed') {
            platform.movePattern.speed = change.value as number;
          } else if (subProp === 'type') {
            platform.movePattern.type = change.value as 'vertical' | 'horizontal' | 'circular';
          }
        }
        this.saveUndoState();
      }
    } else if (change.elementType === 'coin' && change.index !== undefined) {
      const coin = this.level.coins[change.index];
      if (coin) {
        if (change.property === 'x') {
          coin.x = change.value as number;
        } else if (change.property === 'y') {
          coin.y = change.value as number;
        }
        this.saveUndoState();
      }
    } else if (change.elementType === 'playerStart') {
      if (change.property === 'x') {
        this.level.playerStart.x = change.value as number;
      } else if (change.property === 'y') {
        this.level.playerStart.y = change.value as number;
      }
      this.saveUndoState();
    } else if (change.elementType === 'goal' && this.level.goal) {
      if (change.property === 'x') {
        this.level.goal.x = change.value as number;
      } else if (change.property === 'y') {
        this.level.goal.y = change.value as number;
      } else if (change.property === 'width') {
        this.level.goal.width = change.value as number;
      } else if (change.property === 'height') {
        this.level.goal.height = change.value as number;
      }
      this.saveUndoState();
    }
  }

  // Context menu actions
  private handleContextMenuAction(actionId: string): void {
    switch (actionId) {
      case 'edit':
        if (this.state.selectedElement) {
          this.openPropertyInspector(this.state.selectedElement);
        }
        break;
      case 'duplicate':
        this.duplicateSelected();
        break;
      case 'copy':
        this.copySelected();
        break;
      case 'paste':
        this.paste();
        break;
      case 'delete':
        this.deleteSelected();
        break;
      case 'toFront':
        this.moveSelectedToFront();
        break;
      case 'toBack':
        this.moveSelectedToBack();
        break;
      case 'addPlatform':
        this.setTool('platform');
        break;
      case 'addCoin':
        this.setTool('coin');
        break;
      case 'testFromHere':
        this.testFromCursor();
        break;
      case 'alignLeft':
        this.alignLeft();
        break;
      case 'alignRight':
        this.alignRight();
        break;
      case 'alignCenter':
        this.alignCenter();
        break;
      case 'alignTop':
        this.alignTop();
        break;
      case 'alignBottom':
        this.alignBottom();
        break;
      case 'distribute':
        this.distributeHorizontally();
        break;
      case 'distributeV':
        this.distributeVertically();
        break;
      case 'group':
        this.groupSelected();
        break;
      case 'ungroup':
        this.ungroupSelected();
        break;
    }
  }

  private paste(): void {
    if (this.clipboard.length === 0) return;

    for (const item of this.clipboard) {
      if ('type' in item && 'width' in item) {
        // Platform
        const platform = item as PlatformConfig;
        this.level.platforms.push({
          ...platform,
          x: this.screenToWorldX(this.mouseX) || platform.x + 40,
          y: this.screenToWorldY(this.mouseY) || platform.y,
        });
      } else {
        // Coin
        const coin = item as CoinConfig;
        this.level.coins.push({
          x: this.screenToWorldX(this.mouseX) || coin.x + 40,
          y: this.screenToWorldY(this.mouseY) || coin.y,
        });
      }
    }

    this.saveUndoState();
  }

  deleteSelected(): void {
    // Handle multi-select deletion
    if (this.selectedElements.length > 1) {
      // Sort by index descending to avoid index shifting issues
      const platforms = this.selectedElements
        .filter(e => e.type === 'platform')
        .sort((a, b) => b.index - a.index);
      const coins = this.selectedElements
        .filter(e => e.type === 'coin')
        .sort((a, b) => b.index - a.index);

      // Delete platforms (from end to start)
      for (const el of platforms) {
        this.level.platforms.splice(el.index, 1);
      }
      // Delete coins (from end to start)
      for (const el of coins) {
        this.level.coins.splice(el.index, 1);
      }

      this.selectedElements = [];
      this.state.selectedElement = null;
      this.saveUndoState();
      return;
    }

    // Single element deletion
    if (!this.state.selectedElement) return;

    if (this.state.selectedElement.type === 'platform') {
      this.level.platforms.splice(this.state.selectedElement.index, 1);
    } else if (this.state.selectedElement.type === 'coin') {
      this.level.coins.splice(this.state.selectedElement.index, 1);
    }

    this.state.selectedElement = null;
    this.selectedElements = [];
    this.saveUndoState();
  }

  // Duplicate selected elements with offset
  duplicateSelected(): void {
    if (this.selectedElements.length === 0 && !this.state.selectedElement) return;

    const elementsToClone = this.selectedElements.length > 0
      ? this.selectedElements
      : (this.state.selectedElement ? [this.state.selectedElement] : []);

    const offset = 20; // Offset for duplicated elements
    const newElements: SelectedElement[] = [];

    for (const el of elementsToClone) {
      if (el.type === 'platform') {
        const original = this.level.platforms[el.index];
        if (!original) continue;
        const clone: PlatformConfig = {
          ...original,
          x: original.x + offset,
          y: original.y + offset,
        };
        this.level.platforms.push(clone);
        newElements.push({ type: 'platform', index: this.level.platforms.length - 1 });
      } else if (el.type === 'coin') {
        const original = this.level.coins[el.index];
        if (!original) continue;
        const clone: CoinConfig = {
          x: original.x + offset,
          y: original.y + offset,
        };
        this.level.coins.push(clone);
        newElements.push({ type: 'coin', index: this.level.coins.length - 1 });
      }
    }

    // Select the new duplicates
    this.selectedElements = newElements;
    if (newElements.length > 0) {
      this.state.selectedElement = newElements[0];
    }
    this.saveUndoState();
  }

  // Move selected elements by offset (for arrow key movement)
  moveSelectedByOffset(dx: number, dy: number): void {
    if (this.selectedElements.length === 0 && !this.state.selectedElement) return;

    const elements = this.selectedElements.length > 0
      ? this.selectedElements
      : (this.state.selectedElement ? [this.state.selectedElement] : []);

    for (const el of elements) {
      if (el.type === 'platform') {
        const p = this.level.platforms[el.index];
        if (!p) continue;
        p.x += dx;
        p.y += dy;
      } else if (el.type === 'coin') {
        const c = this.level.coins[el.index];
        if (!c) continue;
        c.x += dx;
        c.y += dy;
      } else if (el.type === 'playerStart') {
        this.level.playerStart.x += dx;
        this.level.playerStart.y += dy;
      } else if (el.type === 'goal') {
        this.level.goal.x += dx;
        this.level.goal.y += dy;
      }
    }
    this.saveUndoState();
  }

  // Copy selected elements to clipboard
  copySelected(): void {
    this.clipboard = [];
    const elements = this.selectedElements.length > 0
      ? this.selectedElements
      : (this.state.selectedElement ? [this.state.selectedElement] : []);

    for (const el of elements) {
      if (el.type === 'platform') {
        const platform = this.level.platforms[el.index];
        if (platform) this.clipboard.push({ ...platform });
      } else if (el.type === 'coin') {
        const coin = this.level.coins[el.index];
        if (coin) this.clipboard.push({ ...coin });
      }
    }
  }

  // Paste from clipboard
  pasteClipboard(): void {
    if (this.clipboard.length === 0) return;

    const offset = 20;
    const newElements: SelectedElement[] = [];

    for (const item of this.clipboard) {
      if ('width' in item) {
        // It's a platform
        const clone: PlatformConfig = {
          ...(item as PlatformConfig),
          x: item.x + offset,
          y: item.y + offset,
        };
        this.level.platforms.push(clone);
        newElements.push({ type: 'platform', index: this.level.platforms.length - 1 });
      } else {
        // It's a coin
        const clone: CoinConfig = {
          x: item.x + offset,
          y: item.y + offset,
        };
        this.level.coins.push(clone);
        newElements.push({ type: 'coin', index: this.level.coins.length - 1 });
      }
    }

    this.selectedElements = newElements;
    if (newElements.length > 0) {
      this.state.selectedElement = newElements[0];
    }
    this.saveUndoState();
  }

  // Select all elements
  selectAll(): void {
    this.selectedElements = [];
    for (let i = 0; i < this.level.platforms.length; i++) {
      this.selectedElements.push({ type: 'platform', index: i });
    }
    for (let i = 0; i < this.level.coins.length; i++) {
      this.selectedElements.push({ type: 'coin', index: i });
    }
    if (this.selectedElements.length > 0) {
      this.state.selectedElement = this.selectedElements[0];
    }
  }

  // Toggle help overlay
  toggleHelpOverlay(): void {
    this.showHelpOverlay = !this.showHelpOverlay;
  }

  private moveSelectedToFront(): void {
    if (!this.state.selectedElement || this.state.selectedElement.type !== 'platform') return;

    const index = this.state.selectedElement.index;
    const platform = this.level.platforms.splice(index, 1)[0];
    this.level.platforms.push(platform);
    this.state.selectedElement.index = this.level.platforms.length - 1;
    this.saveUndoState();
  }

  private moveSelectedToBack(): void {
    if (!this.state.selectedElement || this.state.selectedElement.type !== 'platform') return;

    const index = this.state.selectedElement.index;
    const platform = this.level.platforms.splice(index, 1)[0];
    this.level.platforms.unshift(platform);
    this.state.selectedElement.index = 0;
    this.saveUndoState();
  }

  // Group selected platforms together
  groupSelected(): void {
    const platformIndices = this.selectedElements
      .filter(el => el.type === 'platform')
      .map(el => el.index);

    if (platformIndices.length < 2) return;

    // Remove these platforms from any existing groups
    for (const group of this.platformGroups) {
      for (const idx of platformIndices) {
        group.delete(idx);
      }
    }
    // Remove empty groups
    this.platformGroups = this.platformGroups.filter(g => g.size > 0);

    // Create new group
    this.platformGroups.push(new Set(platformIndices));
  }

  // Ungroup selected platforms
  ungroupSelected(): void {
    const platformIndices = new Set(
      this.selectedElements
        .filter(el => el.type === 'platform')
        .map(el => el.index)
    );

    // Remove these platforms from all groups
    for (const group of this.platformGroups) {
      for (const idx of platformIndices) {
        group.delete(idx);
      }
    }
    // Remove empty groups
    this.platformGroups = this.platformGroups.filter(g => g.size > 0);
  }

  // Find group containing a platform
  private findGroupForPlatform(index: number): Set<number> | null {
    for (const group of this.platformGroups) {
      if (group.has(index)) {
        return group;
      }
    }
    return null;
  }

  // Select entire group when clicking on grouped platform
  selectGroup(platformIndex: number): void {
    const group = this.findGroupForPlatform(platformIndex);
    if (!group) return;

    this.selectedElements = [];
    for (const idx of group) {
      this.selectedElements.push({ type: 'platform', index: idx });
    }
    if (this.selectedElements.length > 0) {
      this.state.selectedElement = this.selectedElements[0];
    }
  }

  // Align selected platforms to left edge
  alignLeft(): void {
    const platforms = this.selectedElements.filter(el => el.type === 'platform');
    if (platforms.length < 2) return;

    let minX = Infinity;
    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p && p.x < minX) minX = p.x;
    }

    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p) p.x = minX;
    }
    this.saveUndoState();
  }

  // Align selected platforms to right edge
  alignRight(): void {
    const platforms = this.selectedElements.filter(el => el.type === 'platform');
    if (platforms.length < 2) return;

    let maxRight = -Infinity;
    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p) {
        const right = p.x + p.width;
        if (right > maxRight) maxRight = right;
      }
    }

    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p) p.x = maxRight - p.width;
    }
    this.saveUndoState();
  }

  // Align selected platforms to vertical center
  alignCenter(): void {
    const platforms = this.selectedElements.filter(el => el.type === 'platform');
    if (platforms.length < 2) return;

    // Calculate the center of the bounding box
    let minX = Infinity, maxRight = -Infinity;
    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p) {
        if (p.x < minX) minX = p.x;
        if (p.x + p.width > maxRight) maxRight = p.x + p.width;
      }
    }
    const centerX = (minX + maxRight) / 2;

    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p) p.x = centerX - p.width / 2;
    }
    this.saveUndoState();
  }

  // Align selected platforms to top edge
  alignTop(): void {
    const platforms = this.selectedElements.filter(el => el.type === 'platform');
    if (platforms.length < 2) return;

    let minY = Infinity;
    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p && p.y < minY) minY = p.y;
    }

    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p) p.y = minY;
    }
    this.saveUndoState();
  }

  // Align selected platforms to bottom edge
  alignBottom(): void {
    const platforms = this.selectedElements.filter(el => el.type === 'platform');
    if (platforms.length < 2) return;

    let maxBottom = -Infinity;
    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p) {
        const bottom = p.y + p.height;
        if (bottom > maxBottom) maxBottom = bottom;
      }
    }

    for (const el of platforms) {
      const p = this.level.platforms[el.index];
      if (p) p.y = maxBottom - p.height;
    }
    this.saveUndoState();
  }

  // Distribute selected platforms evenly horizontally
  distributeHorizontally(): void {
    const platforms = this.selectedElements.filter(el => el.type === 'platform');
    if (platforms.length < 3) return;

    // Sort by x position
    const sorted = platforms
      .map(el => ({ el, p: this.level.platforms[el.index] }))
      .filter(item => item.p !== undefined)
      .sort((a, b) => a.p!.x - b.p!.x);

    if (sorted.length < 3) return;

    const first = sorted[0].p!;
    const last = sorted[sorted.length - 1].p!;
    const totalWidth = (last.x + last.width) - first.x;
    const platformsWidth = sorted.reduce((sum, item) => sum + item.p!.width, 0);
    const gap = (totalWidth - platformsWidth) / (sorted.length - 1);

    let currentX = first.x;
    for (const item of sorted) {
      item.p!.x = currentX;
      currentX += item.p!.width + gap;
    }
    this.saveUndoState();
  }

  // Distribute selected platforms evenly vertically
  distributeVertically(): void {
    const platforms = this.selectedElements.filter(el => el.type === 'platform');
    if (platforms.length < 3) return;

    // Sort by y position
    const sorted = platforms
      .map(el => ({ el, p: this.level.platforms[el.index] }))
      .filter(item => item.p !== undefined)
      .sort((a, b) => a.p!.y - b.p!.y);

    if (sorted.length < 3) return;

    const first = sorted[0].p!;
    const last = sorted[sorted.length - 1].p!;
    const totalHeight = (last.y + last.height) - first.y;
    const platformsHeight = sorted.reduce((sum, item) => sum + item.p!.height, 0);
    const gap = (totalHeight - platformsHeight) / (sorted.length - 1);

    let currentY = first.y;
    for (const item of sorted) {
      item.p!.y = currentY;
      currentY += item.p!.height + gap;
    }
    this.saveUndoState();
  }

  // Minimap navigation
  private handleMiniMapNavigation(worldX: number): void {
    const viewportWidth = (this.canvas?.width || GAME_WIDTH) - this.getEditorOffsetX();
    this.state.cameraX = Math.max(0, worldX - viewportWidth / (2 * this.zoom));
  }

  // Mobile bottom toolbar tap handling
  private handleBottomToolbarTap(x: number, _y: number): void {
    const canvasWidth = this.canvas?.width || GAME_WIDTH;
    const buttonCount = 7; // select, platform, coin, delete, pan, test, help
    const buttonWidth = canvasWidth / buttonCount;

    const buttonIndex = Math.floor(x / buttonWidth);
    const tools: EditorTool[] = ['select', 'platform', 'coin', 'delete', 'pan'];

    if (buttonIndex < tools.length) {
      this.setTool(tools[buttonIndex]);
    } else if (buttonIndex === 5) {
      // Test button
      if (this.onPlayCallback) {
        this.onPlayCallback();
      }
    } else if (buttonIndex === 6) {
      // Help button
      this.toggleHelpOverlay();
    }
  }

  // Get zoom level
  getZoom(): number {
    return this.zoom;
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
  }

  // Check if using mobile layout
  isMobile(): boolean {
    return this.isMobileLayout;
  }

  // Get current level
  getLevel(): CustomLevel {
    return this.level;
  }

  // Set callback for save action
  setOnSave(callback: () => void): void {
    this.onSaveCallback = callback;
  }

  // Set callback for play/test action
  setOnPlay(callback: (testPosition?: Vector2) => void): void {
    this.onPlayCallback = callback;
  }

  // Set test start position (for testing from a specific location)
  setTestPosition(position: Vector2 | null): void {
    this.testStartPosition = position;
  }

  // Get test start position
  getTestPosition(): Vector2 | null {
    return this.testStartPosition;
  }

  // Test from current mouse position
  testFromCursor(): void {
    if (this.onPlayCallback) {
      this.onPlayCallback({ x: this.mouseWorldX, y: this.mouseWorldY });
    }
  }

  // Test from normal start
  testFromStart(): void {
    if (this.onPlayCallback) {
      this.onPlayCallback();
    }
  }

  // Update level name
  setLevelName(name: string): void {
    this.level.name = name;
  }

  // Update BPM
  setBPM(bpm: number): void {
    this.level.bpm = Math.max(60, Math.min(200, bpm));
  }

  // Set background type
  setBackgroundType(type: BackgroundType): void {
    const backgrounds: Record<BackgroundType, BackgroundConfig> = {
      city: {
        type: 'city',
        primaryColor: '#0a0a1a',
        secondaryColor: '#151530',
        accentColor: '#00ffff',
        particles: { count: 30, color: 'rgba(255, 255, 255, 0.5)', minSize: 1, maxSize: 3, speed: 30, direction: 'down' },
        effects: ['stars'],
      },
      neon: {
        type: 'neon',
        primaryColor: '#0d0221',
        secondaryColor: '#1a0533',
        accentColor: '#ff00ff',
        particles: { count: 40, color: 'rgba(255, 0, 255, 0.5)', minSize: 1, maxSize: 4, speed: 40, direction: 'up' },
        effects: ['grid', 'scanlines', 'pulse'],
      },
      space: {
        type: 'space',
        primaryColor: '#0a1628',
        secondaryColor: '#1a2a4a',
        accentColor: '#88ddff',
        particles: { count: 80, color: 'rgba(200, 230, 255, 0.5)', minSize: 1, maxSize: 4, speed: 40, direction: 'down' },
        effects: ['stars', 'aurora'],
      },
      forest: {
        type: 'forest',
        primaryColor: '#0a1a0a',
        secondaryColor: '#1a2a1a',
        accentColor: '#66ff66',
        particles: { count: 40, color: 'rgba(100, 200, 100, 0.5)', minSize: 2, maxSize: 5, speed: 20, direction: 'down' },
        effects: ['stars'],
      },
      volcano: {
        type: 'volcano',
        primaryColor: '#1a0a00',
        secondaryColor: '#2d1200',
        accentColor: '#ff4400',
        particles: { count: 60, color: 'rgba(255, 100, 0, 0.5)', minSize: 2, maxSize: 5, speed: 50, direction: 'up' },
        effects: ['embers', 'pulse'],
      },
      ocean: {
        type: 'ocean',
        primaryColor: '#001a33',
        secondaryColor: '#002244',
        accentColor: '#00ccff',
        particles: { count: 40, color: 'rgba(150, 220, 255, 0.5)', minSize: 3, maxSize: 8, speed: 30, direction: 'up' },
        effects: ['bubbles'],
      },
      inferno: {
        type: 'inferno',
        primaryColor: '#1a0505',
        secondaryColor: '#2d0a0a',
        accentColor: '#ff4400',
        particles: { count: 80, color: 'rgba(255, 100, 0, 0.6)', minSize: 2, maxSize: 6, speed: 50, direction: 'up' },
        effects: ['embers', 'pulse'],
      },
      sky: {
        type: 'sky',
        primaryColor: '#87CEEB',
        secondaryColor: '#E0F6FF',
        accentColor: '#FFD700',
        particles: { count: 40, color: 'rgba(255, 255, 255, 0.8)', minSize: 20, maxSize: 60, speed: 20, direction: 'down' },
        effects: ['aurora'],
      },
      gradient: {
        type: 'gradient',
        primaryColor: '#001830',
        secondaryColor: '#003366',
        accentColor: '#00ffaa',
        particles: { count: 60, color: 'rgba(100, 200, 255, 0.5)', minSize: 3, maxSize: 10, speed: 30, direction: 'up' },
        effects: ['bubbles', 'pulse'],
      },
      grid: {
        type: 'grid',
        primaryColor: '#0a0a1a',
        secondaryColor: '#1a1a3a',
        accentColor: '#ff00ff',
        particles: { count: 30, color: 'rgba(255, 0, 255, 0.4)', minSize: 2, maxSize: 6, speed: 40, direction: 'up' },
        effects: ['grid', 'pulse'],
      },
    };

    this.level.background = backgrounds[type];
    this.background = new Background(this.level.background);
  }

  // Tool selection
  setTool(tool: EditorTool): void {
    this.state.selectedTool = tool;
    if (tool !== 'select') {
      this.state.selectedElement = null;
    }
  }

  getTool(): EditorTool {
    return this.state.selectedTool;
  }

  // Platform type selection
  setPlatformType(type: PlatformType): void {
    this.state.selectedPlatformType = type;
  }

  getPlatformType(): PlatformType {
    return this.state.selectedPlatformType;
  }

  // Grid toggle
  toggleGrid(): void {
    this.state.showGrid = !this.state.showGrid;
  }

  // Snap to grid
  private snapToGrid(value: number): number {
    return Math.round(value / this.state.gridSize) * this.state.gridSize;
  }

  // Camera control
  moveCamera(deltaX: number): void {
    this.state.cameraX = Math.max(0, this.state.cameraX + deltaX);
  }

  setCameraX(x: number): void {
    this.state.cameraX = Math.max(0, x);
  }

  getCameraX(): number {
    return this.state.cameraX;
  }

  // Undo/Redo
  private saveUndoState(): void {
    this.undoStack.push(JSON.stringify(this.level));
    this.redoStack = [];
    // Limit undo stack size
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }
    // Mark as having unsaved changes
    this.hasUnsavedChanges = true;
  }

  // Auto-save methods
  needsAutoSave(): boolean {
    if (!this.hasUnsavedChanges) return false;
    return Date.now() - this.lastSaveTime >= this.autoSaveInterval;
  }

  markAsSaved(): void {
    this.hasUnsavedChanges = false;
    this.lastSaveTime = Date.now();
  }

  hasChanges(): boolean {
    return this.hasUnsavedChanges;
  }

  isDraggingElement(): boolean {
    return this.state.isDragging;
  }

  undo(): void {
    if (this.undoStack.length > 1) {
      const current = this.undoStack.pop()!;
      this.redoStack.push(current);
      const previous = this.undoStack[this.undoStack.length - 1];
      try {
        this.level = JSON.parse(previous);
        this.background = new Background(this.level.background);
        this.state.selectedElement = null;
      } catch {
        // Restore stack state on parse error
        this.redoStack.pop();
        this.undoStack.push(current);
        console.error('Failed to parse undo state');
      }
    }
  }

  redo(): void {
    if (this.redoStack.length > 0) {
      const next = this.redoStack.pop()!;
      this.undoStack.push(next);
      try {
        this.level = JSON.parse(next);
        this.background = new Background(this.level.background);
        this.state.selectedElement = null;
      } catch {
        // Restore stack state on parse error
        this.undoStack.pop();
        this.redoStack.push(next);
        console.error('Failed to parse redo state');
      }
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Mouse handling
  handleMouseMove(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;

    // Convert to world coordinates (accounting for toolbar and sidebar)
    const editorX = x - this.sidebarWidth;
    const editorY = y - this.toolbarHeight;
    this.mouseWorldX = editorX + this.state.cameraX;
    this.mouseWorldY = editorY;

    if (this.isMouseDown && this.state.isDragging && this.state.selectedElement) {
      this.handleDrag();
    } else if (this.isMouseDown && this.state.selectedTool === 'pan') {
      // Pan camera
      if (this.state.dragStart) {
        const deltaX = this.state.dragStart.x - x;
        this.state.cameraX = Math.max(0, this.state.cameraX + deltaX);
        this.state.dragStart = { x, y };
      }
    }
  }

  handleMouseDown(x: number, y: number): void {
    this.isMouseDown = true;
    this.mouseX = x;
    this.mouseY = y;

    const editorX = x - this.sidebarWidth;
    const editorY = y - this.toolbarHeight;

    // Check if clicking in editor area
    if (editorX < 0 || editorY < 0 || editorY > GAME_HEIGHT) {
      return;
    }

    this.mouseWorldX = editorX + this.state.cameraX;
    this.mouseWorldY = editorY;

    switch (this.state.selectedTool) {
      case 'select':
        this.handleSelect();
        break;
      case 'platform':
        this.handlePlacePlatform();
        break;
      case 'coin':
        this.handlePlaceCoin();
        break;
      case 'playerStart':
        this.handlePlacePlayerStart();
        break;
      case 'goal':
        this.handlePlaceGoal();
        break;
      case 'delete':
        this.handleDelete();
        break;
      case 'pan':
        this.state.dragStart = { x, y };
        break;
    }
  }

  handleMouseUp(): void {
    if (this.state.isDragging) {
      this.saveUndoState();
    }
    this.isMouseDown = false;
    this.state.isDragging = false;
    this.state.dragStart = null;
    this.resizeHandle = null;
    this.clearAlignmentGuides();
  }

  // Selection
  private handleSelect(): void {
    const worldX = this.mouseWorldX;
    const worldY = this.mouseWorldY;

    // Check platforms (in reverse order to select top-most)
    for (let i = this.level.platforms.length - 1; i >= 0; i--) {
      const p = this.level.platforms[i];
      if (worldX >= p.x && worldX <= p.x + p.width &&
          worldY >= p.y && worldY <= p.y + p.height) {
        this.state.selectedElement = { type: 'platform', index: i };
        this.state.isDragging = true;
        this.dragOffset = { x: worldX - p.x, y: worldY - p.y };

        // Check for resize handle
        const handleSize = 10;
        if (worldX >= p.x + p.width - handleSize && worldY >= p.y + p.height - handleSize) {
          this.resizeHandle = 'se';
        }
        return;
      }
    }

    // Check coins
    for (let i = this.level.coins.length - 1; i >= 0; i--) {
      const c = this.level.coins[i];
      const dist = Math.sqrt((worldX - c.x) ** 2 + (worldY - c.y) ** 2);
      if (dist <= 15) {
        this.state.selectedElement = { type: 'coin', index: i };
        this.state.isDragging = true;
        this.dragOffset = { x: worldX - c.x, y: worldY - c.y };
        return;
      }
    }

    // Check player start
    const ps = this.level.playerStart;
    if (worldX >= ps.x && worldX <= ps.x + 40 &&
        worldY >= ps.y && worldY <= ps.y + 40) {
      this.state.selectedElement = { type: 'playerStart', index: 0 };
      this.state.isDragging = true;
      this.dragOffset = { x: worldX - ps.x, y: worldY - ps.y };
      return;
    }

    // Check goal
    const g = this.level.goal;
    if (worldX >= g.x && worldX <= g.x + g.width &&
        worldY >= g.y && worldY <= g.y + g.height) {
      this.state.selectedElement = { type: 'goal', index: 0 };
      this.state.isDragging = true;
      this.dragOffset = { x: worldX - g.x, y: worldY - g.y };
      return;
    }

    // Nothing selected
    this.state.selectedElement = null;
  }

  // Dragging
  private handleDrag(): void {
    if (!this.state.selectedElement) return;

    // Calculate raw target position (before any snapping)
    const rawX = this.mouseWorldX - this.dragOffset.x;
    const rawY = this.mouseWorldY - this.dragOffset.y;

    // Calculate alignment guides and get smart snap position
    const smartSnap = this.calculateAlignmentGuides(this.state.selectedElement, rawX, rawY);

    // Use smart snap if guides are active, otherwise use grid snap
    const hasAlignmentSnap = this.alignmentGuides.length > 0;
    const finalX = hasAlignmentSnap ? smartSnap.x : this.snapToGrid(rawX);
    const finalY = hasAlignmentSnap ? smartSnap.y : this.snapToGrid(rawY);

    switch (this.state.selectedElement.type) {
      case 'platform': {
        const idx = this.state.selectedElement.index;
        if (idx < 0 || idx >= this.level.platforms.length) break;
        const platform = this.level.platforms[idx];
        if (this.resizeHandle === 'se') {
          // Resize - keep grid snap only
          platform.width = Math.max(20, this.snapToGrid(this.mouseWorldX - platform.x));
          platform.height = Math.max(20, this.snapToGrid(this.mouseWorldY - platform.y));
          this.clearAlignmentGuides(); // No alignment guides during resize
        } else {
          // Move
          platform.x = Math.max(0, finalX);
          platform.y = Math.max(0, Math.min(GAME_HEIGHT - platform.height, finalY));
        }
        break;
      }
      case 'coin': {
        const idx = this.state.selectedElement.index;
        if (idx < 0 || idx >= this.level.coins.length) break;
        const coin = this.level.coins[idx];
        coin.x = Math.max(0, finalX);
        coin.y = Math.max(0, Math.min(GAME_HEIGHT, finalY));
        break;
      }
      case 'playerStart': {
        this.level.playerStart.x = Math.max(0, finalX);
        this.level.playerStart.y = Math.max(0, Math.min(GAME_HEIGHT - 40, finalY));
        break;
      }
      case 'goal': {
        this.level.goal.x = Math.max(0, finalX);
        this.level.goal.y = Math.max(0, Math.min(GAME_HEIGHT - this.level.goal.height, finalY));
        break;
      }
    }
  }

  // Placement
  private handlePlacePlatform(): void {
    const x = this.snapToGrid(this.mouseWorldX);
    const y = this.snapToGrid(this.mouseWorldY);

    const platform: PlatformConfig = {
      x,
      y,
      width: 100,
      height: 20,
      type: this.state.selectedPlatformType,
    };

    // Add move pattern for moving platforms
    if (this.state.selectedPlatformType === 'moving') {
      platform.movePattern = {
        type: 'vertical',
        distance: 50,
        speed: 2,
        startOffset: 0,
      };
    }

    this.level.platforms.push(platform);
    this.state.selectedElement = { type: 'platform', index: this.level.platforms.length - 1 };
    this.saveUndoState();
  }

  private handlePlaceCoin(): void {
    const x = this.snapToGrid(this.mouseWorldX);
    const y = this.snapToGrid(this.mouseWorldY);

    const coin: CoinConfig = { x, y };
    this.level.coins.push(coin);
    this.state.selectedElement = { type: 'coin', index: this.level.coins.length - 1 };
    this.saveUndoState();
  }

  private handlePlacePlayerStart(): void {
    this.level.playerStart.x = this.snapToGrid(this.mouseWorldX);
    this.level.playerStart.y = this.snapToGrid(this.mouseWorldY);
    this.saveUndoState();
  }

  private handlePlaceGoal(): void {
    this.level.goal.x = this.snapToGrid(this.mouseWorldX);
    this.level.goal.y = this.snapToGrid(this.mouseWorldY);
    this.saveUndoState();
  }

  // Delete
  private handleDelete(): void {
    const worldX = this.mouseWorldX;
    const worldY = this.mouseWorldY;

    // Check platforms
    for (let i = this.level.platforms.length - 1; i >= 0; i--) {
      const p = this.level.platforms[i];
      if (worldX >= p.x && worldX <= p.x + p.width &&
          worldY >= p.y && worldY <= p.y + p.height) {
        this.level.platforms.splice(i, 1);
        this.state.selectedElement = null;
        this.saveUndoState();
        return;
      }
    }

    // Check coins
    for (let i = this.level.coins.length - 1; i >= 0; i--) {
      const c = this.level.coins[i];
      const dist = Math.sqrt((worldX - c.x) ** 2 + (worldY - c.y) ** 2);
      if (dist <= 15) {
        this.level.coins.splice(i, 1);
        this.state.selectedElement = null;
        this.saveUndoState();
        return;
      }
    }
  }

  // Get selected element for property panel
  getSelectedElement(): { type: string; data: unknown } | null {
    if (!this.state.selectedElement) return null;

    switch (this.state.selectedElement.type) {
      case 'platform': {
        const platform = this.level.platforms[this.state.selectedElement.index];
        return platform ? { type: 'platform', data: platform } : null;
      }
      case 'coin': {
        const coin = this.level.coins[this.state.selectedElement.index];
        return coin ? { type: 'coin', data: coin } : null;
      }
      case 'playerStart':
        return { type: 'playerStart', data: this.level.playerStart };
      case 'goal':
        return { type: 'goal', data: this.level.goal };
    }
    return null;
  }

  // Update selected platform type
  updateSelectedPlatformType(type: PlatformType): void {
    if (this.state.selectedElement?.type === 'platform') {
      const platform = this.level.platforms[this.state.selectedElement.index];
      if (!platform) return;
      platform.type = type;

      // Add/remove move pattern
      if (type === 'moving' && !platform.movePattern) {
        platform.movePattern = { type: 'vertical', distance: 50, speed: 2, startOffset: 0 };
      } else if (type !== 'moving') {
        delete platform.movePattern;
      }

      this.saveUndoState();
    }
  }

  // Keyboard handling
  handleKeyDown(key: string, ctrlKey = false, shiftKey = false): void {
    // Modifier key shortcuts
    if (ctrlKey) {
      switch (key.toLowerCase()) {
        case 'z':
          if (shiftKey) {
            this.redo(); // Ctrl+Shift+Z = redo
          } else {
            this.undo(); // Ctrl+Z = undo
          }
          return;
        case 'y':
          this.redo(); // Ctrl+Y = redo
          return;
        case 'd':
          this.duplicateSelected(); // Ctrl+D = duplicate
          return;
        case 'c':
          this.copySelected(); // Ctrl+C = copy
          return;
        case 'v':
          this.pasteClipboard(); // Ctrl+V = paste
          return;
        case 'a':
          this.selectAll(); // Ctrl+A = select all
          return;
      }
    }

    // Get grid step (shift = fine movement)
    const step = shiftKey ? 1 : this.state.gridSize;

    switch (key) {
      case 'Delete':
      case 'Backspace':
        this.deleteSelected();
        break;
      case 'ArrowUp':
        this.moveSelectedByOffset(0, -step);
        break;
      case 'ArrowDown':
        this.moveSelectedByOffset(0, step);
        break;
      case 'ArrowLeft':
        this.moveSelectedByOffset(-step, 0);
        break;
      case 'ArrowRight':
        this.moveSelectedByOffset(step, 0);
        break;
      case 'Escape':
        this.state.selectedElement = null;
        this.selectedElements = [];
        this.showHelpOverlay = false;
        this.propertyInspector.hide();
        this.contextMenu.hide();
        break;
      case 'h':
      case 'H':
      case '?':
        this.toggleHelpOverlay();
        break;
      case 'g':
        this.toggleGrid();
        break;
      case '1':
        this.setTool('select');
        break;
      case '2':
        this.setTool('platform');
        break;
      case '3':
        this.setTool('coin');
        break;
      case '4':
        this.setTool('delete');
        break;
      case '5':
        this.setTool('pan');
        break;
      case 't':
      case 'T':
        this.testFromCursor();
        break;
    }
  }

  // Check if help overlay is visible
  isHelpOverlayVisible(): boolean {
    return this.showHelpOverlay;
  }

  // Update editor and UI components
  updateEditor(deltaTime: number): void {
    this.background.update(deltaTime);
    this.propertyInspector.update(deltaTime);
    this.contextMenu.update(deltaTime);
    this.miniMap.update(deltaTime);
  }

  // Render
  render(ctx: CanvasRenderingContext2D): void {
    const canvasWidth = this.canvas?.width || GAME_WIDTH + this.sidebarWidth;
    const canvasHeight = this.canvas?.height || GAME_HEIGHT + this.toolbarHeight;

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate editor area dimensions
    const editorX = this.getEditorOffsetX();
    const editorY = this.getEditorOffsetY();
    const editorWidth = canvasWidth - editorX;
    const editorHeight = canvasHeight - editorY - this.bottomToolbarHeight;

    // Render editor area
    ctx.save();
    ctx.translate(editorX, editorY);

    // Clip to editor area
    ctx.beginPath();
    ctx.rect(0, 0, editorWidth, editorHeight);
    ctx.clip();

    // Apply zoom
    ctx.scale(this.zoom, this.zoom);

    // Background
    this.background.render(ctx, this.state.cameraX);

    // Grid
    if (this.state.showGrid) {
      this.renderGrid(ctx, editorWidth, editorHeight);
    }

    // Moving platform path preview
    this.renderMovingPlatformPaths(ctx);

    // Platforms
    this.renderPlatforms(ctx, editorWidth);

    // Coins
    this.renderCoins(ctx, editorWidth);

    // Player start
    this.renderPlayerStart(ctx);

    // Goal
    this.renderGoal(ctx);

    // Selection highlight
    this.renderSelection(ctx);

    // Alignment guides (snap feedback)
    this.renderAlignmentGuides(ctx);

    // Box selection
    this.renderBoxSelection(ctx);

    // Cursor preview
    this.renderCursorPreview(ctx);

    ctx.restore();

    // UI (render based on layout mode)
    if (this.isMobileLayout) {
      this.renderBottomToolbar(ctx, canvasWidth, canvasHeight);
    } else {
      this.renderToolbar(ctx);
      this.renderSidebar(ctx);
    }

    // Overlay UI components (always on top)
    this.miniMap.render(ctx, this.level, this.state.cameraX, editorWidth / this.zoom, canvasWidth, editorY);
    this.propertyInspector.render(ctx, canvasWidth, canvasHeight);
    this.contextMenu.render(ctx);

    // Zoom indicator
    this.renderZoomIndicator(ctx, canvasHeight);

    // Help overlay (on very top)
    if (this.showHelpOverlay) {
      this.renderHelpOverlay(ctx, canvasWidth, canvasHeight);
    }
  }

  // Render zoom indicator
  private renderZoomIndicator(ctx: CanvasRenderingContext2D, canvasHeight: number): void {
    if (this.zoom === 1) return;

    const zoomPercent = Math.round(this.zoom * 100);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(10, canvasHeight - this.bottomToolbarHeight - 40, 60, 28, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${zoomPercent}%`, 40, canvasHeight - this.bottomToolbarHeight - 22);
    ctx.textAlign = 'left';
  }

  // Render keyboard shortcuts help overlay
  private renderHelpOverlay(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Help panel
    const panelWidth = Math.min(500, canvasWidth - 40);
    const panelHeight = Math.min(500, canvasHeight - 40);
    const panelX = (canvasWidth - panelWidth) / 2;
    const panelY = (canvasHeight - panelHeight) / 2;

    ctx.fillStyle = '#2a2a3e';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 12);
    ctx.fill();

    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Keyboard Shortcuts', canvasWidth / 2, panelY + 35);

    // Close hint
    ctx.fillStyle = '#888888';
    ctx.font = '12px sans-serif';
    ctx.fillText('Press H, ?, or Escape to close', canvasWidth / 2, panelY + 55);

    // Shortcuts list
    const shortcuts = [
      { key: '1-5', action: 'Switch tools (Select, Platform, Coin, Delete, Pan)' },
      { key: 'G', action: 'Toggle grid' },
      { key: 'H or ?', action: 'Toggle this help overlay' },
      { key: '', action: '' }, // Spacer
      { key: 'Ctrl+Z', action: 'Undo' },
      { key: 'Ctrl+Y / Ctrl+Shift+Z', action: 'Redo' },
      { key: 'Ctrl+C', action: 'Copy selected' },
      { key: 'Ctrl+V', action: 'Paste' },
      { key: 'Ctrl+D', action: 'Duplicate selected' },
      { key: 'Ctrl+A', action: 'Select all' },
      { key: '', action: '' }, // Spacer
      { key: 'Arrow Keys', action: 'Move selected (grid snap)' },
      { key: 'Shift + Arrows', action: 'Move selected (1px fine)' },
      { key: 'Delete / Backspace', action: 'Delete selected' },
      { key: 'Escape', action: 'Deselect all / Close panels' },
    ];

    let y = panelY + 85;
    ctx.textAlign = 'left';

    for (const { key, action } of shortcuts) {
      if (key === '') {
        y += 10; // Spacer
        continue;
      }

      // Key badge
      ctx.fillStyle = '#3a3a4e';
      ctx.beginPath();
      const keyWidth = Math.max(80, ctx.measureText(key).width + 20);
      ctx.roundRect(panelX + 20, y - 14, keyWidth, 22, 4);
      ctx.fill();

      ctx.fillStyle = '#4a9eff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(key, panelX + 30, y);

      // Action text
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px sans-serif';
      ctx.fillText(action, panelX + 30 + keyWidth + 15, y);

      y += 28;
    }

    // Touch gestures section (for mobile)
    if (this.isMobileLayout) {
      y += 10;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Touch Gestures', panelX + 20, y);
      y += 25;

      const gestures = [
        { gesture: 'Tap', action: 'Select or place element' },
        { gesture: 'Double Tap', action: 'Open property editor' },
        { gesture: 'Long Press', action: 'Open context menu' },
        { gesture: 'Drag', action: 'Move element or box select' },
        { gesture: 'Pinch', action: 'Zoom in/out' },
        { gesture: 'Two-finger Pan', action: 'Scroll the level' },
      ];

      for (const { gesture, action } of gestures) {
        ctx.fillStyle = '#3a3a4e';
        ctx.beginPath();
        ctx.roundRect(panelX + 20, y - 14, 100, 22, 4);
        ctx.fill();

        ctx.fillStyle = '#66ff88';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(gesture, panelX + 30, y);

        ctx.fillStyle = '#cccccc';
        ctx.font = '12px sans-serif';
        ctx.fillText(action, panelX + 140, y);

        y += 28;
      }
    }

    ctx.textAlign = 'left';
  }

  // Render moving platform paths
  private renderMovingPlatformPaths(ctx: CanvasRenderingContext2D): void {
    for (const platform of this.level.platforms) {
      if (platform.type !== 'moving' || !platform.movePattern) continue;

      const screenX = platform.x - this.state.cameraX;
      const pattern = platform.movePattern;

      ctx.strokeStyle = 'rgba(153, 102, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      if (pattern.type === 'vertical') {
        ctx.beginPath();
        ctx.moveTo(screenX + platform.width / 2, platform.y);
        ctx.lineTo(screenX + platform.width / 2, platform.y + pattern.distance);
        ctx.stroke();

        // End position ghost
        ctx.fillStyle = 'rgba(153, 102, 255, 0.2)';
        ctx.fillRect(screenX, platform.y + pattern.distance, platform.width, platform.height);
      } else if (pattern.type === 'horizontal') {
        ctx.beginPath();
        ctx.moveTo(screenX, platform.y + platform.height / 2);
        ctx.lineTo(screenX + pattern.distance, platform.y + platform.height / 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(153, 102, 255, 0.2)';
        ctx.fillRect(screenX + pattern.distance, platform.y, platform.width, platform.height);
      } else if (pattern.type === 'circular') {
        ctx.beginPath();
        ctx.arc(screenX + platform.width / 2, platform.y + platform.height / 2, pattern.distance, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }
  }

  // Render box selection
  private renderBoxSelection(ctx: CanvasRenderingContext2D): void {
    if (!this.isBoxSelecting || !this.boxSelectStart || !this.boxSelectEnd) return;

    const x1 = this.boxSelectStart.x - this.state.cameraX;
    const y1 = this.boxSelectStart.y;
    const x2 = this.boxSelectEnd.x - this.state.cameraX;
    const y2 = this.boxSelectEnd.y;

    ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
    ctx.fillRect(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.abs(x2 - x1),
      Math.abs(y2 - y1)
    );

    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.abs(x2 - x1),
      Math.abs(y2 - y1)
    );
    ctx.setLineDash([]);
  }

  // Render alignment guides (snap feedback lines)
  private renderAlignmentGuides(ctx: CanvasRenderingContext2D): void {
    if (this.alignmentGuides.length === 0) return;

    ctx.strokeStyle = '#ff6b9d'; // Pink/magenta for visibility
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (const guide of this.alignmentGuides) {
      ctx.beginPath();
      if (guide.type === 'vertical') {
        const x = guide.position - this.state.cameraX;
        ctx.moveTo(x, guide.start);
        ctx.lineTo(x, guide.end);
      } else {
        const y = guide.position;
        ctx.moveTo(guide.start - this.state.cameraX, y);
        ctx.lineTo(guide.end - this.state.cameraX, y);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw snap indicators (small diamonds at snap points)
    ctx.fillStyle = '#ff6b9d';
    for (const guide of this.alignmentGuides) {
      const size = 4;
      if (guide.type === 'vertical') {
        const x = guide.position - this.state.cameraX;
        const midY = (guide.start + guide.end) / 2;
        ctx.beginPath();
        ctx.moveTo(x, midY - size);
        ctx.lineTo(x + size, midY);
        ctx.lineTo(x, midY + size);
        ctx.lineTo(x - size, midY);
        ctx.closePath();
        ctx.fill();
      } else {
        const y = guide.position;
        const midX = ((guide.start + guide.end) / 2) - this.state.cameraX;
        ctx.beginPath();
        ctx.moveTo(midX, y - size);
        ctx.lineTo(midX + size, y);
        ctx.lineTo(midX, y + size);
        ctx.lineTo(midX - size, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Render mobile bottom toolbar
  private renderBottomToolbar(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    const y = canvasHeight - this.bottomToolbarHeight;

    // Background
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, y, canvasWidth, this.bottomToolbarHeight);

    // Top border
    ctx.strokeStyle = '#4a4a5e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();

    // Tool and action buttons
    const buttons: { id: string; icon: string; label: string; color?: string }[] = [
      { id: 'select', icon: '👆', label: 'Select' },
      { id: 'platform', icon: '▬', label: 'Platform' },
      { id: 'coin', icon: '●', label: 'Coin' },
      { id: 'delete', icon: '🗑', label: 'Delete' },
      { id: 'pan', icon: '✋', label: 'Pan' },
      { id: 'test', icon: '▶', label: 'Test', color: '#2d7d46' },
      { id: 'help', icon: '?', label: 'Help', color: '#6a5acd' },
    ];

    const buttonWidth = canvasWidth / buttons.length;
    let bx = 0;

    for (const { id, icon, label, color } of buttons) {
      const isTool = ['select', 'platform', 'coin', 'delete', 'pan'].includes(id);
      const isSelected = isTool && this.state.selectedTool === id;

      // Button background
      if (isSelected) {
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath();
        ctx.roundRect(bx + 3, y + 8, buttonWidth - 6, this.bottomToolbarHeight - 16, 8);
        ctx.fill();
      } else if (color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(bx + 3, y + 8, buttonWidth - 6, this.bottomToolbarHeight - 16, 8);
        ctx.fill();
      }

      // Icon
      ctx.font = id === 'help' ? 'bold 18px sans-serif' : '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = (isSelected || color) ? '#ffffff' : '#aaaaaa';
      ctx.fillText(icon, bx + buttonWidth / 2, y + 32);

      // Label
      ctx.font = '8px sans-serif';
      ctx.fillText(label, bx + buttonWidth / 2, y + 50);

      bx += buttonWidth;
    }

    // Platform type indicator (when platform tool selected)
    if (this.state.selectedTool === 'platform') {
      ctx.fillStyle = PLATFORM_COLORS[this.state.selectedPlatformType];
      ctx.beginPath();
      ctx.roundRect(canvasWidth - 50, y - 35, 40, 25, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.fillText(this.state.selectedPlatformType.substring(0, 4).toUpperCase(), canvasWidth - 30, y - 18);
    }

    ctx.textAlign = 'left';
  }

  private renderGrid(ctx: CanvasRenderingContext2D, editorWidth: number, editorHeight: number): void {
    const gridSize = this.state.gridSize;

    // Minor grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    const startX = Math.floor(this.state.cameraX / gridSize) * gridSize - this.state.cameraX;
    const width = editorWidth / this.zoom;
    const height = editorHeight / this.zoom;

    for (let x = startX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Major grid lines (every 100px)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    const majorGrid = 100;
    const majorStartX = Math.floor(this.state.cameraX / majorGrid) * majorGrid - this.state.cameraX;

    for (let x = majorStartX; x < width; x += majorGrid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += majorGrid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D, editorWidth: number): void {
    const width = editorWidth / this.zoom;

    for (let i = 0; i < this.level.platforms.length; i++) {
      const platform = this.level.platforms[i];
      const screenX = platform.x - this.state.cameraX;

      // Skip if off screen
      if (screenX + platform.width < 0 || screenX > width) continue;

      // Check if selected (highlight differently)
      const isSelected = this.state.selectedElement?.type === 'platform' &&
                        this.state.selectedElement?.index === i;

      ctx.fillStyle = PLATFORM_COLORS[platform.type] || '#4a9eff';
      ctx.fillRect(screenX, platform.y, platform.width, platform.height);

      // Border
      ctx.strokeStyle = isSelected ? '#ffff00' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(screenX, platform.y, platform.width, platform.height);

      // Type label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.fillText(platform.type, screenX + 4, platform.y + 12);

      // Resize handle for selected platform
      if (isSelected) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(screenX + platform.width - 10, platform.y + platform.height - 10, 10, 10);
      }
    }
  }

  private renderCoins(ctx: CanvasRenderingContext2D, editorWidth: number): void {
    const width = editorWidth / this.zoom;

    for (let i = 0; i < this.level.coins.length; i++) {
      const coin = this.level.coins[i];
      const screenX = coin.x - this.state.cameraX;

      if (screenX < -20 || screenX > width + 20) continue;

      const isSelected = this.state.selectedElement?.type === 'coin' &&
                        this.state.selectedElement?.index === i;

      // Coin
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(screenX, coin.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#ffff00' : '#ffaa00';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
    }
  }

  private renderPlayerStart(ctx: CanvasRenderingContext2D): void {
    const screenX = this.level.playerStart.x - this.state.cameraX;

    ctx.fillStyle = '#00ffaa';
    ctx.fillRect(screenX, this.level.playerStart.y, 40, 40);

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, this.level.playerStart.y, 40, 40);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('START', screenX + 2, this.level.playerStart.y + 24);
  }

  private renderGoal(ctx: CanvasRenderingContext2D): void {
    const screenX = this.level.goal.x - this.state.cameraX;

    // Goal flag
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(screenX, this.level.goal.y, this.level.goal.width, this.level.goal.height);

    ctx.strokeStyle = '#ff8833';
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, this.level.goal.y, this.level.goal.width, this.level.goal.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOAL', screenX + this.level.goal.width / 2, this.level.goal.y + this.level.goal.height / 2 + 4);
    ctx.textAlign = 'left';
  }

  private renderSelection(ctx: CanvasRenderingContext2D): void {
    if (!this.state.selectedElement) return;

    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);

    switch (this.state.selectedElement.type) {
      case 'platform': {
        const p = this.level.platforms[this.state.selectedElement.index];
        if (!p) break;
        const screenX = p.x - this.state.cameraX;
        ctx.strokeRect(screenX - 2, p.y - 2, p.width + 4, p.height + 4);

        // Resize handle
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(screenX + p.width - 8, p.y + p.height - 8, 10, 10);
        break;
      }
      case 'coin': {
        const c = this.level.coins[this.state.selectedElement.index];
        if (!c) break;
        const screenX = c.x - this.state.cameraX;
        ctx.beginPath();
        ctx.arc(screenX, c.y, 16, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'playerStart': {
        const screenX = this.level.playerStart.x - this.state.cameraX;
        ctx.strokeRect(screenX - 2, this.level.playerStart.y - 2, 44, 44);
        break;
      }
      case 'goal': {
        const screenX = this.level.goal.x - this.state.cameraX;
        ctx.strokeRect(screenX - 2, this.level.goal.y - 2, this.level.goal.width + 4, this.level.goal.height + 4);
        break;
      }
    }

    ctx.setLineDash([]);
  }

  private renderCursorPreview(ctx: CanvasRenderingContext2D): void {
    const editorX = this.mouseX - this.sidebarWidth;
    const editorY = this.mouseY - this.toolbarHeight;

    if (editorX < 0 || editorY < 0 || editorY > GAME_HEIGHT) return;

    ctx.globalAlpha = 0.5;

    switch (this.state.selectedTool) {
      case 'platform': {
        const x = this.snapToGrid(this.mouseWorldX) - this.state.cameraX;
        const y = this.snapToGrid(this.mouseWorldY);
        ctx.fillStyle = PLATFORM_COLORS[this.state.selectedPlatformType];
        ctx.fillRect(x, y, 100, 20);
        break;
      }
      case 'coin': {
        const x = this.snapToGrid(this.mouseWorldX) - this.state.cameraX;
        const y = this.snapToGrid(this.mouseWorldY);
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.globalAlpha = 1;
  }

  private renderToolbar(ctx: CanvasRenderingContext2D): void {
    // Toolbar background
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, 0, GAME_WIDTH + this.sidebarWidth, this.toolbarHeight);

    // Level name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(this.level.name, 15, 25);

    // BPM
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`BPM: ${this.level.bpm}`, 15, 45);

    // Tool buttons (right side of toolbar)
    const tools: { tool: EditorTool; label: string; key: string }[] = [
      { tool: 'select', label: 'Select', key: '1' },
      { tool: 'platform', label: 'Platform', key: '2' },
      { tool: 'coin', label: 'Coin', key: '3' },
      { tool: 'delete', label: 'Delete', key: '4' },
      { tool: 'pan', label: 'Pan', key: '5' },
    ];

    let buttonX = this.sidebarWidth + 20;
    for (const { tool, label, key } of tools) {
      const isSelected = this.state.selectedTool === tool;

      ctx.fillStyle = isSelected ? '#4a9eff' : '#3a3a4e';
      ctx.fillRect(buttonX, 10, 70, 40);

      ctx.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
      ctx.font = '11px sans-serif';
      ctx.fillText(label, buttonX + 8, 28);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(`[${key}]`, buttonX + 8, 42);

      buttonX += 80;
    }

    // Play and Save buttons (center area)
    buttonX += 20; // Add gap after tools

    // Play/Test button with shortcut hint
    ctx.fillStyle = '#2d7d46';
    ctx.fillRect(buttonX, 10, 70, 40);
    ctx.fillStyle = '#66ff88';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('TEST', buttonX + 18, 26);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#44aa66';
    ctx.fillText('[F5]', buttonX + 22, 42);

    buttonX += 78;

    // Save button
    ctx.fillStyle = '#4a6fa5';
    ctx.fillRect(buttonX, 10, 60, 40);
    ctx.fillStyle = '#88bbff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SAVE', buttonX + 12, 35);

    // Help button (on far right)
    buttonX = GAME_WIDTH + this.sidebarWidth - 250;

    ctx.fillStyle = '#6a5acd';
    ctx.fillRect(buttonX, 10, 40, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('?', buttonX + 15, 36);

    // Undo/Redo buttons
    buttonX += 50;

    ctx.fillStyle = this.canUndo() ? '#3a3a4e' : '#2a2a3e';
    ctx.fillRect(buttonX, 10, 90, 40);
    ctx.fillStyle = this.canUndo() ? '#aaaaaa' : '#555555';
    ctx.font = '10px sans-serif';
    ctx.fillText('Undo', buttonX + 8, 26);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('[Ctrl+Z]', buttonX + 8, 40);

    buttonX += 98;

    ctx.fillStyle = this.canRedo() ? '#3a3a4e' : '#2a2a3e';
    ctx.fillRect(buttonX, 10, 90, 40);
    ctx.fillStyle = this.canRedo() ? '#aaaaaa' : '#555555';
    ctx.font = '10px sans-serif';
    ctx.fillText('Redo', buttonX + 8, 26);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('[Ctrl+Y]', buttonX + 8, 40);
  }

  private renderSidebar(ctx: CanvasRenderingContext2D): void {
    // Sidebar background
    ctx.fillStyle = '#252535';
    ctx.fillRect(0, this.toolbarHeight, this.sidebarWidth, GAME_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';

    // Platform types section
    ctx.fillText('Platform Types', 15, this.toolbarHeight + 20);

    let y = this.toolbarHeight + 32;
    for (const type of PLATFORM_TYPES) {
      const isSelected = this.state.selectedPlatformType === type;

      ctx.fillStyle = isSelected ? PLATFORM_COLORS[type] : '#3a3a4e';
      ctx.fillRect(10, y, this.sidebarWidth - 20, 22);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText(type.toUpperCase(), 20, y + 15);

      // Color indicator
      ctx.fillStyle = PLATFORM_COLORS[type];
      ctx.fillRect(this.sidebarWidth - 30, y + 4, 14, 14);

      y += 24;
    }

    // Background section
    y += 10;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Background', 15, y);

    y += 16;
    for (const bgType of BACKGROUND_TYPES) {
      const isSelected = this.level.background.type === bgType;

      ctx.fillStyle = isSelected ? '#4a9eff' : '#3a3a4e';
      ctx.fillRect(10, y, this.sidebarWidth - 20, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText(bgType.toUpperCase(), 20, y + 14);

      y += 22;
    }
  }

  // Get toolbar/sidebar dimensions for click detection
  getToolbarHeight(): number {
    return this.toolbarHeight;
  }

  getSidebarWidth(): number {
    return this.sidebarWidth;
  }

  // Handle sidebar clicks
  handleSidebarClick(x: number, y: number): void {
    // Platform type buttons
    let buttonY = this.toolbarHeight + 32;
    for (const type of PLATFORM_TYPES) {
      if (x >= 10 && x <= this.sidebarWidth - 10 &&
          y >= buttonY && y <= buttonY + 22) {
        this.setPlatformType(type);
        return;
      }
      buttonY += 24;
    }

    // Background buttons (10px gap + 16px for label)
    buttonY += 26;
    for (const bgType of BACKGROUND_TYPES) {
      if (x >= 10 && x <= this.sidebarWidth - 10 &&
          y >= buttonY && y <= buttonY + 20) {
        this.setBackgroundType(bgType);
        return;
      }
      buttonY += 22;
    }
  }

  // Handle toolbar clicks
  handleToolbarClick(x: number, y: number): void {
    const tools: EditorTool[] = ['select', 'platform', 'coin', 'delete', 'pan'];
    let buttonX = this.sidebarWidth + 20;

    for (const tool of tools) {
      if (x >= buttonX && x <= buttonX + 70 && y >= 10 && y <= 50) {
        this.setTool(tool);
        return;
      }
      buttonX += 80;
    }

    // Test button (after tools + 20px gap)
    buttonX += 20;
    if (x >= buttonX && x <= buttonX + 70 && y >= 10 && y <= 50) {
      if (this.onPlayCallback) {
        this.onPlayCallback();
      }
      return;
    }

    // Save button
    buttonX += 78;
    if (x >= buttonX && x <= buttonX + 60 && y >= 10 && y <= 50) {
      if (this.onSaveCallback) {
        this.onSaveCallback();
      }
      return;
    }

    // Help button
    buttonX = GAME_WIDTH + this.sidebarWidth - 250;
    if (x >= buttonX && x <= buttonX + 40 && y >= 10 && y <= 50) {
      this.toggleHelpOverlay();
      return;
    }

    // Undo button
    buttonX += 50;
    if (x >= buttonX && x <= buttonX + 90 && y >= 10 && y <= 50) {
      this.undo();
      return;
    }

    // Redo button
    buttonX += 98;
    if (x >= buttonX && x <= buttonX + 90 && y >= 10 && y <= 50) {
      this.redo();
      return;
    }
  }
}
