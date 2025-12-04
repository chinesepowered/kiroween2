'use client';

/**
 * GameMenu component for FrankenKiro game
 * Provides main menu, pause menu, game over, and victory screens
 * Requirements: 7.3, 8.1, 8.2
 */

import React from 'react';
import { GameStatus } from '@/game/types';

interface GameMenuProps {
  /** Current game status */
  status: GameStatus;
  /** Final score (for game over/victory screens) */
  score?: number;
  /** Callback when start game is clicked */
  onStartGame?: () => void;
  /** Callback when resume is clicked */
  onResume?: () => void;
  /** Callback when save is clicked */
  onSave?: () => void;
  /** Callback when load is clicked */
  onLoad?: () => void;
  /** Callback when quit to menu is clicked */
  onQuit?: () => void;
  /** Callback when restart is clicked */
  onRestart?: () => void;
}

/**
 * Halloween color palette
 */
const COLORS = {
  green: '#4ade80',
  darkGreen: '#166534',
  purple: '#a855f7',
  darkPurple: '#581c87',
  orange: '#fb923c',
  darkOrange: '#9a3412',
  bone: '#fef3c7',
  blood: '#dc2626',
  darkBg: 'rgba(26, 26, 46, 0.95)',
  seamColor: '#374151',
};


/**
 * Stitched button component
 */
const StitchedButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', disabled = false }) => {
  const colors = {
    primary: { bg: COLORS.darkGreen, border: COLORS.green, text: COLORS.green },
    secondary: { bg: COLORS.darkPurple, border: COLORS.purple, text: COLORS.purple },
    danger: { bg: '#7f1d1d', border: COLORS.blood, text: COLORS.blood },
  };

  const { bg, border, text } = colors[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '12px 24px',
        fontSize: '18px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color: text,
        backgroundColor: bg,
        border: `3px dashed ${border}`,
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: 'rotate(-0.5deg)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        boxShadow: `0 0 10px ${border}40`,
        minWidth: '200px',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'rotate(0.5deg) scale(1.05)';
          e.currentTarget.style.boxShadow = `0 0 20px ${border}80`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'rotate(-0.5deg)';
        e.currentTarget.style.boxShadow = `0 0 10px ${border}40`;
      }}
    >
      {children}
    </button>
  );
};

/**
 * Menu panel wrapper with stitched styling
 */
