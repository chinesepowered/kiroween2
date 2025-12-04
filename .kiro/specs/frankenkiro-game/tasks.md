# Implementation Plan

- [x] 1. Set up Next.js project with game infrastructure






  - [x] 1.1 Initialize Next.js 14+ project with App Router and TypeScript


    - Create Next.js app with `pnpm create next-app`
    - Configure TypeScript strict mode
    - Set up project directory structure (engine/, game/, components/, input/)
    - _Requirements: All_

  - [x] 1.2 Install and configure testing framework


    - Install Jest, @testing-library/react, and fast-check
    - Configure Jest for TypeScript and React components
    - Create test script commands in package.json
    - _Requirements: All_

  - [x] 1.3 Create core type definitions and interfaces

    - Define Vector2 interface and utility functions
    - Define GameState, Player, Enemy, GameItem interfaces
    - Define LevelMap and SaveData interfaces
    - _Requirements: All_

- [-] 2. Implement Vector2 math utilities



  - [x] 2.1 Create Vector2 module with math operations



    - Implement add, subtract, multiply, normalize, distance, dot functions
    - Implement angle calculation and rotation functions
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 2.2 Write property test for Vector2 operations
    - **Property 1: Player Movement Transformation** (vector math foundation)
    - Test that vector operations maintain mathematical properties
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 3. Implement collision detection system








  - [x] 3.1 Create CollisionSystem module


    - Implement wall collision detection using grid-based checking
    - Implement collision resolution to prevent wall penetration
    - Implement entity-to-entity collision detection
    - _Requirements: 1.5_
  - [x]* 3.2 Write property test for wall collision


    - **Property 2: Wall Collision Invariant**
    - Test that resolved positions are never inside walls
    - **Validates: Requirements 1.5**

- [x] 4. Implement player controller





  - [x] 4.1 Create Player module with movement and stats


    - Implement position and rotation state
    - Implement move() and rotate() methods with delta time
    - Implement stats management (health, ammo, score)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 4.2 Write property test for player movement
    - **Property 1: Player Movement Transformation**
    - Test forward/backward movement and rotation transformations
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [x] 4.3 Implement player damage and healing

    - Implement takeDamage() with health clamping
    - Implement heal() with max health cap
    - _Requirements: 4.3, 5.1_
  - [ ]* 4.4 Write property test for damage calculation
    - **Property 5: Damage Calculation Consistency**
    - Test that health never goes negative after damage
    - **Validates: Requirements 3.2, 4.3**
  - [x] 4.5 Implement weapon firing and ammunition


    - Implement fire() method with ammo consumption
    - Implement ammo validation before firing
    - _Requirements: 3.1, 3.4, 3.5_
  - [ ]* 4.6 Write property test for ammunition
    - **Property 6: Ammunition Consumption**
    - Test ammo decrements correctly and firing fails at zero
    - **Validates: Requirements 3.4, 3.5**

- [x] 5. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement raycasting renderer





  - [x] 6.1 Create RaycastRenderer module


    - Implement ray casting algorithm from player position
    - Implement wall distance calculation
    - Implement wall height calculation based on distance
    - _Requirements: 2.1, 2.2_
  - [ ]* 6.2 Write property test for ray distance to wall height
    - **Property 3: Ray Distance to Wall Height**
    - Test inverse proportionality of distance to height
    - **Validates: Requirements 2.2**
  - [ ]* 6.3 Write property test for raycasting coverage
    - **Property 4: Raycasting Coverage**
    - Test that correct number of rays are cast across FOV
    - **Validates: Requirements 2.1**
  - [x] 6.4 Implement wall rendering with procedural textures


    - Create procedural wall texture generation
    - Implement wall slice rendering to canvas
    - Implement floor and ceiling rendering
    - _Requirements: 2.3, 2.5_
  - [x] 6.5 Implement sprite rendering for enemies and items

    - Implement sprite sorting by distance
    - Implement sprite scaling based on distance
    - Implement sprite drawing to canvas
    - _Requirements: 3.3, 5.3_
-

- [x] 7. Implement enemy AI system




  - [x] 7.1 Create Enemy module with state machine


    - Implement enemy state (idle, pursuing, attacking, dead)
    - Implement line-of-sight detection
    - Implement pathfinding toward player
    - _Requirements: 4.1, 4.2_
  - [ ]* 7.2 Write property test for enemy state machine
    - **Property 8: Enemy AI State Machine**
    - Test state transitions based on player distance and visibility
    - **Validates: Requirements 4.1, 4.2**

  - [x] 7.3 Implement enemy attack and defeat

    - Implement attack action when in range
    - Implement defeat state transition when health reaches zero
    - Implement score increment on defeat
    - _Requirements: 4.3, 3.3_
  - [ ]* 7.4 Write property test for enemy defeat
    - **Property 7: Enemy Defeat State Transition**
    - Test that zero health triggers death and score increase
    - **Validates: Requirements 3.3**

  - [x] 7.5 Create EnemyManager for multiple enemies

    - Implement enemy collection management
    - Implement independent enemy updates
    - _Requirements: 4.5_
  - [ ]* 7.6 Write property test for enemy independence
    - **Property 9: Enemy Independence**
    - Test that updating one enemy doesn't affect others
    - **Validates: Requirements 4.5**
-

