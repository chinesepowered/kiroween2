/**
 * Player module for FrankenKiro
 * Handles player movement, rotation, stats, and weapon firing
 */

import { Vector2 } from '@/engine/types';
import { add, multiply, fromAngle } from '@/engine/vector2';
import { Player, PlayerStats, Weapon } from './types';

/**
 * Default weapon configuration
 */
export const DEFAULT_WEAPON: Weapon = {
  name: 'Pistol',
  damage: 10,
  fireRate: 2,
  ammoCost: 1,
  range: 10,
  spriteSheet: 'pistol',
  soundEffect: 'pistol_fire',
};

/**
 * Default player stats
 */
export const DEFAULT_STATS: PlayerStats = {
  health: 100,
  maxHealth: 100,
  ammunition: 50,
  maxAmmunition: 100,
  score: 0,
};

/**
 * Player movement speed (units per second)
 */
export const PLAYER_MOVE_SPEED = 3.0;

/**
 * Player rotation speed (radians per second)
 */
export const PLAYER_ROTATION_SPEED = 2.5;

/**
 * Create a new player with default values
 */
export function createPlayer(
  position: Vector2 = { x: 0, y: 0 },
  rotation: number = 0
): Player {
  return {
    position: { ...position },
    rotation: normalizeAngle(rotation),
    stats: { ...DEFAULT_STATS },
    inventory: [],
    currentWeapon: { ...DEFAULT_WEAPON },
  };
}

/**
 * Normalize angle to [0, 2π) range
 */
export function normalizeAngle(angle: number): number {
  const TWO_PI = Math.PI * 2;
  let normalized = angle % TWO_PI;
  if (normalized < 0) {
    normalized += TWO_PI;
  }
  return normalized;
}


/**
 * Move the player forward in the facing direction
 * Requirements: 1.1
 */
export function moveForward(
  player: Player,
  deltaTime: number,
  speed: number = PLAYER_MOVE_SPEED
): Player {
  const direction = fromAngle(player.rotation);
  const movement = multiply(direction, speed * deltaTime);
  return {
    ...player,
    position: add(player.position, movement),
  };
}

/**
 * Move the player backward from the facing direction
 * Requirements: 1.2
 */
export function moveBackward(
  player: Player,
  deltaTime: number,
  speed: number = PLAYER_MOVE_SPEED
): Player {
  const direction = fromAngle(player.rotation);
  const movement = multiply(direction, -speed * deltaTime);
  return {
    ...player,
    position: add(player.position, movement),
  };
}

/**
 * Rotate the player view left (decrease rotation angle)
 * Requirements: 1.3
 */
export function rotateLeft(
  player: Player,
  deltaTime: number,
  speed: number = PLAYER_ROTATION_SPEED
): Player {
  const newRotation = normalizeAngle(player.rotation - speed * deltaTime);
  return {
    ...player,
    rotation: newRotation,
  };
}

/**
 * Rotate the player view right (increase rotation angle)
 * Requirements: 1.4
 */
export function rotateRight(
  player: Player,
  deltaTime: number,
  speed: number = PLAYER_ROTATION_SPEED
): Player {
  const newRotation = normalizeAngle(player.rotation + speed * deltaTime);
  return {
    ...player,
    rotation: newRotation,
  };
}

/**
 * Generic move function that applies movement in a given direction
 */
export function move(
  player: Player,
  direction: Vector2,
  deltaTime: number,
  speed: number = PLAYER_MOVE_SPEED
): Player {
  const movement = multiply(direction, speed * deltaTime);
  return {
    ...player,
    position: add(player.position, movement),
  };
}

/**
 * Generic rotate function that applies rotation
 */
export function rotate(
  player: Player,
  angleChange: number,
  deltaTime: number,
  speed: number = PLAYER_ROTATION_SPEED
): Player {
  const newRotation = normalizeAngle(player.rotation + angleChange * speed * deltaTime);
  return {
    ...player,
    rotation: newRotation,
  };
}


/**
 * Apply damage to the player
 * Health is clamped to never go below 0
 * Requirements: 4.3
 */
export function takeDamage(player: Player, amount: number): Player {
  if (amount < 0) {
    return player; // Ignore negative damage
  }
  const newHealth = Math.max(0, player.stats.health - amount);
  return {
    ...player,
    stats: {
      ...player.stats,
      health: newHealth,
    },
  };
}

/**
 * Heal the player
 * Health is capped at maxHealth
 * Requirements: 5.1
 */
export function heal(player: Player, amount: number): Player {
  if (amount < 0) {
    return player; // Ignore negative healing
  }
  const newHealth = Math.min(player.stats.maxHealth, player.stats.health + amount);
  return {
    ...player,
    stats: {
      ...player.stats,
      health: newHealth,
    },
  };
}

/**
 * Check if the player is dead
 */
export function isDead(player: Player): boolean {
  return player.stats.health <= 0;
}

/**
 * Update player score
 */
export function addScore(player: Player, points: number): Player {
  return {
    ...player,
    stats: {
      ...player.stats,
      score: player.stats.score + points,
    },
  };
}

/**
 * Result of a fire attempt
 */
export interface FireResult {
  success: boolean;
  player: Player;
}

/**
 * Attempt to fire the player's weapon
 * Returns success=false if not enough ammunition
 * Requirements: 3.1, 3.4, 3.5
 */
export function fire(player: Player): FireResult {
  const ammoCost = player.currentWeapon.ammoCost;
  
  // Check if player has enough ammunition
  if (player.stats.ammunition < ammoCost) {
    return {
      success: false,
      player,
    };
  }
  
  // Consume ammunition
  const newAmmunition = player.stats.ammunition - ammoCost;
  return {
    success: true,
    player: {
      ...player,
      stats: {
        ...player.stats,
        ammunition: newAmmunition,
      },
    },
  };
}

/**
 * Add ammunition to the player
 * Ammunition is capped at maxAmmunition
 */
export function addAmmunition(player: Player, amount: number): Player {
  if (amount < 0) {
    return player; // Ignore negative ammo
  }
  const newAmmunition = Math.min(
    player.stats.maxAmmunition,
    player.stats.ammunition + amount
  );
  return {
    ...player,
    stats: {
      ...player.stats,
      ammunition: newAmmunition,
    },
  };
}

/**
 * Check if the player can fire their weapon
 */
export function canFire(player: Player): boolean {
  return player.stats.ammunition >= player.currentWeapon.ammoCost;
}

/**
 * Add a key to the player's inventory
 */
export function addKey(player: Player, keyId: string): Player {
  // Don't add duplicate keys
  if (player.inventory.includes(keyId)) {
    return player;
  }
  return {
    ...player,
    inventory: [...player.inventory, keyId],
  };
}

/**
 * Check if the player has a specific key
 */
export function hasKey(player: Player, keyId: string): boolean {
  return player.inventory.includes(keyId);
}

/**
 * Set player position directly (used for collision resolution)
 */
export function setPosition(player: Player, position: Vector2): Player {
  return {
    ...player,
    position: { ...position },
  };
}
