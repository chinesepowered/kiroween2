/**
 * InputHandler module for FrankenKiro game
 * Processes keyboard and touch input, mapping to game actions
 */

import { GameAction, InputState, KeyBindings } from './types';

/**
 * Default key bindings for the game
 */
const DEFAULT_KEY_BINDINGS: KeyBindings = {
  // WASD controls
  'w': 'moveForward',
  'W': 'moveForward',
  's': 'moveBackward',
  'S': 'moveBackward',
  'a': 'turnLeft',
  'A': 'turnLeft',
  'd': 'turnRight',
  'D': 'turnRight',
  // Arrow key controls
  'ArrowUp': 'moveForward',
  'ArrowDown': 'moveBackward',
  'ArrowLeft': 'turnLeft',
  'ArrowRight': 'turnRight',
  // Action keys
  ' ': 'fire',
  'e': 'interact',
  'E': 'interact',
};

/**
 * InputHandler class manages keyboard and touch input
 */
export class InputHandler {
  private activeActions: Set<GameAction>;
  private mousePosition: { x: number; y: number };
  private keyBindings: KeyBindings;
  private touchControlsEnabled: boolean;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;

  constructor() {
    this.activeActions = new Set<GameAction>();
    this.mousePosition = { x: 0, y: 0 };
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS };
    this.touchControlsEnabled = false;

    // Bind event handlers
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
  }

  /**
   * Initialize event listeners
   * Call this when the game starts
   */
  public initialize(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
      window.addEventListener('mousemove', this.boundMouseMove);
      window.addEventListener('mousedown', this.boundMouseDown);
      window.addEventListener('mouseup', this.boundMouseUp);
    }
  }

  /**
   * Clean up event listeners
   * Call this when the game stops
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyDown);
      window.removeEventListener('keyup', this.boundKeyUp);
      window.removeEventListener('mousemove', this.boundMouseMove);
      window.removeEventListener('mousedown', this.boundMouseDown);
      window.removeEventListener('mouseup', this.boundMouseUp);
    }
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const action = this.keyBindings[event.key];
    if (action) {
      this.activeActions.add(action);
      event.preventDefault();
    }
  }

  /**
   * Handle keyup events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const action = this.keyBindings[event.key];
    if (action) {
      this.activeActions.delete(action);
    }
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(event: MouseEvent): void {
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
  }

  /**
   * Handle mouse down events (fire action)
   */
  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.activeActions.add('fire');
    }
  }

  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    if (event.button === 0) {
      this.activeActions.delete('fire');
    }
  }

  /**
   * Get the current input state
   */
  public getInputState(): InputState {
    return {
      activeActions: new Set(this.activeActions),
      mousePosition: { ...this.mousePosition },
    };
  }

  /**
   * Check if a specific action is currently active
   */
  public isActionActive(action: GameAction): boolean {
    return this.activeActions.has(action);
  }

  /**
   * Bind a key to a game action
   */
  public bindKey(key: string, action: GameAction): void {
    this.keyBindings[key] = action;
  }

  /**
   * Unbind a key
   */
  public unbindKey(key: string): void {
    delete this.keyBindings[key];
  }

  /**
   * Get current key bindings
   */
  public getKeyBindings(): KeyBindings {
    return { ...this.keyBindings };
  }

  /**
   * Reset key bindings to defaults
   */
  public resetKeyBindings(): void {
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS };
  }

  /**
   * Enable touch controls
   */
  public enableTouchControls(): void {
    this.touchControlsEnabled = true;
  }

  /**
   * Disable touch controls
   */
  public disableTouchControls(): void {
    this.touchControlsEnabled = false;
  }

  /**
   * Check if touch controls are enabled
   */
  public isTouchControlsEnabled(): boolean {
    return this.touchControlsEnabled;
  }

  /**
   * Trigger an action programmatically (used by touch controls)
   */
  public triggerAction(action: GameAction): void {
    this.activeActions.add(action);
  }

  /**
   * Release an action programmatically (used by touch controls)
   */
  public releaseAction(action: GameAction): void {
    this.activeActions.delete(action);
  }

  /**
   * Clear all active actions
   */
  public clearActions(): void {
    this.activeActions.clear();
  }
}

/**
 * Create a new InputHandler instance
 */
export function createInputHandler(): InputHandler {
  return new InputHandler();
}
