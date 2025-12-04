/**
 * Collision detection and resolution system for FrankenKiro
 * Implements grid-based wall collision and entity-to-entity collision
 */

import { Vector2, CollisionResult, RaycastHit } from './types';
import { subtract, normalize, length, multiply, add, vec2 } from './vector2';
import { LevelMap } from '@/game/types';

/**
 * Entity interface for collision detection
 * Any object with position and radius can be checked for collisions
 */
export interface CollisionEntity {
  position: Vector2;
  radius: number;
}

/**
 * Default collision radius for entities
 */
export const DEFAULT_ENTITY_RADIUS = 0.3;

/**
 * Check if a grid cell is a wall in the level map
 * @param x - Grid x coordinate
 * @param y - Grid y coordinate
 * @param level - The level map to check against
 * @returns true if the cell is a wall (non-zero value)
 */
export function isWall(x: number, y: number, level: LevelMap): boolean {
  // Out of bounds is considered a wall
  if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
    return true;
  }
  return level.grid[Math.floor(y)][Math.floor(x)] !== 0;
}

/**
 * Get the tile value at a grid position
 * @param x - Grid x coordinate
 * @param y - Grid y coordinate
 * @param level - The level map
 * @returns The tile value (0 for empty, >0 for wall types)
 */
export function getTile(x: number, y: number, level: LevelMap): number {
  if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
    return 1; // Out of bounds treated as solid wall
  }
  return level.grid[Math.floor(y)][Math.floor(x)];
}


/**
 * Check for wall collision at a given position with a radius
 * Uses grid-based checking to detect if the entity overlaps any wall tiles
 * @param position - The position to check
 * @param radius - The collision radius of the entity
 * @param level - The level map
 * @returns CollisionResult with collision info
 */
export function checkWallCollision(
  position: Vector2,
  radius: number,
  level: LevelMap
): CollisionResult {
  // Check the four corners of the bounding box around the entity
  const minX = Math.floor(position.x - radius);
  const maxX = Math.floor(position.x + radius);
  const minY = Math.floor(position.y - radius);
  const maxY = Math.floor(position.y + radius);

  let collided = false;
  let totalNormal = vec2(0, 0);
  let maxPenetration = 0;

  // Check each potentially overlapping grid cell
  for (let gridY = minY; gridY <= maxY; gridY++) {
    for (let gridX = minX; gridX <= maxX; gridX++) {
      if (isWall(gridX, gridY, level)) {
        // Calculate the closest point on the wall tile to the entity center
        const closestX = Math.max(gridX, Math.min(position.x, gridX + 1));
        const closestY = Math.max(gridY, Math.min(position.y, gridY + 1));
        const closest = vec2(closestX, closestY);

        // Calculate distance from entity center to closest point
        const diff = subtract(position, closest);
        const dist = length(diff);

        // Check if there's an overlap
        if (dist < radius) {
          collided = true;
          const penetration = radius - dist;

          if (penetration > maxPenetration) {
            maxPenetration = penetration;
          }

          // Calculate normal (direction to push entity out)
          if (dist > 0.0001) {
            const normal = normalize(diff);
            totalNormal = add(totalNormal, multiply(normal, penetration));
          } else {
            // Entity center is exactly on the wall edge, push in a default direction
            // Determine which edge we're closest to
            const centerX = gridX + 0.5;
            const centerY = gridY + 0.5;
            const dx = position.x - centerX;
            const dy = position.y - centerY;

            if (Math.abs(dx) > Math.abs(dy)) {
              totalNormal = add(totalNormal, vec2(dx > 0 ? 1 : -1, 0));
            } else {
              totalNormal = add(totalNormal, vec2(0, dy > 0 ? 1 : -1));
            }
          }
        }
      }
    }
  }

  // Normalize the combined normal
  const normalLen = length(totalNormal);
  const finalNormal = normalLen > 0.0001 ? normalize(totalNormal) : vec2(0, 0);

  return {
    collided,
    normal: finalNormal,
    penetration: maxPenetration,
  };
}


