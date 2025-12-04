/**
 * GameStateManager module for FrankenKiro
 * Handles game state serialization, deserialization, and validation
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { Vector2 } from '@/engine/types';
import {
  GameState,
  Player,
  PlayerStats,
  EnemyState,
  SaveData,
} from './types';
import { createPlayer } from './player';
import { createEmptyLevelMap } from './level';

/**
 * Current save data version
 */
export const SAVE_DATA_VERSION = '1.0.0';

/**
 * Create a default game state
 */
export function createDefaultGameState(): GameState {
  return {
    status: 'menu',
    player: createPlayer({ x: 1.5, y: 1.5 }, 0),
    enemies: [],
    items: [],
    currentLevel: 0,
    levelMap: createEmptyLevelMap(10, 10),
    elapsedTime: 0,
  };
}

/**
 * Serialize a GameState to JSON string
 * Requirements: 8.1, 8.3
 * @param gameState - The game state to serialize
 * @returns JSON string representation of the save data
 */
export function serialize(gameState: GameState): string {
  const saveData: SaveData = {
    version: SAVE_DATA_VERSION,
    timestamp: Date.now(),
    gameState: {
      player: {
        position: { ...gameState.player.position },
        rotation: gameState.player.rotation,
        stats: { ...gameState.player.stats },
        inventory: [...gameState.player.inventory],
      },
      currentLevel: gameState.currentLevel,
      enemies: gameState.enemies.map((enemy) => ({
        id: enemy.id,
        position: { ...enemy.position },
        health: enemy.health,
        state: enemy.state,
      })),
      collectedItems: gameState.items
        .filter((item) => item.collected)
        .map((item) => item.id),
      elapsedTime: gameState.elapsedTime,
    },
  };

  return JSON.stringify(saveData);
}


/**
 * Type guard to check if a value is a valid Vector2
 */
function isValidVector2(value: unknown): value is Vector2 {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return typeof v.x === 'number' && typeof v.y === 'number' &&
         isFinite(v.x) && isFinite(v.y);
}

/**
 * Type guard to check if a value is a valid PlayerStats
 */
function isValidPlayerStats(value: unknown): value is PlayerStats {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const s = value as Record<string, unknown>;
  return (
    typeof s.health === 'number' && isFinite(s.health) &&
    typeof s.maxHealth === 'number' && isFinite(s.maxHealth) &&
    typeof s.ammunition === 'number' && isFinite(s.ammunition) &&
    typeof s.maxAmmunition === 'number' && isFinite(s.maxAmmunition) &&
    typeof s.score === 'number' && isFinite(s.score)
  );
}

/**
 * Type guard to check if a value is a valid EnemyState
 */
function isValidEnemyState(value: unknown): value is EnemyState {
  return value === 'idle' || value === 'pursuing' || value === 'attacking' || value === 'dead';
}

/**
 * Type guard to check if a value is a valid enemy save data entry
 */
function isValidEnemySaveData(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    isValidVector2(e.position) &&
    typeof e.health === 'number' && isFinite(e.health) &&
    isValidEnemyState(e.state)
  );
}

/**
 * Validate the structure of SaveData
 * Requirements: 8.4
 * @param data - The data to validate
 * @returns true if the data conforms to SaveData schema
 */
export function validateSaveData(data: unknown): data is SaveData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const d = data as Record<string, unknown>;

  // Check version
  if (typeof d.version !== 'string') {
    return false;
  }

  // Check timestamp
  if (typeof d.timestamp !== 'number' || !isFinite(d.timestamp)) {
    return false;
  }

  // Check gameState object
  if (typeof d.gameState !== 'object' || d.gameState === null) {
    return false;
  }

  const gs = d.gameState as Record<string, unknown>;

  // Check player data
  if (typeof gs.player !== 'object' || gs.player === null) {
    return false;
  }

  const player = gs.player as Record<string, unknown>;
  if (!isValidVector2(player.position)) {
    return false;
  }
  if (typeof player.rotation !== 'number' || !isFinite(player.rotation)) {
    return false;
  }
  if (!isValidPlayerStats(player.stats)) {
    return false;
  }
  if (!Array.isArray(player.inventory) || !player.inventory.every((i) => typeof i === 'string')) {
    return false;
  }

  // Check currentLevel
  if (typeof gs.currentLevel !== 'number' || !isFinite(gs.currentLevel) || gs.currentLevel < 0) {
    return false;
  }

  // Check enemies array
  if (!Array.isArray(gs.enemies) || !gs.enemies.every(isValidEnemySaveData)) {
    return false;
  }

  // Check collectedItems array
  if (!Array.isArray(gs.collectedItems) || !gs.collectedItems.every((i) => typeof i === 'string')) {
    return false;
  }

  // Check elapsedTime
  if (typeof gs.elapsedTime !== 'number' || !isFinite(gs.elapsedTime) || gs.elapsedTime < 0) {
    return false;
  }

  return true;
}


