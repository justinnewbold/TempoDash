import { GameState } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { InputManager } from '../systems/Input';
import { AudioManager, MusicStyle } from '../systems/Audio';
import { Player } from '../entities/Player';
import { Level } from '../levels/Level';
import { createLevel, TOTAL_LEVELS } from '../levels/index';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private audio: AudioManager;

  private state: GameState = {
    currentLevel: 1,
    lives: 3,
    score: 0,
    gameStatus: 'menu',
  };

  private player!: Player;
  private level!: Level;
  private cameraX = 0;
  private attempts = 0;

  private lastTime = 0;
  private deathTimer = 0;
  private beatPulse = 0; // Visual beat indicator (0-1, decays over time)

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
    this.loadLevel(1);

    // Setup keyboard for menu
    window.addEventListener('keydown', (e) => this.handleMenuInput(e));

    // Setup click/touch for menu
    canvas.addEventListener('click', () => this.handleMenuClick());

    // Setup beat callback for visual sync
    this.audio.setBeatCallback((beat) => {
      // Pulse on every other beat (quarter notes) for clearer timing
      if (beat % 2 === 0) {
        this.beatPulse = 1;
      }
    });
  }

  private loadLevel(levelId: number): void {
    this.level = createLevel(levelId);
    this.player = new Player(this.level.playerStart);
    this.state.currentLevel = levelId;
    this.cameraX = 0;

    // Set music style based on level
    const musicStyles: Record<number, MusicStyle> = {
      1: 'energetic',
      2: 'dark',
      3: 'epic',
    };
    this.audio.setStyle(musicStyles[levelId] || 'energetic');
  }

  private handleMenuClick(): void {
    if (this.state.gameStatus === 'menu') {
      this.startGame();
    } else if (this.state.gameStatus === 'gameOver') {
      this.resetGame();
    } else if (this.state.gameStatus === 'levelComplete') {
      this.nextLevel();
    }
  }

  private handleMenuInput(e: KeyboardEvent): void {
    // Mute toggle (works in any state)
    if (e.code === 'KeyM') {
      this.audio.toggleMute();
      return;
    }

    if (this.state.gameStatus === 'menu') {
      if (e.code === 'Enter' || e.code === 'Space') {
        this.startGame();
      } else if (e.code === 'Digit1') {
        this.state.currentLevel = 1;
        this.startGame();
      } else if (e.code === 'Digit2') {
        this.state.currentLevel = 2;
        this.startGame();
      }
    } else if (this.state.gameStatus === 'gameOver') {
      if (e.code === 'Enter' || e.code === 'Space') {
        this.resetGame();
      }
    } else if (this.state.gameStatus === 'levelComplete') {
      if (e.code === 'Enter' || e.code === 'Space') {
        this.nextLevel();
      }
    } else if (this.state.gameStatus === 'playing') {
      if (e.code === 'Escape') {
        this.state.gameStatus = 'paused';
        this.audio.stop();
      }
    } else if (this.state.gameStatus === 'paused') {
      if (e.code === 'Escape' || e.code === 'Enter') {
        this.state.gameStatus = 'playing';
        this.audio.start();
      }
    }
  }

  private startGame(): void {
    this.loadLevel(this.state.currentLevel);
    this.attempts = 1;
    this.state.score = 0;
    this.state.gameStatus = 'playing';
    this.audio.start();
  }

  private resetGame(): void {
    this.state.currentLevel = 1;
    this.startGame();
  }

  private nextLevel(): void {
    if (this.state.currentLevel < TOTAL_LEVELS) {
      this.state.currentLevel++;
      this.loadLevel(this.state.currentLevel);
      this.attempts = 1;
      this.state.gameStatus = 'playing';
      this.audio.start();
    } else {
      // Game complete - show victory or return to menu
      this.state.gameStatus = 'menu';
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
    // Decay beat pulse
    if (this.beatPulse > 0) {
      this.beatPulse = Math.max(0, this.beatPulse - deltaTime / 150);
    }

    if (this.state.gameStatus !== 'playing') {
      // Still update background animations for visual effect
      this.level.update(deltaTime);
      return;
    }

    const inputState = this.input.update();

    // Update level (platforms, background)
    this.level.update(deltaTime);

    // Track player state before update
    const wasGroundedBefore = this.player.isGrounded;
    const wasAliveBefore = !this.player.isDead;

    // Update player
    this.player.update(deltaTime, inputState, this.level.getActivePlatforms());

    // Play jump sound when player leaves ground
    if (wasGroundedBefore && !this.player.isGrounded && !this.player.isDead) {
      this.audio.playJump();
    }

    // Play death sound when player dies
    if (wasAliveBefore && this.player.isDead) {
      this.audio.playDeath();
    }

    // Update camera to follow player (keep player on left side of screen)
    const targetCameraX = this.player.x - 150;
    this.cameraX = Math.max(0, targetCameraX);

    // Check for death
    if (this.player.isDead) {
      this.deathTimer += deltaTime;
      if (this.deathTimer > 500) {
        this.deathTimer = 0;
        this.respawnPlayer();
      }
      return;
    }

    // Check for goal
    if (this.level.checkGoal(this.player)) {
      this.state.score += Math.max(1000 - (this.attempts - 1) * 50, 100);
      this.state.gameStatus = 'levelComplete';
      this.audio.stop();
      this.audio.playLevelComplete();
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Render level with camera offset
    this.level.render(this.ctx, this.cameraX);

    // Render player
    if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'paused') {
      this.player.render(this.ctx, this.cameraX);
    }

    // Render UI
    this.renderUI();

    // Render overlays based on game state
    switch (this.state.gameStatus) {
      case 'menu':
        this.renderMenu();
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

  private renderUI(): void {
    if (this.state.gameStatus !== 'playing' && this.state.gameStatus !== 'paused') {
      return;
    }

    this.ctx.save();

    // Progress bar at top
    const progress = this.level.getProgress(this.player.x);
    const barWidth = GAME_WIDTH - 40;
    const barHeight = 8;
    const barX = 20;
    const barY = 20;

    // Bar background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress fill
    const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth * progress, barY);
    gradient.addColorStop(0, '#00ffaa');
    gradient.addColorStop(1, '#00ffff');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Bar border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Percentage text
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.shadowColor = COLORS.UI_SHADOW;
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(`${Math.floor(progress * 100)}%`, GAME_WIDTH / 2, 50);

    // Level name (left)
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.level.name}`, 20, 50);

    // Attempt counter and mute indicator (right)
    this.ctx.textAlign = 'right';
    const muteIndicator = this.audio.isMusicMuted() ? ' [M] Muted' : '';
    this.ctx.fillText(`Attempt ${this.attempts}${muteIndicator}`, GAME_WIDTH - 20, 50);

    // Beat indicator (pulsing circle in corner that shows rhythm)
    if (this.beatPulse > 0) {
      const size = 15 + this.beatPulse * 10;
      this.ctx.beginPath();
      this.ctx.arc(GAME_WIDTH - 30, GAME_HEIGHT - 30, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 255, 255, ${this.beatPulse * 0.8})`;
      this.ctx.fill();

      // Border ring
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.beatPulse})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Static beat circle outline
    this.ctx.beginPath();
    this.ctx.arc(GAME_WIDTH - 30, GAME_HEIGHT - 30, 15, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderMenu(): void {
    this.renderOverlay();

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;

    // Title
    this.ctx.font = 'bold 64px "Segoe UI", sans-serif';
    this.ctx.fillText('TEMPO DASH', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

    // Subtitle
    this.ctx.font = '24px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('Auto-Runner Platformer', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);

    // Instructions
    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillText('Hold SPACE, Click, or Tap to jump', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    this.ctx.fillText('Press ENTER or Click to start', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 75);

    // Level select and mute info
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('Press 1 for Level 1, 2 for Level 2', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 115);
    this.ctx.fillText('Press M to toggle music', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140);

    this.ctx.restore();
  }

  private renderPaused(): void {
    this.renderOverlay();

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.shadowBlur = 15;

    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 5;
    this.ctx.fillText('Press ESC or ENTER to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    this.ctx.fillText('Press M to toggle music', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);

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
    this.ctx.font = '24px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(`Final Score: ${this.state.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);

    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillText('Click or Press ENTER to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);

    this.ctx.restore();
  }

  private renderLevelComplete(): void {
    this.renderOverlay();

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = COLORS.GOAL;
    this.ctx.shadowColor = '#ffd700';
    this.ctx.shadowBlur = 25;

    this.ctx.font = 'bold 56px "Segoe UI", sans-serif';
    this.ctx.fillText('LEVEL COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.font = '24px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(`Attempts: ${this.attempts}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
    this.ctx.fillText(`Score: ${this.state.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45);

    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    if (this.state.currentLevel < TOTAL_LEVELS) {
      this.ctx.fillText('Click or Press ENTER for next level', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 95);
    } else {
      this.ctx.fillText('Congratulations! You beat the game!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 85);
      this.ctx.fillText('Click or Press ENTER to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 115);
    }

    this.ctx.restore();
  }

  private renderOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}