/**
 * Resolve a wall collision by moving the entity out of the wall
 * @param position - Current position of the entity
 * @param result - The collision result from checkWallCollision
 * @returns New position that is outside the wall
 */
export function resolveWallCollision(
  position: Vector2,
  result: CollisionResult
): Vector2 {
  if (!result.collided) {
    return position;
  }

  // Push the entity out along the collision normal
  // Add a small epsilon to ensure we're fully outside
  const pushDistance = result.penetration + 0.001;
  return add(position, multiply(result.normal, pushDistance));
}

/**
 * Check collision between two circular entities
 * @param a - First entity
 * @param b - Second entity
 * @returns CollisionResult with collision info
 */
export function checkEntityCollision(
  a: CollisionEntity,
  b: CollisionEntity
): CollisionResult {
  const diff = subtract(a.position, b.position);
  const dist = length(diff);
  const combinedRadius = a.radius + b.radius;

  if (dist >= combinedRadius) {
    return {
      collided: false,
      normal: vec2(0, 0),
      penetration: 0,
    };
  }

  // Calculate collision normal (from b to a)
  let normal: Vector2;
  if (dist > 0.0001) {
    normal = normalize(diff);
  } else {
    // Entities are at the same position, use arbitrary normal
    normal = vec2(1, 0);
  }

  return {
    collided: true,
    normal,
    penetration: combinedRadius - dist,
  };
}

/**
 * Resolve collision between two entities by separating them
 * @param entity - The entity to move
 * @param result - The collision result
 * @returns New position for the entity
 */
export function resolveEntityCollision(
  entity: CollisionEntity,
  result: CollisionResult
): Vector2 {
  if (!result.collided) {
    return entity.position;
  }

  // Push the entity out along the collision normal
  const pushDistance = result.penetration + 0.001;
  return add(entity.position, multiply(result.normal, pushDistance));
}


/**
 * Cast a ray through the level and find the first wall hit
 * Uses DDA (Digital Differential Analysis) algorithm
 * @param origin - Starting position of the ray
 * @param direction - Direction vector of the ray (should be normalized)
 * @param maxDistance - Maximum distance to check
 * @param level - The level map
 * @returns RaycastHit if a wall was hit, null otherwise
 */
export function raycast(
  origin: Vector2,
  direction: Vector2,
  maxDistance: number,
  level: LevelMap
): RaycastHit | null {
  // Normalize direction to be safe
  const dir = normalize(direction);
  
  // Avoid division by zero
  if (Math.abs(dir.x) < 0.0001 && Math.abs(dir.y) < 0.0001) {
    return null;
  }

  // Current grid position
  let mapX = Math.floor(origin.x);
  let mapY = Math.floor(origin.y);

  // Length of ray from one x or y-side to next x or y-side
  const deltaDistX = Math.abs(dir.x) < 0.0001 ? 1e10 : Math.abs(1 / dir.x);
  const deltaDistY = Math.abs(dir.y) < 0.0001 ? 1e10 : Math.abs(1 / dir.y);

  // Direction to step in x and y
  const stepX = dir.x < 0 ? -1 : 1;
  const stepY = dir.y < 0 ? -1 : 1;

  // Length of ray from current position to next x or y-side
  let sideDistX: number;
  let sideDistY: number;

  if (dir.x < 0) {
    sideDistX = (origin.x - mapX) * deltaDistX;
  } else {
    sideDistX = (mapX + 1 - origin.x) * deltaDistX;
  }

  if (dir.y < 0) {
    sideDistY = (origin.y - mapY) * deltaDistY;
  } else {
    sideDistY = (mapY + 1 - origin.y) * deltaDistY;
  }

  // Perform DDA
  let side: 'horizontal' | 'vertical' = 'horizontal';
  let distance = 0;

  while (distance < maxDistance) {
    // Jump to next map square
    if (sideDistX < sideDistY) {
      distance = sideDistX;
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 'vertical'; // Hit a vertical wall (perpendicular to x-axis)
    } else {
      distance = sideDistY;
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 'horizontal'; // Hit a horizontal wall (perpendicular to y-axis)
    }

    // Check if we hit a wall
    if (isWall(mapX, mapY, level)) {
      // Calculate exact hit position
      const hitPosition = add(origin, multiply(dir, distance));

      // Calculate normal based on which side was hit
      let normal: Vector2;
      if (side === 'vertical') {
        normal = vec2(stepX > 0 ? -1 : 1, 0);
      } else {
        normal = vec2(0, stepY > 0 ? -1 : 1);
      }

      return {
        position: hitPosition,
        distance,
        normal,
      };
    }
  }

  return null;
}


