/**
 * Input handling types for FrankenKiro game
 */

import { Vector2 } from '@/engine/types';

/**
 * Game actions that can be triggered by input
 */
export type GameAction =
  | 'moveForward'
  | 'moveBackward'
  | 'turnLeft'
  | 'turnRight'
  | 'fire'
  | 'interact';

/**
 * Current state of all inputs
 */
export interface InputState {
  activeActions: Set<GameAction>;
  mousePosition: Vector2;
}

/**
 * Key binding configuration
 */
export interface KeyBindings {
  [key: string]: GameAction;
}
