# Level Editor Mobile-First Redesign Plan

## Design Philosophy
- **Touch-first**: All interactions designed for fingers, enhanced with mouse/keyboard
- **Thumb-friendly**: Critical controls within thumb reach (bottom of screen)
- **Minimal UI**: Show only what's needed, hide complexity behind gestures
- **Large touch targets**: Minimum 48px for all interactive elements

---

## Phase 1: Core Touch Infrastructure

### 1.1 Touch Event System
- Add touch event handlers alongside mouse events
- Implement gesture recognition:
  - **Single tap**: Select/place element
  - **Double tap**: Open property editor for element
  - **Long press (500ms)**: Context menu with actions
  - **Drag**: Move element or pan canvas
  - **Pinch**: Zoom in/out
  - **Two-finger drag**: Pan canvas

### 1.2 Responsive Layout System
```
Desktop (>960px):          Mobile (<960px):
┌────────┬────────────┐    ┌────────────────────┐
│Sidebar │   Canvas   │    │      Canvas        │
│        │            │    │                    │
│        │            │    │                    │
│        │            │    ├────────────────────┤
│        │            │    │  Bottom Toolbar    │
├────────┴────────────┤    │  [Tools] [Props]   │
│     Top Toolbar     │    └────────────────────┘
└─────────────────────┘
```

### 1.3 New Class Structure
```typescript
// New file: src/editor/TouchHandler.ts
class TouchHandler {
  - gesture recognition
  - pinch zoom tracking
  - long press detection
  - velocity tracking for momentum scroll
}

// New file: src/editor/EditorUI.ts
class EditorUI {
  - responsive layout management
  - panel visibility states
  - animation system for panels
}
```

---

## Phase 2: Mobile UI Components

### 2.1 Bottom Toolbar (Mobile Primary)
- Height: 64px + safe area
- Contents:
  - Tool selector (icon buttons, 48x48px each)
  - Selected platform type indicator
  - Undo/Redo buttons
  - Menu button (hamburger)

### 2.2 Floating Action Button (FAB)
- Position: Bottom-right, above toolbar
- Primary action: Add element (tap to cycle through types)
- Long-press: Show radial menu of all element types

### 2.3 Slide-Up Property Panel
- Triggered by: Double-tap on element, or "Edit" in context menu
- Contents:
  - Element type selector (visual icons)
  - Position: X/Y with increment buttons (+/- 10px, +/- 1px)
  - Size: Width/Height with increment buttons
  - For moving platforms: Pattern selector, distance slider, speed slider
  - For phase platforms: Phase group, offset slider
- Drag handle at top to dismiss or expand to full screen

### 2.4 Context Menu (Long-Press)
- Appears near finger position
- Options:
  - Edit Properties
  - Duplicate
  - Delete
  - Copy / Paste
  - Move to Front / Back

### 2.5 Collapsible Side Panel (Desktop)
- Toggle button at edge
- Collapsed: Just icons (48px width)
- Expanded: Full panel with labels (200px width)

---

## Phase 3: Multi-Select System

### 3.1 Selection Modes
- **Tap**: Single select (clears previous)
- **Tap + hold on empty**: Start box selection
- **Tap selected + tap another**: Add to selection (mobile)
- **Shift+click**: Add to selection (desktop)

### 3.2 Selection Box
- Visual: Dashed rectangle following finger/mouse
- On release: Select all elements within box
- Color: Semi-transparent blue fill, solid blue border

### 3.3 Multi-Element Operations
- Move: Drag any selected element, all move together
- Delete: Delete key or context menu removes all
- Duplicate: Creates copies offset by 20px
- Align: Context menu options (align left, center, distribute)

---

## Phase 4: Zoom & Pan System

### 4.1 Zoom Controls
- Pinch gesture: Zoom centered on pinch midpoint
- Scroll wheel: Zoom centered on cursor
- Zoom levels: 25%, 50%, 75%, 100%, 150%, 200%
- Zoom indicator: Bottom-left showing current zoom %

### 4.2 Mini-Map
- Position: Top-right corner, 120x80px
- Shows: Full level overview with current viewport box
- Tap mini-map: Jump to that location
- Drag in mini-map: Pan viewport

### 4.3 Pan Controls
- Two-finger drag (touch)
- Middle-mouse drag or Space+drag (desktop)
- Arrow keys (desktop)
- Edge panning when dragging element near edge

---

## Phase 5: Property Inspector

### 5.1 Inspector Panel Design
Mobile: Slide-up sheet (bottom)
Desktop: Docked right panel (collapsible)

