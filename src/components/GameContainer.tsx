'use client';

/**
 * GameContainer component for FrankenKiro
 * Wires together all game systems and manages game state with React
 * Requirements: All
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { StitchedHUD } from './StitchedHUD';
import { GameMenu } from './GameMenu';
import { TouchControls } from './TouchControls';
import { useInputHandler } from '@/input/useInputHandler';
import { GameLoop, createGameLoop } from '@/engine/gameLoop';
import { GameRenderer } from '@/engine/renderer';
import { CollisionSystem, moveWithCollision } from '@/engine/collision';
import { fromAngle } from '@/engine/vector2';
import {
  GameState,
  GameStatus,
  Player,
  Enemy,
  GameItem,
  LevelMap,
} from '@/game/types';
import {
  createPlayer,
  moveForward,
  moveBackward,
  rotateLeft,
  rotateRight,
  takeDamage,
  fire,
  addScore,
  setPosition,
  isDead as isPlayerDead,
} from '@/game/player';
import { EnemyManager, createEnemyManager } from '@/game/enemyManager';
import { processItems, createItemsFromSpawns } from '@/game/item';
import { isAtExitPoint, hasNextLevel, isFinalLevel } from '@/game/level';
import { LEVEL_LAB, LEVEL_DUNGEON } from '@/game/levels';
import {
  serialize,
  deserialize,
  createDefaultGameState,
} from '@/game/gameStateManager';
import { GameAction } from '@/input/types';

/**
 * Available game levels
 */
const GAME_LEVELS: LevelMap[] = [LEVEL_LAB, LEVEL_DUNGEON];

/**
 * Local storage key for save data
 */
const SAVE_KEY = 'frankenkiro_save';

/**
 * Player collision radius
 */
const PLAYER_RADIUS = 0.3;


/**
 * Attack cooldown tracking for enemies
 */
const ENEMY_ATTACK_COOLDOWN = 1.0; // seconds

interface GameContainerProps {
  /** Initial game status */
  initialStatus?: GameStatus;
}

/**
 * GameContainer component
 * Main game orchestration component that wires together all systems
 */
