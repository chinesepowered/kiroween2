/**
 * Core game types for FrankenKiro
 */

import { Vector2 } from '@/engine/types';

/**
 * Player statistics
 */
export interface PlayerStats {
  health: number;
  maxHealth: number;
  ammunition: number;
  maxAmmunition: number;
  score: number;
}

/**
 * Weapon definition
 */
export interface Weapon {
  name: string;
  damage: number;
  fireRate: number;
  ammoCost: number;
  range: number;
  spriteSheet: string;
  soundEffect: string;
}

/**
 * Item types available in the game
 */
export type ItemType = 'health' | 'ammo' | 'key';

/**
 * Game item (power-ups, keys, etc.)
 */
export interface GameItem {
  id: string;
  type: ItemType;
  position: Vector2;
  value: number;
  collected: boolean;
  spriteId: string;
}

/**
 * Player entity
 */
export interface Player {
  position: Vector2;
  rotation: number;
  stats: PlayerStats;
  inventory: string[];
  currentWeapon: Weapon;
}


/**
 * Enemy AI states
 */
export type EnemyState = 'idle' | 'pursuing' | 'attacking' | 'dead';

/**
 * Enemy entity
 */
export interface Enemy {
  id: string;
  position: Vector2;
  rotation: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRange: number;
  detectionRange: number;
  state: EnemyState;
  spriteId: string;
  pointValue: number;
}

/**
 * Enemy spawn point definition
 */
export interface EnemySpawn {
  position: Vector2;
  enemyType: string;
}

/**
 * Item spawn point definition
 */
export interface ItemSpawn {
  position: Vector2;
  itemType: ItemType;
  value: number;
}

/**
 * Level map data structure
 */
export interface LevelMap {
  width: number;
  height: number;
  grid: number[][];
  playerSpawn: Vector2;
  enemySpawns: EnemySpawn[];
  items: ItemSpawn[];
  exitPoint: Vector2;
}

/**
 * Game status states
 */
export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory';

/**
 * Complete game state
 */
export interface GameState {
  status: GameStatus;
  player: Player;
  enemies: Enemy[];
  items: GameItem[];
  currentLevel: number;
  levelMap: LevelMap;
  elapsedTime: number;
}

/**
 * Save data structure for persistence
 */
export interface SaveData {
  version: string;
  timestamp: number;
  gameState: {
    player: {
      position: Vector2;
      rotation: number;
      stats: PlayerStats;
      inventory: string[];
    };
    currentLevel: number;
    enemies: {
      id: string;
      position: Vector2;
      health: number;
      state: EnemyState;
    }[];
    collectedItems: string[];
    elapsedTime: number;
  };
}
