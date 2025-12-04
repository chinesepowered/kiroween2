/**
 * Level management module for FrankenKiro
 * Handles level map data structure, loading, validation, and tile lookup
 */

import { Vector2 } from '@/engine/types';
import { LevelMap, EnemySpawn, ItemSpawn } from './types';

/**
 * Validation result for level maps
 */
export interface LevelValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Creates an empty level map with default values
 */
export function createEmptyLevelMap(width: number, height: number): LevelMap {
  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(0));
  }
  
  return {
    width,
    height,
    grid,
    playerSpawn: { x: 1.5, y: 1.5 },
    enemySpawns: [],
    items: [],
    exitPoint: { x: width - 1.5, y: height - 1.5 },
  };
}

/**
 * Checks if coordinates are within level bounds
 */
export function isWithinBounds(x: number, y: number, level: LevelMap): boolean {
  return x >= 0 && x < level.width && y >= 0 && y < level.height;
}

/**
 * Gets the tile value at the specified grid coordinates
 * Returns -1 if out of bounds
 */
export function getTile(x: number, y: number, level: LevelMap): number {
  const gridX = Math.floor(x);
  const gridY = Math.floor(y);
  
  if (!isWithinBounds(gridX, gridY, level)) {
    return -1;
  }
  
  return level.grid[gridY][gridX];
}


/**
 * Checks if a tile at the specified coordinates is a wall
 * Wall tiles have values > 0
 */
export function isWall(x: number, y: number, level: LevelMap): boolean {
  const tile = getTile(x, y, level);
  return tile > 0 || tile === -1; // Out of bounds treated as wall
}

/**
 * Checks if a position is within the level bounds (for spawn points)
 */
export function isPositionWithinBounds(position: Vector2, level: LevelMap): boolean {
  return position.x >= 0 && position.x < level.width &&
         position.y >= 0 && position.y < level.height;
}

/**
 * Validates a level map structure
 * Returns validation result with any errors found
 */
export function validateLevelMap(level: unknown): LevelValidationResult {
  const errors: string[] = [];
  
  // Check if level is an object
  if (typeof level !== 'object' || level === null) {
    return { valid: false, errors: ['Level map must be an object'] };
  }
  
  const map = level as Record<string, unknown>;
  
  // Check required fields exist
  if (typeof map.width !== 'number' || map.width <= 0) {
    errors.push('Level map must have a positive width');
  }
  
  if (typeof map.height !== 'number' || map.height <= 0) {
    errors.push('Level map must have a positive height');
  }
  
  // Validate grid
  if (!Array.isArray(map.grid)) {
    errors.push('Level map must have a grid array');
  } else {
    const grid = map.grid as unknown[];
    if (typeof map.height === 'number' && grid.length !== map.height) {
      errors.push(`Grid height (${grid.length}) does not match level height (${map.height})`);
    }
    
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      if (!Array.isArray(row)) {
        errors.push(`Grid row ${y} is not an array`);
      } else if (typeof map.width === 'number' && row.length !== map.width) {
        errors.push(`Grid row ${y} width (${row.length}) does not match level width (${map.width})`);
      }
    }
  }
  
  // Validate playerSpawn
  if (!isValidVector2(map.playerSpawn)) {
    errors.push('Level map must have a valid playerSpawn position');
  } else if (typeof map.width === 'number' && typeof map.height === 'number') {
    const spawn = map.playerSpawn as Vector2;
    if (spawn.x < 0 || spawn.x >= map.width || spawn.y < 0 || spawn.y >= map.height) {
      errors.push('playerSpawn must be within level bounds');
    }
  }
  
  // Validate exitPoint
  if (!isValidVector2(map.exitPoint)) {
    errors.push('Level map must have a valid exitPoint position');
  } else if (typeof map.width === 'number' && typeof map.height === 'number') {
    const exit = map.exitPoint as Vector2;
    if (exit.x < 0 || exit.x >= map.width || exit.y < 0 || exit.y >= map.height) {
      errors.push('exitPoint must be within level bounds');
    }
  }
  
  // Validate enemySpawns array
  if (!Array.isArray(map.enemySpawns)) {
    errors.push('Level map must have an enemySpawns array');
  }
  
  // Validate items array
  if (!Array.isArray(map.items)) {
    errors.push('Level map must have an items array');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to check if a value is a valid Vector2
 */
function isValidVector2(value: unknown): value is Vector2 {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return typeof v.x === 'number' && typeof v.y === 'number';
}

/**
 * Loads and validates a level map from data
 * Throws an error if validation fails
 */
export function loadLevelMap(data: unknown): LevelMap {
  const validation = validateLevelMap(data);
  
  if (!validation.valid) {
    throw new Error(`Invalid level map: ${validation.errors.join(', ')}`);
  }
  
  return data as LevelMap;
}

/**
 * Gets all walkable positions in the level (non-wall tiles)
 */
export function getWalkablePositions(level: LevelMap): Vector2[] {
  const positions: Vector2[] = [];
  
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (!isWall(x, y, level)) {
        positions.push({ x: x + 0.5, y: y + 0.5 }); // Center of tile
      }
    }
  }
  
  return positions;
}

/**
 * Gets the spawn points for enemies in the level
 */
export function getEnemySpawnPoints(level: LevelMap): EnemySpawn[] {
  return [...level.enemySpawns];
}

/**
 * Gets the item spawn points in the level
 */
export function getItemSpawnPoints(level: LevelMap): ItemSpawn[] {
  return [...level.items];
}


/**
 * Distance threshold for detecting exit point collision
 */
export const EXIT_DETECTION_RADIUS = 0.5;

/**
 * Checks if a position is at the level exit point
 */
export function isAtExitPoint(position: Vector2, level: LevelMap): boolean {
  const dx = position.x - level.exitPoint.x;
  const dy = position.y - level.exitPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= EXIT_DETECTION_RADIUS;
}

/**
 * Result of a level transition
 */
export interface LevelTransitionResult {
  newLevel: number;
  playerPosition: Vector2;
  preservedScore: number;
}

/**
 * Performs a level transition, preserving the player's score
 * Returns the new level index and player spawn position
 */
export function performLevelTransition(
  currentLevel: number,
  currentScore: number,
  nextLevelMap: LevelMap
): LevelTransitionResult {
  return {
    newLevel: currentLevel + 1,
    playerPosition: { ...nextLevelMap.playerSpawn },
    preservedScore: currentScore,
  };
}

/**
 * Level manager state
 */
export interface LevelManagerState {
  currentLevel: number;
  levelMap: LevelMap;
  totalLevels: number;
}

/**
 * Creates a new level manager state
 */
export function createLevelManagerState(
  initialLevel: number,
  levelMap: LevelMap,
  totalLevels: number
): LevelManagerState {
  return {
    currentLevel: initialLevel,
    levelMap,
    totalLevels,
  };
}

/**
 * Checks if there are more levels after the current one
 */
export function hasNextLevel(state: LevelManagerState): boolean {
  return state.currentLevel < state.totalLevels - 1;
}

/**
 * Checks if the current level is the final level
 */
export function isFinalLevel(state: LevelManagerState): boolean {
  return state.currentLevel >= state.totalLevels - 1;
}

/**
 * Updates the level manager state with a new level
 */
export function setCurrentLevel(
  state: LevelManagerState,
  levelIndex: number,
  levelMap: LevelMap
): LevelManagerState {
  return {
    ...state,
    currentLevel: levelIndex,
    levelMap,
  };
}
