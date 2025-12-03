/**
 * Vector2 utility functions for 2D math operations
 */

import { Vector2 } from './types';

/**
 * Create a new Vector2
 */
export function vec2(x: number, y: number): Vector2 {
  return { x, y };
}

/**
 * Add two vectors
 */
export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract vector b from vector a
 */
export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiply a vector by a scalar
 */
export function multiply(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * Get the length/magnitude of a vector
 */
export function length(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize a vector (make it unit length)
 * Returns zero vector if input has zero length
 */
export function normalize(v: Vector2): Vector2 {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}


/**
 * Calculate the distance between two points
 */
export function distance(a: Vector2, b: Vector2): number {
  return length(subtract(b, a));
}

/**
 * Calculate the dot product of two vectors
 */
export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Get the angle of a vector in radians
 */
export function angle(v: Vector2): number {
  return Math.atan2(v.y, v.x);
}

/**
 * Rotate a vector by an angle in radians
 */
export function rotate(v: Vector2, angleRad: number): Vector2 {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

/**
 * Create a unit vector from an angle in radians
 */
export function fromAngle(angleRad: number): Vector2 {
  return {
    x: Math.cos(angleRad),
    y: Math.sin(angleRad),
  };
}

/**
 * Check if two vectors are equal (within epsilon tolerance)
 */
export function equals(a: Vector2, b: Vector2, epsilon: number = 0.0001): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

/**
 * Clamp a vector's components between min and max values
 */
export function clamp(v: Vector2, min: Vector2, max: Vector2): Vector2 {
  return {
    x: Math.max(min.x, Math.min(max.x, v.x)),
    y: Math.max(min.y, Math.min(max.y, v.y)),
  };
}
