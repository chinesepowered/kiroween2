/**
 * Property-based tests for collision detection system
 * 
 * **Feature: frankenkiro-game, Property 2: Wall Collision Invariant**
 * 
 * Tests that resolved positions are never inside walls.
 * For any player position and movement toward a wall, the resulting position
 * after collision resolution should never be inside a wall tile.
 * 
 * **Validates: Requirements 1.5**
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
  checkWallCollision,
  resolveWallCollision,
  moveWithCollision,
  isWall,
  DEFAULT_ENTITY_RADIUS,
} from '../collision';
import { vec2 } from '../vector2';
import { LevelMap } from '@/game/types';
import { Vector2 } from '../types';

/**
 * Generate a valid level map with walls and open spaces
 * The map has a border of walls and some internal walls
 */
function generateLevelMap(width: number, height: number, wallDensity: number): LevelMap {
  const grid: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      // Border walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(1);
      } else {
        // Internal cells - some walls based on density
        row.push(Math.random() < wallDensity ? 1 : 0);
      }
    }
    grid.push(row);
  }
  
  // Ensure spawn point is clear
  const spawnX = Math.floor(width / 2);
  const spawnY = Math.floor(height / 2);
  grid[spawnY][spawnX] = 0;
  
  return {
    width,
    height,
    grid,
    playerSpawn: vec2(spawnX + 0.5, spawnY + 0.5),
    enemySpawns: [],
    items: [],
    exitPoint: vec2(width - 2 + 0.5, height - 2 + 0.5),
  };
}

/**
 * Arbitrary for generating level maps
 */
const levelMapArb = fc.record({
  width: fc.integer({ min: 5, max: 20 }),
  height: fc.integer({ min: 5, max: 20 }),
  wallDensity: fc.double({ min: 0.1, max: 0.4 }),
}).map(({ width, height, wallDensity }) => generateLevelMap(width, height, wallDensity));

/**
 * Generate a position within the level bounds
 */
const positionInLevelArb = (level: LevelMap) => fc.record({
  x: fc.double({ min: 0.5, max: level.width - 0.5, noNaN: true }),
  y: fc.double({ min: 0.5, max: level.height - 0.5, noNaN: true }),
});

/**
 * Generate a movement delta
 */
const movementDeltaArb = fc.record({
  x: fc.double({ min: -2, max: 2, noNaN: true }),
  y: fc.double({ min: -2, max: 2, noNaN: true }),
});

/**
 * Check if a circular entity at position with radius overlaps any wall
 */
function entityOverlapsWall(position: Vector2, radius: number, level: LevelMap): boolean {
  const minX = Math.floor(position.x - radius);
  const maxX = Math.floor(position.x + radius);
  const minY = Math.floor(position.y - radius);
  const maxY = Math.floor(position.y + radius);
  
  for (let gridY = minY; gridY <= maxY; gridY++) {
    for (let gridX = minX; gridX <= maxX; gridX++) {
      if (isWall(gridX, gridY, level)) {
        // Check if the entity circle actually overlaps this wall tile
        const closestX = Math.max(gridX, Math.min(position.x, gridX + 1));
        const closestY = Math.max(gridY, Math.min(position.y, gridY + 1));
        
        const dx = position.x - closestX;
        const dy = position.y - closestY;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < radius * radius) {
          return true;
        }
      }
    }
  }
  return false;
}

describe('Collision System Property Tests', () => {
  /**
   * **Feature: frankenkiro-game, Property 2: Wall Collision Invariant**
   * 
   * For any player position and movement toward a wall, the resulting position
   * after collision resolution should never be inside a wall tile.
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 2: resolved positions are never inside walls after collision resolution', () => {
    fc.assert(
      fc.property(
        levelMapArb,
        fc.double({ min: 0.1, max: 0.4, noNaN: true }), // radius
        (level, radius) => {
          // Find a valid starting position (not in a wall)
          let startPos: Vector2 | null = null;
          for (let y = 1; y < level.height - 1 && !startPos; y++) {
            for (let x = 1; x < level.width - 1 && !startPos; x++) {
              if (!isWall(x, y, level)) {
                startPos = vec2(x + 0.5, y + 0.5);
              }
            }
          }
          
          if (!startPos) {
            // No valid position found, skip this test case
            return true;
          }
          
          // Generate a random movement delta
          const delta = fc.sample(movementDeltaArb, 1)[0];
          const desiredPos = vec2(startPos.x + delta.x, startPos.y + delta.y);
          
          // Use the full collision workflow (moveWithCollision)
          // This is what the game actually uses for player movement
          const finalPos = moveWithCollision(startPos, desiredPos, radius, level);
          
          // The final position's center should never be inside a wall
          // Per Property 2: isWall(floor(newPosition.x), floor(newPosition.y)) === false
          const centerInWall = isWall(Math.floor(finalPos.x), Math.floor(finalPos.y), level);
          
          return !centerInWall;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: frankenkiro-game, Property 2: Wall Collision Invariant**
   * 
   * Tests that moveWithCollision always produces valid positions.
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 2: moveWithCollision never places entity center inside a wall', () => {
    fc.assert(
      fc.property(
        levelMapArb,
        (level) => {
          const radius = DEFAULT_ENTITY_RADIUS;
          
          // Find a valid starting position (not in a wall)
          let startPos: Vector2 | null = null;
          for (let y = 1; y < level.height - 1 && !startPos; y++) {
            for (let x = 1; x < level.width - 1 && !startPos; x++) {
              if (!isWall(x, y, level)) {
                startPos = vec2(x + 0.5, y + 0.5);
              }
            }
          }
          
          if (!startPos) {
            // No valid position found, skip this test case
            return true;
          }
          
          // Generate random movement attempts
          for (let i = 0; i < 10; i++) {
            const delta = fc.sample(movementDeltaArb, 1)[0];
            const desiredPos = vec2(startPos.x + delta.x, startPos.y + delta.y);
            
            const finalPos = moveWithCollision(startPos, desiredPos, radius, level);
            
            // The final position's center should never be inside a wall
            const centerInWall = isWall(Math.floor(finalPos.x), Math.floor(finalPos.y), level);
            if (centerInWall) {
              return false;
            }
            
            // Update start position for next iteration (simulating continuous movement)
            startPos = finalPos;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: frankenkiro-game, Property 2: Wall Collision Invariant**
   * 
   * Tests that collision detection correctly identifies wall overlaps.
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 2: collision detection reports collision when entity overlaps wall', () => {
    fc.assert(
      fc.property(
        levelMapArb,
        fc.double({ min: 0.1, max: 0.4, noNaN: true }),
        (level, radius) => {
          // Generate a position
          const posX = fc.sample(fc.double({ min: 0.5, max: level.width - 0.5, noNaN: true }), 1)[0];
          const posY = fc.sample(fc.double({ min: 0.5, max: level.height - 0.5, noNaN: true }), 1)[0];
          const position = vec2(posX, posY);
          
          const collision = checkWallCollision(position, radius, level);
          const actuallyOverlaps = entityOverlapsWall(position, radius, level);
          
          // If entity actually overlaps a wall, collision should be detected
          if (actuallyOverlaps && !collision.collided) {
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
