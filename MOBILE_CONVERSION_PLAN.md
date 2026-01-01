# TempoDash React Native/Expo Mobile Conversion Plan

## Project Overview

Convert the existing HTML5 Canvas-based rhythm platformer game into a native React Native/Expo app for iOS and Android App Store distribution.

**Key Requirements:**
- Portrait mode (one-handed play)
- Native iOS/Android feel
- App Store ready (iOS + Google Play)

---

## Current State Analysis

### What We Have
- ~22,000 lines of TypeScript
- HTML5 Canvas 2D rendering (landscape, 1200x675)
- Horizontal auto-scrolling platformer
- 10 campaign levels + endless mode + level editor
- Web Audio API for procedural music
- Touch controls already implemented (but for landscape)
- PWA with offline support

### Major Conversion Challenges

| Challenge | Current Implementation | React Native Solution |
|-----------|----------------------|----------------------|
| Graphics | Canvas 2D API | `react-native-skia` or `expo-gl` |
| Game Loop | `requestAnimationFrame` | Skia's `useFrameCallback` |
| Audio | Web Audio API | `expo-av` or `react-native-track-player` |
| Storage | localStorage | `expo-secure-store` / `AsyncStorage` |
| Input | Touch events + keyboard | React Native Gesture Handler |
| Haptics | Vibration API | `expo-haptics` |

---

## Critical Design Decision: Portrait Mode

### Option A: Vertical Scrolling (Recommended)
**Change the game to scroll vertically (bottom-to-top) instead of horizontally.**

Pros:
- Natural one-handed thumb reach at bottom of screen
- Platforms can span more of screen width
- Better visibility of upcoming obstacles
- More intuitive for mobile (like countless mobile games)

Cons:
- Requires significant level redesign
- All 10 levels need restructuring
- Platform placement logic changes

### Option B: Horizontal Scroll in Portrait
**Keep horizontal scrolling but in portrait orientation (narrower view).**

Pros:
- Less level redesign needed
- Game mechanics stay the same

Cons:
- Very narrow vertical view area
- Harder to see platforms above/below
- May feel cramped
- Less intuitive for one-handed play

### Option C: Rotated Horizontal
**Keep landscape game logic, but render rotated 90° in portrait frame.**

Pros:
- Minimal code changes

Cons:
- Awkward viewing experience
- Not a great user experience

**Recommendation: Option A (Vertical Scrolling)** - This is the standard for mobile platformers and will feel most native.

---

## One-Handed Control Scheme

### Proposed Touch Controls (Portrait Mode)

```
┌─────────────────────┐
│                     │
│    GAME VIEWPORT    │
│                     │
│   (Vertical scroll  │
│    bottom to top)   │
│                     │
├─────────────────────┤
│                     │
│   TAP ANYWHERE      │  ← Single tap = Jump
│   TO JUMP           │  ← Double tap = Double jump
│                     │  ← Swipe left = Dash left
│   (Bottom 40%)      │  ← Swipe right = Dash right
│                     │
└─────────────────────┘
```

### Control Options to Discuss

1. **Tap to Jump** - Tap anywhere in control zone = jump
2. **Swipe for Dash** - Horizontal swipe = dash in that direction
3. **Hold for Actions** - Long press for special abilities
4. **Gesture Combos** - Two-finger tap for power-ups

### Alternative: Two-Thumb Portrait
```
┌─────────────────────┐
│                     │
│    GAME VIEWPORT    │
│                     │
├──────────┬──────────┤
│   DASH   │   JUMP   │
│  (left)  │  (right) │
└──────────┴──────────┘
```

**Question: Which control scheme do you prefer?**

---

## Technology Stack

### Recommended Stack

```
Expo SDK 52 (managed workflow)
├── react-native-skia (graphics rendering)
├── expo-av (audio/music)
├── expo-haptics (native haptic feedback)
├── expo-secure-store (save data)
├── react-native-gesture-handler (touch input)
├── react-native-reanimated (UI animations)
├── expo-constants (device info)
├── expo-screen-orientation (lock to portrait)
└── expo-build (EAS Build for App Store)
```

### Why Skia for Graphics?
- 60 FPS capable game rendering
- Hardware accelerated
- Similar API to Canvas 2D (easier migration)
- Used by major apps (Shopify, Coinbase)
- Active development by Shopify

---

## Feature Prioritization

### Phase 1: MVP (Playable Game)
- [ ] Expo project setup with Skia
- [ ] Core game loop with vertical scrolling
- [ ] Player physics (jump, double jump, dash)
- [ ] Basic platform types (solid, bounce, spike)
- [ ] 3 converted levels
- [ ] Basic audio (jump SFX, background music)
- [ ] Touch controls (tap to jump)
- [ ] Score and coin collection
- [ ] Main menu + level select
- [ ] Save/load game progress

