'use client';

/**
 * StitchedHUD component for FrankenKiro game
 * Displays player stats with Frankenstein-themed stitched aesthetic
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import React from 'react';

interface StitchedHUDProps {
  /** Current player health */
  health: number;
  /** Maximum player health */
  maxHealth: number;
  /** Current ammunition count */
  ammunition: number;
  /** Current player score */
  score: number;
  /** Optional weapon sprite identifier */
  weaponSprite?: string;
}

/**
 * Halloween color palette
 */
const COLORS = {
  green: '#4ade80',       // Frankenstein green
  darkGreen: '#166534',   // Dark green
  purple: '#a855f7',      // Spooky purple
  darkPurple: '#581c87',  // Dark purple
  orange: '#fb923c',      // Pumpkin orange
  darkOrange: '#9a3412',  // Dark orange
  bone: '#fef3c7',        // Bone white
  blood: '#dc2626',       // Blood red
  darkBg: '#1a1a2e',      // Dark background
  seamColor: '#374151',   // Seam/stitch color
};

/**
 * Stitched panel styles - creates mismatched border effect
 */
const stitchedPanelBase: React.CSSProperties = {
  position: 'relative',
  padding: '8px 12px',
  backgroundColor: 'rgba(26, 26, 46, 0.9)',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.5), inset 0 0 5px rgba(0, 0, 0, 0.3)',
};


/**
 * Generate stitch pattern CSS
 */
function getStitchBorder(color: string, style: 'dashed' | 'dotted' | 'double'): React.CSSProperties {
  return {
    border: `3px ${style} ${color}`,
    borderRadius: style === 'double' ? '4px' : '2px',
  };
}

/**
 * Seam effect overlay component
 */
const SeamOverlay: React.FC<{ vertical?: boolean }> = ({ vertical = false }) => (
  <div
    style={{
      position: 'absolute',
      ...(vertical
        ? {
            top: 0,
            bottom: 0,
            left: '50%',
            width: '2px',
            background: `repeating-linear-gradient(
              to bottom,
              ${COLORS.seamColor} 0px,
              ${COLORS.seamColor} 4px,
              transparent 4px,
              transparent 8px
            )`,
          }
        : {
            left: 0,
            right: 0,
            top: '50%',
            height: '2px',
            background: `repeating-linear-gradient(
              to right,
              ${COLORS.seamColor} 0px,
              ${COLORS.seamColor} 4px,
              transparent 4px,
              transparent 8px
            )`,
          }),
    }}
  />
);

/**
 * Health bar component with stitched styling
 * Requirements: 6.1
 */
const HealthBar: React.FC<{ health: number; maxHealth: number }> = ({ health, maxHealth }) => {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const healthColor = healthPercent > 50 ? COLORS.green : healthPercent > 25 ? COLORS.orange : COLORS.blood;

  return (
    <div
      style={{
        ...stitchedPanelBase,
        ...getStitchBorder(COLORS.darkGreen, 'dashed'),
        transform: 'rotate(-1deg)',
        minWidth: '150px',
      }}
    >
      <SeamOverlay />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: COLORS.green, fontSize: '14px', fontWeight: 'bold' }}>❤</span>
        <div
          style={{
            flex: 1,
            height: '16px',
            backgroundColor: COLORS.darkBg,
            border: `2px solid ${COLORS.seamColor}`,
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${healthPercent}%`,
              height: '100%',
              backgroundColor: healthColor,
              transition: 'width 0.2s, background-color 0.2s',
              boxShadow: `0 0 8px ${healthColor}`,
            }}
          />
        </div>
        <span
          style={{
            color: COLORS.bone,
            fontSize: '14px',
            fontFamily: 'monospace',
            minWidth: '45px',
            textAlign: 'right',
          }}
        >
          {health}/{maxHealth}
        </span>
      </div>
    </div>
  );
};


/**
 * Ammo counter component with mismatched panel styling
 * Requirements: 6.2
 */
const AmmoCounter: React.FC<{ ammunition: number }> = ({ ammunition }) => {
  const isLow = ammunition <= 5;

  return (
    <div
      style={{
        ...stitchedPanelBase,
        ...getStitchBorder(COLORS.darkOrange, 'dotted'),
        transform: 'rotate(1.5deg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: COLORS.orange, fontSize: '16px' }}>🔫</span>
        <span
          style={{
            color: isLow ? COLORS.blood : COLORS.orange,
            fontSize: '18px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: isLow ? `0 0 8px ${COLORS.blood}` : 'none',
            animation: isLow ? 'pulse 1s infinite' : 'none',
          }}
        >
          {ammunition}
        </span>
      </div>
    </div>
  );
};

/**
 * Score display component with seam effects
 * Requirements: 6.3
 */
const ScoreDisplay: React.FC<{ score: number }> = ({ score }) => (
  <div
    style={{
      ...stitchedPanelBase,
      ...getStitchBorder(COLORS.darkPurple, 'double'),
      transform: 'rotate(-0.5deg)',
    }}
  >
    <SeamOverlay vertical />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: COLORS.purple, fontSize: '14px' }}>⭐</span>
      <span
        style={{
          color: COLORS.purple,
          fontSize: '18px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          letterSpacing: '2px',
        }}
      >
        {score.toString().padStart(6, '0')}
      </span>
    </div>
  </div>
);

/**
 * StitchedHUD component
 * Main HUD display with Frankenstein-themed styling
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export const StitchedHUD: React.FC<StitchedHUDProps> = ({
  health,
  maxHealth,
  ammunition,
  score,
}) => {
  return (
    <>
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div
        className="stitched-hud"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '10px 15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      >
        {/* Left side - Health */}
        <HealthBar health={health} maxHealth={maxHealth} />

        {/* Center - Score */}
        <ScoreDisplay score={score} />

        {/* Right side - Ammo */}
        <AmmoCounter ammunition={ammunition} />
      </div>
    </>
  );
};

export default StitchedHUD;
