# TempoDash Feature Roadmap

A systematic implementation plan for new game features, organized into phases that build upon each other.

---

## Phase 1: Power-Up Integration
**Priority: High | Effort: Low | Impact: High**

The power-up system (`src/systems/PowerUps.ts`) is already fully implemented but not integrated into gameplay.

### 1.1 Core Integration
- [ ] Integrate PowerUpManager into Game class
- [ ] Add power-up collision detection in game loop
- [ ] Apply slowmo multiplier to game speed
- [ ] Apply points multiplier to coin collection
- [ ] Implement magnet effect (attract nearby coins)
- [ ] Integrate shield with death prevention logic

### 1.2 Level Placement
- [ ] Add power-ups to Level 3 (introduce shield before lava)
- [ ] Add power-ups to Level 5 (magnet for coin-heavy sections)
- [ ] Add power-ups to Level 7 (slowmo for fast sections)
- [ ] Add power-ups to Level 8 (all types for final challenge)

### 1.3 Visual Polish
- [ ] Add collection particle effects
- [ ] Add activation sound effects
- [ ] Add expiring warning (flash when < 2 seconds)

---

## Phase 2: Difficulty Modifiers
**Priority: High | Effort: Medium | Impact: High**

Replayability through gameplay mutators that can be toggled on/off.

### 2.1 Modifier System
- [ ] Create ModifierManager class
- [ ] Add modifier selection UI on level select screen
- [ ] Store modifier preferences in save data
- [ ] Track high scores per modifier combination

### 2.2 Modifier Types
| Modifier | Effect | Score Multiplier |
|----------|--------|------------------|
| Speed Demon | 1.5x game speed | 1.5x |
| No Double Jump | Disable air jumps | 1.3x |
| Fragile | One-hit death (no shield) | 1.2x |
| Mirror Mode | Controls inverted | 1.4x |
| Time Attack | 60-second time limit | 1.25x |
| Invisible | Platforms fade after touch | 1.5x |

### 2.3 UI Elements
- [ ] Modifier toggle buttons on level select
- [ ] Active modifier icons during gameplay
- [ ] Separate leaderboard tabs per modifier

---

## Phase 3: Daily/Weekly Challenges
**Priority: High | Effort: Medium | Impact: High**

Seeded procedural challenges that are the same for all players.

### 3.1 Challenge System
- [x] Create ChallengeManager class
- [x] Implement date-based seeding for procedural generation
- [x] Define challenge types (Endless, Speedrun, Coin Rush, Survival)
- [x] Add challenge-specific scoring rules

### 3.2 Challenge Types
| Type | Duration | Goal |
|------|----------|------|
| Daily Sprint | 1 day | Fastest completion of seeded level |
| Daily Coin Rush | 1 day | Most coins in seeded endless run |
| Weekly Endurance | 7 days | Longest survival in hard endless mode |
| Weekly Gauntlet | 7 days | Complete 5 seeded challenge levels |

### 3.3 UI & Rewards
- [x] Challenge menu with current/upcoming challenges
- [x] Countdown timer to next challenge
- [x] Streak tracking (consecutive days participated)
- [x] Streak rewards (bonus skins, achievement progress)

---

## Phase 4: New Platform Types
**Priority: Medium | Effort: Medium | Impact: High**

Expand gameplay variety with new platform mechanics.

### 4.1 New Types
| Platform | Behavior |
|----------|----------|
| Teleport | Warp player to linked teleport pad |
| Gravity Flip | Invert gravity when touched |
| Conveyor | Move player horizontally while standing |
| Wind Zone | Apply horizontal/vertical force in area |
| Sticky | Player sticks until jump pressed |
| Glass | Breaks after 2nd landing |

### 4.2 Implementation Steps
- [ ] Add new platform types to types.ts
- [ ] Implement physics behavior for each type
- [ ] Add rendering for each type
- [ ] Add to level editor palette
- [ ] Create tutorial level for new mechanics

### 4.3 Level Integration
- [ ] Add teleport platforms to Level 6
- [ ] Add gravity flip zones to new bonus level
- [ ] Add conveyor belts to endless mode variety

---

## Phase 5: Boss/Challenge Levels
**Priority: Medium | Effort: High | Impact: High**

Special levels with unique mechanics.

### 5.1 Chase Mode
- [ ] Wall of death following player
- [ ] Progressive speed increase
- [ ] Safe zones for brief respite

### 5.2 Rhythm Lock Mode
- [ ] Platforms only solid on beat
- [ ] Visual beat indicator
- [ ] Sync with procedural music

