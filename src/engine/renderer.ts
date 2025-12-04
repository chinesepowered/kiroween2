/**
 * Canvas renderer for FrankenKiro
 * Handles wall, floor, ceiling, and sprite rendering
 * Requirements: 2.3, 2.5, 3.3, 5.3
 */

import { Vector2, Ray, RaycastConfig } from './types';
import { LevelMap, Player, Enemy, GameItem } from '@/game/types';
import { RaycastRenderer, calculateWallHeight } from './raycast';
import { subtract, length } from './vector2';

/**
 * Halloween color palette for the stitched theme
 */
export const COLORS = {
  // Wall colors by type
  walls: [
    '#1a1a2e', // Type 0 - dark blue (shouldn't render)
    '#4a3f35', // Type 1 - dark brown stone
    '#2d4a3f', // Type 2 - dark green moss
    '#4a2d4a', // Type 3 - dark purple
    '#3f3a2d', // Type 4 - dark olive
  ],
  // Lighter versions for vertical walls (side lighting)
  wallsLight: [
    '#2a2a3e',
    '#5a4f45',
    '#3d5a4f',
    '#5a3d5a',
    '#4f4a3d',
  ],
  // Floor gradient colors
  floorNear: '#1a0a0a',
  floorFar: '#0a0505',
  // Ceiling gradient colors
  ceilingNear: '#0a0a1a',
  ceilingFar: '#050510',
  // Fog color for distance fade
  fog: '#0a0a0f',
};

/**
 * Sprite data for rendering
 */
export interface Sprite {
  position: Vector2;
  spriteId: string;
  scale: number;
}

/**
 * Generate procedural wall texture pattern
 * Creates a brick/stone pattern based on wall type
 */
export function generateWallPattern(
  wallType: number,
  wallX: number,
  wallY: number,
  side: 'horizontal' | 'vertical'
): string {
  const baseColor = side === 'vertical' 
    ? COLORS.wallsLight[wallType % COLORS.wallsLight.length]
    : COLORS.walls[wallType % COLORS.walls.length];
  
  // Add subtle variation based on position
  const variation = ((Math.floor(wallX * 4) + Math.floor(wallY * 4)) % 3) * 5;
  
  return adjustBrightness(baseColor, variation - 5);
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}


/**
 * Apply fog effect based on distance
 */
function applyFog(color: string, distance: number, maxDistance: number): string {
  const fogAmount = Math.min(1, distance / maxDistance);
  return blendColors(color, COLORS.fog, fogAmount * 0.7);
}

/**
 * Blend two colors
 */
function blendColors(color1: string, color2: string, amount: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  
  const r1 = c1 >> 16, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = c2 >> 16, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
  
  const r = Math.round(r1 + (r2 - r1) * amount);
  const g = Math.round(g1 + (g2 - g1) * amount);
  const b = Math.round(b1 + (b2 - b1) * amount);
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Render floor and ceiling
 * Requirements: 2.5
 */
export function renderFloorAndCeiling(
  ctx: CanvasRenderingContext2D,
  screenWidth: number,
  screenHeight: number
): void {
  const halfHeight = screenHeight / 2;
  
  // Render ceiling with gradient
  const ceilingGradient = ctx.createLinearGradient(0, 0, 0, halfHeight);
  ceilingGradient.addColorStop(0, COLORS.ceilingFar);
  ceilingGradient.addColorStop(1, COLORS.ceilingNear);
  ctx.fillStyle = ceilingGradient;
  ctx.fillRect(0, 0, screenWidth, halfHeight);
  
  // Render floor with gradient
  const floorGradient = ctx.createLinearGradient(0, halfHeight, 0, screenHeight);
  floorGradient.addColorStop(0, COLORS.floorNear);
  floorGradient.addColorStop(1, COLORS.floorFar);
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, halfHeight, screenWidth, halfHeight);
}

/**
 * Render a single wall slice
 * Requirements: 2.3
 */
export function renderWallSlice(
  ctx: CanvasRenderingContext2D,
  ray: Ray,
  screenX: number,
  wallHeight: number,
  screenHeight: number,
  maxDistance: number
): void {
  const halfHeight = screenHeight / 2;
  
  // Calculate wall slice position
  const wallTop = halfHeight - wallHeight / 2;
  const wallBottom = halfHeight + wallHeight / 2;
  
  // Generate wall color with procedural pattern
  let wallColor = generateWallPattern(
    ray.wallType,
    ray.wallHit.x,
    ray.wallHit.y,
    ray.side
  );
  
  // Apply distance fog
  wallColor = applyFog(wallColor, ray.distance, maxDistance);
  
  // Draw wall slice
  ctx.fillStyle = wallColor;
  ctx.fillRect(screenX, wallTop, 1, wallHeight);
  
  // Add subtle edge highlight for depth
  if (ray.side === 'vertical') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(screenX, wallTop, 1, wallHeight);
  }
}