/**
 * Result of deserialization attempt
 */
export interface DeserializeResult {
  success: boolean;
  saveData?: SaveData;
  error?: string;
}

/**
 * Deserialize a JSON string to SaveData
 * Requirements: 8.2, 8.4
 * @param json - The JSON string to deserialize
 * @returns DeserializeResult with the parsed SaveData or error
 */
export function deserializeSaveData(json: string): DeserializeResult {
  try {
    const parsed = JSON.parse(json);
    
    if (!validateSaveData(parsed)) {
      return {
        success: false,
        error: 'Invalid save data structure',
      };
    }

    return {
      success: true,
      saveData: parsed,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to parse JSON',
    };
  }
}

/**
 * Apply save data to restore a game state
 * This requires the current game state (with level map and full enemy/item data)
 * to merge the saved data into
 * Requirements: 8.2
 * @param saveData - The save data to apply
 * @param currentState - The current game state to merge into
 * @returns The restored game state
 */
export function applySaveData(saveData: SaveData, currentState: GameState): GameState {
  const { gameState: saved } = saveData;

  // Restore player state
  const restoredPlayer: Player = {
    ...currentState.player,
    position: { ...saved.player.position },
    rotation: saved.player.rotation,
    stats: { ...saved.player.stats },
    inventory: [...saved.player.inventory],
  };

  // Restore enemy states (match by ID)
  const restoredEnemies = currentState.enemies.map((enemy) => {
    const savedEnemy = saved.enemies.find((e) => e.id === enemy.id);
    if (savedEnemy) {
      return {
        ...enemy,
        position: { ...savedEnemy.position },
        health: savedEnemy.health,
        state: savedEnemy.state,
      };
    }
    return enemy;
  });

  // Mark collected items
  const restoredItems = currentState.items.map((item) => ({
    ...item,
    collected: saved.collectedItems.includes(item.id),
  }));

  return {
    ...currentState,
    status: 'playing',
    player: restoredPlayer,
    enemies: restoredEnemies,
    items: restoredItems,
    currentLevel: saved.currentLevel,
    elapsedTime: saved.elapsedTime,
  };
}

/**
 * Deserialize JSON and apply to game state in one operation
 * Requirements: 8.2, 8.4
 * @param json - The JSON string to deserialize
 * @param currentState - The current game state to merge into
 * @returns The restored game state or null if deserialization failed
 */
export function deserialize(json: string, currentState: GameState): GameState | null {
  const result = deserializeSaveData(json);
  
  if (!result.success || !result.saveData) {
    return null;
  }

  return applySaveData(result.saveData, currentState);
}


/**
 * GameStateManager class for managing game state lifecycle
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export class GameStateManager {
  private _state: GameState;

  constructor(initialState?: GameState) {
    this._state = initialState ?? createDefaultGameState();
  }

  /**
   * Get the current game state
   */
  get state(): GameState {
    return this._state;
  }

  /**
   * Set the game state
   */
  set state(newState: GameState) {
    this._state = newState;
  }

  /**
   * Initialize the game state to defaults
   */
  initialize(): void {
    this._state = createDefaultGameState();
  }

  /**
   * Update the game state
   * @param deltaTime - Time since last update
   */
  update(deltaTime: number): void {
    this._state = {
      ...this._state,
      elapsedTime: this._state.elapsedTime + deltaTime,
    };
  }

  /**
   * Serialize the current game state to JSON
   * Requirements: 8.1, 8.3
   * @returns JSON string representation of the save data
   */
  serialize(): string {
    return serialize(this._state);
  }

  /**
   * Deserialize JSON and restore game state
   * Requirements: 8.2, 8.4
   * @param json - The JSON string to deserialize
   * @returns true if deserialization was successful
   */
  deserialize(json: string): boolean {
    const result = deserialize(json, this._state);
    if (result) {
      this._state = result;
      return true;
    }
    return false;
  }

  /**
   * Validate a JSON string as valid save data
   * Requirements: 8.4
   * @param json - The JSON string to validate
   * @returns true if the JSON is valid save data
   */
  validateState(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      return validateSaveData(parsed);
    } catch {
      return false;
    }
  }
}

/**
 * Create a new GameStateManager instance
 */
export function createGameStateManager(initialState?: GameState): GameStateManager {
  return new GameStateManager(initialState);
}
