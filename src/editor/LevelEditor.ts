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
} from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { Background } from '../graphics/Background';

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

const BACKGROUND_TYPES: BackgroundType[] = ['city', 'neon', 'space', 'forest', 'volcano', 'ocean'];

export class LevelEditor {
  private level: CustomLevel;
  private state: EditorState;
  private background: Background;
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  // Mouse state
  private mouseX = 0;
  private mouseY = 0;
  private mouseWorldX = 0;
  private mouseWorldY = 0;
  private isMouseDown = false;
  private resizeHandle: string | null = null;
  private dragOffset: Vector2 = { x: 0, y: 0 };

  // UI state
  private toolbarHeight = 60;
  private sidebarWidth = 200;

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

    this.saveUndoState();
  }

  // Get current level
  getLevel(): CustomLevel {
    return this.level;
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
        particles: { count: 30, color: 'rgba(255, 255, 255', minSize: 1, maxSize: 3, speed: 30, direction: 'down' },
        effects: ['stars'],
      },
      neon: {
        type: 'neon',
        primaryColor: '#0d0221',
        secondaryColor: '#1a0533',
        accentColor: '#ff00ff',
        particles: { count: 40, color: 'rgba(255, 0, 255', minSize: 1, maxSize: 4, speed: 40, direction: 'up' },
        effects: ['grid', 'scanlines', 'pulse'],
      },
      space: {
        type: 'space',
        primaryColor: '#0a1628',
        secondaryColor: '#1a2a4a',
        accentColor: '#88ddff',
        particles: { count: 80, color: 'rgba(200, 230, 255', minSize: 1, maxSize: 4, speed: 40, direction: 'down' },
        effects: ['stars', 'aurora'],
      },
      forest: {
        type: 'forest',
        primaryColor: '#0a1a0a',
        secondaryColor: '#1a2a1a',
        accentColor: '#66ff66',
        particles: { count: 40, color: 'rgba(100, 200, 100', minSize: 2, maxSize: 5, speed: 20, direction: 'down' },
        effects: ['stars'],
      },
      volcano: {
        type: 'volcano',
        primaryColor: '#1a0a00',
        secondaryColor: '#2d1200',
        accentColor: '#ff4400',
        particles: { count: 60, color: 'rgba(255, 100, 0', minSize: 2, maxSize: 5, speed: 50, direction: 'up' },
        effects: ['embers', 'pulse'],
      },
      ocean: {
        type: 'ocean',
        primaryColor: '#001a33',
        secondaryColor: '#002244',
        accentColor: '#00ccff',
        particles: { count: 40, color: 'rgba(150, 220, 255', minSize: 3, maxSize: 8, speed: 30, direction: 'up' },
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
        const platform = this.level.platforms[this.state.selectedElement.index];
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
        const coin = this.level.coins[this.state.selectedElement.index];
        coin.x = Math.max(0, snappedX + this.dragOffset.x);
        coin.y = Math.max(0, Math.min(GAME_HEIGHT, snappedY + this.dragOffset.y));
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

  // Delete selected element
  deleteSelected(): void {
    if (!this.state.selectedElement) return;

    switch (this.state.selectedElement.type) {
      case 'platform':
        this.level.platforms.splice(this.state.selectedElement.index, 1);
        break;
      case 'coin':
        this.level.coins.splice(this.state.selectedElement.index, 1);
        break;
    }

    this.state.selectedElement = null;
    this.saveUndoState();
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

  // Update (for background animation)
  update(deltaTime: number): void {
    this.background.update(deltaTime);
  }

  // Render
  render(ctx: CanvasRenderingContext2D): void {
    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, GAME_WIDTH + this.sidebarWidth, GAME_HEIGHT + this.toolbarHeight);

    // Render editor area
    ctx.save();
    ctx.translate(this.sidebarWidth, this.toolbarHeight);

    // Clip to editor area
    ctx.beginPath();
    ctx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.clip();

    // Background
    this.background.render(ctx, this.state.cameraX);

    // Grid
    if (this.state.showGrid) {
      this.renderGrid(ctx);
    }

    // Platforms
    this.renderPlatforms(ctx);

    // Coins
    this.renderCoins(ctx);

    // Player start
    this.renderPlayerStart(ctx);

    // Goal
    this.renderGoal(ctx);

    // Selection highlight
    this.renderSelection(ctx);

    // Cursor preview
    this.renderCursorPreview(ctx);

    ctx.restore();

    // UI
    this.renderToolbar(ctx);
    this.renderSidebar(ctx);
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const startX = Math.floor(this.state.cameraX / this.state.gridSize) * this.state.gridSize - this.state.cameraX;

    for (let x = startX; x < GAME_WIDTH; x += this.state.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y < GAME_HEIGHT; y += this.state.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D): void {
    for (const platform of this.level.platforms) {
      const screenX = platform.x - this.state.cameraX;

      // Skip if off screen
      if (screenX + platform.width < 0 || screenX > GAME_WIDTH) continue;

      ctx.fillStyle = PLATFORM_COLORS[platform.type] || '#4a9eff';
      ctx.fillRect(screenX, platform.y, platform.width, platform.height);

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, platform.y, platform.width, platform.height);

      // Type label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.fillText(platform.type, screenX + 4, platform.y + 12);
    }
  }

  private renderCoins(ctx: CanvasRenderingContext2D): void {
    for (const coin of this.level.coins) {
      const screenX = coin.x - this.state.cameraX;

      if (screenX < -20 || screenX > GAME_WIDTH + 20) continue;

      // Coin
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(screenX, coin.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 2;
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
    ctx.font = 'bold 14px sans-serif';

    // Platform types section
    ctx.fillText('Platform Types', 15, this.toolbarHeight + 25);

    let y = this.toolbarHeight + 45;
    for (const type of PLATFORM_TYPES) {
      const isSelected = this.state.selectedPlatformType === type;

      ctx.fillStyle = isSelected ? PLATFORM_COLORS[type] : '#3a3a4e';
      ctx.fillRect(10, y, this.sidebarWidth - 20, 28);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText(type.toUpperCase(), 20, y + 18);

      // Color indicator
      ctx.fillStyle = PLATFORM_COLORS[type];
      ctx.fillRect(this.sidebarWidth - 35, y + 6, 16, 16);

      y += 32;
    }

    // Background section
    y += 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Background', 15, y);

    y += 20;
    for (const bgType of BACKGROUND_TYPES) {
      const isSelected = this.level.background.type === bgType;

      ctx.fillStyle = isSelected ? '#4a9eff' : '#3a3a4e';
      ctx.fillRect(10, y, this.sidebarWidth - 20, 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px sans-serif';
      ctx.fillText(bgType.toUpperCase(), 20, y + 16);

      y += 28;
    }

    // Controls help
    y = GAME_HEIGHT + this.toolbarHeight - 120;
    ctx.fillStyle = '#666666';
    ctx.font = '10px sans-serif';
    ctx.fillText('Controls:', 15, y);
    ctx.fillText('Click: Place/Select', 15, y + 15);
    ctx.fillText('Drag: Move element', 15, y + 30);
    ctx.fillText('Del: Delete selected', 15, y + 45);
    ctx.fillText('G: Toggle grid', 15, y + 60);
    ctx.fillText('Arrow keys: Pan', 15, y + 75);
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
    let buttonY = this.toolbarHeight + 45;
    for (const type of PLATFORM_TYPES) {
      if (x >= 10 && x <= this.sidebarWidth - 10 &&
          y >= buttonY && y <= buttonY + 28) {
        this.setPlatformType(type);
        return;
      }
      buttonY += 32;
    }

    // Background buttons
    buttonY += 40;
    for (const bgType of BACKGROUND_TYPES) {
      if (x >= 10 && x <= this.sidebarWidth - 10 &&
          y >= buttonY && y <= buttonY + 24) {
        this.setBackgroundType(bgType);
        return;
      }
      buttonY += 28;
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
