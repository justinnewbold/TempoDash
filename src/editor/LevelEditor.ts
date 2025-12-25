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

const PLATFORM_TYPES: PlatformType[] = ['solid', 'bounce', 'ice', 'lava', 'spike', 'moving', 'phase', 'crumble', 'conveyor', 'gravity', 'sticky', 'glass'];

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
};

const BACKGROUND_TYPES: BackgroundType[] = ['city', 'neon', 'space', 'forest', 'volcano', 'ocean'];

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

  // Zoom state
  private zoom = 1;
  private minZoom = 0.25;
  private maxZoom = 2;

  // Clipboard
  private clipboard: Array<PlatformConfig | CoinConfig> = [];

  // Canvas reference for touch handling
  private canvas: HTMLCanvasElement | null = null;

  // Callbacks for external actions
  private onSaveCallback: (() => void) | null = null;
  private onPlayCallback: (() => void) | null = null;

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
          this.dragOffset = { x: worldX - p.x, y: worldY - p.y };

          // Check resize handle
          const handleSize = 15;
          if (worldX >= p.x + p.width - handleSize && worldY >= p.y + p.height - handleSize) {
            this.resizeHandle = 'se';
          }
        } else if (element.type === 'coin') {
          const c = this.level.coins[element.index];
          this.dragOffset = { x: worldX - c.x, y: worldY - c.y };
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
      inspectorElement = {
        type: 'platform',
        data: this.level.platforms[element.index],
        index: element.index,
      };
    } else if (element.type === 'coin') {
      inspectorElement = {
        type: 'coin',
        data: this.level.coins[element.index],
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
    }
  }

  private duplicateSelected(): void {
    if (!this.state.selectedElement) return;

    if (this.state.selectedElement.type === 'platform') {
      const original = this.level.platforms[this.state.selectedElement.index];
      const duplicate: PlatformConfig = { ...original, x: original.x + 20, y: original.y + 20 };
      if (original.movePattern) {
        duplicate.movePattern = { ...original.movePattern };
      }
      this.level.platforms.push(duplicate);
      this.state.selectedElement = { type: 'platform', index: this.level.platforms.length - 1 };
    } else if (this.state.selectedElement.type === 'coin') {
      const original = this.level.coins[this.state.selectedElement.index];
      this.level.coins.push({ x: original.x + 20, y: original.y + 20 });
      this.state.selectedElement = { type: 'coin', index: this.level.coins.length - 1 };
    }

    this.saveUndoState();
  }

  private copySelected(): void {
    if (!this.state.selectedElement) return;

    this.clipboard = [];

    if (this.state.selectedElement.type === 'platform') {
      const original = this.level.platforms[this.state.selectedElement.index];
      this.clipboard.push({ ...original });
    } else if (this.state.selectedElement.type === 'coin') {
      const original = this.level.coins[this.state.selectedElement.index];
      this.clipboard.push({ ...original });
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
    if (!this.state.selectedElement) return;

    if (this.state.selectedElement.type === 'platform') {
      this.level.platforms.splice(this.state.selectedElement.index, 1);
    } else if (this.state.selectedElement.type === 'coin') {
      this.level.coins.splice(this.state.selectedElement.index, 1);
    }

    this.state.selectedElement = null;
    this.saveUndoState();
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

  // Minimap navigation
  private handleMiniMapNavigation(worldX: number): void {
    const viewportWidth = (this.canvas?.width || GAME_WIDTH) - this.getEditorOffsetX();
    this.state.cameraX = Math.max(0, worldX - viewportWidth / (2 * this.zoom));
  }

  // Mobile bottom toolbar tap handling
  private handleBottomToolbarTap(x: number, _y: number): void {
    const canvasWidth = this.canvas?.width || GAME_WIDTH;
    const buttonWidth = canvasWidth / 6;

    const tools: EditorTool[] = ['select', 'platform', 'coin', 'delete', 'pan'];
    const toolIndex = Math.floor(x / buttonWidth);

    if (toolIndex < tools.length) {
      this.setTool(tools[toolIndex]);
    } else {
      // Menu button - could show more options
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
  setOnPlay(callback: () => void): void {
    this.onPlayCallback = callback;
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
      this.level = JSON.parse(previous);
      this.background = new Background(this.level.background);
      this.state.selectedElement = null;
    }
  }

  redo(): void {
    if (this.redoStack.length > 0) {
      const next = this.redoStack.pop()!;
      this.undoStack.push(next);
      this.level = JSON.parse(next);
      this.background = new Background(this.level.background);
      this.state.selectedElement = null;
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

    const snappedX = this.snapToGrid(this.mouseWorldX - this.dragOffset.x);
    const snappedY = this.snapToGrid(this.mouseWorldY - this.dragOffset.y);

    switch (this.state.selectedElement.type) {
      case 'platform': {
        const idx = this.state.selectedElement.index;
        if (idx < 0 || idx >= this.level.platforms.length) break;
        const platform = this.level.platforms[idx];
        if (this.resizeHandle === 'se') {
          // Resize
          platform.width = Math.max(20, this.snapToGrid(this.mouseWorldX - platform.x));
          platform.height = Math.max(20, this.snapToGrid(this.mouseWorldY - platform.y));
        } else {
          // Move
          platform.x = Math.max(0, snappedX);
          platform.y = Math.max(0, Math.min(GAME_HEIGHT - platform.height, snappedY));
        }
        break;
      }
      case 'coin': {
        const idx = this.state.selectedElement.index;
        if (idx < 0 || idx >= this.level.coins.length) break;
        const coin = this.level.coins[idx];
        coin.x = Math.max(0, snappedX);
        coin.y = Math.max(0, Math.min(GAME_HEIGHT, snappedY));
        break;
      }
      case 'playerStart': {
        this.level.playerStart.x = Math.max(0, snappedX);
        this.level.playerStart.y = Math.max(0, Math.min(GAME_HEIGHT - 40, snappedY));
        break;
      }
      case 'goal': {
        this.level.goal.x = Math.max(0, snappedX);
        this.level.goal.y = Math.max(0, Math.min(GAME_HEIGHT - this.level.goal.height, snappedY));
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
      case 'platform':
        return { type: 'platform', data: this.level.platforms[this.state.selectedElement.index] };
      case 'coin':
        return { type: 'coin', data: this.level.coins[this.state.selectedElement.index] };
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
  handleKeyDown(key: string): void {
    switch (key) {
      case 'Delete':
      case 'Backspace':
        this.deleteSelected();
        break;
      case 'z':
        this.undo();
        break;
      case 'y':
        this.redo();
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
    }
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

    // Tool buttons
    const tools: { tool: EditorTool; icon: string; label: string }[] = [
      { tool: 'select', icon: '👆', label: 'Select' },
      { tool: 'platform', icon: '▬', label: 'Platform' },
      { tool: 'coin', icon: '●', label: 'Coin' },
      { tool: 'delete', icon: '🗑', label: 'Delete' },
      { tool: 'pan', icon: '✋', label: 'Pan' },
    ];

    const buttonWidth = canvasWidth / (tools.length + 1);
    let bx = 0;

    for (const { tool, icon, label } of tools) {
      const isSelected = this.state.selectedTool === tool;

      // Button background
      if (isSelected) {
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath();
        ctx.roundRect(bx + 4, y + 8, buttonWidth - 8, this.bottomToolbarHeight - 16, 8);
        ctx.fill();
      }

      // Icon
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
      ctx.fillText(icon, bx + buttonWidth / 2, y + 32);

      // Label
      ctx.font = '9px sans-serif';
      ctx.fillText(label, bx + buttonWidth / 2, y + 52);

      bx += buttonWidth;
    }

    // Menu button (hamburger)
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px sans-serif';
    ctx.fillText('☰', bx + buttonWidth / 2, y + 32);
    ctx.font = '9px sans-serif';
    ctx.fillText('Menu', bx + buttonWidth / 2, y + 52);

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
        const screenX = p.x - this.state.cameraX;
        ctx.strokeRect(screenX - 2, p.y - 2, p.width + 4, p.height + 4);

        // Resize handle
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(screenX + p.width - 8, p.y + p.height - 8, 10, 10);
        break;
      }
      case 'coin': {
        const c = this.level.coins[this.state.selectedElement.index];
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

    // Play button
    ctx.fillStyle = '#2d7d46';
    ctx.fillRect(buttonX, 10, 60, 40);
    ctx.fillStyle = '#66ff88';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('PLAY', buttonX + 12, 35);

    buttonX += 70;

    // Save button
    ctx.fillStyle = '#4a6fa5';
    ctx.fillRect(buttonX, 10, 60, 40);
    ctx.fillStyle = '#88bbff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SAVE', buttonX + 12, 35);

    // Undo/Redo buttons
    buttonX = GAME_WIDTH + this.sidebarWidth - 170;

    ctx.fillStyle = this.canUndo() ? '#3a3a4e' : '#2a2a3e';
    ctx.fillRect(buttonX, 10, 70, 40);
    ctx.fillStyle = this.canUndo() ? '#aaaaaa' : '#555555';
    ctx.font = '11px sans-serif';
    ctx.fillText('Undo [Z]', buttonX + 8, 35);

    buttonX += 80;

    ctx.fillStyle = this.canRedo() ? '#3a3a4e' : '#2a2a3e';
    ctx.fillRect(buttonX, 10, 70, 40);
    ctx.fillStyle = this.canRedo() ? '#aaaaaa' : '#555555';
    ctx.fillText('Redo [Y]', buttonX + 8, 35);
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

    // Play button (after tools + 20px gap)
    buttonX += 20;
    if (x >= buttonX && x <= buttonX + 60 && y >= 10 && y <= 50) {
      if (this.onPlayCallback) {
        this.onPlayCallback();
      }
      return;
    }

    // Save button
    buttonX += 70;
    if (x >= buttonX && x <= buttonX + 60 && y >= 10 && y <= 50) {
      if (this.onSaveCallback) {
        this.onSaveCallback();
      }
      return;
    }

    // Undo button
    buttonX = GAME_WIDTH + this.sidebarWidth - 170;
    if (x >= buttonX && x <= buttonX + 70 && y >= 10 && y <= 50) {
      this.undo();
      return;
    }

    // Redo button
    buttonX += 80;
    if (x >= buttonX && x <= buttonX + 70 && y >= 10 && y <= 50) {
      this.redo();
      return;
    }
  }
}
