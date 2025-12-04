'use client';

/**
 * GameCanvas component for FrankenKiro game
 * Handles canvas rendering with aspect ratio preservation
 * Requirements: 10.3
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface GameCanvasProps {
  /** Base width for the game canvas */
  baseWidth?: number;
  /** Base height for the game canvas */
  baseHeight?: number;
  /** Callback when canvas context is ready */
  onContextReady?: (ctx: CanvasRenderingContext2D) => void;
  /** Callback for each render frame */
  onRender?: (ctx: CanvasRenderingContext2D, deltaTime: number) => void;
  /** Whether the game loop should be running */
  isRunning?: boolean;
  /** Custom class name */
  className?: string;
  /** Screen shake intensity (0 = no shake) */
  shakeIntensity?: number;
}

/**
 * Calculate scaled dimensions while preserving aspect ratio
 */
function calculateScaledDimensions(
  baseWidth: number,
  baseHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number; scale: number } {
  const aspectRatio = baseWidth / baseHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  let width: number;
  let height: number;
  let scale: number;

  if (containerAspectRatio > aspectRatio) {
    // Container is wider than canvas aspect ratio
    height = containerHeight;
    width = height * aspectRatio;
    scale = containerHeight / baseHeight;
  } else {
    // Container is taller than canvas aspect ratio
    width = containerWidth;
    height = width / aspectRatio;
    scale = containerWidth / baseWidth;
  }

  return { width, height, scale };
}

/**
 * GameCanvas component
 * Renders the game with proper aspect ratio preservation on resize
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({
  baseWidth = 640,
  baseHeight = 480,
  onContextReady,
  onRender,
  isRunning = true,
  className = '',
  shakeIntensity = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: baseWidth, height: baseHeight });
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });

  /**
   * Update screen shake effect
   */
  useEffect(() => {
    if (shakeIntensity <= 0) {
      setShakeOffset({ x: 0, y: 0 });
      return;
    }

    const shakeInterval = setInterval(() => {
      const offsetX = (Math.random() - 0.5) * 2 * shakeIntensity;
      const offsetY = (Math.random() - 0.5) * 2 * shakeIntensity;
      setShakeOffset({ x: offsetX, y: offsetY });
    }, 50);

    return () => clearInterval(shakeInterval);
  }, [shakeIntensity]);


  /**
   * Handle window resize to maintain aspect ratio
   */
  const handleResize = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const { width, height } = calculateScaledDimensions(
      baseWidth,
      baseHeight,
      containerRect.width,
      containerRect.height
    );

    setDimensions({ width, height });
  }, [baseWidth, baseHeight]);

  /**
   * Initialize canvas context
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('GameCanvas: Failed to get 2D context');
      return;
    }

    contextRef.current = ctx;

    // Set internal canvas resolution to base dimensions
    canvas.width = baseWidth;
    canvas.height = baseHeight;

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    if (onContextReady) {
      onContextReady(ctx);
    }
  }, [baseWidth, baseHeight, onContextReady]);

  /**
   * Set up resize observer
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial resize
    handleResize();

    // Set up ResizeObserver for responsive sizing
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(container);

    // Also listen to window resize as fallback
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  /**
   * Game loop
   */
  useEffect(() => {
    if (!isRunning || !onRender || !contextRef.current) {
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (!contextRef.current) return;

      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = timestamp;

      // Cap delta time to prevent large jumps
      const cappedDeltaTime = Math.min(deltaTime, 0.1);

      onRender(contextRef.current, cappedDeltaTime);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, onRender]);

  return (
    <div
      ref={containerRef}
      className={`game-canvas-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          imageRendering: 'pixelated',
          transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
          transition: shakeIntensity > 0 ? 'none' : 'transform 0.1s ease-out',
        }}
      />
    </div>
  );
};

export default GameCanvas;

// Export utility function for testing
export { calculateScaledDimensions };
