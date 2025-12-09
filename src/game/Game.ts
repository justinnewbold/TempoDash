import { GameState, Particle, LevelConfig, SKINS } from '../types';
import { CONFIG, LEVELS } from '../constants';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { JumpPlatform, PlatformType } from '../entities/JumpPlatform';
import { Hole, HoleType } from '../entities/Hole';
import { GravityZone } from '../entities/GravityZone';
import { MovingObstacle } from '../entities/MovingObstacle';
import { Portal } from '../entities/Portal';
import { Gem } from '../entities/Gem';
import { PowerUp } from '../entities/PowerUp';
import { Background } from '../graphics/Background';
import { AudioSystem } from '../audio/AudioSystem';
import { SaveManager } from '../storage/SaveManager';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private state: GameState = {
    currentLevel: 1,
    score: 0,
    jumpCount: 0,
    gameStatus: 'menu',
    bpm: CONFIG.BASE_BPM
  };

  private player!: Player;
  private obstacles: Obstacle[] = [];
  private platforms: JumpPlatform[] = [];
  private holes: Hole[] = [];
  private gravityZones: GravityZone[] = [];
  private movingObstacles: MovingObstacle[] = [];
  private portals: Portal[] = [];
  private gems: Gem[] = [];
  private powerUps: PowerUp[] = [];
  private particles: Particle[] = [];
  private background!: Background;

  private audio: AudioSystem;
  private saveManager: SaveManager;

  private lastObstacleX = 0;
  private lastPlatformX = 0;
  private lastHoleX = 0;
  private lastGravityX = 0;
  private lastMovingX = 0;
  private lastPortalX = 0;
  private lastGemX = 0;
  private lastPowerUpX = 0;

  private holdingJump = false;
  private levelConfig!: LevelConfig;
  private attemptNumber = 1;

  private selectedMenuLevel = 1;
  private selectedSkinIndex = 0;
  private skinKeys: string[] = [];

  // Mobile detection and touch state
  private isMobile: boolean;
  private exitButtonBounds = { x: 0, y: 0, width: 70, height: 30 };

  // Platform combo system
  private platformCombo = 0;
  private lastPlatformLandTime = 0;
  private comboTimeout = 2000; // 2 seconds to maintain combo
  private beatPulse = 0;

  // Cave ambient sounds
  private lastAmbientSound = 0;
  private ambientSoundInterval = 3000; // 3 seconds between ambient sounds

  // Screen shake effect
  private screenShake = 0;
  private screenShakeX = 0;
  private screenShakeY = 0;

  // Floating score popups
  private scorePopups: { x: number; y: number; text: string; life: number; color: string }[] = [];

  // Near miss tracking
  private lastNearMissTime = 0;

  // Speed lines
  private speedLines: { y: number; length: number; speed: number }[] = [];

  // Beat visualizer
  private beatVisualizerPulse = 0;
  private beatRings: { radius: number; alpha: number }[] = [];

  // Combo flames
  private comboFlames: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];

  // Screen edge warning
  private edgeWarningIntensity = 0;

  // Perfect beat timing
  private lastBeatTime = 0;
  private perfectBeatWindow = 100; // ms window for perfect timing
  private goodBeatWindow = 200; // ms window for good timing
  private beatInterval = 500; // ms between beats (based on BPM)
  private perfectStreak = 0;

  // Fullscreen tracking
  private isFullscreen = false;
  private fullscreenButtonBounds = { x: 0, y: 0, width: 40, height: 40 };

  // Beat-synced camera shake
  private beatShakeIntensity = 0;
  private lastMusicBeat = 0;

  // Chromatic aberration effect
  private chromaticAberration = 0;
  private chromaticTarget = 0;

  // Landing particles
  private landingParticles: { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }[] = [];

  // Score multiplier system
  private scoreMultiplier = 1;
  private multiplierDecay = 0;
  private maxMultiplier = 8;

  // Haptic feedback
  private hapticEnabled = true;

  // Skin trail effects
  private skinTrail: { x: number; y: number; size: number; alpha: number; color: string }[] = [];

  // Pause menu
  private pauseButtonBounds = { x: 0, y: 0, width: 36, height: 36 };
  private pauseMenuButtons: { id: string; x: number; y: number; width: number; height: number }[] = [];

  // Boost button
  private boostButtonBounds = { x: 0, y: 0, width: 50, height: 50 };

  // Tutorial overlay
  private showTutorial = false;

  // Volume sliders (stored as 0-1 values)
  private musicVolumeSlider = { x: 0, y: 0, width: 150, height: 10, value: 0.35 };
  private sfxVolumeSlider = { x: 0, y: 0, width: 150, height: 10, value: 0.6 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    // Detect mobile devices
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (window.innerWidth <= 850);

    this.audio = new AudioSystem();
    this.saveManager = new SaveManager();

    // Load saved volume settings
    this.musicVolumeSlider.value = this.saveManager.getMusicVolume();
    this.sfxVolumeSlider.value = this.saveManager.getSfxVolume();
    this.audio.initVolumes(this.musicVolumeSlider.value, this.sfxVolumeSlider.value);

    this.skinKeys = Object.keys(SKINS);
    this.selectedSkinIndex = this.skinKeys.indexOf(this.saveManager.getCurrentSkin());
    if (this.selectedSkinIndex < 0) this.selectedSkinIndex = 0;

    this.loadLevel(1);
    this.setupInputHandlers();

    // Setup fullscreen for mobile landscape
    if (this.isMobile) {
      this.setupMobileFullscreen();
    }
  }

  private setupMobileFullscreen(): void {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });

    // Also listen for resize as a fallback
    window.addEventListener('resize', () => {
      this.handleOrientationChange();
    });

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      if (this.isFullscreen) {
        this.lockToLandscape();
      }
    });
    document.addEventListener('webkitfullscreenchange', () => {
      this.isFullscreen = !!(document as any).webkitFullscreenElement;
      if (this.isFullscreen) {
        this.lockToLandscape();
      }
    });
  }

  private handleOrientationChange(): void {
    if (!this.isMobile) return;

    const isLandscape = window.innerWidth > window.innerHeight;

    // Auto-request fullscreen when going landscape (will work after user interaction)
    if (isLandscape && !this.isFullscreen) {
      this.requestFullscreen();
    }
  }

  private requestFullscreen(): void {
    const elem = document.documentElement;

    // Try fullscreen with navigation UI hidden (hides browser chrome)
    const fullscreenOptions = { navigationUI: 'hide' } as FullscreenOptions;

    // Try different fullscreen methods for cross-browser support
    if (elem.requestFullscreen) {
      elem.requestFullscreen(fullscreenOptions).then(() => {
        this.isFullscreen = true;
        this.lockToLandscape();
        this.hideAddressBar();
      }).catch(() => {
        this.isFullscreen = false;
      });
    } else if ((elem as any).webkitRequestFullscreen) {
      // Safari/iOS - try with keyboard input disabled for cleaner fullscreen
      (elem as any).webkitRequestFullscreen((Element as any).ALLOW_KEYBOARD_INPUT);
      this.isFullscreen = true;
      this.lockToLandscape();
      this.hideAddressBar();
    } else if ((elem as any).mozRequestFullScreen) {
      (elem as any).mozRequestFullScreen();
      this.isFullscreen = true;
      this.lockToLandscape();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
      this.isFullscreen = true;
      this.lockToLandscape();
    }
  }

  private lockToLandscape(): void {
    // Try to lock screen orientation to landscape
    const screen = window.screen as any;
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {
        // Orientation lock not supported or failed
      });
    }
  }

  private hideAddressBar(): void {
    // Scroll trick to hide address bar on mobile browsers
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 100);

    // Resize canvas to fill available space
    setTimeout(() => {
      this.resizeToFillScreen();
    }, 200);
  }

  private resizeToFillScreen(): void {
    // Force the game container to fill the screen
    const container = document.getElementById('game-container');
    if (container) {
      container.style.width = '100vw';
      container.style.height = '100vh';
    }
  }

  // Call this on first user interaction to enable fullscreen
  private tryEnableFullscreen(): void {
    if (this.isMobile && !this.isFullscreen) {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        this.requestFullscreen();
      }
    }
  }

  private loadLevel(levelId: number): void {
    this.levelConfig = LEVELS[levelId - 1] || LEVELS[0];
    this.state.currentLevel = levelId;

    this.background = new Background(this.levelConfig.background);
    this.audio.setLevelConfig(this.levelConfig.beatConfig, levelId);

    this.player = new Player(this.saveManager.getCurrentSkin());
  }

  private setupInputHandlers(): void {
    // Keyboard (desktop)
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Touch - use document level for "tap anywhere" on mobile
    document.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleTouchStart(e);
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.holdingJump = false;
    }, { passive: false });

    // Mouse (also works on desktop)
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', () => { this.holdingJump = false; });
  }

  private getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  private isInExitButton(x: number, y: number): boolean {
    return x >= this.exitButtonBounds.x &&
           x <= this.exitButtonBounds.x + this.exitButtonBounds.width &&
           y >= this.exitButtonBounds.y &&
           y <= this.exitButtonBounds.y + this.exitButtonBounds.height;
  }

  private isInFullscreenButton(x: number, y: number): boolean {
    return x >= this.fullscreenButtonBounds.x &&
           x <= this.fullscreenButtonBounds.x + this.fullscreenButtonBounds.width &&
           y >= this.fullscreenButtonBounds.y &&
           y <= this.fullscreenButtonBounds.y + this.fullscreenButtonBounds.height;
  }

  private isInPauseButton(x: number, y: number): boolean {
    return x >= this.pauseButtonBounds.x &&
           x <= this.pauseButtonBounds.x + this.pauseButtonBounds.width &&
           y >= this.pauseButtonBounds.y &&
           y <= this.pauseButtonBounds.y + this.pauseButtonBounds.height;
  }

  private isInBoostButton(x: number, y: number): boolean {
    return x >= this.boostButtonBounds.x &&
           x <= this.boostButtonBounds.x + this.boostButtonBounds.width &&
           y >= this.boostButtonBounds.y &&
           y <= this.boostButtonBounds.y + this.boostButtonBounds.height;
  }

  private activateBoost(): void {
    if (this.player.activateDoubleJumpBoost()) {
      this.audio.playPowerUp();
      // Visual feedback
      this.particles.push(...this.player.createDoubleJumpParticles());
    }
  }

  private handlePauseMenuClick(x: number, y: number): void {
    // Check if clicking on a pause menu button
    for (const btn of this.pauseMenuButtons) {
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        this.audio.playClick();
        switch (btn.id) {
          case 'resume':
            this.resumeGame();
            break;
          case 'restart':
            this.restartGame();
            break;
          case 'quit':
            this.returnToMenu();
            break;
        }
        return;
      }
    }

    // Check volume sliders
    if (this.isOnSlider(x, y, this.musicVolumeSlider)) {
      this.updateSliderValue(x, this.musicVolumeSlider);
    } else if (this.isOnSlider(x, y, this.sfxVolumeSlider)) {
      this.updateSliderValue(x, this.sfxVolumeSlider);
    }
  }

  private isOnSlider(x: number, y: number, slider: { x: number; y: number; width: number; height: number }): boolean {
    const padding = 15;
    return x >= slider.x - padding && x <= slider.x + slider.width + padding &&
           y >= slider.y - padding && y <= slider.y + slider.height + padding;
  }

  private updateSliderValue(x: number, slider: { x: number; y: number; width: number; height: number; value: number }): void {
    const newValue = Math.max(0, Math.min(1, (x - slider.x) / slider.width));
    slider.value = newValue;

    // Apply volume changes
    if (slider === this.musicVolumeSlider) {
      this.audio.setMusicVolume(newValue);
      this.saveManager.setMusicVolume(newValue);
    } else if (slider === this.sfxVolumeSlider) {
      this.audio.setSfxVolume(newValue);
      this.saveManager.setSfxVolume(newValue);
      // Play a sample sound so user can hear the change
      this.audio.playClick();
    }
  }

  private toggleFullscreen(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.requestFullscreen();
    }
  }

  private exitFullscreen(): void {
    const exitMethod = document.exitFullscreen
      || (document as any).webkitExitFullscreen
      || (document as any).mozCancelFullScreen
      || (document as any).msExitFullscreen;

    if (exitMethod) {
      exitMethod.call(document).catch(() => {
        // Exit fullscreen failed
      });
    }
    this.isFullscreen = false;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Handle tutorial dismissal
    if (this.showTutorial) {
      this.showTutorial = false;
      this.saveManager.setHasSeenTutorial();
      return;
    }

    if (this.state.gameStatus === 'menu') {
      this.handleMenuKeyDown(e);
    } else if (this.state.gameStatus === 'playing') {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.holdingJump = true;
        this.tryJump();
      } else if (e.code === 'KeyB') {
        // Activate boost with B key
        this.activateBoost();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        this.pauseGame();
      }
    } else if (this.state.gameStatus === 'paused') {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.resumeGame();
      } else if (e.code === 'KeyR') {
        this.restartGame();
      } else if (e.code === 'KeyQ') {
        this.returnToMenu();
      }
    } else if (this.state.gameStatus === 'gameOver') {
      if (e.code === 'Space' || e.code === 'Enter') {
        this.startGame();
      } else if (e.code === 'Escape') {
        this.returnToMenu();
      }
    }
  }

  private handleMenuKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      this.startGame();
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      // Navigate levels up
      const unlockedLevels = this.saveManager.getUnlockedLevels();
      const currentIdx = unlockedLevels.indexOf(this.selectedMenuLevel);
      if (currentIdx > 0) {
        this.selectedMenuLevel = unlockedLevels[currentIdx - 1];
      }
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      // Navigate levels down
      const unlockedLevels = this.saveManager.getUnlockedLevels();
      const currentIdx = unlockedLevels.indexOf(this.selectedMenuLevel);
      if (currentIdx < unlockedLevels.length - 1) {
        this.selectedMenuLevel = unlockedLevels[currentIdx + 1];
      }
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      // Navigate skins left
      this.navigateSkin(-1);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      // Navigate skins right
      this.navigateSkin(1);
    } else if (e.code.startsWith('Digit')) {
      const num = parseInt(e.code.replace('Digit', ''));
      if (num >= 1 && num <= 6 && this.saveManager.isLevelUnlocked(num)) {
        this.selectedMenuLevel = num;
        this.startGame();
      }
    }
  }

  private navigateSkin(direction: number): void {
    const unlockedSkins = this.saveManager.getUnlockedSkins();
    let newIndex = this.selectedSkinIndex + direction;

    // Find next unlocked skin
    while (newIndex >= 0 && newIndex < this.skinKeys.length) {
      if (unlockedSkins.includes(this.skinKeys[newIndex])) {
        this.selectedSkinIndex = newIndex;
        this.saveManager.setCurrentSkin(this.skinKeys[newIndex]);
        break;
      }
      newIndex += direction;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.holdingJump = false;
    }
  }

  private handleTouchStart(e?: TouchEvent): void {
    // Try to enable fullscreen on first interaction
    this.tryEnableFullscreen();

    // Handle tutorial dismissal
    if (this.showTutorial) {
      this.showTutorial = false;
      this.saveManager.setHasSeenTutorial();
      return;
    }

    // Get touch coordinates if event provided
    let coords: { x: number; y: number } | null = null;
    if (e && e.touches[0]) {
      coords = this.getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
    }

    // Check if touch is on UI buttons
    if (coords && this.state.gameStatus === 'playing') {
      // Check boost button first (higher priority)
      if (this.isInBoostButton(coords.x, coords.y) && this.player.getStoredDoubleJumps() > 0) {
        this.activateBoost();
        return;
      }

      // Check pause button
      if (this.isInPauseButton(coords.x, coords.y)) {
        this.pauseGame();
        return;
      }

      // Check fullscreen button
      if (this.isInFullscreenButton(coords.x, coords.y)) {
        this.toggleFullscreen();
        return;
      }

      // Check exit button (mobile only)
      if (this.isMobile && this.isInExitButton(coords.x, coords.y)) {
        this.pauseGame();
        return;
      }
    }

    // Handle paused state
    if (coords && this.state.gameStatus === 'paused') {
      this.handlePauseMenuClick(coords.x, coords.y);
      return;
    }

    if (this.state.gameStatus === 'menu') {
      this.startGame();
    } else if (this.state.gameStatus === 'playing') {
      this.holdingJump = true;
      this.tryJump();
    } else if (this.state.gameStatus === 'gameOver') {
      this.startGame();
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const coords = this.getCanvasCoords(e.clientX, e.clientY);

    // Handle tutorial dismissal
    if (this.showTutorial) {
      this.showTutorial = false;
      this.saveManager.setHasSeenTutorial();
      return;
    }

    // Check if click is on UI buttons (during gameplay)
    if (this.state.gameStatus === 'playing') {
      // Check boost button first (higher priority)
      if (this.isInBoostButton(coords.x, coords.y) && this.player.getStoredDoubleJumps() > 0) {
        this.activateBoost();
        return;
      }

      // Check pause button
      if (this.isInPauseButton(coords.x, coords.y)) {
        this.pauseGame();
        return;
      }

      // Check fullscreen button
      if (this.isInFullscreenButton(coords.x, coords.y)) {
        this.toggleFullscreen();
        return;
      }

      // Check exit button
      if (this.isInExitButton(coords.x, coords.y)) {
        this.pauseGame();
        return;
      }
    }

    // Handle paused state
    if (this.state.gameStatus === 'paused') {
      this.handlePauseMenuClick(coords.x, coords.y);
      return;
    }

    this.handleTouchStart();
  }

  private tryJump(): void {
    // Check if this will be a double jump (player in air with double jump available)
    const isDoubleJump = !this.player.isGrounded && this.player.hasDoubleJump && !this.player.wasDoubleJumpUsed();

    if (this.player.jump()) {
      // Successful jump - create different particles for double jump
      if (isDoubleJump) {
        this.particles.push(...this.player.createDoubleJumpParticles());
        this.audio.playDoubleJump();
        this.screenShake = 5; // Small shake for impact
      } else {
        this.particles.push(...this.player.createJumpParticles());
        this.audio.onJump();
      }

      this.state.jumpCount++;
      this.state.bpm = this.audio.currentBPM;

      // Calculate beat interval based on current BPM
      this.beatInterval = 60000 / this.state.bpm;

      // Check beat timing for bonus
      const now = Date.now();
      const timeSinceLastBeat = now - this.lastBeatTime;
      const timeToNextBeat = this.beatInterval - (timeSinceLastBeat % this.beatInterval);
      const nearestBeatDelta = Math.min(timeSinceLastBeat % this.beatInterval, timeToNextBeat);

      let jumpPoints = 2; // Base points
      let beatLabel: string | undefined;

      if (nearestBeatDelta <= this.perfectBeatWindow) {
        // Perfect timing!
        jumpPoints = 10;
        beatLabel = 'PERFECT';
        this.perfectStreak++;
        this.audio.playPerfectBeat();
      } else if (nearestBeatDelta <= this.goodBeatWindow) {
        // Good timing
        jumpPoints = 5;
        beatLabel = 'GOOD';
        this.perfectStreak = Math.max(0, this.perfectStreak - 1);
      } else {
        // Regular jump
        this.perfectStreak = 0;
      }

      // Streak bonus
      if (this.perfectStreak >= 3) {
        jumpPoints += this.perfectStreak;
        if (this.perfectStreak >= 5 && beatLabel === 'PERFECT') {
          beatLabel = `PERFECT x${this.perfectStreak}`;
        }
      }

      this.state.score += jumpPoints;

      // Show popup for beat timing bonus
      if (beatLabel) {
        this.addScorePopup(this.player.x + this.player.width / 2, this.player.y, jumpPoints, beatLabel);
      }

      // Update last beat time
      this.lastBeatTime = now;

      // Trigger beat pulse for background
      this.beatPulse = 1;
      this.background.setBeatPulse(1);

      // Trigger beat visualizer
      this.beatVisualizerPulse = 1;
      this.beatRings.push({ radius: 30, alpha: 1 });
    }
  }

  async start(): Promise<void> {
    await this.audio.init();
    this.attemptNumber = this.saveManager.getAttemptNumber();
    this.gameLoop();
  }

  private async startGame(): Promise<void> {
    await this.audio.init();
    this.audio.resume();
    this.audio.playClick();

    this.loadLevel(this.selectedMenuLevel);
    this.player = new Player(this.saveManager.getCurrentSkin());

    // Reset game state
    this.obstacles = [];
    this.platforms = [];
    this.holes = [];
    this.gravityZones = [];
    this.movingObstacles = [];
    this.portals = [];
    this.gems = [];
    this.powerUps = [];
    this.particles = [];
    this.comboFlames = [];

    this.state.score = 0;
    this.state.jumpCount = 0;
    this.state.bpm = CONFIG.BASE_BPM;

    // Reset combo
    this.platformCombo = 0;
    this.lastPlatformLandTime = 0;
    this.beatPulse = 0;

    // Initialize spawning positions
    this.lastObstacleX = CONFIG.WIDTH + 200;
    this.lastPlatformX = CONFIG.WIDTH + 400;
    this.lastHoleX = CONFIG.WIDTH + 600;
    this.lastGravityX = CONFIG.WIDTH + 800;
    this.lastMovingX = CONFIG.WIDTH + 1000;
    this.lastPortalX = CONFIG.WIDTH + 1200;
    this.lastGemX = CONFIG.WIDTH + 300;
    this.lastPowerUpX = CONFIG.WIDTH + 800;

    // Spawn initial obstacles
    for (let i = 0; i < 5; i++) {
      this.spawnObstacle();
    }

    // Spawn initial gems
    for (let i = 0; i < 3; i++) {
      this.spawnGem();
    }

    // Spawn level-specific elements
    if (this.levelConfig.features.includes('platforms')) {
      for (let i = 0; i < 3; i++) this.spawnPlatform();
    }
    if (this.levelConfig.features.includes('holes')) {
      this.spawnHole();
    }
    if (this.levelConfig.features.includes('gravity')) {
      this.spawnGravityZone();
    }
    if (this.levelConfig.features.includes('moving')) {
      this.spawnMovingObstacle();
    }
    if (this.levelConfig.features.includes('portals')) {
      this.spawnPortalPair();
    }

    this.attemptNumber = this.saveManager.incrementAttempt();
    this.audio.start();
    this.state.gameStatus = 'playing';

    // Show tutorial for first-time players
    if (!this.saveManager.hasSeenTutorial()) {
      this.showTutorial = true;
    }
  }

  private spawnObstacle(): void {
    const gap = CONFIG.MIN_OBSTACLE_GAP + Math.random() * (CONFIG.MAX_OBSTACLE_GAP - CONFIG.MIN_OBSTACLE_GAP);
    this.lastObstacleX += gap;
    this.obstacles.push(new Obstacle(this.lastObstacleX, undefined, this.state.jumpCount));
  }

  private spawnPlatform(): void {
    const gap = CONFIG.MIN_PLATFORM_GAP + Math.random() * (CONFIG.MAX_PLATFORM_GAP - CONFIG.MIN_PLATFORM_GAP);
    this.lastPlatformX += gap;

    // 40% chance to spawn a tiered sequence, 60% single platform
    if (Math.random() < 0.4) {
      this.spawnTieredPlatforms();
    } else {
      // Determine platform type: 60% normal, 25% bouncy, 15% crumbling
      const typeRoll = Math.random();
      let platformType: PlatformType = 'normal';
      if (typeRoll > 0.85) {
        platformType = 'crumbling';
      } else if (typeRoll > 0.6) {
        platformType = 'bouncy';
      }

      this.platforms.push(new JumpPlatform(
        this.lastPlatformX,
        undefined,
        undefined,
        this.levelConfig.background.lineColor,
        0,
        platformType,
        0
      ));
    }
  }

  private spawnTieredPlatforms(): void {
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    const tiers = 2 + Math.floor(Math.random() * 3); // 2-4 tiers
    const goingUp = Math.random() > 0.5; // 50% ascending, 50% descending
    const direction = goingUp ? 1 : -1;

    // Starting height for first platform (80px base, higher if descending)
    const baseHeight = goingUp ? 80 : 80 + (tiers - 1) * 50;
    const heightStep = 45; // Height difference between tiers (jumpable)
    const xStep = 100 + Math.random() * 30; // Horizontal spacing between platforms

    for (let i = 0; i < tiers; i++) {
      const tierHeight = goingUp
        ? baseHeight + i * heightStep
        : baseHeight - i * heightStep;

      const platformX = this.lastPlatformX + i * xStep;
      const platformY = groundY - tierHeight;

      // Slightly varying widths, getting smaller as we go higher
      const width = 90 - i * 10 + Math.random() * 20;

      // Random type for tiered platforms (less crumbling in sequences)
      const typeRoll = Math.random();
      let platformType: PlatformType = 'normal';
      if (typeRoll > 0.9) {
        platformType = 'crumbling';
      } else if (typeRoll > 0.7) {
        platformType = 'bouncy';
      }

      this.platforms.push(new JumpPlatform(
        platformX,
        platformY,
        Math.max(60, width),
        this.levelConfig.background.lineColor,
        i + 1,
        platformType,
        direction
      ));
    }

    // Update lastPlatformX to end of sequence
    this.lastPlatformX += (tiers - 1) * xStep;
  }

  private spawnHole(): void {
    this.lastHoleX += 400 + Math.random() * 300;

    // Determine hole type based on progression
    let holeType: HoleType = 'normal';
    const score = this.state.score;

    if (score > 500) {
      // After 500 points, introduce variety
      const roll = Math.random();
      if (score > 1500 && roll > 0.7) {
        // Wide holes appear after 1500 points (30% chance)
        holeType = 'wide';
      } else if (roll > 0.5) {
        // Crystal holes (20-50% chance based on score)
        holeType = 'crystal';
      }
    }

    this.holes.push(new Hole(this.lastHoleX, undefined, holeType));
  }

  private spawnGravityZone(): void {
    this.lastGravityX += 500 + Math.random() * 400;
    this.gravityZones.push(new GravityZone(this.lastGravityX));
  }

  private spawnMovingObstacle(): void {
    this.lastMovingX += 400 + Math.random() * 300;
    this.movingObstacles.push(new MovingObstacle(this.lastMovingX));
  }

  private spawnPortalPair(): void {
    this.lastPortalX += 600 + Math.random() * 400;
    const portal1 = new Portal(this.lastPortalX);
    const portal2X = this.lastPortalX + 200 + Math.random() * 150;
    const portal2 = new Portal(portal2X);
    portal1.link(portal2);
    this.portals.push(portal1, portal2);
    this.lastPortalX = portal2X;
  }

  private spawnGem(): void {
    this.lastGemX += 150 + Math.random() * 250;
    this.gems.push(new Gem(this.lastGemX));
  }

  private spawnPowerUp(): void {
    // Power-ups spawn less frequently than gems
    this.lastPowerUpX += 600 + Math.random() * 800;
    this.powerUps.push(new PowerUp(this.lastPowerUpX));
  }

  private gameOver(): void {
    this.state.gameStatus = 'gameOver';
    this.particles.push(...this.player.createDeathParticles());
    this.audio.stop(); // Stop the music
    this.audio.playCrash();

    // Trigger screen shake
    this.screenShake = 15;

    // Submit score (save manager handles unlock checks internally)
    this.saveManager.submitScore(this.state.currentLevel, this.state.score);
  }

  private addScorePopup(x: number, y: number, points: number, label?: string): void {
    const text = label ? `+${points} ${label}` : `+${points}`;
    let color = '#ffffff';

    if (label === 'CRYSTAL') color = '#44aaff';
    else if (label === 'COMBO') color = '#ff44ff';
    else if (label === 'NEAR MISS') color = '#ffff44';
    else if (label?.startsWith('PERFECT')) color = '#ffdd00';
    else if (label === 'GOOD') color = '#88ff88';
    else if (label === 'SUPER') color = '#ff44ff';
    else if (label === 'RARE') color = '#44ff44';
    else if (label === 'GEM') color = '#44aaff';
    else if (points >= 50) color = '#44ff44';

    this.scorePopups.push({
      x,
      y: y - 20,
      text,
      life: 1,
      color
    });
  }

  private pauseGame(): void {
    if (this.state.gameStatus === 'playing') {
      this.state.gameStatus = 'paused';
      this.audio.stopMusic();
      this.audio.playClick();
      this.holdingJump = false;
    }
  }

  private resumeGame(): void {
    if (this.state.gameStatus === 'paused') {
      this.state.gameStatus = 'playing';
      this.audio.startMusic();
      this.audio.playClick();
    }
  }

  private restartGame(): void {
    this.audio.playClick();
    this.state.gameStatus = 'menu'; // Temporarily go to menu
    this.startGame(); // Then start fresh
  }

  private returnToMenu(): void {
    // Submit current score before returning
    if (this.state.score > 0) {
      this.saveManager.submitScore(this.state.currentLevel, this.state.score);
    }

    this.audio.stop(); // Stop the music
    this.state.gameStatus = 'menu';
    this.holdingJump = false;
    this.audio.playClick();
  }

  private gameLoop = (): void => {
    this.update();
    this.render();
    requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    const gameSpeed = this.state.gameStatus === 'playing' ? this.audio.getGameSpeed() : 0.3;

    // Update background
    this.background.update(gameSpeed);

    if (this.state.gameStatus !== 'playing' || this.showTutorial) {
      // Update particles even when not playing or during tutorial
      this.updateParticles(gameSpeed);
      return;
    }

    // Update player
    this.player.update(gameSpeed);

    // Auto-jump when holding
    if (this.holdingJump && this.player.isGrounded) {
      this.tryJump();
    }

    // Check gravity zones (Level 4+)
    let inGravityZone = false;
    for (const zone of this.gravityZones) {
      if (zone.isPlayerInside(this.player.x, this.player.width)) {
        inGravityZone = true;
        this.player.setLowGravity(true, zone.multiplier);
      }
    }
    if (!inGravityZone) {
      this.player.setLowGravity(false);
    }

    // Check platform landings (Level 2+)
    for (const platform of this.platforms) {
      if (platform.checkLanding(this.player.x, this.player.y, this.player.width, this.player.height, this.player.velocityY)) {
        // Handle bouncy platform
        if (platform.type === 'bouncy') {
          this.player.landOnPlatform(platform.y);
          // Immediately jump with extra force
          this.player.velocityY = CONFIG.JUMP_FORCE * platform.getBounceMultiplier();
          this.player.isGrounded = false;
          this.audio.playPlatformLand(true);
        } else {
          this.player.landOnPlatform(platform.y);
          this.audio.playPlatformLand(false);
        }

        // Handle crumbling platform
        if (platform.type === 'crumbling' && !platform.isCrumbling) {
          platform.startCrumbling();
          this.audio.playCrumble();
        }

        // Create landing particles
        this.particles.push(...this.createLandingParticles(platform));

        // Award points for landing
        const now = Date.now();
        const timeSinceLastLand = now - this.lastPlatformLandTime;

        // Check combo
        if (timeSinceLastLand < this.comboTimeout) {
          this.platformCombo++;
          this.boostMultiplier(); // Boost multiplier on combo
          this.triggerHaptic(30); // Haptic feedback
        } else {
          this.platformCombo = 1;
        }
        this.lastPlatformLandTime = now;

        // Base points + combo multiplier
        const basePoints = 15;
        const tierBonus = platform.tier * 5;
        const comboMultiplier = Math.min(this.platformCombo, 10);
        const totalPoints = (basePoints + tierBonus) * comboMultiplier;
        this.state.score += totalPoints;

        // Play combo sound if combo > 1
        if (this.platformCombo > 1) {
          this.audio.playCombo(this.platformCombo);
        }

        break; // Only land on one platform
      }
    }

    // Reset combo if on ground and not landing on platform
    if (this.player.isGrounded && this.player.y >= CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - this.player.height - 5) {
      const now = Date.now();
      if (now - this.lastPlatformLandTime > this.comboTimeout) {
        this.platformCombo = 0;
      }
    }

    // Check portal teleportation (Level 6)
    for (const portal of this.portals) {
      if (portal.canTeleport() && portal.checkContact(this.player.x, this.player.y, this.player.width, this.player.height)) {
        const exit = portal.linkedPortal!.getExitPosition();
        this.player.x = exit.x - this.player.width / 2;
        this.player.y = exit.y - this.player.height;
        portal.triggerCooldown();
        this.audio.playPortal();
        break;
      }
    }

    // Update and check obstacles
    for (const obstacle of this.obstacles) {
      obstacle.update(gameSpeed);

      if (obstacle.checkCollision(this.player.x, this.player.y, this.player.width, this.player.height)) {
        this.player.die();
        this.gameOver();
        return;
      }

      if (!obstacle.passed && obstacle.x + obstacle.width < this.player.x) {
        obstacle.passed = true;

        // Check for near miss bonus (passed within 15px horizontally while jumping)
        const wasClose = obstacle.x + obstacle.width > this.player.x - 20;
        const now = Date.now();
        let points = 50;
        let label: string | undefined;

        if (wasClose && !this.player.isGrounded && now - this.lastNearMissTime > 500) {
          // Near miss! Extra points
          points = 75;
          label = 'NEAR MISS';
          this.lastNearMissTime = now;
        }

        this.state.score += points;
        this.addScorePopup(obstacle.x + obstacle.width / 2, obstacle.y, points, label);
        this.audio.playScore();
      }
    }

    // Update and check holes (Level 3+)
    for (const hole of this.holes) {
      hole.update(gameSpeed, this.beatPulse);

      // Check if player is approaching (for warning)
      if (hole.checkApproaching(this.player.x, this.player.width)) {
        this.audio.playHoleWarning();
        hole.markWarningPlayed();
      }

      // Check for death
      if (hole.checkDeath(this.player.x, this.player.y, this.player.width, this.player.height)) {
        this.player.die();
        this.audio.playFallIntoHole();
        this.gameOver();
        return;
      }

      // Check if player successfully crossed the hole
      if (hole.checkPassed(this.player.x)) {
        const bonus = hole.getCrossBonus();
        this.state.score += bonus;
        const label = hole.type === 'crystal' ? 'CRYSTAL' : (hole.type === 'wide' ? 'WIDE' : undefined);
        this.addScorePopup(hole.x + hole.width / 2, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT - 30, bonus, label);
        this.audio.playScore();
      }
    }

    // Update and check gems
    for (const gem of this.gems) {
      gem.update(gameSpeed);

      if (gem.checkCollection(this.player.x, this.player.y, this.player.width, this.player.height)) {
        const points = gem.getPoints();
        this.state.score += points;
        const label = gem.type === 'super' ? 'SUPER' : (gem.type === 'rare' ? 'RARE' : 'GEM');
        this.addScorePopup(gem.x, gem.y, points, label);
        this.audio.playGemCollect(gem.type);
      }
    }

    // Update and check power-ups
    for (const powerUp of this.powerUps) {
      powerUp.update(gameSpeed);

      if (powerUp.checkCollection(this.player.x, this.player.y, this.player.width, this.player.height)) {
        if (powerUp.type === 'doubleJump') {
          // Add to stored boosts instead of auto-activating
          this.player.addDoubleJumpBoost();
          this.addScorePopup(powerUp.x, powerUp.y, 0, '+1 BOOST!');
          this.audio.playPowerUp();
          // Create collection particles
          this.particles.push(...this.createPowerUpParticles(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2));
        }
      }
    }

    // Update player power-up timers
    this.player.updatePowerUps();

    // Cave ambient sounds (Level 3)
    if (this.levelConfig.background.type === 'cave') {
      const now = Date.now();
      if (now - this.lastAmbientSound > this.ambientSoundInterval) {
        this.lastAmbientSound = now;
        // Randomly play water drip or crystal chime
        if (Math.random() > 0.5) {
          this.audio.playWaterDrip();
        } else {
          this.audio.playCrystalChime();
        }
        // Vary the interval for more natural feel
        this.ambientSoundInterval = 2000 + Math.random() * 3000;
      }
    }

    // Update and check moving obstacles (Level 5+)
    for (const moving of this.movingObstacles) {
      moving.update(gameSpeed);
      if (moving.checkCollision(this.player.x, this.player.y, this.player.width, this.player.height)) {
        this.player.die();
        this.gameOver();
        return;
      }
    }

    // Update platforms with beat pulse
    for (const platform of this.platforms) {
      platform.update(gameSpeed, this.beatPulse);
    }

    // Decay beat pulse
    this.beatPulse *= 0.95;

    // Update gravity zones
    for (const zone of this.gravityZones) {
      zone.update(gameSpeed);
    }

    // Update portals
    for (const portal of this.portals) {
      portal.update(gameSpeed, 16);
    }

    // Remove off-screen elements and spawn new ones
    this.obstacles = this.obstacles.filter(o => o.x > -100);
    while (this.obstacles.length < 5) {
      this.spawnObstacle();
    }

    if (this.levelConfig.features.includes('platforms')) {
      // Remove off-screen and fully crumbled platforms
      this.platforms = this.platforms.filter(p => p.x > -150 && !p.shouldRemove());
      while (this.platforms.length < 3) {
        this.spawnPlatform();
      }
    }

    if (this.levelConfig.features.includes('holes')) {
      this.holes = this.holes.filter(h => h.x > -150);
      if (this.holes.length < 2) {
        this.spawnHole();
      }
    }

    if (this.levelConfig.features.includes('gravity')) {
      this.gravityZones = this.gravityZones.filter(g => g.x > -300);
      if (this.gravityZones.length < 1) {
        this.spawnGravityZone();
      }
    }

    if (this.levelConfig.features.includes('moving')) {
      this.movingObstacles = this.movingObstacles.filter(m => m.baseX > -100);
      if (this.movingObstacles.length < 2) {
        this.spawnMovingObstacle();
      }
    }

    if (this.levelConfig.features.includes('portals')) {
      this.portals = this.portals.filter(p => p.x > -100);
      // Count portal pairs
      const pairs = this.portals.length / 2;
      if (pairs < 1) {
        this.spawnPortalPair();
      }
    }

    // Remove collected/off-screen gems and spawn new ones
    this.gems = this.gems.filter(g => !g.collected && g.x > -50);
    while (this.gems.length < 5) {
      this.spawnGem();
    }

    // Remove collected/off-screen power-ups and spawn new ones (less frequently)
    this.powerUps = this.powerUps.filter(p => !p.collected && p.x > -50);
    if (this.powerUps.length < 1) {
      this.spawnPowerUp();
    }

    // Update particles
    this.updateParticles(gameSpeed);

    // Update screen shake
    this.updateScreenShake();

    // Update score popups
    this.updateScorePopups(gameSpeed);

    // Update speed lines at high speeds
    this.updateSpeedLines(gameSpeed);

    // Update beat visualizer
    this.updateBeatVisualizer(gameSpeed);

    // Update combo flames
    this.updateComboFlames(gameSpeed);

    // Update screen edge warning
    this.updateEdgeWarning();

    // Update beat-synced camera shake
    this.updateBeatShake();

    // Update chromatic aberration based on combo/speed
    this.updateChromaticAberration(gameSpeed);

    // Update landing particles
    this.updateLandingParticles(gameSpeed);

    // Update score multiplier decay
    this.updateMultiplier();

    // Update skin trail
    this.updateSkinTrail();
  }

  private updateScreenShake(): void {
    if (this.screenShake > 0) {
      this.screenShakeX = (Math.random() - 0.5) * this.screenShake * 2;
      this.screenShakeY = (Math.random() - 0.5) * this.screenShake * 2;
      this.screenShake *= 0.85; // Decay
      if (this.screenShake < 0.5) this.screenShake = 0;
    } else {
      this.screenShakeX = 0;
      this.screenShakeY = 0;
    }
  }

  private updateScorePopups(gameSpeed: number): void {
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const popup = this.scorePopups[i];
      popup.y -= 1.5 * gameSpeed; // Float upward
      popup.life -= 0.02 * Math.max(gameSpeed, 0.5);

      if (popup.life <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  private updateSpeedLines(gameSpeed: number): void {
    // Add new speed lines when going fast
    if (gameSpeed > 1.5 && Math.random() < (gameSpeed - 1.5) * 0.3) {
      this.speedLines.push({
        y: Math.random() * CONFIG.HEIGHT,
        length: 50 + Math.random() * 100,
        speed: 15 + Math.random() * 10
      });
    }

    // Update existing speed lines
    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      const line = this.speedLines[i];
      line.y += line.speed * gameSpeed * 0.1; // Slight vertical drift

      // Remove lines that have been around too long
      line.length -= 2 * gameSpeed;
      if (line.length <= 0) {
        this.speedLines.splice(i, 1);
      }
    }

    // Limit max speed lines
    while (this.speedLines.length > 20) {
      this.speedLines.shift();
    }
  }

  private updateBeatVisualizer(gameSpeed: number): void {
    // Decay visualizer pulse
    if (this.beatVisualizerPulse > 0) {
      this.beatVisualizerPulse -= 0.05 * Math.max(gameSpeed, 0.5);
      if (this.beatVisualizerPulse < 0) this.beatVisualizerPulse = 0;
    }

    // Update expanding rings
    for (let i = this.beatRings.length - 1; i >= 0; i--) {
      const ring = this.beatRings[i];
      ring.radius += 3 * gameSpeed;
      ring.alpha -= 0.03 * Math.max(gameSpeed, 0.5);

      if (ring.alpha <= 0) {
        this.beatRings.splice(i, 1);
      }
    }

    // Limit max rings
    while (this.beatRings.length > 5) {
      this.beatRings.shift();
    }
  }

  private updateComboFlames(gameSpeed: number): void {
    // Spawn flame particles when combo is active
    if (this.platformCombo >= 2) {
      const intensity = Math.min(this.platformCombo, 10);
      const spawnRate = 0.3 + intensity * 0.1;

      if (Math.random() < spawnRate * gameSpeed) {
        // Spawn flames from sides and bottom of player
        const side = Math.random() > 0.5 ? -1 : 1;
        const fromBottom = Math.random() > 0.3;

        this.comboFlames.push({
          x: this.player.x + this.player.width / 2 + (fromBottom ? (Math.random() - 0.5) * this.player.width : side * this.player.width * 0.4),
          y: this.player.y + (fromBottom ? this.player.height : this.player.height * 0.7),
          vx: (Math.random() - 0.5) * 2 + (fromBottom ? 0 : side * -1),
          vy: -2 - Math.random() * 3 - intensity * 0.3,
          life: 1,
          size: 4 + Math.random() * 4 + intensity * 0.5
        });
      }
    }

    // Update existing flames
    for (let i = this.comboFlames.length - 1; i >= 0; i--) {
      const flame = this.comboFlames[i];
      flame.x += flame.vx * gameSpeed;
      flame.y += flame.vy * gameSpeed;
      flame.vy -= 0.1 * gameSpeed; // Rise faster
      flame.life -= 0.04 * Math.max(gameSpeed, 0.5);
      flame.size *= 0.98;

      if (flame.life <= 0 || flame.size < 1) {
        this.comboFlames.splice(i, 1);
      }
    }

    // Limit max flames
    while (this.comboFlames.length > 50) {
      this.comboFlames.shift();
    }
  }

  private updateEdgeWarning(): void {
    // Check for nearby obstacles/dangers from the right
    let maxIntensity = 0;
    const warningZoneStart = CONFIG.WIDTH - 150;
    const warningZoneEnd = CONFIG.WIDTH + 50;

    // Check obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.x > warningZoneStart && obstacle.x < warningZoneEnd) {
        const distance = obstacle.x - this.player.x;
        if (distance > 0 && distance < 300) {
          const intensity = 1 - (distance / 300);
          maxIntensity = Math.max(maxIntensity, intensity);
        }
      }
    }

    // Check moving obstacles
    for (const moving of this.movingObstacles) {
      if (moving.baseX > warningZoneStart && moving.baseX < warningZoneEnd) {
        const distance = moving.baseX - this.player.x;
        if (distance > 0 && distance < 300) {
          const intensity = 1 - (distance / 300);
          maxIntensity = Math.max(maxIntensity, intensity);
        }
      }
    }

    // Smooth transition
    const targetIntensity = maxIntensity * 0.6; // Don't make it too intense
    this.edgeWarningIntensity += (targetIntensity - this.edgeWarningIntensity) * 0.1;
  }

  private updateBeatShake(): void {
    // Get current beat and check if it changed
    const currentBeat = this.audio.getCurrentBeat();
    if (currentBeat !== this.lastMusicBeat) {
      this.lastMusicBeat = currentBeat;

      // Add shake on kick beats
      if (this.audio.isKickBeat()) {
        const intensity = this.audio.getMusicIntensity();
        this.beatShakeIntensity = 2 + intensity * 3; // Subtle 2-5 pixel shake

        // Trigger haptic feedback on mobile
        if (this.isMobile && this.hapticEnabled && navigator.vibrate) {
          navigator.vibrate(10); // Very short vibration
        }
      }
    }

    // Apply beat shake to screen shake system
    if (this.beatShakeIntensity > 0) {
      this.screenShakeX += (Math.random() - 0.5) * this.beatShakeIntensity;
      this.screenShakeY += (Math.random() - 0.5) * this.beatShakeIntensity * 0.5;
      this.beatShakeIntensity *= 0.7; // Faster decay than normal shake
      if (this.beatShakeIntensity < 0.3) this.beatShakeIntensity = 0;
    }
  }

  private updateChromaticAberration(gameSpeed: number): void {
    // Target chromatic aberration based on combo and speed
    const comboFactor = Math.min(this.platformCombo / 5, 1); // 0-1 based on combo
    const speedFactor = Math.min((gameSpeed - 1) / 2, 1); // 0-1 based on speed
    const intensity = this.audio.getMusicIntensity();

    this.chromaticTarget = (comboFactor * 0.4 + speedFactor * 0.3 + intensity * 0.3) * 8; // Max 8 pixels

    // Smooth transition
    this.chromaticAberration += (this.chromaticTarget - this.chromaticAberration) * 0.1;
  }

  private updateLandingParticles(gameSpeed: number): void {
    for (let i = this.landingParticles.length - 1; i >= 0; i--) {
      const p = this.landingParticles[i];
      p.x += p.vx * gameSpeed;
      p.y += p.vy * gameSpeed;
      p.vy += 0.3; // Gravity
      p.life -= 0.03;
      p.size *= 0.98;

      if (p.life <= 0) {
        this.landingParticles.splice(i, 1);
      }
    }
  }

  private updateMultiplier(): void {
    // Decay multiplier over time if not maintained
    this.multiplierDecay += 1;
    if (this.multiplierDecay > 120) { // ~2 seconds at 60fps
      this.scoreMultiplier = Math.max(1, this.scoreMultiplier - 0.5);
      this.multiplierDecay = 0;
    }
  }

  private boostMultiplier(): void {
    this.scoreMultiplier = Math.min(this.scoreMultiplier + 0.5, this.maxMultiplier);
    this.multiplierDecay = 0;
  }

  private updateSkinTrail(): void {
    // Add current player position to trail
    if (this.state.gameStatus === 'playing') {
      const skinKey = this.saveManager.getCurrentSkin();
      const skin = SKINS[skinKey];

      this.skinTrail.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        size: this.player.width * 0.8,
        alpha: 0.6,
        color: skin?.trail || skin?.colors?.[0] || '#00ffff'
      });

      // Limit trail length
      while (this.skinTrail.length > 15) {
        this.skinTrail.shift();
      }
    }

    // Fade out trail
    for (let i = this.skinTrail.length - 1; i >= 0; i--) {
      this.skinTrail[i].alpha -= 0.04;
      this.skinTrail[i].size *= 0.95;
      if (this.skinTrail[i].alpha <= 0) {
        this.skinTrail.splice(i, 1);
      }
    }
  }

  private triggerHaptic(duration: number = 20): void {
    if (this.isMobile && this.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  private updateParticles(gameSpeed: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.velocityX * gameSpeed;
      p.y += p.velocityY * gameSpeed;
      p.velocityY += 0.2 * gameSpeed;
      p.life -= 0.03 * Math.max(gameSpeed, 0.3);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private createLandingParticles(platform: JumpPlatform): Particle[] {
    const particles: Particle[] = [];
    const particleCount = platform.type === 'bouncy' ? 12 : 8;

    for (let i = 0; i < particleCount; i++) {
      // Position particles at player's feet on the platform
      const x = this.player.x + Math.random() * this.player.width;
      const y = platform.y;

      // Different colors based on platform type
      let hue = 180; // Default cyan
      if (platform.type === 'bouncy') {
        hue = 140; // Green
      } else if (platform.type === 'crumbling') {
        hue = 30; // Orange
      }

      particles.push({
        x,
        y,
        velocityX: (Math.random() - 0.5) * 6,
        velocityY: Math.random() * -4 - 1,
        life: 1,
        size: Math.random() * 5 + 2,
        hue: hue + Math.random() * 30
      });
    }

    return particles;
  }

  private createPowerUpParticles(x: number, y: number): Particle[] {
    const particles: Particle[] = [];

    // Burst of orange/yellow particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 4 + Math.random() * 4;
      particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 1,
        size: Math.random() * 8 + 4,
        hue: 30 + Math.random() * 30 // Orange to yellow
      });
    }

    return particles;
  }

  private render(): void {
    const gameSpeed = this.state.gameStatus === 'playing' ? this.audio.getGameSpeed() : 0.3;

    // Apply screen shake
    this.ctx.save();
    if (this.screenShake > 0) {
      this.ctx.translate(this.screenShakeX, this.screenShakeY);
    }

    // Render background
    this.background.render(this.ctx, this.state.gameStatus === 'playing', gameSpeed);

    // Render speed lines (behind everything else)
    this.renderSpeedLines();

    // Render edge warning
    this.renderEdgeWarning();

    // Render holes (behind everything)
    for (const hole of this.holes) {
      hole.render(this.ctx, this.levelConfig.background.groundColor);
    }

    // Render gravity zones
    for (const zone of this.gravityZones) {
      zone.render(this.ctx);
    }

    // Render platforms
    for (const platform of this.platforms) {
      platform.render(this.ctx);
    }

    // Render gems
    for (const gem of this.gems) {
      gem.render(this.ctx);
    }

    // Render power-ups
    for (const powerUp of this.powerUps) {
      powerUp.render(this.ctx);
    }

    // Render portals
    for (const portal of this.portals) {
      portal.render(this.ctx);
    }

    // Render obstacles
    for (const obstacle of this.obstacles) {
      obstacle.render(this.ctx);
    }

    // Render moving obstacles
    for (const moving of this.movingObstacles) {
      moving.render(this.ctx);
    }

    // Render combo flames (behind player)
    if (this.state.gameStatus === 'playing') {
      this.renderComboFlames();
    }

    // Render skin trail (behind player)
    if (this.state.gameStatus === 'playing') {
      this.renderSkinTrail();
    }

    // Render player
    if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'gameOver' || this.state.gameStatus === 'paused') {
      this.player.render(this.ctx);
    }

    // Render landing particles
    this.renderLandingParticles();

    // Render particles
    this.renderParticles();

    // Render UI
    this.renderUI();

    // Render beat visualizer
    this.renderBeatVisualizer();

    // Render score popups
    this.renderScorePopups();

    // Restore from screen shake
    this.ctx.restore();

    // Render overlays (not affected by screen shake)
    if (this.state.gameStatus === 'menu') {
      this.renderMenu();
    } else if (this.state.gameStatus === 'paused') {
      this.renderPauseMenu();
    } else if (this.state.gameStatus === 'gameOver') {
      this.renderGameOver();
    }

    // Render tutorial on top of everything
    if (this.showTutorial) {
      this.renderTutorial();
    }
  }

  private renderEdgeWarning(): void {
    if (this.edgeWarningIntensity < 0.01) return;

    this.ctx.save();

    // Right edge warning glow
    const gradient = this.ctx.createLinearGradient(
      CONFIG.WIDTH - 80, 0,
      CONFIG.WIDTH, 0
    );

    const alpha = this.edgeWarningIntensity * 0.4;
    const pulseAlpha = alpha * (0.8 + Math.sin(Date.now() * 0.01) * 0.2);

    gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
    gradient.addColorStop(0.5, `rgba(255, 50, 0, ${pulseAlpha * 0.5})`);
    gradient.addColorStop(1, `rgba(255, 100, 0, ${pulseAlpha})`);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(CONFIG.WIDTH - 80, 0, 80, CONFIG.HEIGHT);

    // Add pulsing warning indicator
    if (this.edgeWarningIntensity > 0.3) {
      const indicatorY = CONFIG.HEIGHT / 2;
      const indicatorX = CONFIG.WIDTH - 30;
      const pulseSize = 10 + Math.sin(Date.now() * 0.015) * 5;

      this.ctx.fillStyle = `rgba(255, 100, 0, ${this.edgeWarningIntensity * 0.8})`;
      this.ctx.shadowColor = '#ff4400';
      this.ctx.shadowBlur = 20;

      // Triangle pointing left
      this.ctx.beginPath();
      this.ctx.moveTo(indicatorX + pulseSize, indicatorY - pulseSize);
      this.ctx.lineTo(indicatorX - pulseSize, indicatorY);
      this.ctx.lineTo(indicatorX + pulseSize, indicatorY + pulseSize);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
    }

    this.ctx.restore();
  }

  private renderSpeedLines(): void {
    if (this.speedLines.length === 0) return;

    const gameSpeed = this.audio.getGameSpeed();
    const intensity = Math.min((gameSpeed - 1.5) / 2, 1); // 0-1 based on speed

    this.ctx.save();
    for (const line of this.speedLines) {
      const alpha = intensity * 0.4;
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      // Lines come from the right
      this.ctx.moveTo(CONFIG.WIDTH + 10, line.y);
      this.ctx.lineTo(CONFIG.WIDTH - line.length, line.y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private renderScorePopups(): void {
    for (const popup of this.scorePopups) {
      const alpha = popup.life;
      const scale = 0.8 + (1 - popup.life) * 0.4; // Grow slightly as it fades

      this.ctx.save();
      this.ctx.translate(popup.x, popup.y);
      this.ctx.scale(scale, scale);

      // Shadow/outline
      this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
      this.ctx.fillText(popup.text, 2, 2);

      // Main text
      this.ctx.fillStyle = popup.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '');
      // Handle hex colors
      if (popup.color.startsWith('#')) {
        const r = parseInt(popup.color.slice(1, 3), 16);
        const g = parseInt(popup.color.slice(3, 5), 16);
        const b = parseInt(popup.color.slice(5, 7), 16);
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      this.ctx.shadowColor = popup.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillText(popup.text, 0, 0);

      this.ctx.restore();
    }
  }

  private renderComboFlames(): void {
    if (this.comboFlames.length === 0) return;

    const intensity = Math.min(this.platformCombo, 10);

    for (const flame of this.comboFlames) {
      this.ctx.save();

      // Flame color gradient from yellow to orange to red based on life
      const hue = 60 - flame.life * 40; // Yellow -> Orange -> Red as life decreases
      const saturation = 100;
      const lightness = 50 + flame.life * 20;

      this.ctx.globalAlpha = flame.life * 0.8;
      this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      this.ctx.shadowBlur = 15 + intensity * 2;

      // Draw flame as a teardrop shape
      this.ctx.beginPath();
      this.ctx.moveTo(flame.x, flame.y - flame.size);
      this.ctx.bezierCurveTo(
        flame.x + flame.size, flame.y - flame.size * 0.5,
        flame.x + flame.size * 0.5, flame.y + flame.size * 0.5,
        flame.x, flame.y + flame.size
      );
      this.ctx.bezierCurveTo(
        flame.x - flame.size * 0.5, flame.y + flame.size * 0.5,
        flame.x - flame.size, flame.y - flame.size * 0.5,
        flame.x, flame.y - flame.size
      );
      this.ctx.fill();

      this.ctx.restore();
    }

    // Draw aura glow around player when combo is high
    if (this.platformCombo >= 3) {
      this.ctx.save();
      const auraIntensity = Math.min((this.platformCombo - 2) / 8, 1);
      const auraSize = 10 + auraIntensity * 20;

      const gradient = this.ctx.createRadialGradient(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        0,
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        this.player.width + auraSize
      );

      const hue = 40 + Math.sin(Date.now() * 0.01) * 20;
      gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, ${auraIntensity * 0.3})`);
      gradient.addColorStop(0.5, `hsla(${hue - 20}, 100%, 50%, ${auraIntensity * 0.15})`);
      gradient.addColorStop(1, `hsla(${hue - 40}, 100%, 40%, 0)`);

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(
        this.player.x - auraSize,
        this.player.y - auraSize,
        this.player.width + auraSize * 2,
        this.player.height + auraSize * 2
      );

      this.ctx.restore();
    }
  }

  private renderSkinTrail(): void {
    if (this.skinTrail.length === 0) return;

    for (const trail of this.skinTrail) {
      this.ctx.save();
      this.ctx.globalAlpha = trail.alpha;
      this.ctx.fillStyle = trail.color;
      this.ctx.shadowColor = trail.color;
      this.ctx.shadowBlur = 10;

      this.ctx.beginPath();
      this.ctx.arc(trail.x, trail.y, trail.size / 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private renderLandingParticles(): void {
    if (this.landingParticles.length === 0) return;

    for (const p of this.landingParticles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private renderMultiplierBar(): void {
    if (this.scoreMultiplier <= 1) return;

    const barWidth = 100;
    const barHeight = 8;
    const barX = CONFIG.WIDTH - barWidth - 20;
    const barY = 75; // Below high score

    this.ctx.save();

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.beginPath();
    this.ctx.roundRect(barX, barY, barWidth, barHeight, 4);
    this.ctx.fill();

    // Fill based on multiplier
    const fillPercent = (this.scoreMultiplier - 1) / (this.maxMultiplier - 1);
    const fillWidth = barWidth * fillPercent;

    // Gradient from green to yellow to red
    const hue = 120 - fillPercent * 120; // Green to red
    this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    this.ctx.shadowBlur = 8;

    this.ctx.beginPath();
    this.ctx.roundRect(barX, barY, fillWidth, barHeight, 4);
    this.ctx.fill();

    // Multiplier text
    this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'right';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(`${this.scoreMultiplier.toFixed(1)}x`, barX - 5, barY + barHeight);

    this.ctx.restore();
  }

  private renderBeatVisualizer(): void {
    if (this.state.gameStatus !== 'playing') return;

    // Position in bottom right corner
    const centerX = CONFIG.WIDTH - 60;
    const centerY = CONFIG.HEIGHT - 80;

    this.ctx.save();

    // Draw expanding rings from beats
    for (const ring of this.beatRings) {
      this.ctx.strokeStyle = `rgba(${this.getBPMColorRGB()}, ${ring.alpha * 0.6})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Draw central beat indicator
    const pulseScale = 1 + this.beatVisualizerPulse * 0.3;
    const baseRadius = 15;

    // Outer glow
    const bpmColor = this.getBPMColor();
    this.ctx.shadowColor = bpmColor;
    this.ctx.shadowBlur = 20 * (0.5 + this.beatVisualizerPulse * 0.5);

    // Pulsing circle
    this.ctx.fillStyle = bpmColor;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, baseRadius * pulseScale, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner bright spot
    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + this.beatVisualizerPulse * 0.7})`;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, (baseRadius * pulseScale) * 0.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Beat bars around the circle (like an equalizer)
    const barCount = 8;
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const barHeight = 8 + this.beatVisualizerPulse * 12 * Math.sin(Date.now() * 0.01 + i);
      const innerRadius = baseRadius * pulseScale + 4;

      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * (innerRadius + Math.max(2, barHeight));
      const y2 = centerY + Math.sin(angle) * (innerRadius + Math.max(2, barHeight));

      this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + this.beatVisualizerPulse * 0.5})`;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  private getBPMColorRGB(): string {
    const jumps = this.state.jumpCount;
    if (jumps < 10) return '0, 136, 255';
    if (jumps < 20) return '0, 170, 255';
    if (jumps < 40) return '0, 255, 255';
    if (jumps < 60) return '0, 255, 136';
    if (jumps < 80) return '0, 255, 0';
    if (jumps < 100) return '255, 255, 0';
    return '255, 68, 0';
  }

  private renderParticles(): void {
    const skin = SKINS[this.saveManager.getCurrentSkin()];

    for (const p of this.particles) {
      if (skin.trail === 'rainbow') {
        this.ctx.fillStyle = `hsla(${p.hue + this.player.getRainbowHue()}, 100%, 50%, ${p.life})`;
      } else {
        this.ctx.fillStyle = `${skin.glow}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`;
      }
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  private renderUI(): void {
    if (this.state.gameStatus !== 'playing') return;

    this.ctx.save();

    // Score
    this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = this.levelConfig.background.lineColor;
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(`Score: ${this.state.score}`, 20, 35);

    // Jump count
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = this.levelConfig.background.lineColor;
    this.ctx.fillText(`Jumps: ${this.state.jumpCount}`, 20, 55);

    // BPM
    this.ctx.textAlign = 'right';
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = this.getBPMColor();
    this.ctx.fillText(`♪ ${this.state.bpm} BPM`, CONFIG.WIDTH - 20, 35);

    // High score
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffd700';
    this.ctx.fillText(`Best: ${this.saveManager.getLevelHighScore(this.state.currentLevel)}`, CONFIG.WIDTH - 20, 55);

    // Level name
    this.ctx.textAlign = 'center';
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText(`Level ${this.state.currentLevel}: ${this.levelConfig.name}`, CONFIG.WIDTH / 2, 25);

    // Combo display (when active)
    if (this.platformCombo > 1) {
      const comboScale = 1 + Math.min(this.platformCombo, 10) * 0.05;
      this.ctx.font = `bold ${Math.floor(20 * comboScale)}px "Segoe UI", sans-serif`;
      this.ctx.fillStyle = `hsl(${280 + this.platformCombo * 10}, 100%, 60%)`;
      this.ctx.shadowColor = `hsl(${280 + this.platformCombo * 10}, 100%, 50%)`;
      this.ctx.shadowBlur = 15;
      this.ctx.fillText(`${this.platformCombo}x COMBO!`, CONFIG.WIDTH / 2, 50);
      this.ctx.shadowBlur = 0;
    }

    // Boost button (top-left corner, below score/jumps)
    const storedBoosts = this.player.getStoredDoubleJumps();
    const boostActive = this.player.hasDoubleJump;

    // Always show button position for consistency
    const boostBtnSize = 50;
    const boostBtnX = 20;
    const boostBtnY = 70;
    this.boostButtonBounds = { x: boostBtnX, y: boostBtnY, width: boostBtnSize, height: boostBtnSize };

    if (storedBoosts > 0 || boostActive) {
      // Button background
      const bgAlpha = storedBoosts > 0 ? 0.8 : 0.4;
      this.ctx.fillStyle = boostActive ? 'rgba(255, 136, 0, 0.9)' : `rgba(255, 136, 0, ${bgAlpha})`;
      this.ctx.shadowColor = '#ff8800';
      this.ctx.shadowBlur = boostActive ? 15 : (storedBoosts > 0 ? 10 : 0);
      this.ctx.beginPath();
      this.ctx.roundRect(boostBtnX, boostBtnY, boostBtnSize, boostBtnSize, 10);
      this.ctx.fill();

      // Button border
      this.ctx.strokeStyle = boostActive ? '#ffcc00' : 'rgba(255, 200, 100, 0.6)';
      this.ctx.lineWidth = boostActive ? 3 : 2;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;

      // Rocket/boost icon
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 22px "Segoe UI", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🚀', boostBtnX + boostBtnSize / 2, boostBtnY + boostBtnSize / 2 + 7);

      // Count badge (when more than 1)
      if (storedBoosts > 1) {
        const badgeX = boostBtnX + boostBtnSize - 8;
        const badgeY = boostBtnY + 8;
        const badgeRadius = 10;

        // Badge background
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Badge border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Badge number
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px "Segoe UI", sans-serif';
        this.ctx.fillText(storedBoosts.toString(), badgeX, badgeY + 4);
      } else if (storedBoosts === 1) {
        // Show "1" indicator subtly
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = 'bold 10px "Segoe UI", sans-serif';
        this.ctx.fillText('x1', boostBtnX + boostBtnSize / 2, boostBtnY + boostBtnSize - 5);
      }

      // Timer display when boost is active
      if (boostActive) {
        const timeRemaining = Math.ceil(this.player.getDoubleJumpTimeRemaining() / 1000);
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 11px "Segoe UI", sans-serif';
        this.ctx.fillText(`${timeRemaining}s`, boostBtnX + boostBtnSize / 2, boostBtnY - 5);
      }
    }

    // Attempt number
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillText(`Attempt #${this.attemptNumber}`, 20, CONFIG.HEIGHT - 15);

    // Fullscreen toggle button (top-right corner)
    const fsBtnSize = 36;
    const fsBtnX = CONFIG.WIDTH - fsBtnSize - 10;
    const fsBtnY = 10;
    this.fullscreenButtonBounds = { x: fsBtnX, y: fsBtnY, width: fsBtnSize, height: fsBtnSize };

    // Button background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.beginPath();
    this.ctx.roundRect(fsBtnX, fsBtnY, fsBtnSize, fsBtnSize, 6);
    this.ctx.fill();

    // Button border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw expand/collapse icon
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    const iconPadding = 10;
    const iconX = fsBtnX + iconPadding;
    const iconY = fsBtnY + iconPadding;
    const iconSize = fsBtnSize - iconPadding * 2;

    if (this.isFullscreen) {
      // Collapse icon (arrows pointing inward)
      // Top-left corner
      this.ctx.beginPath();
      this.ctx.moveTo(iconX + 5, iconY);
      this.ctx.lineTo(iconX, iconY);
      this.ctx.lineTo(iconX, iconY + 5);
      this.ctx.stroke();
      // Top-right corner
      this.ctx.beginPath();
      this.ctx.moveTo(iconX + iconSize - 5, iconY);
      this.ctx.lineTo(iconX + iconSize, iconY);
      this.ctx.lineTo(iconX + iconSize, iconY + 5);
      this.ctx.stroke();
      // Bottom-left corner
      this.ctx.beginPath();
      this.ctx.moveTo(iconX, iconY + iconSize - 5);
      this.ctx.lineTo(iconX, iconY + iconSize);
      this.ctx.lineTo(iconX + 5, iconY + iconSize);
      this.ctx.stroke();
      // Bottom-right corner
      this.ctx.beginPath();
      this.ctx.moveTo(iconX + iconSize, iconY + iconSize - 5);
      this.ctx.lineTo(iconX + iconSize, iconY + iconSize);
      this.ctx.lineTo(iconX + iconSize - 5, iconY + iconSize);
      this.ctx.stroke();
    } else {
      // Expand icon (arrows pointing outward)
      // Top-left corner
      this.ctx.beginPath();
      this.ctx.moveTo(iconX + 5, iconY);
      this.ctx.lineTo(iconX, iconY);
      this.ctx.lineTo(iconX, iconY + 5);
      this.ctx.stroke();
      // Top-right corner
      this.ctx.beginPath();
      this.ctx.moveTo(iconX + iconSize - 5, iconY);
      this.ctx.lineTo(iconX + iconSize, iconY);
      this.ctx.lineTo(iconX + iconSize, iconY + 5);
      this.ctx.stroke();
      // Bottom-left corner
      this.ctx.beginPath();
      this.ctx.moveTo(iconX, iconY + iconSize - 5);
      this.ctx.lineTo(iconX, iconY + iconSize);
      this.ctx.lineTo(iconX + 5, iconY + iconSize);
      this.ctx.stroke();
      // Bottom-right corner
      this.ctx.beginPath();
      this.ctx.moveTo(iconX + iconSize, iconY + iconSize - 5);
      this.ctx.lineTo(iconX + iconSize, iconY + iconSize);
      this.ctx.lineTo(iconX + iconSize - 5, iconY + iconSize);
      this.ctx.stroke();
    }
    this.ctx.lineCap = 'butt';

    // Pause button - next to fullscreen button
    const pauseBtnSize = 36;
    const pauseBtnX = fsBtnX - pauseBtnSize - 8;
    const pauseBtnY = fsBtnY;
    this.pauseButtonBounds = { x: pauseBtnX, y: pauseBtnY, width: pauseBtnSize, height: pauseBtnSize };

    // Button background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.beginPath();
    this.ctx.roundRect(pauseBtnX, pauseBtnY, pauseBtnSize, pauseBtnSize, 6);
    this.ctx.fill();

    // Button border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw pause icon (two vertical bars)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const barWidth = 5;
    const barHeight = 16;
    const barY = pauseBtnY + (pauseBtnSize - barHeight) / 2;
    this.ctx.fillRect(pauseBtnX + pauseBtnSize / 2 - barWidth - 2, barY, barWidth, barHeight);
    this.ctx.fillRect(pauseBtnX + pauseBtnSize / 2 + 2, barY, barWidth, barHeight);

    // Desktop: show P to pause hint
    if (!this.isMobile) {
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText('P to pause', CONFIG.WIDTH - 20, CONFIG.HEIGHT - 15);
    }

    this.ctx.restore();

    // Render multiplier bar
    this.renderMultiplierBar();
  }

  private getBPMColor(): string {
    const jumps = this.state.jumpCount;
    if (jumps < 10) return '#0088ff';
    if (jumps < 20) return '#00aaff';
    if (jumps < 40) return '#00ffff';
    if (jumps < 60) return '#00ff88';
    if (jumps < 80) return '#00ff00';
    if (jumps < 100) return '#ffff00';
    return '#ff4400';
  }

  private renderMenu(): void {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    this.ctx.save();
    this.ctx.textAlign = 'center';

    // Title
    this.ctx.font = 'bold 42px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('🎵 TEMPO DASH', CONFIG.WIDTH / 2, 60);

    // Subtitle
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#888888';
    this.ctx.fillText('Rhythm Runner', CONFIG.WIDTH / 2, 85);

    // Feature text
    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = '13px "Segoe UI", sans-serif';
    this.ctx.fillText('🎵 Jump = Beat! You make the music!', CONFIG.WIDTH / 2, 110);
    this.ctx.fillText('🎨 Unlock skins as you play!', CONFIG.WIDTH / 2, 128);

    // Skin selector
    this.renderSkinSelector();

    // Level selector
    this.renderLevelSelector();

    // Total points
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.fillText(`Total Points: ${this.saveManager.getTotalPoints().toLocaleString()}`, CONFIG.WIDTH / 2, CONFIG.HEIGHT - 60);

    // Start instruction - simplified for mobile
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 15;
    if (this.isMobile) {
      this.ctx.fillText('TAP TO PLAY', CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30);
    } else {
      this.ctx.fillText('TAP TO PLAY or press SPACE', CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30);
    }

    this.ctx.restore();
  }

  private renderSkinSelector(): void {
    const startX = CONFIG.WIDTH / 2 - (this.skinKeys.length * 55) / 2;
    const y = 165;

    // Only show keyboard hints on desktop
    if (!this.isMobile) {
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('← A/D to select skin →', CONFIG.WIDTH / 2, y - 15);
    }

    for (let i = 0; i < this.skinKeys.length; i++) {
      const skinId = this.skinKeys[i];
      const skin = SKINS[skinId];
      const x = startX + i * 55;
      const isUnlocked = this.saveManager.isSkinUnlocked(skinId);
      const isSelected = i === this.selectedSkinIndex;

      // Skin box
      this.ctx.save();

      if (!isUnlocked) {
        this.ctx.globalAlpha = 0.3;
      }

      // Background
      if (skin.colors[0] === 'rainbow') {
        const gradient = this.ctx.createLinearGradient(x, y, x + 45, y + 45);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.2, '#ff8800');
        gradient.addColorStop(0.4, '#ffff00');
        gradient.addColorStop(0.6, '#00ff00');
        gradient.addColorStop(0.8, '#0088ff');
        gradient.addColorStop(1, '#8800ff');
        this.ctx.fillStyle = gradient;
      } else {
        const gradient = this.ctx.createLinearGradient(x, y, x + 45, y + 45);
        gradient.addColorStop(0, skin.colors[0]);
        gradient.addColorStop(1, skin.colors[1]);
        this.ctx.fillStyle = gradient;
      }

      this.ctx.fillRect(x, y, 45, 45);

      // Border
      this.ctx.strokeStyle = isSelected ? '#ffffff' : 'transparent';
      this.ctx.lineWidth = isSelected ? 3 : 0;
      if (isSelected) {
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 10;
      }
      this.ctx.strokeRect(x, y, 45, 45);

      this.ctx.restore();

      // Lock icon
      if (!isUnlocked) {
        this.ctx.font = '16px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔒', x + 22, y + 30);
      }
    }

    // Show cost of hovered skin
    const hoveredSkin = SKINS[this.skinKeys[this.selectedSkinIndex]];
    if (!this.saveManager.isSkinUnlocked(this.skinKeys[this.selectedSkinIndex])) {
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.font = '11px "Segoe UI", sans-serif';
      this.ctx.fillText(`${hoveredSkin.name}: ${hoveredSkin.cost.toLocaleString()} pts needed`, CONFIG.WIDTH / 2, y + 60);
    } else {
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = '11px "Segoe UI", sans-serif';
      this.ctx.fillText(`${hoveredSkin.name}`, CONFIG.WIDTH / 2, y + 60);
    }
  }

  private renderLevelSelector(): void {
    const startY = 250;
    const unlockedLevels = this.saveManager.getUnlockedLevels();

    // Only show keyboard hints on desktop
    if (!this.isMobile) {
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('↑ W/S to select level ↓', CONFIG.WIDTH / 2, startY - 10);
    }

    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      const y = startY + i * 28;
      const isUnlocked = unlockedLevels.includes(level.id);
      const isSelected = level.id === this.selectedMenuLevel;

      const boxWidth = 350;
      const x = (CONFIG.WIDTH - boxWidth) / 2;

      // Background
      this.ctx.fillStyle = isSelected ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.4)';
      this.ctx.fillRect(x, y, boxWidth, 24);

      // Border
      if (isSelected) {
        this.ctx.strokeStyle = level.background.lineColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, boxWidth, 24);
      }

      // Level number
      this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillStyle = isUnlocked ? level.background.lineColor : '#555555';
      this.ctx.fillText(`[${level.id}]`, x + 10, y + 17);

      // Level name
      this.ctx.font = '14px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isUnlocked ? '#ffffff' : '#555555';
      this.ctx.fillText(isUnlocked ? level.name : '???', x + 45, y + 17);

      // Subtitle or lock info
      this.ctx.textAlign = 'right';
      this.ctx.font = '11px "Segoe UI", sans-serif';
      if (isUnlocked) {
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText(level.subtitle, x + boxWidth - 70, y + 17);
        // High score
        const highScore = this.saveManager.getLevelHighScore(level.id);
        if (highScore > 0) {
          this.ctx.fillStyle = '#ffd700';
          this.ctx.fillText(`${highScore}`, x + boxWidth - 10, y + 17);
        }
      } else {
        this.ctx.fillStyle = '#ff6666';
        this.ctx.fillText(`🔒 ${level.unlockScore.toLocaleString()} pts`, x + boxWidth - 10, y + 17);
      }
    }

    this.ctx.textAlign = 'center';
  }

  private renderGameOver(): void {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    this.ctx.save();
    this.ctx.textAlign = 'center';

    // Title
    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ff4444';
    this.ctx.shadowColor = '#ff0000';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('💥 CRASHED!', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 60);

    // Score
    this.ctx.font = '28px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(`Score: ${this.state.score}`, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);

    // New high score?
    const highScore = this.saveManager.getLevelHighScore(this.state.currentLevel);
    if (this.state.score >= highScore && this.state.score > 0) {
      this.ctx.font = '20px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.fillText('🎉 NEW HIGH SCORE!', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 35);
    }

    // Restart instruction - simplified for mobile
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#888888';
    this.ctx.shadowBlur = 0;
    if (this.isMobile) {
      this.ctx.fillText('TAP to try again', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 80);
    } else {
      this.ctx.fillText('TAP or press SPACE to try again', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 80);
    }

    this.ctx.restore();
  }

  private renderPauseMenu(): void {
    // Semi-transparent dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    this.ctx.save();
    this.ctx.textAlign = 'center';

    // Title
    this.ctx.font = 'bold 42px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('⏸ PAUSED', CONFIG.WIDTH / 2, 80);

    // Current score display
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(`Score: ${this.state.score}`, CONFIG.WIDTH / 2, 115);
    this.ctx.shadowBlur = 0;

    // Menu buttons
    const buttonWidth = 180;
    const buttonHeight = 45;
    const buttonX = (CONFIG.WIDTH - buttonWidth) / 2;
    const buttonSpacing = 55;
    let buttonY = 150;

    this.pauseMenuButtons = [];

    const buttons = [
      { id: 'resume', label: 'RESUME', key: 'P' },
      { id: 'restart', label: 'RESTART', key: 'R' },
      { id: 'quit', label: 'QUIT TO MENU', key: 'Q' }
    ];

    buttons.forEach((btn) => {
      // Store button bounds
      this.pauseMenuButtons.push({
        id: btn.id,
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
      });

      // Button background
      this.ctx.fillStyle = btn.id === 'resume' ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
      this.ctx.beginPath();
      this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
      this.ctx.fill();

      // Button border
      this.ctx.strokeStyle = btn.id === 'resume' ? '#00ffff' : 'rgba(255, 255, 255, 0.3)';
      this.ctx.lineWidth = btn.id === 'resume' ? 2 : 1;
      this.ctx.stroke();

      // Button text
      this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
      this.ctx.fillStyle = btn.id === 'resume' ? '#00ffff' : '#ffffff';
      this.ctx.fillText(btn.label, CONFIG.WIDTH / 2, buttonY + buttonHeight / 2 + 5);

      // Keyboard hint (desktop only)
      if (!this.isMobile) {
        this.ctx.font = '11px "Segoe UI", sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`[${btn.key}]`, buttonX + buttonWidth - 10, buttonY + buttonHeight / 2 + 4);
        this.ctx.textAlign = 'center';
      }

      buttonY += buttonSpacing;
    });

    // Volume controls section
    const volumeY = buttonY + 20;
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#888888';
    this.ctx.fillText('VOLUME', CONFIG.WIDTH / 2, volumeY);

    // Music volume slider
    const sliderWidth = 150;
    const sliderHeight = 10;
    const sliderX = (CONFIG.WIDTH - sliderWidth) / 2;
    const musicSliderY = volumeY + 25;

    this.musicVolumeSlider.x = sliderX;
    this.musicVolumeSlider.y = musicSliderY;
    this.musicVolumeSlider.width = sliderWidth;
    this.musicVolumeSlider.height = sliderHeight;

    // Music label
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Music', sliderX - 50, musicSliderY + 8);
    this.ctx.textAlign = 'center';

    // Slider background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.roundRect(sliderX, musicSliderY, sliderWidth, sliderHeight, 5);
    this.ctx.fill();

    // Slider fill
    this.ctx.fillStyle = '#00ffff';
    this.ctx.beginPath();
    this.ctx.roundRect(sliderX, musicSliderY, sliderWidth * this.musicVolumeSlider.value, sliderHeight, 5);
    this.ctx.fill();

    // Slider handle
    const musicHandleX = sliderX + sliderWidth * this.musicVolumeSlider.value;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(musicHandleX, musicSliderY + sliderHeight / 2, 8, 0, Math.PI * 2);
    this.ctx.fill();

    // SFX volume slider
    const sfxSliderY = musicSliderY + 35;

    this.sfxVolumeSlider.x = sliderX;
    this.sfxVolumeSlider.y = sfxSliderY;
    this.sfxVolumeSlider.width = sliderWidth;
    this.sfxVolumeSlider.height = sliderHeight;

    // SFX label
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('SFX', sliderX - 50, sfxSliderY + 8);
    this.ctx.textAlign = 'center';

    // Slider background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.roundRect(sliderX, sfxSliderY, sliderWidth, sliderHeight, 5);
    this.ctx.fill();

    // Slider fill
    this.ctx.fillStyle = '#ff8800';
    this.ctx.beginPath();
    this.ctx.roundRect(sliderX, sfxSliderY, sliderWidth * this.sfxVolumeSlider.value, sliderHeight, 5);
    this.ctx.fill();

    // Slider handle
    const sfxHandleX = sliderX + sliderWidth * this.sfxVolumeSlider.value;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(sfxHandleX, sfxSliderY + sliderHeight / 2, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private renderTutorial(): void {
    // Semi-transparent dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    this.ctx.save();
    this.ctx.textAlign = 'center';

    // Title
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('HOW TO PLAY', CONFIG.WIDTH / 2, 70);
    this.ctx.shadowBlur = 0;

    const startY = 120;
    const lineHeight = 50;
    let y = startY;

    // Instructions
    const instructions = [
      { icon: '👆', text: this.isMobile ? 'TAP to JUMP' : 'SPACE / TAP to JUMP', color: '#00ffff' },
      { icon: '🎵', text: 'Each JUMP plays a beat!', color: '#ff00ff' },
      { icon: '⚡', text: 'Jump on beat for BONUS points', color: '#ffff00' },
      { icon: '💎', text: 'Collect GEMS for extra score', color: '#44aaff' },
      { icon: '🔥', text: 'Orange orbs give DOUBLE JUMP!', color: '#ff8800' },
      { icon: '⚠️', text: 'Avoid obstacles and pits', color: '#ff4444' }
    ];

    instructions.forEach((inst) => {
      // Icon
      this.ctx.font = '28px "Segoe UI", sans-serif';
      this.ctx.fillStyle = inst.color;
      this.ctx.fillText(inst.icon, CONFIG.WIDTH / 2 - 140, y + 8);

      // Text
      this.ctx.font = '18px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(inst.text, CONFIG.WIDTH / 2 - 100, y + 8);
      this.ctx.textAlign = 'center';

      y += lineHeight;
    });

    // Tap to continue
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#888888';
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    this.ctx.globalAlpha = pulse;
    this.ctx.fillText(this.isMobile ? 'TAP TO START' : 'PRESS ANY KEY TO START', CONFIG.WIDTH / 2, CONFIG.HEIGHT - 40);
    this.ctx.globalAlpha = 1;

    this.ctx.restore();
  }
}