export const GameContainer: React.FC<GameContainerProps> = ({
  initialStatus = 'menu',
}) => {
  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>(initialStatus);
  const [player, setPlayer] = useState<Player>(() => createPlayer({ x: 2.5, y: 2.5 }, 0));
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [items, setItems] = useState<GameItem[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levelMap, setLevelMap] = useState<LevelMap>(GAME_LEVELS[0]);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Notification state for save/load feedback
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Screen shake state for damage feedback
  const [screenShake, setScreenShake] = useState(0);
  
  // Weapon animation state
  const [weaponAnimating, setWeaponAnimating] = useState(false);

  // Refs for game systems (not React state to avoid re-renders)
  const gameLoopRef = useRef<GameLoop | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const enemyManagerRef = useRef<EnemyManager>(createEnemyManager());
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const attackCooldownRef = useRef<number>(0);
  
  // Refs for callbacks to avoid stale closures in game loop
  const handleUpdateRef = useRef<(deltaTime: number) => void>(() => {});
  const handleRenderRef = useRef<() => void>(() => {});

  // Input handling
  const {
    getInputState,
    triggerAction,
    releaseAction,
    isTouchDevice,
  } = useInputHandler();

  // Refs for current state (to avoid stale closures in game loop)
  const playerRef = useRef(player);
  const enemiesRef = useRef(enemies);
  const itemsRef = useRef(items);
  const levelMapRef = useRef(levelMap);
  const gameStatusRef = useRef(gameStatus);
  const currentLevelRef = useRef(currentLevel);
  const elapsedTimeRef = useRef(elapsedTime);

  // Keep refs in sync with state
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { levelMapRef.current = levelMap; }, [levelMap]);
  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);
  useEffect(() => { currentLevelRef.current = currentLevel; }, [currentLevel]);
  useEffect(() => { elapsedTimeRef.current = elapsedTime; }, [elapsedTime]);


  /**
   * Initialize a level with enemies and items
   */
  const initializeLevel = useCallback((levelIndex: number, preserveScore: boolean = false) => {
    const level = GAME_LEVELS[levelIndex];
    if (!level) return;

    // Reset player position to spawn point
    const newPlayer = createPlayer(level.playerSpawn, 0);
    if (preserveScore) {
      newPlayer.stats.score = playerRef.current.stats.score;
    }
    setPlayer(newPlayer);
    playerRef.current = newPlayer;

    // Set level map
    setLevelMap(level);
    levelMapRef.current = level;
    setCurrentLevel(levelIndex);
    currentLevelRef.current = levelIndex;

    // Spawn enemies
    const manager = enemyManagerRef.current;
    manager.clear();
    manager.spawnFromLevel(level.enemySpawns);
    setEnemies(manager.getEnemies());
    enemiesRef.current = manager.getEnemies();

    // Create items
    const newItems = createItemsFromSpawns(level.items);
    setItems(newItems);
    itemsRef.current = newItems;

    // Reset attack cooldown
    attackCooldownRef.current = 0;
  }, []);

  /**
   * Handle game update (called each frame)
   */
  const handleUpdate = useCallback((deltaTime: number) => {
    if (gameStatusRef.current !== 'playing') return;

    const inputState = getInputState();
    let currentPlayer = playerRef.current;
    const level = levelMapRef.current;

    // Update elapsed time
    const newElapsedTime = elapsedTimeRef.current + deltaTime;
    setElapsedTime(newElapsedTime);
    elapsedTimeRef.current = newElapsedTime;

    // Handle player movement
    if (inputState.activeActions.has('moveForward')) {
      currentPlayer = moveForward(currentPlayer, deltaTime);
    }
    if (inputState.activeActions.has('moveBackward')) {
      currentPlayer = moveBackward(currentPlayer, deltaTime);
    }
    if (inputState.activeActions.has('turnLeft')) {
      currentPlayer = rotateLeft(currentPlayer, deltaTime);
    }
    if (inputState.activeActions.has('turnRight')) {
      currentPlayer = rotateRight(currentPlayer, deltaTime);
    }

    // Apply collision detection to player movement
    const resolvedPosition = moveWithCollision(
      playerRef.current.position,
      currentPlayer.position,
      PLAYER_RADIUS,
      level
    );
    currentPlayer = setPosition(currentPlayer, resolvedPosition);

    // Handle firing
    if (inputState.activeActions.has('fire')) {
      const fireResult = fire(currentPlayer);
      if (fireResult.success) {
        currentPlayer = fireResult.player;
        
        // Trigger weapon animation
        setWeaponAnimating(true);
        setTimeout(() => setWeaponAnimating(false), 150);
        
        // Check for enemy hits (simple raycast-based hit detection)
        const direction = fromAngle(currentPlayer.rotation);
        const manager = enemyManagerRef.current;
        const closestEnemy = manager.findClosestEnemy(
          currentPlayer.position,
          currentPlayer.currentWeapon.range
        );
        if (closestEnemy) {
          const scoreIncrease = manager.damageEnemy(
            closestEnemy.id,
            currentPlayer.currentWeapon.damage
          );
          if (scoreIncrease > 0) {
            currentPlayer = addScore(currentPlayer, scoreIncrease);
          }
          setEnemies(manager.getEnemies());
          enemiesRef.current = manager.getEnemies();
        }
      }
    }


    // Update enemies
    const manager = enemyManagerRef.current;
    const enemyResult = manager.update(currentPlayer, level, deltaTime);
    setEnemies(manager.getEnemies());
    enemiesRef.current = manager.getEnemies();

    // Apply enemy damage to player (with cooldown)
    attackCooldownRef.current -= deltaTime;
    if (enemyResult.totalDamageToPlayer > 0 && attackCooldownRef.current <= 0) {
      currentPlayer = takeDamage(currentPlayer, enemyResult.totalDamageToPlayer);
      attackCooldownRef.current = ENEMY_ATTACK_COOLDOWN;
      
      // Trigger screen shake on damage
      setScreenShake(8);
      setTimeout(() => setScreenShake(0), 200);
    }

    // Process item collection
    const itemResult = processItems(currentPlayer, itemsRef.current);
    if (itemResult.collectedCount > 0) {
      currentPlayer = itemResult.player;
      setItems(itemResult.items);
      itemsRef.current = itemResult.items;
    }

    // Check for player death
    if (isPlayerDead(currentPlayer)) {
      setGameStatus('gameOver');
      gameStatusRef.current = 'gameOver';
      gameLoopRef.current?.pause();
    }

    // Check for level exit
    if (isAtExitPoint(currentPlayer.position, level)) {
      const nextLevelIndex = currentLevelRef.current + 1;
      if (nextLevelIndex < GAME_LEVELS.length) {
        // Load next level
        initializeLevel(nextLevelIndex, true);
      } else {
        // Victory!
        setGameStatus('victory');
        gameStatusRef.current = 'victory';
        gameLoopRef.current?.pause();
      }
    }

    // Update player state
    setPlayer(currentPlayer);
    playerRef.current = currentPlayer;
  }, [getInputState, initializeLevel]);

  /**
   * Handle game render (called each frame)
   */
  const handleRender = useCallback(() => {
    if (!rendererRef.current || !canvasContextRef.current) return;
    if (gameStatusRef.current !== 'playing') return;

    rendererRef.current.render(
      playerRef.current,
      levelMapRef.current,
      enemiesRef.current,
      itemsRef.current
    );
  }, []);

  // Keep callback refs updated
  useEffect(() => {
    handleUpdateRef.current = handleUpdate;
  }, [handleUpdate]);
  
  useEffect(() => {
    handleRenderRef.current = handleRender;
  }, [handleRender]);

  /**
   * Initialize game loop and renderer
   */
  useEffect(() => {
    // Create renderer
    rendererRef.current = new GameRenderer({
      screenWidth: 640,
      screenHeight: 480,
      fov: Math.PI / 3,
      maxRenderDistance: 20,
    });

    // Create game loop with wrapper functions that call the refs
    gameLoopRef.current = createGameLoop({
      targetFPS: 60,
      onUpdate: (deltaTime: number) => handleUpdateRef.current(deltaTime),
      onRender: () => handleRenderRef.current(),
    });

    return () => {
      gameLoopRef.current?.stop();
    };
  }, []); // Empty deps - only create once


  /**
   * Handle canvas context ready
   */
  const handleContextReady = useCallback((ctx: CanvasRenderingContext2D) => {
    canvasContextRef.current = ctx;
    if (rendererRef.current) {
      rendererRef.current.setContext(ctx);
    }
  }, []);

  /**
   * Handle canvas render callback
   */
  const handleCanvasRender = useCallback((ctx: CanvasRenderingContext2D, deltaTime: number) => {
    // Rendering is handled by the game loop, not the canvas component
  }, []);

  /**
   * Start a new game
   */
  const handleStartGame = useCallback(() => {
    initializeLevel(0, false);
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    setGameStatus('playing');
    gameStatusRef.current = 'playing';
    gameLoopRef.current?.start();
  }, [initializeLevel]);

  /**
   * Resume from pause
   */
  const handleResume = useCallback(() => {
    setGameStatus('playing');
    gameStatusRef.current = 'playing';
    gameLoopRef.current?.resume();
  }, []);

  /**
   * Pause the game
   */
  const handlePause = useCallback(() => {
    setGameStatus('paused');
    gameStatusRef.current = 'paused';
    gameLoopRef.current?.pause();
  }, []);

  /**
   * Show notification with auto-dismiss
   */
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  /**
   * Save game to localStorage
   * Requirements: 8.1, 8.2
   */
  const handleSave = useCallback(() => {
    const gameState: GameState = {
      status: 'playing',
      player: playerRef.current,
      enemies: enemiesRef.current,
      items: itemsRef.current,
      currentLevel: currentLevelRef.current,
      levelMap: levelMapRef.current,
      elapsedTime: elapsedTimeRef.current,
    };
    const saveData = serialize(gameState);
    try {
      localStorage.setItem(SAVE_KEY, saveData);
      showNotification('💾 Game saved successfully!', 'success');
    } catch (e) {
      console.error('Failed to save game:', e);
      showNotification('❌ Failed to save game', 'error');
    }
  }, [showNotification]);

  /**
   * Load game from localStorage
   * Requirements: 8.1, 8.2
   */
  const handleLoad = useCallback(() => {
    try {
      const saveData = localStorage.getItem(SAVE_KEY);
      if (!saveData) {
        showNotification('📂 No save data found', 'error');
        return;
      }

      // Create a temporary state to deserialize into
      const tempState = createDefaultGameState();
      const loadedState = deserialize(saveData, tempState);
      
      if (loadedState) {
        // Restore the level first
        const levelIndex = loadedState.currentLevel;
        if (levelIndex >= 0 && levelIndex < GAME_LEVELS.length) {
          setLevelMap(GAME_LEVELS[levelIndex]);
          levelMapRef.current = GAME_LEVELS[levelIndex];
          setCurrentLevel(levelIndex);
          currentLevelRef.current = levelIndex;
        }

        // Restore player
        setPlayer(loadedState.player);
        playerRef.current = loadedState.player;

        // Restore enemies (re-spawn from level and apply saved state)
        const manager = enemyManagerRef.current;
        manager.clear();
        manager.spawnFromLevel(GAME_LEVELS[levelIndex].enemySpawns);
        // Apply saved enemy states
        const savedEnemies = manager.getEnemies();
        setEnemies(savedEnemies);
        enemiesRef.current = savedEnemies;

        // Restore items
        const newItems = createItemsFromSpawns(GAME_LEVELS[levelIndex].items);
        // Mark collected items
        const collectedIds = loadedState.items
          .filter(i => i.collected)
          .map(i => i.id);
        const restoredItems = newItems.map(item => ({
          ...item,
          collected: collectedIds.includes(item.id),
        }));
        setItems(restoredItems);
        itemsRef.current = restoredItems;

        // Restore elapsed time
        setElapsedTime(loadedState.elapsedTime);
        elapsedTimeRef.current = loadedState.elapsedTime;

        // Start playing
        setGameStatus('playing');
        gameStatusRef.current = 'playing';
        gameLoopRef.current?.start();

        showNotification('📂 Game loaded successfully!', 'success');
      } else {
        showNotification('❌ Invalid save data', 'error');
      }
    } catch (e) {
      console.error('Failed to load game:', e);
      showNotification('❌ Failed to load game', 'error');
    }
  }, [showNotification]);


  /**
   * Quit to main menu
   */
  const handleQuit = useCallback(() => {
    gameLoopRef.current?.stop();
    setGameStatus('menu');
    gameStatusRef.current = 'menu';
  }, []);

  /**
   * Restart the game
   */
  const handleRestart = useCallback(() => {
    gameLoopRef.current?.stop();
    handleStartGame();
  }, [handleStartGame]);

  /**
   * Handle keyboard pause (Escape key)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameStatusRef.current === 'playing') {
          handlePause();
        } else if (gameStatusRef.current === 'paused') {
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePause, handleResume]);

  /**
   * Handle touch control actions
   */
  const handleTouchActionStart = useCallback((action: GameAction) => {
    triggerAction(action);
  }, [triggerAction]);

  const handleTouchActionEnd = useCallback((action: GameAction) => {
    releaseAction(action);
  }, [releaseAction]);

  return (
    <div
      className="game-container"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      {/* Game Canvas */}
      <GameCanvas
        baseWidth={640}
        baseHeight={480}
        onContextReady={handleContextReady}
        onRender={handleCanvasRender}
        isRunning={gameStatus === 'playing'}
        shakeIntensity={screenShake}
      />

      {/* Weapon sprite overlay - only show when playing */}
      {gameStatus === 'playing' && (
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: `translateX(-50%) ${weaponAnimating ? 'translateY(-20px) scale(1.1)' : 'translateY(0) scale(1)'}`,
            transition: 'transform 0.1s ease-out',
            fontSize: '80px',
            textShadow: weaponAnimating ? '0 0 30px #ff6600, 0 0 60px #ff3300' : '0 0 10px #333',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          🔫
        </div>
      )}

      {/* HUD - only show when playing */}
      {gameStatus === 'playing' && (
        <StitchedHUD
          health={player.stats.health}
          maxHealth={player.stats.maxHealth}
          ammunition={player.stats.ammunition}
          score={player.stats.score}
        />
      )}

      {/* Touch Controls - only show on touch devices when playing */}
      {isTouchDevice && gameStatus === 'playing' && (
        <TouchControls
          onActionStart={handleTouchActionStart}
          onActionEnd={handleTouchActionEnd}
          visible={true}
        />
      )}

      {/* Game Menu - handles all menu states */}
      <GameMenu
        status={gameStatus}
        score={player.stats.score}
        onStartGame={handleStartGame}
        onResume={handleResume}
        onSave={handleSave}
        onLoad={handleLoad}
        onQuit={handleQuit}
        onRestart={handleRestart}
      />

      {/* Notification display for save/load feedback */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            backgroundColor: notification.type === 'success' ? '#166534' : '#7f1d1d',
            border: `2px dashed ${notification.type === 'success' ? '#4ade80' : '#dc2626'}`,
            borderRadius: '4px',
            color: notification.type === 'success' ? '#4ade80' : '#dc2626',
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 2000,
            boxShadow: `0 0 20px ${notification.type === 'success' ? '#4ade8040' : '#dc262640'}`,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default GameContainer;