### Phase 2: Full Feature Port
- [ ] All 10 campaign levels (redesigned for vertical)
- [ ] All 14 platform types
- [ ] Practice mode with checkpoints
- [ ] Endless mode (vertical procedural generation)
- [ ] All skins
- [ ] Achievements system
- [ ] Ghost replay system
- [ ] Power-ups
- [ ] Challenge mode (daily/weekly)

### Phase 3: Polish & App Store
- [ ] Native iOS navigation patterns
- [ ] iOS-style haptics
- [ ] Settings with native toggles
- [ ] App Store assets (screenshots, preview video)
- [ ] In-app purchase integration (optional)
- [ ] Analytics integration
- [ ] Crash reporting
- [ ] App Store submission

### Phase 4: Post-Launch (Optional)
- [ ] Level editor (React Native UI)
- [ ] Level sharing (cloud backend)
- [ ] Leaderboards (Game Center / Google Play Games)
- [ ] Push notifications for challenges

---

## Native iOS Feel Checklist

To feel like a native iOS app:

- [ ] **SF Pro font** or system font
- [ ] **iOS-style navigation** (stack navigation, swipe back)
- [ ] **Native haptics** (UIImpactFeedback patterns)
- [ ] **Rounded corners** matching iOS design
- [ ] **System colors** (dynamic light/dark mode)
- [ ] **Smooth 60 FPS** animations
- [ ] **Native modals** and action sheets
- [ ] **App icon** following iOS guidelines
- [ ] **Launch screen** (splash screen)
- [ ] **Safe area handling** (notch, Dynamic Island)
- [ ] **Reduced motion** respect system setting
- [ ] **VoiceOver accessibility** support

---

## Project Structure

```
TempoDashMobile/
├── app/                      # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx        # Main menu
│   │   ├── levels.tsx       # Level select
│   │   └── settings.tsx     # Settings
│   ├── game/
│   │   └── [levelId].tsx    # Game screen
│   └── _layout.tsx          # Navigation setup
├── src/
│   ├── game/
│   │   ├── GameCanvas.tsx   # Skia canvas component
│   │   ├── GameLoop.ts      # Main game loop
│   │   └── GameState.ts     # Game state management
│   ├── entities/
│   │   ├── Player.ts        # Player (adapted from web)
│   │   ├── Platform.ts      # Platforms (adapted)
│   │   └── Coin.ts          # Coins (adapted)
│   ├── levels/
│   │   └── *.ts             # Level definitions (redesigned)
│   ├── systems/
│   │   ├── AudioManager.ts  # expo-av wrapper
│   │   ├── InputManager.ts  # Gesture handler wrapper
│   │   ├── SaveManager.ts   # Secure store wrapper
│   │   └── HapticManager.ts # expo-haptics wrapper
│   ├── components/
│   │   ├── GameHUD.tsx      # Score, coins display
│   │   ├── MenuButton.tsx   # Reusable button
│   │   └── LevelCard.tsx    # Level select card
│   ├── hooks/
│   │   ├── useGameLoop.ts   # Game loop hook
│   │   └── useAudio.ts      # Audio hook
│   └── constants/
│       ├── colors.ts        # Theme colors
│       └── layout.ts        # Layout constants
├── assets/
│   ├── images/
│   ├── audio/
│   └── fonts/
├── app.json                 # Expo config
├── eas.json                 # EAS Build config
└── package.json
```

---

## Questions for Discussion

1. **Vertical vs Horizontal Scrolling?**
   - I recommend vertical, but this is a major design decision

2. **One-handed or two-thumb controls?**
   - Tap anywhere vs dedicated zones

3. **MVP scope?**
   - How many levels in first release?
   - Editor in first release or later?

4. **Monetization?**
   - Free with ads?
   - Paid upfront?
   - Free with IAP for skins/levels?

5. **Keep web version?**
   - Maintain both, or mobile-only going forward?

6. **Audio approach?**
   - Port procedural music or use pre-recorded tracks?
   - Procedural is more complex but smaller file size

7. **Level redesign?**
   - Manually redesign all 10 levels for vertical?
   - Or automated conversion attempt first?

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1 (MVP) | 2-3 weeks intensive |
| Phase 2 (Full Port) | 2-3 weeks |
| Phase 3 (Polish) | 1-2 weeks |
| Phase 4 (Editor) | 2-3 weeks |

---

## Next Steps

Once we agree on the approach:

1. Create new Expo project in `/TempoDashMobile`
2. Set up Skia and core dependencies
3. Port Player physics and basic game loop
4. Implement vertical scrolling camera
5. Create first vertical level
6. Build touch controls
7. Add audio system
8. Build menus with React Native UI

---

**Ready to discuss! What are your thoughts on the key decisions above?**
