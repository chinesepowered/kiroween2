/**
 * Enemy module for FrankenKiro
 * Implements enemy AI with state machine, line-of-sight detection, and pathfinding
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

import { Vector2 } from '@/engine/types';
import { Enemy, EnemyState, LevelMap, Player } from './types';
import { subtract, normalize, distance, add, multiply } from '@/engine/vector2';
import { raycast, moveWithCollision } from '@/engine/collision';

/**
 * Default enemy configuration
 */
export const DEFAULT_ENEMY_CONFIG = {
  health: 50,
  maxHealth: 50,
  damage: 10,
  speed: 1.5,
  attackRange: 1.5,
  detectionRange: 8.0,
  pointValue: 100,
  radius: 0.3,
};

/**
 * Attack cooldown in seconds
 */
export const ATTACK_COOLDOWN = 1.0;

/**
 * Create a new enemy with default values
 */
export function createEnemy(
  id: string,
  position: Vector2,
  spriteId: string = 'zombie',
  config: Partial<typeof DEFAULT_ENEMY_CONFIG> = {}
): Enemy {
  const mergedConfig = { ...DEFAULT_ENEMY_CONFIG, ...config };
  return {
    id,
    position: { ...position },
    rotation: 0,
    health: mergedConfig.health,
    maxHealth: mergedConfig.maxHealth,
    damage: mergedConfig.damage,
    speed: mergedConfig.speed,
    attackRange: mergedConfig.attackRange,
    detectionRange: mergedConfig.detectionRange,
    state: 'idle',
    spriteId,
    pointValue: mergedConfig.pointValue,
  };
}


/**
 * Check if the enemy can see the player using line-of-sight raycasting
 * Requirements: 4.1
 * @param enemy - The enemy checking for the player
 * @param player - The player to check visibility of
 * @param level - The level map for raycasting
 * @returns true if the enemy has clear line of sight to the player
 */
export function canSeePlayer(
  enemy: Enemy,
  player: Player,
  level: LevelMap
): boolean {
  // Dead enemies can't see anything
  if (enemy.state === 'dead') {
    return false;
  }

  const toPlayer = subtract(player.position, enemy.position);
  const dist = distance(enemy.position, player.position);

  // Check if player is within detection range
  if (dist > enemy.detectionRange) {
    return false;
  }

  // If very close, assume visible
  if (dist < 0.1) {
    return true;
  }

  // Cast a ray toward the player
  const direction = normalize(toPlayer);
  const hit = raycast(enemy.position, direction, dist + 0.1, level);

  // If no wall hit or wall is farther than player, enemy can see player
  if (hit === null || hit.distance >= dist - 0.1) {
    return true;
  }

  return false;
}

/**
 * Calculate the direction from enemy to player
 */
export function getDirectionToPlayer(enemy: Enemy, player: Player): Vector2 {
  const toPlayer = subtract(player.position, enemy.position);
  return normalize(toPlayer);
}

/**
 * Determine the next state for an enemy based on player position and visibility
 * Requirements: 4.1, 4.2
 * @param enemy - The enemy to evaluate
 * @param player - The player
 * @param level - The level map
 * @returns The new state the enemy should transition to
 */
export function determineNextState(
  enemy: Enemy,
  player: Player,
  level: LevelMap
): EnemyState {
  // Dead enemies stay dead
  if (enemy.state === 'dead' || enemy.health <= 0) {
    return 'dead';
  }

  const dist = distance(enemy.position, player.position);
  const canSee = canSeePlayer(enemy, player, level);

  // If enemy can see player
  if (canSee) {
    // If within attack range, attack
    if (dist <= enemy.attackRange) {
      return 'attacking';
    }
    // Otherwise, pursue
    return 'pursuing';
  }

  // If enemy can't see player, go idle
  return 'idle';
}


/**
 * Move enemy toward the player (simple pathfinding)
 * Requirements: 4.1
 * @param enemy - The enemy to move
 * @param player - The player to move toward
 * @param deltaTime - Time since last update
 * @param level - The level map for collision
 * @returns Updated enemy with new position
 */
export function moveTowardPlayer(
  enemy: Enemy,
  player: Player,
  deltaTime: number,
  level: LevelMap
): Enemy {
  // Dead enemies don't move
  if (enemy.state === 'dead') {
    return enemy;
  }

  const direction = getDirectionToPlayer(enemy, player);
  const movement = multiply(direction, enemy.speed * deltaTime);
  const desiredPosition = add(enemy.position, movement);

  // Apply collision detection
  const newPosition = moveWithCollision(
    enemy.position,
    desiredPosition,
    DEFAULT_ENEMY_CONFIG.radius,
    level
  );

  // Update rotation to face player
  const newRotation = Math.atan2(direction.y, direction.x);

  return {
    ...enemy,
    position: newPosition,
    rotation: newRotation,
  };
}