const MenuPanel: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
    }}
  >
    <div
      style={{
        backgroundColor: COLORS.darkBg,
        border: `4px double ${COLORS.seamColor}`,
        borderRadius: '8px',
        padding: '40px',
        minWidth: '350px',
        textAlign: 'center',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.8)',
        position: 'relative',
      }}
    >
      {/* Decorative stitches */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          height: '2px',
          background: `repeating-linear-gradient(
            to right,
            ${COLORS.seamColor} 0px,
            ${COLORS.seamColor} 6px,
            transparent 6px,
            transparent 12px
          )`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          right: '10px',
          height: '2px',
          background: `repeating-linear-gradient(
            to right,
            ${COLORS.seamColor} 0px,
            ${COLORS.seamColor} 6px,
            transparent 6px,
            transparent 12px
          )`,
        }}
      />

      {title && (
        <h2
          style={{
            color: COLORS.orange,
            fontSize: '32px',
            fontFamily: 'monospace',
            marginBottom: '30px',
            textShadow: `0 0 10px ${COLORS.orange}`,
            letterSpacing: '4px',
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  </div>
);


/**
 * Main menu screen
 */
const MainMenu: React.FC<{
  onStartGame?: () => void;
  onLoad?: () => void;
}> = ({ onStartGame, onLoad }) => (
  <MenuPanel>
    <h1
      style={{
        color: COLORS.green,
        fontSize: '48px',
        fontFamily: 'monospace',
        marginBottom: '10px',
        textShadow: `0 0 20px ${COLORS.green}`,
        letterSpacing: '6px',
      }}
    >
      FRANKENKIRO
    </h1>
    <p
      style={{
        color: COLORS.bone,
        fontSize: '14px',
        marginBottom: '40px',
        opacity: 0.7,
      }}
    >
      A Halloween DOOM-style Adventure
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
      <StitchedButton onClick={onStartGame} variant="primary">
        🎃 START GAME
      </StitchedButton>
      <StitchedButton onClick={onLoad} variant="secondary">
        📂 LOAD GAME
      </StitchedButton>
    </div>
  </MenuPanel>
);

/**
 * Pause menu screen
 */
const PauseMenu: React.FC<{
  onResume?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onQuit?: () => void;
}> = ({ onResume, onSave, onLoad, onQuit }) => (
  <MenuPanel title="⏸ PAUSED">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
      <StitchedButton onClick={onResume} variant="primary">
        ▶ RESUME
      </StitchedButton>
      <StitchedButton onClick={onSave} variant="secondary">
        💾 SAVE GAME
      </StitchedButton>
      <StitchedButton onClick={onLoad} variant="secondary">
        📂 LOAD GAME
      </StitchedButton>
      <StitchedButton onClick={onQuit} variant="danger">
        🚪 QUIT TO MENU
      </StitchedButton>
    </div>
  </MenuPanel>
);

/**
 * Game over screen
 */
const GameOverScreen: React.FC<{
  score?: number;
  onRestart?: () => void;
  onQuit?: () => void;
}> = ({ score = 0, onRestart, onQuit }) => (
  <MenuPanel title="💀 GAME OVER">
    <p
      style={{
        color: COLORS.blood,
        fontSize: '24px',
        fontFamily: 'monospace',
        marginBottom: '20px',
      }}
    >
      You have been defeated...
    </p>
    <p
      style={{
        color: COLORS.purple,
        fontSize: '20px',
        fontFamily: 'monospace',
        marginBottom: '30px',
      }}
    >
      Final Score: <span style={{ color: COLORS.orange }}>{score.toString().padStart(6, '0')}</span>
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
      <StitchedButton onClick={onRestart} variant="primary">
        🔄 TRY AGAIN
      </StitchedButton>
      <StitchedButton onClick={onQuit} variant="secondary">
        🚪 MAIN MENU
      </StitchedButton>
    </div>
  </MenuPanel>
);

/**
 * Victory screen
 */
const VictoryScreen: React.FC<{
  score?: number;
  onRestart?: () => void;
  onQuit?: () => void;
}> = ({ score = 0, onRestart, onQuit }) => (
  <MenuPanel title="🏆 VICTORY!">
    <p
      style={{
        color: COLORS.green,
        fontSize: '24px',
        fontFamily: 'monospace',
        marginBottom: '20px',
      }}
    >
      You have conquered the darkness!
    </p>
    <p
      style={{
        color: COLORS.purple,
        fontSize: '20px',
        fontFamily: 'monospace',
        marginBottom: '30px',
      }}
    >
      Final Score: <span style={{ color: COLORS.orange }}>{score.toString().padStart(6, '0')}</span>
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
      <StitchedButton onClick={onRestart} variant="primary">
        🎃 PLAY AGAIN
      </StitchedButton>
      <StitchedButton onClick={onQuit} variant="secondary">
        🚪 MAIN MENU
      </StitchedButton>
    </div>
  </MenuPanel>
);


/**
 * GameMenu component
 * Renders appropriate menu based on game status
 */
export const GameMenu: React.FC<GameMenuProps> = ({
  status,
  score = 0,
  onStartGame,
  onResume,
  onSave,
  onLoad,
  onQuit,
  onRestart,
}) => {
  switch (status) {
    case 'menu':
      return <MainMenu onStartGame={onStartGame} onLoad={onLoad} />;

    case 'paused':
      return (
        <PauseMenu
          onResume={onResume}
          onSave={onSave}
          onLoad={onLoad}
          onQuit={onQuit}
        />
      );

    case 'gameOver':
      return (
        <GameOverScreen
          score={score}
          onRestart={onRestart}
          onQuit={onQuit}
        />
      );

    case 'victory':
      return (
        <VictoryScreen
          score={score}
          onRestart={onRestart}
          onQuit={onQuit}
        />
      );

    case 'playing':
    default:
      return null;
  }
};

export default GameMenu;
