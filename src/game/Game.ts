import { GameState, Particle, LevelConfig, SKINS } from '../types';
import { CONFIG, LEVELS } from '../constants';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { JumpPlatform } from '../entities/JumpPlatform';
import { Hole } from '../entities/Hole';
import { GravityZone } from '../entities/GravityZone';
import { MovingObstacle } from '../entities/MovingObstacle';
import { Portal } from '../entities/Portal';
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

  private holdingJump = false;
  private levelConfig!: LevelConfig;
  private attemptNumber = 1;

  private selectedMenuLevel = 1;
  private selectedSkinIndex = 0;
  private skinKeys: string[] = [];

  // Mobile detection and touch state
  private isMobile: boolean;
  private exitButtonBounds = { x: 0, y: 0, width: 70, height: 30 };

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

    this.skinKeys = Object.keys(SKINS);
    this.selectedSkinIndex = this.skinKeys.indexOf(this.saveManager.getCurrentSkin());
    if (this.selectedSkinIndex < 0) this.selectedSkinIndex = 0;

    this.loadLevel(1);
    this.setupInputHandlers();
  }

  private loadLevel(levelId: number): void {
    this.levelConfig = LEVELS[levelId - 1] || LEVELS[0];
    this.state.currentLevel = levelId;

    this.background = new Background(this.levelConfig.background);
    this.audio.setLevelConfig(this.levelConfig.beatConfig);

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

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.state.gameStatus === 'menu') {
      this.handleMenuKeyDown(e);
    } else if (this.state.gameStatus === 'playing') {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.holdingJump = true;
        this.tryJump();
      } else if (e.code === 'Escape') {
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
    // Check if touch is on exit button (mobile only, during gameplay)
    if (e && this.state.gameStatus === 'playing' && this.isMobile) {
      const touch = e.touches[0];
      const coords = this.getCanvasCoords(touch.clientX, touch.clientY);
      if (this.isInExitButton(coords.x, coords.y)) {
        this.returnToMenu();
        return;
      }
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
    // Check if click is on exit button (during gameplay)
    if (this.state.gameStatus === 'playing') {
      const coords = this.getCanvasCoords(e.clientX, e.clientY);
      if (this.isInExitButton(coords.x, coords.y)) {
        this.returnToMenu();
        return;
      }
    }

    this.handleTouchStart();
  }

  private tryJump(): void {
    if (this.player.jump()) {
      // Successful jump
      this.particles.push(...this.player.createJumpParticles());
      this.audio.onJump();

      this.state.jumpCount++;
      this.state.score += 2; // 2 points per jump
      this.state.bpm = this.audio.currentBPM;
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
    this.particles = [];

    this.state.score = 0;
    this.state.jumpCount = 0;
    this.state.bpm = CONFIG.BASE_BPM;

    // Initialize spawning positions
    this.lastObstacleX = CONFIG.WIDTH + 200;
    this.lastPlatformX = CONFIG.WIDTH + 400;
    this.lastHoleX = CONFIG.WIDTH + 600;
    this.lastGravityX = CONFIG.WIDTH + 800;
    this.lastMovingX = CONFIG.WIDTH + 1000;
    this.lastPortalX = CONFIG.WIDTH + 1200;

    // Spawn initial obstacles
    for (let i = 0; i < 5; i++) {
      this.spawnObstacle();
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
      // Single platform at reachable height (50-90px from ground)
      this.platforms.push(new JumpPlatform(
        this.lastPlatformX,
        undefined,
        undefined,
        this.levelConfig.background.lineColor,
        0
      ));
    }
  }

  private spawnTieredPlatforms(): void {
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    const tiers = 2 + Math.floor(Math.random() * 3); // 2-4 tiers
    const goingUp = Math.random() > 0.5; // 50% ascending, 50% descending

    // Starting height for first platform
    const baseHeight = goingUp ? 60 : 60 + (tiers - 1) * 50; // Lower start if going up, higher if going down
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

      this.platforms.push(new JumpPlatform(
        platformX,
        platformY,
        Math.max(60, width),
        this.levelConfig.background.lineColor,
        i + 1
      ));
    }

    // Update lastPlatformX to end of sequence
    this.lastPlatformX += (tiers - 1) * xStep;
  }

  private spawnHole(): void {
    this.lastHoleX += 400 + Math.random() * 300;
    this.holes.push(new Hole(this.lastHoleX));
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

  private gameOver(): void {
    this.state.gameStatus = 'gameOver';
    this.particles.push(...this.player.createDeathParticles());
    this.audio.playCrash();

    // Submit score (save manager handles unlock checks internally)
    this.saveManager.submitScore(this.state.currentLevel, this.state.score);
  }

  private returnToMenu(): void {
    // Submit current score before returning
    if (this.state.score > 0) {
      this.saveManager.submitScore(this.state.currentLevel, this.state.score);
    }

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

    if (this.state.gameStatus !== 'playing') {
      // Update particles even when not playing
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
        this.player.landOnPlatform(platform.y);
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
        this.state.score += 50;
        this.audio.playScore();
      }
    }

    // Update and check holes (Level 3+)
    for (const hole of this.holes) {
      hole.update(gameSpeed);
      if (hole.checkDeath(this.player.x, this.player.y, this.player.width, this.player.height)) {
        this.player.die();
        this.gameOver();
        return;
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

    // Update platforms
    for (const platform of this.platforms) {
      platform.update(gameSpeed);
    }

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
      this.platforms = this.platforms.filter(p => p.x > -150);
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

    // Update particles
    this.updateParticles(gameSpeed);
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

  private render(): void {
    const gameSpeed = this.state.gameStatus === 'playing' ? this.audio.getGameSpeed() : 0.3;

    // Render background
    this.background.render(this.ctx, this.state.gameStatus === 'playing', gameSpeed);

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

    // Render player
    if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'gameOver') {
      this.player.render(this.ctx);
    }

    // Render particles
    this.renderParticles();

    // Render UI
    this.renderUI();

    // Render overlays
    if (this.state.gameStatus === 'menu') {
      this.renderMenu();
    } else if (this.state.gameStatus === 'gameOver') {
      this.renderGameOver();
    }
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

    // Attempt number
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.fillText(`Attempt #${this.attemptNumber}`, 20, CONFIG.HEIGHT - 15);

    // Exit button/hint - show touch button on mobile, keyboard hint on desktop
    if (this.isMobile) {
      // Touch-friendly exit button
      const btnX = CONFIG.WIDTH - 80;
      const btnY = CONFIG.HEIGHT - 40;
      const btnW = 70;
      const btnH = 30;

      // Store bounds for touch detection
      this.exitButtonBounds = { x: btnX, y: btnY, width: btnW, height: btnH };

      // Button background
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.beginPath();
      this.ctx.roundRect(btnX, btnY, btnW, btnH, 6);
      this.ctx.fill();

      // Button border
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Button text
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText('EXIT', btnX + btnW / 2, btnY + btnH / 2 + 4);
    } else {
      // Desktop: show ESC hint
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText('ESC to exit', CONFIG.WIDTH - 20, CONFIG.HEIGHT - 15);
    }

    this.ctx.restore();
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
    this.ctx.fillText('🟦 BLOCK DASH', CONFIG.WIDTH / 2, 60);

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
}
