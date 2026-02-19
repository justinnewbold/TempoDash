import { GameState, CustomLevel, Achievement, GameSettings, WeatherType, MasteryBadge, LeaderboardEntry } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { InputManager } from '../systems/Input';
import { AudioManager } from '../systems/Audio';
import { SaveManager, LEVEL_UNLOCK_COSTS, PLAYER_SKINS } from '../systems/SaveManager';
import { CustomLevelManager, LevelTemplate } from '../systems/CustomLevelManager';
import { Player } from '../entities/Player';
import { Level } from '../levels/Level';
import { createLevel, TOTAL_LEVELS } from '../levels/index';
import { Platform } from '../entities/Platform';
import { Coin } from '../entities/Coin';
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
import { GhostManager, encodeReplay } from '../systems/GhostManager';
import { ScreenEffects } from '../systems/ScreenEffects';
import { BossManager } from '../systems/BossMode';
import { FlowMeterManager } from '../systems/FlowMeter';
import { BeatHazardManager, BeatHazardConfig } from '../systems/BeatHazards';
import { TimeRewindManager } from '../systems/TimeRewind';
import { GravityWellManager } from '../systems/GravityWells';

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
  private animationFrameId: number | null = null;

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
  private editorTestStartPosition: { x: number; y: number } | null = null;
  private customLevelScrollOffset = 0;
  private settingsScrollOffset = 0;
  private achievementsScrollOffset = 0;

  // Touch scrolling
  private touchStartY = 0;
  private lastTouchY = 0;
  private isTouchScrolling = false;

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

  // Speed increase system - each flip (any jump) increases speed by 1%
  private speedMultiplier = 1.0;
  private jumpCount = 0;
  private prevAirJumpsRemaining = 4; // Track air jumps for speed increase on flips
  private static readonly SPEED_INCREASE_PER_JUMP = 0.01; // 1%
  private static readonly MAX_SPEED_MULTIPLIER = 3.0; // Cap to prevent runaway speed

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
  private challengeCoins: Coin[] = [];
  private challengeCoinsCollected = 0;

  // Chase mode (wall of death)
  private chaseMode: ChaseModeManager;

  // Ghost racing
  private ghostManager: GhostManager;
  private showGhost = true;

  // Screen effects (freeze frames, zoom, chromatic aberration, etc.)
  private screenEffects: ScreenEffects;

  // Boss mode
  private bossManager: BossManager;

  // Flow Meter / Overdrive system
  private flowMeter: FlowMeterManager;

  // Beat-synced hazards
  private beatHazards: BeatHazardManager;
  private currentBeatNumber = 0;  // Track beat number for hazard patterns

  // Time Rewind system
  private timeRewind: TimeRewindManager;
  private isWaitingForRewindInput = false;  // True when player just died and can rewind
  private rewindInputWindow = 0;  // Time remaining to press rewind

  // Gravity Wells system
  private gravityWells: GravityWellManager;

  // Perfect run tracking
  private isPerfectRun = true; // No deaths this run

  // Level timing and stats
  private levelStartTime = 0;
  private levelElapsedTime = 0;
  private levelDeathCount = 0;

  // Speed Run Split Times
  private splitTimes: number[] = []; // Time at each checkpoint
  private bestSplitTimes: number[] = []; // Best times at each checkpoint
  private lastCheckpointIndex = 0;
  private splitDisplay: { time: number; diff: number; isAhead: boolean; timer: number } | null = null;

  // Encouragement System (after repeated deaths)
  private consecutiveDeaths = 0;
  private encouragementMessage: { text: string; subtext: string; timer: number } | null = null;
  private static readonly ENCOURAGEMENT_DURATION = 3000;

  // Level Completion Celebration
  private celebrationActive = false;
  private celebrationTimer = 0;
  private celebrationStars: { x: number; y: number; vx: number; vy: number; size: number; color: string; rotation: number }[] = [];
  private celebrationCoins: { x: number; y: number; targetX: number; targetY: number; progress: number }[] = [];

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
  private showingTemplateSelect = false;

  // Platform Encyclopedia
  private encyclopediaScrollOffset = 0;
  private encyclopediaAnimTime = 0;

  // Milestone Celebration System
  private milestoneQueue: { type: string; value: number; timer: number }[] = [];
  private currentMilestone: { type: string; value: number; timer: number } | null = null;
  private milestoneDuration = 1500; // 1.5 seconds display
  private lastComboMilestone = 0;
  private nearMissStreak = 0;
  private perfectLandingCount = 0;

  // Death Heatmap
  private showDeathHeatmap = false;
  private heatmapLevelId = 1;

  // Replay Sharing System
  private showReplayShare = false;
  private replayCode: string | null = null;
  private replayCopied = false;
  private replayCopyTimer = 0;

  // Adaptive Difficulty / Assist Mode
  private assistModeEnabled = false;
  private assistModeOffered = false;
  private static readonly ASSIST_OFFER_DEATHS = 5; // Offer assist after this many deaths
  private showAssistOffer = false;
  private assistCheckpointInterval = 0.1; // Auto-checkpoint every 10% progress

  // Rhythm Sync Visualizer
  private showBeatVisualizer = true;
  private beatIndicators: { time: number; intensity: number; x: number }[] = [];
  private lastBeatTime = 0;
  private beatAccuracy: { time: number; accuracy: 'perfect' | 'good' | 'miss'; timer: number }[] = [];
  private rhythmMultiplier = 1;
  private consecutiveOnBeatJumps = 0;
  private static readonly BEAT_PERFECT_WINDOW = 50; // ms
  private static readonly BEAT_GOOD_WINDOW = 150; // ms

  // Leaderboards
  private leaderboardLevelId = 1;

  // Level Mastery Badges
  private levelRhythmHits = 0;
  private levelRhythmTotal = 0;
  private newBadgesEarned: { badge: string; levelId: number }[] = [];
  private badgeNotificationTimer = 0;

  // Weather Effects
  private currentWeather: import('../types').WeatherType = 'clear';
  private weatherIntensity = 0;
  private weatherDirection = 0; // For wind: -1 left, 1 right
  private weatherParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
  private weatherEnabled = true;
  private fogOpacity = 0;
  private nightSpotlightRadius = 150;

  // Bound event handlers (stored for cleanup in destroy())
  private boundHandleResize: () => void;
  private boundHandleOrientationChange: () => void;
  private boundHandleBeforeUnload: () => void;
  private boundHandleVisibilityChange: () => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleKeyUp: (e: KeyboardEvent) => void;
  private boundHandleClick: (e: MouseEvent) => void;
  private boundHandleTouchStart: (e: TouchEvent) => void;
  private boundHandleTouchMove: (e: TouchEvent) => void;
  private boundHandleTouchEnd: (e: TouchEvent) => void;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;
  private boundHandleMouseDown: (e: MouseEvent) => void;
  private boundHandleWheel: (e: WheelEvent) => void;

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
    this.boundHandleResize = () => this.handleResize();
    this.boundHandleOrientationChange = () => {
      // Small delay to let the browser update dimensions
      setTimeout(() => this.handleResize(), 100);
    };
    this.boundHandleBeforeUnload = () => this.destroy();
    window.addEventListener('resize', this.boundHandleResize);
    window.addEventListener('orientationchange', this.boundHandleOrientationChange);

    // Clean up on page unload to prevent memory leaks
    window.addEventListener('beforeunload', this.boundHandleBeforeUnload);

    this.input = new InputManager();
    this.input.setCanvas(canvas);

    // Set up mobile UI exclusion zones and callback for button handling
    this.setupMobileUIExclusions();
    this.audio = new AudioManager();
    this.save = new SaveManager();
    this.customLevelManager = new CustomLevelManager();

    // Sync colorblind mode from settings
    Platform.setColorblindMode(this.save.getColorblindMode() !== 'normal');

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
    this.screenEffects = new ScreenEffects();
    this.bossManager = new BossManager();
    this.flowMeter = new FlowMeterManager();
    this.beatHazards = new BeatHazardManager();
    this.timeRewind = new TimeRewindManager();
    this.gravityWells = new GravityWellManager();

    // Setup tab visibility change detection for auto-pause
    this.boundHandleVisibilityChange = () => {
      if (document.hidden) {
        this.handleTabHidden();
      } else {
        this.handleTabVisible();
      }
    };
    document.addEventListener('visibilitychange', this.boundHandleVisibilityChange);

    // Apply saved settings
    const settings = this.save.getSettings();
    this.audio.setMusicVolume(settings.musicVolume);
    this.audio.setSfxVolume(settings.sfxVolume);
    this.showGhost = this.save.isShowGhostEnabled();
    this.showBeatVisualizer = this.save.isBeatVisualizerEnabled();
    this.assistModeEnabled = this.save.isAssistModeEnabled();

    this.loadLevel(1);

    // Setup keyboard
    this.boundHandleKeyDown = (e) => this.handleKeyDown(e);
    this.boundHandleKeyUp = (e) => this.handleKeyUp(e);
    window.addEventListener('keydown', this.boundHandleKeyDown);
    window.addEventListener('keyup', this.boundHandleKeyUp);

    // Setup click/touch for menus
    this.boundHandleClick = (e) => this.handleClick(e);
    canvas.addEventListener('click', this.boundHandleClick);

    // Touch support for scrolling
    this.boundHandleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.touchStartY = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);
        this.lastTouchY = this.touchStartY;
        this.isTouchScrolling = false;
      }
    };
    canvas.addEventListener('touchstart', this.boundHandleTouchStart, { passive: true });

    this.boundHandleTouchMove = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const currentY = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);
        const deltaY = this.lastTouchY - currentY;

        // Check if we've moved enough to consider this a scroll
        if (Math.abs(currentY - this.touchStartY) > 10) {
          this.isTouchScrolling = true;
        }

        if (this.isTouchScrolling) {
          e.preventDefault();
          this.handleTouchScroll(deltaY);
        }

        this.lastTouchY = currentY;
      }
    };
    canvas.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });

    // Touch support for menu navigation (click events unreliable on mobile)
    this.boundHandleTouchEnd = (e) => {
      // If we were scrolling, don't handle as a click
      const wasScrolling = this.isTouchScrolling;
      this.isTouchScrolling = false;

      if (wasScrolling) {
        e.preventDefault();
        return;
      }

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
    };
    canvas.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false });

    // Setup mouse events for editor
    this.boundHandleMouseMove = (e) => this.handleMouseMove(e);
    this.boundHandleMouseUp = (e) => this.handleMouseUp(e);
    this.boundHandleMouseDown = (e) => this.handleMouseDown(e);
    canvas.addEventListener('mousemove', this.boundHandleMouseMove);
    canvas.addEventListener('mouseup', this.boundHandleMouseUp);
    canvas.addEventListener('mousedown', this.boundHandleMouseDown);

    // Wheel events for scrolling
    this.boundHandleWheel = (e) => this.handleWheel(e);
    canvas.addEventListener('wheel', this.boundHandleWheel, { passive: false });

    // Setup beat callback
    this.audio.setBeatCallback((beat) => {
      if (beat % 2 === 0) {
        this.beatPulse = 1;
      }
      // Track beat timing for rhythm visualizer
      this.lastBeatTime = performance.now();
      this.currentBeatNumber = beat;

      // Add visual beat indicator (cap to prevent unbounded growth during freeze-frames)
      if (this.showBeatVisualizer && this.state.gameStatus === 'playing' && this.beatIndicators.length < 20) {
        this.beatIndicators.push({
          time: 1.0,
          intensity: 1.0,
          x: GAME_WIDTH - 60,
        });
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
    this.prevAirJumpsRemaining = 4;
    this.audio.resetGameSpeed();

    // Enable flying mode if level config specifies it
    const levelConfig = this.level.getConfig();
    this.player.setFlyingMode(levelConfig.flyingMode ?? false);

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

    // Initialize boss for boss levels (5, 10, 15)
    this.bossManager.initForLevel(levelId, this.level.playerStart.x);

    // Reset perfect run tracking and screen effects
    this.isPerfectRun = true;
    this.screenEffects.reset();
    this.screenEffects.setPerfectRun(true);

    // Set weather based on level (for visual variety)
    const weatherForLevel: Record<number, 'rain' | 'snow' | 'lightning' | 'none'> = {
      5: 'lightning',  // Boss level - dramatic lightning
      10: 'rain',      // Boss level - rain
      12: 'snow',      // Frost Fortress - snow
      15: 'lightning', // Ultimate Challenge - lightning
    };
    this.screenEffects.setWeather(weatherForLevel[levelId] || 'none', 0.8);

    // Initialize environmental weather effects
    this.initWeatherForLevel();

    // Initialize gravity wells from level config
    this.gravityWells.clear();
    const gravityWellConfigs = levelConfig.gravityWells;
    if (gravityWellConfigs) {
      for (const config of gravityWellConfigs) {
        this.gravityWells.addWell(config);
      }
    }

    // Reset rhythm tracking for mastery badges
    this.levelRhythmHits = 0;
    this.levelRhythmTotal = 0;
  }

  private handleWheel(e: WheelEvent): void {
    const scrollSpeed = 40;
    const delta = Math.sign(e.deltaY) * scrollSpeed;
    this.applyScroll(delta);
    if (this.state.gameStatus === 'customLevels' || this.state.gameStatus === 'settings' || this.state.gameStatus === 'achievements') {
      e.preventDefault();
    }
  }

  private handleTouchScroll(delta: number): void {
    this.applyScroll(delta);
  }

  private applyScroll(delta: number): void {
    switch (this.state.gameStatus) {
      case 'customLevels': {
        const levels = this.customLevelManager.getAllLevels();
        const rows = Math.ceil(levels.length / 3);
        const maxScroll = Math.max(0, rows * 135 - 300); // cardHeight + gap = 135, visible area ~300
        this.customLevelScrollOffset = Math.max(0, Math.min(maxScroll, this.customLevelScrollOffset + delta));
        break;
      }
      case 'settings': {
        const maxScroll = 150; // Settings content extends ~150px below visible area
        this.settingsScrollOffset = Math.max(0, Math.min(maxScroll, this.settingsScrollOffset + delta));
        break;
      }
      case 'achievements': {
        const maxScroll = 100; // Some buffer for achievements
        this.achievementsScrollOffset = Math.max(0, Math.min(maxScroll, this.achievementsScrollOffset + delta));
        break;
      }
      case 'platformGuide': {
        const maxScroll = 600; // Platform guide content is longer
        this.encyclopediaScrollOffset = Math.max(0, Math.min(maxScroll, this.encyclopediaScrollOffset + delta));
        break;
      }
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

    // Editor needs full mouse event for special handling
    if (this.state.gameStatus === 'editor') {
      this.handleEditorClick(e);
      return;
    }

    this.routeClickToHandler(x, y, e.shiftKey, false);
  }

  /**
   * Shared click routing logic for both mouse and touch events
   */
  private routeClickToHandler(x: number, y: number, shiftKey: boolean, _isTouch: boolean): void {
    switch (this.state.gameStatus) {
      case 'mainMenu':
        this.handleMainMenuClick(x, y);
        break;
      case 'levelSelect':
        this.handleLevelSelectClick(x, y, shiftKey);
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
      case 'platformGuide':
        this.handlePlatformGuideClick(x, y);
        break;
      case 'leaderboards':
        this.handleLeaderboardsClick(x, y);
        break;
      case 'paused':
        this.handlePausedClick(x, y);
        break;
      case 'editor':
        // Editor handled separately (needs full MouseEvent for mouse, TouchHandler for touch)
        break;
      case 'levelComplete':
        this.handleLevelCompleteClick(x, y);
        break;
      case 'gameOver':
        this.endlessDistance = 0;
        this.returnToMainMenu();
        break;
    }
  }

  private handleLevelCompleteClick(x: number, y: number): void {
    // Check replay share modal first
    if (this.showReplayShare) {
      if (this.handleReplayShareClick(x, y)) return;
      return; // Consume click when modal is open
    }

    // Check assist mode offer
    if (this.showAssistOffer) {
      if (this.handleAssistModeOfferClick(x, y)) return;
      return;
    }

    // Check share replay button
    const buttonX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT / 2 + 165;
    const buttonWidth = 160;
    const buttonHeight = 35;

    if (!this.isPracticeMode &&
        x >= buttonX - buttonWidth / 2 && x <= buttonX + buttonWidth / 2 &&
        y >= buttonY - buttonHeight / 2 && y <= buttonY + buttonHeight / 2) {
      this.audio.playSelect();
      this.generateReplayCode();
      return;
    }

    // Default: proceed to next level
    this.nextLevel();
  }

  private handleTouchMenuClick(x: number, y: number): void {
    // Handle mobile control buttons during gameplay
    if ((this.state.gameStatus === 'playing' || this.state.gameStatus === 'practice' || this.state.gameStatus === 'paused') && this.input.isMobileDevice()) {
      if (this.handleMobileControlClick(x, y)) {
        return;
      }
    }

    // Use shared click routing (no shift key on touch, skip editor mouse handling)
    this.routeClickToHandler(x, y, false, true);
  }

  private handleMainMenuClick(x: number, y: number): void {
    const centerX = GAME_WIDTH / 2;
    const buttonWidth = 200;
    const buttonHeight = 50;
    const smallButtonWidth = 105;
    const smallButtonHeight = 45;
    const colOffset = 58;
    const rowHeight = 55;

    // Helper to check if click is within a button
    const inButton = (bx: number, by: number, w: number, h: number) =>
      x >= bx - w / 2 && x <= bx + w / 2 && y >= by - h / 2 && y <= by + h / 2;

    // Play button (y=270)
    if (inButton(centerX, 270, buttonWidth, buttonHeight)) {
      this.audio.playSelect();
      this.state.gameStatus = 'levelSelect';
      return;
    }

    // Row 1 (y=325): Endless and Daily
    let rowY = 325;
    if (inButton(centerX - colOffset, rowY, smallButtonWidth, smallButtonHeight)) {
      this.audio.playSelect();
      this.startEndlessMode();
      return;
    }
    if (inButton(centerX + colOffset, rowY, smallButtonWidth, smallButtonHeight)) {
      this.audio.playSelect();
      this.state.gameStatus = 'challenges';
      return;
    }

    // Row 2 (y=380): Editor and My Levels
    rowY += rowHeight;
    if (inButton(centerX - colOffset, rowY, smallButtonWidth, smallButtonHeight)) {
      this.audio.playSelect();
      this.openEditor();
      return;
    }
    if (inButton(centerX + colOffset, rowY, smallButtonWidth, smallButtonHeight)) {
      this.audio.playSelect();
      this.customLevelScrollOffset = 0; // Reset scroll when entering
      this.state.gameStatus = 'customLevels';
      return;
    }

    // Row 3 (y=435): Skins and Badges
    rowY += rowHeight;
    if (inButton(centerX - colOffset, rowY, smallButtonWidth, smallButtonHeight)) {
      this.audio.playSelect();
      this.state.gameStatus = 'skins';
      return;
    }
    if (inButton(centerX + colOffset, rowY, smallButtonWidth, smallButtonHeight)) {
      this.audio.playSelect();
      this.achievementsScrollOffset = 0; // Reset scroll when entering
      this.state.gameStatus = 'achievements';
      return;
    }

    // Settings button (y=490)
    rowY += rowHeight;
    if (inButton(centerX, rowY, buttonWidth, buttonHeight)) {
      this.audio.playSelect();
      this.settingsScrollOffset = 0; // Reset scroll when entering
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

    // Handle death heatmap panel clicks
    if (this.showDeathHeatmap) {
      const panelX = 50;
      const panelY = 80;
      const panelW = GAME_WIDTH - 100;
      const panelH = 380;

      // Check if click is inside the panel
      if (x >= panelX && x <= panelX + panelW && y >= panelY && y <= panelY + panelH) {
        // Just consume the click if inside the panel
        return;
      } else {
        // Click outside panel - close it
        this.showDeathHeatmap = false;
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
      this.showDeathHeatmap = false; // Close heatmap if open
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
        this.showDeathHeatmap = false; // Close heatmap if open
        this.selectedSection = 0; // Reset section selection
        this.audio.playSelect();
        return;
      }

      // Death Heatmap button (only show if there are deaths recorded)
      const deathData = this.statistics.getDeathHeatmap(levelId);
      if (deathData.length > 0) {
        const heatBtnX = GAME_WIDTH / 2 - 80;
        const heatBtnY = secBtnY + 35;
        const heatBtnW = 160;
        const heatBtnH = 28;
        if (x >= heatBtnX && x <= heatBtnX + heatBtnW && y >= heatBtnY && y <= heatBtnY + heatBtnH) {
          this.showDeathHeatmap = !this.showDeathHeatmap;
          this.showSectionPractice = false; // Close section practice if open
          this.showModifierPanel = false; // Close modifiers if open
          this.heatmapLevelId = levelId;
          this.audio.playSelect();
          return;
        }
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
          Platform.setColorblindMode(modes[i].id !== 'normal');
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

    // Platform Guide button (left column)
    if (x >= leftColX - 45 && x <= leftColX + 45 && y >= 570 && y <= 600) {
      this.audio.playSelect();
      this.encyclopediaScrollOffset = 0;
      this.state.gameStatus = 'platformGuide';
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

      case 'leaderboards':
        if (e.code === 'Escape') {
          this.audio.playSelect();
          this.state.gameStatus = 'mainMenu';
        } else if (e.code === 'ArrowLeft' && this.leaderboardLevelId > 1) {
          this.leaderboardLevelId--;
          this.audio.playSelect();
        } else if (e.code === 'ArrowRight' && this.leaderboardLevelId < TOTAL_LEVELS) {
          this.leaderboardLevelId++;
          this.audio.playSelect();
        }
        break;

      case 'platformGuide':
        if (e.code === 'Escape') {
          this.audio.playSelect();
          this.state.gameStatus = 'settings';
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
          this.returnToMainMenu();
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
          this.returnToMainMenu();
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
    this.prevAirJumpsRemaining = 4;
      this.audio.resetGameSpeed();
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
    // Reset milestone tracking
    this.nearMissStreak = 0;
    this.perfectLandingCount = 0;
    this.lastComboMilestone = 0;
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

    // Reset split time tracking
    this.splitTimes = [];
    this.lastCheckpointIndex = 0;
    this.splitDisplay = null;
    // Load best split times for this level (stored in save data)
    this.bestSplitTimes = this.save.getBestSplitTimes?.(levelId) || [];

    // Reset encouragement and celebration
    this.consecutiveDeaths = 0;
    this.encouragementMessage = null;
    this.celebrationActive = false;
    this.celebrationTimer = 0;

    // Initialize BPM for beat visualization
    const config = this.level.getConfig();
    this.currentBPM = config.bpm || 128;
    this.beatTimer = 0;
    this.currentBeatNumber = 0;

    // Reset new systems for level
    this.flowMeter.reset();
    this.beatHazards.reset();
    this.timeRewind.reset();
    this.isWaitingForRewindInput = false;
    this.rewindInputWindow = 0;
    this.deathTimer = 0;

    // Reset milestone tracking for new level
    this.nearMissStreak = 0;
    this.perfectLandingCount = 0;
    this.lastComboMilestone = 0;
    this.milestoneQueue = [];
    this.currentMilestone = null;

    // Load beat hazards for this level (example hazards for demo)
    this.loadBeatHazardsForLevel(levelId);

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
      this.lastCheckpointProgress = sectionIndex / (checkpoints.length + 1);
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

  // Handle death respawn when rewind is not used
  private handleDeathRespawn(): void {
    this.deathTimer = 0;

    // Endless mode: go to game over instead of respawning
    if (this.isEndlessMode) {
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
      if (this.endlessDistance >= 1000) {
        this.tryUnlockAchievement('endless_1000');
      }

      this.isEndlessMode = false;
      this.state.gameStatus = 'gameOver';
      this.audio.stop();
      this.timeRewind.clearRecording();
      return;
    }

    if (this.isPracticeMode) {
      // Respawn at checkpoint
      this.player.reset({ x: this.checkpointX, y: this.checkpointY });
      this.cameraX = Math.max(0, this.checkpointX - 150);
    } else {
      // Regular respawn
      this.player.reset(this.level.playerStart);
      this.cameraX = 0;
    }
    this.attempts++;
    this.speedMultiplier = 1.0;
    this.jumpCount = 0;
    this.prevAirJumpsRemaining = 4;
    this.audio.setGameSpeedMultiplier(1.0);
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;
    this.timeRewind.clearRecording();
  }

  // Load beat-synced hazards for a level
  private loadBeatHazardsForLevel(levelId: number): void {
    this.beatHazards.reset();

    // Add example hazards for certain levels to demonstrate the system
    // These can be expanded or moved to level config files
    if (levelId >= 5) {
      // Level 5+: Add sawblades that alternate on beats 1,3 vs 2,4
      const hazards: BeatHazardConfig[] = [];

      // Get level width to place hazards
      const levelConfig = this.level.getConfig();
      const levelWidth = levelConfig.goal.x;

      // Place hazards throughout the level
      for (let x = 400; x < levelWidth - 200; x += 600) {
        if (Math.random() > 0.5) {
          hazards.push({
            type: 'sawblade',
            x: x,
            y: 280 + Math.random() * 100,
            width: 50,
            height: 50,
            pattern: [1, 0, 1, 0],  // Active on beats 1 and 3
            patternOffset: Math.floor(Math.random() * 4),
          });
        }
      }

      // Level 8+: Add lasers
      if (levelId >= 8) {
        for (let x = 600; x < levelWidth - 300; x += 800) {
          if (Math.random() > 0.6) {
            hazards.push({
              type: 'laser',
              x: x,
              y: 200,
              width: 20,
              height: 180,
              pattern: [1, 1, 0, 0, 1, 1, 0, 0],  // On for 2 beats, off for 2
              patternOffset: Math.floor(Math.random() * 8),
            });
          }
        }
      }

      // Level 10+: Add crushers
      if (levelId >= 10) {
        for (let x = 500; x < levelWidth - 400; x += 700) {
          if (Math.random() > 0.7) {
            hazards.push({
              type: 'crusher',
              x: x,
              y: 50,
              width: 80,
              height: 40,
              pattern: [1, 0, 0, 0],  // Slam on beat 1, retract on 2-4
              patternOffset: Math.floor(Math.random() * 4),
            });
          }
        }
      }

      this.beatHazards.loadHazards(hazards);
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

  private restartLevel(): void {
    // Check if we're in editor test mode
    if (this.state.gameStatus === 'editorTest' && this.editingLevel) {
      // Restart editor test level
      const config = this.customLevelManager.toLevelConfig(this.editingLevel);
      this.level = new Level(config);
      const startPosition = this.editorTestStartPosition || config.playerStart;
      this.player = new Player(startPosition);
      this.player.setSkin(this.save.getSelectedSkin());
      this.player.setFlyingMode(config.flyingMode ?? false);
      this.cameraX = Math.max(0, startPosition.x - GAME_WIDTH / 3);
      this.attempts = 1;
      this.levelScoreThisRun = 0;
      this.state.gameStatus = 'editorTest';
      this.audio.start();
      return;
    }

    // Restart current level from beginning
    this.loadLevel(this.state.currentLevel);
    this.attempts = 1;
    this.levelScoreThisRun = 0;
    this.checkpointX = this.level.playerStart.x;
    this.checkpointY = this.level.playerStart.y;
    this.lastCheckpointProgress = 0;

    // Reset systems that startLevel() resets but were missing here
    this.modifiers.resetForLevel();
    this.flowMeter.reset();
    this.beatHazards.reset();
    this.timeRewind.reset();
    this.isWaitingForRewindInput = false;
    this.rewindInputWindow = 0;
    this.deathTimer = 0;

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
    this.deathTimer = 0;
    this.isWaitingForRewindInput = false;

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

    // Safety limit to prevent infinite loops from NaN or zero-width platforms
    const MAX_ITERATIONS = 200;
    let iterations = 0;

    while (this.nextPlatformX < untilX && iterations < MAX_ITERATIONS) {
      iterations++;

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

      // Guard against NaN propagation from endlessDistance
      if (!isFinite(difficulty)) {
        this.nextPlatformX = untilX;
        break;
      }

      // Gap size (increases with difficulty)
      const minGap = 80 + difficulty * 40;
      const maxGap = 150 + difficulty * 80;
      const gap = minGap + Math.random() * (maxGap - minGap);

      // Platform width (decreases with difficulty)
      const minWidth = Math.max(80, 150 - difficulty * 50);
      const maxWidth = Math.max(minWidth, 250 - difficulty * 80);
      const width = Math.max(40, minWidth + Math.random() * (maxWidth - minWidth));

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

      const newX = x + width;
      // Ensure forward progress to prevent infinite loop
      if (!isFinite(newX) || newX <= this.nextPlatformX) {
        this.nextPlatformX += 200;
      } else {
        this.nextPlatformX = newX;
      }
    }
  }

  private respawnPlayer(): void {
    this.attempts++;
    this.consecutiveDeaths++;
    this.levelDeathCount++;

    // Show encouragement message after repeated deaths
    if (this.consecutiveDeaths >= 3) {
      this.showEncouragementMessage();
    }

    // Check if we should offer assist mode
    this.checkAssistModeOffer();

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
    this.prevAirJumpsRemaining = 4;
    this.audio.resetGameSpeed();

    if (this.state.gameStatus === 'editorTest' && this.editingLevel) {
      // Respawn in editor test mode - reload editor level
      const config = this.customLevelManager.toLevelConfig(this.editingLevel);
      this.level = new Level(config);
      const startPosition = this.editorTestStartPosition || config.playerStart;
      this.player = new Player(startPosition);
      this.player.setSkin(this.save.getSelectedSkin());
      this.player.setFlyingMode(config.flyingMode ?? false);
      this.cameraX = Math.max(0, startPosition.x - GAME_WIDTH / 3);
      this.state.gameStatus = 'editorTest';
    } else if (this.isPracticeMode && this.lastCheckpointProgress > 0) {
      // Respawn at checkpoint
      this.player.reset({ x: this.checkpointX, y: this.checkpointY });
      this.cameraX = Math.max(0, this.checkpointX - 150);
      this.state.gameStatus = 'practice';
    } else {
      // Normal respawn at level start
      this.loadLevel(this.state.currentLevel);
      this.state.gameStatus = this.isPracticeMode ? 'practice' : 'playing';
    }
  }

  // Safely transition to the main menu, resetting all gameplay state
  private returnToMainMenu(): void {
    this.state.gameStatus = 'mainMenu';
    this.isEndlessMode = false;
    this.isPracticeMode = false;
    this.currentChallenge = null;
    this.deathTimer = 0;
    this.isWaitingForRewindInput = false;
    this.rewindInputWindow = 0;
    this.screenEffects.reset();
    this.audio.stop();
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    try {
      const currentTime = performance.now();
      const rawDeltaTime = Math.min(currentTime - this.lastTime, 50);
      this.lastTime = currentTime;

      // Update screen effects with raw time (so animations always play)
      this.screenEffects.update(rawDeltaTime);

      // Get gameplay delta (0 during freeze-frame, scaled during slow-mo)
      const deltaTime = this.screenEffects.getEffectiveDelta(rawDeltaTime);

      this.update(deltaTime);
      this.render();
    } catch (e) {
      console.error('Game loop error:', e);
      // Recover: reset to a safe state if the game is broken
      try {
        this.state.gameStatus = 'mainMenu';
        this.isEndlessMode = false;
        this.isPracticeMode = false;
        this.isWaitingForRewindInput = false;
        this.deathTimer = 0;
      } catch {
        // Last resort: at least keep the loop alive
      }
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * Clean up resources when game is destroyed
   * Call this when removing the game from the page
   */
  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.audio.stop();
    this.input.destroy();

    // Remove all event listeners to prevent memory leaks
    window.removeEventListener('resize', this.boundHandleResize);
    window.removeEventListener('orientationchange', this.boundHandleOrientationChange);
    window.removeEventListener('beforeunload', this.boundHandleBeforeUnload);
    document.removeEventListener('visibilitychange', this.boundHandleVisibilityChange);
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
    this.canvas.removeEventListener('click', this.boundHandleClick);
    this.canvas.removeEventListener('touchstart', this.boundHandleTouchStart);
    this.canvas.removeEventListener('touchmove', this.boundHandleTouchMove);
    this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd);
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.removeEventListener('mouseup', this.boundHandleMouseUp);
    this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
    this.canvas.removeEventListener('wheel', this.boundHandleWheel);
  }

  private update(deltaTime: number): void {
    // Update debug frame timing
    this.debug.beginUpdate();

    // Update new systems (screenEffects is updated in gameLoop with raw delta)
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

    // Update menu animation (wrap to prevent precision loss after long sessions)
    this.menuAnimation += deltaTime / 1000;
    if (this.menuAnimation > 1000) {
      this.menuAnimation -= 1000;  // Keep cycling smoothly
    }

    // Update achievement notifications
    this.updateAchievementNotifications(deltaTime);

    // Update milestone celebrations
    this.updateMilestones(deltaTime);

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

    // Update beat indicators for rhythm visualizer
    this.updateBeatIndicators(deltaTime);

    // Decay replay copy notification
    if (this.replayCopied && this.replayCopyTimer > 0) {
      this.replayCopyTimer -= deltaTime;
      if (this.replayCopyTimer <= 0) {
        this.replayCopied = false;
      }
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

    // Update encouragement messages
    this.updateEncouragementMessage(deltaTime);

    // Update level completion celebration
    this.updateCelebration(deltaTime);

    // Update badge notifications
    this.updateBadgeNotification(deltaTime);

    // Update weather effects
    if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'practice') {
      this.updateWeather(deltaTime);
      this.applyWeatherPhysics(deltaTime);
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

    // Update challenge coins
    if (this.state.gameStatus === 'challengePlaying') {
      for (const coin of this.challengeCoins) {
        coin.update(deltaTime);
      }
    }

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
    const prevAirJumps = this.prevAirJumpsRemaining;

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

    // Cache active platforms once per frame to avoid repeated filtering
    const activePlatforms = this.isEndlessMode ? this.endlessPlatforms : this.level.getActivePlatforms();

    // Update beat timer and rhythm lock state BEFORE player update (affects platform.isCollidable())
    this.beatTimer += deltaTime;
    const safeBPM = this.currentBPM > 0 && isFinite(this.currentBPM) ? this.currentBPM : 128;
    const beatInterval = 60000 / safeBPM; // ms per beat
    if (this.beatTimer >= beatInterval) {
      this.beatTimer -= beatInterval;
      this.currentBeatNumber++;
      // Trigger beat pulse on all platforms
      for (const platform of activePlatforms) {
        platform.triggerBeatPulse();
      }
      // Check for on-beat jump (for Flow Meter and Rhythm Visualizer)
      if (inputState.jumpPressed) {
        this.flowMeter.onOnBeatJump();
        this.onPlayerJump();
      }
    } else if (inputState.jumpPressed) {
      // Track off-beat jumps too for rhythm feedback
      this.onPlayerJump();
    }
    const beatProgress = this.beatTimer / beatInterval; // 0-1 position in beat cycle
    Platform.updateBeatSolidity(beatProgress);
    Platform.setRhythmLockEnabled(this.modifiers.isRhythmLockMode());

    // Update beat hazards
    this.beatHazards.update(deltaTime, this.currentBeatNumber);

    // Update flow meter
    this.flowMeter.update(deltaTime);

    // Update time rewind (handle rewind in progress)
    if (this.timeRewind.isInRewind()) {
      const rewindResult = this.timeRewind.update(deltaTime);
      if (rewindResult) {
        // Rewind complete - restore player state
        this.player.x = rewindResult.x;
        this.player.y = rewindResult.y;
        this.player.velocityY = rewindResult.velocityY;
        this.cameraX = rewindResult.cameraX;
        this.player.isDead = false;
        this.isWaitingForRewindInput = false;
        // Play rewind complete sound
        this.audio.playCheckpoint();
        this.screenEffects.triggerZoomPulse(1.1, 200);
      }
      return; // Skip normal update during rewind
    }

    // Handle rewind input window after death
    if (this.isWaitingForRewindInput) {
      this.rewindInputWindow -= deltaTime;
      if (this.rewindInputWindow <= 0) {
        this.isWaitingForRewindInput = false;
        // Time's up - do normal death respawn
        this.handleDeathRespawn();
      } else if (inputState.dashPressed && this.timeRewind.canRewind()) {
        // Player pressed dash to trigger rewind
        this.timeRewind.startRewind();
        this.audio.playSelect();
        return;
      }
      return; // Wait for input during rewind window
    }

    // Record player state for time rewind
    this.timeRewind.recordFrame(
      this.player.x,
      this.player.y,
      this.player.velocityY,
      this.player.getRotation(),
      this.cameraX
    );

    // Handle Overdrive activation (press dash when meter is full)
    if (inputState.dashPressed && this.flowMeter.isMeterFull() && !this.flowMeter.isInOverdrive()) {
      if (this.flowMeter.activateOverdrive()) {
        this.audio.playLevelComplete(); // Dramatic sound
        this.screenEffects.triggerBeatDrop(500);
        this.screenEffects.triggerZoomPulse(1.2, 300);
        this.particles.spawnFireworkShow(this.player.x, this.player.y - 50, 5);
      }
    }

    // In endless mode, use procedural platforms
    if (this.isEndlessMode) {
      this.player.update(deltaTime, inputState, this.endlessPlatforms, effectiveSpeedMultiplier, allowAirJumps);

      // Update distance
      this.endlessDistance = Math.max(this.endlessDistance, Math.floor(this.player.x / 10));

      // Generate more platforms ahead
      this.generateEndlessPlatforms(this.cameraX + 1500);

      // Clean up platforms behind camera using in-place removal to avoid array allocation
      const cleanupThreshold = this.cameraX - 200;
      let writeIdx = 0;
      for (let i = 0; i < this.endlessPlatforms.length; i++) {
        const p = this.endlessPlatforms[i];
        if (p.x + p.width > cleanupThreshold) {
          this.endlessPlatforms[writeIdx++] = p;
        }
      }
      this.endlessPlatforms.length = writeIdx;
    } else {
      this.player.update(deltaTime, inputState, activePlatforms, effectiveSpeedMultiplier, allowAirJumps);
    }

    // Handle player particle events
    if (this.player.edgeBounceEvent) {
      this.particles.spawnEdgeBounce(
        this.player.edgeBounceEvent.x,
        this.player.edgeBounceEvent.y,
        this.player.edgeBounceEvent.direction
      );
      this.particles.spawnFloatingText(
        this.player.x + this.player.width / 2,
        this.player.y - 10,
        'EDGE SAVE!',
        '#ffff00',
        18
      );
      // Screen effect for dramatic moment
      this.screenEffects.triggerZoomPulse(1.08, 200);
      this.screenEffects.triggerFreezeFrame(4); // Brief hitstop for edge save
      this.audio.playSelect(); // Feedback sound
    }
    if (this.player.bounceEvent) {
      this.particles.spawnBounceEffect(
        this.player.bounceEvent.x,
        this.player.bounceEvent.y,
        this.player.bounceEvent.width
      );
      this.statistics.recordBounce();
    }
    if (this.player.wallSlideEvent) {
      this.particles.spawnWallSparks(
        this.player.wallSlideEvent.x,
        this.player.wallSlideEvent.y,
        this.player.wallSlideEvent.side
      );
    }
    if (this.player.gravityFlipEvent) {
      this.particles.spawnGravityFlip(
        this.player.gravityFlipEvent.x,
        this.player.gravityFlipEvent.y,
        this.player.gravityFlipEvent.flipped
      );
    }
    this.player.clearEvents();

    // Trigger dash shake, sound, and Flow Meter update
    if (!wasDashing && this.player.isDashing) {
      this.triggerShake(4, 80); // Light shake on dash start
      this.audio.playDash();
      this.flowMeter.onDash();
      this.statistics.recordDash();
    }

    // Play landing sound when player touches ground
    if (this.player.landingEvent) {
      this.audio.playLanding();
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

      // Update boss for boss levels
      if (this.bossManager.isActive() && !this.player.isDead) {
        const levelProgress = this.level.getProgress(this.player.x);
        const bossResult = this.bossManager.update(
          deltaTime,
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2,
          levelProgress
        );

        // Check if boss hit the player
        if (bossResult.hitPlayer) {
          this.player.isDead = true;
          this.triggerShake(15, 400);
          this.screenEffects.triggerChromaticAberration(15);
        }

        // Boss warning flash
        if (bossResult.warning) {
          this.screenEffects.triggerFlash('#ff0000', 0.1);
        }
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

    // Apply assist mode auto-checkpoints
    if (this.assistModeEnabled && !this.player.isDead) {
      this.applyAssistModeCheckpoint();
    }

    // Update ghost playback
    this.ghostManager.update(deltaTime);

    // Check secret platform reveals
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    for (const platform of activePlatforms) {
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

      // Attract level coins
      for (const coin of this.level.coins) {
        if (coin.collected) continue;

        const dx = playerCenterX - coin.x;
        const dy = playerCenterY - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < magnetRange) {
          coin.attractToward(playerCenterX, playerCenterY, 400, deltaTime);
        }
      }

      // Attract challenge coins
      if (this.state.gameStatus === 'challengePlaying') {
        for (const coin of this.challengeCoins) {
          if (coin.collected) continue;

          const dx = playerCenterX - coin.x;
          const dy = playerCenterY - coin.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < magnetRange) {
            coin.attractToward(playerCenterX, playerCenterY, 400, deltaTime);
          }
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
    for (const platform of activePlatforms) {
      if (platform.type === 'spike' || platform.type === 'lava') {
        const platBounds = platform.getBounds();
        const dx = Math.max(0, Math.max(platBounds.x - (playerBounds.x + playerBounds.width), playerBounds.x - (platBounds.x + platBounds.width)));
        const dy = Math.max(0, Math.max(platBounds.y - (playerBounds.y + playerBounds.height), playerBounds.y - (platBounds.y + platBounds.height)));
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < nearMissDistance && distance > 0 && this.nearMissTimer <= 0) {
          // Near miss! Add to combo and Flow Meter
          this.nearMissCount++;
          this.nearMissStreak++;
          this.comboCount += 1;
          this.comboTimer = this.comboDuration;
          this.flowMeter.onNearMiss();
          this.comboDisplayTimer = 400;
          this.nearMissTimer = 500; // Cooldown to prevent spam
          this.comboMeterPulse = 1;

          // Trigger milestone celebration for near-miss streaks
          if (this.nearMissStreak === 3) {
            this.triggerMilestone('nearmiss', 3);
          } else if (this.nearMissStreak === 5) {
            this.triggerMilestone('nearmiss', 5);
          } else if (this.nearMissStreak === 10) {
            this.triggerMilestone('nearmiss', 10);
            this.tryUnlockAchievement('near_miss_pro');
          }

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

      // Update Flow Meter for coin collection
      for (let i = 0; i < coinsCollected; i++) {
        this.flowMeter.onCoinCollect();
      }

      // Apply double points multiplier from power-up AND combo multiplier
      // Also apply Overdrive 3x multiplier if active
      const overdriveMultiplier = this.flowMeter.getScoreMultiplier();
      const pointsMultiplier = this.powerUps.getPointsMultiplier() * overdriveMultiplier;
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

      // Check combo achievements and trigger zoom pulses on milestones
      const prevCombo = this.comboCount - coinsCollected;
      if (prevCombo < 5 && this.comboCount >= 5) {
        this.tryUnlockAchievement('combo_5');
        this.screenEffects.triggerZoomPulse(1.05, 150);
        this.flowMeter.onComboMilestone(5);
        this.triggerMilestone('combo', 5);
      }
      if (prevCombo < 10 && this.comboCount >= 10) {
        this.tryUnlockAchievement('combo_10');
        this.screenEffects.triggerZoomPulse(1.08, 150);
        this.flowMeter.onComboMilestone(10);
        this.screenEffects.triggerChromaticAberration(4);
        this.triggerMilestone('combo', 10);
      }
      if (prevCombo < 15 && this.comboCount >= 15) {
        this.screenEffects.triggerZoomPulse(1.1, 200);
        this.screenEffects.triggerBeatDrop(300);
        this.triggerMilestone('combo', 15);
      }
      if (prevCombo < 20 && this.comboCount >= 20) {
        this.tryUnlockAchievement('combo_20');
        this.screenEffects.triggerZoomPulse(1.12, 200);
        this.particles.spawnFirework(this.player.x, this.player.y - 50);
        this.triggerMilestone('combo', 20);
      }
      if (prevCombo < 25 && this.comboCount >= 25) {
        this.screenEffects.triggerZoomPulse(1.15, 300);
        this.screenEffects.triggerBeatDrop(500);
        this.particles.spawnFireworkShow(this.player.x, this.player.y - 50, 3);
        this.triggerMilestone('combo', 25);
      }

      // Update longest combo
      this.save.updateLongestCombo(this.comboCount);
    }

    // Check challenge coin collection (Coin Rush mode)
    if (this.state.gameStatus === 'challengePlaying' && this.challengeCoins.length > 0) {
      const playerBounds = this.player.getBounds();
      let challengeCollected = 0;
      let magnetCoinCollected = false;

      for (const coin of this.challengeCoins) {
        if (coin.checkCollision(playerBounds)) {
          coin.collect();
          this.challengeCoinsCollected++;
          challengeCollected++;

          if (coin.isMagnet) {
            magnetCoinCollected = true;
          }
        }
      }

      if (challengeCollected > 0) {
        this.audio.playCoinCollect();
        this.input.triggerHaptic('light');

        // Update Flow Meter
        for (let i = 0; i < challengeCollected; i++) {
          this.flowMeter.onCoinCollect();
        }

        // Apply multipliers
        const overdriveMultiplier = this.flowMeter.getScoreMultiplier();
        const pointsMultiplier = this.powerUps.getPointsMultiplier() * overdriveMultiplier;
        const effectiveCoins = Math.floor(challengeCollected * pointsMultiplier * this.comboMultiplier);

        this.challengeScore += effectiveCoins * 100;
        this.comboCount += challengeCollected;
        this.comboTimer = this.comboDuration;
        this.comboDisplayTimer = 500;
        this.comboMeterPulse = 1;

        if (this.comboMultiplier > 1 || pointsMultiplier > 1) {
          this.particles.spawnFloatingText(
            this.player.x + this.player.width / 2,
            this.player.y - 40,
            `+${effectiveCoins * 100}`,
            '#ffd700'
          );
        }

        // Spawn collection particles
        this.particles.spawnCoinCollect(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2
        );
      }

      // Activate magnet powerup when magnet coin is collected (5 seconds)
      if (magnetCoinCollected) {
        this.powerUps.activatePowerUp('magnet');
        this.particles.spawnFloatingText(
          this.player.x + this.player.width / 2,
          this.player.y - 60,
          'MAGNET!',
          '#ff00ff'
        );
        this.screenEffects.triggerZoomPulse(1.08, 150);
      }
    }

    // Check gem collection (rare collectibles worth big points)
    if (!this.isEndlessMode) {
      const gemValues = this.level.checkGemCollection(this.player);
      if (gemValues.length > 0) {
        for (const value of gemValues) {
          this.state.score += value;
          this.levelScoreThisRun += value;
          this.audio.playCoinCollect();
          this.input.triggerHaptic('medium');

          // Big floating text for gem collection
          this.particles.spawnFloatingText(
            this.player.x + this.player.width / 2,
            this.player.y - 50,
            `GEM +${value}`,
            value >= 2000 ? '#34d399' : value >= 1000 ? '#60a5fa' : '#ff4466',
            20
          );

          // Dramatic screen effects for gems
          this.screenEffects.triggerZoomPulse(1.1, 200);
          this.particles.spawnFirework(this.player.x, this.player.y - 30);

          // Gems add to combo
          this.comboCount += 3;
          this.comboTimer = this.comboDuration;
          this.comboMeterPulse = 1;
          this.flowMeter.onCoinCollect();
        }
      }
    }

    // Check portal teleportation
    if (!this.isEndlessMode && !this.player.isDead) {
      const linkedPortal = this.level.checkPortalTeleport(this.player);
      if (linkedPortal) {
        // Teleport player to linked portal position
        this.player.x = linkedPortal.x - this.player.width / 2;
        this.player.y = linkedPortal.y - this.player.height / 2;

        // Visual and audio feedback
        this.audio.playSelect();
        this.input.triggerHaptic('medium');
        this.screenEffects.triggerZoomPulse(1.15, 250);
        this.particles.spawnFirework(linkedPortal.x, linkedPortal.y);
        this.particles.spawnFloatingText(
          linkedPortal.x,
          linkedPortal.y - 40,
          'TELEPORT!',
          '#8b5cf6',
          18
        );
      }
    }

    // Update gravity wells and apply forces to player
    if (!this.isEndlessMode && !this.player.isDead) {
      this.gravityWells.update(deltaTime);
      const playerCenterX2 = this.player.x + this.player.width / 2;
      const playerCenterY2 = this.player.y + this.player.height / 2;
      const gravForce = this.gravityWells.applyForces(playerCenterX2, playerCenterY2, deltaTime);
      if (gravForce.fx !== 0 || gravForce.fy !== 0) {
        this.player.x += gravForce.fx;
        this.player.velocityY += gravForce.fy;
      }
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

    // Helper to increase speed on any flip (ground or air jump)
    const applyFlipSpeedIncrease = () => {
      this.jumpCount++;
      const speedIncrease = Game.SPEED_INCREASE_PER_JUMP * this.getAssistModeSpeedMultiplier();
      this.speedMultiplier = Math.min(
        this.speedMultiplier * (1 + speedIncrease),
        Game.MAX_SPEED_MULTIPLIER
      );
      // Sync music tempo with game speed
      this.audio.setGameSpeedMultiplier(this.speedMultiplier);
    };

    // Ground jump - leaving the ground
    if (wasGroundedBefore && !this.player.isGrounded && !this.player.isDead) {
      this.audio.playJump();
      applyFlipSpeedIncrease();

      // Spawn jump dust particles
      const jumpX = this.player.x + this.player.width / 2;
      const jumpY = this.player.y + this.player.height;
      this.particles.spawnJumpDust(jumpX, jumpY);
    }

    // Air jump - speed increase on every flip, not just landed jumps
    const currentAirJumps = this.player.getAirJumpsRemaining();
    if (currentAirJumps < prevAirJumps && !this.player.isDead) {
      this.audio.playAirJump();
      applyFlipSpeedIncrease();
    }
    this.prevAirJumpsRemaining = currentAirJumps;

    // Landing dust when player hits ground
    if (!wasGroundedBefore && this.player.isGrounded && !this.player.isDead) {
      const landX = this.player.x + this.player.width / 2;
      const landY = this.player.y + this.player.height;

      // Perfect landing for Flow Meter
      this.flowMeter.onPerfectLanding();

      // Track perfect landings for milestones
      this.perfectLandingCount++;
      if (this.perfectLandingCount === 10) {
        this.triggerMilestone('landing', 10);
      } else if (this.perfectLandingCount === 25) {
        this.triggerMilestone('landing', 25);
      } else if (this.perfectLandingCount === 50) {
        this.triggerMilestone('landing', 50);
      }

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

    // Check beat hazard collisions
    if (!this.player.isDead && !this.flowMeter.isInOverdrive()) {
      if (this.beatHazards.checkCollisions(this.player.getBounds())) {
        this.player.isDead = true;
      }
    }

    if (wasAliveBefore && this.player.isDead) {
      // Check if Overdrive makes player invincible
      if (this.flowMeter.isInOverdrive()) {
        // Overdrive saves the player!
        this.player.isDead = false;
        this.player.revive();
        this.audio.playCoinCollect();
        this.particles.spawnFloatingText(
          this.player.x + this.player.width / 2,
          this.player.y - 30,
          'OVERDRIVE!',
          '#ffff00',
          18
        );
      }
      // Check if shield can save the player (disabled by fragile modifier)
      else if (!this.modifiers.isShieldDisabled() && this.powerUps.consumeShield()) {
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
        // No shield - player dies (but can rewind!)
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

        // NEW: Screen effects for death
        this.screenEffects.triggerFreezeFrame(4); // Freeze for impact
        this.screenEffects.triggerKillCam(playerCenterX, playerCenterY, 600); // Slow-mo kill cam
        this.screenEffects.triggerChromaticAberration(10);

        // Mark perfect run as failed
        this.isPerfectRun = false;
        this.screenEffects.setPerfectRun(false);

        // Track death for statistics and achievements
        this.statistics.recordDeath(this.state.currentLevel, this.player.x, this.player.y);
        this.save.recordDeath();
        this.tryUnlockAchievement('first_death');

        // Increment level death count for star calculation
        this.levelDeathCount++;

        // Update Flow Meter on death
        this.flowMeter.onDeath();

        // Check if Time Rewind is available
        if (this.timeRewind.canRewind()) {
          this.isWaitingForRewindInput = true;
          this.rewindInputWindow = 1500; // 1.5 seconds to press rewind
          // Show rewind prompt
          this.particles.spawnFloatingText(
            playerCenterX,
            playerCenterY - 50,
            `PRESS DASH TO REWIND (${this.timeRewind.getRewindsRemaining()} left)`,
            '#00aaff',
            14
          );
        }
      }
    }

    // Decay checkpoint feedback timer
    if (this.checkpointFeedbackTimer > 0) {
      this.checkpointFeedbackTimer -= deltaTime;
    }

    /// Horizontal scrolling: keep player near left of screen as they run right
    const targetCameraX = this.player.x - 150;
    this.cameraX = Math.max(0, targetCameraX);

    // Update checkpoints and split times (every 25% progress)
    const progress = this.level.getProgress(this.player.x);
    const checkpointInterval = 0.25;
    const currentCheckpointIndex = Math.floor(progress / checkpointInterval);

    // Track split times at each checkpoint (25%, 50%, 75%)
    if (currentCheckpointIndex > this.lastCheckpointIndex && currentCheckpointIndex < 4) {
      const splitTime = this.levelElapsedTime;
      this.splitTimes[currentCheckpointIndex - 1] = splitTime;

      // Compare to best split time
      const bestSplit = this.bestSplitTimes[currentCheckpointIndex - 1] || 0;
      if (bestSplit > 0) {
        const diff = splitTime - bestSplit;
        this.splitDisplay = {
          time: splitTime,
          diff: diff,
          isAhead: diff < 0,
          timer: 2000 // Show for 2 seconds
        };
      } else {
        // First time through - just show the time
        this.splitDisplay = {
          time: splitTime,
          diff: 0,
          isAhead: true,
          timer: 2000
        };
      }

      this.lastCheckpointIndex = currentCheckpointIndex;
      this.audio.playCheckpoint();
      this.input.triggerHaptic('medium');
      this.checkpointFeedbackTimer = 500;

      // Reset consecutive deaths - player is making progress!
      this.consecutiveDeaths = 0;
    }

    // Practice mode checkpoint saving
    if (this.isPracticeMode) {
      const currentCheckpoint = Math.floor(progress / checkpointInterval) * checkpointInterval;

      if (currentCheckpoint > this.lastCheckpointProgress && this.player.isGrounded) {
        this.checkpointX = this.player.x;
        this.checkpointY = this.player.y;
        this.lastCheckpointProgress = currentCheckpoint;
      }
    }

    // Update split display timer
    if (this.splitDisplay) {
      this.splitDisplay.timer -= deltaTime;
      if (this.splitDisplay.timer <= 0) {
        this.splitDisplay = null;
      }
    }

    if (this.player.isDead && !this.isWaitingForRewindInput) {
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
          if (this.endlessDistance >= 1000) {
            this.tryUnlockAchievement('endless_1000');
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

    if (!this.player.isDead && this.level.checkGoal(this.player)) {
      if (!this.isPracticeMode) {
        // Calculate score based on attempts and coins (only in normal mode)
        const baseScore = 1000;
        const attemptPenalty = (this.attempts - 1) * 50;
        const coinBonus = this.level.coinsCollected * 100;
        const gemBonus = this.levelScoreThisRun; // Preserve accumulated gem points
        const rawScore = Math.max(baseScore - attemptPenalty, 100) + coinBonus + gemBonus;

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

      // Save best split times
      if (this.splitTimes.length > 0) {
        this.save.setBestSplitTimes(this.state.currentLevel, this.splitTimes);
      }

      this.state.gameStatus = 'levelComplete';
      this.audio.fadeOut(300); // Smooth fade out
      this.audio.playLevelComplete();
      this.input.triggerHapticPattern([30, 50, 30, 50, 100]); // Victory haptic pattern

      // Start level celebration animation
      this.startLevelCelebration();

      // Victory screen effects
      this.screenEffects.triggerVictoryZoom();

      // Defeat boss if on boss level
      this.bossManager.defeatBoss();

      // Fireworks for level complete (extra for perfect run!)
      const fireworkCount = this.isPerfectRun ? 10 : 5;
      this.particles.spawnFireworkShow(GAME_WIDTH / 2, GAME_HEIGHT / 3, fireworkCount);

      // Extra confetti for perfect run
      if (this.isPerfectRun) {
        this.particles.spawnConfetti(0, 0, GAME_WIDTH);
        this.screenEffects.triggerFlash('#ffd700', 0.3); // Golden flash
      }

      // Add to leaderboard
      this.addToLeaderboard();

      // Check and award mastery badges
      this.checkMasteryBadges();
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

    // Apply screen effects pre-render (zoom, etc.) - pairs with renderPostEffects restore
    this.screenEffects.applyPreRender(this.ctx);

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

      // Render challenge coins
      for (const coin of this.challengeCoins) {
        coin.render(this.ctx, this.cameraX);
      }

      this.player.render(this.ctx, this.cameraX);

      // Render shield effect around player if active
      if (this.powerUps.hasShield()) {
        const pb = this.player.getBounds();
        this.powerUps.renderShieldEffect(this.ctx, pb.x - this.cameraX, pb.y, pb.width, pb.height);
      }

      this.particles.render(this.ctx, this.cameraX);
      this.powerUps.renderUI(this.ctx);
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

        // Render boss if on boss level
        this.bossManager.render(this.ctx, this.cameraX);

        // Render beat-synced hazards
        this.beatHazards.render(this.ctx, this.cameraX);

        // Render gravity wells
        this.gravityWells.render(this.ctx, this.cameraX);

        // Render time rewind effect if active
        if (this.timeRewind.isInRewind()) {
          this.timeRewind.render(this.ctx, this.cameraX, this.player.width, this.player.height);
        }

        // Render Overdrive visual effect
        if (this.flowMeter.isInOverdrive()) {
          this.renderOverdriveEffect();
        }

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

    // Screen effects post-processing (vignette, weather, etc.)
    this.screenEffects.renderPostEffects(this.ctx);

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
      case 'platformGuide':
        this.renderPlatformGuide();
        break;
      case 'leaderboards':
        this.renderLeaderboards();
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

    // Weather effects (during gameplay)
    if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'practice') {
      this.renderWeatherEffects();
      this.renderWeatherIndicator();
    }

    // Badge unlock notification
    this.renderBadgeNotification();

    // Achievement notification (always on top)
    this.renderAchievementNotification();

    // Milestone celebrations
    this.renderMilestoneCelebration();

    // Encouragement messages (after repeated deaths)
    this.renderEncouragementMessage();

    // Level completion celebration effects
    this.renderCelebration();

    // Rhythm sync visualizer
    this.renderBeatVisualizer();

    // Assist mode indicator
    this.renderAssistModeIndicator();

    // Replay share button on level complete
    this.renderReplayShareButton();

    // Replay share modal (on top of everything)
    this.renderReplayShareModal();

    // Assist mode offer modal
    this.renderAssistModeOffer();

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

    // Speedrun timer (bottom-right corner with milliseconds)
    this.ctx.textAlign = 'right';
    this.ctx.font = 'bold 16px "Courier New", monospace';
    const currentTime = this.formatSpeedrunTime(this.levelElapsedTime);
    const bestTime = this.save.getBestTime(this.state.currentLevel) ?? 0;

    // Current time - changes color based on comparison to best
    if (bestTime > 0 && this.levelElapsedTime > bestTime) {
      this.ctx.fillStyle = '#ff6666'; // Red if behind
    } else if (bestTime > 0) {
      this.ctx.fillStyle = '#00ff88'; // Green if ahead
    } else {
      this.ctx.fillStyle = '#ffffff'; // White if no best
    }
    this.ctx.fillText(currentTime, GAME_WIDTH - 20, GAME_HEIGHT - 20);

    // Best time display (smaller, above current time)
    if (bestTime > 0) {
      this.ctx.font = '12px "Courier New", monospace';
      this.ctx.fillStyle = 'rgba(255, 170, 0, 0.8)';
      this.ctx.fillText(`Best: ${this.formatSpeedrunTime(bestTime)}`, GAME_WIDTH - 20, GAME_HEIGHT - 38);
    }

    // Split time popup (when passing checkpoints)
    if (this.splitDisplay) {
      const fadeProgress = Math.min(1, this.splitDisplay.timer / 500); // Fade out in last 500ms
      const slideProgress = Math.min(1, (2000 - this.splitDisplay.timer) / 300); // Slide in first 300ms

      this.ctx.save();
      this.ctx.globalAlpha = fadeProgress;

      const splitX = GAME_WIDTH / 2;
      const splitY = 150 + (1 - slideProgress) * 20;

      // Background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.beginPath();
      this.ctx.roundRect(splitX - 80, splitY - 25, 160, 50, 10);
      this.ctx.fill();

      // Border color based on ahead/behind
      this.ctx.strokeStyle = this.splitDisplay.isAhead ? '#00ff88' : '#ff6666';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Checkpoint label
      const checkpointNum = this.lastCheckpointIndex;
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`SPLIT ${checkpointNum} (${checkpointNum * 25}%)`, splitX, splitY - 8);

      // Split time and difference
      this.ctx.font = 'bold 16px "Courier New", monospace';
      const timeStr = this.formatSpeedrunTime(this.splitDisplay.time);

      if (this.splitDisplay.diff !== 0) {
        const diffStr = this.splitDisplay.isAhead
          ? `-${this.formatSpeedrunTime(Math.abs(this.splitDisplay.diff))}`
          : `+${this.formatSpeedrunTime(this.splitDisplay.diff)}`;

        this.ctx.fillStyle = this.splitDisplay.isAhead ? '#00ff88' : '#ff6666';
        this.ctx.fillText(`${timeStr} (${diffStr})`, splitX, splitY + 12);
      } else {
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillText(timeStr, splitX, splitY + 12);
      }

      this.ctx.restore();
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
      const fillPercent = Math.max(0, Math.min(1, this.comboTimer / this.comboDuration));
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

    // Flow Meter UI (left side, vertical bar)
    this.renderFlowMeterUI();

    // Rescue Window indicator (when player hits edge and can tap to save)
    this.renderRescueWindowIndicator();

    // Time Rewind counter (bottom-left)
    this.renderRewindCounter();

    // Mobile controls (pause, home, restart buttons)
    if (this.input.isMobileDevice()) {
      this.renderMobileControls();
    }

    this.ctx.restore();
  }

  private renderFlowMeterUI(): void {
    const meterX = 25;
    const meterY = 140;
    const meterWidth = 12;
    const meterHeight = 150;
    const fillPercent = this.flowMeter.getMeterPercent();
    const isFull = this.flowMeter.isMeterFull();
    const isOverdrive = this.flowMeter.isInOverdrive();

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    // Fill from bottom
    const fillHeight = meterHeight * fillPercent;
    const fillY = meterY + meterHeight - fillHeight;

    // Color gradient based on fill level
    let meterColor = '#00ffaa';
    if (fillPercent > 0.75) meterColor = '#ffff00';
    if (fillPercent > 0.9) meterColor = '#ff00ff';
    if (isFull) meterColor = '#ffffff';

    // Pulsing when full
    if (isFull && !isOverdrive) {
      const pulse = Math.sin(performance.now() * 0.01) * 0.3 + 0.7;
      this.ctx.shadowColor = '#ff00ff';
      this.ctx.shadowBlur = 20 * pulse;
    }

    this.ctx.fillStyle = meterColor;
    this.ctx.fillRect(meterX, fillY, meterWidth, fillHeight);
    this.ctx.shadowBlur = 0;

    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

    // Label
    this.ctx.font = 'bold 10px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = meterColor;
    this.ctx.fillText('FLOW', meterX + meterWidth / 2, meterY - 5);

    // "READY!" indicator when full
    if (isFull && !isOverdrive) {
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#ff00ff';
      this.ctx.shadowBlur = 10;
      this.ctx.fillText('DASH!', meterX + meterWidth / 2, meterY + meterHeight + 15);
      this.ctx.shadowBlur = 0;
    }

    // Overdrive timer display
    if (isOverdrive) {
      const remaining = this.flowMeter.getOverdrivePercent();
      this.ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
      this.ctx.fillRect(meterX, meterY, meterWidth, meterHeight * remaining);

      this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffff00';
      this.ctx.shadowColor = '#ffff00';
      this.ctx.shadowBlur = 15;
      this.ctx.fillText('OVERDRIVE!', meterX + meterWidth / 2 + 40, meterY + meterHeight / 2);
      this.ctx.shadowBlur = 0;
    }
  }

  private renderRescueWindowIndicator(): void {
    if (!this.player.isInRescueWindow) return;

    // Dramatic "TAP TO DASH!" indicator near the player
    const playerScreenX = this.player.x - this.cameraX + this.player.width / 2;
    const playerScreenY = this.player.y;

    // Pulsing effect
    const pulse = Math.sin(performance.now() * 0.015) * 0.3 + 0.7;
    const scale = 1 + pulse * 0.2;

    this.ctx.save();

    // Background glow
    const gradient = this.ctx.createRadialGradient(
      playerScreenX, playerScreenY - 60,
      0,
      playerScreenX, playerScreenY - 60,
      80
    );
    gradient.addColorStop(0, 'rgba(255, 200, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(playerScreenX - 80, playerScreenY - 140, 160, 100);

    // Text background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.beginPath();
    this.ctx.roundRect(playerScreenX - 70 * scale, playerScreenY - 90, 140 * scale, 45, 10);
    this.ctx.fill();

    // Border
    this.ctx.strokeStyle = '#ffcc00';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#ffcc00';
    this.ctx.shadowBlur = 15 * pulse;
    this.ctx.stroke();

    // Main text
    this.ctx.textAlign = 'center';
    this.ctx.font = `bold ${Math.round(22 * scale)}px "Segoe UI", sans-serif`;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#ffcc00';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('TAP TO DASH!', playerScreenX, playerScreenY - 60);

    // Sub text
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.shadowBlur = 5;
    this.ctx.fillText('RESCUE SAVE', playerScreenX, playerScreenY - 42);

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  private renderRewindCounter(): void {
    const rewindsLeft = this.timeRewind.getRewindsRemaining();
    const maxRewinds = this.timeRewind.getMaxRewinds();

    // Position in bottom-left
    const x = 25;
    const y = GAME_HEIGHT - 50;

    this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';

    // Draw rewind icons
    for (let i = 0; i < maxRewinds; i++) {
      const iconX = x + i * 20;
      if (i < rewindsLeft) {
        this.ctx.fillStyle = '#00aaff';
        this.ctx.shadowColor = '#00aaff';
        this.ctx.shadowBlur = 5;
      } else {
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        this.ctx.shadowBlur = 0;
      }
      this.ctx.fillText('⏪', iconX, y);
    }
    this.ctx.shadowBlur = 0;

    // Label
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('REWIND', x, y + 15);
  }

  private renderOverdriveEffect(): void {
    // Rainbow border effect during Overdrive
    const time = performance.now() * 0.002;
    const hue = (time * 60) % 360;

    this.ctx.save();

    // Pulsing rainbow border
    this.ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
    this.ctx.lineWidth = 8 + Math.sin(time * 5) * 3;
    this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    this.ctx.shadowBlur = 30;
    this.ctx.strokeRect(4, 4, GAME_WIDTH - 8, GAME_HEIGHT - 8);

    // Corner flares
    const flareSize = 50 + Math.sin(time * 3) * 20;
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, flareSize);
    gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.8)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    // Top-left corner
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, flareSize, flareSize);

    // Top-right corner
    this.ctx.save();
    this.ctx.translate(GAME_WIDTH, 0);
    this.ctx.scale(-1, 1);
    this.ctx.fillRect(0, 0, flareSize, flareSize);
    this.ctx.restore();

    // Bottom corners
    this.ctx.save();
    this.ctx.translate(0, GAME_HEIGHT);
    this.ctx.scale(1, -1);
    this.ctx.fillRect(0, 0, flareSize, flareSize);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(GAME_WIDTH, GAME_HEIGHT);
    this.ctx.scale(-1, -1);
    this.ctx.fillRect(0, 0, flareSize, flareSize);
    this.ctx.restore();

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

  // Set up mobile UI exclusion zones so button taps don't trigger jumps
  private setupMobileUIExclusions(): void {
    const buttonSize = 44;
    const buttonPadding = 12;
    const topY = 55;

    // Calculate button positions
    const pauseX = GAME_WIDTH - buttonSize - buttonPadding;
    const homeX = pauseX - buttonSize - buttonPadding;
    const restartX = homeX - buttonSize - buttonPadding;

    // Define exclusion zones for all three buttons
    const zones = [
      { x: restartX, y: topY, width: buttonSize, height: buttonSize },
      { x: homeX, y: topY, width: buttonSize, height: buttonSize },
      { x: pauseX, y: topY, width: buttonSize, height: buttonSize },
    ];

    this.input.setExclusionZones(zones);

    // Set callback to handle button taps
    this.input.setExcludedTouchCallback((x, y) => {
      // Only handle during gameplay states
      if (this.state.gameStatus === 'playing' ||
          this.state.gameStatus === 'practice' ||
          this.state.gameStatus === 'endless' ||
          this.state.gameStatus === 'challengePlaying' ||
          this.state.gameStatus === 'editorTest' ||
          this.state.gameStatus === 'paused') {
        this.handleMobileControlClick(x, y);
      }
    });
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
      this.returnToMainMenu();
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
      this.returnToMainMenu();
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

    // Buttons - uniform grid layout
    this.renderMenuButton('PLAY', GAME_WIDTH / 2, 270, true);

    // Card grid with consistent spacing (58px from center for each column)
    const colOffset = 58;
    const rowHeight = 55;
    let rowY = 325;

    // Row 1: Endless and Daily Challenge
    const streakInfo = this.challengeManager.getStreakInfo();
    const streakText = streakInfo.current > 0 ? ` 🔥${streakInfo.current}` : '';
    this.renderSmallMenuButton('ENDLESS', GAME_WIDTH / 2 - colOffset, rowY, '#00ffaa');
    this.renderSmallMenuButton(`DAILY${streakText}`, GAME_WIDTH / 2 + colOffset, rowY, '#ff6600');

    // Row 2: Editor and My Levels
    rowY += rowHeight;
    this.renderSmallMenuButton('EDITOR', GAME_WIDTH / 2 - colOffset, rowY, '#ff00ff');
    this.renderSmallMenuButton('MY LEVELS', GAME_WIDTH / 2 + colOffset, rowY, '#00ff88');

    // Row 3: Skins and Badges
    rowY += rowHeight;
    const achieveProgress = this.save.getAchievementProgress();
    this.renderSmallMenuButton('SKINS', GAME_WIDTH / 2 - colOffset, rowY, '#ffd700');
    this.renderSmallMenuButton(`BADGES ${achieveProgress.unlocked}/${achieveProgress.total}`, GAME_WIDTH / 2 + colOffset, rowY, '#ff6600');

    // Settings button
    rowY += rowHeight;
    this.renderMenuButton('SETTINGS', GAME_WIDTH / 2, rowY, false);

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

    // Button text - responsive sizing
    const color = primary ? '#00ffff' : '#ffffff';
    this.renderResponsiveText(text, x, y + 7, width - 20, 20, color, primary ? 10 : 0);
  }

  private renderSmallMenuButton(text: string, x: number, y: number, color: string): void {
    // Uniform card size for all small buttons
    const width = 105;
    const height = 45;

    // Parse color for background
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
    }
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.roundRect(x - width / 2, y - height / 2, width, height, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // Responsive text that fits in the card
    this.renderResponsiveText(text, x, y + 5, width - 16, 13, color, 5);
  }

  // Render text that scales to fit within maxWidth
  private renderResponsiveText(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    baseFontSize: number,
    color: string,
    shadowBlur: number
  ): void {
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = shadowBlur;
    this.ctx.shadowColor = color;
    this.ctx.textAlign = 'center';

    // Start with base font size and scale down if needed
    let fontSize = baseFontSize;
    const minFontSize = 9;

    this.ctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
    let textWidth = this.ctx.measureText(text).width;

    // Scale down until text fits or we hit minimum
    while (textWidth > maxWidth && fontSize > minFontSize) {
      fontSize -= 1;
      this.ctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
      textWidth = this.ctx.measureText(text).width;
    }

    this.ctx.fillText(text, x, y);
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

    const levelNames = [
      'First Flight', 'Neon Dreams', 'Final Ascent', 'Frozen Peak',
      'Volcanic Descent', 'Abyssal Depths', 'The Gauntlet', 'Sky Temple',
      'Crystal Caverns', 'Storm Surge', 'Shadow Realm', 'Cyber Grid',
      'Ancient Ruins', 'Starlight Path', 'Chaos Dimension'
    ];
    const levelColors = [
      '#00ffaa', '#ff00ff', '#ff6600', '#88ddff',
      '#ff4400', '#00ccff', '#ff0000', '#e94560',
      '#aa66ff', '#ffaa00', '#666699', '#00ffff',
      '#cc9966', '#aaaaff', '#ff0066'
    ];
    const levelDifficulty = [1, 2, 3, 3, 4, 5, 5, 5, 4, 5, 5, 4, 3, 4, 5]; // 1-5 stars

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

        // Mastery badges
        this.renderMasteryBadges(levelId, cardCenterX - 40 * scale, scaledCardY + 145 * scale);

        // Click to play (only show on selected)
        if (isSelected) {
          this.ctx.font = `${Math.round(12 * scale)}px "Segoe UI", sans-serif`;
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          this.ctx.fillText('Click to play', cardCenterX, scaledCardY + 175 * scale);
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

      // Death Heatmap button (only show if there are deaths recorded)
      const deathData = this.statistics.getDeathHeatmap(levelId);
      if (deathData.length > 0) {
        const heatBtnX = GAME_WIDTH / 2 - 80;
        const heatBtnY = secBtnY + 35;
        const heatBtnW = 160;
        const heatBtnH = 28;

        this.ctx.fillStyle = this.showDeathHeatmap ? '#ff4444' : 'rgba(255, 68, 68, 0.6)';
        this.ctx.strokeStyle = '#ff4444';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(heatBtnX, heatBtnY, heatBtnW, heatBtnH, 6);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`DEATH HEATMAP (${deathData.length})`, GAME_WIDTH / 2, heatBtnY + 18);
      }
    }

    // Render modifier panel if open
    if (this.showModifierPanel) {
      this.renderModifierPanel();
    }

    // Render section practice panel if open
    if (this.showSectionPractice) {
      this.renderSectionPracticePanel();
    }

    // Render death heatmap panel if open
    if (this.showDeathHeatmap) {
      this.renderDeathHeatmapPanel();
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

  private renderDeathHeatmapPanel(): void {
    const panelX = 50;
    const panelY = 80;
    const panelW = GAME_WIDTH - 100;
    const panelH = 380;

    // Panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    this.ctx.strokeStyle = '#ff4444';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(panelX, panelY, panelW, panelH, 15);
    this.ctx.fill();
    this.ctx.stroke();

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 22px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff4444';
    this.ctx.shadowColor = '#ff4444';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('💀 DEATH HEATMAP', GAME_WIDTH / 2, panelY + 30);
    this.ctx.shadowBlur = 0;

    // Get death data
    const deathData = this.statistics.getDeathHeatmap(this.heatmapLevelId);
    const levelStats = this.statistics.getLevelStats(this.heatmapLevelId);

    // Stats summary
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(
      `Level ${this.heatmapLevelId} - ${deathData.length} deaths recorded${levelStats ? ` (${levelStats.attempts} attempts)` : ''}`,
      GAME_WIDTH / 2,
      panelY + 55
    );

    // Heatmap visualization area
    const mapX = panelX + 20;
    const mapY = panelY + 75;
    const mapW = panelW - 40;
    const mapH = 200;

    // Background for the map
    this.ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(mapX, mapY, mapW, mapH, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // Calculate level bounds from death locations
    if (deathData.length > 0) {
      const xCoords = deathData.map(d => d.x);
      const yCoords = deathData.map(d => d.y);
      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minY = Math.min(...yCoords);
      const maxY = Math.max(...yCoords);

      // Add padding
      const padding = 100;
      const levelMinX = Math.max(0, minX - padding);
      const levelMaxX = maxX + padding;
      const levelMinY = Math.max(0, minY - padding);
      const levelMaxY = Math.min(GAME_HEIGHT, maxY + padding);

      // Scale factors
      const scaleX = mapW / (levelMaxX - levelMinX || 1);
      const scaleY = mapH / (levelMaxY - levelMinY || 1);
      const scale = Math.min(scaleX, scaleY);

      // Center offset
      const offsetX = mapX + (mapW - (levelMaxX - levelMinX) * scale) / 2;
      const offsetY = mapY + (mapH - (levelMaxY - levelMinY) * scale) / 2;

      // Draw heatmap spots with varying intensity
      // First, count deaths per grid cell
      const gridSize = 50;
      const heatGrid: Map<string, number> = new Map();
      for (const death of deathData) {
        const gridX = Math.floor(death.x / gridSize);
        const gridY = Math.floor(death.y / gridSize);
        const key = `${gridX},${gridY}`;
        heatGrid.set(key, (heatGrid.get(key) || 0) + 1);
      }

      // Find max intensity for normalization
      const maxIntensity = Math.max(...heatGrid.values());

      // Draw heat spots
      for (const [key, count] of heatGrid) {
        const [gx, gy] = key.split(',').map(Number);
        const worldX = gx * gridSize + gridSize / 2;
        const worldY = gy * gridSize + gridSize / 2;

        const screenX = offsetX + (worldX - levelMinX) * scale;
        const screenY = offsetY + (worldY - levelMinY) * scale;

        // Skip if off the map area
        if (screenX < mapX || screenX > mapX + mapW || screenY < mapY || screenY > mapY + mapH) continue;

        // Intensity gradient (red to yellow for hotspots)
        const intensity = count / maxIntensity;
        const radius = 15 + intensity * 20;

        // Gradient for heat spot
        const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
        if (intensity > 0.7) {
          // Hotspot - bright yellow/white center
          gradient.addColorStop(0, `rgba(255, 255, 100, ${0.8 * intensity})`);
          gradient.addColorStop(0.3, `rgba(255, 200, 50, ${0.6 * intensity})`);
          gradient.addColorStop(0.7, `rgba(255, 100, 50, ${0.3 * intensity})`);
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        } else if (intensity > 0.4) {
          // Medium - orange
          gradient.addColorStop(0, `rgba(255, 150, 50, ${0.6 * intensity})`);
          gradient.addColorStop(0.5, `rgba(255, 80, 30, ${0.4 * intensity})`);
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        } else {
          // Low - red
          gradient.addColorStop(0, `rgba(255, 50, 50, ${0.4 + 0.3 * intensity})`);
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Add death count for high intensity spots
        if (count >= 3) {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 10px "Segoe UI", sans-serif';
          this.ctx.fillText(`${count}`, screenX, screenY + 4);
        }
      }

      // Draw individual death markers for clarity
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (const death of deathData) {
        const screenX = offsetX + (death.x - levelMinX) * scale;
        const screenY = offsetY + (death.y - levelMinY) * scale;

        if (screenX >= mapX && screenX <= mapX + mapW && screenY >= mapY && screenY <= mapY + mapH) {
          this.ctx.beginPath();
          this.ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // Legend
      this.ctx.textAlign = 'left';
      this.ctx.font = '11px "Segoe UI", sans-serif';

      // Legend gradient bar
      const legendX = mapX + 10;
      const legendY = mapY + mapH - 25;
      const legendW = 100;
      const legendH = 10;

      const legendGrad = this.ctx.createLinearGradient(legendX, legendY, legendX + legendW, legendY);
      legendGrad.addColorStop(0, 'rgba(255, 50, 50, 0.5)');
      legendGrad.addColorStop(0.5, 'rgba(255, 150, 50, 0.7)');
      legendGrad.addColorStop(1, 'rgba(255, 255, 100, 0.9)');
      this.ctx.fillStyle = legendGrad;
      this.ctx.fillRect(legendX, legendY, legendW, legendH);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('Low', legendX, legendY - 3);
      this.ctx.textAlign = 'right';
      this.ctx.fillText('High', legendX + legendW, legendY - 3);
    } else {
      // No death data
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.textAlign = 'center';
      this.ctx.font = '16px "Segoe UI", sans-serif';
      this.ctx.fillText('No death data recorded yet', GAME_WIDTH / 2, mapY + mapH / 2);
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillText('Play the level to start tracking deaths', GAME_WIDTH / 2, mapY + mapH / 2 + 25);
    }

    // Tips section
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffaa';
    this.ctx.fillText('💡 Tips for Improvement', GAME_WIDTH / 2, panelY + panelH - 80);

    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    if (deathData.length >= 5) {
      // Analyze death patterns and give tips
      const yCoords = deathData.map(d => d.y);
      const highDeaths = yCoords.filter(y => y < GAME_HEIGHT / 2).length;
      const lowDeaths = yCoords.filter(y => y >= GAME_HEIGHT / 2).length;

      let tip = '';
      if (highDeaths > lowDeaths * 1.5) {
        tip = 'Many deaths at high altitudes - focus on precise jumps and timing';
      } else if (lowDeaths > highDeaths * 1.5) {
        tip = 'Many deaths near ground - watch for spikes and lava hazards';
      } else {
        tip = 'Deaths spread evenly - practice the whole level in sections';
      }
      this.ctx.fillText(tip, GAME_WIDTH / 2, panelY + panelH - 55);
    } else {
      this.ctx.fillText('Play more to get personalized tips!', GAME_WIDTH / 2, panelY + panelH - 55);
    }

    // Close hint
    this.ctx.font = '11px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText('Click outside to close', GAME_WIDTH / 2, panelY + panelH - 15);
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

    // Platform Guide button (help section)
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillText('HELP', leftColX, 555);

    this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
    this.renderSettingsButton('Platform Guide', leftColX, 585, '#00ffff');

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

  // Platform Encyclopedia - comprehensive guide to all platform types
  private renderPlatformGuide(): void {
    this.renderOverlay();
    this.ctx.save();

    // Update animation time
    this.encyclopediaAnimTime += 16;

    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 32px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('PLATFORM ENCYCLOPEDIA', GAME_WIDTH / 2, 50);

    // Back button
    this.ctx.textAlign = 'left';
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('< Back (ESC)', 20, 35);

    // Scrollable content area
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 70, GAME_WIDTH, GAME_HEIGHT - 90);
    this.ctx.clip();

    const scrollY = -this.encyclopediaScrollOffset;

    // Platform data with comprehensive info
    const platforms = [
      { type: 'solid', name: 'SOLID', color: '#5a6a7a', icon: '■',
        desc: 'Standard safe platforms - the foundation of every level.',
        tip: 'Always safe to land on. Use as reference points.' },
      { type: 'bounce', name: 'BOUNCE', color: '#ffc107', icon: '▲',
        desc: 'Spring platforms that launch you 1.3x higher than normal jump.',
        tip: 'Time your landing for maximum height. Great for reaching coins!' },
      { type: 'ice', name: 'ICE', color: '#88ddff', icon: '❄',
        desc: 'Slippery platforms with reduced friction. Hard to stop!',
        tip: 'Jump early to avoid sliding off edges. Momentum is key.' },
      { type: 'lava', name: 'LAVA', color: '#ff4400', icon: '☠',
        desc: 'DEADLY! Instant death on contact. Avoid at all costs.',
        tip: 'Watch for bubbling animation. Shield power-up protects you once.' },
      { type: 'spike', name: 'SPIKE', color: '#ffffff', icon: '△',
        desc: 'DEADLY! Sharp triangular obstacles that kill instantly.',
        tip: 'Jump over or dash through. White color makes them visible.' },
      { type: 'crumble', name: 'CRUMBLE', color: '#a0522d', icon: '▤',
        desc: 'Falls apart shortly after you land on it.',
        tip: 'Jump quickly! You have about 0.5 seconds before it crumbles.' },
      { type: 'moving', name: 'MOVING', color: '#4fc3f7', icon: '↔',
        desc: 'Platforms that move in patterns (horizontal, vertical, circular).',
        tip: 'Study the pattern first. Land in the center for safety.' },
      { type: 'phase', name: 'PHASE', color: '#e040fb', icon: '◌',
        desc: 'Appears and disappears on a regular cycle.',
        tip: 'Watch the timing! Jump when the platform is solidifying.' },
      { type: 'conveyor', name: 'CONVEYOR', color: '#38a169', icon: '»',
        desc: 'Moves you horizontally while standing. Check arrow direction!',
        tip: 'Can help or hinder - use momentum for longer jumps.' },
      { type: 'gravity', name: 'GRAVITY', color: '#d53f8c', icon: '⇅',
        desc: 'Flips your gravity on contact! Up becomes down.',
        tip: 'Disorienting at first. Jump immediately after flip for control.' },
      { type: 'sticky', name: 'STICKY', color: '#ecc94b', icon: '●',
        desc: 'Slows your movement significantly. Jump to escape!',
        tip: 'Press jump repeatedly to break free faster.' },
      { type: 'glass', name: 'GLASS', color: '#e2e8f0', icon: '□',
        desc: 'Transparent platform that breaks after 2 landings.',
        tip: 'First landing cracks it. Use sparingly or plan your route.' },
      { type: 'slowmo', name: 'SLOW-MO ZONE', color: '#00c8ff', icon: '⏱',
        desc: 'Time slows down while inside this zone.',
        tip: 'Great for precise jumps. Score multiplier unaffected!' },
      { type: 'wall', name: 'WALL', color: '#718096', icon: '║',
        desc: 'Vertical surface for wall-jumping. Slide down slowly.',
        tip: 'Press jump while touching to wall-jump away.' },
      { type: 'secret', name: 'SECRET', color: '#ffd700', icon: '?',
        desc: 'Hidden platform! Only appears when you get close.',
        tip: 'Look for faint shimmers. Often lead to bonus coins!' },
    ];

    let y = 90 + scrollY;
    const cardHeight = 85;
    const cardWidth = GAME_WIDTH - 40;
    const startX = 20;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const cardY = y + i * (cardHeight + 10);

      // Skip if off screen
      if (cardY + cardHeight < 70 || cardY > GAME_HEIGHT) continue;

      // Card background
      this.ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(startX, cardY, cardWidth, cardHeight, 10);
      this.ctx.fill();
      this.ctx.stroke();

      // Live animated platform preview (left side)
      const previewX = startX + 15;
      const previewY = cardY + 25;
      const previewW = 70;
      const previewH = 35;

      this.renderPlatformPreview(p.type, previewX, previewY, previewW, previewH, this.encyclopediaAnimTime);

      // Platform name and icon
      this.ctx.textAlign = 'left';
      this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillText(`${p.icon} ${p.name}`, startX + 100, cardY + 25);
      this.ctx.shadowBlur = 0;

      // Description
      this.ctx.font = '13px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(p.desc, startX + 100, cardY + 45);

      // Tip
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillText(`💡 ${p.tip}`, startX + 100, cardY + 68);

      // Danger indicator for lethal platforms
      if (p.type === 'lava' || p.type === 'spike') {
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 11px "Segoe UI", sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('⚠ DEADLY', startX + cardWidth - 15, cardY + 25);
      }
    }

    this.ctx.restore();

    // Scroll indicator
    const totalHeight = platforms.length * (cardHeight + 10);
    const visibleHeight = GAME_HEIGHT - 90;
    if (totalHeight > visibleHeight) {
      const scrollbarHeight = (visibleHeight / totalHeight) * visibleHeight;
      const scrollbarY = 70 + (this.encyclopediaScrollOffset / (totalHeight - visibleHeight)) * (visibleHeight - scrollbarHeight);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fillRect(GAME_WIDTH - 8, 70, 4, visibleHeight);
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
      this.ctx.fillRect(GAME_WIDTH - 8, scrollbarY, 4, scrollbarHeight);
    }

    // Scroll hint
    this.ctx.textAlign = 'center';
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText('Scroll or swipe to see all platforms', GAME_WIDTH / 2, GAME_HEIGHT - 10);

    this.ctx.restore();
  }

  // Render animated platform preview for encyclopedia
  private renderPlatformPreview(type: string, x: number, y: number, w: number, h: number, time: number): void {
    const ctx = this.ctx;
    ctx.save();

    switch (type) {
      case 'solid':
        const solidGrad = ctx.createLinearGradient(x, y, x, y + h);
        solidGrad.addColorStop(0, '#5a6a7a');
        solidGrad.addColorStop(1, '#3a4a5a');
        ctx.fillStyle = solidGrad;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x, y, w, 3);
        break;

      case 'bounce':
        const bounceGrad = ctx.createLinearGradient(x, y, x, y + h);
        bounceGrad.addColorStop(0, '#ffc107');
        bounceGrad.addColorStop(1, '#ff9800');
        ctx.fillStyle = bounceGrad;
        ctx.fillRect(x, y, w, h);
        // Animated bounce lines
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        const bounceOffset = Math.sin(time * 0.005) * 3;
        for (let i = 0; i < 3; i++) {
          const lx = x + (w / 4) * (i + 1);
          ctx.beginPath();
          ctx.moveTo(lx - 4, y + h / 2 + bounceOffset);
          ctx.lineTo(lx, y + 4 + bounceOffset);
          ctx.lineTo(lx + 4, y + h / 2 + bounceOffset);
          ctx.stroke();
        }
        break;

      case 'ice':
        const iceGrad = ctx.createLinearGradient(x, y, x, y + h);
        iceGrad.addColorStop(0, 'rgba(200, 240, 255, 0.9)');
        iceGrad.addColorStop(1, 'rgba(150, 200, 255, 0.8)');
        ctx.fillStyle = iceGrad;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(x + 5, y + 3, w * 0.4, 4);
        break;

      case 'lava':
        const lavaGrad = ctx.createLinearGradient(x, y, x, y + h);
        lavaGrad.addColorStop(0, '#ff4444');
        lavaGrad.addColorStop(0.5, '#ff6600');
        lavaGrad.addColorStop(1, '#ff2200');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(x, y, w, h);
        // Animated bubbles
        ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
        for (let i = 0; i < 3; i++) {
          const bx = x + (w / 4) * (i + 1);
          const by = y + 8 + Math.sin(time * 0.003 + i) * 4;
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'spike':
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
        const spikeCount = 4;
        const spikeW = w / spikeCount;
        for (let i = 0; i < spikeCount; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * spikeW, y + h);
          ctx.lineTo(x + i * spikeW + spikeW / 2, y);
          ctx.lineTo(x + (i + 1) * spikeW, y + h);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        break;

      case 'crumble':
        const crumbleGrad = ctx.createLinearGradient(x, y, x, y + h);
        crumbleGrad.addColorStop(0, '#a0522d');
        crumbleGrad.addColorStop(1, '#8b4513');
        ctx.fillStyle = crumbleGrad;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y);
        ctx.lineTo(x + w * 0.4, y + h);
        ctx.moveTo(x + w * 0.7, y);
        ctx.lineTo(x + w * 0.6, y + h);
        ctx.stroke();
        break;

      case 'moving':
        const moveOffset = Math.sin(time * 0.003) * 10;
        const moveGrad = ctx.createLinearGradient(x + moveOffset, y, x + moveOffset, y + h);
        moveGrad.addColorStop(0, '#4fc3f7');
        moveGrad.addColorStop(1, '#0288d1');
        ctx.fillStyle = moveGrad;
        ctx.fillRect(x + moveOffset, y, w - 20, h);
        // Movement arrows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x + moveOffset + 8, y + h / 2);
        ctx.lineTo(x + moveOffset + 15, y + h / 2 - 4);
        ctx.lineTo(x + moveOffset + 15, y + h / 2 + 4);
        ctx.fill();
        break;

      case 'phase':
        const phaseAlpha = 0.3 + Math.abs(Math.sin(time * 0.003)) * 0.7;
        ctx.globalAlpha = phaseAlpha;
        const phaseGrad = ctx.createLinearGradient(x, y, x + w, y);
        phaseGrad.addColorStop(0, '#9c27b0');
        phaseGrad.addColorStop(0.5, '#e040fb');
        phaseGrad.addColorStop(1, '#9c27b0');
        ctx.fillStyle = phaseGrad;
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1;
        break;

      case 'conveyor':
        const convGrad = ctx.createLinearGradient(x, y, x, y + h);
        convGrad.addColorStop(0, '#38a169');
        convGrad.addColorStop(1, '#276749');
        ctx.fillStyle = convGrad;
        ctx.fillRect(x, y, w, h);
        // Animated lines
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        const lineOffset = (time * 0.05) % 15;
        for (let lx = -15 + lineOffset; lx < w + 15; lx += 15) {
          ctx.beginPath();
          ctx.moveTo(x + lx, y);
          ctx.lineTo(x + lx + 8, y + h);
          ctx.stroke();
        }
        break;

      case 'gravity':
        const gravGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        gravGrad.addColorStop(0, '#d53f8c');
        gravGrad.addColorStop(0.5, '#805ad5');
        gravGrad.addColorStop(1, '#d53f8c');
        ctx.fillStyle = gravGrad;
        ctx.fillRect(x, y, w, h);
        // Floating particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 3; i++) {
          const px = x + (w / 4) * (i + 1);
          const py = y + h / 2 + Math.sin(time * 0.004 + i) * 8;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'sticky':
        const stickyGrad = ctx.createLinearGradient(x, y, x, y + h);
        stickyGrad.addColorStop(0, '#ecc94b');
        stickyGrad.addColorStop(1, '#d69e2e');
        ctx.fillStyle = stickyGrad;
        ctx.fillRect(x, y, w, h);
        // Dripping animation
        ctx.fillStyle = '#d69e2e';
        for (let i = 0; i < 3; i++) {
          const dx = x + (w / 4) * (i + 1);
          const dripH = 4 + Math.sin(time * 0.002 + i) * 3;
          ctx.beginPath();
          ctx.ellipse(dx, y + h + dripH / 2, 3, dripH, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'glass':
        ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x + 3, y + 2, w * 0.5, 3);
        ctx.strokeStyle = 'rgba(200, 220, 240, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        break;

      case 'slowmo':
        const slowGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w);
        slowGrad.addColorStop(0, 'rgba(0, 200, 255, 0.5)');
        slowGrad.addColorStop(1, 'rgba(0, 100, 255, 0.1)');
        ctx.fillStyle = slowGrad;
        ctx.fillRect(x, y, w, h);
        // Clock
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        const clockX = x + w / 2;
        const clockY = y + h / 2;
        ctx.beginPath();
        ctx.arc(clockX, clockY, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(clockX, clockY);
        ctx.lineTo(clockX + Math.cos(time * 0.001) * 8, clockY + Math.sin(time * 0.001) * 8);
        ctx.stroke();
        break;

      case 'wall':
        const wallGrad = ctx.createLinearGradient(x, y, x + w, y);
        wallGrad.addColorStop(0, '#4a5568');
        wallGrad.addColorStop(0.5, '#718096');
        wallGrad.addColorStop(1, '#4a5568');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(x, y, w, h);
        // Grip lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let wy = y + 8; wy < y + h; wy += 10) {
          ctx.beginPath();
          ctx.moveTo(x + 3, wy);
          ctx.lineTo(x + w - 3, wy);
          ctx.stroke();
        }
        break;

      case 'secret':
        const shimmer = 0.15 + Math.sin(time * 0.003) * 0.1;
        ctx.globalAlpha = shimmer;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 0.8;
        const secretGrad = ctx.createLinearGradient(x, y, x, y + h);
        secretGrad.addColorStop(0, '#ffd700');
        secretGrad.addColorStop(0.5, '#ffec8b');
        secretGrad.addColorStop(1, '#ffd700');
        ctx.fillStyle = secretGrad;
        ctx.fillRect(x, y, w, h);
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(139, 69, 19, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('?', x + w / 2, y + h / 2 + 5);
        ctx.globalAlpha = 1;
        break;

      default:
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(x, y, w, h);
    }

    // Border
    if (type !== 'spike') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }

    ctx.restore();
  }

  private handlePlatformGuideClick(x: number, y: number): void {
    // Back button
    if (x >= 20 && x <= 140 && y >= 20 && y <= 55) {
      this.audio.playSelect();
      this.state.gameStatus = 'settings';
      return;
    }
  }

  private startChallenge(challenge: Challenge): void {
    this.currentChallenge = challenge;
    this.challengeScore = 0;
    this.challengeCoinsCollected = 0;

    // Start endless mode with the challenge seed
    this.isEndlessMode = true;
    this.endlessDistance = 0;
    this.speedMultiplier = 1.0;
    this.jumpCount = 0;
    this.prevAirJumpsRemaining = 4;
    this.audio.resetGameSpeed();

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

    // Generate coins for Coin Rush challenge
    this.challengeCoins = [];
    if (challenge.type === 'dailyCoinRush') {
      const coinData = this.challengeManager.generateCoinRushCoins(challenge.seed, seedPlatforms);
      for (const cd of coinData) {
        this.challengeCoins.push(new Coin({ x: cd.x, y: cd.y, isMagnet: cd.isMagnet }));
      }
    }

    // Reset player
    this.player.reset({ x: 100, y: GROUND_Y - 50 });
    this.cameraX = 0;
    this.attempts = 0;

    // Clear any active powerups
    this.powerUps.clear();

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
    this.prevAirJumpsRemaining = 4;
    this.challengeCoinsCollected = 0;
    this.challengeScore = 0;
    this.audio.resetGameSpeed();

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

    // Regenerate coins for Coin Rush challenge
    this.challengeCoins = [];
    if (this.currentChallenge.type === 'dailyCoinRush') {
      const coinData = this.challengeManager.generateCoinRushCoins(this.currentChallenge.seed, seedPlatforms);
      for (const cd of coinData) {
        this.challengeCoins.push(new Coin({ x: cd.x, y: cd.y, isMagnet: cd.isMagnet }));
      }
    }

    // Clear any active powerups
    this.powerUps.clear();

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
    const isCoinRush = this.currentChallenge.type === 'dailyCoinRush';

    if (isCoinRush) {
      // Coin Rush: show coins collected as main metric
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 15;
      this.ctx.fillText(`★ ${this.challengeCoinsCollected}`, GAME_WIDTH / 2, 50);

      // Score below
      this.ctx.font = '16px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#00ffff';
      this.ctx.shadowColor = '#00ffff';
      this.ctx.shadowBlur = 5;
      this.ctx.fillText(`Score: ${this.challengeScore}`, GAME_WIDTH / 2, 75);

      // Magnet indicator when active
      if (this.powerUps.isActive('magnet')) {
        this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 10;
        const secs = Math.ceil(this.powerUps.getRemainingTime('magnet') / 1000);
        this.ctx.fillText(`🧲 MAGNET ${secs}s`, GAME_WIDTH / 2, 95);
      }
    } else {
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
    }

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
      this.ctx.fillText(`Best: ${progress.bestScore}`, GAME_WIDTH - 20, 50);
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

  // Format time for speedrun display (mm:ss.mmm)
  private formatSpeedrunTime(ms: number): string {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor(ms % 1000);

    const minStr = minutes.toString().padStart(2, '0');
    const secStr = seconds.toString().padStart(2, '0');
    const msStr = milliseconds.toString().padStart(3, '0');

    return `${minStr}:${secStr}.${msStr}`;
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
    this.editor.setOnPlay((pos) => this.testLevel(pos));
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

    // Create New Level button - show template selection
    if (x >= GAME_WIDTH / 2 - 100 && x <= GAME_WIDTH / 2 + 100 &&
        y >= GAME_HEIGHT - 80 && y <= GAME_HEIGHT - 40) {
      this.audio.playSelect();
      this.showingTemplateSelect = true;
      return;
    }

    // Template selection modal
    if (this.showingTemplateSelect) {
      const templates = CustomLevelManager.getTemplates();
      const modalWidth = 400;
      const modalHeight = 280;
      const modalX = (GAME_WIDTH - modalWidth) / 2;
      const modalY = (GAME_HEIGHT - modalHeight) / 2;
      const templateHeight = 45;
      const startY = modalY + 50;

      // Check template buttons
      for (let i = 0; i < templates.length; i++) {
        const btnY = startY + i * (templateHeight + 10);
        if (x >= modalX + 20 && x <= modalX + modalWidth - 20 &&
            y >= btnY && y <= btnY + templateHeight) {
          this.audio.playSelect();
          this.showingTemplateSelect = false;
          const newLevel = this.customLevelManager.createFromTemplate(templates[i].id as LevelTemplate);
          this.openEditor(newLevel);
          return;
        }
      }

      // Cancel button
      if (x >= modalX + modalWidth / 2 - 50 && x <= modalX + modalWidth / 2 + 50 &&
          y >= modalY + modalHeight - 45 && y <= modalY + modalHeight - 15) {
        this.audio.playSelect();
        this.showingTemplateSelect = false;
        return;
      }

      // Click outside modal - close it
      if (x < modalX || x > modalX + modalWidth || y < modalY || y > modalY + modalHeight) {
        this.audio.playSelect();
        this.showingTemplateSelect = false;
        return;
      }
      return; // Consume click when template select is showing
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

    // Template selection modal
    if (this.showingTemplateSelect) {
      // Darken background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      const templates = CustomLevelManager.getTemplates();
      const modalWidth = 400;
      const modalHeight = 280;
      const modalX = (GAME_WIDTH - modalWidth) / 2;
      const modalY = (GAME_HEIGHT - modalHeight) / 2;

      // Modal background
      this.ctx.fillStyle = 'rgba(30, 30, 50, 0.98)';
      this.ctx.beginPath();
      this.ctx.roundRect(modalX, modalY, modalWidth, modalHeight, 15);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ff00ff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Title
      this.ctx.font = 'bold 22px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ff00ff';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#ff00ff';
      this.ctx.shadowBlur = 15;
      this.ctx.fillText('Choose a Template', GAME_WIDTH / 2, modalY + 35);
      this.ctx.shadowBlur = 0;

      // Template options
      const templateHeight = 45;
      const startY = modalY + 50;

      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const btnY = startY + i * (templateHeight + 10);

        // Button background
        this.ctx.fillStyle = 'rgba(60, 60, 90, 0.8)';
        this.ctx.beginPath();
        this.ctx.roundRect(modalX + 20, btnY, modalWidth - 40, templateHeight, 8);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Icon
        this.ctx.font = '24px "Segoe UI", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(template.icon, modalX + 35, btnY + 32);

        // Name
        this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(template.name, modalX + 75, btnY + 22);

        // Description
        this.ctx.font = '12px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.fillText(template.description, modalX + 75, btnY + 38);
      }

      // Cancel button
      this.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      this.ctx.beginPath();
      this.ctx.roundRect(modalX + modalWidth / 2 - 50, modalY + modalHeight - 45, 100, 30, 6);
      this.ctx.fill();
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Cancel', GAME_WIDTH / 2, modalY + modalHeight - 25);
    }

    // Scroll indicator (show if there are more levels than visible)
    if (levels.length > 6) { // More than 2 rows
      const rows = Math.ceil(levels.length / 3);
      const maxScroll = Math.max(0, rows * 135 - 300);

      if (maxScroll > 0) {
        // Scrollbar track
        const trackX = GAME_WIDTH - 20;
        const trackY = 120;
        const trackHeight = GAME_HEIGHT - 200;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(trackX, trackY, 8, trackHeight, 4);
        this.ctx.fill();

        // Scrollbar thumb
        const thumbHeight = Math.max(30, (300 / (rows * 135)) * trackHeight);
        const thumbY = trackY + (this.customLevelScrollOffset / maxScroll) * (trackHeight - thumbHeight);

        this.ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
        this.ctx.beginPath();
        this.ctx.roundRect(trackX, thumbY, 8, thumbHeight, 4);
        this.ctx.fill();

        // Scroll hint text
        this.ctx.font = '10px "Segoe UI", sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Scroll or swipe', GAME_WIDTH - 50, GAME_HEIGHT - 95);
      }
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
      const rightX = (this.canvas.width / this.dpr) - 20;

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

    // Prevent default browser behaviors for editor shortcuts
    const ctrlOrMeta = e.ctrlKey || e.metaKey;
    if (ctrlOrMeta && ['a', 'd', 'z', 'y'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
    if (e.key.startsWith('Arrow') || e.key === 'Backspace') {
      e.preventDefault();
    }

    // Pass keyboard event to editor with modifier keys
    // Arrow keys: move selection if something is selected, otherwise pan camera
    const hasSelection = this.editor.getSelectedElement() !== null;

    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft' ||
         e.key === 'ArrowUp' || e.key === 'ArrowDown') && !hasSelection) {
      // No selection - pan camera
      if (e.key === 'ArrowRight') {
        this.editor.moveCamera(50);
      } else if (e.key === 'ArrowLeft') {
        this.editor.moveCamera(-50);
      }
      // Vertical arrows don't pan, just ignore
    } else {
      // Pass to editor (handles selection movement, shortcuts, etc.)
      this.editor.handleKeyDown(e.key, ctrlOrMeta, e.shiftKey);
    }
  }

  private testLevel(testPosition?: { x: number; y: number }): void {
    if (!this.editor) return;

    // Save first
    this.saveCurrentLevel();

    // Store editor state
    const level = this.editor.getLevel();

    // Play the level in test mode
    const config = this.customLevelManager.toLevelConfig(level);
    this.level = new Level(config);

    // Enable flying mode if level config specifies it
    const flyingMode = config.flyingMode ?? false;

    // Use test position if provided, otherwise use normal player start
    const startPosition = testPosition || config.playerStart;
    this.editorTestStartPosition = startPosition; // Store for respawn
    this.player = new Player(startPosition);
    this.player.setSkin(this.save.getSelectedSkin());
    this.player.setFlyingMode(flyingMode);

    // Set camera to center on test position
    this.cameraX = Math.max(0, startPosition.x - GAME_WIDTH / 3);
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
      this.editor.setOnPlay((pos) => this.testLevel(pos));
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
      // Icon and box - convert hex to rgba for browser compatibility
      const pr = parseInt(p.color.slice(1, 3), 16);
      const pg = parseInt(p.color.slice(3, 5), 16);
      const pb = parseInt(p.color.slice(5, 7), 16);
      this.ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, 0.2)`;
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

  // Milestone Celebration System
  private triggerMilestone(type: string, value: number): void {
    // Don't queue same milestone twice in quick succession
    if (this.lastComboMilestone === value && type === 'combo') return;
    if (type === 'combo') this.lastComboMilestone = value;

    this.milestoneQueue.push({ type, value, timer: 0 });
    this.audio.playUnlock();
  }

  private updateMilestones(deltaTime: number): void {
    // Process milestone queue
    if (!this.currentMilestone && this.milestoneQueue.length > 0) {
      this.currentMilestone = this.milestoneQueue.shift()!;
    }

    // Update current milestone timer
    if (this.currentMilestone) {
      this.currentMilestone.timer += deltaTime;
      if (this.currentMilestone.timer >= this.milestoneDuration) {
        this.currentMilestone = null;
      }
    }
  }

  private renderMilestoneCelebration(): void {
    if (!this.currentMilestone) return;

    const milestone = this.currentMilestone;
    const progress = milestone.timer / this.milestoneDuration;

    // Animation phases
    const scaleIn = Math.min(progress / 0.15, 1); // Scale up in first 15%
    const fadeOut = progress > 0.7 ? (progress - 0.7) / 0.3 : 0; // Fade in last 30%

    // Position at center-top of screen
    const centerX = GAME_WIDTH / 2;
    const baseY = 100;

    this.ctx.save();
    this.ctx.globalAlpha = 1 - fadeOut;

    // Bounce/scale effect
    const bounceScale = scaleIn < 1 ? 1.3 * scaleIn : 1 + Math.sin(progress * Math.PI * 4) * 0.05;

    this.ctx.translate(centerX, baseY);
    this.ctx.scale(bounceScale, bounceScale);
    this.ctx.translate(-centerX, -baseY);

    // Get milestone text and color
    let text = '';
    let subtext = '';
    let color = '#ffcc00';
    let icon = '';

    switch (milestone.type) {
      case 'combo':
        icon = '🔥';
        text = `${milestone.value}x COMBO!`;
        subtext = milestone.value >= 20 ? 'INCREDIBLE!' : milestone.value >= 15 ? 'AMAZING!' : milestone.value >= 10 ? 'GREAT!' : 'NICE!';
        color = milestone.value >= 20 ? '#ff00ff' : milestone.value >= 15 ? '#ff6600' : milestone.value >= 10 ? '#ffaa00' : '#ffcc00';
        break;
      case 'nearmiss':
        icon = '😱';
        text = `${milestone.value}x NEAR MISSES!`;
        subtext = milestone.value >= 10 ? 'DAREDEVIL!' : milestone.value >= 5 ? 'RISKY!' : 'CLOSE CALL!';
        color = '#ff4444';
        break;
      case 'landing':
        icon = '✨';
        text = `${milestone.value} PERFECT LANDINGS!`;
        subtext = milestone.value >= 50 ? 'MASTER!' : milestone.value >= 25 ? 'SKILLED!' : 'SMOOTH!';
        color = '#00ffaa';
        break;
    }

    // Glow background - convert hex to rgba for transparency
    const glowGrad = this.ctx.createRadialGradient(centerX, baseY, 0, centerX, baseY, 150);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    glowGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = glowGrad;
    this.ctx.fillRect(centerX - 150, baseY - 50, 300, 100);

    // Icon
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(icon, centerX, baseY - 15);

    // Main text with shadow
    this.ctx.font = 'bold 28px "Segoe UI", sans-serif';
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(text, centerX, baseY + 20);
    this.ctx.shadowBlur = 0;

    // Subtext
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(subtext, centerX, baseY + 45);

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

  // Encouragement System - motivational messages after repeated deaths
  private showEncouragementMessage(): void {
    const messages = [
      { text: "You've got this!", subtext: "Every master was once a beginner" },
      { text: "Keep going!", subtext: "Practice makes perfect" },
      { text: "Don't give up!", subtext: "You're learning the patterns" },
      { text: "Almost there!", subtext: "Try timing your jumps to the beat" },
      { text: "Stay focused!", subtext: "Watch the platform colors for clues" },
      { text: "You can do it!", subtext: "Each death teaches something new" },
      { text: "Take a breath", subtext: "Sometimes a pause helps" },
      { text: "Great effort!", subtext: "The checkpoint system can help - try Practice mode" },
      { text: "Persistence pays off!", subtext: "Use the death heatmap to see trouble spots" },
      { text: "Keep trying!", subtext: "Double-tap for air jumps!" },
    ];

    // Add specific tips based on death count
    const progress = this.level.getProgress(this.player.x);
    let specificTip = '';

    if (progress < 0.25) {
      specificTip = "Tip: The start is always the hardest!";
    } else if (progress < 0.5) {
      specificTip = "Tip: You're getting further! Keep it up!";
    } else if (progress < 0.75) {
      specificTip = "Tip: Over halfway! The finish is in sight!";
    } else {
      specificTip = "Tip: So close! You've got the skills!";
    }

    // Pick a random message
    const msg = messages[Math.floor(Math.random() * messages.length)];

    this.encouragementMessage = {
      text: msg.text,
      subtext: this.consecutiveDeaths >= 5 ? specificTip : msg.subtext,
      timer: Game.ENCOURAGEMENT_DURATION
    };

    // Reset death counter after showing message
    if (this.consecutiveDeaths >= 10) {
      this.consecutiveDeaths = 3; // Keep showing messages but less frequently
    }
  }

  private updateEncouragementMessage(deltaTime: number): void {
    if (this.encouragementMessage) {
      this.encouragementMessage.timer -= deltaTime;
      if (this.encouragementMessage.timer <= 0) {
        this.encouragementMessage = null;
      }
    }
  }

  private renderEncouragementMessage(): void {
    if (!this.encouragementMessage) return;

    const fadeIn = Math.min(1, (Game.ENCOURAGEMENT_DURATION - this.encouragementMessage.timer) / 300);
    const fadeOut = Math.min(1, this.encouragementMessage.timer / 500);
    const alpha = Math.min(fadeIn, fadeOut);

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2 - 50;

    // Background glow
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150);
    gradient.addColorStop(0, 'rgba(0, 200, 150, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 200, 150, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(centerX - 150, centerY - 60, 300, 120);

    // Background box
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.strokeStyle = '#00ffaa';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - 140, centerY - 45, 280, 90, 15);
    this.ctx.fill();
    this.ctx.stroke();

    // Icon
    this.ctx.font = '32px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#00ffaa';
    this.ctx.fillText('💪', centerX, centerY - 10);

    // Main message
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#00ffaa';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(this.encouragementMessage.text, centerX, centerY + 18);
    this.ctx.shadowBlur = 0;

    // Sub message
    this.ctx.font = '13px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffaa';
    this.ctx.fillText(this.encouragementMessage.subtext, centerX, centerY + 38);

    this.ctx.restore();
  }

  // Level Completion Celebration
  private startLevelCelebration(): void {
    this.celebrationActive = true;
    this.celebrationTimer = 0;
    this.celebrationStars = [];
    this.celebrationCoins = [];

    // Spawn celebration stars
    for (let i = 0; i < 30; i++) {
      this.celebrationStars.push({
        x: Math.random() * GAME_WIDTH,
        y: GAME_HEIGHT + 20,
        vx: (Math.random() - 0.5) * 200,
        vy: -300 - Math.random() * 400,
        size: 10 + Math.random() * 20,
        color: ['#ffcc00', '#ff00ff', '#00ffaa', '#ff6600', '#00ffff'][Math.floor(Math.random() * 5)],
        rotation: Math.random() * 360
      });
    }

    // Create coin collection animation
    const coinsCollected = this.level.coinsCollected;
    for (let i = 0; i < Math.min(coinsCollected, 15); i++) {
      this.celebrationCoins.push({
        x: 50 + Math.random() * (GAME_WIDTH - 100),
        y: 100 + Math.random() * (GAME_HEIGHT - 200),
        targetX: GAME_WIDTH - 80,
        targetY: 30,
        progress: -i * 0.1 // Stagger the animations
      });
    }
  }

  private updateCelebration(deltaTime: number): void {
    if (!this.celebrationActive) return;

    this.celebrationTimer += deltaTime;

    // Update stars
    for (const star of this.celebrationStars) {
      star.x += star.vx * (deltaTime / 1000);
      star.y += star.vy * (deltaTime / 1000);
      star.vy += 500 * (deltaTime / 1000); // Gravity
      star.rotation += 180 * (deltaTime / 1000);
    }

    // Update coin animations
    for (const coin of this.celebrationCoins) {
      if (coin.progress < 0) {
        coin.progress += deltaTime / 1000;
      } else if (coin.progress < 1) {
        coin.progress += deltaTime / 800; // Take ~800ms to fly to corner
      }
    }

    // End celebration after 3 seconds
    if (this.celebrationTimer > 3000) {
      this.celebrationActive = false;
    }
  }

  private renderCelebration(): void {
    if (!this.celebrationActive) return;

    this.ctx.save();

    // Render stars
    for (const star of this.celebrationStars) {
      if (star.y < GAME_HEIGHT + 50) {
        this.ctx.save();
        this.ctx.translate(star.x, star.y);
        this.ctx.rotate(star.rotation * Math.PI / 180);
        this.ctx.fillStyle = star.color;
        this.ctx.shadowColor = star.color;
        this.ctx.shadowBlur = 10;

        // Draw star shape
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 144 - 90) * Math.PI / 180;
          const r = star.size;
          if (i === 0) {
            this.ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          } else {
            this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    // Render flying coins
    for (const coin of this.celebrationCoins) {
      if (coin.progress >= 0 && coin.progress <= 1) {
        // Ease out curve
        const t = 1 - Math.pow(1 - coin.progress, 3);
        const x = coin.x + (coin.targetX - coin.x) * t;
        const y = coin.y + (coin.targetY - coin.y) * t - Math.sin(t * Math.PI) * 100;

        this.ctx.fillStyle = '#ffd700';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 12 * (1 - t * 0.5), 0, Math.PI * 2);
        this.ctx.fill();

        // Inner shine
        this.ctx.fillStyle = '#fff8dc';
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.ctx.arc(x - 3, y - 3, 4 * (1 - t * 0.5), 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  // =====================================================
  // RHYTHM SYNC VISUALIZER
  // =====================================================

  private updateBeatIndicators(deltaTime: number): void {
    // Update existing indicators
    for (let i = this.beatIndicators.length - 1; i >= 0; i--) {
      this.beatIndicators[i].time -= deltaTime / 1000;
      this.beatIndicators[i].intensity -= deltaTime / 500;
      if (this.beatIndicators[i].time <= 0) {
        this.beatIndicators.splice(i, 1);
      }
    }

    // Update beat accuracy feedback
    for (let i = this.beatAccuracy.length - 1; i >= 0; i--) {
      this.beatAccuracy[i].timer -= deltaTime;
      if (this.beatAccuracy[i].timer <= 0) {
        this.beatAccuracy.splice(i, 1);
      }
    }

    // Calculate rhythm multiplier based on consecutive on-beat jumps
    if (this.consecutiveOnBeatJumps > 0) {
      this.rhythmMultiplier = 1 + Math.min(this.consecutiveOnBeatJumps * 0.1, 0.5);
    } else {
      this.rhythmMultiplier = Math.max(1, this.rhythmMultiplier - deltaTime / 2000);
    }
  }

  private checkBeatTiming(): 'perfect' | 'good' | 'miss' {
    const now = performance.now();
    const timeSinceBeat = now - this.lastBeatTime;
    const beatInterval = 60000 / this.currentBPM;
    const timeToNextBeat = beatInterval - (timeSinceBeat % beatInterval);
    const distanceFromBeat = Math.min(timeSinceBeat % beatInterval, timeToNextBeat);

    if (distanceFromBeat <= Game.BEAT_PERFECT_WINDOW) {
      return 'perfect';
    } else if (distanceFromBeat <= Game.BEAT_GOOD_WINDOW) {
      return 'good';
    }
    return 'miss';
  }

  private onPlayerJump(): void {
    // Track rhythm for mastery badges (regardless of visualizer setting)
    this.levelRhythmTotal++;

    if (!this.showBeatVisualizer) return;

    const timing = this.checkBeatTiming();
    this.beatAccuracy.push({
      time: performance.now(),
      accuracy: timing,
      timer: 800 // Show for 800ms
    });

    // Track rhythm hits for mastery badges
    if (timing === 'perfect' || timing === 'good') {
      this.levelRhythmHits++;
    }

    if (timing === 'perfect') {
      this.consecutiveOnBeatJumps++;
      this.flowMeter.onOnBeatJump();
      // Trigger milestone for rhythm streak
      if (this.consecutiveOnBeatJumps >= 10 && this.consecutiveOnBeatJumps % 5 === 0) {
        this.triggerMilestone('rhythm', this.consecutiveOnBeatJumps);
      }
    } else if (timing === 'good') {
      this.consecutiveOnBeatJumps = Math.max(0, this.consecutiveOnBeatJumps - 1);
    } else {
      this.consecutiveOnBeatJumps = 0;
    }
  }

  private renderBeatVisualizer(): void {
    if (!this.showBeatVisualizer) return;
    if (this.state.gameStatus !== 'playing' && this.state.gameStatus !== 'practice') return;

    this.ctx.save();

    const baseX = GAME_WIDTH - 60;
    const baseY = GAME_HEIGHT - 80;

    // Beat ring background
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(baseX, baseY, 25, 0, Math.PI * 2);
    this.ctx.stroke();

    // Pulsing beat indicator
    const beatInterval = 60000 / this.currentBPM;
    const now = performance.now();
    const beatProgress = ((now - this.lastBeatTime) % beatInterval) / beatInterval;
    const pulseSize = 25 - beatProgress * 20;

    if (pulseSize > 5) {
      this.ctx.strokeStyle = `rgba(0, 255, 170, ${1 - beatProgress})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(baseX, baseY, pulseSize, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Center beat indicator
    const beatGlow = this.beatPulse;
    if (beatGlow > 0) {
      this.ctx.fillStyle = `rgba(0, 255, 170, ${beatGlow})`;
      this.ctx.shadowColor = '#00ffaa';
      this.ctx.shadowBlur = 20 * beatGlow;
      this.ctx.beginPath();
      this.ctx.arc(baseX, baseY, 8 + beatGlow * 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Inner dot
    this.ctx.fillStyle = '#00ffaa';
    this.ctx.beginPath();
    this.ctx.arc(baseX, baseY, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // Rhythm multiplier display
    if (this.rhythmMultiplier > 1) {
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.shadowColor = '#ffcc00';
      this.ctx.shadowBlur = 5;
      this.ctx.fillText(`${this.rhythmMultiplier.toFixed(1)}x`, baseX, baseY - 35);
      this.ctx.shadowBlur = 0;
    }

    // Beat accuracy feedback (floating text)
    for (const feedback of this.beatAccuracy) {
      const age = 800 - feedback.timer;
      const alpha = 1 - age / 800;
      const yOffset = age / 10;

      this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
      this.ctx.textAlign = 'center';

      if (feedback.accuracy === 'perfect') {
        this.ctx.fillStyle = `rgba(0, 255, 170, ${alpha})`;
        this.ctx.fillText('PERFECT!', baseX, baseY - 50 - yOffset);
      } else if (feedback.accuracy === 'good') {
        this.ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
        this.ctx.fillText('GOOD', baseX, baseY - 50 - yOffset);
      }
    }

    // Rhythm streak indicator
    if (this.consecutiveOnBeatJumps >= 3) {
      this.ctx.font = 'bold 11px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#00ffff';
      this.ctx.fillText(`${this.consecutiveOnBeatJumps} streak`, baseX, baseY + 40);
    }

    this.ctx.restore();
  }

  // =====================================================
  // REPLAY SHARING SYSTEM
  // =====================================================

  private generateReplayCode(): void {
    const replayData = this.ghostManager.createReplayData(
      this.state.currentLevel,
      'Player', // Could allow custom names later
      this.levelElapsedTime,
      this.level.coinsCollected,
      this.levelDeathCount
    );
    this.replayCode = encodeReplay(replayData);
    this.showReplayShare = true;
  }

  private copyReplayToClipboard(): void {
    if (!this.replayCode) return;

    navigator.clipboard.writeText(this.replayCode).then(() => {
      this.replayCopied = true;
      this.replayCopyTimer = 2000;
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = this.replayCode!;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.replayCopied = true;
      this.replayCopyTimer = 2000;
    });
  }

  private renderReplayShareButton(): void {
    // Only show on level complete screen (non-practice mode)
    if (this.state.gameStatus !== 'levelComplete' || this.isPracticeMode) return;

    const buttonX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT / 2 + 165;
    const buttonWidth = 160;
    const buttonHeight = 35;

    this.ctx.save();

    // Share replay button
    this.ctx.fillStyle = '#6644ff';
    this.ctx.strokeStyle = '#aa88ff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('📤 Share Replay', buttonX, buttonY);

    this.ctx.restore();
  }

  private renderReplayShareModal(): void {
    if (!this.showReplayShare || !this.replayCode) return;

    this.ctx.save();

    // Overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Modal box
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.strokeStyle = '#6644ff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - 200, centerY - 120, 400, 240, 15);
    this.ctx.fill();
    this.ctx.stroke();

    // Title
    this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Share Your Replay', centerX, centerY - 80);

    // Replay code box
    this.ctx.fillStyle = '#0d0d1a';
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - 180, centerY - 50, 360, 50, 8);
    this.ctx.fill();

    // Truncated code display
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#88ff88';
    const displayCode = this.replayCode.length > 45
      ? this.replayCode.substring(0, 42) + '...'
      : this.replayCode;
    this.ctx.fillText(displayCode, centerX, centerY - 22);

    // Copy button
    const copyY = centerY + 30;
    this.ctx.fillStyle = this.replayCopied ? '#00aa66' : '#00ffaa';
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - 80, copyY - 18, 160, 36, 8);
    this.ctx.fill();

    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(this.replayCopied ? '✓ Copied!' : '📋 Copy Code', centerX, copyY + 5);

    // Close button
    const closeY = centerY + 85;
    this.ctx.fillStyle = '#444466';
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - 60, closeY - 15, 120, 30, 8);
    this.ctx.fill();

    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Close', centerX, closeY + 5);

    this.ctx.restore();
  }

  private handleReplayShareClick(x: number, y: number): boolean {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Check copy button
    if (x >= centerX - 80 && x <= centerX + 80 && y >= centerY + 12 && y <= centerY + 48) {
      this.copyReplayToClipboard();
      return true;
    }

    // Check close button
    if (x >= centerX - 60 && x <= centerX + 60 && y >= centerY + 70 && y <= centerY + 100) {
      this.showReplayShare = false;
      this.replayCode = null;
      return true;
    }

    return false;
  }

  // =====================================================
  // ADAPTIVE DIFFICULTY / ASSIST MODE
  // =====================================================

  private checkAssistModeOffer(): void {
    // Only offer assist if not already enabled and player is struggling
    if (this.assistModeEnabled || this.assistModeOffered) return;
    if (this.consecutiveDeaths < Game.ASSIST_OFFER_DEATHS) return;

    this.showAssistOffer = true;
    this.assistModeOffered = true;
  }

  private enableAssistMode(): void {
    this.assistModeEnabled = true;
    this.save.setAssistMode(true);
    this.showAssistOffer = false;

    // Reset some difficulty factors
    this.speedMultiplier = Math.max(1, this.speedMultiplier * 0.8);

    // Show confirmation
    this.encouragementMessage = {
      text: 'Assist Mode Enabled!',
      subtext: 'Auto-checkpoints every 10% • Slower speed buildup',
      timer: 3000
    };
  }

  private renderAssistModeOffer(): void {
    if (!this.showAssistOffer) return;

    this.ctx.save();

    // Overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Modal box with friendly color
    this.ctx.fillStyle = '#1a2a3a';
    this.ctx.strokeStyle = '#00aaff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - 220, centerY - 140, 440, 280, 15);
    this.ctx.fill();
    this.ctx.stroke();

    // Icon
    this.ctx.font = '48px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🤝', centerX, centerY - 85);

    // Title
    this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Need Some Help?', centerX, centerY - 40);

    // Description
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#aaccff';
    this.ctx.fillText('Assist Mode gives you a gentler experience:', centerX, centerY - 10);

    this.ctx.fillStyle = '#88ffaa';
    this.ctx.fillText('• Auto-checkpoints every 10% progress', centerX, centerY + 15);
    this.ctx.fillText('• Slower speed buildup (50% rate)', centerX, centerY + 35);
    this.ctx.fillText('• Extra visual cues for timing', centerX, centerY + 55);

    // Enable button
    const enableY = centerY + 95;
    this.ctx.fillStyle = '#00aa66';
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - 90, enableY - 18, 180, 36, 8);
    this.ctx.fill();

    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Enable Assist', centerX, enableY + 5);

    // Decline button
    const declineY = centerY + 135;
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#888899';
    this.ctx.fillText('No thanks, I\'ve got this!', centerX, declineY);

    this.ctx.restore();
  }

  private handleAssistModeOfferClick(x: number, y: number): boolean {
    if (!this.showAssistOffer) return false;

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Enable button
    if (x >= centerX - 90 && x <= centerX + 90 && y >= centerY + 77 && y <= centerY + 113) {
      this.enableAssistMode();
      return true;
    }

    // Decline text area
    if (y >= centerY + 120 && y <= centerY + 150) {
      this.showAssistOffer = false;
      return true;
    }

    return false;
  }

  private applyAssistModeCheckpoint(): void {
    if (!this.assistModeEnabled) return;

    const progress = this.level.getProgress(this.player.x);
    const checkpointIndex = Math.floor(progress / this.assistCheckpointInterval);

    // Save checkpoint if we've passed a new threshold
    if (checkpointIndex > Math.floor(this.lastCheckpointProgress / this.assistCheckpointInterval)) {
      this.checkpointX = this.player.x;
      this.checkpointY = this.player.y;
      this.lastCheckpointProgress = progress;
      this.checkpointFeedbackTimer = 500;

      // Visual feedback
      this.particles.spawnPowerUpCollect(
        this.player.x - this.cameraX,
        this.player.y,
        '#00ffaa'
      );
    }
  }

  private getAssistModeSpeedMultiplier(): number {
    if (!this.assistModeEnabled) return 1;
    return 0.5; // 50% speed buildup rate
  }

  private renderAssistModeIndicator(): void {
    if (!this.assistModeEnabled) return;
    if (this.state.gameStatus !== 'playing' && this.state.gameStatus !== 'practice') return;

    this.ctx.save();

    // Small indicator in corner
    this.ctx.font = '11px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#00aaff';
    this.ctx.fillText('ASSIST', 20, GAME_HEIGHT - 15);

    // Auto-checkpoint progress indicator
    const progress = this.level.getProgress(this.player.x);
    const nextCheckpoint = Math.ceil(progress / this.assistCheckpointInterval) * this.assistCheckpointInterval;
    const progressToNext = (nextCheckpoint - progress) / this.assistCheckpointInterval;

    this.ctx.fillStyle = 'rgba(0, 170, 255, 0.3)';
    this.ctx.fillRect(60, GAME_HEIGHT - 20, 50, 8);
    this.ctx.fillStyle = '#00aaff';
    this.ctx.fillRect(60, GAME_HEIGHT - 20, 50 * (1 - progressToNext), 8);

    this.ctx.restore();
  }

  // =====================================================
  // LEADERBOARDS SYSTEM
  // =====================================================

  private renderLeaderboards(): void {
    this.renderOverlay();

    this.ctx.save();
    this.ctx.textAlign = 'center';

    // Title
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.shadowBlur = 15;
    this.ctx.fillText('LEADERBOARDS', GAME_WIDTH / 2, 60);
    this.ctx.shadowBlur = 0;

    // Level selector
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`Level ${this.leaderboardLevelId}`, GAME_WIDTH / 2, 100);

    // Arrow buttons
    this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
    this.ctx.fillStyle = this.leaderboardLevelId > 1 ? '#00ffaa' : '#555555';
    this.ctx.fillText('<', GAME_WIDTH / 2 - 80, 100);
    this.ctx.fillStyle = this.leaderboardLevelId < TOTAL_LEVELS ? '#00ffaa' : '#555555';
    this.ctx.fillText('>', GAME_WIDTH / 2 + 80, 100);

    // Leaderboard entries
    const entries = this.save.getLocalLeaderboard(this.leaderboardLevelId);
    const startY = 140;
    const rowHeight = 35;

    // Header
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#888888';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('RANK', 80, startY);
    this.ctx.fillText('PLAYER', 150, startY);
    this.ctx.textAlign = 'right';
    this.ctx.fillText('SCORE', GAME_WIDTH - 220, startY);
    this.ctx.fillText('TIME', GAME_WIDTH - 120, startY);
    this.ctx.fillText('DEATHS', GAME_WIDTH - 40, startY);

    if (entries.length === 0) {
      this.ctx.textAlign = 'center';
      this.ctx.font = '16px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#666666';
      this.ctx.fillText('No entries yet. Complete this level to add your score!', GAME_WIDTH / 2, startY + 60);
    } else {
      entries.forEach((entry, i) => {
        const y = startY + 30 + i * rowHeight;
        const isPlayer = entry.isPlayer;

        // Background for player's entry
        if (isPlayer) {
          this.ctx.fillStyle = 'rgba(0, 255, 170, 0.15)';
          this.ctx.fillRect(70, y - 18, GAME_WIDTH - 100, rowHeight - 2);
        }

        // Rank medal for top 3
        this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
        this.ctx.textAlign = 'left';
        if (entry.rank === 1) {
          this.ctx.fillStyle = '#ffd700';
          this.ctx.fillText('🥇', 80, y);
        } else if (entry.rank === 2) {
          this.ctx.fillStyle = '#c0c0c0';
          this.ctx.fillText('🥈', 80, y);
        } else if (entry.rank === 3) {
          this.ctx.fillStyle = '#cd7f32';
          this.ctx.fillText('🥉', 80, y);
        } else {
          this.ctx.fillStyle = '#666666';
          this.ctx.fillText(`${entry.rank}`, 85, y);
        }

        // Player name
        this.ctx.fillStyle = isPlayer ? '#00ffaa' : '#ffffff';
        this.ctx.fillText(entry.playerName.substring(0, 12), 150, y);

        // Stats
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillText(`${entry.score}`, GAME_WIDTH - 220, y);
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillText(this.formatTime(entry.time), GAME_WIDTH - 120, y);
        this.ctx.fillStyle = entry.deaths === 0 ? '#00ff00' : '#ff6666';
        this.ctx.fillText(`${entry.deaths}`, GAME_WIDTH - 40, y);
      });
    }

    // Back button
    this.ctx.textAlign = 'center';
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#888888';
    this.ctx.fillText('Press ESC or click here to go back', GAME_WIDTH / 2, GAME_HEIGHT - 40);

    this.ctx.restore();
  }

  private handleLeaderboardsClick(x: number, y: number): void {
    // Level navigation arrows
    if (y >= 85 && y <= 115) {
      if (x >= GAME_WIDTH / 2 - 100 && x <= GAME_WIDTH / 2 - 60 && this.leaderboardLevelId > 1) {
        this.leaderboardLevelId--;
        this.audio.playSelect();
      } else if (x >= GAME_WIDTH / 2 + 60 && x <= GAME_WIDTH / 2 + 100 && this.leaderboardLevelId < TOTAL_LEVELS) {
        this.leaderboardLevelId++;
        this.audio.playSelect();
      }
    }

    // Back button
    if (y >= GAME_HEIGHT - 60) {
      this.state.gameStatus = 'mainMenu';
      this.audio.playSelect();
    }
  }

  private addToLeaderboard(): void {
    const entry: Omit<LeaderboardEntry, 'rank'> = {
      playerName: this.save.getPlayerName(),
      score: this.levelScoreThisRun,
      time: this.levelElapsedTime,
      deaths: this.levelDeathCount,
      date: Date.now(),
      isPlayer: true,
    };
    this.save.addLeaderboardEntry(this.state.currentLevel, entry);
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  }

  // =====================================================
  // LEVEL MASTERY BADGES
  // =====================================================

  private checkMasteryBadges(): void {
    const levelId = this.state.currentLevel;
    const newBadges: MasteryBadge[] = [];

    // Flawless: Complete without dying
    if (this.levelDeathCount === 0 && !this.save.hasMasteryBadge(levelId, 'flawless')) {
      if (this.save.addMasteryBadge(levelId, 'flawless')) {
        newBadges.push('flawless');
      }
    }

    // Speed Demon: Beat par time (based on level length estimate)
    const parTime = this.getParTime(levelId);
    if (this.levelElapsedTime < parTime && !this.save.hasMasteryBadge(levelId, 'speedDemon')) {
      if (this.save.addMasteryBadge(levelId, 'speedDemon')) {
        newBadges.push('speedDemon');
      }
    }

    // Collector: Get all coins
    const totalCoins = this.level.getTotalCoins();
    if (totalCoins > 0 && this.level.coinsCollected >= totalCoins && !this.save.hasMasteryBadge(levelId, 'collector')) {
      if (this.save.addMasteryBadge(levelId, 'collector')) {
        newBadges.push('collector');
      }
    }

    // Rhythm Master: 90%+ on-beat jumps
    const rhythmAccuracy = this.levelRhythmTotal > 0
      ? (this.levelRhythmHits / this.levelRhythmTotal) * 100
      : 0;
    this.save.setRhythmAccuracy(levelId, rhythmAccuracy);

    if (rhythmAccuracy >= 90 && this.levelRhythmTotal >= 10 && !this.save.hasMasteryBadge(levelId, 'rhythmMaster')) {
      if (this.save.addMasteryBadge(levelId, 'rhythmMaster')) {
        newBadges.push('rhythmMaster');
      }
    }

    // Queue badge notifications
    for (const badge of newBadges) {
      this.newBadgesEarned.push({ badge, levelId });
    }
    if (newBadges.length > 0) {
      this.badgeNotificationTimer = 3000;
    }
  }

  private getParTime(levelId: number): number {
    // Par times in milliseconds (roughly 1 minute base, scaling with level)
    const parTimes: Record<number, number> = {
      1: 45000,
      2: 50000,
      3: 55000,
      4: 60000,
      5: 65000,
      6: 70000,
      7: 80000,
      8: 90000,
    };
    return parTimes[levelId] || 60000;
  }

  private renderMasteryBadges(levelId: number, x: number, y: number): void {
    const badges = this.save.getLevelMasteryBadges(levelId);
    const badgeSize = 20;
    const spacing = 5;

    const allBadges: { id: MasteryBadge; icon: string; color: string; name: string }[] = [
      { id: 'flawless', icon: '💎', color: '#00ffff', name: 'Flawless' },
      { id: 'speedDemon', icon: '⚡', color: '#ffcc00', name: 'Speed Demon' },
      { id: 'collector', icon: '🪙', color: '#ffd700', name: 'Collector' },
      { id: 'rhythmMaster', icon: '🎵', color: '#ff00ff', name: 'Rhythm Master' },
    ];

    this.ctx.save();

    allBadges.forEach((badge, i) => {
      const bx = x + i * (badgeSize + spacing);
      const hasEarned = badges.includes(badge.id);

      // Badge background - convert hex to rgba for browser compatibility
      if (hasEarned) {
        const br = parseInt(badge.color.slice(1, 3), 16);
        const bg = parseInt(badge.color.slice(3, 5), 16);
        const bb = parseInt(badge.color.slice(5, 7), 16);
        this.ctx.fillStyle = `rgba(${br}, ${bg}, ${bb}, 0.2)`;
      } else {
        this.ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
      }
      this.ctx.beginPath();
      this.ctx.arc(bx, y, badgeSize / 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Badge icon
      this.ctx.font = `${hasEarned ? 14 : 10}px "Segoe UI", sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = hasEarned ? '#ffffff' : '#444444';
      this.ctx.fillText(badge.icon, bx, y);
    });

    this.ctx.restore();
  }

  private renderBadgeNotification(): void {
    if (this.newBadgesEarned.length === 0 || this.badgeNotificationTimer <= 0) return;

    const badge = this.newBadgesEarned[0];
    const fadeIn = Math.min(1, (3000 - this.badgeNotificationTimer) / 300);
    const fadeOut = Math.min(1, this.badgeNotificationTimer / 500);
    const alpha = Math.min(fadeIn, fadeOut);

    const badgeInfo: Record<string, { icon: string; name: string; color: string }> = {
      flawless: { icon: '💎', name: 'FLAWLESS', color: '#00ffff' },
      speedDemon: { icon: '⚡', name: 'SPEED DEMON', color: '#ffcc00' },
      collector: { icon: '🪙', name: 'COLLECTOR', color: '#ffd700' },
      rhythmMaster: { icon: '🎵', name: 'RHYTHM MASTER', color: '#ff00ff' },
    };

    const info = badgeInfo[badge.badge];
    if (!info) return;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    const centerX = GAME_WIDTH / 2;
    const centerY = 150;

    // Glow - convert hex to rgba for better browser compatibility
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
    const r = parseInt(info.color.slice(1, 3), 16);
    const g = parseInt(info.color.slice(3, 5), 16);
    const b = parseInt(info.color.slice(5, 7), 16);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.27)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(centerX - 100, centerY - 50, 200, 100);

    // Badge icon
    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(info.icon, centerX, centerY - 5);

    // Text
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = info.color;
    this.ctx.shadowColor = info.color;
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('BADGE UNLOCKED!', centerX, centerY + 35);

    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(info.name, centerX, centerY + 55);

    this.ctx.restore();
  }

  private updateBadgeNotification(deltaTime: number): void {
    if (this.badgeNotificationTimer > 0) {
      this.badgeNotificationTimer -= deltaTime;
      if (this.badgeNotificationTimer <= 0 && this.newBadgesEarned.length > 0) {
        this.newBadgesEarned.shift();
        if (this.newBadgesEarned.length > 0) {
          this.badgeNotificationTimer = 3000;
        }
      }
    }
  }

  // =====================================================
  // WEATHER / ENVIRONMENTAL EFFECTS
  // =====================================================

  private initWeatherForLevel(): void {
    // Assign weather based on level or random chance
    const levelWeathers: Record<number, WeatherType> = {
      3: 'night',  // Space level - night mode
      4: 'fog',    // Forest level - foggy
      5: 'heat',   // Volcano level - heat shimmer
      6: 'rain',   // Ocean level - rain (underwater bubbles from above)
    };

    this.currentWeather = levelWeathers[this.state.currentLevel] || 'clear';

    // 20% chance for random weather on clear levels
    if (this.currentWeather === 'clear' && Math.random() < 0.2) {
      const randomWeathers: WeatherType[] = ['rain', 'wind', 'fog', 'snow'];
      this.currentWeather = randomWeathers[Math.floor(Math.random() * randomWeathers.length)];
    }

    this.weatherIntensity = this.currentWeather === 'clear' ? 0 : 0.5 + Math.random() * 0.5;
    this.weatherDirection = Math.random() > 0.5 ? 1 : -1;
    this.weatherParticles = [];
    this.fogOpacity = 0;
  }

  private updateWeather(deltaTime: number): void {
    if (!this.weatherEnabled || this.currentWeather === 'clear') return;

    const dt = deltaTime / 1000;

    switch (this.currentWeather) {
      case 'rain':
        this.updateRainWeather(dt);
        break;
      case 'wind':
        this.updateWindWeather(dt);
        break;
      case 'fog':
        this.updateFogWeather(dt);
        break;
      case 'night':
        // Night mode is handled in render
        break;
      case 'snow':
        this.updateSnowWeather(dt);
        break;
      case 'heat':
        // Heat shimmer is handled in render
        break;
    }
  }

  private updateRainWeather(dt: number): void {
    // Spawn new rain particles
    const spawnRate = this.weatherIntensity * 5;
    for (let i = 0; i < spawnRate; i++) {
      if (Math.random() < 0.3) {
        this.weatherParticles.push({
          x: Math.random() * (GAME_WIDTH + 200) - 100,
          y: -20,
          vx: this.weatherDirection * 50,
          vy: 400 + Math.random() * 200,
          size: 2 + Math.random() * 2,
          alpha: 0.3 + Math.random() * 0.4,
        });
      }
    }

    // Update particles using swap-and-pop to avoid O(n²) splice
    let writeIdx = 0;
    for (let i = 0; i < this.weatherParticles.length; i++) {
      const p = this.weatherParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.y <= GAME_HEIGHT + 20) {
        this.weatherParticles[writeIdx++] = p;
      }
    }
    this.weatherParticles.length = Math.min(writeIdx, 200);
  }

  private updateWindWeather(dt: number): void {
    // Wind gusts
    if (Math.random() < 0.01) {
      this.weatherDirection = Math.random() > 0.5 ? 1 : -1;
    }

    // Spawn wind streaks
    if (Math.random() < this.weatherIntensity * 0.5) {
      this.weatherParticles.push({
        x: this.weatherDirection > 0 ? -50 : GAME_WIDTH + 50,
        y: Math.random() * GAME_HEIGHT,
        vx: this.weatherDirection * (300 + Math.random() * 200),
        vy: (Math.random() - 0.5) * 50,
        size: 30 + Math.random() * 50,
        alpha: 0.1 + Math.random() * 0.2,
      });
    }

    // Update particles using swap-and-pop
    let writeIdx = 0;
    for (let i = 0; i < this.weatherParticles.length; i++) {
      const p = this.weatherParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 0.5;

      if (p.alpha > 0 && p.x >= -100 && p.x <= GAME_WIDTH + 100) {
        this.weatherParticles[writeIdx++] = p;
      }
    }
    this.weatherParticles.length = Math.min(writeIdx, 50);
  }

  private updateFogWeather(dt: number): void {
    // Gradually increase fog
    this.fogOpacity = Math.min(this.weatherIntensity * 0.4, this.fogOpacity + dt * 0.1);

    // Floating fog wisps
    if (Math.random() < 0.05) {
      this.weatherParticles.push({
        x: Math.random() * GAME_WIDTH,
        y: GAME_HEIGHT / 2 + (Math.random() - 0.5) * GAME_HEIGHT,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 20,
        size: 100 + Math.random() * 150,
        alpha: 0.1 + Math.random() * 0.15,
      });
    }

    // Update particles using swap-and-pop
    let writeIdx = 0;
    for (let i = 0; i < this.weatherParticles.length; i++) {
      const p = this.weatherParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 0.02;

      if (p.alpha > 0) {
        this.weatherParticles[writeIdx++] = p;
      }
    }
    this.weatherParticles.length = Math.min(writeIdx, 20);
  }

  private updateSnowWeather(dt: number): void {
    // Cache Date.now() outside loop for performance
    const now = Date.now();

    // Spawn snowflakes
    if (Math.random() < this.weatherIntensity * 0.3) {
      this.weatherParticles.push({
        x: Math.random() * (GAME_WIDTH + 100) - 50,
        y: -10,
        vx: (Math.random() - 0.5) * 50 + this.weatherDirection * 20,
        vy: 50 + Math.random() * 50,
        size: 3 + Math.random() * 4,
        alpha: 0.5 + Math.random() * 0.5,
      });
    }

    // Update particles using swap-and-pop
    let writeIdx = 0;
    for (let i = 0; i < this.weatherParticles.length; i++) {
      const p = this.weatherParticles[i];
      p.x += p.vx * dt + Math.sin(now / 500 + i) * 0.5;
      p.y += p.vy * dt;

      if (p.y <= GAME_HEIGHT + 20) {
        this.weatherParticles[writeIdx++] = p;
      }
    }
    this.weatherParticles.length = Math.min(writeIdx, 150);
  }

  private renderWeatherEffects(): void {
    if (!this.weatherEnabled || this.currentWeather === 'clear') return;

    this.ctx.save();

    switch (this.currentWeather) {
      case 'rain':
        this.renderRainEffect();
        break;
      case 'wind':
        this.renderWindEffect();
        break;
      case 'fog':
        this.renderFogEffect();
        break;
      case 'night':
        this.renderNightEffect();
        break;
      case 'snow':
        this.renderSnowEffect();
        break;
      case 'heat':
        this.renderHeatEffect();
        break;
    }

    this.ctx.restore();
  }

  private renderRainEffect(): void {
    this.ctx.strokeStyle = 'rgba(150, 180, 255, 0.6)';
    this.ctx.lineWidth = 1;

    for (const p of this.weatherParticles) {
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x + p.vx * 0.02, p.y + p.size * 3);
      this.ctx.stroke();
    }

    // Slight blue overlay
    this.ctx.globalAlpha = 0.05;
    this.ctx.fillStyle = '#4488ff';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private renderWindEffect(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';

    for (const p of this.weatherParticles) {
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x + p.size * this.weatherDirection, p.y);
      this.ctx.stroke();
    }
  }

  private renderFogEffect(): void {
    // Base fog overlay
    this.ctx.globalAlpha = this.fogOpacity;
    this.ctx.fillStyle = '#888899';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Fog wisps
    for (const p of this.weatherParticles) {
      this.ctx.globalAlpha = p.alpha;
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, 'rgba(200, 200, 210, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }
  }

  private renderNightEffect(): void {
    // Dark overlay with spotlight around player
    const playerScreenX = this.player.x - this.cameraX + this.player.width / 2;
    const playerScreenY = this.player.y + this.player.height / 2;

    // Create spotlight gradient
    const gradient = this.ctx.createRadialGradient(
      playerScreenX, playerScreenY, 0,
      playerScreenX, playerScreenY, this.nightSpotlightRadius
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle vignette
    this.ctx.globalAlpha = 0.3;
    const vignette = this.ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.3,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 20, 0.8)');
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private renderSnowEffect(): void {
    this.ctx.fillStyle = '#ffffff';

    for (const p of this.weatherParticles) {
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Slight cold overlay
    this.ctx.globalAlpha = 0.03;
    this.ctx.fillStyle = '#aaddff';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private renderHeatEffect(): void {
    // Heat shimmer effect using wave distortion simulation
    const time = Date.now() / 1000;
    this.ctx.globalAlpha = 0.03 * this.weatherIntensity;

    // Wavy heat lines
    this.ctx.strokeStyle = 'rgba(255, 150, 50, 0.3)';
    this.ctx.lineWidth = 2;

    for (let y = 0; y < GAME_HEIGHT; y += 30) {
      this.ctx.beginPath();
      for (let x = 0; x < GAME_WIDTH; x += 10) {
        const waveY = y + Math.sin(x / 50 + time * 3 + y / 20) * 5;
        if (x === 0) {
          this.ctx.moveTo(x, waveY);
        } else {
          this.ctx.lineTo(x, waveY);
        }
      }
      this.ctx.stroke();
    }

    // Orange/red tint overlay
    this.ctx.globalAlpha = 0.05;
    this.ctx.fillStyle = '#ff6600';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private applyWeatherPhysics(deltaTime: number): void {
    if (!this.weatherEnabled || this.player.isDead) return;

    // Wind affects player movement
    if (this.currentWeather === 'wind') {
      const windForce = this.weatherDirection * this.weatherIntensity * 50;
      this.player.x += windForce * (deltaTime / 1000);
    }

    // Rain makes platforms slightly slippery (handled in platform physics)
    // Snow slows down player slightly
    if (this.currentWeather === 'snow') {
      // Small slowdown effect is handled in player update
    }
  }

  private renderWeatherIndicator(): void {
    if (this.currentWeather === 'clear') return;

    this.ctx.save();

    const icons: Record<WeatherType, string> = {
      clear: '',
      rain: '🌧️',
      wind: '💨',
      fog: '🌫️',
      night: '🌙',
      snow: '❄️',
      heat: '🔥',
    };

    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.globalAlpha = 0.7;
    this.ctx.fillText(icons[this.currentWeather], GAME_WIDTH - 20, 65);

    this.ctx.restore();
  }
}
