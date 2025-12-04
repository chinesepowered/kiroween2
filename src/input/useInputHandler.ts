'use client';

/**
 * React hook for using InputHandler in components
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { InputHandler, createInputHandler } from './inputHandler';
import { GameAction, InputState } from './types';

/**
 * Hook to create and manage an InputHandler instance
 */
export function useInputHandler() {
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Initialize input handler
  useEffect(() => {
    inputHandlerRef.current = createInputHandler();
    inputHandlerRef.current.initialize();

    // Detect touch device
    const hasTouchSupport =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setIsTouchDevice(hasTouchSupport);

    if (hasTouchSupport) {
      inputHandlerRef.current.enableTouchControls();
    }

    return () => {
      inputHandlerRef.current?.destroy();
    };
  }, []);

  // Get current input state
  const getInputState = useCallback((): InputState => {
    return (
      inputHandlerRef.current?.getInputState() ?? {
        activeActions: new Set<GameAction>(),
        mousePosition: { x: 0, y: 0 },
      }
    );
  }, []);

  // Check if action is active
  const isActionActive = useCallback((action: GameAction): boolean => {
    return inputHandlerRef.current?.isActionActive(action) ?? false;
  }, []);

  // Trigger action (for touch controls)
  const triggerAction = useCallback((action: GameAction): void => {
    inputHandlerRef.current?.triggerAction(action);
  }, []);

  // Release action (for touch controls)
  const releaseAction = useCallback((action: GameAction): void => {
    inputHandlerRef.current?.releaseAction(action);
  }, []);

  // Bind key
  const bindKey = useCallback((key: string, action: GameAction): void => {
    inputHandlerRef.current?.bindKey(key, action);
  }, []);

  return {
    getInputState,
    isActionActive,
    triggerAction,
    releaseAction,
    bindKey,
    isTouchDevice,
    inputHandler: inputHandlerRef.current,
  };
}
