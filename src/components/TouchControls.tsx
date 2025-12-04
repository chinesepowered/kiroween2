'use client';

/**
 * TouchControls component for FrankenKiro game
 * Provides on-screen touch controls for mobile devices with stitched theme
 * Requirements: 10.1, 10.2
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { GameAction } from '@/input/types';

interface TouchControlsProps {
  onActionStart: (action: GameAction) => void;
  onActionEnd: (action: GameAction) => void;
  visible?: boolean;
}

/**
 * Halloween color palette for stitched theme
 */
const COLORS = {
  green: '#4ade80',
  darkGreen: '#166534',
  purple: '#a855f7',
  darkPurple: '#581c87',
  orange: '#fb923c',
  darkOrange: '#9a3412',
  bone: '#fef3c7',
  seamColor: '#374151',
};

interface TouchButtonProps {
  action: GameAction;
  label: string;
  onStart: (action: GameAction) => void;
  onEnd: (action: GameAction) => void;
  variant?: 'direction' | 'action';
  size?: 'normal' | 'large';
}

/**
 * Individual touch button component with stitched styling
 */
const TouchButton: React.FC<TouchButtonProps> = ({
  action,
  label,
  onStart,
  onEnd,
  variant = 'direction',
  size = 'normal',
}) => {
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      onStart(action);
    },
    [action, onStart]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      onEnd(action);
    },
    [action, onEnd]
  );


  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onStart(action);
    },
    [action, onStart]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onEnd(action);
    },
    [action, onEnd]
  );

  // Stitched theme styling based on variant
  const isAction = variant === 'action';
  const buttonSize = size === 'large' ? '70px' : '55px';
  const borderColor = isAction ? COLORS.orange : COLORS.green;
  const bgColor = isAction ? COLORS.darkOrange : COLORS.darkGreen;
  const textColor = isAction ? COLORS.orange : COLORS.green;

  return (
    <button
      className="touch-button"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => onEnd(action)}
      onTouchMove={(e) => e.preventDefault()}
      style={{
        width: buttonSize,
        height: buttonSize,
        borderRadius: '8px',
        border: `3px dashed ${borderColor}`,
        backgroundColor: `${bgColor}cc`,
        color: textColor,
        fontSize: size === 'large' ? '28px' : '22px',
        fontWeight: 'bold',
        cursor: 'pointer',
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 10px ${borderColor}40, inset 0 0 5px rgba(0,0,0,0.3)`,
        transition: 'transform 0.1s, box-shadow 0.1s',
        position: 'relative',
      }}
    >
      {/* Stitch decoration */}
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          right: '3px',
          height: '1px',
          background: `repeating-linear-gradient(
            to right,
            ${COLORS.seamColor} 0px,
            ${COLORS.seamColor} 3px,
            transparent 3px,
            transparent 6px
          )`,
        }}
      />
      {label}
    </button>
  );
};


/**
 * TouchControls component
 * Displays on-screen controls for touch-enabled devices with stitched theme
 * Requirements: 10.1, 10.2
 */
export const TouchControls: React.FC<TouchControlsProps> = ({
  onActionStart,
  onActionEnd,
  visible = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent default touch behavior on the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      container.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="touch-controls"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 20px',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* D-Pad for movement - stitched panel */}
      <div
        className="dpad-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 55px)',
          gridTemplateRows: 'repeat(3, 55px)',
          gap: '4px',
          pointerEvents: 'auto',
          padding: '10px',
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          borderRadius: '12px',
          border: `3px double ${COLORS.seamColor}`,
          boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Top row - Forward */}
        <div />
        <TouchButton
          action="moveForward"
          label="↑"
          onStart={onActionStart}
          onEnd={onActionEnd}
        />
        <div />

        {/* Middle row - Left and Right */}
        <TouchButton
          action="turnLeft"
          label="←"
          onStart={onActionStart}
          onEnd={onActionEnd}
        />
        <div />
        <TouchButton
          action="turnRight"
          label="→"
          onStart={onActionStart}
          onEnd={onActionEnd}
        />

        {/* Bottom row - Backward */}
        <div />
        <TouchButton
          action="moveBackward"
          label="↓"
          onStart={onActionStart}
          onEnd={onActionEnd}
        />
        <div />
      </div>

      {/* Action buttons - stitched panel */}
      <div
        className="action-buttons"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'auto',
          padding: '10px',
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          borderRadius: '12px',
          border: `3px double ${COLORS.seamColor}`,
          boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
        }}
      >
        <TouchButton
          action="fire"
          label="🔫"
          onStart={onActionStart}
          onEnd={onActionEnd}
          variant="action"
          size="large"
        />
        <TouchButton
          action="interact"
          label="E"
          onStart={onActionStart}
          onEnd={onActionEnd}
          variant="action"
        />
      </div>
    </div>
  );
};

export default TouchControls;
