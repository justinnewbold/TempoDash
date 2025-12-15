import { GameState } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { InputManager } from '../systems/Input';
import { AudioManager, MusicStyle } from '../systems/Audio';
import { SaveManager, LEVEL_UNLOCK_COSTS, PLAYER_SKINS } from '../systems/SaveManager';
import { Player } from '../entities/Player';
import { Level } from '../levels/Level';
import { createLevel, TOTAL_LEVELS } from '../levels/index';

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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;

    this.input = new InputManager();
    this.input.setCanvas(canvas);
    this.audio = new AudioManager();
    this.save = new SaveManager();

    // Apply saved settings
    const settings = this.save.getSettings();
    this.audio.setMusicVolume(settings.musicVolume);
    this.audio.setSfxVolume(settings.sfxVolume);

    this.loadLevel(1);

    // Setup keyboard
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Setup click/touch
    canvas.addEventListener('click', (e) => this.handleClick(e));

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

    const musicStyles: Record<number, MusicStyle> = {
      1: 'energetic',
      2: 'dark',
      3: 'epic',
      4: 'dark',
      5: 'epic',
      6: 'energetic',
    };
    this.audio.setStyle(musicStyles[levelId] || 'energetic');
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (GAME_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);

    switch (this.state.gameStatus) {
      case 'mainMenu':
        this.handleMainMenuClick(x, y);
        break;
      case 'levelSelect':
        this.handleLevelSelectClick(x, y);
        break;
      case 'settings':
        this.handleSettingsClick(x, y);
        break;
      case 'skins':
        this.handleSkinsClick(x, y);
        break;
      case 'levelComplete':
        this.nextLevel();
        break;
      case 'gameOver':
        this.state.gameStatus = 'mainMenu';
        break;
    }
  }

  private handleMainMenuClick(x: number, y: number): void {
    const centerX = GAME_WIDTH / 2;
    const buttonWidth = 200;

    // Play button (y=305, so clickable area is 280-330)
    if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
        y >= 280 && y <= 330) {
      this.audio.playSelect();
      this.state.gameStatus = 'levelSelect';
    }
    // Skins button (y=375, so clickable area is 350-400)
    if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
        y >= 350 && y <= 400) {
      this.audio.playSelect();
      this.state.gameStatus = 'skins';
    }
    // Settings button (y=445, so clickable area is 420-470)
    if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
        y >= 420 && y <= 470) {
      this.audio.playSelect();
      this.state.gameStatus = 'settings';
    }
  }

  private handleLevelSelectClick(x: number, y: number): void {
    // Back button
    if (x >= 20 && x <= 120 && y >= 20 && y <= 60) {
      this.audio.playSelect();
      this.state.gameStatus = 'mainMenu';
      return;
    }

    // Level cards (must match renderLevelSelect dimensions)
    const cardWidth = 130;
    const cardHeight = 190;
    const cardGap = 18;
    const startX = (GAME_WIDTH - (cardWidth * TOTAL_LEVELS + cardGap * (TOTAL_LEVELS - 1))) / 2;
    const cardY = 180;

    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const cardX = startX + i * (cardWidth + cardGap);
      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        const levelId = i + 1;
        if (this.save.isLevelUnlocked(levelId)) {
          this.audio.playSelect();
          this.startLevel(levelId);
        } else if (this.save.canUnlockLevel(levelId)) {
          if (this.save.unlockLevel(levelId)) {
            this.audio.playUnlock();
          }
        }
        return;
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

  private handleKeyDown(e: KeyboardEvent): void {
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

      case 'playing':
        if (e.code === 'Escape') {
          this.state.gameStatus = 'paused';
          this.audio.stop();
        }
        break;

      case 'paused':
        if (e.code === 'Escape' || e.code === 'Enter') {
          this.state.gameStatus = 'playing';
          this.audio.start();
        } else if (e.code === 'KeyQ') {
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
          this.state.gameStatus = 'mainMenu';
        }
        break;
    }
  }

  private startLevel(levelId: number): void {
    this.loadLevel(levelId);
    this.attempts = 1;
    this.levelScoreThisRun = 0;
    this.state.gameStatus = 'playing';
    this.audio.start();
  }

  private nextLevel(): void {
    if (this.state.currentLevel < TOTAL_LEVELS) {
      this.state.currentLevel++;
      // Auto-unlock next level if not already
      if (!this.save.isLevelUnlocked(this.state.currentLevel)) {
        this.save.unlockLevel(this.state.currentLevel);
      }
      this.loadLevel(this.state.currentLevel);
      this.attempts = 1;
      this.levelScoreThisRun = 0;
      this.state.gameStatus = 'playing';
      this.audio.start();
    } else {
      this.state.gameStatus = 'mainMenu';
      this.audio.stop();
    }
  }

  private respawnPlayer(): void {
    this.attempts++;
    this.loadLevel(this.state.currentLevel);
    this.state.gameStatus = 'playing';
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

    // Decay beat pulse
    if (this.beatPulse > 0) {
      this.beatPulse = Math.max(0, this.beatPulse - deltaTime / 150);
    }

    // Decay screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
    }

    if (this.state.gameStatus !== 'playing') {
      this.level.update(deltaTime);
      return;
    }

    const inputState = this.input.update();
    this.level.update(deltaTime);

    const wasGroundedBefore = this.player.isGrounded;
    const wasAliveBefore = !this.player.isDead;
    const prevVelocityY = this.player.velocityY;
    const wasDashing = this.player.isDashing;

    this.player.update(deltaTime, inputState, this.level.getActivePlatforms());

    // Trigger dash shake
    if (!wasDashing && this.player.isDashing) {
      this.triggerShake(4, 80); // Light shake on dash start
    }

    // Check coin collection
    const coinsCollected = this.level.checkCoinCollection(this.player);
    if (coinsCollected > 0) {
      this.audio.playSelect(); // Use select sound for coins for now
    }

    if (wasGroundedBefore && !this.player.isGrounded && !this.player.isDead) {
      this.audio.playJump();
    }

    // Detect bounce (sudden large upward velocity change)
    const bounceThreshold = -600;
    if (prevVelocityY >= 0 && this.player.velocityY < bounceThreshold) {
      this.triggerShake(6, 120); // Medium shake on bounce
    }

    if (wasAliveBefore && this.player.isDead) {
      this.audio.playDeath();
      this.triggerShake(12, 350); // Strong shake on death
    }

    const targetCameraX = this.player.x - 150;
    this.cameraX = Math.max(0, targetCameraX);

    if (this.player.isDead) {
      this.deathTimer += deltaTime;
      if (this.deathTimer > 500) {
        this.deathTimer = 0;
        this.respawnPlayer();
      }
      return;
    }

    if (this.level.checkGoal(this.player)) {
      // Calculate score based on attempts and coins
      const baseScore = 1000;
      const attemptPenalty = (this.attempts - 1) * 50;
      const coinBonus = this.level.coinsCollected * 100;
      this.levelScoreThisRun = Math.max(baseScore - attemptPenalty, 100) + coinBonus;

      // Add to total points
      this.save.addPoints(this.levelScoreThisRun);

      // Check for high score
      this.save.setHighScore(this.state.currentLevel, this.levelScoreThisRun);

      this.state.gameStatus = 'levelComplete';
      this.audio.stop();
      this.audio.playLevelComplete();
    }
  }

  private render(): void {
    // Get shake offset
    const shake = this.getShakeOffset();

    this.ctx.save();
    this.ctx.translate(shake.x, shake.y);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.level.render(this.ctx, this.cameraX);

    if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'paused') {
      this.player.render(this.ctx, this.cameraX);
      this.renderPlayingUI();
    }

    this.ctx.restore();

    switch (this.state.gameStatus) {
      case 'mainMenu':
        this.renderMainMenu();
        break;
      case 'levelSelect':
        this.renderLevelSelect();
        break;
      case 'settings':
        this.renderSettings();
        break;
      case 'skins':
        this.renderSkins();
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

    // Attempt counter (below level name, smaller)
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillText(`Attempt ${this.attempts}`, 20, 48);

    // Coins collected (top-right)
    if (this.level.getTotalCoins() > 0) {
      this.ctx.textAlign = 'right';
      this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.fillText(`★ ${this.level.coinsCollected}/${this.level.getTotalCoins()}`, GAME_WIDTH - 20, 28);
    }

    // Mute indicator (top-right, below coins)
    if (this.audio.isMusicMuted()) {
      this.ctx.textAlign = 'right';
      this.ctx.font = '12px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#ff6666';
      this.ctx.fillText('MUTED', GAME_WIDTH - 20, 48);
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
    const titleY = 150 + Math.sin(this.menuAnimation * 2) * 10;
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 30;
    this.ctx.font = 'bold 72px "Segoe UI", sans-serif';
    this.ctx.fillText('TEMPO DASH', GAME_WIDTH / 2, titleY);

    // Subtitle
    this.ctx.font = '24px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.fillText('EDM Rhythm Platformer', GAME_WIDTH / 2, titleY + 50);

    // Total points display
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.fillText(`Total Points: ${this.save.getTotalPoints()}`, GAME_WIDTH / 2, 250);

    // Buttons
    this.renderMenuButton('PLAY', GAME_WIDTH / 2, 305, true);
    this.renderMenuButton('SKINS', GAME_WIDTH / 2, 375, false);
    this.renderMenuButton('SETTINGS', GAME_WIDTH / 2, 445, false);

    // Controls hint (smaller to fit)
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('SPACE/tap to jump | SHIFT to dash | M to mute', GAME_WIDTH / 2, 500);

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

    // Level cards (smaller to fit more levels)
    const cardWidth = 130;
    const cardHeight = 190;
    const cardGap = 18;
    const startX = (GAME_WIDTH - (cardWidth * TOTAL_LEVELS + cardGap * (TOTAL_LEVELS - 1))) / 2;
    const cardY = 180;

    const levelNames = ['First Flight', 'Neon Dreams', 'Final Ascent', 'Frozen Peak', 'Volcanic Descent', 'Abyssal Depths'];
    const levelColors = ['#00ffaa', '#ff00ff', '#ff6600', '#88ddff', '#ff4400', '#00ccff'];

    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const levelId = i + 1;
      const cardX = startX + i * (cardWidth + cardGap);
      const isUnlocked = this.save.isLevelUnlocked(levelId);
      const canUnlock = this.save.canUnlockLevel(levelId);
      const cost = LEVEL_UNLOCK_COSTS[levelId] || 0;
      const highScore = this.save.getHighScore(levelId);

      // Card background
      this.ctx.fillStyle = isUnlocked ? 'rgba(0, 0, 0, 0.7)' : 'rgba(50, 50, 50, 0.7)';
      this.ctx.strokeStyle = isUnlocked ? levelColors[i] : (canUnlock ? '#ffd700' : 'rgba(100, 100, 100, 0.5)');
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 15);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.textAlign = 'center';
      const centerX = cardX + cardWidth / 2;

      // Level number (moved up slightly)
      this.ctx.font = 'bold 42px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isUnlocked ? levelColors[i] : 'rgba(100, 100, 100, 0.8)';
      this.ctx.shadowColor = levelColors[i];
      this.ctx.shadowBlur = isUnlocked ? 15 : 0;
      this.ctx.fillText(`${levelId}`, centerX, cardY + 55);

      // Level name (adjusted position)
      this.ctx.font = 'bold 15px "Segoe UI", sans-serif';
      this.ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(150, 150, 150, 0.8)';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(levelNames[i], centerX, cardY + 85);

      if (isUnlocked) {
        // High score (more vertical space from name)
        this.ctx.font = '14px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(highScore > 0 ? `Best: ${highScore}` : 'Not completed', centerX, cardY + 120);

        // Click to play (moved up from card edge)
        this.ctx.font = '12px "Segoe UI", sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fillText('Click to play', centerX, cardY + 160);
      } else {
        // Lock icon (more space from level name, smaller size)
        this.ctx.font = '20px "Segoe UI", sans-serif';
        this.ctx.fillStyle = canUnlock ? '#ffd700' : 'rgba(100, 100, 100, 0.8)';
        this.ctx.fillText('🔒', centerX, cardY + 120);

        // Cost (adjusted spacing)
        this.ctx.font = '13px "Segoe UI", sans-serif';
        this.ctx.fillStyle = canUnlock ? '#ffd700' : 'rgba(100, 100, 100, 0.8)';
        this.ctx.fillText(`${cost} pts to unlock`, centerX, cardY + 150);

        if (canUnlock) {
          // Click to unlock (moved up from card edge)
          this.ctx.font = '12px "Segoe UI", sans-serif';
          this.ctx.fillStyle = '#ffd700';
          this.ctx.fillText('Click to unlock!', centerX, cardY + 172);
        }
      }
    }

    // Level features hint
    this.ctx.textAlign = 'center';
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText('Each level introduces new challenges and unique music!', GAME_WIDTH / 2, 420);

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
    this.ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillText('Press ESC or ENTER to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    this.ctx.fillText('Press Q to quit to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);

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
    this.ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 5;
    this.ctx.fillText('Click or Press ENTER to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

    this.ctx.restore();
  }

  private renderLevelComplete(): void {
    this.renderOverlay();

    this.ctx.save();
    this.ctx.textAlign = 'center';
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
      this.ctx.fillText('🎉 Congratulations! You beat the game! 🎉', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText('Click or Press ENTER to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 145);
    }

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
}
