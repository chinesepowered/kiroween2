/**
 * Canvas renderer for FrankenKiro
 * Handles wall, floor, ceiling, and sprite rendering with enhanced graphics
 * Requirements: 2.3, 2.5, 3.3, 5.3
 */

import { Vector2, Ray, RaycastConfig } from './types';
import { LevelMap, Player, Enemy, GameItem } from '@/game/types';
import { RaycastRenderer, calculateWallHeight } from './raycast';
import { subtract, length } from './vector2';

/**
 * Enhanced Halloween color palette with richer colors
 */
export const COLORS = {
  // Wall colors by type - more vibrant and varied
  walls: [
    '#1a1a2e', // Type 0 - dark blue (shouldn't render)
    '#5c4033', // Type 1 - rich brown stone
    '#2d5a4f', // Type 2 - mossy green
    '#5a2d5a', // Type 3 - haunted purple
    '#4a4530', // Type 4 - aged olive
  ],
  // Lighter versions for vertical walls (side lighting)
  wallsLight: [
    '#2a2a3e',
    '#7a6053',
    '#4d7a6f',
    '#7a4d7a',
    '#6a6550',
  ],
  // Darker versions for shadows
  wallsDark: [
    '#0a0a1e',
    '#3c2013',
    '#1d3a2f',
    '#3a1d3a',
    '#2a2510',
  ],
  // Floor colors
  floorNear: '#2a1515',
  floorMid: '#1a0a0a',
  floorFar: '#0a0505',
  // Ceiling colors
  ceilingNear: '#151525',
  ceilingMid: '#0a0a1a',
  ceilingFar: '#050510',
  // Fog and atmosphere
  fog: '#0a0812',
  fogTint: '#1a0820',
  // Accent colors for effects
  torchOrange: '#ff6622',
  torchYellow: '#ffaa44',
  bloodRed: '#aa0000',
  ghostBlue: '#4488ff',
  slimeGreen: '#44ff44',
};

/**
 * Procedural texture generation for walls
 */
const TEXTURE_SIZE = 64;
const wallTextures: Map<number, ImageData> = new Map();
let texturesGenerated = false;

/**
 * Generate procedural wall textures
 */
