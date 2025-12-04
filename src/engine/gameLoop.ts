/**
 * GameLoop module for FrankenKiro
 * Manages the main game loop using requestAnimationFrame with delta time calculation
 * Requirements: 2.4, 10.4
 */

/**
 * Configuration for the game loop
 */
export interface GameLoopConfig {
  /** Target frames per second (used for delta time capping) */
  targetFPS: number;
  /** Callback invoked each frame with delta time in seconds */
  onUpdate: (deltaTime: number) => void;
  /** Callback invoked each frame for rendering */
  onRender: () => void;
}

/**
 * Default game loop configuration
 */
export const DEFAULT_GAME_LOOP_CONFIG: Partial<GameLoopConfig> = {
  targetFPS: 60,
};

/**
 * Maximum delta time to prevent large jumps (e.g., when tab is inactive)
 * Capped at ~100ms to maintain minimum 10 FPS equivalent
 */
const MAX_DELTA_TIME = 0.1;

/**
 * GameLoop class manages the main game loop
 * Uses requestAnimationFrame for smooth rendering
 * Requirements: 2.4, 10.4
 */
export class GameLoop {
  private config: GameLoopConfig;
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private _isRunning: boolean = false;
  private _isPaused: boolean = false;
  private accumulatedTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private _currentFPS: number = 0;

  constructor(config: GameLoopConfig) {
    this.config = {
      ...DEFAULT_GAME_LOOP_CONFIG,
      ...config,
    } as GameLoopConfig;
  }

  /**
   * Check if the game loop is currently running
   */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Check if the game loop is paused
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Get the current measured FPS
   */
  get currentFPS(): number {
    return this._currentFPS;
  }


  /**
   * Start the game loop
   * Begins the requestAnimationFrame cycle
   */
  start(): void {
    if (this._isRunning) {
      return;
    }

    this._isRunning = true;
    this._isPaused = false;
    this.lastTimestamp = 0;
    this.accumulatedTime = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;

    // Start the loop
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * Stop the game loop completely
   * Cancels the animation frame and resets state
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this._isRunning = false;
    this._isPaused = false;
    this.lastTimestamp = 0;
  }

  /**
   * Pause the game loop
   * The loop continues running but update/render callbacks are not called
   */
  pause(): void {
    if (!this._isRunning) {
      return;
    }
    this._isPaused = true;
  }

  /**
   * Resume the game loop from a paused state
   * Resets the timestamp to prevent large delta time jumps
   */
  resume(): void {
    if (!this._isRunning) {
      return;
    }
    this._isPaused = false;
    // Reset timestamp to prevent large delta time after resume
    this.lastTimestamp = 0;
  }

  /**
   * The main loop function called by requestAnimationFrame
   * Calculates delta time and invokes update/render callbacks
   * @param timestamp - High-resolution timestamp from requestAnimationFrame
   */
  private loop(timestamp: number): void {
    if (!this._isRunning) {
      return;
    }

    // Schedule next frame immediately
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));

    // Calculate delta time
    let deltaTime = 0;
    if (this.lastTimestamp > 0) {
      // Convert from milliseconds to seconds
      deltaTime = (timestamp - this.lastTimestamp) / 1000;
      
      // Cap delta time to prevent large jumps
      deltaTime = Math.min(deltaTime, MAX_DELTA_TIME);
    }
    this.lastTimestamp = timestamp;

    // Update FPS counter
    this.updateFPSCounter(timestamp, deltaTime);

    // Skip update/render if paused
    if (this._isPaused) {
      return;
    }

    // Call update callback with delta time
    this.config.onUpdate(deltaTime);

    // Call render callback
    this.config.onRender();
  }

  /**
   * Update the FPS counter
   * Calculates average FPS over the last second
   */
  private updateFPSCounter(timestamp: number, deltaTime: number): void {
    this.frameCount++;
    this.accumulatedTime += deltaTime;

    // Update FPS every second
    if (this.accumulatedTime >= 1.0) {
      this._currentFPS = Math.round(this.frameCount / this.accumulatedTime);
      this.frameCount = 0;
      this.accumulatedTime = 0;
    }
  }

  /**
   * Update the configuration
   */
  setConfig(config: Partial<GameLoopConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get the current configuration
   */
  getConfig(): GameLoopConfig {
    return { ...this.config };
  }
}

/**
 * Create a new GameLoop instance
 * @param config - Configuration for the game loop
 * @returns A new GameLoop instance
 */
export function createGameLoop(config: GameLoopConfig): GameLoop {
  return new GameLoop(config);
}

/**
 * Create a simple game loop with just update and render callbacks
 * Uses default configuration
 */
export function createSimpleGameLoop(
  onUpdate: (deltaTime: number) => void,
  onRender: () => void
): GameLoop {
  return new GameLoop({
    targetFPS: 60,
    onUpdate,
    onRender,
  });
}