### 5.2 Property Fields
```
┌─────────────────────────────┐
│ ═══ Platform Properties ═══ │
├─────────────────────────────┤
│ Type: [Solid ▼]             │
├─────────────────────────────┤
│ Position                    │
│ X: [-][  120  ][+]          │
│ Y: [-][  340  ][+]          │
├─────────────────────────────┤
│ Size                        │
│ W: [-][  100  ][+]          │
│ H: [-][   20  ][+]          │
├─────────────────────────────┤
│ ══ Moving Platform ══       │ (shown only for moving type)
│ Pattern: ○ Horiz ● Vert ○ Circ │
│ Distance: ────●──── 80px    │
│ Speed:    ──●────── 1.2x    │
└─────────────────────────────┘
```

### 5.3 Increment Buttons
- Tap: +/- 1 unit
- Hold: Accelerating increment (1, 2, 5, 10, 20...)
- Swipe on number: Fine adjustment

---

## Phase 6: Visual Feedback & Helpers

### 6.1 Path Preview for Moving Platforms
- Dotted line showing movement path
- Ghost platforms at movement extremes
- Arrow indicating direction

### 6.2 Snap Guides
- Blue lines when aligning with other platforms
- Snap to: Edges, centers, grid
- Toggle with button or G key

### 6.3 Real-Time Validation
- Warning icons on problematic elements
- Tap warning to see issue description
- Validation panel in menu

### 6.4 Grid Improvements
- Multiple grid sizes: 10px, 20px, 40px
- Minor/major grid lines (light/dark)
- Grid size selector in toolbar

---

## Phase 7: Templates & Library

### 7.1 Template Levels
- Accessible from "New Level" flow
- Options: Blank, Tutorial, Obstacle Course, Speedrun

### 7.2 Element Library (Advanced)
- Save configured platforms as presets
- e.g., "Vertical Mover 80px" as reusable piece
- Stored in localStorage alongside levels

### 7.3 Quick Patterns
- Hold on placement to see pattern options
- "Staircase", "Gap Jump", "Moving Sequence"

---

## Phase 8: Test Mode Improvements

### 8.1 Test from Position
- Long-press in test mode to set spawn point
- Or "Test from here" in context menu during edit

### 8.2 Speed Controls
- Slow-mo button (0.5x speed)
- Frame-by-frame stepping

### 8.3 Quick Return
- Floating "Back to Editor" button
- Remembers exact camera position

---

## Implementation Order

### Sprint 1: Foundation (Core Mobile Support)
1. Touch event handling system
2. Gesture recognition (tap, drag, pinch)
3. Responsive layout detection
4. Bottom toolbar for mobile

### Sprint 2: Interaction
5. Property inspector slide-up panel
6. Long-press context menu
7. Zoom system with pinch
8. Pan with two-finger drag

### Sprint 3: Selection & Editing
9. Multi-select system
10. Box selection
11. Bulk operations (move, delete, duplicate)
12. Snap guides

### Sprint 4: Visual Polish
13. Moving platform path preview
14. Real-time validation warnings
15. Mini-map
16. Level statistics panel

### Sprint 5: Advanced Features
17. Templates
18. Test from position
19. Element presets/library
20. Import/export improvements

---

## File Changes Required

### New Files
- `src/editor/TouchHandler.ts` - Touch/gesture handling
- `src/editor/EditorUI.ts` - Responsive UI components
- `src/editor/PropertyInspector.ts` - Property editing panel
- `src/editor/ContextMenu.ts` - Long-press context menu
- `src/editor/MiniMap.ts` - Level overview component
- `src/editor/SelectionManager.ts` - Multi-select handling

### Modified Files
- `src/editor/LevelEditor.ts` - Integrate new systems, responsive layout
- `src/types.ts` - Add new editor state types
- `src/game/Game.ts` - Handle touch events, responsive canvas sizing
- `src/constants.ts` - Add editor-specific constants

---

## Touch Target Sizes

| Element | Minimum Size | Recommended |
|---------|-------------|-------------|
| Tool button | 44x44px | 48x48px |
| Platform type | 44px height | 48px height |
| Property +/- | 44x44px | 48x48px |
| FAB | 56x56px | 56x56px |
| Context menu item | 48px height | 52px height |
| Slider track | 48px height | 48px height |

---

## Keyboard Shortcuts (Desktop Enhancement)

| Key | Action |
|-----|--------|
| 1-5 | Select tools |
| G | Toggle grid |
| Z / Ctrl+Z | Undo |
| Y / Ctrl+Y | Redo |
| D / Ctrl+D | Duplicate selected |
| Delete/Backspace | Delete selected |
| Ctrl+A | Select all |
| Escape | Deselect / Close panel |
| Space+Drag | Pan |
| +/- | Zoom in/out |
| Arrow keys | Nudge selected by grid size |
| Shift+Arrow | Nudge by 1px |
| F5 / Ctrl+Enter | Test level |
| Ctrl+S | Save |
