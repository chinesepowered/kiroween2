/**
 * Core engine types for FrankenKiro game
 */

/**
 * 2D vector representation
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Result of a collision check
 */
export interface CollisionResult {
  collided: boolean;
  normal: Vector2;
  penetration: number;
}

/**
 * Ray cast result
 */
export interface Ray {
  angle: number;
  distance: number;
  wallHit: Vector2;
  wallType: number;
  side: 'horizontal' | 'vertical';
}

/**
 * Raycast hit result
 */
export interface RaycastHit {
  position: Vector2;
  distance: number;
  normal: Vector2;
}

/**
 * Configuration for the raycasting renderer
 */
export interface RaycastConfig {
  screenWidth: number;
  screenHeight: number;
  fov: number;
  maxRenderDistance: number;
}
