'use client';

/**
 * WeaponSprite component - Renders a detailed weapon sprite
 * Replaces the simple emoji with a proper pixel-art style weapon
 */

import React, { useEffect, useRef } from 'react';

interface WeaponSpriteProps {
  /** Whether the weapon is currently firing */
  isFiring: boolean;
  /** Weapon type */
  weaponType?: 'pistol' | 'shotgun' | 'rifle';
}

/**
 * Draw a pixel-art style pistol
 */
function drawPistol(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isFiring: boolean
): void {
  const scale = Math.min(width, height) / 100;
  const centerX = width / 2;
  const bottomY = height;
  
  ctx.save();
  ctx.translate(centerX, bottomY);
  
  // Apply firing animation
  if (isFiring) {
    ctx.translate(0, -15 * scale);
    ctx.rotate(-0.1);
  }
  
  // Gun colors
  const metalDark = '#2a2a2a';
  const metalMid = '#4a4a4a';
  const metalLight = '#6a6a6a';
  const handleDark = '#3d2817';
  const handleMid = '#5c3d2a';
  const handleLight = '#7a5540';
  const muzzleFlash = '#ffaa00';
  
  // Draw muzzle flash when firing
  if (isFiring) {
    ctx.fillStyle = muzzleFlash;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 30 * scale;
    
    // Main flash
    ctx.beginPath();
    ctx.moveTo(-8 * scale, -85 * scale);
    ctx.lineTo(0, -120 * scale);
    ctx.lineTo(8 * scale, -85 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Side flashes
    ctx.beginPath();
    ctx.moveTo(-15 * scale, -80 * scale);
    ctx.lineTo(-25 * scale, -95 * scale);
    ctx.lineTo(-10 * scale, -85 * scale);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(15 * scale, -80 * scale);
    ctx.lineTo(25 * scale, -95 * scale);
    ctx.lineTo(10 * scale, -85 * scale);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }
  
  // Barrel
  ctx.fillStyle = metalDark;
  ctx.fillRect(-6 * scale, -80 * scale, 12 * scale, 35 * scale);
  
  // Barrel highlight
  ctx.fillStyle = metalLight;
  ctx.fillRect(-6 * scale, -80 * scale, 3 * scale, 35 * scale);
  
  // Barrel top (muzzle)
  ctx.fillStyle = metalMid;
  ctx.fillRect(-8 * scale, -85 * scale, 16 * scale, 8 * scale);
  
  // Slide
  ctx.fillStyle = metalDark;
  ctx.fillRect(-10 * scale, -50 * scale, 20 * scale, 25 * scale);
  
  // Slide serrations
  ctx.fillStyle = metalLight;
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(-8 * scale, (-48 + i * 4) * scale, 2 * scale, 2 * scale);
  }
  
  // Ejection port
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(2 * scale, -45 * scale, 6 * scale, 12 * scale);
  
  // Frame
  ctx.fillStyle = metalMid;
  ctx.fillRect(-10 * scale, -28 * scale, 20 * scale, 15 * scale);
  
  // Trigger guard
  ctx.fillStyle = metalDark;
  ctx.beginPath();
  ctx.moveTo(-8 * scale, -15 * scale);
  ctx.lineTo(-12 * scale, -5 * scale);
  ctx.lineTo(-12 * scale, 5 * scale);
  ctx.lineTo(-4 * scale, 5 * scale);
  ctx.lineTo(-4 * scale, -15 * scale);
  ctx.closePath();
  ctx.fill();
  
  // Trigger
  ctx.fillStyle = metalLight;
  ctx.fillRect(-7 * scale, -10 * scale, 3 * scale, 12 * scale);
  
  // Handle/Grip
  ctx.fillStyle = handleDark;
  ctx.beginPath();
  ctx.moveTo(-10 * scale, -15 * scale);
  ctx.lineTo(-14 * scale, 30 * scale);
  ctx.lineTo(14 * scale, 30 * scale);
  ctx.lineTo(10 * scale, -15 * scale);
  ctx.closePath();
  ctx.fill();
  
  // Handle texture (grip lines)
  ctx.fillStyle = handleMid;
  for (let i = 0; i < 8; i++) {
    const y = (-10 + i * 5) * scale;
    ctx.fillRect(-12 * scale, y, 24 * scale, 2 * scale);
  }
  
  // Handle highlight
  ctx.fillStyle = handleLight;
  ctx.beginPath();
  ctx.moveTo(-10 * scale, -15 * scale);
  ctx.lineTo(-12 * scale, 25 * scale);
  ctx.lineTo(-8 * scale, 25 * scale);
  ctx.lineTo(-6 * scale, -15 * scale);
  ctx.closePath();
  ctx.fill();
  
  // Magazine base
  ctx.fillStyle = metalDark;
  ctx.fillRect(-8 * scale, 25 * scale, 16 * scale, 8 * scale);
  
  // Sight (front)
  ctx.fillStyle = metalLight;
  ctx.fillRect(-2 * scale, -88 * scale, 4 * scale, 5 * scale);
  
  // Sight (rear)
  ctx.fillRect(-8 * scale, -53 * scale, 4 * scale, 5 * scale);
  ctx.fillRect(4 * scale, -53 * scale, 4 * scale, 5 * scale);
  
  ctx.restore();
}

/**
 * WeaponSprite component
 */
export const WeaponSprite: React.FC<WeaponSpriteProps> = ({
  isFiring,
  weaponType = 'pistol',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw weapon based on type
    switch (weaponType) {
      case 'pistol':
      default:
        drawPistol(ctx, canvas.width, canvas.height, isFiring);
        break;
    }
  }, [isFiring, weaponType]);
  
  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{
        width: '150px',
        height: '150px',
        imageRendering: 'pixelated',
        filter: isFiring ? 'brightness(1.3)' : 'brightness(1)',
        transition: 'filter 0.1s ease-out',
      }}
    />
  );
};

export default WeaponSprite;