/**
 * Render all walls from ray data
 */
export function renderWalls(
  ctx: CanvasRenderingContext2D,
  rays: Ray[],
  playerRotation: number,
  config: RaycastConfig
): void {
  for (let x = 0; x < rays.length; x++) {
    const ray = rays[x];
    
    if (ray.wallType > 0) {
      const wallHeight = calculateWallHeight(
        ray.distance,
        config.screenHeight,
        playerRotation,
        ray.angle
      );
      
      renderWallSlice(
        ctx,
        ray,
        x,
        wallHeight,
        config.screenHeight,
        config.maxRenderDistance
      );
    }
  }
}


/**
 * Sprite rendering data with calculated distance
 */
interface SpriteRenderData {
  sprite: Sprite;
  distance: number;
  screenX: number;
  scale: number;
}

/**
 * Calculate sprite screen position and scale
 */
function calculateSpriteRenderData(
  sprite: Sprite,
  playerPosition: Vector2,
  playerRotation: number,
  config: RaycastConfig
): SpriteRenderData | null {
  // Calculate relative position to player
  const dx = sprite.position.x - playerPosition.x;
  const dy = sprite.position.y - playerPosition.y;
  
  // Transform sprite position to camera space
  const cos = Math.cos(-playerRotation);
  const sin = Math.sin(-playerRotation);
  
  const transformX = dx * cos - dy * sin;
  const transformY = dx * sin + dy * cos;
  
  // Sprite is behind player
  if (transformY <= 0.1) {
    return null;
  }
  
  // Calculate screen X position
  const screenX = (config.screenWidth / 2) * (1 + transformX / transformY);
  
  // Check if sprite is within screen bounds (with margin)
  const spriteWidth = (config.screenHeight / transformY) * sprite.scale;
  if (screenX < -spriteWidth || screenX > config.screenWidth + spriteWidth) {
    return null;
  }
  
  return {
    sprite,
    distance: transformY,
    screenX,
    scale: config.screenHeight / transformY * sprite.scale,
  };
}

/**
 * Sort sprites by distance (farthest first for proper rendering order)
 * Requirements: 3.3, 5.3
 */
export function sortSpritesByDistance(
  sprites: Sprite[],
  playerPosition: Vector2
): Sprite[] {
  return [...sprites].sort((a, b) => {
    const distA = length(subtract(a.position, playerPosition));
    const distB = length(subtract(b.position, playerPosition));
    return distB - distA; // Farthest first
  });
}

/**
 * Get sprite color based on sprite ID
 */
function getSpriteColor(spriteId: string): string {
  // Halloween-themed sprite colors
  const spriteColors: Record<string, string> = {
    enemy_zombie: '#4a8f4a',    // Green zombie
    enemy_ghost: '#8f8faf',     // Pale ghost
    enemy_skeleton: '#cfcfaf',  // Bone white
    item_health: '#ff4444',     // Red health
    item_ammo: '#ffaa44',       // Orange ammo
    item_key: '#ffff44',        // Yellow key
    default: '#ff00ff',         // Magenta for unknown
  };
  
  return spriteColors[spriteId] || spriteColors.default;
}

/**
 * Render a single sprite
 * Requirements: 3.3, 5.3
 */
