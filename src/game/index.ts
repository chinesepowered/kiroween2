/**
 * Game module exports
 */

export * from './types';

// Player exports
export {
  DEFAULT_WEAPON,
  DEFAULT_STATS,
  PLAYER_MOVE_SPEED,
  PLAYER_ROTATION_SPEED,
  createPlayer,
  normalizeAngle,
  moveForward,
  moveBackward,
  rotateLeft,
  rotateRight,
  move,
  rotate,
  takeDamage as playerTakeDamage,
  heal,
  isDead as playerIsDead,
  addScore,
  fire,
  addAmmunition,
  canFire,
  addKey,
  hasKey,
  setPosition,
  type FireResult,
} from './player';

// Enemy exports
export {
  DEFAULT_ENEMY_CONFIG,
  ATTACK_COOLDOWN,
  createEnemy,
  canSeePlayer,
  getDirectionToPlayer,
  determineNextState,
  moveTowardPlayer,
  takeDamage as enemyTakeDamage,
  isDead as enemyIsDead,
  isInAttackRange,
  performAttack,
  updateEnemy,
  updateEnemyWithAttack,
  handleDefeat,
  damageAndCheckDefeat,
  type AttackResult,
  type EnemyUpdateResult,
  type DefeatResult,
} from './enemy';

export * from './enemyManager';
export * from './item';
export * from './level';
export * from './gameStateManager';
