import { Game } from './game/Game';

// Check if running as standalone app (added to home screen)
function isStandalone(): boolean {
  return (window.matchMedia('(display-mode: standalone)').matches) ||
         ((window.navigator as any).standalone === true) ||
         document.referrer.includes('android-app://');
}

// Detect iOS
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

// Show install prompt for mobile users not in standalone mode
function showInstallPrompt(): void {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 850);

  // Only show on mobile, not in standalone mode, and in landscape
  if (isMobile && !isStandalone()) {
    const prompt = document.getElementById('install-prompt');
    if (prompt) {
      // Show after a short delay
      setTimeout(() => {
        prompt.classList.add('show');

        // Auto-hide after 8 seconds
        setTimeout(() => {
          prompt.classList.remove('show');
        }, 8000);

        // Hide on tap
        prompt.addEventListener('click', () => {
          prompt.classList.remove('show');
        });
      }, 2000);
    }
  }
}

// Hide address bar on mobile
function hideAddressBar(): void {
  // Scroll trick to minimize browser chrome
  setTimeout(() => {
    window.scrollTo(0, 1);
  }, 0);

  // For iOS, scroll on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 100);
  });
}

async function init(): Promise<void> {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // Try to hide address bar on mobile
  hideAddressBar();

  const game = new Game(canvas);
  await game.start();

  // Show install prompt for iOS users
  if (isIOS() && !isStandalone()) {
    showInstallPrompt();
  }
}

// Start game when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
