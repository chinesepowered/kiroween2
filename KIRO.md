# How We Used Kiro to Build FrankenKiro

## Project Overview

FrankenKiro is a Halloween-themed DOOM-style first-person shooter built with Next.js 14, featuring raycasting graphics and a "stitched together" Frankenstein aesthetic. This document details how Kiro's spec-driven development workflow was used to design and implement the game.

## Kiro Spec-Driven Development

### 1. Requirements Phase

Kiro helped transform the initial game idea into formal requirements using the EARS (Easy Approach to Requirements Syntax) methodology. The requirements document (`.kiro/specs/frankenkiro-game/requirements.md`) includes:

- **10 User Stories** covering player movement, raycasting rendering, combat, enemy AI, items, HUD, levels, save/load, audio, and controls
- **EARS-compliant acceptance criteria** for each requirement (e.g., "WHEN the player presses W/Up Arrow THEN the FrankenKiro game SHALL move the player forward")
- **Glossary** defining key terms like Raycasting Engine, Game State, and Stitched UI

### 2. Design Phase

The design document (`.kiro/specs/frankenkiro-game/design.md`) was created with Kiro's guidance, including:

- **Architecture diagram** showing the component hierarchy (Next.js App Router → React Components → Game Engine → Game Logic → Data Layer)
- **TypeScript interfaces** for all core types (Player, Enemy, GameItem, LevelMap, etc.)
- **19 Correctness Properties** derived from acceptance criteria for property-based testing
- **Testing strategy** specifying fast-check for property-based tests

### 3. Implementation Tasks

The tasks document (`.kiro/specs/frankenkiro-game/tasks.md`) broke down implementation into:

- **18 major task groups** with sub-tasks
- **Checkpoints** to verify tests pass at key milestones
- **Property-based test tasks** linked to specific correctness properties
- **Requirement references** on each task for traceability

## Key Features Built with Kiro

### Game Engine
- Vector2 math utilities
- DDA raycasting algorithm
- Collision detection with wall sliding
- Game loop with delta time

### Game Logic
- Player movement, rotation, health, ammo
- Enemy AI state machine (idle → pursuing → attacking)
- Item collection system
- Level management and transitions
- Game state serialization/deserialization

### React UI
- GameCanvas with aspect ratio preservation
- StitchedHUD with Halloween theme
- GameMenu for all game states
- TouchControls for mobile

### Testing
- Property-based tests for collision system (Property 2: Wall Collision Invariant)
- Jest + fast-check test framework

## Spec Files Location

```
.kiro/specs/frankenkiro-game/
├── requirements.md   # EARS-formatted requirements
├── design.md         # Architecture and correctness properties
└── tasks.md          # Implementation checklist
```

## Benefits of Using Kiro

1. **Structured Development**: The spec workflow ensured we thought through requirements before coding
2. **Traceability**: Every task links back to specific requirements
3. **Correctness Properties**: Formal properties guided property-based testing
4. **Iterative Refinement**: User review at each phase caught issues early
5. **Documentation**: The spec files serve as living documentation

## Running the Project

```bash
pnpm install
pnpm dev      # Development server
pnpm build    # Production build
pnpm test     # Run tests
pnpm lint     # ESLint check
```