### 5.3 Special Levels
| Level | Mechanic |
|-------|----------|
| The Descent | Vertical level, gravity pulling down |
| Mirror Maze | Split screen, control both players |
| Beat Drop | Platforms appear on musical beats |
| The Gauntlet | All platform types in sequence |

---

## Phase 6: Level Sharing & Social
**Priority: Medium | Effort: Medium | Impact: Medium**

Enable players to share and discover custom levels.

### 6.1 Level Codes
- [ ] Generate shareable level codes (base64 compressed)
- [ ] Import level from code
- [ ] Copy code to clipboard
- [ ] QR code generation for mobile sharing

### 6.2 Level Browser (Local)
- [ ] Sort by: newest, most played, rating
- [ ] Filter by: difficulty, length, tags
- [ ] Preview thumbnail generation

### 6.3 Rating System
- [ ] Star rating (1-5)
- [ ] Difficulty rating (1-5)
- [ ] Play count tracking
- [ ] Author attribution

---

## Phase 7: Online Leaderboards
**Priority: Low | Effort: High | Impact: High**

Global high score tracking (requires backend).

### 7.1 Infrastructure
- [ ] Design leaderboard API schema
- [ ] Set up serverless backend (or use existing service)
- [ ] Implement anti-cheat validation
- [ ] Ghost replay submission

### 7.2 Leaderboard Types
- [ ] Per-level leaderboards
- [ ] Endless mode leaderboard
- [ ] Daily challenge leaderboard
- [ ] Weekly challenge leaderboard

### 7.3 Features
- [ ] Top 100 global rankings
- [ ] Personal best tracking
- [ ] Friend leaderboards (if social implemented)
- [ ] Watch replay of any leaderboard entry

---

## Phase 8: Tutorial System
**Priority: Medium | Effort: Low | Impact: Medium**

Interactive on-boarding for new players.

### 8.1 First-Play Experience
- [ ] Detect first-time player
- [ ] Guided Level 1 with prompts
- [ ] Highlight controls on screen
- [ ] Pause game until prompt dismissed

### 8.2 Mechanic Hints
- [ ] Show hint on first encounter with platform type
- [ ] "How to" button in pause menu
- [ ] Practice mode with tips enabled

### 8.3 Hint Types
| Trigger | Hint |
|---------|------|
| First jump | "Tap to jump!" |
| First double jump | "Tap again in air!" |
| First bounce platform | "Bounce pads give extra height!" |
| First death | "Don't worry, try again!" |
| First power-up | "Collect power-ups for abilities!" |

---

## Phase 9: Visual Themes & Polish
**Priority: Low | Effort: Medium | Impact: Medium**

Aesthetic variety and environmental effects.

### 9.1 Background Themes
- [ ] Seasonal themes (Winter, Summer, Autumn, Spring)
- [ ] Time of day (Dawn, Day, Dusk, Night)
- [ ] Special themes (Neon, Retro, Space)

### 9.2 Weather Effects
- [ ] Rain (visual only or affects gameplay)
- [ ] Snow (slippery platforms)
- [ ] Wind (affects player mid-air)
- [ ] Lightning (brief screen flash)

### 9.3 Unlockable Themes
- [ ] Tie themes to achievements
- [ ] Seasonal themes unlock during real-world seasons
- [ ] Theme preview in settings

---

## Implementation Priority

| Phase | Priority | Dependencies |
|-------|----------|--------------|
| 1. Power-Ups | NOW | None |
| 2. Difficulty Modifiers | Week 1 | Phase 1 |
| 3. Daily Challenges | Week 2 | Phase 2 |
| 4. New Platforms | Week 3 | None |
| 5. Boss Levels | Week 4 | Phase 4 |
| 6. Level Sharing | Week 5 | None |
| 7. Leaderboards | Future | Backend required |
| 8. Tutorial | Anytime | None |
| 9. Visual Themes | Anytime | None |

---

## Quick Wins (Can Implement Anytime)

- [ ] Add more achievement types
- [ ] Add more player skins
- [ ] Add more music styles
- [ ] Screen shake intensity slider
- [ ] Custom keybind support
- [ ] Speedrun timer display option

---

## Notes

- Phases 1-3 focus on **replayability** and **engagement**
- Phases 4-5 focus on **gameplay depth**
- Phases 6-7 focus on **community** and **competition**
- Phases 8-9 focus on **polish** and **accessibility**

Each phase is designed to be self-contained and shippable independently.