/**
 * Move an entity with wall collision detection and resolution
 * This is a convenience function that combines movement with collision handling
 * @param currentPosition - Current position of the entity
 * @param desiredPosition - Where the entity wants to move to
 * @param radius - Collision radius of the entity
 * @param level - The level map
 * @returns The final position after collision resolution
 */
export function moveWithCollision(
  currentPosition: Vector2,
  desiredPosition: Vector2,
  radius: number,
  level: LevelMap
): Vector2 {
  // First, try to move to the desired position
  let newPosition = desiredPosition;

  // Check for wall collision at the new position
  const collision = checkWallCollision(newPosition, radius, level);

  if (collision.collided) {
    // Resolve the collision
    newPosition = resolveWallCollision(newPosition, collision);

    // Double-check that we're not still in a wall
    // This handles corner cases where resolution might push into another wall
    const secondCheck = checkWallCollision(newPosition, radius, level);
    if (secondCheck.collided) {
      // If still colliding, try sliding along the wall
      // First try moving only in X
      const xOnly = vec2(desiredPosition.x, currentPosition.y);
      const xCollision = checkWallCollision(xOnly, radius, level);
      if (!xCollision.collided) {
        return xOnly;
      }

      // Then try moving only in Y
      const yOnly = vec2(currentPosition.x, desiredPosition.y);
      const yCollision = checkWallCollision(yOnly, radius, level);
      if (!yCollision.collided) {
        return yOnly;
      }

      // If all else fails, stay at current position
      return currentPosition;
    }
  }

  return newPosition;
}

/**
 * CollisionSystem class that encapsulates all collision functionality
 * Provides a unified interface for collision detection and resolution
 */
export class CollisionSystem {
  private level: LevelMap;

  constructor(level: LevelMap) {
    this.level = level;
  }

  /**
   * Update the level map (e.g., when loading a new level)
   */
  setLevel(level: LevelMap): void {
    this.level = level;
  }

  /**
   * Check if a position is inside a wall
   */
  isWall(x: number, y: number): boolean {
    return isWall(x, y, this.level);
  }

  /**
   * Get the tile value at a position
   */
  getTile(x: number, y: number): number {
    return getTile(x, y, this.level);
  }

  /**
   * Check for wall collision
   */
  checkWallCollision(position: Vector2, radius: number): CollisionResult {
    return checkWallCollision(position, radius, this.level);
  }

  /**
   * Resolve a wall collision
   */
  resolveCollision(position: Vector2, result: CollisionResult): Vector2 {
    return resolveWallCollision(position, result);
  }

  /**
   * Check collision between two entities
   */
  checkEntityCollision(a: CollisionEntity, b: CollisionEntity): CollisionResult {
    return checkEntityCollision(a, b);
  }

  /**
   * Cast a ray and find wall intersection
   */
  raycast(origin: Vector2, direction: Vector2, maxDistance: number): RaycastHit | null {
    return raycast(origin, direction, maxDistance, this.level);
  }

  /**
   * Move an entity with collision detection
   */
  moveWithCollision(
    currentPosition: Vector2,
    desiredPosition: Vector2,
    radius: number
  ): Vector2 {
    return moveWithCollision(currentPosition, desiredPosition, radius, this.level);
  }
}
