# TempoDash - Developer Guide

## Overview

TempoDash is a rhythm-based auto-scrolling platformer with both web (desktop) and mobile versions. The player automatically moves right while the player controls jumping and dashing to navigate platforms synchronized to music beats.

## Architecture

### Web Application (`src/`)
- **Stack**: TypeScript 5.3, Vite 5.0, HTML5 Canvas 2D
- **Entry**: `index.html` → `src/main.ts` → `Game` class
- **Rendering**: All rendering uses Canvas 2D context directly (no framework)
- **Build**: `npm run build` runs `tsc && vite build`
- **Deploy**: Vercel via GitHub Actions

### Mobile Application (`mobile/`)
- **Stack**: Expo ~54, React Native 0.81.5, Shopify Skia for rendering
- **Entry**: `mobile/app/_layout.tsx` (Expo Router)
- **Rendering**: React Native Skia canvas
- **Build**: EAS Build (`eas.json`)

### Shared Concepts
Both platforms implement the same game but with **separate codebases**. The mobile version has vertical scrolling (player moves upward) vs horizontal scrolling on web. Mobile currently lacks many web features (ghost replay, beat hazards, flow meter, time rewind, modifiers, boss mode, challenges, level editor).

## Directory Structure

```
src/
├── main.ts              # Entry point, creates Game instance
├── constants.ts         # Physics, scoring, timing, color constants
├── types.ts             # All TypeScript interfaces and types
├── config/
│   ├── UIConstants.ts   # UI layout, button sizes, colors
│   └── LevelMetadata.ts # Level descriptions and metadata
├── game/
│   └── Game.ts          # Main game engine (~9500 lines, handles everything)
├── entities/
│   ├── Player.ts        # Player physics, collision, movement
│   ├── Platform.ts      # 15 platform types with behaviors
│   ├── Coin.ts          # Collectible coins
│   ├── Gem.ts           # Rare collectible gems (ruby/sapphire/emerald)
│   └── Portal.ts        # Teleport portals
├── levels/
│   ├── Level.ts         # Level class with collision checking
│   ├── index.ts         # Level factory and registry
│   └── Level1-15.ts     # Individual level configurations
├── systems/
│   ├── Audio.ts         # Web Audio API music/SFX
│   ├── Input.ts         # Keyboard/touch/gamepad input
│   ├── SaveManager.ts   # LocalStorage save/load, skins, unlocks
│   ├── ParticleEffects.ts  # Visual particle system
│   ├── ScreenEffects.ts    # Weather, shake, flash effects
│   ├── ScreenTransition.ts # Fade transitions
│   ├── ObjectPool.ts       # Generic object pool for performance
│   ├── GhostManager.ts     # Record/playback ghost runs
│   ├── GhostReplay.ts      # Ghost data compression
│   ├── FlowMeter.ts        # Flow state tracking
│   ├── BeatHazards.ts      # Beat-synced hazard spawning
│   ├── TimeRewind.ts       # Death rewind mechanic
│   ├── BossMode.ts         # Boss fight encounters
│   ├── ChaseMode.ts        # Wall-of-death chase mechanic
│   ├── GravityWells.ts     # Gravity well zones
│   ├── Modifiers.ts        # Difficulty modifiers
│   ├── PowerUps.ts         # Shield/magnet/slowmo/doublePoints
│   ├── Challenges.ts       # Daily/weekly challenges
│   ├── Leaderboard.ts      # Local leaderboard tracking
│   ├── Statistics.ts        # Play statistics
│   ├── CustomLevelManager.ts # Custom level CRUD
│   ├── LevelSharing.ts      # Level import/export encoding
│   └── DebugOverlay.ts      # Debug info display
├── graphics/
│   └── Background.ts    # Parallax background rendering
└── editor/
    ├── LevelEditor.ts   # Custom level editor (~2800 lines)
    ├── PropertyInspector.ts # Element property editing
    ├── TouchHandler.ts   # Editor touch/mouse input
    ├── MiniMap.ts        # Level overview minimap
    └── ContextMenu.ts    # Right-click context menu
```

## Key Concepts

### Game Loop
`Game.gameLoop()` → `Game.update(dt)` → `Game.render()`
- Delta time in milliseconds, capped at 50ms
- All physics use `dt/1000` for seconds-based calculation

### Physics (Web)
- Auto-scroll: 350 px/s (rightward), increases with speed multiplier
- Gravity: 2000 px/s², Jump force: 600 px/s
- Terminal velocity: 1000 px/s
- 5 total jumps (1 ground + 4 air)

### Physics (Mobile)
- Auto-scroll: 300 px/s (upward)
- Gravity: 2200 px/s², Jump force: 650 px/s
- Terminal velocity: 900 px/s

### Platform Types
15 types: solid, bounce, crumble, moving, ice, lava, phase, spike, conveyor, gravity, sticky, glass, slowmo, wall, secret

### Collision Detection
AABB overlap with minimum penetration resolution. Returns 'top'|'bottom'|'left'|'right'. Side collisions are death except for wall platforms (wall-slide) and edge bounces (boomerang mechanic).

### State Machine
`GameState.gameStatus` controls which update/render path runs:
- Menu states: mainMenu, levelSelect, settings, skins, achievements, challenges, customLevels, platformGuide, replays, leaderboards
- Play states: playing, practice, endless, challengePlaying, editorTest
- Overlay states: paused, levelComplete, gameOver
- Editor: editor

### Save System
Web uses LocalStorage via `SaveManager`. Mobile uses AsyncStorage. Save data includes: unlocked levels, high scores, settings, achievements, ghost runs, statistics, mastery badges.

## Common Patterns

### Adding a new level
1. Create `src/levels/LevelN.ts` with `LevelConfig` export
2. Register in `src/levels/index.ts`
3. Update `TOTAL_LEVELS` constant

### Adding a new platform type
1. Add type to `PlatformType` union in `src/types.ts`
2. Add rendering in `Platform.render()`
3. Add collision behavior in `Player.handleCollisions()`
4. Add color in `COLORS.PLATFORM` in `src/constants.ts`

### Adding a new system
1. Create class in `src/systems/`
2. Instantiate in `Game` constructor
3. Call `update()` in `Game.update()`
4. Call `reset()` in all restart paths (startLevel, restartLevel, quickRestart)

## Running

```bash
# Web development
npm install
npm run dev      # Vite dev server

# Web production build
npm run build    # tsc && vite build

# Mobile
cd mobile
npm install
npx expo start   # Expo dev server
```

## Testing

Tests use Vitest. Run with:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## Known Architecture Issues

1. **Game.ts is ~9500 lines** — handles rendering, input, menus, achievements, challenges, scoring, and more. Extracting focused modules (ScoreManager, MenuRenderer, etc.) is an ongoing effort.
2. **Web and mobile codebases are separate** — physics values differ slightly and features drift. A shared core library is planned.
3. **Multiple restart paths** — `startLevel()`, `restartLevel()`, `quickRestart()`, `restartChallenge()` each reset different subsets of state. A unified `resetGameState()` is planned.