- [-] 8. Implement item and power-up system



  - [x] 8.1 Create GameItem module


    - Implement item types (health, ammo, key)
    - Implement collection detection
    - Implement item effects on player
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 8.2 Write property test for item collection stats
    - **Property 10: Item Collection Stats Increase**
    - Test health and ammo increase with proper capping
    - **Validates: Requirements 5.1, 5.2**
  - [ ]* 8.3 Write property test for item removal
    - **Property 11: Item Collection Removal**
    - Test that collected items cannot be collected again
    - **Validates: Requirements 5.3**
  - [ ]* 8.4 Write property test for key inventory
    - **Property 12: Key Inventory Addition**
    - Test keys are added to inventory without duplicates
    - **Validates: Requirements 5.4**
-

- [x] 9. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [-] 10. Implement level management



  - [x] 10.1 Create LevelManager module


    - Implement level map data structure
    - Implement level loading and validation
    - Implement tile lookup methods
    - _Requirements: 7.4_
  - [ ]* 10.2 Write property test for level map validity
    - **Property 14: Level Map Structural Validity**
    - Test that loaded maps contain required fields
    - **Validates: Requirements 7.4**

  - [x] 10.3 Implement level transitions

    - Implement exit point detection
    - Implement level loading on exit
    - Implement player position reset with score preservation
    - _Requirements: 7.1, 7.2_
  - [ ]* 10.4 Write property test for level transition
    - **Property 13: Level Transition Score Preservation**
    - Test score persists across level transitions
    - **Validates: Requirements 7.1, 7.2**

  - [x] 10.5 Create initial game levels

    - Design 3 procedurally-themed levels (lab, dungeon, tower)
    - Define enemy spawn points and item placements
    - Define exit points for each level
    - _Requirements: 7.1, 7.4_

- [-] 11. Implement game state serialization



  - [x] 11.1 Create GameStateManager with serialization



    - Implement serialize() method to JSON
    - Implement deserialize() method from JSON
    - Implement state validation
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ]* 11.2 Write property test for serialization round-trip
    - **Property 15: Game State Serialization Round-Trip**
    - Test serialize then deserialize produces equal state
    - **Validates: Requirements 8.1, 8.2, 8.5**
  - [ ]* 11.3 Write property test for serialized completeness
    - **Property 16: Serialized State Completeness**
    - Test all required fields are present in serialized JSON
    - **Validates: Requirements 8.3**
  - [ ]* 11.4 Write property test for validation correctness
    - **Property 17: State Validation Correctness**
    - Test validation correctly identifies valid/invalid JSON
    - **Validates: Requirements 8.4**
-

- [x] 12. Implement input handling





  - [x] 12.1 Create InputHandler module

    - Implement keyboard event listeners
    - Implement action mapping from keys
    - Implement input state tracking
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1_

  - [x] 12.2 Implement touch controls

    - Create on-screen touch control buttons
    - Implement touch event to action mapping
    - _Requirements: 10.1, 10.2_
  - [ ]* 12.3 Write property test for touch input mapping
    - **Property 18: Touch Input Mapping**
    - Test touch inputs map consistently to actions
    - **Validates: Requirements 10.2**

- [x] 13. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 14. Implement React UI components




  - [x] 14.1 Create GameCanvas component


    - Implement canvas ref and context management
    - Implement resize handling with aspect ratio preservation
    - Connect to game loop for rendering
    - _Requirements: 10.3_
  - [ ]* 14.2 Write property test for canvas scaling
    - **Property 19: Canvas Scaling Proportionality**
    - Test aspect ratio is maintained on resize
    - **Validates: Requirements 10.3**

  - [x] 14.3 Create StitchedHUD component

    - Implement health bar with stitched styling
    - Implement ammo counter with mismatched panels
    - Implement score display with seam effects
    - Apply Halloween color palette (green, purple, orange)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 14.4 Create GameMenu component

    - Implement main menu with start game option
    - Implement pause menu with resume/save/quit options
    - Implement game over and victory screens
    - _Requirements: 7.3, 8.1, 8.2_
  - [x] 14.5 Create TouchControls component


    - Implement directional pad for movement
    - Implement fire button
    - Style with stitched theme
    - _Requirements: 10.1, 10.2_

- [x] 15. Implement game loop and orchestration





  - [x] 15.1 Create GameLoop module


    - Implement requestAnimationFrame loop
    - Implement delta time calculation
    - Implement update and render callbacks
    - _Requirements: 2.4, 10.4_

  - [x] 15.2 Create GameContainer component

    - Wire together all game systems
    - Implement game state management with React
    - Handle game status transitions (menu, playing, paused, etc.)
    - _Requirements: All_

- [x] 16. Implement audio system






  - [x] 16.1 Create AudioManager module

    - Implement Web Audio API sound synthesis
    - Create procedural sound effects (fire, hit, pickup, death)
    - Implement ambient background audio
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 17. Create game page and final integration





  - [x] 17.1 Create main game page with App Router


    - Set up page.tsx with GameContainer
    - Configure metadata for SEO
    - Add Halloween-themed favicon and title
    - _Requirements: All_

  - [x] 17.2 Add save/load UI integration

    - Connect save button to GameStateManager.serialize()
    - Connect load button to GameStateManager.deserialize()
    - Implement localStorage persistence
    - _Requirements: 8.1, 8.2_

  - [x] 17.3 Polish and final styling

    - Apply stitched theme consistently across all UI
    - Add screen shake on damage
    - Add weapon sprite animation
    - _Requirements: 6.4_


- [x] 18. Final Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
