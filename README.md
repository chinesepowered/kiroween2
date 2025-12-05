# 🎃 FrankenKiro

**A Halloween DOOM-style FPS built entirely with Kiro's spec-driven development**

---

## The Game

FrankenKiro drops you into Dr. Frankenstein's abandoned laboratory where experiments have gone horribly wrong. Armed with your trusty pistol, navigate through haunted corridors, battle reanimated creatures, and escape before you become the next experiment.

The game features classic DOOM-style raycasting graphics rendered entirely in the browser using HTML5 Canvas - no WebGL, no external game engines. Just pure JavaScript math creating that nostalgic pseudo-3D experience.

### Features

🔫 **Classic FPS Combat** - Shoot zombies and skeletons with satisfying hit detection

🏃 **Smooth Movement** - WASD/Arrow keys with proper collision detection and wall sliding

👾 **Enemy AI** - Creatures that hunt you down with line-of-sight detection and pursuit behavior

💊 **Power-ups** - Collect health packs, ammo, and keys scattered throughout levels

🎨 **Stitched UI** - A "Frankenstein's monster" aesthetic where the HUD looks cobbled together from mismatched parts

📱 **Mobile Ready** - Touch controls for playing on phones and tablets

💾 **Save/Load** - Your progress persists to localStorage

---

## Built with Kiro

This project showcases Kiro's spec-driven development workflow from concept to completion.

### The Spec Journey

**Requirements** → We started with a rough idea and Kiro helped formalize it into 10 user stories with 40+ EARS-compliant acceptance criteria. Every requirement follows the pattern: "WHEN [trigger] THEN the system SHALL [response]"

**Design** → Kiro generated a comprehensive design document with architecture diagrams, TypeScript interfaces, and 19 correctness properties for property-based testing. The design traces directly back to requirements.

**Tasks** → The implementation was broken into 18 task groups with checkpoints. Each task references specific requirements, creating full traceability from code back to user needs.

### What Kiro Enabled

- **Formal Correctness** - Property-based tests verify that walls are never penetrated, health never goes negative, and game state serialization round-trips perfectly
- **Clean Architecture** - The spec process naturally led to well-separated modules: engine, game logic, UI components
- **Living Documentation** - The spec files in `.kiro/specs/frankenkiro-game/` serve as both design docs and implementation guides

### Spec Files

```
.kiro/specs/frankenkiro-game/
├── requirements.md   # 10 user stories, 40+ acceptance criteria
├── design.md         # Architecture, interfaces, 19 correctness properties  
└── tasks.md          # 18 task groups with requirement traceability
```

---

## Technical Highlights

**Raycasting Engine** - DDA algorithm casting 640 rays per frame with fish-eye correction

**Collision System** - Grid-based wall collision with proper resolution and wall sliding

**Functional Game Logic** - Immutable state updates for player, enemies, and items

**React Integration** - Game loop runs outside React's render cycle using refs to avoid stale closures

**Property-Based Testing** - fast-check validates collision invariants across thousands of random inputs

---

## The Name

*FrankenKiro* - A monster stitched together from parts, just like our game's aesthetic... and just like how Kiro helped us stitch together requirements, design, and code into a cohesive whole.

🧟 Happy Halloween! 🎃
