/**
 * EnemyManager module for FrankenKiro
 * Manages multiple enemies with independent updates
 * Requirements: 4.5
 */

import { Enemy, EnemySpawn, LevelMap, Player } from './types';
import {
  createEnemy,
  updateEnemyWithAttack,
  damageAndCheckDefeat,
  isDead,
  EnemyUpdateResult,
  AttackResult,
  DEFAULT_ENEMY_CONFIG,
} from './enemy';
import { Vector2 } from '@/engine/types';
import { distance } from '@/engine/vector2';

/**
 * Result of updating all enemies
 */
export interface EnemyManagerUpdateResult {
  enemies: Enemy[];
  totalDamageToPlayer: number;
  totalScoreIncrease: number;
  defeatedEnemyIds: string[];
}

/**
 * EnemyManager class for managing multiple enemies
 * Each enemy operates independently
 * Requirements: 4.5
 */
export class EnemyManager {
  private enemies: Enemy[];
  private nextEnemyId: number;

  constructor() {
    this.enemies = [];
    this.nextEnemyId = 0;
  }

  /**
   * Get all enemies
   */
  getEnemies(): Enemy[] {
    return [...this.enemies];
  }

  /**
   * Get all active (non-dead) enemies
   */
  getActiveEnemies(): Enemy[] {
    return this.enemies.filter((e) => !isDead(e));
  }


  /**
   * Get enemy by ID
   */
  getEnemy(id: string): Enemy | undefined {
    return this.enemies.find((e) => e.id === id);
  }

  /**
   * Get enemy count
   */
  getEnemyCount(): number {
    return this.enemies.length;
  }

  /**
   * Get active enemy count
   */
  getActiveEnemyCount(): number {
    return this.getActiveEnemies().length;
  }

  /**
   * Add a new enemy
   */
  addEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
  }

  /**
   * Create and add a new enemy at position
   */
  spawnEnemy(
    position: Vector2,
    spriteId: string = 'zombie',
    config: Partial<typeof DEFAULT_ENEMY_CONFIG> = {}
  ): Enemy {
    const id = `enemy_${this.nextEnemyId++}`;
    const enemy = createEnemy(id, position, spriteId, config);
    this.addEnemy(enemy);
    return enemy;
  }

  /**
   * Spawn enemies from level spawn points
   */
  spawnFromLevel(spawns: EnemySpawn[]): void {
    for (const spawn of spawns) {
      this.spawnEnemy(spawn.position, spawn.enemyType);
    }
  }

  /**
   * Remove an enemy by ID
   */
  removeEnemy(id: string): boolean {
    const index = this.enemies.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.enemies.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove all dead enemies
   */
  removeDeadEnemies(): Enemy[] {
    const dead = this.enemies.filter((e) => isDead(e));
    this.enemies = this.enemies.filter((e) => !isDead(e));
    return dead;
  }

  /**
   * Clear all enemies
   */
  clear(): void {
    this.enemies = [];
  }


  /**
   * Update all enemies independently
   * Each enemy's update does not affect other enemies
   * Requirements: 4.5
   * @param player - The player
   * @param level - The level map
   * @param deltaTime - Time since last update
   * @returns Update result with all enemies and accumulated damage/score
   */
  update(
    player: Player,
    level: LevelMap,
    deltaTime: number
  ): EnemyManagerUpdateResult {
    let totalDamageToPlayer = 0;
    let totalScoreIncrease = 0;
    const defeatedEnemyIds: string[] = [];

    // Update each enemy independently
    // Important: We iterate over a copy to ensure independence
    const updatedEnemies = this.enemies.map((enemy) => {
      // Skip dead enemies
      if (isDead(enemy)) {
        return enemy;
      }

      // Update this enemy (independent of others)
      const result = updateEnemyWithAttack(enemy, player, level, deltaTime);

      // Accumulate damage to player
      if (result.attack.attacked) {
        totalDamageToPlayer += result.attack.damage;
      }

      return result.enemy;
    });

    this.enemies = updatedEnemies;

    return {
      enemies: this.getEnemies(),
      totalDamageToPlayer,
      totalScoreIncrease,
      defeatedEnemyIds,
    };
  }

  /**
   * Apply damage to an enemy by ID
   * @param enemyId - ID of the enemy to damage
   * @param damage - Amount of damage to apply
   * @returns Score increase if enemy was defeated, 0 otherwise
   */
  damageEnemy(enemyId: string, damage: number): number {
    const index = this.enemies.findIndex((e) => e.id === enemyId);
    if (index === -1) {
      return 0;
    }

    const result = damageAndCheckDefeat(this.enemies[index], damage);
    this.enemies[index] = result.enemy;

    return result.scoreIncrease;
  }


  /**
   * Find the closest enemy to a position
   */
  findClosestEnemy(position: Vector2, maxDistance?: number): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = maxDistance ?? Infinity;

    for (const enemy of this.getActiveEnemies()) {
      const dist = distance(position, enemy.position);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }

    return closest;
  }

  /**
   * Find all enemies within a radius of a position
   */
  findEnemiesInRadius(position: Vector2, radius: number): Enemy[] {
    return this.getActiveEnemies().filter(
      (enemy) => distance(position, enemy.position) <= radius
    );
  }

  /**
   * Check if any enemy is at a position (for collision)
   */
  getEnemyAtPosition(position: Vector2, radius: number = 0.5): Enemy | null {
    for (const enemy of this.getActiveEnemies()) {
      if (distance(position, enemy.position) <= radius) {
        return enemy;
      }
    }
    return null;
  }
}

/**
 * Functional approach: Update a single enemy in an array without affecting others
 * This demonstrates the independence property
 * Requirements: 4.5
 */
export function updateSingleEnemy(
  enemies: Enemy[],
  enemyId: string,
  player: Player,
  level: LevelMap,
  deltaTime: number
): Enemy[] {
  return enemies.map((enemy) => {
    if (enemy.id !== enemyId) {
      // Other enemies are not affected
      return enemy;
    }
    // Only update the target enemy
    return updateEnemyWithAttack(enemy, player, level, deltaTime).enemy;
  });
}

/**
 * Functional approach: Update all enemies independently
 * Each enemy update is isolated and doesn't affect others
 * Requirements: 4.5
 */
export function updateAllEnemies(
  enemies: Enemy[],
  player: Player,
  level: LevelMap,
  deltaTime: number
): EnemyUpdateResult[] {
  // Map over enemies - each update is independent
  return enemies.map((enemy) => updateEnemyWithAttack(enemy, player, level, deltaTime));
}

/**
 * Create an EnemyManager instance
 */
export function createEnemyManager(): EnemyManager {
  return new EnemyManager();
}