export function renderSprite(
  ctx: CanvasRenderingContext2D,
  renderData: SpriteRenderData,
  rays: Ray[],
  config: RaycastConfig
): void {
  const { screenX, scale, sprite, distance } = renderData;
  
  const spriteWidth = scale;
  const spriteHeight = scale;
  
  const drawStartX = Math.floor(screenX - spriteWidth / 2);
  const drawEndX = Math.floor(screenX + spriteWidth / 2);
  
  const halfHeight = config.screenHeight / 2;
  const drawStartY = Math.floor(halfHeight - spriteHeight / 2);
  
  // Get sprite color
  let color = getSpriteColor(sprite.spriteId);
  
  // Apply distance fog
  color = applyFog(color, distance, config.maxRenderDistance);
  
  // Draw sprite column by column (for depth testing against walls)
  for (let x = drawStartX; x < drawEndX; x++) {
    if (x < 0 || x >= config.screenWidth) continue;
    
    // Check if this column is behind a wall
    const rayIndex = Math.floor(x);
    if (rayIndex >= 0 && rayIndex < rays.length) {
      if (rays[rayIndex].distance < distance) {
        continue; // Wall is in front of sprite
      }
    }
    
    // Draw sprite column
    ctx.fillStyle = color;
    ctx.fillRect(x, drawStartY, 1, spriteHeight);
    
    // Add simple shading for depth
    const edgeFade = Math.abs((x - screenX) / (spriteWidth / 2));
    if (edgeFade > 0.7) {
      ctx.fillStyle = `rgba(0, 0, 0, ${(edgeFade - 0.7) * 0.5})`;
      ctx.fillRect(x, drawStartY, 1, spriteHeight);
    }
  }
}

/**
 * Render all sprites
 * Requirements: 3.3, 5.3
 */
export function renderSprites(
  ctx: CanvasRenderingContext2D,
  sprites: Sprite[],
  rays: Ray[],
  playerPosition: Vector2,
  playerRotation: number,
  config: RaycastConfig
): void {
  // Sort sprites by distance (farthest first)
  const sortedSprites = sortSpritesByDistance(sprites, playerPosition);
  
  // Calculate render data and filter out invisible sprites
  const renderDataList: SpriteRenderData[] = [];
  
  for (const sprite of sortedSprites) {
    const renderData = calculateSpriteRenderData(
      sprite,
      playerPosition,
      playerRotation,
      config
    );
    
    if (renderData) {
      renderDataList.push(renderData);
    }
  }
  
  // Render sprites (farthest first for proper overlap)
  for (const renderData of renderDataList) {
    renderSprite(ctx, renderData, rays, config);
  }
}


/**
 * Convert enemies to sprites for rendering
 */
export function enemiesToSprites(enemies: Enemy[]): Sprite[] {
  return enemies
    .filter(e => e.state !== 'dead')
    .map(enemy => ({
      position: enemy.position,
      spriteId: enemy.spriteId,
      scale: 1.0,
    }));
}

/**
 * Convert game items to sprites for rendering
 */
export function itemsToSprites(items: GameItem[]): Sprite[] {
  return items
    .filter(item => !item.collected)
    .map(item => ({
      position: item.position,
      spriteId: `item_${item.type}`,
      scale: 0.5,
    }));
}

/**
 * Main render function - renders complete frame
 */
export function render(
  ctx: CanvasRenderingContext2D,
  player: Player,
  levelMap: LevelMap,
  enemies: Enemy[],
  items: GameItem[],
  raycastRenderer: RaycastRenderer
): void {
  const config = raycastRenderer.getConfig();
  
  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, config.screenWidth, config.screenHeight);
  
  // Render floor and ceiling
  renderFloorAndCeiling(ctx, config.screenWidth, config.screenHeight);
  
  // Cast all rays
  const rays = raycastRenderer.castAllRays(
    player.position,
    player.rotation,
    levelMap
  );
  
  // Render walls
  renderWalls(ctx, rays, player.rotation, config);
  
  // Collect all sprites
  const sprites: Sprite[] = [
    ...enemiesToSprites(enemies),
    ...itemsToSprites(items),
  ];
  
  // Render sprites
  renderSprites(
    ctx,
    sprites,
    rays,
    player.position,
    player.rotation,
    config
  );
}

/**
 * GameRenderer class for managing rendering state
 */
export class GameRenderer {
  private raycastRenderer: RaycastRenderer;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(config: Partial<RaycastConfig> = {}) {
    this.raycastRenderer = new RaycastRenderer(config);
  }

  /**
   * Set the canvas context
   */
  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  /**
   * Get the raycast renderer
   */
  getRaycastRenderer(): RaycastRenderer {
    return this.raycastRenderer;
  }

  /**
   * Update renderer configuration
   */
  setConfig(config: Partial<RaycastConfig>): void {
    this.raycastRenderer.setConfig(config);
  }

  /**
   * Render a complete frame
   */
  render(
    player: Player,
    levelMap: LevelMap,
    enemies: Enemy[] = [],
    items: GameItem[] = []
  ): void {
    if (!this.ctx) {
      console.warn('GameRenderer: No canvas context set');
      return;
    }

    render(
      this.ctx,
      player,
      levelMap,
      enemies,
      items,
      this.raycastRenderer
    );
  }
}
