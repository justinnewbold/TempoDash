import { GameState, CustomLevel, Achievement } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { InputManager } from '../systems/Input';
import { AudioManager } from '../systems/Audio';
import { SaveManager, LEVEL_UNLOCK_COSTS, PLAYER_SKINS } from '../systems/SaveManager';
import { CustomLevelManager } from '../systems/CustomLevelManager';
import { Player } from '../entities/Player';
import { Level } from '../levels/Level';
import { createLevel, TOTAL_LEVELS } from '../levels/index';
import { Platform } from '../entities/Platform';
import { PlatformType } from '../types';
import { LevelEditor } from '../editor/LevelEditor';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private audio: AudioManager;
  private save: SaveManager;

  private state: GameState = {
    currentLevel: 1,
    lives: 3,
    score: 0,
    gameStatus: 'mainMenu',
  };

  private player!: Player;
  private level!: Level;
  private cameraX = 0;
  private attempts = 0;

  private lastTime = 0;
  private deathTimer = 0;
  private beatPulse = 0;

  // Menu state
  private selectedLevelIndex = 0;
  private menuAnimation = 0;
  private levelScoreThisRun = 0;

  // Screen shake
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;

  // Death flash effect
  private deathFlashOpacity = 0;

  // Combo system
  private comboCount = 0;
  private comboTimer = 0;
  private comboDuration = 1500; // 1.5 seconds to maintain combo
  private comboDisplayTimer = 0; // For animation

  // Practice mode
  private isPracticeMode = false;
  private checkpointX = 0;
  private checkpointY = 0;
  private lastCheckpointProgress = 0;

  // Endless mode
  private isEndlessMode = false;
  private endlessDistance = 0;
  private endlessPlatforms: Platform[] = [];
  private nextPlatformX = 0;

  // Level Editor
  private customLevelManager: CustomLevelManager;
  private editor: LevelEditor | null = null;
  private editingLevel: CustomLevel | null = null;
  private customLevelScrollOffset = 0;

  // Tutorial
  private showingTutorial = false;

  // Achievement notifications
  private achievementQueue: Achievement[] = [];
  private currentAchievementNotification: Achievement | null = null;
  private achievementNotificationTimer = 0;
  private achievementNotificationDuration = 3000; // 3 seconds

  // Play time tracking
  private lastPlayTimeUpdate = 0;

  // High-DPI support
  private dpr = 1;

  // Speed increase system - each jump increases speed by 0.25%
  private speedMultiplier = 1.0;
  private jumpCount = 0;
  private static readonly SPEED_INCREASE_PER_JUMP = 0.0025; // 0.25%

  // Orientation and screen sizing
  private isPortrait = false;
  private orientationMessageTimer = 0;
  private showOrientationHint = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // High-DPI canvas setup for crisp graphics
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance

    // Initial screen sizing
    this.handleResize();

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;

    // Scale context for high-DPI and disable smoothing for crisp edges
    this.ctx.scale(this.dpr, this.dpr);
    this.setupCrispRendering();

    // Listen for resize and orientation changes
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => {
      // Small delay to let the browser update dimensions
      setTimeout(() => this.handleResize(), 100);
    });

    this.input = new InputManager();
    this.input.setCanvas(canvas);
    this.audio = new AudioManager();
    this.save = new SaveManager();
    this.customLevelManager = new CustomLevelManager();

    // Apply saved settings
    const settings = this.save.getSettings();
    this.audio.setMusicVolume(settings.musicVolume);
    this.audio.setSfxVolume(settings.sfxVolume);

    this.loadLevel(1);

    // Setup keyboard
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Setup click/touch for menus
    canvas.addEventListener('click', (e) => this.handleClick(e));

    // Touch support for menu navigation (click events unreliable on mobile)
    canvas.addEventListener('touchend', (e) => {
      // Dismiss orientation hint on any tap
      if (this.showOrientationHint) {
        e.preventDefault();
        this.showOrientationHint = false;
        this.orientationMessageTimer = 0;
        return;
      }

      // Dismiss tutorial on any tap (must check before gameStatus since tutorial shows during 'playing')
      if (this.showingTutorial) {
        e.preventDefault();
        this.dismissTutorial();
        return;
      }

      // Only handle single-touch taps for menu navigation
      if (e.changedTouches.length === 1 && this.state.gameStatus !== 'playing') {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (GAME_WIDTH / rect.width);
        const y = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);

        // Create a synthetic event-like object for the handlers
        this.handleTouchMenuClick(x, y);
      }
    }, { passive: false });

    // Setup mouse events for editor
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));

    // Setup beat callback
    this.audio.setBeatCallback((beat) => {
      if (beat % 2 === 0) {
        this.beatPulse = 1;
      }
    });
  }

  private loadLevel(levelId: number): void {
    this.level = createLevel(levelId);
    this.player = new Player(this.level.playerStart);
    this.player.setSkin(this.save.getSelectedSkin());
    this.state.currentLevel = levelId;
    this.cameraX = 0;
    // Reset speed multiplier for new level
    this.speedMultiplier = 1.0;
    this.jumpCount = 0;

    // Set music style for this level
    this.audio.setStyleForLevel(levelId);
  }

  private handleClick(e: MouseEvent): void {
    // Dismiss orientation hint on click
    if (this.showOrientationHint) {
      this.showOrientationHint = false;
      this.orientationMessageTimer = 0;
      return;
    }

    // Dismiss tutorial on click
    if (this.showingTutorial) {
      this.dismissTutorial();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (GAME_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);

    switch (this.state.gameStatus) {
      case 'mainMenu':
        this.handleMainMenuClick(x, y);
        break;
      case 'levelSelect':
        this.handleLevelSelectClick(x, y, e.shiftKey);
        break;
      case 'customLevels':
        this.handleCustomLevelsClick(x, y);
        break;
      case 'settings':
        this.handleSettingsClick(x, y);
        break;
      case 'skins':
        this.handleSkinsClick(x, y);
        break;
      case 'achievements':
        this.handleAchievementsClick(x, y);
        break;
      case 'editor':
        this.handleEditorClick(e);
        break;
      case 'levelComplete':
        this.nextLevel();
        break;
      case 'gameOver':
        this.endlessDistance = 0; // Reset for next endless run
        this.state.gameStatus = 'mainMenu';
        break;
    }
  }

  private handleTouchMenuClick(x: number, y: number): void {
    // Dismiss tutorial on touch
    if (this.showingTutorial) {
      this.dismissTutorial();
      return;
    }

    switch (this.state.gameStatus) {
      case 'mainMenu':
        this.handleMainMenuClick(x, y);
        break;
      case 'levelSelect':
        this.handleLevelSelectClick(x, y, false); // No shift key on touch
        break;
      case 'customLevels':
        this.handleCustomLevelsClick(x, y);
        break;
      case 'settings':
        this.handleSettingsClick(x, y);
        break;
      case 'skins':
        this.handleSkinsClick(x, y);
        break;
      case 'achievements':
        this.handleAchievementsClick(x, y);
        break;
      case 'editor':
        // Editor has its own touch handling via TouchHandler
        break;
      case 'levelComplete':
        this.nextLevel();
        break;
      case 'gameOver':
        this.endlessDistance = 0;
        this.state.gameStatus = 'mainMenu';
        break;
    }
  }

  private handleMainMenuClick(x: number, y: number): void {
    const centerX = GAME_WIDTH / 2;
    const buttonWidth = 200;
    const smallButtonWidth = 100;

    // Play button (y=260)
    if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
        y >= 235 && y <= 285) {
      this.audio.playSelect();
      this.state.gameStatus = 'levelSelect';
    }
    // Endless button (y=318)
    if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
        y >= 293 && y <= 343) {
      this.audio.playSelect();
      this.startEndlessMode();
    }
    // Editor button (left side, y=378)
    if (x >= centerX - 55 - smallButtonWidth / 2 && x <= centerX - 55 + smallButtonWidth / 2 &&
        y >= 358 && y <= 398) {
      this.audio.playSelect();
      this.openEditor();
    }
    // Custom Levels button (right side, y=378)
    if (x >= centerX + 55 - smallButtonWidth / 2 && x <= centerX + 55 + smallButtonWidth / 2 &&
        y >= 358 && y <= 398) {
      this.audio.playSelect();
      this.state.gameStatus = 'customLevels';
    }
    // Skins button (left side, y=438)
    if (x >= centerX - 55 - smallButtonWidth / 2 && x <= centerX - 55 + smallButtonWidth / 2 &&
        y >= 418 && y <= 458) {
      this.audio.playSelect();
      this.state.gameStatus = 'skins';
    }
    // Achievements button (right side, y=438)
    if (x >= centerX + 55 - smallButtonWidth / 2 && x <= centerX + 55 + smallButtonWidth / 2 &&
        y >= 418 && y <= 458) {
      this.audio.playSelect();
      this.state.gameStatus = 'achievements';
    }
    // Settings button (y=498)
    if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
        y >= 473 && y <= 523) {
      this.audio.playSelect();
      this.state.gameStatus = 'settings';
    }
  }

  private handleLevelSelectClick(x: number, y: number, shiftKey = false): void {
    // Back button
    if (x >= 20 && x <= 120 && y >= 20 && y <= 60) {
      this.audio.playSelect();
      this.state.gameStatus = 'mainMenu';
      return;
    }

    // Level cards - carousel style (must match renderLevelSelect dimensions)
    const cardWidth = 130;
    const cardHeight = 190;
    const cardGap = 25;
    const cardY = 180;
    const centerX = GAME_WIDTH / 2;

    // Left navigation arrow
    if (x >= 20 && x <= 80 && y >= cardY && y <= cardY + cardHeight) {
      if (this.selectedLevelIndex > 0) {
        this.selectedLevelIndex--;
        this.audio.playSelect();
      }
      return;
    }

    // Right navigation arrow
    if (x >= GAME_WIDTH - 80 && x <= GAME_WIDTH - 20 && y >= cardY && y <= cardY + cardHeight) {
      if (this.selectedLevelIndex < TOTAL_LEVELS - 1) {
        this.selectedLevelIndex++;
        this.audio.playSelect();
      }
      return;
    }

    // Check clicks on level cards
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const offsetFromSelected = i - this.selectedLevelIndex;
      const cardX = centerX - cardWidth / 2 + offsetFromSelected * (cardWidth + cardGap);

      // Skip if card is off screen
      if (cardX < -cardWidth || cardX > GAME_WIDTH + cardWidth) continue;

      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        if (i === this.selectedLevelIndex) {
          // Clicked on the center/selected card - play or unlock
          const levelId = i + 1;
          if (this.save.isLevelUnlocked(levelId)) {
            this.audio.playSelect();
            this.startLevel(levelId, shiftKey); // Practice mode if shift is held
          } else if (this.save.canUnlockLevel(levelId)) {
            if (this.save.unlockLevel(levelId)) {
              this.audio.playUnlock();
            }
          }
        } else {
          // Clicked on a non-selected card - navigate to it
          this.selectedLevelIndex = i;
          this.audio.playSelect();
        }
        return;
      }
    }

    // Level indicator dots - allow clicking on them to navigate
    const dotsY = cardY + cardHeight + 30;
    if (y >= dotsY - 10 && y <= dotsY + 10) {
      for (let i = 0; i < TOTAL_LEVELS; i++) {
        const dotX = centerX + (i - (TOTAL_LEVELS - 1) / 2) * 20;
        if (x >= dotX - 10 && x <= dotX + 10) {
          this.selectedLevelIndex = i;
          this.audio.playSelect();
          return;
        }
      }
    }
  }

  private handleSettingsClick(x: number, y: number): void {
    // Back button
    if (x >= 20 && x <= 120 && y >= 20 && y <= 60) {
      this.audio.playSelect();
      this.state.gameStatus = 'mainMenu';
      return;
    }

    const sliderWidth = 250;
    const sliderX = GAME_WIDTH / 2 - sliderWidth / 2 - 30;

    // Music volume slider
    if (x >= sliderX && x <= sliderX + sliderWidth && y >= 190 && y <= 230) {
      const volume = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
      this.audio.setMusicVolume(volume);
      this.save.updateSettings({ musicVolume: volume });
    }

    // SFX volume slider
    if (x >= sliderX && x <= sliderX + sliderWidth && y >= 280 && y <= 320) {
      const volume = Math.max(0, Math.min(1, (x - sliderX) / sliderWidth));
      this.audio.setSfxVolume(volume);
      this.save.updateSettings({ sfxVolume: volume });
      this.audio.playSelect();
    }

    // Screen shake toggle
    const toggleWidth = 60;
    const toggleX = GAME_WIDTH / 2 - toggleWidth / 2;
    if (x >= toggleX && x <= toggleX + toggleWidth && y >= 385 && y <= 415) {
      const currentShake = this.save.getSettings().screenShake;
      this.save.updateSettings({ screenShake: !currentShake });
      this.audio.playSelect();
    }
  }

  private handleSkinsClick(x: number, y: number): void {
    // Back button
    if (x >= 20 && x <= 120 && y >= 20 && y <= 60) {
      this.audio.playSelect();
      this.state.gameStatus = 'mainMenu';
      return;
    }

    // Skin cards (3 per row, 2 rows)
    const cardWidth = 140;
    const cardHeight = 160;
    const cols = 3;
    const gap = 30;
    const startX = (GAME_WIDTH - (cardWidth * cols + gap * (cols - 1))) / 2;
    const startY = 140;

    for (let i = 0; i < PLAYER_SKINS.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const cardX = startX + col * (cardWidth + gap);
      const cardY = startY + row * (cardHeight + gap);

      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        const skin = PLAYER_SKINS[i];
        if (this.save.isSkinUnlocked(skin.id)) {
          // Select this skin
          this.save.selectSkin(skin.id);
          this.audio.playSelect();
        } else if (this.save.canUnlockSkin(skin.id)) {
          // Unlock this skin
          if (this.save.unlockSkin(skin.id)) {
            this.audio.playUnlock();
          }
        }
        return;
      }
    }
  }

  private handleAchievementsClick(x: number, y: number): void {
    // Back button
    if (x >= 20 && x <= 120 && y >= 20 && y <= 60) {
      this.audio.playSelect();
      this.state.gameStatus = 'mainMenu';
      return;
    }
    // Achievements don't need click handling - just viewing
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Dismiss tutorial on any key
    if (this.showingTutorial) {
      this.dismissTutorial();
      return;
    }

    // Mute toggle
    if (e.code === 'KeyM') {
      this.audio.toggleMute();
      return;
    }

    switch (this.state.gameStatus) {
      case 'mainMenu':
        if (e.code === 'Enter' || e.code === 'Space') {
          this.audio.playSelect();
          this.state.gameStatus = 'levelSelect';
        }
        break;

      case 'levelSelect':
        if (e.code === 'Escape') {
          this.audio.playSelect();
          this.state.gameStatus = 'mainMenu';
        } else if (e.code === 'ArrowLeft') {
          this.selectedLevelIndex = Math.max(0, this.selectedLevelIndex - 1);
          this.audio.playSelect();
        } else if (e.code === 'ArrowRight') {
          this.selectedLevelIndex = Math.min(TOTAL_LEVELS - 1, this.selectedLevelIndex + 1);
          this.audio.playSelect();
        } else if (e.code === 'Enter' || e.code === 'Space') {
          const levelId = this.selectedLevelIndex + 1;
          if (this.save.isLevelUnlocked(levelId)) {
            this.audio.playSelect();
            this.startLevel(levelId);
          } else if (this.save.canUnlockLevel(levelId)) {
            if (this.save.unlockLevel(levelId)) {
              this.audio.playUnlock();
            }
          }
        } else if (e.code.startsWith('Digit')) {
          const num = parseInt(e.code.replace('Digit', ''));
          if (num >= 1 && num <= TOTAL_LEVELS) {
            const levelId = num;
            if (this.save.isLevelUnlocked(levelId)) {
              this.audio.playSelect();
              this.startLevel(levelId);
            }
          }
        }
        break;

      case 'settings':
        if (e.code === 'Escape') {
          this.audio.playSelect();
          this.state.gameStatus = 'mainMenu';
        }
        break;

      case 'skins':
        if (e.code === 'Escape') {
          this.audio.playSelect();
          this.state.gameStatus = 'mainMenu';
        }
        break;

      case 'achievements':
        if (e.code === 'Escape') {
          this.audio.playSelect();
          this.state.gameStatus = 'mainMenu';
        }
        break;

      case 'customLevels':
        if (e.code === 'Escape') {
          this.audio.playSelect();
          this.state.gameStatus = 'mainMenu';
        }
        break;

      case 'editor':
        this.handleEditorKeyDown(e);
        break;

      case 'editorTest':
        if (e.code === 'Escape') {
          this.returnToEditor();
        }
        break;

      case 'playing':
      case 'practice':
      case 'endless':
        if (e.code === 'Escape') {
          this.state.gameStatus = 'paused';
          this.audio.stop();
        }
        break;

      case 'paused':
        if (e.code === 'Escape' || e.code === 'Enter') {
          // Resume to the correct mode
          if (this.isEndlessMode) {
            this.state.gameStatus = 'endless';
          } else if (this.isPracticeMode) {
            this.state.gameStatus = 'practice';
          } else {
            this.state.gameStatus = 'playing';
          }
          this.audio.start();
        } else if (e.code === 'KeyQ') {
          this.isEndlessMode = false;
          this.isPracticeMode = false;
          this.state.gameStatus = 'mainMenu';
        }
        break;

      case 'levelComplete':
        if (e.code === 'Enter' || e.code === 'Space') {
          this.nextLevel();
        }
        break;

      case 'gameOver':
        if (e.code === 'Enter' || e.code === 'Space') {
          this.endlessDistance = 0; // Reset for next endless run
          this.state.gameStatus = 'mainMenu';
        }
        break;
    }
  }

  private startLevel(levelId: number, practiceMode = false): void {
    this.loadLevel(levelId);
    this.attempts = 1;
    this.levelScoreThisRun = 0;
    this.isPracticeMode = practiceMode;
    this.checkpointX = this.level.playerStart.x;
    this.checkpointY = this.level.playerStart.y;
    this.lastCheckpointProgress = 0;
    this.state.gameStatus = practiceMode ? 'practice' : 'playing';

    // Show tutorial on first play
    if (!this.save.hasTutorialBeenShown()) {
      this.showingTutorial = true;
    } else {
      this.audio.start();
    }
  }

  private nextLevel(): void {
    if (this.state.currentLevel < TOTAL_LEVELS) {
      this.state.currentLevel++;
      // Auto-unlock next level if not already (without spending points)
      if (!this.save.isLevelUnlocked(this.state.currentLevel)) {
        this.save.grantLevel(this.state.currentLevel);
      }
      this.loadLevel(this.state.currentLevel);
      this.attempts = 1;
      this.levelScoreThisRun = 0;
      this.isPracticeMode = false;
      this.checkpointX = this.level.playerStart.x;
      this.checkpointY = this.level.playerStart.y;
      this.lastCheckpointProgress = 0;
      this.state.gameStatus = 'playing';
      this.audio.start();
    } else {
      this.state.gameStatus = 'mainMenu';
      this.audio.stop();
    }
  }

  private startEndlessMode(): void {
    // Initialize endless mode
    this.isEndlessMode = true;
    this.endlessDistance = 0;
    this.endlessPlatforms = [];
    this.nextPlatformX = 0;
    this.cameraX = 0;
    this.attempts = 1;

    // Load level 1 as base but we'll use procedural platforms
    this.loadLevel(1);
    this.player.setSkin(this.save.getSelectedSkin());

    // Generate initial platforms
    this.generateEndlessPlatforms(1500);

    this.state.gameStatus = 'endless';
    this.audio.start();
  }

  private generateEndlessPlatforms(untilX: number): void {
    const GROUND_Y = GAME_HEIGHT - 40;
    const GROUND_HEIGHT = 40;

    while (this.nextPlatformX < untilX) {
      // Start with ground at the beginning
      if (this.nextPlatformX === 0) {
        this.endlessPlatforms.push(new Platform({
          x: 0,
          y: GROUND_Y,
          width: 400,
          height: GROUND_HEIGHT,
          type: 'solid',
        }));
        this.nextPlatformX = 400;
        continue;
      }

      // Difficulty increases with distance
      const difficulty = Math.min(this.endlessDistance / 3000, 1);

      // Gap size (increases with difficulty)
      const minGap = 80 + difficulty * 40;
      const maxGap = 150 + difficulty * 80;
      const gap = minGap + Math.random() * (maxGap - minGap);

      // Platform width (decreases with difficulty)
      const minWidth = Math.max(80, 150 - difficulty * 50);
      const maxWidth = Math.max(120, 250 - difficulty * 80);
      const width = minWidth + Math.random() * (maxWidth - minWidth);

      // Platform position
      const x = this.nextPlatformX + gap;

      // Height variation (more varied with difficulty)
      const heightVariation = difficulty * 80;
      const baseY = GROUND_Y;
      let y = baseY;

      // Sometimes create elevated platforms
      if (Math.random() < 0.3 + difficulty * 0.2) {
        y = baseY - 40 - Math.random() * heightVariation;
      }

      // Platform type selection
      let type: PlatformType = 'solid';
      const typeRoll = Math.random();

      if (difficulty > 0.2 && typeRoll < 0.1) {
        type = 'bounce';
      } else if (difficulty > 0.4 && typeRoll < 0.15) {
        type = 'ice';
      }

      this.endlessPlatforms.push(new Platform({
        x,
        y,
        width,
        height: GROUND_HEIGHT,
        type,
      }));

      // Sometimes add spikes (more frequent at higher difficulty)
      if (difficulty > 0.3 && Math.random() < 0.2 + difficulty * 0.2) {
        this.endlessPlatforms.push(new Platform({
          x: x + width + 20,
          y: baseY,
          width: 30,
          height: 30,
          type: 'spike',
        }));
      }

      this.nextPlatformX = x + width;
    }
  }

  private respawnPlayer(): void {
    this.attempts++;

    // Reset combo on death
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboDisplayTimer = 0;

    // Reset speed multiplier on death
    this.speedMultiplier = 1.0;
    this.jumpCount = 0;

    if (this.isPracticeMode && this.lastCheckpointProgress > 0) {
      // Respawn at checkpoint
      this.player.reset({ x: this.checkpointX, y: this.checkpointY });
      this.cameraX = Math.max(0, this.checkpointX - 150);
    } else {
      // Normal respawn at level start
      this.loadLevel(this.state.currentLevel);
    }
    this.state.gameStatus = this.isPracticeMode ? 'practice' : 'playing';
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Update menu animation
    this.menuAnimation += deltaTime / 1000;

    // Update achievement notifications
    this.updateAchievementNotifications(deltaTime);

    // Track play time
    if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'practice' || this.state.gameStatus === 'endless') {
      this.lastPlayTimeUpdate += deltaTime;
      if (this.lastPlayTimeUpdate >= 10000) { // Save every 10 seconds
        this.save.addPlayTime(this.lastPlayTimeUpdate);
        this.lastPlayTimeUpdate = 0;
        this.checkAchievements();
      }
    }

    // Decay beat pulse
    if (this.beatPulse > 0) {
      this.beatPulse = Math.max(0, this.beatPulse - deltaTime / 150);
    }

    // Decay screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
    }

    // Decay death flash
    if (this.deathFlashOpacity > 0) {
      this.deathFlashOpacity = Math.max(0, this.deathFlashOpacity - deltaTime / 300);
    }

    // Decay orientation hint timer
    if (this.orientationMessageTimer > 0) {
      this.orientationMessageTimer -= deltaTime;
      if (this.orientationMessageTimer <= 0) {
        this.showOrientationHint = false;
      }
    }

    // Editor mode has its own update
    if (this.state.gameStatus === 'editor') {
      this.updateEditor(deltaTime);
      return;
    }

    if (this.state.gameStatus !== 'playing' && this.state.gameStatus !== 'practice' && this.state.gameStatus !== 'endless' && this.state.gameStatus !== 'editorTest') {
      this.level.update(deltaTime);
      return;
    }

    // Don't update gameplay while tutorial is showing
    if (this.showingTutorial) {
      this.level.update(deltaTime); // Keep background animations running
      return;
    }

    const inputState = this.input.update();
    this.level.update(deltaTime);

    const wasGroundedBefore = this.player.isGrounded;
    const wasAliveBefore = !this.player.isDead;
    const prevVelocityY = this.player.velocityY;
    const wasDashing = this.player.isDashing;

    // In endless mode, use procedural platforms
    if (this.isEndlessMode) {
      this.player.update(deltaTime, inputState, this.endlessPlatforms, this.speedMultiplier);

      // Update distance
      this.endlessDistance = Math.max(this.endlessDistance, Math.floor(this.player.x / 10));

      // Generate more platforms ahead
      this.generateEndlessPlatforms(this.cameraX + 1500);

      // Clean up platforms behind camera
      this.endlessPlatforms = this.endlessPlatforms.filter((p) => p.x + p.width > this.cameraX - 200);
    } else {
      this.player.update(deltaTime, inputState, this.level.getActivePlatforms(), this.speedMultiplier);
    }

    // Trigger dash shake
    if (!wasDashing && this.player.isDashing) {
      this.triggerShake(4, 80); // Light shake on dash start
    }

    // Check coin collection
    const coinsCollected = this.level.checkCoinCollection(this.player);
    if (coinsCollected > 0) {
      this.audio.playSelect(); // Use select sound for coins for now

      // Update combo
      this.comboCount += coinsCollected;
      this.comboTimer = this.comboDuration;
      this.comboDisplayTimer = 500; // Show combo text for 500ms

      // Check combo achievements
      if (this.comboCount >= 5) {
        this.tryUnlockAchievement('combo_5');
      }
      if (this.comboCount >= 10) {
        this.tryUnlockAchievement('combo_10');
      }

      // Update longest combo
      this.save.updateLongestCombo(this.comboCount);
    }

    // Decay combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Decay combo display
    if (this.comboDisplayTimer > 0) {
      this.comboDisplayTimer -= deltaTime;
    }

    if (wasGroundedBefore && !this.player.isGrounded && !this.player.isDead) {
      this.audio.playJump();
      // Increase speed by 0.25% per jump (compound growth)
      this.jumpCount++;
      this.speedMultiplier *= (1 + Game.SPEED_INCREASE_PER_JUMP);
    }

    // Detect bounce (sudden large upward velocity change)
    const bounceThreshold = -600;
    if (prevVelocityY >= 0 && this.player.velocityY < bounceThreshold) {
      this.triggerShake(6, 120); // Medium shake on bounce
    }

    if (wasAliveBefore && this.player.isDead) {
      this.audio.playDeath();
      this.triggerShake(12, 350); // Strong shake on death
      this.deathFlashOpacity = 0.6; // Trigger death flash
      // Track death for achievements
      this.save.recordDeath();
      this.tryUnlockAchievement('first_death');
    }

    const targetCameraX = this.player.x - 150;
    this.cameraX = Math.max(0, targetCameraX);

    // Update checkpoints in practice mode (every 25% progress)
    if (this.isPracticeMode) {
      const progress = this.level.getProgress(this.player.x);
      const checkpointInterval = 0.25;
      const currentCheckpoint = Math.floor(progress / checkpointInterval) * checkpointInterval;

      if (currentCheckpoint > this.lastCheckpointProgress && this.player.isGrounded) {
        this.checkpointX = this.player.x;
        this.checkpointY = this.player.y;
        this.lastCheckpointProgress = currentCheckpoint;
        // Visual/audio feedback for checkpoint could be added here
      }
    }

    if (this.player.isDead) {
      this.deathTimer += deltaTime;
      if (this.deathTimer > 500) {
        this.deathTimer = 0;

        if (this.isEndlessMode) {
          // Game over in endless mode
          this.save.setEndlessHighScore(this.endlessDistance);

          // Check endless mode achievements
          if (this.endlessDistance >= 50) {
            this.tryUnlockAchievement('endless_50');
          }
          if (this.endlessDistance >= 100) {
            this.tryUnlockAchievement('endless_100');
          }
          if (this.endlessDistance >= 500) {
            this.tryUnlockAchievement('endless_500');
          }

          this.isEndlessMode = false;
          this.state.gameStatus = 'gameOver';
          this.audio.stop();
        } else {
          this.respawnPlayer();
        }
      }
      return;
    }

    if (this.level.checkGoal(this.player)) {
      if (!this.isPracticeMode) {
        // Calculate score based on attempts and coins (only in normal mode)
        const baseScore = 1000;
        const attemptPenalty = (this.attempts - 1) * 50;
        const coinBonus = this.level.coinsCollected * 100;
        this.levelScoreThisRun = Math.max(baseScore - attemptPenalty, 100) + coinBonus;

        // Add to total points
        this.save.addPoints(this.levelScoreThisRun);

        // Check for high score
        this.save.setHighScore(this.state.currentLevel, this.levelScoreThisRun);

        // Track level completion for achievements
        this.save.recordLevelComplete();
        this.tryUnlockAchievement('first_clear');

        // Check perfect run (no deaths this run)
        if (this.attempts === 1) {
          this.tryUnlockAchievement('perfect_level');
        }

        // Check all coins collected
        const totalCoins = this.level.totalCoins;
        if (totalCoins > 0 && this.level.coinsCollected >= totalCoins) {
          this.tryUnlockAchievement('all_coins_level');
        }

        // Track coins for this level
        this.save.setLevelCoins(this.state.currentLevel, this.level.coinsCollected);
        this.save.recordCoinsCollected(this.level.coinsCollected);

        // Check achievements
        this.checkAchievements();
      } else {
        this.levelScoreThisRun = 0; // No points in practice mode
      }

      this.state.gameStatus = 'levelComplete';
      this.audio.stop();
      this.audio.playLevelComplete();
    }
  }

  private setupCrispRendering(): void {
    // Disable image smoothing for crisp pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    // TypeScript doesn't know about these vendor prefixes, but they help older browsers
    (this.ctx as unknown as Record<string, boolean>).mozImageSmoothingEnabled = false;
    (this.ctx as unknown as Record<string, boolean>).webkitImageSmoothingEnabled = false;
    (this.ctx as unknown as Record<string, boolean>).msImageSmoothingEnabled = false;
  }

  private handleResize(): void {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Detect orientation
    this.isPortrait = windowHeight > windowWidth;

    // Calculate optimal canvas size while maintaining 16:9 aspect ratio
    const targetRatio = GAME_WIDTH / GAME_HEIGHT;
    const screenRatio = windowWidth / windowHeight;

    let canvasWidth: number;
    let canvasHeight: number;

    if (screenRatio > targetRatio) {
      // Screen is wider than game - fit to height
      canvasHeight = windowHeight;
      canvasWidth = canvasHeight * targetRatio;
    } else {
      // Screen is taller than game - fit to width
      canvasWidth = windowWidth;
      canvasHeight = canvasWidth / targetRatio;
    }

    // Calculate offset for centering
    const canvasOffsetX = (windowWidth - canvasWidth) / 2;
    const canvasOffsetY = (windowHeight - canvasHeight) / 2;

    // Update canvas size with high-DPI support
    this.canvas.width = GAME_WIDTH * this.dpr;
    this.canvas.height = GAME_HEIGHT * this.dpr;
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    // Center canvas on screen
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${canvasOffsetX}px`;
    this.canvas.style.top = `${canvasOffsetY}px`;

    // Re-scale context for high-DPI after resize
    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.setupCrispRendering();
    }

    // Show orientation hint in portrait mode for a few seconds on mobile
    if (this.isPortrait && this.input && this.input.isMobileDevice()) {
      this.showOrientationHint = true;
      this.orientationMessageTimer = 3000; // Show for 3 seconds
    } else {
      this.showOrientationHint = false;
    }
  }

  private render(): void {
    // Editor mode has its own rendering
    if (this.state.gameStatus === 'editor') {
      this.renderEditor();
      return;
    }

    // Get shake offset
    const shake = this.getShakeOffset();

    this.ctx.save();
    this.ctx.translate(shake.x, shake.y);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (this.state.gameStatus === 'endless') {
      // Render endless mode
      this.renderEndlessBackground();
      this.renderEndlessPlatforms();
      this.player.render(this.ctx, this.cameraX);
      this.renderEndlessUI();
    } else if (this.state.gameStatus === 'editorTest') {
      // Render test mode
      this.level.render(this.ctx, this.cameraX);
      this.player.render(this.ctx, this.cameraX);
      this.renderPlayingUI();
      this.renderEditorTestUI();
    } else {
      this.level.render(this.ctx, this.cameraX);

      if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'practice' || this.state.gameStatus === 'paused') {
        this.player.render(this.ctx, this.cameraX);
        this.renderPlayingUI();
      }
    }

    // Death flash effect
    if (this.deathFlashOpacity > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 0, ${this.deathFlashOpacity})`;
      this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    this.ctx.restore();

    // Show tutorial overlay if active
    if (this.showingTutorial) {
      this.renderTutorial();
      return; // Don't render other overlays
    }

    switch (this.state.gameStatus) {
      case 'mainMenu':
        this.renderMainMenu();
        break;
      case 'levelSelect':
        this.renderLevelSelect();
        break;
      case 'customLevels':
        this.renderCustomLevels();
        break;
      case 'settings':
        this.renderSettings();
        break;
      case 'skins':
        this.renderSkins();
        break;
      case 'achievements':
        this.renderAchievements();
        break;
      case 'paused':
        this.renderPaused();
        break;
      case 'gameOver':
        this.renderGameOver();
        break;
      case 'levelComplete':
        this.renderLevelComplete();
        break;
    }

    // Achievement notification (always on top)
    this.renderAchievementNotification();

    // Portrait mode orientation hint (on top of everything)
    if (this.showOrientationHint && this.isPortrait) {
      this.renderOrientationHint();
    }
  }

  private renderOrientationHint(): void {
    // Semi-transparent overlay
    const fadeProgress = Math.min(1, this.orientationMessageTimer / 500);
    this.ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * fadeProgress})`;
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Rotate phone icon (simple representation)
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2 - 30;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    // Animate rotation
    const rotateAngle = Math.sin(Date.now() * 0.003) * 0.3;
    this.ctx.rotate(rotateAngle);

    // Draw phone outline
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${fadeProgress})`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(-25, -45, 50, 90, 8);
    this.ctx.stroke();

    // Phone screen
    this.ctx.fillStyle = `rgba(100, 200, 255, ${0.3 * fadeProgress})`;
    this.ctx.fillRect(-20, -35, 40, 65);

    // Home button
    this.ctx.beginPath();
    this.ctx.arc(0, 38, 5, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.restore();

    // Rotation arrows
    this.ctx.strokeStyle = `rgba(100, 255, 150, ${fadeProgress})`;
    this.ctx.lineWidth = 2;

    // Left arrow (curved)
    this.ctx.beginPath();
    this.ctx.arc(centerX - 50, centerY, 20, Math.PI * 0.5, Math.PI * 1.5);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 50, centerY - 20);
    this.ctx.lineTo(centerX - 58, centerY - 12);
    this.ctx.lineTo(centerX - 42, centerY - 12);
    this.ctx.closePath();
    this.ctx.fillStyle = `rgba(100, 255, 150, ${fadeProgress})`;
    this.ctx.fill();

    // Right arrow (curved)
    this.ctx.beginPath();
    this.ctx.arc(centerX + 50, centerY, 20, -Math.PI * 0.5, Math.PI * 0.5);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(centerX + 50, centerY + 20);
    this.ctx.lineTo(centerX + 42, centerY + 12);
    this.ctx.lineTo(centerX + 58, centerY + 12);
    this.ctx.closePath();
    this.ctx.fill();

    // Text
    this.ctx.fillStyle = `rgba(255, 255, 255, ${fadeProgress})`;
    this.ctx.font = 'bold 18px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Rotate for best experience', centerX, centerY + 80);

    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillStyle = `rgba(180, 180, 180, ${fadeProgress})`;
    this.ctx.fillText('Tap anywhere to dismiss', centerX, centerY + 105);
  }

  private renderPlayingUI(): void {
    this.ctx.save();

    // Progress bar (centered, shorter width for cleaner look)
    const progress = this.level.getProgress(this.player.x);
    const barWidth = 300;
    const barHeight = 6;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = 15;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth * progress, barY);
    gradient.addColorStop(0, '#00ffaa');
    gradient.addColorStop(1, '#00ffff');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Percentage (directly below progress bar)
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.shadowColor = COLORS.UI_SHADOW;
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(`${Math.floor(progress * 100)}%`, GAME_WIDTH / 2, 38);

    // Level name (top-left, larger and more prominent)
    this.ctx.textAlign = 'left';
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillText(`${this.level.name}`, 20, 28);

    // Practice mode indicator
    if (this.isPracticeMode) {
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffaa00';
      const checkpointPercent = Math.floor(this.lastCheckpointProgress * 100);
      this.ctx.fillText(`PRACTICE (checkpoint: ${checkpointPercent}%)`, 20, 46);

      // Attempt counter (moved down for practice mode)
      this.ctx.font = '14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillText(`Attempt ${this.attempts}`, 20, 62);
    } else {
      // Attempt counter (below level name, smaller)
      this.ctx.font = '14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillText(`Attempt ${this.attempts}`, 20, 48);
    }

    // Speed boost indicator (below attempt counter)
    if (this.speedMultiplier > 1.001) {
      const speedPercent = Math.floor((this.speedMultiplier - 1) * 100);
      // Color coded: green < 10%, orange 10-20%, red > 20%
      const speedColor = speedPercent > 20 ? '#ff4444' : speedPercent > 10 ? '#ffaa00' : '#00ffaa';
      this.ctx.font = '14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = speedColor;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`Speed +${speedPercent}%`, 20, this.isPracticeMode ? 78 : 64);
    }

    // Coins collected (top-right)
    if (this.level.getTotalCoins() > 0) {
      this.ctx.textAlign = 'right';
      this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.fillText(`★ ${this.level.coinsCollected}/${this.level.getTotalCoins()}`, GAME_WIDTH - 20, 28);
    }

    // Personal best indicator (top-right, below coins)
    const highScore = this.save.getHighScore(this.state.currentLevel);
    if (highScore > 0) {
      this.ctx.textAlign = 'right';
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 170, 0, 0.8)';
      this.ctx.fillText(`Best: ${highScore}pts`, GAME_WIDTH - 20, this.level.getTotalCoins() > 0 ? 46 : 28);
    }

    // Mute indicator (top-right, below other info)
    if (this.audio.isMusicMuted()) {
      this.ctx.textAlign = 'right';
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ff6666';
      let muteY = 28;
      if (this.level.getTotalCoins() > 0) muteY += 18;
      if (highScore > 0) muteY += 14;
      this.ctx.fillText('MUTED', GAME_WIDTH - 20, muteY);
    }

    // Combo counter (center, when active)
    if (this.comboCount > 1 && this.comboDisplayTimer > 0) {
      const comboScale = 1 + (this.comboDisplayTimer / 500) * 0.3;
      const comboAlpha = Math.min(1, this.comboDisplayTimer / 200);

      this.ctx.textAlign = 'center';
      this.ctx.font = `bold ${Math.floor(28 * comboScale)}px "Segoe UI", sans-serif`;

      // Color based on combo count
      let comboColor = '#ffd700';
      if (this.comboCount >= 10) {
        comboColor = '#ff00ff';
      } else if (this.comboCount >= 5) {
        comboColor = '#ff6600';
      }

      this.ctx.fillStyle = comboColor;
      this.ctx.shadowColor = comboColor;
      this.ctx.shadowBlur = 15;
      this.ctx.globalAlpha = comboAlpha;
      this.ctx.fillText(`${this.comboCount}x COMBO!`, GAME_WIDTH / 2, 80);
      this.ctx.globalAlpha = 1;
      this.ctx.shadowBlur = 4;
    }

    // Beat indicator
    if (this.beatPulse > 0) {
      const size = 15 + this.beatPulse * 10;
      this.ctx.beginPath();
      this.ctx.arc(GAME_WIDTH - 30, GAME_HEIGHT - 30, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 255, 255, ${this.beatPulse * 0.8})`;
      this.ctx.fill();
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.beatPulse})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.ctx.beginPath();
    this.ctx.arc(GAME_WIDTH - 30, GAME_HEIGHT - 30, 15, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderMainMenu(): void {
    this.renderOverlay();

    this.ctx.save();
    this.ctx.textAlign = 'center';

    // Animated title
    const titleY = 130 + Math.sin(this.menuAnimation * 2) * 10;
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 30;
    this.ctx.font = 'bold 64px "Segoe UI", sans-serif';
    this.ctx.fillText('TEMPO DASH', GAME_WIDTH / 2, titleY);

    // Subtitle
    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.fillText('EDM Rhythm Platformer', GAME_WIDTH / 2, titleY + 40);

    // Total points display
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.fillText(`Total Points: ${this.save.getTotalPoints()}`, GAME_WIDTH / 2, 220);

    // Endless high score
    const endlessHigh = this.save.getEndlessHighScore();
    if (endlessHigh > 0) {
      this.ctx.font = '14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#00ffaa';
      this.ctx.fillText(`Endless Best: ${endlessHigh}m`, GAME_WIDTH / 2, 242);
    }

    // Buttons (repositioned to fit 7 buttons)
    this.renderMenuButton('PLAY', GAME_WIDTH / 2, 260, true);
    this.renderMenuButton('ENDLESS', GAME_WIDTH / 2, 318, false);

    // Editor and Custom Levels side by side
    this.renderSmallMenuButton('EDITOR', GAME_WIDTH / 2 - 55, 378, '#ff00ff');
    this.renderSmallMenuButton('MY LEVELS', GAME_WIDTH / 2 + 55, 378, '#00ff88');

    // Skins and Achievements side by side
    const achieveProgress = this.save.getAchievementProgress();
    this.renderSmallMenuButton('SKINS', GAME_WIDTH / 2 - 55, 438, '#ffd700');
    this.renderSmallMenuButton(`BADGES ${achieveProgress.unlocked}/${achieveProgress.total}`, GAME_WIDTH / 2 + 55, 438, '#ff6600');

    this.renderMenuButton('SETTINGS', GAME_WIDTH / 2, 498, false);

    // Controls hint (smaller to fit)
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('SPACE/tap: jump | SHIFT: dash | M: mute', GAME_WIDTH / 2, 540);

    this.ctx.restore();
  }

  private renderMenuButton(text: string, x: number, y: number, primary: boolean): void {
    const width = 200;
    const height = 50;

    // Button background
    this.ctx.fillStyle = primary ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    this.ctx.strokeStyle = primary ? '#00ffff' : 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.roundRect(x - width / 2, y - height / 2, width, height, 10);
    this.ctx.fill();
    this.ctx.stroke();

    // Button text
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = primary ? '#00ffff' : '#ffffff';
    this.ctx.shadowBlur = primary ? 10 : 0;
    this.ctx.shadowColor = '#00ffff';
    this.ctx.fillText(text, x, y + 7);
  }

  private renderSmallMenuButton(text: string, x: number, y: number, color: string): void {
    const width = 100;
    const height = 40;

    this.ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba').replace('#', 'rgba(');
    // Handle hex colors
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
    }
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.roundRect(x - width / 2, y - height / 2, width, height, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = color;
    this.ctx.fillText(text, x, y + 4);
  }

  private renderLevelSelect(): void {
    this.renderOverlay();

    this.ctx.save();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('SELECT LEVEL', GAME_WIDTH / 2, 80);

    // Points
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.fillText(`Points: ${this.save.getTotalPoints()}`, GAME_WIDTH / 2, 120);

    // Back button
    this.ctx.textAlign = 'left';
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('< Back (ESC)', 20, 45);

    // Level cards - carousel style with selected level in center
    const cardWidth = 130;
    const cardHeight = 190;
    const cardGap = 25;
    const cardY = 180;
    const centerX = GAME_WIDTH / 2;

    const levelNames = ['First Flight', 'Neon Dreams', 'Final Ascent', 'Frozen Peak', 'Volcanic Descent', 'Abyssal Depths', 'The Gauntlet', 'Sky Temple'];
    const levelColors = ['#00ffaa', '#ff00ff', '#ff6600', '#88ddff', '#ff4400', '#00ccff', '#ff0000', '#e94560'];
    const levelDifficulty = [1, 2, 3, 3, 4, 5, 5, 5]; // 1-5 stars

    // Navigation arrows
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.font = 'bold 40px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';

    // Left arrow (show if not at first level)
    if (this.selectedLevelIndex > 0) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText('◀', 50, cardY + cardHeight / 2 + 10);
    }

    // Right arrow (show if not at last level)
    if (this.selectedLevelIndex < TOTAL_LEVELS - 1) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText('▶', GAME_WIDTH - 50, cardY + cardHeight / 2 + 10);
    }

    // Render level cards with the selected one centered
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const levelId = i + 1;
      const isSelected = i === this.selectedLevelIndex;

      // Calculate position relative to selected level
      const offsetFromSelected = i - this.selectedLevelIndex;
      const cardX = centerX - cardWidth / 2 + offsetFromSelected * (cardWidth + cardGap);

      // Skip if card is too far off screen
      if (cardX < -cardWidth || cardX > GAME_WIDTH + cardWidth) continue;

      // Scale and fade non-selected cards
      const scale = isSelected ? 1.0 : 0.85;
      const alpha = isSelected ? 1.0 : 0.6;

      const isUnlocked = this.save.isLevelUnlocked(levelId);
      const canUnlock = this.save.canUnlockLevel(levelId);
      const cost = LEVEL_UNLOCK_COSTS[levelId] || 0;
      const highScore = this.save.getHighScore(levelId);

      this.ctx.save();

      // Apply scale transform around card center
      const scaledCardWidth = cardWidth * scale;
      const scaledCardHeight = cardHeight * scale;
      const scaledCardX = cardX + (cardWidth - scaledCardWidth) / 2;
      const scaledCardY = cardY + (cardHeight - scaledCardHeight) / 2;

      this.ctx.globalAlpha = alpha;

      // Card background
      this.ctx.fillStyle = isUnlocked ? 'rgba(0, 0, 0, 0.7)' : 'rgba(50, 50, 50, 0.7)';
      this.ctx.strokeStyle = isUnlocked ? levelColors[i] : (canUnlock ? '#ffd700' : 'rgba(100, 100, 100, 0.5)');
      this.ctx.lineWidth = isSelected ? 4 : 3;
      this.ctx.beginPath();
      this.ctx.roundRect(scaledCardX, scaledCardY, scaledCardWidth, scaledCardHeight, 15 * scale);
      this.ctx.fill();
      this.ctx.stroke();

      // Selected glow effect
      if (isSelected) {
        this.ctx.shadowColor = levelColors[i];
        this.ctx.shadowBlur = 20;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }

      this.ctx.textAlign = 'center';
      const cardCenterX = scaledCardX + scaledCardWidth / 2;

      // Level number
      this.ctx.font = `bold ${Math.round(42 * scale)}px "Segoe UI", sans-serif`;
      this.ctx.fillStyle = isUnlocked ? levelColors[i] : 'rgba(100, 100, 100, 0.8)';
      this.ctx.shadowColor = levelColors[i];
      this.ctx.shadowBlur = isUnlocked && isSelected ? 15 : 0;
      this.ctx.fillText(`${levelId}`, cardCenterX, scaledCardY + 55 * scale);

      // Level name
      this.ctx.font = `bold ${Math.round(15 * scale)}px "Segoe UI", sans-serif`;
      this.ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(150, 150, 150, 0.8)';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(levelNames[i], cardCenterX, scaledCardY + 85 * scale);

      // Difficulty stars
      const difficulty = levelDifficulty[i];
      const starStr = '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
      this.ctx.font = `${Math.round(10 * scale)}px "Segoe UI", sans-serif`;
      this.ctx.fillStyle = isUnlocked ? '#ffaa00' : 'rgba(150, 150, 150, 0.6)';
      this.ctx.fillText(starStr, cardCenterX, scaledCardY + 100 * scale);

      if (isUnlocked) {
        // High score
        this.ctx.font = `${Math.round(14 * scale)}px "Segoe UI", sans-serif`;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(highScore > 0 ? `Best: ${highScore}` : 'Not completed', cardCenterX, scaledCardY + 125 * scale);

        // Click to play (only show on selected)
        if (isSelected) {
          this.ctx.font = `${Math.round(12 * scale)}px "Segoe UI", sans-serif`;
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          this.ctx.fillText('Click to play', cardCenterX, scaledCardY + 160 * scale);
        }
      } else {
        // Lock icon
        this.ctx.font = `${Math.round(20 * scale)}px "Segoe UI", sans-serif`;
        this.ctx.fillStyle = canUnlock ? '#ffd700' : 'rgba(100, 100, 100, 0.8)';
        this.ctx.fillText('🔒', cardCenterX, scaledCardY + 125 * scale);

        // Cost
        this.ctx.font = `${Math.round(13 * scale)}px "Segoe UI", sans-serif`;
        this.ctx.fillStyle = canUnlock ? '#ffd700' : 'rgba(100, 100, 100, 0.8)';
        this.ctx.fillText(`${cost} pts to unlock`, cardCenterX, scaledCardY + 150 * scale);

        if (canUnlock && isSelected) {
          // Click to unlock
          this.ctx.font = `${Math.round(12 * scale)}px "Segoe UI", sans-serif`;
          this.ctx.fillStyle = '#ffd700';
          this.ctx.fillText('Click to unlock!', cardCenterX, scaledCardY + 170 * scale);
        }
      }

      this.ctx.restore();
    }

    // Level indicator dots
    this.ctx.textAlign = 'center';
    const dotsY = cardY + cardHeight + 30;
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const dotX = centerX + (i - (TOTAL_LEVELS - 1) / 2) * 20;
      this.ctx.beginPath();
      this.ctx.arc(dotX, dotsY, i === this.selectedLevelIndex ? 6 : 4, 0, Math.PI * 2);
      this.ctx.fillStyle = i === this.selectedLevelIndex ? levelColors[i] : 'rgba(255, 255, 255, 0.3)';
      this.ctx.fill();
    }

    // Level features hint
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText('Use ← → arrows or click arrows to navigate', GAME_WIDTH / 2, 440);
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fillText('Hold SHIFT and click to start Practice Mode (checkpoints, no points)', GAME_WIDTH / 2, 465);

    this.ctx.restore();
  }

  private renderSettings(): void {
    this.renderOverlay();

    this.ctx.save();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('SETTINGS', GAME_WIDTH / 2, 100);

    // Back button
    this.ctx.textAlign = 'left';
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('< Back (ESC)', 20, 45);

    const sliderWidth = 250;
    const sliderX = GAME_WIDTH / 2 - sliderWidth / 2 - 30;

    // Music volume
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Music Volume', GAME_WIDTH / 2, 180);
    this.renderSlider(sliderX, 200, sliderWidth, this.audio.getMusicVolume());

    // SFX volume
    this.ctx.fillText('SFX Volume', GAME_WIDTH / 2, 270);
    this.renderSlider(sliderX, 290, sliderWidth, this.audio.getSfxVolume());

    // Screen shake toggle
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Screen Shake', GAME_WIDTH / 2, 360);
    this.renderToggle(GAME_WIDTH / 2, 385, this.save.getSettings().screenShake);

    // Mute indicator
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('Press M to toggle music mute', GAME_WIDTH / 2, 440);

    this.ctx.restore();
  }

  private renderSkins(): void {
    this.renderOverlay();

    this.ctx.save();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('PLAYER SKINS', GAME_WIDTH / 2, 80);

    // Points
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.fillText(`Points: ${this.save.getTotalPoints()}`, GAME_WIDTH / 2, 115);

    // Back button
    this.ctx.textAlign = 'left';
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('< Back (ESC)', 20, 45);

    // Skin cards (3 per row, 2 rows)
    const cardWidth = 140;
    const cardHeight = 160;
    const cols = 3;
    const gap = 30;
    const startX = (GAME_WIDTH - (cardWidth * cols + gap * (cols - 1))) / 2;
    const startY = 140;

    const selectedSkinId = this.save.getSettings().selectedSkin;

    for (let i = 0; i < PLAYER_SKINS.length; i++) {
      const skin = PLAYER_SKINS[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      const cardX = startX + col * (cardWidth + gap);
      const cardY = startY + row * (cardHeight + gap);

      const isUnlocked = this.save.isSkinUnlocked(skin.id);
      const isSelected = skin.id === selectedSkinId;
      const canUnlock = this.save.canUnlockSkin(skin.id);

      // Card background
      this.ctx.fillStyle = isUnlocked ? 'rgba(0, 0, 0, 0.7)' : 'rgba(50, 50, 50, 0.7)';
      this.ctx.strokeStyle = isSelected ? '#ffd700' : (isUnlocked ? skin.primaryColor : (canUnlock ? '#ffd700' : 'rgba(100, 100, 100, 0.5)'));
      this.ctx.lineWidth = isSelected ? 4 : 2;
      this.ctx.beginPath();
      this.ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.textAlign = 'center';
      const centerX = cardX + cardWidth / 2;

      // Skin preview (colored square)
      const previewSize = 50;
      const previewY = cardY + 25;

      if (isUnlocked) {
        // Draw animated preview for rainbow
        if (skin.id === 'rainbow') {
          const hue = (this.menuAnimation * 50) % 360;
          const gradient = this.ctx.createLinearGradient(
            centerX - previewSize / 2, previewY,
            centerX + previewSize / 2, previewY + previewSize
          );
          gradient.addColorStop(0, `hsl(${hue}, 100%, 60%)`);
          gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 50%)`);
          this.ctx.fillStyle = gradient;
        } else {
          const gradient = this.ctx.createLinearGradient(
            centerX - previewSize / 2, previewY,
            centerX + previewSize / 2, previewY + previewSize
          );
          gradient.addColorStop(0, skin.primaryColor);
          gradient.addColorStop(1, skin.secondaryColor);
          this.ctx.fillStyle = gradient;
        }
        this.ctx.shadowColor = skin.glowColor;
        this.ctx.shadowBlur = 15;
      } else {
        this.ctx.fillStyle = 'rgba(80, 80, 80, 0.8)';
        this.ctx.shadowBlur = 0;
      }

      this.ctx.fillRect(centerX - previewSize / 2, previewY, previewSize, previewSize);
      this.ctx.shadowBlur = 0;

      // Eye on preview
      if (isUnlocked) {
        this.ctx.fillStyle = skin.eyeColor;
        this.ctx.beginPath();
        this.ctx.arc(centerX + previewSize / 4, previewY + previewSize / 4, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(centerX + previewSize / 4 + 2, previewY + previewSize / 4, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Skin name
      this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(150, 150, 150, 0.8)';
      this.ctx.fillText(skin.name, centerX, cardY + 95);

      if (isUnlocked) {
        if (isSelected) {
          this.ctx.font = '12px "Segoe UI", sans-serif';
          this.ctx.fillStyle = '#ffd700';
          this.ctx.fillText('EQUIPPED', centerX, cardY + 115);
        } else {
          this.ctx.font = '12px "Segoe UI", sans-serif';
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          this.ctx.fillText('Click to equip', centerX, cardY + 115);
        }
      } else {
        // Cost
        this.ctx.font = '12px "Segoe UI", sans-serif';
        this.ctx.fillStyle = canUnlock ? '#ffd700' : 'rgba(100, 100, 100, 0.8)';
        this.ctx.fillText(`${skin.cost} pts`, centerX, cardY + 115);

        if (canUnlock) {
          this.ctx.font = '11px "Segoe UI", sans-serif';
          this.ctx.fillText('Click to unlock!', centerX, cardY + 135);
        } else {
          this.ctx.font = '18px "Segoe UI", sans-serif';
          this.ctx.fillText('🔒', centerX, cardY + 140);
        }
      }
    }

    this.ctx.restore();
  }

  private renderAchievements(): void {
    this.renderOverlay();

    this.ctx.save();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 42px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff6600';
    this.ctx.shadowColor = '#ff6600';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('ACHIEVEMENTS', GAME_WIDTH / 2, 70);

    // Progress
    const progress = this.save.getAchievementProgress();
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.fillText(`${progress.unlocked} / ${progress.total} Unlocked`, GAME_WIDTH / 2, 100);

    // Back button
    this.ctx.textAlign = 'left';
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('< Back (ESC)', 20, 45);

    // Achievement grid (4 per row)
    const allAchievements = this.save.getAllAchievements();
    const cardWidth = 170;
    const cardHeight = 85;
    const cols = 4;
    const gap = 15;
    const startX = (GAME_WIDTH - (cardWidth * cols + gap * (cols - 1))) / 2;
    const startY = 125;

    for (let i = 0; i < allAchievements.length; i++) {
      const achievement = allAchievements[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      const cardX = startX + col * (cardWidth + gap);
      const cardY = startY + row * (cardHeight + gap);

      const isUnlocked = this.save.hasAchievement(achievement.id);
      const isSecret = achievement.secret && !isUnlocked;

      // Card background
      this.ctx.fillStyle = isUnlocked ? 'rgba(255, 100, 0, 0.2)' : 'rgba(50, 50, 50, 0.5)';
      this.ctx.strokeStyle = isUnlocked ? '#ff6600' : 'rgba(100, 100, 100, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 8);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.textAlign = 'center';
      const centerX = cardX + cardWidth / 2;

      // Icon
      this.ctx.font = '24px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(100, 100, 100, 0.8)';
      this.ctx.fillText(isSecret ? '❓' : achievement.icon, centerX, cardY + 30);

      // Name
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(150, 150, 150, 0.8)';
      this.ctx.fillText(isSecret ? '???' : achievement.name, centerX, cardY + 52);

      // Description
      this.ctx.font = '10px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isUnlocked ? 'rgba(255, 255, 255, 0.7)' : 'rgba(100, 100, 100, 0.7)';
      const description = isSecret ? 'Secret achievement' : achievement.description;
      // Truncate long descriptions
      const maxChars = 28;
      const displayDesc = description.length > maxChars ? description.substring(0, maxChars - 3) + '...' : description;
      this.ctx.fillText(displayDesc, centerX, cardY + 70);
    }

    this.ctx.restore();
  }

  private renderToggle(x: number, y: number, enabled: boolean): void {
    const width = 60;
    const height = 30;
    const toggleX = x - width / 2;

    // Track background
    this.ctx.fillStyle = enabled ? 'rgba(0, 255, 170, 0.3)' : 'rgba(100, 100, 100, 0.3)';
    this.ctx.strokeStyle = enabled ? '#00ffaa' : 'rgba(150, 150, 150, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(toggleX, y, width, height, 15);
    this.ctx.fill();
    this.ctx.stroke();

    // Toggle knob
    const knobX = enabled ? toggleX + width - 17 : toggleX + 17;
    this.ctx.fillStyle = enabled ? '#00ffaa' : 'rgba(150, 150, 150, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(knobX, y + height / 2, 11, 0, Math.PI * 2);
    this.ctx.fill();

    // Label
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = enabled ? '#00ffaa' : 'rgba(150, 150, 150, 0.8)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(enabled ? 'ON' : 'OFF', x, y + height + 20);
  }

  private renderSlider(x: number, y: number, width: number, value: number): void {
    // Track
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, 20, 10);
    this.ctx.fill();

    // Fill
    const gradient = this.ctx.createLinearGradient(x, y, x + width * value, y);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(1, '#ff00ff');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width * value, 20, 10);
    this.ctx.fill();

    // Knob
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(x + width * value, y + 10, 12, 0, Math.PI * 2);
    this.ctx.fill();

    // Value text (positioned to the right of the slider)
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${Math.round(value * 100)}%`, x + width + 20, y + 15);
  }

  private renderPaused(): void {
    this.renderOverlay();

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 15;

    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

    // Controls reminder box
    const boxY = GAME_HEIGHT / 2 - 30;
    const boxWidth = 320;
    const boxHeight = 160;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(GAME_WIDTH / 2 - boxWidth / 2, boxY, boxWidth, boxHeight, 10);
    this.ctx.fill();
    this.ctx.stroke();

    // Controls title
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowBlur = 5;
    this.ctx.fillText('CONTROLS', GAME_WIDTH / 2, boxY + 25);

    // Control list
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    const controls = [
      ['SPACE / TAP', 'Jump'],
      ['SHIFT / 2-FINGER', 'Dash'],
      ['M', 'Mute/Unmute'],
      ['ESC', 'Pause/Resume'],
    ];

    let lineY = boxY + 50;
    for (const [key, action] of controls) {
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.fillText(key, GAME_WIDTH / 2 - 10, lineY);
      this.ctx.textAlign = 'left';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText(action, GAME_WIDTH / 2 + 10, lineY);
      lineY += 22;
    }

    // Resume/Quit instructions
    this.ctx.textAlign = 'center';
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillText('Press ESC or ENTER to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 115);
    this.ctx.fillStyle = '#ff6666';
    this.ctx.fillText('Press Q to quit to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140);

    this.ctx.restore();
  }

  private renderGameOver(): void {
    this.renderOverlay();

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ff4444';
    this.ctx.shadowColor = '#ff0000';
    this.ctx.shadowBlur = 20;

    this.ctx.font = 'bold 56px "Segoe UI", sans-serif';
    this.ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

    // Show endless mode score
    if (this.endlessDistance > 0) {
      this.ctx.fillStyle = '#00ffff';
      this.ctx.shadowColor = '#00ffff';
      this.ctx.font = 'bold 32px "Segoe UI", sans-serif';
      this.ctx.fillText(`Distance: ${this.endlessDistance}m`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 5);

      const highScore = this.save.getEndlessHighScore();
      this.ctx.font = '20px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.shadowColor = '#ffd700';
      if (this.endlessDistance >= highScore) {
        this.ctx.fillText('NEW BEST!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
      } else {
        this.ctx.fillText(`Best: ${highScore}m`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
      }
    }

    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 5;
    this.ctx.fillText('Click or Press ENTER to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);

    this.ctx.restore();
  }

  private renderLevelComplete(): void {
    this.renderOverlay();

    this.ctx.save();
    this.ctx.textAlign = 'center';

    if (this.isPracticeMode) {
      // Practice mode completion
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.shadowColor = '#ffaa00';
      this.ctx.shadowBlur = 25;

      this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
      this.ctx.fillText('PRACTICE COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

      this.ctx.fillStyle = COLORS.UI_TEXT;
      this.ctx.font = '20px "Segoe UI", sans-serif';
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(`Attempts: ${this.attempts}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

      this.ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
      this.ctx.font = '18px "Segoe UI", sans-serif';
      this.ctx.fillText('Practice mode - no points awarded', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);

      this.ctx.font = '20px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText('Click or Press ENTER to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    } else {
      // Normal completion
      this.ctx.fillStyle = '#ffd700';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 25;

      this.ctx.font = 'bold 56px "Segoe UI", sans-serif';
      this.ctx.fillText('LEVEL COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

      this.ctx.fillStyle = COLORS.UI_TEXT;
      this.ctx.font = '24px "Segoe UI", sans-serif';
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(`Attempts: ${this.attempts}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

      this.ctx.fillStyle = '#00ffaa';
      this.ctx.fillText(`+${this.levelScoreThisRun} Points!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = '18px "Segoe UI", sans-serif';
      this.ctx.fillText(`Total: ${this.save.getTotalPoints()}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 75);

      this.ctx.font = '20px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

      if (this.state.currentLevel < TOTAL_LEVELS) {
        this.ctx.fillText('Click or Press ENTER for next level', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
      } else {
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillText('Congratulations! You beat the game!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText('Click or Press ENTER to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 145);
      }
    }

    this.ctx.restore();
  }

  private renderEndlessBackground(): void {
    // Dynamic background that shifts color based on distance
    const hue = (this.endlessDistance * 0.1) % 360;

    const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, `hsl(${hue}, 60%, 10%)`);
    gradient.addColorStop(1, `hsl(${(hue + 30) % 360}, 50%, 5%)`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Scrolling grid effect
    this.ctx.strokeStyle = `hsla(${hue}, 80%, 50%, 0.1)`;
    this.ctx.lineWidth = 1;

    const gridSize = 50;
    const offsetX = (-this.cameraX * 0.3) % gridSize;

    for (let x = offsetX; x < GAME_WIDTH; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, GAME_HEIGHT);
      this.ctx.stroke();
    }

    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(GAME_WIDTH, y);
      this.ctx.stroke();
    }
  }

  private renderEndlessPlatforms(): void {
    // Use the Platform's built-in render method
    for (const platform of this.endlessPlatforms) {
      platform.render(this.ctx, this.cameraX);
    }
  }

  private renderEndlessUI(): void {
    this.ctx.save();

    // Distance counter (main score)
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 15;
    this.ctx.fillText(`${this.endlessDistance}m`, GAME_WIDTH / 2, 50);

    // High score
    const highScore = this.save.getEndlessHighScore();
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.shadowBlur = 5;
    this.ctx.fillText(`Best: ${highScore}m`, GAME_WIDTH / 2, 75);

    // Mode label
    this.ctx.textAlign = 'left';
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.fillText('ENDLESS MODE', 20, 30);

    // Mute indicator
    if (this.audio.isMusicMuted()) {
      this.ctx.textAlign = 'right';
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ff6666';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText('MUTED', GAME_WIDTH - 20, 30);
    }

    // Beat indicator
    if (this.beatPulse > 0) {
      const size = 15 + this.beatPulse * 10;
      this.ctx.beginPath();
      this.ctx.arc(GAME_WIDTH - 30, GAME_HEIGHT - 30, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 255, 255, ${this.beatPulse * 0.8})`;
      this.ctx.fill();
    }

    this.ctx.beginPath();
    this.ctx.arc(GAME_WIDTH - 30, GAME_HEIGHT - 30, 15, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private triggerShake(intensity: number, duration: number): void {
    // Only shake if screen shake is enabled in settings
    if (!this.save.getSettings().screenShake) return;

    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  private getShakeOffset(): { x: number; y: number } {
    if (this.shakeTimer <= 0) return { x: 0, y: 0 };

    const progress = this.shakeTimer / this.shakeDuration;
    const currentIntensity = this.shakeIntensity * progress;

    return {
      x: (Math.random() - 0.5) * currentIntensity * 2,
      y: (Math.random() - 0.5) * currentIntensity * 2,
    };
  }

  // ==================== LEVEL EDITOR METHODS ====================

  private openEditor(levelToEdit?: CustomLevel): void {
    if (levelToEdit) {
      this.editingLevel = levelToEdit;
    } else {
      this.editingLevel = this.customLevelManager.createNewLevel();
    }
    this.editor = new LevelEditor(this.editingLevel);
    this.editor.setOnSave(() => this.saveCurrentLevel());
    this.editor.setOnPlay(() => this.testLevel());
    this.state.gameStatus = 'editor';

    // Resize canvas for editor (needs more space for UI) with high-DPI support
    const editorWidth = GAME_WIDTH + 200;
    const editorHeight = GAME_HEIGHT + 60;
    this.canvas.width = editorWidth * this.dpr;
    this.canvas.height = editorHeight * this.dpr;
    this.canvas.style.width = `${editorWidth}px`;
    this.canvas.style.height = `${editorHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.setupCrispRendering();

    // Initialize touch handling and layout for the editor
    this.editor.initTouch(this.canvas);
  }

  private closeEditor(): void {
    // Restore canvas size with high-DPI support
    this.canvas.width = GAME_WIDTH * this.dpr;
    this.canvas.height = GAME_HEIGHT * this.dpr;
    this.canvas.style.width = `${GAME_WIDTH}px`;
    this.canvas.style.height = `${GAME_HEIGHT}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.setupCrispRendering();
    this.editor = null;
    this.editingLevel = null;
    this.state.gameStatus = 'mainMenu';
  }

  private saveCurrentLevel(): void {
    if (this.editor && this.editingLevel) {
      const level = this.editor.getLevel();
      if (this.customLevelManager.saveLevel(level)) {
        this.editor.markAsSaved();
        // Check for level creator achievement
        this.tryUnlockAchievement('level_creator');
      }
      this.editingLevel = level;
    }
  }

  private handleEditorClick(e: MouseEvent): void {
    if (!this.editor) return;

    const rect = this.canvas.getBoundingClientRect();
    // Use editor dimensions for logical coordinates (editor canvas is larger than game)
    const editorWidth = GAME_WIDTH + 200;
    const editorHeight = GAME_HEIGHT + 60;
    const x = (e.clientX - rect.left) * (editorWidth / rect.width);
    const y = (e.clientY - rect.top) * (editorHeight / rect.height);

    // Check toolbar area
    if (y < this.editor.getToolbarHeight()) {
      this.editor.handleToolbarClick(x, y);
      return;
    }

    // Check sidebar area
    if (x < this.editor.getSidebarWidth()) {
      this.editor.handleSidebarClick(x, y);
      return;
    }

    // Editor canvas area
    this.editor.handleMouseDown(x, y);
  }

  private handleCustomLevelsClick(x: number, y: number): void {
    // Back button
    if (x >= 20 && x <= 120 && y >= 20 && y <= 60) {
      this.audio.playSelect();
      this.state.gameStatus = 'mainMenu';
      return;
    }

    // Create New Level button
    if (x >= GAME_WIDTH / 2 - 100 && x <= GAME_WIDTH / 2 + 100 &&
        y >= GAME_HEIGHT - 80 && y <= GAME_HEIGHT - 40) {
      this.audio.playSelect();
      this.openEditor();
      return;
    }

    // Level cards
    const levels = this.customLevelManager.getAllLevels();
    const cardWidth = 200;
    const cardHeight = 120;
    const cardsPerRow = 3;
    const startX = (GAME_WIDTH - (cardWidth * cardsPerRow + 20 * (cardsPerRow - 1))) / 2;
    const startY = 120;

    for (let i = 0; i < levels.length; i++) {
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      const cardX = startX + col * (cardWidth + 20);
      const cardY = startY + row * (cardHeight + 15) - this.customLevelScrollOffset;

      if (cardY < 100 || cardY > GAME_HEIGHT - 100) continue;

      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        // Check for play button (left side)
        if (x >= cardX + 10 && x <= cardX + 60 && y >= cardY + cardHeight - 35 && y <= cardY + cardHeight - 10) {
          this.audio.playSelect();
          this.playCustomLevel(levels[i]);
          return;
        }
        // Check for edit button (middle)
        if (x >= cardX + 70 && x <= cardX + 120 && y >= cardY + cardHeight - 35 && y <= cardY + cardHeight - 10) {
          this.audio.playSelect();
          this.openEditor(levels[i]);
          return;
        }
        // Check for delete button (right side)
        if (x >= cardX + 130 && x <= cardX + 180 && y >= cardY + cardHeight - 35 && y <= cardY + cardHeight - 10) {
          this.audio.playSelect();
          this.customLevelManager.deleteLevel(levels[i].id);
          return;
        }
      }
    }
  }

  private playCustomLevel(customLevel: CustomLevel): void {
    // Convert custom level to playable format
    const config = this.customLevelManager.toLevelConfig(customLevel);

    // Create a Level instance from the config
    this.level = new Level(config);
    this.player = new Player(config.playerStart);
    this.player.setSkin(this.save.getSelectedSkin());
    this.cameraX = 0;
    this.attempts = 0;
    this.levelScoreThisRun = 0;
    this.isPracticeMode = false;
    this.isEndlessMode = false;

    this.audio.start();
    this.state.gameStatus = 'playing';
  }

  private renderCustomLevels(): void {
    this.renderOverlay();

    this.ctx.save();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ff88';
    this.ctx.shadowColor = '#00ff88';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('MY LEVELS', GAME_WIDTH / 2, 60);

    // Back button
    this.ctx.textAlign = 'left';
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('< Back (ESC)', 20, 45);

    // Level count
    const levels = this.customLevelManager.getAllLevels();
    this.ctx.textAlign = 'center';
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.fillText(`${levels.length} custom level${levels.length !== 1 ? 's' : ''}`, GAME_WIDTH / 2, 90);

    // Level cards
    if (levels.length === 0) {
      this.ctx.font = '18px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillText('No custom levels yet!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
      this.ctx.fillText('Click "Create New" to make one.', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
    } else {
      const cardWidth = 200;
      const cardHeight = 120;
      const cardsPerRow = 3;
      const startX = (GAME_WIDTH - (cardWidth * cardsPerRow + 20 * (cardsPerRow - 1))) / 2;
      const startY = 120;

      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const row = Math.floor(i / cardsPerRow);
        const col = i % cardsPerRow;
        const cardX = startX + col * (cardWidth + 20);
        const cardY = startY + row * (cardHeight + 15) - this.customLevelScrollOffset;

        if (cardY < 80 || cardY > GAME_HEIGHT - 120) continue;

        // Card background
        this.ctx.fillStyle = 'rgba(40, 40, 60, 0.9)';
        this.ctx.beginPath();
        this.ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 10);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Level name
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(level.name.slice(0, 18), cardX + 10, cardY + 25);

        // Level info
        this.ctx.font = '11px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.fillText(`BPM: ${level.bpm}`, cardX + 10, cardY + 45);
        this.ctx.fillText(`Platforms: ${level.platforms.length}`, cardX + 10, cardY + 60);
        this.ctx.fillText(`Coins: ${level.coins.length}`, cardX + 100, cardY + 60);

        // Buttons
        this.ctx.textAlign = 'center';

        // Play button
        this.ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(cardX + 10, cardY + cardHeight - 35, 50, 25, 5);
        this.ctx.fill();
        this.ctx.font = 'bold 11px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillText('PLAY', cardX + 35, cardY + cardHeight - 18);

        // Edit button
        this.ctx.fillStyle = 'rgba(100, 100, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(cardX + 70, cardY + cardHeight - 35, 50, 25, 5);
        this.ctx.fill();
        this.ctx.fillStyle = '#8888ff';
        this.ctx.fillText('EDIT', cardX + 95, cardY + cardHeight - 18);

        // Delete button
        this.ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(cardX + 130, cardY + cardHeight - 35, 50, 25, 5);
        this.ctx.fill();
        this.ctx.fillStyle = '#ff5555';
        this.ctx.fillText('DEL', cardX + 155, cardY + cardHeight - 18);
      }
    }

    // Create New button
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.roundRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT - 80, 200, 40, 10);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ff00ff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('+ CREATE NEW LEVEL', GAME_WIDTH / 2, GAME_HEIGHT - 54);

    this.ctx.restore();
  }

  private renderEditor(): void {
    if (this.editor) {
      this.editor.render(this.ctx);

      // Add save/test/exit buttons overlay
      this.ctx.save();
      this.ctx.textAlign = 'center';

      const buttonY = 15;
      const rightX = this.canvas.width - 20;

      // Save button
      this.ctx.fillStyle = 'rgba(0, 200, 100, 0.8)';
      this.ctx.beginPath();
      this.ctx.roundRect(rightX - 230, buttonY, 70, 30, 5);
      this.ctx.fill();
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.fillStyle = 'white';
      this.ctx.fillText('SAVE', rightX - 195, buttonY + 20);

      // Test button
      this.ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
      this.ctx.beginPath();
      this.ctx.roundRect(rightX - 150, buttonY, 70, 30, 5);
      this.ctx.fill();
      this.ctx.fillStyle = 'white';
      this.ctx.fillText('TEST', rightX - 115, buttonY + 20);

      // Exit button
      this.ctx.fillStyle = 'rgba(200, 50, 50, 0.8)';
      this.ctx.beginPath();
      this.ctx.roundRect(rightX - 70, buttonY, 70, 30, 5);
      this.ctx.fill();
      this.ctx.fillStyle = 'white';
      this.ctx.fillText('EXIT', rightX - 35, buttonY + 20);

      this.ctx.restore();
    }
  }

  private updateEditor(deltaTime: number): void {
    if (this.editor) {
      this.editor.updateEditor(deltaTime);

      // Check for auto-save (only when not dragging to prevent partial saves)
      if (this.editor.needsAutoSave() && this.editingLevel && !this.editor.isDraggingElement()) {
        const updatedLevel = this.editor.getLevel();
        if (this.customLevelManager.saveLevel(updatedLevel)) {
          this.editor.markAsSaved();
        }
      }
    }
  }

  private handleEditorKeyDown(e: KeyboardEvent): void {
    if (!this.editor) return;

    // Handle save/test/exit shortcuts
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      this.saveCurrentLevel();
      return;
    }

    if (e.key === 'Escape') {
      this.closeEditor();
      return;
    }

    if (e.key === 'F5' || (e.ctrlKey && e.key === 'Enter')) {
      e.preventDefault();
      this.testLevel();
      return;
    }

    // Arrow keys for camera pan
    if (e.key === 'ArrowRight') {
      this.editor.moveCamera(50);
    } else if (e.key === 'ArrowLeft') {
      this.editor.moveCamera(-50);
    }

    this.editor.handleKeyDown(e.key);
  }

  private testLevel(): void {
    if (!this.editor) return;

    // Save first
    this.saveCurrentLevel();

    // Store editor state
    const level = this.editor.getLevel();

    // Play the level in test mode
    const config = this.customLevelManager.toLevelConfig(level);
    this.level = new Level(config);
    this.player = new Player(config.playerStart);
    this.player.setSkin(this.save.getSelectedSkin());
    this.cameraX = 0;
    this.attempts = 0;
    this.levelScoreThisRun = 0;
    this.isPracticeMode = true; // Use practice mode for testing

    // Restore canvas size for gameplay with high-DPI support
    this.canvas.width = GAME_WIDTH * this.dpr;
    this.canvas.height = GAME_HEIGHT * this.dpr;
    this.canvas.style.width = `${GAME_WIDTH}px`;
    this.canvas.style.height = `${GAME_HEIGHT}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.setupCrispRendering();

    this.audio.start();
    this.state.gameStatus = 'editorTest';
  }

  private returnToEditor(): void {
    if (this.editingLevel) {
      const editorWidth = GAME_WIDTH + 200;
      const editorHeight = GAME_HEIGHT + 60;
      this.canvas.width = editorWidth * this.dpr;
      this.canvas.height = editorHeight * this.dpr;
      this.canvas.style.width = `${editorWidth}px`;
      this.canvas.style.height = `${editorHeight}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.setupCrispRendering();
      this.editor = new LevelEditor(this.editingLevel);
      this.editor.setOnSave(() => this.saveCurrentLevel());
      this.editor.setOnPlay(() => this.testLevel());
      this.state.gameStatus = 'editor';
      this.audio.stop();

      // Initialize touch handling and layout for the editor
      this.editor.initTouch(this.canvas);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.state.gameStatus !== 'editor' || !this.editor) return;

    const rect = this.canvas.getBoundingClientRect();
    // Use editor dimensions for logical coordinates (editor canvas is larger than game)
    const editorWidth = GAME_WIDTH + 200;
    const editorHeight = GAME_HEIGHT + 60;
    const x = (e.clientX - rect.left) * (editorWidth / rect.width);
    const y = (e.clientY - rect.top) * (editorHeight / rect.height);

    this.editor.handleMouseMove(x, y);
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (this.state.gameStatus !== 'editor' || !this.editor) return;

    this.editor.handleMouseUp();
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.state.gameStatus !== 'editor' || !this.editor) return;

    const rect = this.canvas.getBoundingClientRect();
    // Use editor dimensions for logical coordinates (editor canvas is larger than game)
    const editorWidth = GAME_WIDTH + 200;
    const editorHeight = GAME_HEIGHT + 60;
    const x = (e.clientX - rect.left) * (editorWidth / rect.width);
    const y = (e.clientY - rect.top) * (editorHeight / rect.height);

    // Check toolbar area
    if (y < this.editor.getToolbarHeight()) {
      this.editor.handleToolbarClick(x, y);

      // Check for save/test/exit buttons (positioned relative to editor width)
      const rightX = editorWidth - 20;
      if (y >= 15 && y <= 45) {
        if (x >= rightX - 230 && x <= rightX - 160) {
          this.saveCurrentLevel();
        } else if (x >= rightX - 150 && x <= rightX - 80) {
          this.testLevel();
        } else if (x >= rightX - 70 && x <= rightX) {
          this.closeEditor();
        }
      }
      return;
    }

    // Check sidebar area
    if (x < this.editor.getSidebarWidth()) {
      this.editor.handleSidebarClick(x, y);
      return;
    }

    // Editor canvas area
    this.editor.handleMouseDown(x, y);
  }

  private renderEditorTestUI(): void {
    this.ctx.save();

    // Test mode indicator
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('TEST MODE - Press ESC to return to editor', GAME_WIDTH / 2, GAME_HEIGHT - 20);

    this.ctx.restore();
  }

  private renderTutorial(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.ctx.save();
    this.ctx.textAlign = 'center';

    // Title
    this.ctx.font = 'bold 42px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('HOW TO PLAY', GAME_WIDTH / 2, 80);

    // Controls box
    const boxWidth = 400;
    const boxHeight = 280;
    const boxX = (GAME_WIDTH - boxWidth) / 2;
    const boxY = 110;

    this.ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    this.ctx.fill();
    this.ctx.stroke();

    // Controls content
    this.ctx.shadowBlur = 0;
    const controls = [
      { icon: '⬆️', key: 'SPACE / W / TAP', action: 'Jump (tap again in air for double jump!)' },
      { icon: '⚡', key: 'SHIFT / 2-FINGER', action: 'Dash forward quickly' },
      { icon: '🎵', key: 'M', action: 'Mute/Unmute music' },
      { icon: '⏸️', key: 'ESC', action: 'Pause game' },
    ];

    let y = boxY + 45;
    for (const control of controls) {
      // Icon
      this.ctx.font = '24px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(control.icon, boxX + 35, y);

      // Key
      this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(control.key, boxX + 70, y - 5);

      // Action
      this.ctx.font = '13px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText(control.action, boxX + 70, y + 15);

      this.ctx.textAlign = 'center';
      y += 55;
    }

    // Tips
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.fillText('TIPS', GAME_WIDTH / 2, boxY + boxHeight + 40);

    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillText('Time your jumps to the beat for better rhythm!', GAME_WIDTH / 2, boxY + boxHeight + 65);
    this.ctx.fillText('Collect coins for bonus points!', GAME_WIDTH / 2, boxY + boxHeight + 85);

    // Continue prompt
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffaa';
    this.ctx.shadowColor = '#00ffaa';
    this.ctx.shadowBlur = 10;
    const pulse = Math.sin(this.menuAnimation * 4) * 0.3 + 0.7;
    this.ctx.globalAlpha = pulse;
    this.ctx.fillText('TAP or PRESS ANY KEY to start!', GAME_WIDTH / 2, GAME_HEIGHT - 40);
    this.ctx.globalAlpha = 1;

    this.ctx.restore();
  }

  private dismissTutorial(): void {
    if (this.showingTutorial) {
      this.showingTutorial = false;
      this.save.markTutorialShown();
      this.audio.start();
    }
  }

  // Achievement system methods
  private tryUnlockAchievement(achievementId: string): void {
    const achievement = this.save.unlockAchievement(achievementId);
    if (achievement) {
      this.achievementQueue.push(achievement);
    }
  }

  private updateAchievementNotifications(deltaTime: number): void {
    // If no current notification but queue has items, show next
    if (!this.currentAchievementNotification && this.achievementQueue.length > 0) {
      this.currentAchievementNotification = this.achievementQueue.shift()!;
      this.achievementNotificationTimer = 0;
    }

    // Update current notification timer
    if (this.currentAchievementNotification) {
      this.achievementNotificationTimer += deltaTime;
      if (this.achievementNotificationTimer >= this.achievementNotificationDuration) {
        this.currentAchievementNotification = null;
        this.achievementNotificationTimer = 0;
      }
    }
  }

  private renderAchievementNotification(): void {
    if (!this.currentAchievementNotification) return;

    const achievement = this.currentAchievementNotification;
    const progress = this.achievementNotificationTimer / this.achievementNotificationDuration;

    // Slide in from top, stay, then slide out
    let yOffset = 0;
    const slideInDuration = 0.15;
    const slideOutStart = 0.85;

    if (progress < slideInDuration) {
      // Slide in
      yOffset = -80 * (1 - progress / slideInDuration);
    } else if (progress > slideOutStart) {
      // Slide out
      yOffset = -80 * ((progress - slideOutStart) / (1 - slideOutStart));
    }

    const y = 20 + yOffset;
    const width = 280;
    const height = 60;
    const x = (GAME_WIDTH - width) / 2;

    this.ctx.save();

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.strokeStyle = '#ff6600';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#ff6600';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 10);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Icon
    this.ctx.font = '28px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(achievement.icon, x + 15, y + 40);

    // Text
    this.ctx.font = 'bold 11px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff6600';
    this.ctx.fillText('ACHIEVEMENT UNLOCKED!', x + 55, y + 22);

    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(achievement.name, x + 55, y + 42);

    this.ctx.font = '11px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const desc = achievement.description.length > 35 ? achievement.description.substring(0, 32) + '...' : achievement.description;
    this.ctx.fillText(desc, x + 55, y + 56);

    this.ctx.restore();
  }

  private checkAchievements(): void {
    // Check all-levels achievement
    if (this.save.getTotalLevelsCompleted() >= TOTAL_LEVELS) {
      this.tryUnlockAchievement('all_levels');
    }

    // Check all-skins achievement
    let allSkinsUnlocked = true;
    for (const skin of PLAYER_SKINS) {
      if (!this.save.isSkinUnlocked(skin.id)) {
        allSkinsUnlocked = false;
        break;
      }
    }
    if (allSkinsUnlocked) {
      this.tryUnlockAchievement('all_skins');
    }

    // Check death count achievements
    const deaths = this.save.getTotalDeaths();
    if (deaths >= 100) {
      this.tryUnlockAchievement('survivor');
    }

    // Check play time achievement (1 hour = 3600000ms)
    if (this.save.getTotalPlayTime() >= 3600000) {
      this.tryUnlockAchievement('dedicated');
    }
  }
}
