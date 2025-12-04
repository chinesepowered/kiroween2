/**
 * Audio system types for FrankenKiro
 */

/**
 * Sound effect types available in the game
 */
export type SoundEffectType = 'fire' | 'hit' | 'pickup' | 'death' | 'enemyDeath' | 'damage';

/**
 * Audio manager configuration
 */
export interface AudioConfig {
  masterVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  enabled: boolean;
}

/**
 * Sound effect parameters for procedural generation
 */
export interface SoundParams {
  frequency: number;
  duration: number;
  type: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  volume: number;
}
