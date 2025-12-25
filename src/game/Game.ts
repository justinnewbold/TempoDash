import { GameState, CustomLevel, Achievement, GameSettings } from '../types';
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
import { ParticleEffects } from '../systems/ParticleEffects';
import { ScreenTransition } from '../systems/ScreenTransition';
import { DebugOverlay } from '../systems/DebugOverlay';
import { StatisticsManager } from '../systems/Statistics';
import { PowerUpManager } from '../systems/PowerUps';
import { ModifierManager, MODIFIERS, ModifierId } from '../systems/Modifiers';
import { ChallengeManager, Challenge, CHALLENGE_TYPES } from '../systems/Challenges';
import { ChaseModeManager } from '../systems/ChaseMode';
import { LevelSharingManager } from '../systems/LevelSharing';
import { GhostManager } from '../systems/GhostManager';

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

  // Power-up flash effect
  private powerUpFlashOpacity = 0;
  private powerUpFlashColor = '#00ffaa';

  // Combo system - expanded
  private comboCount = 0;
  private comboTimer = 0;
  private comboDuration = 2000; // 2 seconds to maintain combo (extended)
  private comboDisplayTimer = 0; // For animation
  private comboMultiplier = 1; // Score multiplier based on combo
  private nearMissTimer = 0; // For near-miss detection
  private nearMissCount = 0; // Near misses add to combo
  private comboMeterPulse = 0; // Visual pulse for combo meter

  // Practice mode
  private isPracticeMode = false;
  private checkpointX = 0;
  private checkpointY = 0;
  private lastCheckpointProgress = 0;
  private checkpointFeedbackTimer = 0; // Visual feedback for checkpoint

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
  private tutorialPage = 0;
  private static readonly TUTORIAL_PAGES = 4;

  // Achievement notifications
  private achievementQueue: Achievement[] = [];
  private currentAchievementNotification: Achievement | null = null;
  private achievementNotificationTimer = 0;
  private achievementNotificationDuration = 3000; // 3 seconds

  // Play time tracking
  private lastPlayTimeUpdate = 0;

  // High-DPI support
  private dpr = 1;

  // Speed increase system - each jump increases speed by 1%
  private speedMultiplier = 1.0;
  private jumpCount = 0;
  private static readonly SPEED_INCREASE_PER_JUMP = 0.01; // 1%

  // Orientation and screen sizing
  private isPortrait = false;
  private orientationMessageTimer = 0;
  private showOrientationHint = false;

  // New systems
  private particles: ParticleEffects;
  private transition: ScreenTransition;
  private debug: DebugOverlay;
  private statistics: StatisticsManager;
  private powerUps: PowerUpManager;
  private modifiers: ModifierManager;
  private challengeManager: ChallengeManager;

  // Modifier UI state
  private showModifierPanel = false;

  // Section Practice mode
  private showSectionPractice = false;
  private selectedSection = 0;

  // Challenge mode state
  private currentChallenge: Challenge | null = null;
  private challengeScore = 0;

  // Chase mode (wall of death)
  private chaseMode: ChaseModeManager;

  // Ghost racing
  private ghostManager: GhostManager;
  private showGhost = true;

  // Level timing and stats
  private levelStartTime = 0;
  private levelElapsedTime = 0;
  private levelDeathCount = 0;

  // Beat visualization
  private beatTimer = 0;
  private currentBPM = 128;

  // Quick restart key tracking
  private quickRestartHeld = false;
  private quickRestartTimer = 0;
  private static readonly QUICK_RESTART_HOLD_TIME = 300; // Hold R for 300ms to restart

  // Statistics dashboard visibility
  private showStatsDashboard = false;

  // Level sharing state
  private shareNotification: { message: string; isError: boolean; timer: number } | null = null;
  private pendingImportLevel: import('../types').CustomLevel | null = null;

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

    // Initialize new systems
    this.particles = new ParticleEffects();
    this.transition = new ScreenTransition();
    this.debug = new DebugOverlay();
    this.statistics = new StatisticsManager();
    this.powerUps = new PowerUpManager();
    this.modifiers = new ModifierManager();
    this.challengeManager = new ChallengeManager();
    this.chaseMode = new ChaseModeManager();
    this.ghostManager = new GhostManager();

    // Setup tab visibility change detection for auto-pause
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleTabHidden();
      } else {
        this.handleTabVisible();
      }
    });

    // Apply saved settings
    const settings = this.save.getSettings();
    this.audio.setMusicVolume(settings.musicVolume);
    this.audio.setSfxVolume(settings.sfxVolume);
    this.showGhost = this.save.isShowGhostEnabled();

    this.loadLevel(1);

    // Setup keyboard
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

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

    // Check URL for shared level
    this.checkUrlForSharedLevel();
  }

  private checkUrlForSharedLevel(): void {
    const result = LevelSharingManager.checkUrlForLevel();
    if (result && result.success && result.level) {
      // Store the level for import prompt
      this.pendingImportLevel = result.level;
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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

    // Spawn power-ups from level config
    this.powerUps.clear();
    for (const config of this.level.powerUpConfigs) {
      this.powerUps.spawn(config.type, config.x, config.y);
    }

    // Configure chase mode based on level config
    this.chaseMode.reset();
    const chaseConfig = this.level.getConfig().chaseMode;
    if (chaseConfig?.enabled) {
      this.chaseMode = new ChaseModeManager({
        enabled: true,
        initialDelay: chaseConfig.initialDelay ?? 2000,
        baseSpeed: chaseConfig.baseSpeed ?? 0.85,
        accelerationRate: chaseConfig.accelerationRate ?? 0.0001,
      });
    } else {
      this.chaseMode.setEnabled(false);
    }
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
      case 'challenges':
        this.handleChallengesClick(x, y);
        break;
      case 'paused':
        this.handlePausedClick(x, y);
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

    // Handle mobile control buttons during gameplay
    if ((this.state.gameStatus === 'playing' || this.state.gameStatus === 'practice' || this.state.gameStatus === 'paused') && this.input.isMobileDevice()) {
      if (this.handleMobileControlClick(x, y)) {
        return;
      }
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
      case 'challenges':
        this.handleChallengesClick(x, y);
        break;
      case 'paused':
        this.handlePausedClick(x, y);
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
    // Endless button (left side, y=315)
    if (x >= centerX - 55 - smallButtonWidth / 2 && x <= centerX - 55 + smallButtonWidth / 2 &&
        y >= 295 && y <= 335) {
      this.audio.playSelect();
      this.startEndlessMode();
    }
    // Daily Challenges button (right side, y=315)
    if (x >= centerX + 55 - smallButtonWidth / 2 && x <= centerX + 55 + smallButtonWidth / 2 &&
        y >= 295 && y <= 335) {
      this.audio.playSelect();
      this.state.gameStatus = 'challenges';
    }
    // Editor button (left side, y=370)
    if (x >= centerX - 55 - smallButtonWidth / 2 && x <= centerX - 55 + smallButtonWidth / 2 &&
        y >= 350 && y <= 390) {
      this.audio.playSelect();
      this.openEditor();
    }
    // Custom Levels button (right side, y=370)
    if (x >= centerX + 55 - smallButtonWidth / 2 && x <= centerX + 55 + smallButtonWidth / 2 &&
        y >= 350 && y <= 390) {
      this.audio.playSelect();
      this.state.gameStatus = 'customLevels';
    }
    // Skins button (left side, y=425)
    if (x >= centerX - 55 - smallButtonWidth / 2 && x <= centerX - 55 + smallButtonWidth / 2 &&
        y >= 405 && y <= 445) {
      this.audio.playSelect();
      this.state.gameStatus = 'skins';
    }
    // Achievements button (right side, y=425)
    if (x >= centerX + 55 - smallButtonWidth / 2 && x <= centerX + 55 + smallButtonWidth / 2 &&
        y >= 405 && y <= 445) {
      this.audio.playSelect();
      this.state.gameStatus = 'achievements';
    }
    // Settings button (y=480)
    if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
        y >= 455 && y <= 505) {
      this.audio.playSelect();
      this.state.gameStatus = 'settings';
    }
  }

  private handleLevelSelectClick(x: number, y: number, shiftKey = false): void {
    // Handle section practice panel clicks first if panel is open
    if (this.showSectionPractice) {
      const panelX = 100;
      const panelY = 120;
      const panelW = GAME_WIDTH - 200;
      const panelH = 260;

      if (x >= panelX && x <= panelX + panelW && y >= panelY && y <= panelY + panelH) {
        const levelId = this.selectedLevelIndex + 1;
        const checkpoints = this.getCheckpointsForLevel(levelId);

        const btnW = 150;
        const btnH = 45;
        const btnGap = 15;
        const startY = panelY + 55;

        // Check "Start" button (from beginning)
        const startBtnX = GAME_WIDTH / 2 - btnW / 2;
        if (x >= startBtnX && x <= startBtnX + btnW && y >= startY && y <= startY + btnH) {
          this.selectedSection = 0;
          this.audio.playSelect();
          return;
        }

        // Check checkpoint buttons
        const checkpointsPerRow = 3;
        const totalWidth = checkpointsPerRow * btnW + (checkpointsPerRow - 1) * btnGap;
        const rowStartX = (GAME_WIDTH - totalWidth) / 2;

        for (let i = 0; i < checkpoints.length; i++) {
          const row = Math.floor(i / checkpointsPerRow);
          const col = i % checkpointsPerRow;
          const btnX = rowStartX + col * (btnW + btnGap);
          const btnY = startY + btnH + 15 + row * (btnH + 10);

          if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
            this.selectedSection = i + 1;
            this.audio.playSelect();
            return;
          }
        }

        // Check "Start Practice" button
        const playBtnX = GAME_WIDTH / 2 - 70;
        const playBtnY = panelY + panelH - 55;
        const playBtnW = 140;
        const playBtnH = 36;

        if (x >= playBtnX && x <= playBtnX + playBtnW && y >= playBtnY && y <= playBtnY + playBtnH) {
          // Start the level at the selected section
          this.showSectionPractice = false;
          this.startLevelAtSection(levelId, this.selectedSection);
          this.audio.playSelect();
          return;
        }

        return; // Click inside panel but not on a button
      } else {
        // Click outside panel - close it
        this.showSectionPractice = false;
        this.selectedSection = 0;
        return;
      }
    }

    // Handle modifier panel clicks first if panel is open
    if (this.showModifierPanel) {
      const panelX = 80;
      const panelY = 100;
      const panelW = GAME_WIDTH - 160;
      const panelH = 300;

      // Check if click is inside the panel
      if (x >= panelX && x <= panelX + panelW && y >= panelY && y <= panelY + panelH) {
        // Check modifier button clicks
        const modIds: ModifierId[] = ['speedDemon', 'noDoubleJump', 'fragile', 'mirrorMode', 'timeAttack', 'invisible'];
        const btnW = 180;
        const btnH = 50;
        const btnGapX = 20;
        const btnGapY = 12;
        const startX = GAME_WIDTH / 2 - btnW - btnGapX / 2;
        const startY = panelY + 75;

        for (let i = 0; i < modIds.length; i++) {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const btnX = startX + col * (btnW + btnGapX);
          const btnY = startY + row * (btnH + btnGapY);

          if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
            this.modifiers.toggleModifier(modIds[i]);
            this.audio.playSelect();
            return;
          }
        }
        return; // Click inside panel but not on a button
      } else {
        // Click outside panel - close it
        this.showModifierPanel = false;
        return;
      }
    }

    // Back button
    if (x >= 20 && x <= 120 && y >= 20 && y <= 60) {
      this.audio.playSelect();
      this.state.gameStatus = 'mainMenu';
      return;
    }

    // Modifiers button
    const modBtnX = GAME_WIDTH / 2 - 80;
    const modBtnY = 418;
    const modBtnW = 160;
    const modBtnH = 32;
    if (x >= modBtnX && x <= modBtnX + modBtnW && y >= modBtnY && y <= modBtnY + modBtnH) {
      this.showModifierPanel = !this.showModifierPanel;
      this.showSectionPractice = false; // Close section practice if open
      this.audio.playSelect();
      return;
    }

    // Section Practice button (only for unlocked levels)
    const levelId = this.selectedLevelIndex + 1;
    if (this.save.isLevelUnlocked(levelId)) {
      const secBtnX = GAME_WIDTH / 2 - 80;
      const secBtnY = modBtnY + 45;
      const secBtnW = 160;
      const secBtnH = 28;
      if (x >= secBtnX && x <= secBtnX + secBtnW && y >= secBtnY && y <= secBtnY + secBtnH) {
        this.showSectionPractice = !this.showSectionPractice;
        this.showModifierPanel = false; // Close modifiers if open
        this.selectedSection = 0; // Reset section selection
        this.audio.playSelect();
        return;
      }
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

    const leftColX = GAME_WIDTH / 4;
    const rightColX = (GAME_WIDTH * 3) / 4;
    const sliderWidth = 180;
    const toggleWidth = 60;

    // Music volume slider (left column)
    const musicSliderX = leftColX - sliderWidth / 2 - 15;
    if (x >= musicSliderX && x <= musicSliderX + sliderWidth && y >= 145 && y <= 175) {
      const volume = Math.max(0, Math.min(1, (x - musicSliderX) / sliderWidth));
      this.audio.setMusicVolume(volume);
      this.save.updateSettings({ musicVolume: volume });
    }

    // SFX volume slider (left column)
    if (x >= musicSliderX && x <= musicSliderX + sliderWidth && y >= 210 && y <= 240) {
      const volume = Math.max(0, Math.min(1, (x - musicSliderX) / sliderWidth));
      this.audio.setSfxVolume(volume);
      this.save.updateSettings({ sfxVolume: volume });
      this.audio.playSelect();
    }

    // Screen shake toggle (right column)
    const rightToggleX = rightColX - toggleWidth / 2;
    if (x >= rightToggleX && x <= rightToggleX + toggleWidth && y >= 150 && y <= 185) {
      const currentShake = this.save.getSettings().screenShake;
      this.save.updateSettings({ screenShake: !currentShake });
      this.audio.playSelect();
    }

    // Reduced motion toggle (right column)
    if (x >= rightToggleX && x <= rightToggleX + toggleWidth && y >= 225 && y <= 260) {
      this.save.setReducedMotion(!this.save.isReducedMotionEnabled());
      this.audio.playSelect();
    }

    // Colorblind mode buttons (left column)
    const modes: Array<{ id: GameSettings['colorblindMode']; label: string }> = [
      { id: 'normal', label: 'Normal' },
      { id: 'deuteranopia', label: 'Deutan' },
      { id: 'protanopia', label: 'Protan' },
      { id: 'tritanopia', label: 'Tritan' },
    ];
    const cbBtnWidth = 50;
    const cbGap = 8;
    const cbTotalWidth = modes.length * cbBtnWidth + (modes.length - 1) * cbGap;
    const cbStartX = leftColX - cbTotalWidth / 2;
    if (y >= 365 && y <= 390) {
      for (let i = 0; i < modes.length; i++) {
        const btnX = cbStartX + i * (cbBtnWidth + cbGap);
        if (x >= btnX && x <= btnX + cbBtnWidth) {
          this.save.setColorblindMode(modes[i].id);
          this.audio.playSelect();
          return;
        }
      }
    }

    // Reduce flash toggle (left column)
    const leftToggleX = leftColX - toggleWidth / 2;
    if (x >= leftToggleX && x <= leftToggleX + toggleWidth && y >= 425 && y <= 460) {
      this.save.setReduceFlash(!this.save.isReduceFlashEnabled());
      this.audio.playSelect();
    }

    // High contrast toggle (left column)
    if (x >= leftToggleX && x <= leftToggleX + toggleWidth && y >= 495 && y <= 530) {
      this.save.setHighContrast(!this.save.isHighContrastEnabled());
      this.audio.playSelect();
    }

    // Show ghost toggle (right column)
    if (x >= rightToggleX && x <= rightToggleX + toggleWidth && y >= 350 && y <= 385) {
      this.save.setShowGhost(!this.save.isShowGhostEnabled());
      this.showGhost = this.save.isShowGhostEnabled();
      this.audio.playSelect();
    }

    // Haptic feedback toggle (right column)
    if (x >= rightToggleX && x <= rightToggleX + toggleWidth && y >= 420 && y <= 455) {
      this.save.setHapticFeedback(!this.save.isHapticFeedbackEnabled());
      this.audio.playSelect();
    }

    // Export data button (right column)
    if (x >= rightColX - 100 && x <= rightColX && y >= 485 && y <= 515) {
      // Export save data to clipboard
      const exportedData = this.save.exportData();
      navigator.clipboard.writeText(exportedData).then(() => {
        this.audio.playSelect();
      }).catch(() => {
        // Fallback: create download
        const blob = new Blob([exportedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tempodash-save.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Import data button (right column)
    if (x >= rightColX && x <= rightColX + 100 && y >= 485 && y <= 515) {
      // Import save data from clipboard
      navigator.clipboard.readText().then((text) => {
        const result = this.save.importData(text);
        if (result.success) {
          this.audio.playUnlock();
        } else {
          console.error('Import failed:', result.error);
        }
      }).catch(() => {
        console.error('Failed to read clipboard');
      });
    }

    // Reset all button (right column)
    if (x >= rightColX - 45 && x <= rightColX + 45 && y >= 530 && y <= 560) {
      // Confirm before resetting
      if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        this.save.resetAllData();
        this.audio.playSelect();
      }
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
    // Tutorial navigation
    if (this.showingTutorial) {
      if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter') {
        this.dismissTutorial(); // Goes to next page or closes
      } else if (e.code === 'ArrowLeft') {
        this.previousTutorialPage();
      } else if (e.code === 'KeyS' || e.code === 'Escape') {
        this.skipTutorial();
      }
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

      case 'challenges':
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
      case 'challengePlaying':
        if (e.code === 'Escape') {
          this.state.gameStatus = 'paused';
          this.audio.stop();
        } else if (e.code === 'KeyR') {
          // Quick restart (hold R key)
          this.quickRestartHeld = true;
          this.quickRestartTimer = 0;
        } else if (e.code === 'Tab') {
          // Toggle statistics dashboard
          e.preventDefault();
          this.showStatsDashboard = !this.showStatsDashboard;
        }
        break;

      case 'paused':
        if (e.code === 'Escape' || e.code === 'Enter') {
          // Resume to the correct mode
          if (this.currentChallenge) {
            this.state.gameStatus = 'challengePlaying';
          } else if (this.isEndlessMode) {
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
          this.currentChallenge = null;
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

  private handleKeyUp(e: KeyboardEvent): void {
    // Handle quick restart key release
    if (e.code === 'KeyR') {
      this.quickRestartHeld = false;
      this.quickRestartTimer = 0;
    }
  }

  // Auto-pause when tab becomes hidden
  private handleTabHidden(): void {
    const isPlaying = this.state.gameStatus === 'playing' ||
                      this.state.gameStatus === 'practice' ||
                      this.state.gameStatus === 'endless' ||
                      this.state.gameStatus === 'challengePlaying';

    if (isPlaying) {
      this.state.gameStatus = 'paused';
      this.audio.stop();
    }
  }

  // Resume when tab becomes visible
  private handleTabVisible(): void {
    // Don't auto-resume - let user press a key to continue
    // This prevents unexpected deaths when returning
  }

  // Quick restart the current level
  private quickRestart(): void {
    if (this.isEndlessMode) {
      // Restart endless mode
      this.endlessDistance = 0;
      this.endlessPlatforms = [];
      this.nextPlatformX = 0;
      this.cameraX = 0;
      this.loadLevel(1);
      this.player.setSkin(this.save.getSelectedSkin());
      this.generateEndlessPlatforms(1500);
      this.attempts = 1;
      this.speedMultiplier = 1.0;
      this.jumpCount = 0;
    } else {
      // Restart current level
      this.loadLevel(this.state.currentLevel);
      this.attempts = 1;
      this.levelScoreThisRun = 0;
      this.checkpointX = this.level.playerStart.x;
      this.checkpointY = this.level.playerStart.y;
      this.lastCheckpointProgress = 0;
    }
    // Clear particles and reset effects
    this.particles.clear();
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;
    this.nearMissTimer = 0;
    this.nearMissCount = 0;
    this.comboMeterPulse = 0;
    this.audio.start();
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

    // Reset modifier timers for new level
    this.modifiers.resetForLevel();

    // Initialize level timing and stats
    this.levelStartTime = performance.now();
    this.levelElapsedTime = 0;
    this.levelDeathCount = 0;

    // Initialize BPM for beat visualization
    const config = this.level.getConfig();
    this.currentBPM = config.bpm || 128;
    this.beatTimer = 0;

    // Start ghost recording
    this.ghostManager.startRecording();

    // Load ghost for playback if available
    const savedGhost = this.save.getGhostRun(levelId);
    if (savedGhost && this.showGhost) {
      this.ghostManager.startPlayback(savedGhost);
    }

    // Show tutorial on first play
    if (!this.save.hasTutorialBeenShown()) {
      this.showingTutorial = true;
    } else {
      this.audio.start();
    }
  }

  private startLevelAtSection(levelId: number, sectionIndex: number): void {
    // Start level in practice mode
    this.loadLevel(levelId);
    this.attempts = 1;
    this.levelScoreThisRun = 0;
    this.isPracticeMode = true; // Always practice mode for section practice
    this.state.gameStatus = 'practice';

    // Get checkpoint position for the selected section
    const checkpoints = this.getCheckpointsForLevel(levelId);
    if (sectionIndex > 0 && sectionIndex <= checkpoints.length) {
      const checkpoint = checkpoints[sectionIndex - 1];
      // Set player position to checkpoint
      this.player.x = checkpoint.x;
      this.player.y = checkpoint.y;
      this.player.velocityY = 0;
      this.checkpointX = checkpoint.x;
      this.checkpointY = checkpoint.y;
      this.cameraX = Math.max(0, checkpoint.x - GAME_WIDTH / 3);
      this.lastCheckpointProgress = (sectionIndex / (checkpoints.length + 1)) * 100;
    } else {
      // Start from beginning
      this.checkpointX = this.level.playerStart.x;
      this.checkpointY = this.level.playerStart.y;
      this.lastCheckpointProgress = 0;
    }

    // Reset modifier timers
    this.modifiers.resetForLevel();

    // Initialize BPM for beat visualization
    const config = this.level.getConfig();
    this.currentBPM = config.bpm || 128;
    this.beatTimer = 0;

    // Start audio
    this.audio.start();
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

  private restartLevel(): void {
    // Restart current level from beginning
    this.loadLevel(this.state.currentLevel);
    this.attempts = 1;
    this.levelScoreThisRun = 0;
    this.checkpointX = this.level.playerStart.x;
    this.checkpointY = this.level.playerStart.y;
    this.lastCheckpointProgress = 0;
    this.state.gameStatus = this.isPracticeMode ? 'practice' : 'playing';
    this.audio.start();
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
    this.comboMultiplier = 1;
    this.nearMissTimer = 0;
    this.comboMeterPulse = 0;

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
    // Update debug frame timing
    this.debug.beginUpdate();

    // Update new systems
    this.particles.update(deltaTime);
    this.transition.update(deltaTime);

    // Handle quick restart (hold R key)
    if (this.quickRestartHeld) {
      this.quickRestartTimer += deltaTime;
      if (this.quickRestartTimer >= Game.QUICK_RESTART_HOLD_TIME) {
        this.quickRestart();
        this.quickRestartHeld = false;
        this.quickRestartTimer = 0;
      }
    }

    // Update menu animation
    this.menuAnimation += deltaTime / 1000;

    // Update achievement notifications
    this.updateAchievementNotifications(deltaTime);

    // Track play time
    if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'practice' || this.state.gameStatus === 'endless' || this.state.gameStatus === 'challengePlaying') {
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

    // Decay power-up flash
    if (this.powerUpFlashOpacity > 0) {
      this.powerUpFlashOpacity = Math.max(0, this.powerUpFlashOpacity - deltaTime / 200);
    }

    // Decay orientation hint timer
    if (this.orientationMessageTimer > 0) {
      this.orientationMessageTimer -= deltaTime;
      if (this.orientationMessageTimer <= 0) {
        this.showOrientationHint = false;
      }
    }

    // Decay share notification timer
    if (this.shareNotification && this.shareNotification.timer > 0) {
      this.shareNotification.timer -= deltaTime;
      if (this.shareNotification.timer <= 0) {
        this.shareNotification = null;
      }
    }

    // Editor mode has its own update
    if (this.state.gameStatus === 'editor') {
      this.updateEditor(deltaTime);
      return;
    }

    if (this.state.gameStatus !== 'playing' && this.state.gameStatus !== 'practice' && this.state.gameStatus !== 'endless' && this.state.gameStatus !== 'challengePlaying' && this.state.gameStatus !== 'editorTest') {
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
    this.powerUps.update(deltaTime);

    // Check power-up collection
    const collectedPowerUp = this.powerUps.checkCollision(this.player.getBounds());
    if (collectedPowerUp) {
      this.audio.playCoinCollect(); // Reuse coin sound for now
      this.input.triggerHaptic('medium');
      // Spawn collection particles
      this.particles.spawnCoinCollect(
        collectedPowerUp.x + collectedPowerUp.width / 2,
        collectedPowerUp.y + collectedPowerUp.height / 2
      );

      // Trigger power-up flash with color based on type
      const powerUpColors: Record<string, string> = {
        speed: '#00ffff',
        shield: '#00aaff',
        magnet: '#ff00ff',
        doubleJump: '#ffff00'
      };
      this.powerUpFlashColor = powerUpColors[collectedPowerUp.type] || '#00ffaa';
      // Trigger power-up flash (reduced or disabled based on settings)
      if (!this.save.isReduceFlashEnabled()) {
        this.powerUpFlashOpacity = 0.25;
      }
    }

    const wasGroundedBefore = this.player.isGrounded;
    const wasAliveBefore = !this.player.isDead;
    const prevVelocityY = this.player.velocityY;
    const wasDashing = this.player.isDashing;

    // Update modifiers (for time attack countdown)
    this.modifiers.update(deltaTime);

    // Check for time attack expiration
    if (this.modifiers.isTimeExpired() && !this.player.isDead) {
      this.player.isDead = true; // Time's up!
    }

    // Apply slowmo effect from power-ups and speed demon modifier
    const effectiveSpeedMultiplier = this.speedMultiplier *
      this.powerUps.getSlowMoMultiplier() *
      this.modifiers.getSpeedMultiplier();

    // Check if air jumps are allowed (disabled by "Grounded" modifier)
    const allowAirJumps = !this.modifiers.isDoubleJumpDisabled();

    // In endless mode, use procedural platforms
    if (this.isEndlessMode) {
      this.player.update(deltaTime, inputState, this.endlessPlatforms, effectiveSpeedMultiplier, allowAirJumps);

      // Update distance
      this.endlessDistance = Math.max(this.endlessDistance, Math.floor(this.player.x / 10));

      // Generate more platforms ahead
      this.generateEndlessPlatforms(this.cameraX + 1500);

      // Clean up platforms behind camera
      this.endlessPlatforms = this.endlessPlatforms.filter((p) => p.x + p.width > this.cameraX - 200);
    } else {
      this.player.update(deltaTime, inputState, this.level.getActivePlatforms(), effectiveSpeedMultiplier, allowAirJumps);
    }

    // Trigger dash shake
    if (!wasDashing && this.player.isDashing) {
      this.triggerShake(4, 80); // Light shake on dash start
    }

    // Update player trail particles
    const playerColor = this.save.getSelectedSkin().glowColor;
    // Player auto-moves forward, so always "moving" when alive
    const isMoving = !this.player.isDead;
    this.particles.updateTrail(
      deltaTime,
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      playerColor,
      isMoving,
      this.player.isDashing
    );

    // Update chase mode (wall of death)
    if (!this.isEndlessMode) {
      const basePlayerSpeed = 350; // Base player speed in px/s
      this.chaseMode.update(deltaTime, this.player.x, basePlayerSpeed * effectiveSpeedMultiplier);

      // Check if wall caught the player
      if (this.chaseMode.checkCollision(this.player.x) && !this.player.isDead) {
        this.player.isDead = true;
        this.triggerShake(15, 400); // Strong shake for wall death
      }
    }

    // Update level timing
    if (!this.player.isDead) {
      this.levelElapsedTime = performance.now() - this.levelStartTime;
    }

    // Record ghost frame
    if (this.ghostManager.getIsRecording() && !this.player.isDead) {
      this.ghostManager.recordFrame(
        this.player.x,
        this.player.y,
        this.player.getRotation(),
        deltaTime
      );
    }

    // Update ghost playback
    this.ghostManager.update(deltaTime);

    // Beat visualization - pulse platforms on beat
    this.beatTimer += deltaTime;
    const beatInterval = 60000 / this.currentBPM; // ms per beat
    if (this.beatTimer >= beatInterval) {
      this.beatTimer -= beatInterval;
      // Trigger pulse on visible platforms
      for (const platform of this.level.getActivePlatforms()) {
        platform.triggerBeatPulse();
      }
    }

    // Check secret platform reveals
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    for (const platform of this.level.getActivePlatforms()) {
      if (platform.checkSecretReveal(playerCenterX, playerCenterY)) {
        // Secret platform revealed! Add feedback
        this.audio.playCoinCollect();
        this.particles.spawnCoinCollect(playerCenterX, playerCenterY);
      }
    }

    // Apply magnet effect to attract nearby coins
    const magnetRange = this.powerUps.getMagnetRange();
    if (magnetRange > 0) {
      const playerCenterX = this.player.x + this.player.width / 2;
      const playerCenterY = this.player.y + this.player.height / 2;

      for (const coin of this.level.coins) {
        if (coin.collected) continue;

        const dx = playerCenterX - coin.x;
        const dy = playerCenterY - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < magnetRange) {
          coin.attractToward(playerCenterX, playerCenterY, 400, deltaTime);
        }
      }
    }

    // Calculate combo multiplier based on combo count
    if (this.comboCount >= 25) {
      this.comboMultiplier = 4;
    } else if (this.comboCount >= 20) {
      this.comboMultiplier = 3;
    } else if (this.comboCount >= 15) {
      this.comboMultiplier = 2.5;
    } else if (this.comboCount >= 10) {
      this.comboMultiplier = 2;
    } else if (this.comboCount >= 5) {
      this.comboMultiplier = 1.5;
    } else {
      this.comboMultiplier = 1;
    }

    // Near-miss detection - check if player is close to spikes/lava without dying
    const nearMissDistance = 15; // pixels
    const playerBounds = this.player.getBounds();
    for (const platform of this.level.getActivePlatforms()) {
      if (platform.type === 'spike' || platform.type === 'lava') {
        const platBounds = platform.getBounds();
        const dx = Math.max(0, Math.max(platBounds.x - (playerBounds.x + playerBounds.width), playerBounds.x - (platBounds.x + platBounds.width)));
        const dy = Math.max(0, Math.max(platBounds.y - (playerBounds.y + playerBounds.height), playerBounds.y - (platBounds.y + platBounds.height)));
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < nearMissDistance && distance > 0 && this.nearMissTimer <= 0) {
          // Near miss! Add to combo
          this.nearMissCount++;
          this.comboCount += 1;
          this.comboTimer = this.comboDuration;
          this.comboDisplayTimer = 400;
          this.nearMissTimer = 500; // Cooldown to prevent spam
          this.comboMeterPulse = 1;

          // Spawn near-miss particle effect
          this.particles.spawnFloatingText(
            this.player.x + this.player.width / 2,
            this.player.y - 20,
            'CLOSE!',
            '#ff6600'
          );
        }
      }
    }

    // Decay near-miss cooldown
    if (this.nearMissTimer > 0) {
      this.nearMissTimer -= deltaTime;
    }

    // Check coin collection
    const coinsCollected = this.level.checkCoinCollection(this.player);
    if (coinsCollected > 0) {
      this.audio.playCoinCollect();
      this.input.triggerHaptic('light'); // Haptic feedback for coin collection

      // Apply double points multiplier from power-up AND combo multiplier
      const pointsMultiplier = this.powerUps.getPointsMultiplier();
      const effectiveCoins = Math.floor(coinsCollected * pointsMultiplier * this.comboMultiplier);

      // Update combo (with multiplied coins)
      this.comboCount += coinsCollected; // Raw coins for combo count
      this.comboTimer = this.comboDuration;
      this.comboDisplayTimer = 500; // Show combo text for 500ms
      this.comboMeterPulse = 1;

      // Show bonus points from multiplier
      if (this.comboMultiplier > 1) {
        this.particles.spawnFloatingText(
          this.player.x + this.player.width / 2,
          this.player.y - 40,
          `+${effectiveCoins}`,
          '#ffd700'
        );
      }

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
        this.comboMultiplier = 1;
      }
    }

    // Decay combo display and pulse
    if (this.comboDisplayTimer > 0) {
      this.comboDisplayTimer -= deltaTime;
    }
    if (this.comboMeterPulse > 0) {
      this.comboMeterPulse -= deltaTime / 200;
    }

    if (wasGroundedBefore && !this.player.isGrounded && !this.player.isDead) {
      this.audio.playJump();
      // Increase speed by 0.25% per jump (compound growth)
      this.jumpCount++;
      this.speedMultiplier *= (1 + Game.SPEED_INCREASE_PER_JUMP);

      // Spawn jump dust particles
      const jumpX = this.player.x + this.player.width / 2;
      const jumpY = this.player.y + this.player.height;
      this.particles.spawnJumpDust(jumpX, jumpY);
    }

    // Landing dust when player hits ground
    if (!wasGroundedBefore && this.player.isGrounded && !this.player.isDead) {
      const landX = this.player.x + this.player.width / 2;
      const landY = this.player.y + this.player.height;
      // Scale dust intensity based on fall velocity
      const velocityScale = Math.min(Math.abs(prevVelocityY) / 800, 2);
      if (velocityScale > 0.3) {
        this.particles.spawnLandingDust(landX, landY, velocityScale);
      }
    }

    // Detect bounce (sudden large upward velocity change)
    const bounceThreshold = -600;
    if (prevVelocityY >= 0 && this.player.velocityY < bounceThreshold) {
      this.triggerShake(6, 120); // Medium shake on bounce
    }

    if (wasAliveBefore && this.player.isDead) {
      // Check if shield can save the player (disabled by fragile modifier)
      if (!this.modifiers.isShieldDisabled() && this.powerUps.consumeShield()) {
        // Shield consumed! Revive the player
        this.player.revive();
        this.audio.playCoinCollect(); // Play a positive sound
        this.triggerShake(8, 200); // Medium shake for shield break
        this.input.triggerHaptic('heavy');

        // Visual feedback for shield break - use death explosion with shield color
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        this.particles.spawnDeathExplosion(playerCenterX, playerCenterY, '#00aaff');
      } else {
        // No shield - player dies
        this.audio.playDeath();
        this.triggerShake(12, 350); // Strong shake on death
        // Trigger death flash (reduced or disabled based on settings)
        if (!this.save.isReduceFlashEnabled()) {
          this.deathFlashOpacity = 0.6;
        }
        this.input.triggerHapticPattern([50, 30, 100]); // Death haptic pattern

        // Spawn death particle explosion
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        this.particles.spawnDeathExplosion(playerCenterX, playerCenterY, this.save.getSelectedSkin().glowColor);

        // Track death for statistics and achievements
        this.statistics.recordDeath(this.state.currentLevel, this.player.x, this.player.y);
        this.save.recordDeath();
        this.tryUnlockAchievement('first_death');

        // Increment level death count for star calculation
        this.levelDeathCount++;
      }
    }

    // Decay checkpoint feedback timer
    if (this.checkpointFeedbackTimer > 0) {
      this.checkpointFeedbackTimer -= deltaTime;
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
        // Audio and visual feedback for checkpoint
        this.audio.playCheckpoint();
        this.input.triggerHaptic('medium');
        this.checkpointFeedbackTimer = 500; // Show visual feedback for 500ms
      }
    }

    if (this.player.isDead) {
      this.deathTimer += deltaTime;
      if (this.deathTimer > 500) {
        this.deathTimer = 0;

        if (this.currentChallenge) {
          // Challenge mode death - record attempt and calculate score
          const score = Math.floor(this.endlessDistance + this.challengeScore);
          const completed = this.endlessDistance >= 500; // 500m = challenge complete
          this.challengeManager.recordAttempt(this.currentChallenge.id, score, completed);

          if (completed) {
            // Challenge completed! Return to challenge menu
            this.isEndlessMode = false;
            this.currentChallenge = null;
            this.state.gameStatus = 'challenges';
            this.audio.stop();
          } else {
            // Try again - respawn with seeded platforms
            this.restartChallenge();
          }
        } else if (this.isEndlessMode) {
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
        const rawScore = Math.max(baseScore - attemptPenalty, 100) + coinBonus;

        // Apply modifier score multiplier (higher score for harder modifiers)
        const modifierMultiplier = this.modifiers.getScoreMultiplier();
        this.levelScoreThisRun = Math.floor(rawScore * modifierMultiplier);

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

      // Calculate and save star rating
      const totalCoinsInLevel = this.level.getConfig().totalCoins || this.level.totalCoins;
      const stars = this.save.calculateStars(
        this.level.coinsCollected,
        totalCoinsInLevel,
        this.levelDeathCount
      );
      this.save.setLevelStars(this.state.currentLevel, stars);
      this.save.setLevelDeaths(this.state.currentLevel, this.levelDeathCount);

      // Save best time and ghost
      const completionTime = this.levelElapsedTime;
      const isNewBest = this.save.setBestTime(this.state.currentLevel, completionTime);
      if (isNewBest) {
        // Save ghost run for new best time
        const ghostFrames = this.ghostManager.stopRecording();
        this.save.saveGhostRun(this.state.currentLevel, ghostFrames, completionTime);
      } else {
        this.ghostManager.stopRecording();
      }

      this.state.gameStatus = 'levelComplete';
      this.audio.fadeOut(300); // Smooth fade out
      this.audio.playLevelComplete();
      this.input.triggerHapticPattern([30, 50, 30, 50, 100]); // Victory haptic pattern
    }

    // End debug update timing
    this.debug.endUpdate();
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
      this.particles.render(this.ctx, this.cameraX);
      this.renderEndlessUI();
    } else if (this.state.gameStatus === 'challengePlaying') {
      // Render challenge mode (similar to endless but with challenge UI)
      this.renderEndlessBackground();
      this.renderEndlessPlatforms();
      this.player.render(this.ctx, this.cameraX);
      this.particles.render(this.ctx, this.cameraX);
      this.renderChallengeUI();
    } else if (this.state.gameStatus === 'editorTest') {
      // Render test mode
      this.level.render(this.ctx, this.cameraX);
      this.player.render(this.ctx, this.cameraX);
      this.particles.render(this.ctx, this.cameraX);
      this.renderPlayingUI();
      this.renderEditorTestUI();
    } else {
      this.level.render(this.ctx, this.cameraX);

      if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'practice' || this.state.gameStatus === 'paused') {
        // Render power-ups before player so they appear behind
        this.powerUps.render(this.ctx, this.cameraX);

        // Render ghost before player so player appears on top
        if (this.showGhost) {
          this.ghostManager.render(this.ctx, this.cameraX);
        }

        this.player.render(this.ctx, this.cameraX);

        // Render shield effect around player if active
        const playerBounds = this.player.getBounds();
        this.powerUps.renderShieldEffect(
          this.ctx,
          playerBounds.x - this.cameraX,
          playerBounds.y,
          playerBounds.width,
          playerBounds.height
        );

        this.particles.render(this.ctx, this.cameraX);

        // Render chase mode wall of death
        this.chaseMode.render(this.ctx, this.cameraX, GAME_HEIGHT);
        this.chaseMode.renderWarning(this.ctx, this.player.x, this.cameraX, GAME_WIDTH);

        this.renderPlayingUI();

        // Render active power-up UI indicators
        this.powerUps.renderUI(this.ctx);
      }
    }

    // Death flash effect
    if (this.deathFlashOpacity > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 0, ${this.deathFlashOpacity})`;
      this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Power-up flash effect
    if (this.powerUpFlashOpacity > 0) {
      // Parse hex color to RGB
      const hex = this.powerUpFlashColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.powerUpFlashOpacity})`;
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
      case 'challenges':
        this.renderChallenges();
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

    // Quick restart progress indicator
    if (this.quickRestartHeld && this.quickRestartTimer > 0) {
      this.renderQuickRestartIndicator();
    }

    // Statistics dashboard overlay
    if (this.showStatsDashboard) {
      this.statistics.renderDashboard(this.ctx, this.save.getData());
    }

    // Debug overlay (F3 to toggle)
    this.debug.render(this.ctx, this.cameraX);

    // Screen transition effect (always on top)
    this.transition.render(this.ctx);

    // Portrait mode orientation hint (on top of everything)
    if (this.showOrientationHint && this.isPortrait) {
      this.renderOrientationHint();
    }
  }

  private renderQuickRestartIndicator(): void {
    const progress = this.quickRestartTimer / Game.QUICK_RESTART_HOLD_TIME;
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const radius = 40;

    // Background circle
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    this.ctx.fill();

    // Progress arc
    this.ctx.strokeStyle = '#ff6600';
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    this.ctx.stroke();

    // R key text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('R', centerX, centerY);

    // Label
    this.ctx.font = '14px Arial';
    this.ctx.fillText('RESTART', centerX, centerY + radius + 25);
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

    // Combo counter and meter (center, when active)
    if (this.comboCount > 1) {
      const meterWidth = 200;
      const meterHeight = 8;
      const meterX = (GAME_WIDTH - meterWidth) / 2;
      const meterY = 95;

      // Draw combo meter background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

      // Draw combo meter fill based on timer
      const fillPercent = this.comboTimer / this.comboDuration;
      const pulseBoost = this.comboMeterPulse * 0.1;

      // Color based on combo tier
      let comboColor = '#ffd700'; // Gold
      let tierName = '';
      if (this.comboCount >= 25) {
        comboColor = '#ff00ff'; // Magenta - LEGENDARY
        tierName = 'LEGENDARY!';
      } else if (this.comboCount >= 20) {
        comboColor = '#00ffff'; // Cyan - INSANE
        tierName = 'INSANE!';
      } else if (this.comboCount >= 15) {
        comboColor = '#ff0066'; // Pink - EPIC
        tierName = 'EPIC!';
      } else if (this.comboCount >= 10) {
        comboColor = '#ff6600'; // Orange - SUPER
        tierName = 'SUPER!';
      } else if (this.comboCount >= 5) {
        comboColor = '#ffcc00'; // Yellow - NICE
        tierName = 'NICE!';
      }

      // Pulsing meter fill
      this.ctx.fillStyle = comboColor;
      this.ctx.shadowColor = comboColor;
      this.ctx.shadowBlur = 10 + this.comboMeterPulse * 20;
      this.ctx.fillRect(meterX, meterY, meterWidth * (fillPercent + pulseBoost), meterHeight);
      this.ctx.shadowBlur = 0;

      // Meter border
      this.ctx.strokeStyle = comboColor;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

      // Show combo text when recently updated
      if (this.comboDisplayTimer > 0) {
        const comboScale = 1 + (this.comboDisplayTimer / 500) * 0.3;
        const comboAlpha = Math.min(1, this.comboDisplayTimer / 200);

        this.ctx.textAlign = 'center';
        this.ctx.font = `bold ${Math.floor(28 * comboScale)}px "Segoe UI", sans-serif`;

        this.ctx.fillStyle = comboColor;
        this.ctx.shadowColor = comboColor;
        this.ctx.shadowBlur = 15;
        this.ctx.globalAlpha = comboAlpha;
        this.ctx.fillText(`${this.comboCount}x COMBO!`, GAME_WIDTH / 2, 80);

        // Show multiplier below combo count
        if (this.comboMultiplier > 1) {
          this.ctx.font = `bold ${Math.floor(16 * comboScale)}px "Segoe UI", sans-serif`;
          this.ctx.fillText(`${this.comboMultiplier}x POINTS ${tierName}`, GAME_WIDTH / 2, 118);
        }

        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 4;
      }
    }

    // Time Attack countdown (center-top, prominent when active)
    if (this.modifiers.isActive('timeAttack')) {
      const timeRemaining = this.modifiers.getTimeRemaining();
      const seconds = Math.ceil(timeRemaining / 1000);
      const isLow = seconds <= 10;

      this.ctx.textAlign = 'center';
      this.ctx.font = `bold ${isLow ? 28 : 24}px "Segoe UI", sans-serif`;
      this.ctx.fillStyle = isLow ? '#ff4444' : '#ffff00';
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.shadowBlur = isLow ? 20 : 10;

      // Pulse when low
      const scale = isLow ? 1 + Math.sin(Date.now() / 100) * 0.1 : 1;
      this.ctx.save();
      this.ctx.translate(GAME_WIDTH / 2, 58);
      this.ctx.scale(scale, scale);
      this.ctx.fillText(`⏱️ ${seconds}s`, 0, 0);
      this.ctx.restore();
      this.ctx.shadowBlur = 4;
    }

    // Active modifiers display (bottom-left)
    const activeModifiers = this.modifiers.getActiveModifierDetails();
    if (activeModifiers.length > 0) {
      this.ctx.textAlign = 'left';
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

      let modY = GAME_HEIGHT - 60;
      for (const mod of activeModifiers) {
        this.ctx.fillStyle = mod.color;
        this.ctx.fillText(`${mod.icon} ${mod.name}`, 15, modY);
        modY -= 16;
      }
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

    // Mobile controls (pause, home, restart buttons)
    if (this.input.isMobileDevice()) {
      this.renderMobileControls();
    }

    this.ctx.restore();
  }

  private renderMobileControls(): void {
    const buttonSize = 44;
    const buttonPadding = 12;
    const topY = 55;

    // Semi-transparent background for buttons
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;

    // Pause button (top-right area, below coins/best)
    const pauseX = GAME_WIDTH - buttonSize - buttonPadding;
    this.ctx.beginPath();
    this.ctx.roundRect(pauseX, topY, buttonSize, buttonSize, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // Pause icon (two vertical bars)
    this.ctx.fillStyle = '#ffffff';
    const barWidth = 6;
    const barHeight = 20;
    const barGap = 6;
    const barY = topY + (buttonSize - barHeight) / 2;
    this.ctx.fillRect(pauseX + buttonSize / 2 - barWidth - barGap / 2, barY, barWidth, barHeight);
    this.ctx.fillRect(pauseX + buttonSize / 2 + barGap / 2, barY, barWidth, barHeight);

    // Home button (left of pause)
    const homeX = pauseX - buttonSize - buttonPadding;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.roundRect(homeX, topY, buttonSize, buttonSize, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // Home icon (simple house shape)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⌂', homeX + buttonSize / 2, topY + buttonSize / 2 + 8);

    // Restart button (left of home)
    const restartX = homeX - buttonSize - buttonPadding;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.roundRect(restartX, topY, buttonSize, buttonSize, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // Restart icon (circular arrow)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 22px "Segoe UI", sans-serif';
    this.ctx.fillText('↻', restartX + buttonSize / 2, topY + buttonSize / 2 + 7);

    // Touch zone hints at bottom of screen (only show when paused)
    if (this.state.gameStatus === 'paused') {
      const hintY = GAME_HEIGHT - 50;
      this.ctx.font = '14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Left side: Flip gravity  |  Right side: Jump', GAME_WIDTH / 2, hintY);
    }
  }

  private handleMobileControlClick(x: number, y: number): boolean {
    const buttonSize = 44;
    const buttonPadding = 12;
    const topY = 55;

    // Pause button
    const pauseX = GAME_WIDTH - buttonSize - buttonPadding;
    if (x >= pauseX && x <= pauseX + buttonSize && y >= topY && y <= topY + buttonSize) {
      this.audio.playSelect();
      if (this.state.gameStatus === 'paused') {
        // Resume
        this.state.gameStatus = this.isPracticeMode ? 'practice' : 'playing';
        this.audio.start();
      } else {
        // Pause
        this.state.gameStatus = 'paused';
        this.audio.stop();
      }
      return true;
    }

    // Home button
    const homeX = pauseX - buttonSize - buttonPadding;
    if (x >= homeX && x <= homeX + buttonSize && y >= topY && y <= topY + buttonSize) {
      this.audio.playSelect();
      this.audio.stop();
      this.state.gameStatus = 'mainMenu';
      this.isPracticeMode = false;
      return true;
    }

    // Restart button
    const restartX = homeX - buttonSize - buttonPadding;
    if (x >= restartX && x <= restartX + buttonSize && y >= topY && y <= topY + buttonSize) {
      this.audio.playSelect();
      this.restartLevel();
      return true;
    }

    return false;
  }

  private handlePausedClick(x: number, y: number): void {
    // Check mobile control buttons first
    if (this.input.isMobileDevice() && this.handleMobileControlClick(x, y)) {
      return;
    }

    // Check pause menu buttons (matching renderPaused layout)
    const btnWidth = 200;
    const btnHeight = 44;
    const btnX = GAME_WIDTH / 2 - btnWidth / 2;
    const btnStartY = GAME_HEIGHT / 2 + 100;
    const btnGap = 55;

    // Resume button
    if (x >= btnX && x <= btnX + btnWidth && y >= btnStartY && y <= btnStartY + btnHeight) {
      this.audio.playSelect();
      this.state.gameStatus = this.isPracticeMode ? 'practice' : 'playing';
      this.audio.start();
      return;
    }

    // Restart button
    if (x >= btnX && x <= btnX + btnWidth && y >= btnStartY + btnGap && y <= btnStartY + btnGap + btnHeight) {
      this.audio.playSelect();
      this.restartLevel();
      return;
    }

    // Main Menu button
    if (x >= btnX && x <= btnX + btnWidth && y >= btnStartY + btnGap * 2 && y <= btnStartY + btnGap * 2 + btnHeight) {
      this.audio.playSelect();
      this.audio.stop();
      this.state.gameStatus = 'mainMenu';
      this.isPracticeMode = false;
      return;
    }
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

    // Buttons (repositioned to fit 8 buttons)
    this.renderMenuButton('PLAY', GAME_WIDTH / 2, 260, true);

    // Endless and Challenges side by side
    this.renderSmallMenuButton('ENDLESS', GAME_WIDTH / 2 - 55, 315, '#00ffaa');
    const streakInfo = this.challengeManager.getStreakInfo();
    const streakText = streakInfo.current > 0 ? ` 🔥${streakInfo.current}` : '';
    this.renderSmallMenuButton(`DAILY${streakText}`, GAME_WIDTH / 2 + 55, 315, '#ff6600');

    // Editor and Custom Levels side by side
    this.renderSmallMenuButton('EDITOR', GAME_WIDTH / 2 - 55, 370, '#ff00ff');
    this.renderSmallMenuButton('MY LEVELS', GAME_WIDTH / 2 + 55, 370, '#00ff88');

    // Skins and Achievements side by side
    const achieveProgress = this.save.getAchievementProgress();
    this.renderSmallMenuButton('SKINS', GAME_WIDTH / 2 - 55, 425, '#ffd700');
    this.renderSmallMenuButton(`BADGES ${achieveProgress.unlocked}/${achieveProgress.total}`, GAME_WIDTH / 2 + 55, 425, '#ff6600');

    this.renderMenuButton('SETTINGS', GAME_WIDTH / 2, 480, false);

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

    // Modifiers button
    const modBtnX = GAME_WIDTH / 2 - 80;
    const modBtnY = 418;
    const modBtnW = 160;
    const modBtnH = 32;

    this.ctx.fillStyle = this.showModifierPanel ? '#ff6600' : 'rgba(255, 102, 0, 0.7)';
    this.ctx.strokeStyle = '#ff6600';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(modBtnX, modBtnY, modBtnW, modBtnH, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    const activeCount = this.modifiers.getActiveCount();
    const modifierText = activeCount > 0 ? `MODIFIERS (${activeCount})` : 'MODIFIERS';
    this.ctx.fillText(modifierText, GAME_WIDTH / 2, modBtnY + 21);

    // Show score multiplier if modifiers are active
    if (activeCount > 0) {
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.fillText(`${this.modifiers.getScoreMultiplier().toFixed(2)}x Score`, GAME_WIDTH / 2, modBtnY + 50);
    }

    // Section Practice button (only for unlocked levels with checkpoints)
    const levelId = this.selectedLevelIndex + 1;
    const isUnlocked = this.save.isLevelUnlocked(levelId);
    if (isUnlocked && levelId <= TOTAL_LEVELS) {
      const secBtnX = GAME_WIDTH / 2 - 80;
      const secBtnY = modBtnY + 45;
      const secBtnW = 160;
      const secBtnH = 28;

      this.ctx.fillStyle = this.showSectionPractice ? '#00aaff' : 'rgba(0, 170, 255, 0.6)';
      this.ctx.strokeStyle = '#00aaff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(secBtnX, secBtnY, secBtnW, secBtnH, 6);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('SECTION PRACTICE', GAME_WIDTH / 2, secBtnY + 18);
    }

    // Render modifier panel if open
    if (this.showModifierPanel) {
      this.renderModifierPanel();
    }

    // Render section practice panel if open
    if (this.showSectionPractice) {
      this.renderSectionPracticePanel();
    }

    // Level features hint
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Use ← → arrows or click arrows to navigate', GAME_WIDTH / 2, 480);

    this.ctx.restore();
  }

  private renderModifierPanel(): void {
    const panelX = 80;
    const panelY = 100;
    const panelW = GAME_WIDTH - 160;
    const panelH = 300;

    // Panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    this.ctx.strokeStyle = '#ff6600';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(panelX, panelY, panelW, panelH, 15);
    this.ctx.fill();
    this.ctx.stroke();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff6600';
    this.ctx.fillText('DIFFICULTY MODIFIERS', GAME_WIDTH / 2, panelY + 35);

    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('Enable modifiers for bonus score multipliers', GAME_WIDTH / 2, panelY + 55);

    // Modifier buttons - 2 columns, 3 rows
    const modIds: ModifierId[] = ['speedDemon', 'noDoubleJump', 'fragile', 'mirrorMode', 'timeAttack', 'invisible'];
    const btnW = 180;
    const btnH = 50;
    const btnGapX = 20;
    const btnGapY = 12;
    const startX = GAME_WIDTH / 2 - btnW - btnGapX / 2;
    const startY = panelY + 75;

    for (let i = 0; i < modIds.length; i++) {
      const modId = modIds[i];
      const mod = MODIFIERS[modId];
      const col = i % 2;
      const row = Math.floor(i / 2);

      const btnX = startX + col * (btnW + btnGapX);
      const btnY = startY + row * (btnH + btnGapY);
      const isActive = this.modifiers.isActive(modId);

      // Button background
      this.ctx.fillStyle = isActive ? mod.color : 'rgba(60, 60, 60, 0.8)';
      this.ctx.strokeStyle = mod.color;
      this.ctx.lineWidth = isActive ? 3 : 2;
      this.ctx.beginPath();
      this.ctx.roundRect(btnX, btnY, btnW, btnH, 8);
      this.ctx.fill();
      this.ctx.stroke();

      // Icon and name
      this.ctx.textAlign = 'left';
      this.ctx.font = '18px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isActive ? '#000000' : '#ffffff';
      this.ctx.fillText(`${mod.icon} ${mod.name}`, btnX + 10, btnY + 22);

      // Description and multiplier
      this.ctx.font = '11px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isActive ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)';
      this.ctx.fillText(mod.description, btnX + 10, btnY + 38);

      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = isActive ? '#000000' : '#ffd700';
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillText(`${mod.scoreMultiplier}x`, btnX + btnW - 10, btnY + 22);
    }

    // Close hint
    this.ctx.textAlign = 'center';
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText('Click modifiers to toggle | Click outside to close', GAME_WIDTH / 2, panelY + panelH - 15);
  }

  private renderSectionPracticePanel(): void {
    const panelX = 100;
    const panelY = 120;
    const panelW = GAME_WIDTH - 200;
    const panelH = 260;

    // Panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    this.ctx.strokeStyle = '#00aaff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(panelX, panelY, panelW, panelH, 15);
    this.ctx.fill();
    this.ctx.stroke();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 22px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00aaff';
    this.ctx.fillText('SECTION PRACTICE', GAME_WIDTH / 2, panelY + 30);

    // Get checkpoints for the selected level
    const levelId = this.selectedLevelIndex + 1;
    const checkpoints = this.getCheckpointsForLevel(levelId);

    if (checkpoints.length === 0) {
      this.ctx.font = '16px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.fillText('No sections available for this level', GAME_WIDTH / 2, panelY + 100);
    } else {
      // Render section buttons
      const btnW = 150;
      const btnH = 45;
      const btnGap = 15;
      const startY = panelY + 55;

      // "Start" option (from beginning)
      const startBtnX = GAME_WIDTH / 2 - btnW / 2;
      const isStartSelected = this.selectedSection === 0;

      this.ctx.fillStyle = isStartSelected ? '#00ff88' : 'rgba(0, 255, 136, 0.3)';
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = isStartSelected ? 3 : 2;
      this.ctx.beginPath();
      this.ctx.roundRect(startBtnX, startY, btnW, btnH, 8);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isStartSelected ? '#000' : '#fff';
      this.ctx.fillText('⚑ Start', GAME_WIDTH / 2, startY + 20);
      this.ctx.font = '11px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isStartSelected ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.6)';
      this.ctx.fillText('From beginning', GAME_WIDTH / 2, startY + 35);

      // Checkpoint buttons (horizontal layout)
      const checkpointsPerRow = 3;
      const totalWidth = checkpointsPerRow * btnW + (checkpointsPerRow - 1) * btnGap;
      const rowStartX = (GAME_WIDTH - totalWidth) / 2;

      for (let i = 0; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        const row = Math.floor(i / checkpointsPerRow);
        const col = i % checkpointsPerRow;
        const btnX = rowStartX + col * (btnW + btnGap);
        const btnY = startY + btnH + 15 + row * (btnH + 10);
        const isSelected = this.selectedSection === i + 1;

        this.ctx.fillStyle = isSelected ? '#00aaff' : 'rgba(0, 170, 255, 0.3)';
        this.ctx.strokeStyle = '#00aaff';
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.beginPath();
        this.ctx.roundRect(btnX, btnY, btnW, btnH, 8);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = 'bold 13px "Segoe UI", sans-serif';
        this.ctx.fillStyle = isSelected ? '#000' : '#fff';
        this.ctx.fillText(`◉ Section ${i + 1}`, btnX + btnW / 2, btnY + 18);

        this.ctx.font = '10px "Segoe UI", sans-serif';
        this.ctx.fillStyle = isSelected ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.6)';
        const cpName = cp.name || `Checkpoint ${i + 1}`;
        this.ctx.fillText(cpName, btnX + btnW / 2, btnY + 33);
      }
    }

    // Start Practice button
    const playBtnX = GAME_WIDTH / 2 - 70;
    const playBtnY = panelY + panelH - 55;
    const playBtnW = 140;
    const playBtnH = 36;

    this.ctx.fillStyle = '#00ff88';
    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(playBtnX, playBtnY, playBtnW, playBtnH, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#000';
    this.ctx.fillText('▶ START PRACTICE', GAME_WIDTH / 2, playBtnY + 23);

    // Close hint
    this.ctx.font = '11px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText('Click section to select | Click outside to close', GAME_WIDTH / 2, panelY + panelH - 10);
  }

  private getCheckpointsForLevel(levelId: number): { x: number; y: number; name?: string }[] {
    // Get the level config checkpoints
    const levelConfigs: Record<number, { checkpoints?: { x: number; y: number; name?: string }[] }> = {
      1: { checkpoints: [
        { x: 512, y: 390, name: 'First Spike' },
        { x: 1024, y: 390, name: 'Bounce Section' },
        { x: 1536, y: 390, name: 'Platform Hops' },
      ]},
      2: { checkpoints: [
        { x: 700, y: 390, name: 'Moving Start' },
        { x: 1400, y: 390, name: 'Phase Intro' },
        { x: 2100, y: 390, name: 'Ice Slide' },
      ]},
      3: { checkpoints: [
        { x: 762, y: 390, name: 'Bounce Chain' },
        { x: 1524, y: 390, name: 'Moving Platforms' },
        { x: 2286, y: 390, name: 'Final Climb' },
      ]},
      4: { checkpoints: [
        { x: 780, y: 390, name: 'Ice Intro' },
        { x: 1560, y: 390, name: 'Ice Gaps' },
        { x: 2340, y: 390, name: 'Crumble Test' },
      ]},
      5: { checkpoints: [
        { x: 803, y: 390, name: 'Hot Start' },
        { x: 1606, y: 390, name: 'Lava Fields' },
        { x: 2409, y: 390, name: 'Fire Sprint' },
      ]},
      6: { checkpoints: [
        { x: 936, y: 390, name: 'Crumble Chain' },
        { x: 1872, y: 390, name: 'Deep Waters' },
        { x: 2808, y: 390, name: 'Final Sprint' },
      ]},
      7: { checkpoints: [
        { x: 984, y: 390, name: 'Phase Gauntlet' },
        { x: 1968, y: 390, name: 'Moving Madness' },
        { x: 2952, y: 390, name: 'Final Challenge' },
      ]},
      8: { checkpoints: [
        { x: 888, y: 390, name: 'Bounce Climb' },
        { x: 1776, y: 340, name: 'Temple Mid' },
        { x: 2664, y: 320, name: 'Temple Peak' },
      ]},
      9: { checkpoints: [
        { x: 984, y: 390, name: 'First Escape' },
        { x: 1968, y: 390, name: 'Halfway Point' },
        { x: 2952, y: 390, name: 'Final Sprint' },
      ]},
    };

    return levelConfigs[levelId]?.checkpoints || [];
  }

  private renderSettings(): void {
    this.renderOverlay();

    this.ctx.save();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('SETTINGS', GAME_WIDTH / 2, 60);

    // Back button
    this.ctx.textAlign = 'left';
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('< Back (ESC)', 20, 35);

    // Layout: Two columns
    const leftColX = GAME_WIDTH / 4;
    const rightColX = (GAME_WIDTH * 3) / 4;
    const sliderWidth = 180;

    // === LEFT COLUMN: Audio ===
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillText('AUDIO', leftColX, 100);

    // Music volume
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Music Volume', leftColX, 130);
    this.renderSlider(leftColX - sliderWidth / 2 - 15, 145, sliderWidth, this.audio.getMusicVolume());

    // SFX volume
    this.ctx.fillText('SFX Volume', leftColX, 195);
    this.renderSlider(leftColX - sliderWidth / 2 - 15, 210, sliderWidth, this.audio.getSfxVolume());

    // Mute indicator
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText('Press M to mute', leftColX, 260);

    // === RIGHT COLUMN: Display ===
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillText('DISPLAY', rightColX, 100);

    // Screen shake toggle
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Screen Shake', rightColX, 135);
    this.renderToggle(rightColX, 160, this.save.getSettings().screenShake);

    // Reduced motion toggle
    this.ctx.fillText('Reduced Motion', rightColX, 210);
    this.renderToggle(rightColX, 235, this.save.isReducedMotionEnabled());

    // === ACCESSIBILITY SECTION ===
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fillText('ACCESSIBILITY', leftColX, 305);

    // Colorblind mode
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Colorblind Mode', leftColX, 335);
    this.renderColorblindSelector(leftColX, 365);

    // Reduce flash effects
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Reduce Flash', leftColX, 410);
    this.renderToggle(leftColX, 435, this.save.isReduceFlashEnabled());

    // High contrast mode
    this.ctx.fillText('High Contrast', leftColX, 480);
    this.renderToggle(leftColX, 505, this.save.isHighContrastEnabled());

    // === GAMEPLAY SECTION ===
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fillText('GAMEPLAY', rightColX, 305);

    // Show ghost toggle
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Show Ghost', rightColX, 335);
    this.renderToggle(rightColX, 360, this.save.isShowGhostEnabled());

    // Haptic feedback toggle
    this.ctx.fillText('Haptic Feedback', rightColX, 405);
    this.renderToggle(rightColX, 430, this.save.isHapticFeedbackEnabled());
    this.ctx.font = '10px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.fillText('(mobile only)', rightColX, 465);

    // Export/Import buttons
    this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
    this.renderSettingsButton('Export Data', rightColX - 55, 495, '#00ffaa');
    this.renderSettingsButton('Import Data', rightColX + 55, 495, '#00aaff');

    // Reset button
    this.ctx.fillStyle = '#ff4444';
    this.renderSettingsButton('Reset All', rightColX, 540, '#ff4444');

    this.ctx.restore();
  }

  private renderColorblindSelector(x: number, y: number): void {
    const modes: Array<{ id: GameSettings['colorblindMode']; label: string }> = [
      { id: 'normal', label: 'Normal' },
      { id: 'deuteranopia', label: 'Deutan' },
      { id: 'protanopia', label: 'Protan' },
      { id: 'tritanopia', label: 'Tritan' },
    ];

    const currentMode = this.save.getColorblindMode();
    const buttonWidth = 50;
    const gap = 8;
    const totalWidth = modes.length * buttonWidth + (modes.length - 1) * gap;
    const startX = x - totalWidth / 2;

    modes.forEach((mode, i) => {
      const btnX = startX + i * (buttonWidth + gap);
      const isSelected = mode.id === currentMode;

      this.ctx.fillStyle = isSelected ? 'rgba(0, 255, 170, 0.3)' : 'rgba(255, 255, 255, 0.1)';
      this.ctx.strokeStyle = isSelected ? '#00ffaa' : 'rgba(255, 255, 255, 0.3)';
      this.ctx.lineWidth = isSelected ? 2 : 1;

      this.ctx.beginPath();
      this.ctx.roundRect(btnX, y, buttonWidth, 25, 5);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.font = '10px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isSelected ? '#00ffaa' : 'rgba(255, 255, 255, 0.7)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(mode.label, btnX + buttonWidth / 2, y + 16);
    });
  }

  private renderSettingsButton(text: string, x: number, y: number, color: string): void {
    const width = 90;
    const height = 28;

    this.ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
    }
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.roundRect(x - width / 2, y - height / 2, width, height, 5);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = 'bold 11px "Segoe UI", sans-serif';
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x, y + 4);
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

  private renderChallenges(): void {
    this.renderOverlay();

    this.ctx.save();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 42px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff6600';
    this.ctx.shadowColor = '#ff6600';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('DAILY CHALLENGES', GAME_WIDTH / 2, 70);

    // Streak display
    const streakInfo = this.challengeManager.getStreakInfo();
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = streakInfo.current > 0 ? '#ffd700' : 'rgba(255, 255, 255, 0.5)';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.shadowBlur = 10;
    if (streakInfo.current > 0) {
      this.ctx.fillText(`🔥 ${streakInfo.current} Day Streak! (Best: ${streakInfo.longest})`, GAME_WIDTH / 2, 100);
    } else {
      this.ctx.fillText('Start a streak by completing today\'s challenge!', GAME_WIDTH / 2, 100);
    }

    // Total completed
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(`Total Challenges Completed: ${this.challengeManager.getTotalCompleted()}`, GAME_WIDTH / 2, 122);

    // Back button
    this.ctx.textAlign = 'left';
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillText('< Back (ESC)', 20, 45);

    // Get current challenges
    const challenges = this.challengeManager.getCurrentChallenges();
    const cardWidth = 320;
    const cardHeight = 150;
    const gap = 30;
    const startX = (GAME_WIDTH - cardWidth) / 2;
    const startY = 150;

    for (let i = 0; i < challenges.length; i++) {
      const challenge = challenges[i];
      const cardY = startY + i * (cardHeight + gap);
      const progress = this.challengeManager.getProgress(challenge.id);
      const isCompleted = progress?.completed || false;
      const typeInfo = CHALLENGE_TYPES[challenge.type];

      // Card background
      const cardColor = challenge.isWeekly ? '#9933ff' : '#ff6600';
      this.ctx.fillStyle = isCompleted ? 'rgba(0, 255, 100, 0.15)' : `rgba(${parseInt(cardColor.slice(1, 3), 16)}, ${parseInt(cardColor.slice(3, 5), 16)}, ${parseInt(cardColor.slice(5, 7), 16)}, 0.15)`;
      this.ctx.strokeStyle = isCompleted ? '#00ff66' : cardColor;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.roundRect(startX, cardY, cardWidth, cardHeight, 12);
      this.ctx.fill();
      this.ctx.stroke();

      // Challenge type label
      this.ctx.textAlign = 'left';
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = cardColor;
      this.ctx.fillText(challenge.isWeekly ? 'WEEKLY CHALLENGE' : 'DAILY CHALLENGE', startX + 15, cardY + 22);

      // Icon and name
      this.ctx.font = '28px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(challenge.icon, startX + 15, cardY + 58);

      this.ctx.font = 'bold 22px "Segoe UI", sans-serif';
      this.ctx.fillText(challenge.name, startX + 55, cardY + 55);

      // Description
      this.ctx.font = '14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillText(typeInfo.description, startX + 15, cardY + 80);

      // Time remaining
      const timeRemaining = this.challengeManager.formatTimeRemaining(challenge);
      this.ctx.textAlign = 'right';
      this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = cardColor;
      this.ctx.fillText(`⏱ ${timeRemaining}`, startX + cardWidth - 15, cardY + 22);

      // Status / Play button
      this.ctx.textAlign = 'center';
      const btnX = startX + cardWidth / 2;
      const btnY = cardY + 115;
      const btnW = 140;
      const btnH = 36;

      if (isCompleted) {
        // Show best score and completed checkmark
        this.ctx.fillStyle = 'rgba(0, 255, 100, 0.2)';
        this.ctx.strokeStyle = '#00ff66';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#00ff66';
        this.ctx.fillText(`✓ Best: ${progress!.bestScore}`, btnX, btnY + 5);
      } else {
        // Play button
        this.ctx.fillStyle = `rgba(${parseInt(cardColor.slice(1, 3), 16)}, ${parseInt(cardColor.slice(3, 5), 16)}, ${parseInt(cardColor.slice(5, 7), 16)}, 0.3)`;
        this.ctx.strokeStyle = cardColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#ffffff';
        const attemptText = progress?.attempts ? ` (${progress.attempts} tries)` : '';
        this.ctx.fillText(`PLAY${attemptText}`, btnX, btnY + 6);
      }
    }

    this.ctx.restore();
  }

  private handleChallengesClick(x: number, y: number): void {
    // Back button
    if (x >= 10 && x <= 140 && y >= 25 && y <= 55) {
      this.audio.playSelect();
      this.state.gameStatus = 'mainMenu';
      return;
    }

    // Check challenge card clicks
    const challenges = this.challengeManager.getCurrentChallenges();
    const cardWidth = 320;
    const cardHeight = 150;
    const gap = 30;
    const startX = (GAME_WIDTH - cardWidth) / 2;
    const startY = 150;

    for (let i = 0; i < challenges.length; i++) {
      const challenge = challenges[i];
      const cardY = startY + i * (cardHeight + gap);
      const progress = this.challengeManager.getProgress(challenge.id);
      const isCompleted = progress?.completed || false;

      // Check if click is on play button (bottom center of card)
      const btnX = startX + cardWidth / 2;
      const btnY = cardY + 115;
      const btnW = 140;
      const btnH = 36;

      if (x >= btnX - btnW / 2 && x <= btnX + btnW / 2 &&
          y >= btnY - btnH / 2 && y <= btnY + btnH / 2 &&
          !isCompleted) {
        this.audio.playSelect();
        this.startChallenge(challenge);
        return;
      }
    }
  }

  private startChallenge(challenge: Challenge): void {
    this.currentChallenge = challenge;
    this.challengeScore = 0;

    // Start endless mode with the challenge seed
    this.isEndlessMode = true;
    this.endlessDistance = 0;
    this.speedMultiplier = 1.0;
    this.jumpCount = 0;

    // Generate procedural platforms using the challenge seed
    this.endlessPlatforms = [];
    const GROUND_Y = GAME_HEIGHT - 40;

    // Starting ground platform
    this.endlessPlatforms.push(new Platform({ x: 0, y: GROUND_Y, width: 400, height: 40, type: 'solid' }));
    this.nextPlatformX = 400;

    // Generate initial seeded platforms
    const seedPlatforms = this.challengeManager.generateChallengePlatforms(challenge.seed, this.nextPlatformX, 20);
    for (const p of seedPlatforms) {
      this.endlessPlatforms.push(new Platform({ x: p.x, y: p.y, width: p.width, height: p.height, type: p.type as any }));
    }
    if (seedPlatforms.length > 0) {
      this.nextPlatformX = seedPlatforms[seedPlatforms.length - 1].x + seedPlatforms[seedPlatforms.length - 1].width + 200;
    }

    // Reset player
    this.player.reset({ x: 100, y: GROUND_Y - 50 });
    this.cameraX = 0;
    this.attempts++;

    // Start music
    this.audio.start();

    this.state.gameStatus = 'challengePlaying';
  }

  private restartChallenge(): void {
    if (!this.currentChallenge) return;

    // Reset with same seed
    this.endlessDistance = 0;
    this.speedMultiplier = 1.0;
    this.jumpCount = 0;

    // Regenerate procedural platforms using the same seed
    this.endlessPlatforms = [];
    const GROUND_Y = GAME_HEIGHT - 40;

    // Starting ground platform
    this.endlessPlatforms.push(new Platform({ x: 0, y: GROUND_Y, width: 400, height: 40, type: 'solid' }));
    this.nextPlatformX = 400;

    // Generate initial seeded platforms
    const seedPlatforms = this.challengeManager.generateChallengePlatforms(this.currentChallenge.seed, this.nextPlatformX, 20);
    for (const p of seedPlatforms) {
      this.endlessPlatforms.push(new Platform({ x: p.x, y: p.y, width: p.width, height: p.height, type: p.type as any }));
    }
    if (seedPlatforms.length > 0) {
      this.nextPlatformX = seedPlatforms[seedPlatforms.length - 1].x + seedPlatforms[seedPlatforms.length - 1].width + 200;
    }

    // Reset player
    this.player.reset({ x: 100, y: GROUND_Y - 50 });
    this.cameraX = 0;
    this.attempts++;
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

    // Action buttons (mobile-friendly)
    const btnWidth = 200;
    const btnHeight = 44;
    const btnX = GAME_WIDTH / 2 - btnWidth / 2;
    const btnStartY = GAME_HEIGHT / 2 + 100;
    const btnGap = 55;

    // Resume button
    this.ctx.fillStyle = '#00ff88';
    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, btnStartY, btnWidth, btnHeight, 8);
    this.ctx.fill();
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('▶ RESUME', GAME_WIDTH / 2, btnStartY + 28);

    // Restart button
    this.ctx.fillStyle = 'rgba(0, 170, 255, 0.8)';
    this.ctx.strokeStyle = '#00aaff';
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, btnStartY + btnGap, btnWidth, btnHeight, 8);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('↻ RESTART', GAME_WIDTH / 2, btnStartY + btnGap + 28);

    // Main Menu button
    this.ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    this.ctx.strokeStyle = '#ff6666';
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, btnStartY + btnGap * 2, btnWidth, btnHeight, 8);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('⌂ MAIN MENU', GAME_WIDTH / 2, btnStartY + btnGap * 2 + 28);

    // Keyboard hints (only show on desktop)
    if (!this.input.isMobileDevice()) {
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillText('ESC/ENTER to resume  |  R to restart  |  Q to quit', GAME_WIDTH / 2, GAME_HEIGHT - 30);
    }

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

  private renderChallengeUI(): void {
    if (!this.currentChallenge) return;

    this.ctx.save();

    const challengeColor = this.currentChallenge.isWeekly ? '#9933ff' : '#ff6600';

    // Distance counter (main score)
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 15;
    this.ctx.fillText(`${this.endlessDistance}m`, GAME_WIDTH / 2, 50);

    // Target distance
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = challengeColor;
    this.ctx.shadowColor = challengeColor;
    this.ctx.shadowBlur = 5;
    const targetText = this.endlessDistance >= 500 ? '✓ COMPLETE!' : 'Target: 500m';
    this.ctx.fillText(targetText, GAME_WIDTH / 2, 75);

    // Challenge name label
    this.ctx.textAlign = 'left';
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = challengeColor;
    this.ctx.shadowColor = challengeColor;
    this.ctx.fillText(`${this.currentChallenge.icon} ${this.currentChallenge.name}`, 20, 30);

    // Time remaining
    this.ctx.textAlign = 'right';
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.shadowBlur = 0;
    const timeRemaining = this.challengeManager.formatTimeRemaining(this.currentChallenge);
    this.ctx.fillText(`⏱ ${timeRemaining}`, GAME_WIDTH - 20, 30);

    // Best score for this challenge
    const progress = this.challengeManager.getProgress(this.currentChallenge.id);
    if (progress && progress.bestScore > 0) {
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.fillText(`Best: ${progress.bestScore}m`, GAME_WIDTH - 20, 50);
    }

    // Mute indicator
    if (this.audio.isMusicMuted()) {
      this.ctx.textAlign = 'right';
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ff6666';
      this.ctx.fillText('MUTED', GAME_WIDTH - 20, 70);
    }

    // Beat indicator
    if (this.beatPulse > 0) {
      const size = 15 + this.beatPulse * 10;
      this.ctx.beginPath();
      this.ctx.arc(GAME_WIDTH - 30, GAME_HEIGHT - 30, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${parseInt(challengeColor.slice(1, 3), 16)}, ${parseInt(challengeColor.slice(3, 5), 16)}, ${parseInt(challengeColor.slice(5, 7), 16)}, ${this.beatPulse * 0.8})`;
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

    // Import level prompt (from URL)
    if (this.pendingImportLevel) {
      const promptY = GAME_HEIGHT / 2;
      // Import button
      if (x >= GAME_WIDTH / 2 - 110 && x <= GAME_WIDTH / 2 - 10 &&
          y >= promptY + 40 && y <= promptY + 80) {
        this.audio.playSelect();
        this.customLevelManager.saveLevel(this.pendingImportLevel);
        this.showShareNotification('Level imported successfully!', false);
        this.pendingImportLevel = null;
        return;
      }
      // Cancel button
      if (x >= GAME_WIDTH / 2 + 10 && x <= GAME_WIDTH / 2 + 110 &&
          y >= promptY + 40 && y <= promptY + 80) {
        this.audio.playSelect();
        this.pendingImportLevel = null;
        return;
      }
    }

    // Create New Level button
    if (x >= GAME_WIDTH / 2 - 100 && x <= GAME_WIDTH / 2 + 100 &&
        y >= GAME_HEIGHT - 80 && y <= GAME_HEIGHT - 40) {
      this.audio.playSelect();
      this.openEditor();
      return;
    }

    // Import from Code button
    if (x >= GAME_WIDTH / 2 + 120 && x <= GAME_WIDTH / 2 + 270 &&
        y >= GAME_HEIGHT - 80 && y <= GAME_HEIGHT - 40) {
      this.audio.playSelect();
      this.importLevelFromClipboard();
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
        const btnWidth = 45;
        const btnGap = 5;
        const btnY1 = cardY + cardHeight - 35;
        const btnY2 = cardY + cardHeight - 10;

        // Check for play button
        if (x >= cardX + 5 && x <= cardX + 5 + btnWidth && y >= btnY1 && y <= btnY2) {
          this.audio.playSelect();
          this.playCustomLevel(levels[i]);
          return;
        }
        // Check for edit button
        if (x >= cardX + 5 + btnWidth + btnGap && x <= cardX + 5 + btnWidth * 2 + btnGap && y >= btnY1 && y <= btnY2) {
          this.audio.playSelect();
          this.openEditor(levels[i]);
          return;
        }
        // Check for share button
        if (x >= cardX + 5 + (btnWidth + btnGap) * 2 && x <= cardX + 5 + btnWidth * 3 + btnGap * 2 && y >= btnY1 && y <= btnY2) {
          this.audio.playSelect();
          this.shareLevel(levels[i]);
          return;
        }
        // Check for delete button
        if (x >= cardX + 5 + (btnWidth + btnGap) * 3 && x <= cardX + 5 + btnWidth * 4 + btnGap * 3 && y >= btnY1 && y <= btnY2) {
          this.audio.playSelect();
          this.customLevelManager.deleteLevel(levels[i].id);
          return;
        }
      }
    }
  }

  private async shareLevel(level: CustomLevel): Promise<void> {
    const result = LevelSharingManager.encodeLevel(level);
    if (result.success && result.code) {
      const copied = await LevelSharingManager.copyToClipboard(result.code);
      if (copied) {
        this.showShareNotification('Level code copied to clipboard!', false);
      } else {
        this.showShareNotification('Code: ' + result.code.substring(0, 30) + '...', false);
      }
    } else {
      this.showShareNotification(result.error || 'Failed to share level', true);
    }
  }

  private async importLevelFromClipboard(): Promise<void> {
    const code = await LevelSharingManager.readFromClipboard();
    if (!code) {
      this.showShareNotification('Could not read clipboard. Paste a level code.', true);
      return;
    }

    const result = LevelSharingManager.decodeLevel(code.trim());
    if (result.success && result.level) {
      this.customLevelManager.saveLevel(result.level);
      this.showShareNotification('Level imported: ' + result.level.name, false);
    } else {
      this.showShareNotification(result.error || 'Invalid level code', true);
    }
  }

  private showShareNotification(message: string, isError: boolean): void {
    this.shareNotification = { message, isError, timer: 3000 };
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

        // Buttons (4 buttons: Play, Edit, Share, Delete)
        this.ctx.textAlign = 'center';
        const btnWidth = 45;
        const btnGap = 5;
        const btnY = cardY + cardHeight - 35;

        // Play button
        this.ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(cardX + 5, btnY, btnWidth, 25, 5);
        this.ctx.fill();
        this.ctx.font = 'bold 10px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillText('PLAY', cardX + 5 + btnWidth / 2, cardY + cardHeight - 18);

        // Edit button
        this.ctx.fillStyle = 'rgba(100, 100, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(cardX + 5 + btnWidth + btnGap, btnY, btnWidth, 25, 5);
        this.ctx.fill();
        this.ctx.fillStyle = '#8888ff';
        this.ctx.fillText('EDIT', cardX + 5 + btnWidth * 1.5 + btnGap, cardY + cardHeight - 18);

        // Share button
        this.ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(cardX + 5 + (btnWidth + btnGap) * 2, btnY, btnWidth, 25, 5);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillText('SHARE', cardX + 5 + btnWidth * 2.5 + btnGap * 2, cardY + cardHeight - 18);

        // Delete button
        this.ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(cardX + 5 + (btnWidth + btnGap) * 3, btnY, btnWidth, 25, 5);
        this.ctx.fill();
        this.ctx.fillStyle = '#ff5555';
        this.ctx.fillText('DEL', cardX + 5 + btnWidth * 3.5 + btnGap * 3, cardY + cardHeight - 18);
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

    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('+ CREATE NEW', GAME_WIDTH / 2, GAME_HEIGHT - 54);

    // Import button
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.roundRect(GAME_WIDTH / 2 + 120, GAME_HEIGHT - 80, 150, 40, 10);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffcc00';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffcc00';
    this.ctx.shadowColor = '#ffcc00';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('IMPORT CODE', GAME_WIDTH / 2 + 195, GAME_HEIGHT - 54);
    this.ctx.shadowBlur = 0;

    // Share notification
    if (this.shareNotification && this.shareNotification.timer > 0) {
      const alpha = Math.min(1, this.shareNotification.timer / 500);
      this.ctx.fillStyle = this.shareNotification.isError
        ? `rgba(255, 50, 50, ${alpha * 0.9})`
        : `rgba(0, 200, 100, ${alpha * 0.9})`;
      this.ctx.beginPath();
      this.ctx.roundRect(GAME_WIDTH / 2 - 200, 100, 400, 40, 10);
      this.ctx.fill();

      this.ctx.font = '14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.shareNotification.message, GAME_WIDTH / 2, 125);
    }

    // Import prompt for URL-shared levels
    if (this.pendingImportLevel) {
      // Darken background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      const promptY = GAME_HEIGHT / 2;

      // Prompt box
      this.ctx.fillStyle = 'rgba(30, 30, 50, 0.95)';
      this.ctx.beginPath();
      this.ctx.roundRect(GAME_WIDTH / 2 - 200, promptY - 60, 400, 160, 15);
      this.ctx.fill();
      this.ctx.strokeStyle = '#00ffaa';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Title
      this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#00ffaa';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Import Shared Level?', GAME_WIDTH / 2, promptY - 25);

      // Level name
      this.ctx.font = '16px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`"${this.pendingImportLevel.name}" by ${this.pendingImportLevel.author}`, GAME_WIDTH / 2, promptY + 10);

      // Import button
      this.ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
      this.ctx.beginPath();
      this.ctx.roundRect(GAME_WIDTH / 2 - 110, promptY + 40, 100, 40, 8);
      this.ctx.fill();
      this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillText('IMPORT', GAME_WIDTH / 2 - 60, promptY + 65);

      // Cancel button
      this.ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
      this.ctx.beginPath();
      this.ctx.roundRect(GAME_WIDTH / 2 + 10, promptY + 40, 100, 40, 8);
      this.ctx.fill();
      this.ctx.fillStyle = '#ff6666';
      this.ctx.fillText('CANCEL', GAME_WIDTH / 2 + 60, promptY + 65);
    }

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
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.ctx.save();
    this.ctx.textAlign = 'center';

    // Page indicator dots
    const dotY = 30;
    for (let i = 0; i < Game.TUTORIAL_PAGES; i++) {
      this.ctx.fillStyle = i === this.tutorialPage ? '#00ffff' : 'rgba(255, 255, 255, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(GAME_WIDTH / 2 - 30 + i * 20, dotY, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Skip button
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('SKIP (S)', GAME_WIDTH - 20, 30);
    this.ctx.textAlign = 'center';

    // Render page content based on current page
    switch (this.tutorialPage) {
      case 0:
        this.renderTutorialBasicControls();
        break;
      case 1:
        this.renderTutorialPlatforms();
        break;
      case 2:
        this.renderTutorialPowerUps();
        break;
      case 3:
        this.renderTutorialTips();
        break;
    }

    // Navigation hints
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 0;

    if (this.tutorialPage > 0) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('< BACK (LEFT)', 20, GAME_HEIGHT - 20);
    }

    this.ctx.textAlign = 'right';
    const pulse = Math.sin(this.menuAnimation * 4) * 0.3 + 0.7;
    this.ctx.fillStyle = `rgba(0, 255, 170, ${pulse})`;
    if (this.tutorialPage < Game.TUTORIAL_PAGES - 1) {
      this.ctx.fillText('NEXT (RIGHT/TAP) >', GAME_WIDTH - 20, GAME_HEIGHT - 20);
    } else {
      this.ctx.fillText('START GAME (TAP) >', GAME_WIDTH - 20, GAME_HEIGHT - 20);
    }

    this.ctx.restore();
  }

  private renderTutorialBasicControls(): void {
    // Title
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('BASIC CONTROLS', GAME_WIDTH / 2, 80);

    // Controls box
    const boxWidth = 500;
    const boxHeight = 340;
    const boxX = (GAME_WIDTH - boxWidth) / 2;
    const boxY = 100;

    this.ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    this.ctx.fill();
    this.ctx.stroke();

    const controls = [
      { icon: '⬆️', keys: 'SPACE / W / UP / TAP', desc: 'JUMP', detail: 'Tap again in the air for a double jump!' },
      { icon: '⚡', keys: 'SHIFT / 2-FINGER TAP', desc: 'DASH', detail: 'Quick burst of speed. Passes through enemies!' },
      { icon: '⏸️', keys: 'ESC / P', desc: 'PAUSE', detail: 'Pause the game anytime' },
      { icon: '🎵', keys: 'M', desc: 'MUTE', detail: 'Toggle music on/off' },
      { icon: '🔄', keys: 'R (hold)', desc: 'RESTART', detail: 'Hold R to quickly restart the level' },
    ];

    let y = boxY + 45;
    for (const control of controls) {
      this.ctx.font = '22px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(control.icon, boxX + 35, y);

      this.ctx.textAlign = 'left';
      this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.fillText(control.desc, boxX + 70, y - 8);

      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#888888';
      this.ctx.fillText(control.keys, boxX + 160, y - 8);

      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillText(control.detail, boxX + 70, y + 10);

      y += 55;
    }
    this.ctx.textAlign = 'center';
  }

  private renderTutorialPlatforms(): void {
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('PLATFORM TYPES', GAME_WIDTH / 2, 80);

    const boxWidth = 540;
    const boxHeight = 380;
    const boxX = (GAME_WIDTH - boxWidth) / 2;
    const boxY = 100;

    this.ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
    this.ctx.strokeStyle = '#ff00ff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    this.ctx.fill();
    this.ctx.stroke();

    const platforms = [
      { color: '#4a9eff', name: 'SOLID', desc: 'Regular safe platforms' },
      { color: '#ff6b9d', name: 'BOUNCE', desc: 'Springs you high into the air!' },
      { color: '#88ddff', name: 'ICE', desc: 'Slippery! Hard to stop' },
      { color: '#ff4400', name: 'LAVA', desc: 'Deadly! Avoid at all costs' },
      { color: '#aa8866', name: 'CRUMBLE', desc: 'Falls apart after you land' },
      { color: '#9966ff', name: 'MOVING', desc: 'Watch the pattern!' },
      { color: '#66ffaa', name: 'PHASE', desc: 'Appears and disappears' },
      { color: '#48bb78', name: 'CONVEYOR', desc: 'Moves you left or right' },
      { color: '#ed64a6', name: 'GRAVITY', desc: 'Flips your gravity!' },
      { color: '#ecc94b', name: 'STICKY', desc: 'Slows you down. Jump to escape!' },
    ];

    const cols = 2;
    const itemW = boxWidth / cols - 30;
    let col = 0;
    let row = 0;
    const startY = boxY + 40;
    const rowHeight = 36;

    for (const p of platforms) {
      const x = boxX + 20 + col * (itemW + 20);
      const y = startY + row * rowHeight;

      // Color square
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(x, y - 10, 16, 16);

      // Name
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(p.name, x + 22, y + 2);

      // Desc
      this.ctx.font = '11px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.fillText(p.desc, x + 85, y + 2);

      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    }
    this.ctx.textAlign = 'center';
  }

  private renderTutorialPowerUps(): void {
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.shadowColor = '#ffcc00';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('POWER-UPS', GAME_WIDTH / 2, 80);

    const boxWidth = 480;
    const boxHeight = 280;
    const boxX = (GAME_WIDTH - boxWidth) / 2;
    const boxY = 100;

    this.ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
    this.ctx.strokeStyle = '#ffcc00';
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    this.ctx.fill();
    this.ctx.stroke();

    const powerups = [
      { icon: '🛡️', color: '#00aaff', name: 'SHIELD', desc: 'Survive one hit from any hazard' },
      { icon: '🧲', color: '#ff00ff', name: 'MAGNET', desc: 'Attracts nearby coins automatically' },
      { icon: '⏱️', color: '#00ff88', name: 'SLOW-MO', desc: 'Slows down time for better control' },
      { icon: '✨', color: '#ffcc00', name: '2X POINTS', desc: 'Double points from coins!' },
    ];

    let y = boxY + 55;
    for (const p of powerups) {
      // Icon and box
      this.ctx.fillStyle = p.color + '33';
      this.ctx.beginPath();
      this.ctx.roundRect(boxX + 20, y - 25, 440, 50, 8);
      this.ctx.fill();

      this.ctx.font = '28px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(p.icon, boxX + 55, y + 5);

      this.ctx.textAlign = 'left';
      this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
      this.ctx.fillStyle = p.color;
      this.ctx.fillText(p.name, boxX + 95, y - 3);

      this.ctx.font = '13px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText(p.desc, boxX + 95, y + 17);

      y += 60;
    }
    this.ctx.textAlign = 'center';

    // Hint
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('Power-ups appear as glowing orbs throughout levels!', GAME_WIDTH / 2, boxY + boxHeight + 30);
  }

  private renderTutorialTips(): void {
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ff88';
    this.ctx.shadowColor = '#00ff88';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('PRO TIPS', GAME_WIDTH / 2, 80);

    const boxWidth = 500;
    const boxHeight = 340;
    const boxX = (GAME_WIDTH - boxWidth) / 2;
    const boxY = 100;

    this.ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    this.ctx.fill();
    this.ctx.stroke();

    const tips = [
      { icon: '🎵', tip: 'Time your jumps to the beat for better rhythm!' },
      { icon: '💰', tip: 'Collecting coins quickly builds combos for bonus points' },
      { icon: '⚡', tip: 'Dash through tight gaps and over small hazards' },
      { icon: '👀', tip: 'Watch for moving platforms - learn their patterns' },
      { icon: '🏆', tip: 'Practice mode lets you restart from checkpoints' },
      { icon: '🎮', tip: 'Create and share your own levels in the editor!' },
      { icon: '📅', tip: 'Complete daily challenges for streak bonuses' },
      { icon: '⚙️', tip: 'Try difficulty modifiers for extra challenge!' },
    ];

    let y = boxY + 45;
    for (const t of tips) {
      this.ctx.font = '20px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(t.icon, boxX + 35, y);

      this.ctx.textAlign = 'left';
      this.ctx.font = '14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.fillText(t.tip, boxX + 65, y);

      y += 38;
    }
    this.ctx.textAlign = 'center';

    // Ready message
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffaa';
    this.ctx.shadowColor = '#00ffaa';
    this.ctx.shadowBlur = 15;
    this.ctx.fillText("You're ready! Good luck!", GAME_WIDTH / 2, boxY + boxHeight + 35);
  }

  private dismissTutorial(): void {
    if (this.showingTutorial) {
      // If not on the last page, go to next page
      if (this.tutorialPage < Game.TUTORIAL_PAGES - 1) {
        this.tutorialPage++;
        this.audio.playSelect();
      } else {
        // On last page, close tutorial
        this.showingTutorial = false;
        this.tutorialPage = 0;
        this.save.markTutorialShown();
        this.audio.start();
      }
    }
  }

  private previousTutorialPage(): void {
    if (this.tutorialPage > 0) {
      this.tutorialPage--;
      this.audio.playSelect();
    }
  }

  private skipTutorial(): void {
    this.showingTutorial = false;
    this.tutorialPage = 0;
    this.save.markTutorialShown();
    this.audio.start();
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