function generateWallTextures(ctx: CanvasRenderingContext2D): void {
  if (texturesGenerated) return;
  
  for (let type = 1; type <= 4; type++) {
    const imageData = ctx.createImageData(TEXTURE_SIZE, TEXTURE_SIZE);
    const data = imageData.data;
    
    const baseColor = hexToRgb(COLORS.walls[type]);
    const lightColor = hexToRgb(COLORS.wallsLight[type]);
    const darkColor = hexToRgb(COLORS.wallsDark[type]);
    
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const idx = (y * TEXTURE_SIZE + x) * 4;
        
        // Create brick/stone pattern
        const brickHeight = 8;
        const brickWidth = 16;
        const mortarSize = 1;
        
        const row = Math.floor(y / brickHeight);
        const offset = (row % 2) * (brickWidth / 2);
        const brickX = (x + offset) % brickWidth;
        const brickY = y % brickHeight;
        
        // Check if we're on mortar
        const isMortar = brickX < mortarSize || brickY < mortarSize;
        
        // Add noise for texture
        const noise = (Math.sin(x * 0.5) * Math.cos(y * 0.7) + 1) * 0.5;
        const noise2 = (Math.sin(x * 1.3 + y * 0.9) + 1) * 0.25;
        
        let r, g, b;
        
        if (isMortar) {
          // Mortar is darker
          r = darkColor.r * 0.7;
          g = darkColor.g * 0.7;
          b = darkColor.b * 0.7;
        } else {
          // Brick with variation
          const variation = 0.8 + noise * 0.4 + noise2 * 0.2;
          r = baseColor.r * variation;
          g = baseColor.g * variation;
          b = baseColor.b * variation;
          
          // Add subtle cracks
          if (Math.random() < 0.02) {
            r *= 0.6;
            g *= 0.6;
            b *= 0.6;
          }
        }
        
        // Add vertical gradient for depth
        const vGradient = 1 - (y / TEXTURE_SIZE) * 0.2;
        
        data[idx] = Math.min(255, Math.max(0, r * vGradient));
        data[idx + 1] = Math.min(255, Math.max(0, g * vGradient));
        data[idx + 2] = Math.min(255, Math.max(0, b * vGradient));
        data[idx + 3] = 255;
      }
    }
    
    wallTextures.set(type, imageData);
  }
  
  texturesGenerated = true;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const num = parseInt(hex.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Lighting state for dynamic effects
 */
let lightFlicker = 1.0;
let flickerTime = 0;

/**
 * Update lighting effects
 */
export function updateLighting(deltaTime: number): void {
  flickerTime += deltaTime * 8;
  // Torch flicker effect
  lightFlicker = 0.85 + Math.sin(flickerTime) * 0.08 + Math.sin(flickerTime * 2.3) * 0.05 + Math.random() * 0.02;
}

/**
 * Sprite data for rendering
 */
export interface Sprite {
  position: Vector2;
  spriteId: string;
  scale: number;
}

/**
 * Sample texture at given UV coordinates
 */
function sampleTexture(
  texture: ImageData,
  u: number,
  v: number
): { r: number; g: number; b: number } {
  const texX = Math.floor(u * TEXTURE_SIZE) % TEXTURE_SIZE;
  const texY = Math.floor(v * TEXTURE_SIZE) % TEXTURE_SIZE;
  const idx = (texY * TEXTURE_SIZE + texX) * 4;
  
  return {
    r: texture.data[idx],
    g: texture.data[idx + 1],
    b: texture.data[idx + 2],
  };
}

/**
 * Generate procedural wall texture pattern with enhanced detail
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
  
  // Enhanced brick pattern
  const brickHeight = 0.125;
  const brickWidth = 0.25;
  const mortarSize = 0.02;
  
  const row = Math.floor(wallY / brickHeight);
  const offset = (row % 2) * (brickWidth / 2);
  const brickX = ((wallX + offset) % brickWidth) / brickWidth;
  const brickY = (wallY % brickHeight) / brickHeight;
  
  // Check if on mortar
  const isMortar = brickX < mortarSize * 4 || brickY < mortarSize * 8;
  
  // Procedural noise for texture
  const noise = Math.sin(wallX * 20) * Math.cos(wallY * 25) * 0.15;
  const noise2 = Math.sin(wallX * 47 + wallY * 31) * 0.1;
  
  let variation = isMortar ? -30 : (noise + noise2) * 40;
  
  // Side lighting difference
  if (side === 'vertical') {
    variation += 15;
  }
  
  return adjustBrightness(baseColor, variation);
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
 * Apply enhanced fog effect with color tinting
 */
function applyFog(color: string, distance: number, maxDistance: number): string {
  const fogAmount = Math.min(1, (distance / maxDistance) ** 1.5);
  // Blend towards purple-tinted fog for spooky atmosphere
  const foggedColor = blendColors(color, COLORS.fog, fogAmount * 0.8);
  return blendColors(foggedColor, COLORS.fogTint, fogAmount * 0.3);
}

/**
 * Apply distance-based lighting with flicker
 */
function applyLighting(color: string, distance: number, maxDistance: number): string {
  // Inverse square falloff for realistic lighting
  const lightIntensity = Math.max(0.15, 1 - (distance / maxDistance) ** 1.2) * lightFlicker;
  
  const rgb = hexToRgb(color);
  const r = Math.min(255, rgb.r * lightIntensity);
  const g = Math.min(255, rgb.g * lightIntensity);
  const b = Math.min(255, rgb.b * lightIntensity);
  
  return `#${((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).padStart(6, '0')}`;
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
 * Render enhanced floor and ceiling with perspective and texture
 * Requirements: 2.5
 */
export function renderFloorAndCeiling(
  ctx: CanvasRenderingContext2D,
  screenWidth: number,
  screenHeight: number,
  playerPosition?: Vector2,
  playerRotation?: number
): void {
  const halfHeight = screenHeight / 2;
  
  // Create image data for pixel-level rendering
  const imageData = ctx.getImageData(0, 0, screenWidth, screenHeight);
  const data = imageData.data;
  
  const floorNear = hexToRgb(COLORS.floorNear);
  const floorMid = hexToRgb(COLORS.floorMid);
  const floorFar = hexToRgb(COLORS.floorFar);
  const ceilingNear = hexToRgb(COLORS.ceilingNear);
  const ceilingMid = hexToRgb(COLORS.ceilingMid);
  const ceilingFar = hexToRgb(COLORS.ceilingFar);
  const fogColor = hexToRgb(COLORS.fog);
  
  const cosAngle = playerRotation !== undefined ? Math.cos(playerRotation) : 1;
  const sinAngle = playerRotation !== undefined ? Math.sin(playerRotation) : 0;
  const posX = playerPosition?.x ?? 0;
  const posY = playerPosition?.y ?? 0;
  
  // Render floor and ceiling with perspective-correct texturing
  for (let y = 0; y < screenHeight; y++) {
    const isFloor = y > halfHeight;
    const rowDistance = isFloor 
      ? halfHeight / (y - halfHeight + 0.1)
      : halfHeight / (halfHeight - y + 0.1);
    
    // Fog based on distance
    const fogAmount = Math.min(1, (rowDistance / 15) ** 1.3);
    const lightAmount = Math.max(0.1, 1 - fogAmount * 0.9) * lightFlicker;
    
    for (let x = 0; x < screenWidth; x++) {
      const idx = (y * screenWidth + x) * 4;
      
      // Calculate world position for this pixel
      const cameraX = (2 * x / screenWidth - 1);
      const floorStepX = rowDistance * (cosAngle + cameraX * -sinAngle * 0.66);
      const floorStepY = rowDistance * (sinAngle + cameraX * cosAngle * 0.66);
      
      const floorX = posX + floorStepX;
      const floorY = posY + floorStepY;
      
      // Checkerboard pattern with noise
      const tileX = Math.floor(floorX * 2);
      const tileY = Math.floor(floorY * 2);
      const checker = ((tileX + tileY) % 2) === 0;
      
      // Add procedural detail
      const noise = Math.sin(floorX * 10) * Math.cos(floorY * 10) * 0.1;
      const detail = checker ? 0.15 + noise : -0.1 + noise;
      
      let r, g, b;
      
      if (isFloor) {
        // Floor gradient based on distance
        const t = Math.min(1, rowDistance / 10);
        if (t < 0.5) {
          const t2 = t * 2;
          r = floorNear.r + (floorMid.r - floorNear.r) * t2;
          g = floorNear.g + (floorMid.g - floorNear.g) * t2;
          b = floorNear.b + (floorMid.b - floorNear.b) * t2;
        } else {
          const t2 = (t - 0.5) * 2;
          r = floorMid.r + (floorFar.r - floorMid.r) * t2;
          g = floorMid.g + (floorFar.g - floorMid.g) * t2;
          b = floorMid.b + (floorFar.b - floorMid.b) * t2;
        }
        // Add blood stain hints
        r += detail * 30 + (checker ? 8 : 0);
        g += detail * 10;
        b += detail * 10;
      } else {
        // Ceiling gradient
        const t = Math.min(1, rowDistance / 10);
        if (t < 0.5) {
          const t2 = t * 2;
          r = ceilingNear.r + (ceilingMid.r - ceilingNear.r) * t2;
          g = ceilingNear.g + (ceilingMid.g - ceilingNear.g) * t2;
          b = ceilingNear.b + (ceilingMid.b - ceilingNear.b) * t2;
        } else {
          const t2 = (t - 0.5) * 2;
          r = ceilingMid.r + (ceilingFar.r - ceilingMid.r) * t2;
          g = ceilingMid.g + (ceilingFar.g - ceilingMid.g) * t2;
          b = ceilingMid.b + (ceilingFar.b - ceilingMid.b) * t2;
        }
        // Add cobweb hints
        r += detail * 15;
        g += detail * 15;
        b += detail * 25 + (checker ? 5 : 0);
      }
      
      // Apply lighting
      r *= lightAmount;
      g *= lightAmount;
      b *= lightAmount;
      
      // Apply fog
      r = r + (fogColor.r - r) * fogAmount;
      g = g + (fogColor.g - g) * fogAmount;
      b = b + (fogColor.b - b) * fogAmount;
      
      data[idx] = Math.min(255, Math.max(0, r));
      data[idx + 1] = Math.min(255, Math.max(0, g));
      data[idx + 2] = Math.min(255, Math.max(0, b));
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Render a single wall slice with enhanced texturing and lighting
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
  const wallTop = Math.max(0, halfHeight - wallHeight / 2);
  const wallBottom = Math.min(screenHeight, halfHeight + wallHeight / 2);
  const actualHeight = wallBottom - wallTop;
  
  if (actualHeight <= 0) return;
  
  // Calculate texture U coordinate based on wall hit position
  const texU = ray.side === 'vertical' 
    ? ray.wallHit.y % 1 
    : ray.wallHit.x % 1;
  
  // Get base colors
  const baseColor = ray.side === 'vertical' 
    ? COLORS.wallsLight[ray.wallType % COLORS.wallsLight.length]
    : COLORS.walls[ray.wallType % COLORS.walls.length];
  const darkColor = COLORS.wallsDark[ray.wallType % COLORS.wallsDark.length];
  
  // Draw wall slice with vertical texture detail
  const baseRgb = hexToRgb(baseColor);
  const darkRgb = hexToRgb(darkColor);
  const fogRgb = hexToRgb(COLORS.fog);
  
  // Calculate lighting and fog
  const fogAmount = Math.min(1, (ray.distance / maxDistance) ** 1.5);
  const lightIntensity = Math.max(0.15, 1 - (ray.distance / maxDistance) ** 1.2) * lightFlicker;
  
  // Draw textured wall column
  for (let y = wallTop; y < wallBottom; y++) {
    // Calculate texture V coordinate
    const texV = (y - (halfHeight - wallHeight / 2)) / wallHeight;
    
    // Brick pattern
    const brickHeight = 0.125;
    const brickWidth = 0.25;
    const row = Math.floor(texV / brickHeight);
    const offset = (row % 2) * (brickWidth / 2);
    const brickX = ((texU + offset) % brickWidth) / brickWidth;
    const brickY = (texV % brickHeight) / brickHeight;
    
    // Mortar detection
    const isMortar = brickX < 0.08 || brickY < 0.12;
    
    // Procedural noise
    const noise = Math.sin(texU * 47 + texV * 31) * 0.15;
    const noise2 = Math.cos(texU * 23 - texV * 17) * 0.1;
    
    // Calculate color
    let r, g, b;
    if (isMortar) {
      r = darkRgb.r * 0.6;
      g = darkRgb.g * 0.6;
      b = darkRgb.b * 0.6;
    } else {
      const variation = 1 + noise + noise2;
      r = baseRgb.r * variation;
      g = baseRgb.g * variation;
      b = baseRgb.b * variation;
    }
    
    // Vertical gradient for depth
    const vGradient = 0.85 + Math.sin(texV * Math.PI) * 0.15;
    r *= vGradient;
    g *= vGradient;
    b *= vGradient;
    
    // Apply lighting
    r *= lightIntensity;
    g *= lightIntensity;
    b *= lightIntensity;
    
    // Apply fog
    r = r + (fogRgb.r - r) * fogAmount * 0.8;
    g = g + (fogRgb.g - g) * fogAmount * 0.8;
    b = b + (fogRgb.b - b) * fogAmount * 0.8;
    
    // Add purple fog tint
    const fogTintRgb = hexToRgb(COLORS.fogTint);
    r = r + (fogTintRgb.r - r) * fogAmount * 0.3;
    g = g + (fogTintRgb.g - g) * fogAmount * 0.3;
    b = b + (fogTintRgb.b - b) * fogAmount * 0.3;
    
    ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, Math.round(r)))},${Math.min(255, Math.max(0, Math.round(g)))},${Math.min(255, Math.max(0, Math.round(b)))})`;
    ctx.fillRect(screenX, y, 1, 1);
  }
  
  // Add edge highlight for vertical walls
  if (ray.side === 'vertical') {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * lightFlicker})`;
    ctx.fillRect(screenX, wallTop, 1, actualHeight);
  }
  
  // Add ambient occlusion at top and bottom of walls
  const aoSize = Math.min(10, actualHeight * 0.15);
  const aoGradientTop = ctx.createLinearGradient(0, wallTop, 0, wallTop + aoSize);
  aoGradientTop.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  aoGradientTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aoGradientTop;
  ctx.fillRect(screenX, wallTop, 1, aoSize);
  
  const aoGradientBottom = ctx.createLinearGradient(0, wallBottom - aoSize, 0, wallBottom);
  aoGradientBottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
  aoGradientBottom.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = aoGradientBottom;
  ctx.fillRect(screenX, wallBottom - aoSize, 1, aoSize);
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
  
  // Sprite is behind player - use smaller threshold for close sprites
  if (transformY <= 0.05) {
    return null;
  }
  
  // Calculate screen X position
  const screenX = (config.screenWidth / 2) * (1 + transformX / transformY);
  
  // Calculate sprite size
  const spriteScale = config.screenHeight / Math.max(transformY, 0.1) * sprite.scale;
  const spriteWidth = Math.min(spriteScale, config.screenHeight * 3); // Cap max size
  
  // More lenient bounds check for close sprites
  if (screenX < -spriteWidth * 2 || screenX > config.screenWidth + spriteWidth * 2) {
    return null;
  }
  
  return {
    sprite,
    distance: transformY,
    screenX,
    scale: spriteScale,
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
 * Sprite visual data including colors and shape
 */
interface SpriteVisualData {
  color: string;
  glow: string;
  glowIntensity: number;
  secondaryColor?: string;
  eyeColor?: string;
  type: 'enemy' | 'item';
}

/**
 * Get sprite visual data based on sprite ID
 */
function getSpriteVisualData(spriteId: string): SpriteVisualData {
  const spriteData: Record<string, SpriteVisualData> = {
    enemy_zombie: { 
      color: '#3a7a3a', 
      secondaryColor: '#2a5a2a',
      eyeColor: '#ff0000',
      glow: '#44ff44', 
      glowIntensity: 0.2,
      type: 'enemy'
    },
    enemy_ghost: { 
      color: '#ccccee', 
      secondaryColor: '#9999bb',
      eyeColor: '#000000',
      glow: '#aaaaff', 
      glowIntensity: 0.5,
      type: 'enemy'
    },
    enemy_skeleton: { 
      color: '#e8e8d0', 
      secondaryColor: '#c0c0a0',
      eyeColor: '#ff4400',
      glow: '#ffeecc', 
      glowIntensity: 0.15,
      type: 'enemy'
    },
    item_health: { color: '#ff4444', glow: '#ff0000', glowIntensity: 0.8, type: 'item' },
    item_ammo: { color: '#ffaa33', glow: '#ff8800', glowIntensity: 0.6, type: 'item' },
    item_key: { color: '#ffff44', glow: '#ffff00', glowIntensity: 0.9, type: 'item' },
    default: { color: '#ff00ff', glow: '#ff00ff', glowIntensity: 0.5, type: 'item' },
  };
  
  return spriteData[spriteId] || spriteData.default;
}

/**
 * Check if a pixel is part of an enemy shape
 * Returns: 0 = empty, 1 = body, 2 = secondary/detail, 3 = eyes, 4 = mouth/teeth
 */
function getEnemyPixelType(u: number, v: number, spriteId: string): number {
  // Normalize to -1 to 1 range
  const x = (u - 0.5) * 2;
  const y = (v - 0.5) * 2;
  
  if (spriteId.includes('zombie')) {
    // Zombie shape - humanoid with arms out
    // Head (top)
    if (y < -0.3 && y > -0.8) {
      const headWidth = 0.35 + (y + 0.8) * 0.1;
      if (Math.abs(x) < headWidth) {
        // Eyes
        if (y > -0.55 && y < -0.45) {
          if ((x > -0.25 && x < -0.1) || (x > 0.1 && x < 0.25)) {
            return 3; // Eyes
          }
        }
        // Mouth
        if (y > -0.7 && y < -0.6 && Math.abs(x) < 0.15) {
          return 4; // Mouth
        }
        return 1; // Head body
      }
    }
    // Body (torso)
    if (y >= -0.3 && y < 0.4) {
      const bodyWidth = 0.4 - y * 0.1;
      if (Math.abs(x) < bodyWidth) {
        // Tattered clothes detail
        if (Math.sin(y * 15 + x * 10) > 0.7) return 2;
        return 1;
      }
      // Arms reaching out
      if (y > -0.2 && y < 0.2) {
        const armY = y + 0.05;
        if (Math.abs(armY) < 0.15) {
          if (x > 0.3 && x < 0.8) return 1; // Right arm
          if (x < -0.3 && x > -0.8) return 1; // Left arm
        }
      }
    }
    // Legs
    if (y >= 0.4 && y < 0.95) {
      if ((x > -0.25 && x < -0.05) || (x > 0.05 && x < 0.25)) {
        return 1;
      }
    }
    return 0;
  }
  
  if (spriteId.includes('ghost')) {
    // Ghost shape - floating sheet with wavy bottom
    const ghostTop = -0.7;
    const ghostBottom = 0.6 + Math.sin(u * 12) * 0.15;
    
    if (y > ghostTop && y < ghostBottom) {
      // Width tapers at top, wider at bottom
      const width = 0.3 + (y - ghostTop) * 0.4;
      if (Math.abs(x) < width) {
        // Eyes (dark holes)
        if (y > -0.4 && y < -0.2) {
          if ((x > -0.25 && x < -0.08) || (x > 0.08 && x < 0.25)) {
            return 3; // Eyes
          }
        }
        // Mouth (oval)
        if (y > -0.1 && y < 0.1 && Math.abs(x) < 0.15) {
          const mouthDist = Math.sqrt(x * x / 0.02 + (y) * (y) / 0.01);
          if (mouthDist < 1) return 3;
        }
        // Wavy transparency effect
        if (Math.sin(y * 8 + x * 5) > 0.85) return 2;
        return 1;
      }
    }
    return 0;
  }
  
  if (spriteId.includes('skeleton')) {
    // Skeleton shape - bones visible
    // Skull
    if (y < -0.25 && y > -0.75) {
      const skullWidth = 0.35 - Math.abs(y + 0.5) * 0.3;
      if (Math.abs(x) < skullWidth) {
        // Eye sockets
        if (y > -0.55 && y < -0.4) {
          if ((x > -0.2 && x < -0.05) || (x > 0.05 && x < 0.2)) {
            return 3;
          }
        }
        // Nose hole
        if (y > -0.4 && y < -0.3 && Math.abs(x) < 0.06) {
          return 2;
        }
        // Teeth
        if (y > -0.3 && y < -0.2 && Math.abs(x) < 0.2) {
          if (Math.floor(x * 20) % 2 === 0) return 4;
          return 2;
        }
        return 1;
      }
    }
    // Spine/ribcage
    if (y >= -0.25 && y < 0.35) {
      // Spine
      if (Math.abs(x) < 0.08) return 1;
      // Ribs
      if (y < 0.2) {
        const ribY = (y + 0.25) * 8;
        if (Math.floor(ribY) % 2 === 0 && Math.abs(x) < 0.35 - Math.abs(y) * 0.3) {
          return 1;
        }
      }
    }
    // Pelvis
    if (y >= 0.35 && y < 0.5) {
      if (Math.abs(x) < 0.25) return 1;
    }
    // Leg bones
    if (y >= 0.5 && y < 0.95) {
      if ((Math.abs(x - 0.12) < 0.05) || (Math.abs(x + 0.12) < 0.05)) {
        return 1;
      }
    }
    return 0;
  }
  
  // Default circular shape for items
  const dist = Math.sqrt(x * x + y * y);
  if (dist < 0.8) return 1;
  return 0;
}

/**
 * Render a single sprite with proper character shapes
 * Requirements: 3.3, 5.3
 */
export function renderSprite(
  ctx: CanvasRenderingContext2D,
  renderData: SpriteRenderData,
  rays: Ray[],
  config: RaycastConfig
): void {
  const { screenX, scale, sprite, distance } = renderData;
  
  // Cap the scale for very close sprites to prevent them from being too large
  const maxScale = config.screenHeight * 2;
  const cappedScale = Math.min(scale, maxScale);
  
  const spriteWidth = cappedScale;
  const spriteHeight = cappedScale;
  
  const drawStartX = Math.floor(screenX - spriteWidth / 2);
  const drawEndX = Math.floor(screenX + spriteWidth / 2);
  
  const halfHeight = config.screenHeight / 2;
  const drawStartY = Math.floor(halfHeight - spriteHeight / 2);
  const drawEndY = Math.floor(halfHeight + spriteHeight / 2);
  
  // Clamp to screen bounds
  const clampedStartX = Math.max(0, drawStartX);
  const clampedEndX = Math.min(config.screenWidth, drawEndX);
  const clampedStartY = Math.max(0, drawStartY);
  const clampedEndY = Math.min(config.screenHeight, drawEndY);
  
  // Get sprite visual data
  const visualData = getSpriteVisualData(sprite.spriteId);
  const baseRgb = hexToRgb(visualData.color);
  const secondaryRgb = visualData.secondaryColor ? hexToRgb(visualData.secondaryColor) : baseRgb;
  const eyeRgb = visualData.eyeColor ? hexToRgb(visualData.eyeColor) : { r: 255, g: 0, b: 0 };
  const glowRgb = hexToRgb(visualData.glow);
  const fogRgb = hexToRgb(COLORS.fog);
  
  // Calculate lighting and fog - reduce fog for close sprites so they stay visible
  const effectiveDistance = Math.max(distance, 0.5); // Minimum distance for calculations
  const fogAmount = Math.min(0.7, (effectiveDistance / config.maxRenderDistance) ** 1.5);
  const lightIntensity = Math.max(0.3, 1 - (effectiveDistance / config.maxRenderDistance) ** 1.2) * lightFlicker;
  
  // Draw glow effect first (behind sprite) - only for items or ghosts
  if (visualData.glowIntensity > 0.3 && distance < config.maxRenderDistance * 0.7 && distance > 0.5) {
    const glowSize = Math.min(spriteWidth * 1.5, config.screenHeight);
    const glowAlpha = visualData.glowIntensity * (1 - fogAmount) * 0.3 * lightFlicker;
    const gradient = ctx.createRadialGradient(
      screenX, halfHeight, 0,
      screenX, halfHeight, glowSize / 2
    );
    gradient.addColorStop(0, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glowAlpha})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(
      Math.max(0, screenX - glowSize / 2), 
      Math.max(0, halfHeight - glowSize / 2), 
      Math.min(glowSize, config.screenWidth), 
      Math.min(glowSize, config.screenHeight)
    );
  }
  
  // For very close sprites, use a simpler depth test
  const isVeryClose = distance < 1.5;
  
  // Draw sprite column by column (for depth testing against walls)
  for (let x = clampedStartX; x < clampedEndX; x++) {
    // Check if this column is behind a wall (skip for very close sprites)
    if (!isVeryClose) {
      const rayIndex = Math.floor(x);
      if (rayIndex >= 0 && rayIndex < rays.length) {
        if (rays[rayIndex].distance < distance * 0.9) {
          continue; // Wall is in front of sprite
        }
      }
    }
    
    // Calculate horizontal position in sprite (0-1)
    const spriteU = (x - drawStartX) / spriteWidth;
    
    // Draw sprite column with vertical shading
    for (let y = clampedStartY; y < clampedEndY; y++) {
      const spriteV = (y - drawStartY) / spriteHeight;
      
      // Get pixel type from shape function
      const pixelType = visualData.type === 'enemy' 
        ? getEnemyPixelType(spriteU, spriteV, sprite.spriteId)
        : getItemPixelType(spriteU, spriteV);
      
      if (pixelType === 0) continue; // Empty pixel
      
      // Select color based on pixel type
      let r, g, b;
      switch (pixelType) {
        case 1: // Main body
          r = baseRgb.r;
          g = baseRgb.g;
          b = baseRgb.b;
          break;
        case 2: // Secondary/detail
          r = secondaryRgb.r;
          g = secondaryRgb.g;
          b = secondaryRgb.b;
          break;
        case 3: // Eyes
          r = eyeRgb.r;
          g = eyeRgb.g;
          b = eyeRgb.b;
          // Eyes glow slightly
          r = Math.min(255, r * 1.2);
          break;
        case 4: // Mouth/teeth
          r = 200;
          g = 200;
          b = 180;
          break;
        default:
          r = baseRgb.r;
          g = baseRgb.g;
          b = baseRgb.b;
      }
      
      // Add shading based on position
      const vShade = 0.75 + Math.sin(spriteV * Math.PI) * 0.25;
      const hShade = 0.85 + (0.5 - Math.abs(spriteU - 0.5)) * 0.3;
      
      r *= vShade * hShade;
      g *= vShade * hShade;
      b *= vShade * hShade;
      
      // Apply lighting
      r *= lightIntensity;
      g *= lightIntensity;
      b *= lightIntensity;
      
      // Apply fog (less for close sprites)
      const actualFog = isVeryClose ? fogAmount * 0.3 : fogAmount * 0.7;
      r = r + (fogRgb.r - r) * actualFog;
      g = g + (fogRgb.g - g) * actualFog;
      b = b + (fogRgb.b - b) * actualFog;
      
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, Math.round(r)))},${Math.min(255, Math.max(0, Math.round(g)))},${Math.min(255, Math.max(0, Math.round(b)))})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  // Draw shadow on floor (only if not too close)
  if (distance > 1 && distance < config.maxRenderDistance * 0.8) {
    const shadowY = Math.min(drawEndY + 2, config.screenHeight - 5);
    const shadowWidth = Math.min(spriteWidth * 0.6, config.screenWidth * 0.3);
    const shadowHeight = Math.min(spriteHeight * 0.1, 20);
    const shadowAlpha = 0.25 * (1 - fogAmount);
    
    if (shadowY > 0 && shadowY < config.screenHeight) {
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(screenX, shadowY, shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Get item pixel type (simple glowing orb)
 */
function getItemPixelType(u: number, v: number): number {
  const x = (u - 0.5) * 2;
  const y = (v - 0.5) * 2;
  const dist = Math.sqrt(x * x + y * y);
  
  if (dist < 0.5) return 1; // Inner glow
  if (dist < 0.75) return 2; // Outer ring
  return 0;
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
 * Apply post-processing effects (vignette, scanlines, color grading)
 */
function applyPostProcessing(
  ctx: CanvasRenderingContext2D,
  screenWidth: number,
  screenHeight: number
): void {
  // Vignette effect
  const vignetteGradient = ctx.createRadialGradient(
    screenWidth / 2, screenHeight / 2, screenHeight * 0.3,
    screenWidth / 2, screenHeight / 2, screenHeight * 0.8
  );
  vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  
  // Subtle scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
  for (let y = 0; y < screenHeight; y += 2) {
    ctx.fillRect(0, y, screenWidth, 1);
  }
  
  // Color grading - slight orange/teal push for cinematic look
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = 'rgba(20, 10, 5, 0.05)';
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  ctx.globalCompositeOperation = 'source-over';
  
  // Add subtle noise for film grain effect
  ctx.fillStyle = `rgba(255, 255, 255, ${0.01 + Math.random() * 0.01})`;
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * screenWidth;
    const y = Math.random() * screenHeight;
    ctx.fillRect(x, y, 1, 1);
  }
}

/**
 * Render atmospheric particles (dust, embers)
 */
let particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }> = [];

function updateAndRenderParticles(
  ctx: CanvasRenderingContext2D,
  screenWidth: number,
  screenHeight: number,
  deltaTime: number = 0.016
): void {
  // Spawn new particles occasionally
  if (Math.random() < 0.1 && particles.length < 30) {
    particles.push({
      x: Math.random() * screenWidth,
      y: screenHeight + 10,
      vx: (Math.random() - 0.5) * 20,
      vy: -20 - Math.random() * 30,
      life: 2 + Math.random() * 3,
      size: 1 + Math.random() * 2,
      color: Math.random() > 0.5 ? COLORS.torchOrange : COLORS.torchYellow,
    });
  }
  
  // Update and render particles
  particles = particles.filter(p => {
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.vy += 5 * deltaTime; // Slight upward drift
    p.life -= deltaTime;
    
    if (p.life <= 0) return false;
    
    const alpha = Math.min(1, p.life) * 0.6;
    const rgb = hexToRgb(p.color);
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * lightFlicker, 0, Math.PI * 2);
    ctx.fill();
    
    return true;
  });
}

/**
 * Main render function - renders complete frame with enhanced graphics
 */
export function render(
  ctx: CanvasRenderingContext2D,
  player: Player,
  levelMap: LevelMap,
  enemies: Enemy[],
  items: GameItem[],
  raycastRenderer: RaycastRenderer,
  deltaTime: number = 0.016
): void {
  const config = raycastRenderer.getConfig();
  
  // Update lighting effects
  updateLighting(deltaTime);
  
  // Generate textures if needed
  generateWallTextures(ctx);
  
  // Render floor and ceiling with perspective texturing
  renderFloorAndCeiling(
    ctx, 
    config.screenWidth, 
    config.screenHeight,
    player.position,
    player.rotation
  );
  
  // Cast all rays
  const rays = raycastRenderer.castAllRays(
    player.position,
    player.rotation,
    levelMap
  );
  
  // Render walls with enhanced texturing
  renderWalls(ctx, rays, player.rotation, config);
  
  // Collect all sprites
  const sprites: Sprite[] = [
    ...enemiesToSprites(enemies),
    ...itemsToSprites(items),
  ];
  
  // Render sprites with enhanced effects
  renderSprites(
    ctx,
    sprites,
    rays,
    player.position,
    player.rotation,
    config
  );
  
  // Render atmospheric particles
  updateAndRenderParticles(ctx, config.screenWidth, config.screenHeight, deltaTime);
  
  // Apply post-processing effects
  applyPostProcessing(ctx, config.screenWidth, config.screenHeight);
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
   * Render a complete frame with enhanced graphics
   */
  render(
    player: Player,
    levelMap: LevelMap,
    enemies: Enemy[] = [],
    items: GameItem[] = [],
    deltaTime: number = 0.016
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
      this.raycastRenderer,
      deltaTime
    );
  }
}