/**
 * Apply damage to an enemy
 * Requirements: 3.2
 * @param enemy - The enemy to damage
 * @param amount - Amount of damage to apply
 * @returns Updated enemy with reduced health
 */
export function takeDamage(enemy: Enemy, amount: number): Enemy {
  if (amount < 0 || enemy.state === 'dead') {
    return enemy;
  }

  const newHealth = Math.max(0, enemy.health - amount);
  const newState: EnemyState = newHealth <= 0 ? 'dead' : enemy.state;

  return {
    ...enemy,
    health: newHealth,
    state: newState,
  };
}

/**
 * Check if an enemy is dead
 */
export function isDead(enemy: Enemy): boolean {
  return enemy.state === 'dead' || enemy.health <= 0;
}

/**
 * Check if an enemy is in attack range of the player
 */
export function isInAttackRange(enemy: Enemy, player: Player): boolean {
  const dist = distance(enemy.position, player.position);
  return dist <= enemy.attackRange;
}


/**
 * Result of an enemy attack
 */
export interface AttackResult {
  attacked: boolean;
  damage: number;
}

/**
 * Perform an enemy attack on the player
 * Requirements: 4.2, 4.3
 * @param enemy - The attacking enemy
 * @param player - The player being attacked
 * @returns AttackResult indicating if attack occurred and damage dealt
 */
export function performAttack(enemy: Enemy, player: Player): AttackResult {
  // Dead enemies can't attack
  if (enemy.state === 'dead') {
    return { attacked: false, damage: 0 };
  }

  // Must be in attacking state and in range
  if (enemy.state !== 'attacking' || !isInAttackRange(enemy, player)) {
    return { attacked: false, damage: 0 };
  }

  return {
    attacked: true,
    damage: enemy.damage,
  };
}

/**
 * Update a single enemy's state and position
 * Requirements: 4.1, 4.2
 * @param enemy - The enemy to update
 * @param player - The player
 * @param level - The level map
 * @param deltaTime - Time since last update
 * @returns Updated enemy
 */
export function updateEnemy(
  enemy: Enemy,
  player: Player,
  level: LevelMap,
  deltaTime: number
): Enemy {
  // Dead enemies don't update
  if (enemy.state === 'dead' || enemy.health <= 0) {
    return { ...enemy, state: 'dead' };
  }

  // Determine new state based on player position and visibility
  const newState = determineNextState(enemy, player, level);
  let updatedEnemy = { ...enemy, state: newState };

  // If pursuing, move toward player
  if (newState === 'pursuing') {
    updatedEnemy = moveTowardPlayer(updatedEnemy, player, deltaTime, level);
  } else if (newState === 'attacking') {
    // Face the player when attacking
    const direction = getDirectionToPlayer(enemy, player);
    updatedEnemy = {
      ...updatedEnemy,
      rotation: Math.atan2(direction.y, direction.x),
    };
  }

  return updatedEnemy;
}

/**
 * Result of updating an enemy that includes potential attack
 */
export interface EnemyUpdateResult {
  enemy: Enemy;
  attack: AttackResult;
}

/**
 * Update enemy and check for attack
 * @param enemy - The enemy to update
 * @param player - The player
 * @param level - The level map
 * @param deltaTime - Time since last update
 * @returns Updated enemy and attack result
 */
export function updateEnemyWithAttack(
  enemy: Enemy,
  player: Player,
  level: LevelMap,
  deltaTime: number
): EnemyUpdateResult {
  const updatedEnemy = updateEnemy(enemy, player, level, deltaTime);
  const attack = performAttack(updatedEnemy, player);

  return {
    enemy: updatedEnemy,
    attack,
  };
}


/**
 * Result of defeating an enemy
 */
export interface DefeatResult {
  defeated: boolean;
  scoreIncrease: number;
  enemy: Enemy;
}

/**
 * Handle enemy defeat - transitions to dead state and returns score increase
 * Requirements: 3.3
 * @param enemy - The enemy to check for defeat
 * @returns DefeatResult with updated enemy and score increase
 */
export function handleDefeat(enemy: Enemy): DefeatResult {
  // Check if enemy should be defeated (health <= 0 but not already dead)
  if (enemy.health <= 0 && enemy.state !== 'dead') {
    return {
      defeated: true,
      scoreIncrease: enemy.pointValue,
      enemy: { ...enemy, state: 'dead' },
    };
  }

  // Already dead or still alive
  return {
    defeated: false,
    scoreIncrease: 0,
    enemy,
  };
}

/**
 * Apply damage to enemy and handle defeat in one operation
 * Requirements: 3.2, 3.3
 * @param enemy - The enemy to damage
 * @param damage - Amount of damage to apply
 * @returns DefeatResult with updated enemy and potential score increase
 */
export function damageAndCheckDefeat(enemy: Enemy, damage: number): DefeatResult {
  const damagedEnemy = takeDamage(enemy, damage);
  return handleDefeat(damagedEnemy);
}
