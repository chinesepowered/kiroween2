/**
 * Raycasting renderer for FrankenKiro
 * Implements DOOM-style pseudo-3D rendering using raycasting algorithm
 * Requirements: 2.1, 2.2
 */

import { Vector2, Ray, RaycastConfig } from './types';
import { LevelMap } from '@/game/types';

/**
 * Default raycasting configuration
 */
export const DEFAULT_RAYCAST_CONFIG: RaycastConfig = {
  screenWidth: 640,
  screenHeight: 480,
  fov: Math.PI / 3, // 60 degrees
  maxRenderDistance: 20,
};

/**
 * Minimum distance threshold to prevent division by zero
 */
const MIN_DISTANCE = 0.0001;

/**
 * Cast a single ray from origin in a given direction
 * Uses DDA (Digital Differential Analysis) algorithm for efficient wall detection
 * Requirements: 2.1
 */
export function castRay(
  origin: Vector2,
  angle: number,
  levelMap: LevelMap,
  maxDistance: number = 20
): Ray {
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);

  // Current map cell
  let mapX = Math.floor(origin.x);
  let mapY = Math.floor(origin.y);

  // Length of ray from one x or y-side to next x or y-side
  const deltaDistX = rayDirX === 0 ? Infinity : Math.abs(1 / rayDirX);
  const deltaDistY = rayDirY === 0 ? Infinity : Math.abs(1 / rayDirY);

  // Direction to step in x or y (+1 or -1)
  const stepX = rayDirX < 0 ? -1 : 1;
  const stepY = rayDirY < 0 ? -1 : 1;

  // Length of ray from current position to next x or y-side
  let sideDistX: number;
  let sideDistY: number;

  if (rayDirX < 0) {
    sideDistX = (origin.x - mapX) * deltaDistX;
  } else {
    sideDistX = (mapX + 1.0 - origin.x) * deltaDistX;
  }

  if (rayDirY < 0) {
    sideDistY = (origin.y - mapY) * deltaDistY;
  } else {
    sideDistY = (mapY + 1.0 - origin.y) * deltaDistY;
  }

  // Perform DDA
  let hit = false;
  let side: 'horizontal' | 'vertical' = 'vertical';
  let distance = 0;

  while (!hit && distance < maxDistance) {
    // Jump to next map square in x or y direction
    if (sideDistX < sideDistY) {
      distance = sideDistX;
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 'vertical';
    } else {
      distance = sideDistY;
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 'horizontal';
    }

    // Check if ray has hit a wall
    if (isWallTile(mapX, mapY, levelMap)) {
      hit = true;
    }
  }

  // Calculate exact wall hit position
  const wallHitX = origin.x + rayDirX * distance;
  const wallHitY = origin.y + rayDirY * distance;

  // Get wall type (0 if no hit)
  const wallType = hit ? getTileValue(mapX, mapY, levelMap) : 0;

  return {
    angle,
    distance: Math.max(distance, MIN_DISTANCE),
    wallHit: { x: wallHitX, y: wallHitY },
    wallType,
    side,
  };
}


/**
 * Cast all rays for a frame from player position
 * Requirements: 2.1
 */
export function castAllRays(
  playerPosition: Vector2,
  playerRotation: number,
  config: RaycastConfig,
  levelMap: LevelMap
): Ray[] {
  const rays: Ray[] = [];

  for (let x = 0; x < config.screenWidth; x++) {
    // Calculate ray angle for this screen column
    // Map screen x to angle offset from player rotation
    const rayAngleOffset = ((x / config.screenWidth) - 0.5) * config.fov;
    const rayAngle = playerRotation + rayAngleOffset;

    const ray = castRay(
      playerPosition,
      rayAngle,
      levelMap,
      config.maxRenderDistance
    );

    rays.push(ray);
  }

  return rays;
}

/**
 * Calculate wall height for a given distance
 * Wall height is inversely proportional to distance
 * Requirements: 2.2
 */
export function calculateWallHeight(
  distance: number,
  screenHeight: number,
  playerRotation: number,
  rayAngle: number
): number {
  // Apply fish-eye correction
  const correctedDistance = distance * Math.cos(rayAngle - playerRotation);
  
  // Prevent division by zero
  const safeDistance = Math.max(correctedDistance, MIN_DISTANCE);
  
  // Wall height is inversely proportional to distance
  return screenHeight / safeDistance;
}

/**
 * Calculate wall height without fish-eye correction (raw)
 * Requirements: 2.2
 */
export function calculateRawWallHeight(
  distance: number,
  screenHeight: number
): number {
  const safeDistance = Math.max(distance, MIN_DISTANCE);
  return screenHeight / safeDistance;
}

/**
 * Check if a tile is a wall (internal helper)
 */
function isWallTile(x: number, y: number, levelMap: LevelMap): boolean {
  // Out of bounds is considered a wall
  if (x < 0 || x >= levelMap.width || y < 0 || y >= levelMap.height) {
    return true;
  }
  return levelMap.grid[y][x] > 0;
}

/**
 * Get tile value at position (internal helper)
 */
function getTileValue(x: number, y: number, levelMap: LevelMap): number {
  if (x < 0 || x >= levelMap.width || y < 0 || y >= levelMap.height) {
    return 1; // Default wall type for out of bounds
  }
  return levelMap.grid[y][x];
}

/**
 * RaycastRenderer class for managing rendering state
 */
export class RaycastRenderer {
  private config: RaycastConfig;

  constructor(config: Partial<RaycastConfig> = {}) {
    this.config = { ...DEFAULT_RAYCAST_CONFIG, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RaycastConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<RaycastConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cast a single ray
   */
  castRay(origin: Vector2, angle: number, levelMap: LevelMap): Ray {
    return castRay(origin, angle, levelMap, this.config.maxRenderDistance);
  }

  /**
   * Cast all rays for current frame
   */
  castAllRays(playerPosition: Vector2, playerRotation: number, levelMap: LevelMap): Ray[] {
    return castAllRays(playerPosition, playerRotation, this.config, levelMap);
  }

  /**
   * Calculate wall height for a ray
   */
  calculateWallHeight(ray: Ray, playerRotation: number): number {
    return calculateWallHeight(
      ray.distance,
      this.config.screenHeight,
      playerRotation,
      ray.angle
    );
  }
}
