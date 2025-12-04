import { GameState } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { InputManager } from '../systems/Input';
import { Player } from '../entities/Player';
import { Level } from '../levels/Level';
import { createLevel, TOTAL_LEVELS } from '../levels/index';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;

  private state: GameState = {
    currentLevel: 1,
    lives: 3,
    score: 0,
    gameStatus: 'menu',
  };

  private player!: Player;
  private level!: Level;

  private lastTime = 0;
  private deathTimer = 0;

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
    this.loadLevel(1);

    // Setup keyboard for menu
    window.addEventListener('keydown', (e) => this.handleMenuInput(e));
  }

  private loadLevel(levelId: number): void {
    this.level = createLevel(levelId);
    this.player = new Player(this.level.playerStart);
    this.state.currentLevel = levelId;
  }

  private handleMenuInput(e: KeyboardEvent): void {
    if (this.state.gameStatus === 'menu') {
      if (e.code === 'Enter' || e.code === 'Space') {
        this.startGame();
      } else if (e.code === 'Digit1') {
        this.state.currentLevel = 1;
        this.startGame();
      } else if (e.code === 'Digit2') {
        this.state.currentLevel = 2;
        this.startGame();
      } else if (e.code === 'Digit3') {
        this.state.currentLevel = 3;
        this.startGame();
      } else if (e.code === 'Digit4') {
        this.state.currentLevel = 4;
        this.startGame();
      } else if (e.code === 'Digit5') {
        this.state.currentLevel = 5;
        this.startGame();
      } else if (e.code === 'Digit6') {
        this.state.currentLevel = 6;
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
      }
    } else if (this.state.gameStatus === 'paused') {
      if (e.code === 'Escape' || e.code === 'Enter') {
        this.state.gameStatus = 'playing';
      }
    }
  }

  private startGame(): void {
    this.loadLevel(this.state.currentLevel);
    this.state.lives = 3;
    this.state.score = 0;
    this.state.gameStatus = 'playing';
  }

  private resetGame(): void {
    this.state.currentLevel = 1;
    this.startGame();
  }

  private nextLevel(): void {
    if (this.state.currentLevel < TOTAL_LEVELS) {
      this.state.currentLevel++;
      this.loadLevel(this.state.currentLevel);
      this.state.gameStatus = 'playing';
    } else {
      // Game complete - show victory or return to menu
      this.state.gameStatus = 'menu';
    }
  }

  private respawnPlayer(): void {
    this.state.lives--;
    if (this.state.lives <= 0) {
      this.state.gameStatus = 'gameOver';
    } else {
      this.loadLevel(this.state.currentLevel);
    }
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
    if (this.state.gameStatus !== 'playing') {
      // Still update background animations for visual effect
      this.level.update(deltaTime);
      return;
    }

    const inputState = this.input.update();

    // Update level (platforms, background)
    this.level.update(deltaTime);

    // Update player
    this.player.update(deltaTime, inputState, this.level.getActivePlatforms());

    // Check for death
    if (this.player.isDead) {
      this.deathTimer += deltaTime;
      if (this.deathTimer > 1000) {
        this.deathTimer = 0;
        this.respawnPlayer();
      }
      return;
    }

    // Check for goal
    if (this.level.checkGoal(this.player)) {
      this.state.score += 1000;
      this.state.gameStatus = 'levelComplete';
    }

    // Screen boundaries
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > GAME_WIDTH - this.player.width) {
      this.player.x = GAME_WIDTH - this.player.width;
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Render level
    this.level.render(this.ctx);

    // Render player
    if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'paused') {
      this.player.render(this.ctx);
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
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.shadowColor = COLORS.UI_SHADOW;
    this.ctx.shadowBlur = 4;

    // Level name
    this.ctx.fillText(`Level ${this.state.currentLevel}: ${this.level.name}`, 20, 35);

    // Lives
    this.ctx.fillText(`Lives: ${'♥'.repeat(this.state.lives)}`, 20, 65);

    // Score
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Score: ${this.state.score}`, GAME_WIDTH - 20, 35);

    // Controls hint
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText('Arrow keys / WASD to move, Space to jump', GAME_WIDTH - 20, 65);

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
    this.ctx.font = 'bold 56px "Segoe UI", sans-serif';
    this.ctx.fillText('TEMPO DASH', GAME_WIDTH / 2, 80);

    // Subtitle
    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('A Rhythm Platformer', GAME_WIDTH / 2, 115);

    // Level selection
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillText('Select Level (1-6) or press ENTER to start from Level 1', GAME_WIDTH / 2, 160);

    // Level grid - 2 columns
    const levels = [
      { num: 1, name: 'City Nights', color: '#e94560' },
      { num: 2, name: 'Neon Dreams', color: '#ff00ff' },
      { num: 3, name: 'Crystal Caverns', color: '#00ffff' },
      { num: 4, name: 'Zero-G Station', color: '#3b82f6' },
      { num: 5, name: 'Storm Surge', color: '#fbbf24' },
      { num: 6, name: 'Digital Realm', color: '#00ff00' },
    ];

    const startY = 200;
    const colWidth = 300;
    const rowHeight = 55;

    for (let i = 0; i < levels.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = GAME_WIDTH / 2 + (col === 0 ? -colWidth / 2 - 50 : colWidth / 2 - 50);
      const y = startY + row * rowHeight;

      // Level box
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(x - 100, y - 20, 200, 45);
      this.ctx.strokeStyle = levels[i].color;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x - 100, y - 20, 200, 45);

      // Level number
      this.ctx.fillStyle = levels[i].color;
      this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`[${levels[i].num}]`, x - 85, y + 10);

      // Level name
      this.ctx.fillStyle = COLORS.UI_TEXT;
      this.ctx.font = '18px "Segoe UI", sans-serif';
      this.ctx.fillText(levels[i].name, x - 40, y + 10);
    }

    // Controls
    this.ctx.textAlign = 'center';
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('Controls: Arrow keys or WASD to move, Space to jump, ESC to pause', GAME_WIDTH / 2, GAME_HEIGHT - 30);

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
    this.ctx.fillText('Press ENTER or SPACE to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);

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
    this.ctx.fillText('LEVEL COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.font = '24px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(`Score: ${this.state.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);

    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    if (this.state.currentLevel < TOTAL_LEVELS) {
      this.ctx.fillText('Press ENTER or SPACE for next level', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);
    } else {
      this.ctx.fillText('Congratulations! You beat the game!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
      this.ctx.fillText('Press ENTER or SPACE to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 95);
    }

    this.ctx.restore();
  }

  private renderOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}
