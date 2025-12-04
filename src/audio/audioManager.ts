/**
 * AudioManager module for FrankenKiro
 * Implements Web Audio API sound synthesis with procedural sound effects
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { AudioConfig, SoundEffectType, SoundParams } from './types';

/**
 * Default audio configuration
 */
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  ambientVolume: 0.3,
  enabled: true,
};

/**
 * Sound effect parameter definitions for procedural generation
 */
const SOUND_EFFECTS: Record<SoundEffectType, SoundParams> = {
  fire: {
    frequency: 150,
    duration: 0.15,
    type: 'sawtooth',
    attack: 0.01,
    decay: 0.05,
    sustain: 0.3,
    release: 0.09,
    volume: 0.6,
  },
  hit: {
    frequency: 200,
    duration: 0.1,
    type: 'square',
    attack: 0.005,
    decay: 0.03,
    sustain: 0.2,
    release: 0.065,
    volume: 0.5,
  },
  pickup: {
    frequency: 440,
    duration: 0.2,
    type: 'sine',
    attack: 0.01,
    decay: 0.05,
    sustain: 0.5,
    release: 0.14,
    volume: 0.4,
  },
  death: {
    frequency: 80,
    duration: 0.8,
    type: 'sawtooth',
    attack: 0.05,
    decay: 0.2,
    sustain: 0.3,
    release: 0.45,
    volume: 0.7,
  },
  enemyDeath: {
    frequency: 100,
    duration: 0.5,
    type: 'square',
    attack: 0.02,
    decay: 0.1,
    sustain: 0.4,
    release: 0.38,
    volume: 0.5,
  },
  damage: {
    frequency: 120,
    duration: 0.25,
    type: 'sawtooth',
    attack: 0.01,
    decay: 0.08,
    sustain: 0.3,
    release: 0.16,
    volume: 0.6,
  },
};

/**
 * AudioManager state
 */
export interface AudioManagerState {
  context: AudioContext | null;
  masterGain: GainNode | null;
  sfxGain: GainNode | null;
  ambientGain: GainNode | null;
  ambientOscillator: OscillatorNode | null;
  ambientLfo: OscillatorNode | null;
  config: AudioConfig;
  initialized: boolean;
}

/**
 * Create initial AudioManager state
 */
export function createAudioManager(config: Partial<AudioConfig> = {}): AudioManagerState {
  return {
    context: null,
    masterGain: null,
    sfxGain: null,
    ambientGain: null,
    ambientOscillator: null,
    ambientLfo: null,
    config: { ...DEFAULT_AUDIO_CONFIG, ...config },
    initialized: false,
  };
}

/**
 * Initialize the Web Audio API context and gain nodes
 * Must be called after user interaction due to browser autoplay policies
 */
export function initializeAudio(state: AudioManagerState): AudioManagerState {
  if (state.initialized || typeof window === 'undefined') {
    return state;
  }

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported');
      return state;
    }

    const context = new AudioContextClass();
    
    // Create master gain node
    const masterGain = context.createGain();
    masterGain.gain.value = state.config.masterVolume;
    masterGain.connect(context.destination);

    // Create SFX gain node
    const sfxGain = context.createGain();
    sfxGain.gain.value = state.config.sfxVolume;
    sfxGain.connect(masterGain);

    // Create ambient gain node
    const ambientGain = context.createGain();
    ambientGain.gain.value = state.config.ambientVolume;
    ambientGain.connect(masterGain);

    return {
      ...state,
      context,
      masterGain,
      sfxGain,
      ambientGain,
      initialized: true,
    };
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    return state;
  }
}


/**
 * Resume audio context if suspended (required after user interaction)
 */
export async function resumeAudio(state: AudioManagerState): Promise<void> {
  if (state.context && state.context.state === 'suspended') {
    await state.context.resume();
  }
}

/**
 * Create an ADSR envelope for a sound
 */
function createEnvelope(
  context: AudioContext,
  gainNode: GainNode,
  params: SoundParams,
  startTime: number
): void {
  const { attack, decay, sustain, release, duration, volume } = params;
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
  gainNode.gain.linearRampToValueAtTime(volume * sustain, startTime + attack + decay);
  gainNode.gain.setValueAtTime(volume * sustain, startTime + duration - release);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
}

/**
 * Play a procedurally generated sound effect
 * Requirements: 9.1 (weapon sound), 9.2 (defeat sound), 9.3 (damage sound)
 */
export function playSoundEffect(
  state: AudioManagerState,
  effectType: SoundEffectType
): void {
  if (!state.initialized || !state.context || !state.sfxGain || !state.config.enabled) {
    return;
  }

  const params = SOUND_EFFECTS[effectType];
  if (!params) {
    console.warn(`Unknown sound effect: ${effectType}`);
    return;
  }

  const { context, sfxGain } = state;
  const startTime = context.currentTime;

  // Create oscillator for the main tone
  const oscillator = context.createOscillator();
  oscillator.type = params.type;
  oscillator.frequency.setValueAtTime(params.frequency, startTime);

  // Add frequency modulation for more interesting sounds
  if (effectType === 'fire') {
    // Pitch drop for gunshot effect
    oscillator.frequency.exponentialRampToValueAtTime(50, startTime + params.duration);
  } else if (effectType === 'pickup') {
    // Rising pitch for pickup sound
    oscillator.frequency.setValueAtTime(params.frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(params.frequency * 1.5, startTime + params.duration * 0.5);
  } else if (effectType === 'death' || effectType === 'enemyDeath') {
    // Descending pitch for death sounds
    oscillator.frequency.exponentialRampToValueAtTime(params.frequency * 0.3, startTime + params.duration);
  }

  // Create gain node for envelope
  const gainNode = context.createGain();
  createEnvelope(context, gainNode, params, startTime);

  // Add noise for certain effects
  if (effectType === 'fire' || effectType === 'hit') {
    addNoise(context, sfxGain, params, startTime);
  }

  // Connect and play
  oscillator.connect(gainNode);
  gainNode.connect(sfxGain);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + params.duration);
}

/**
 * Add noise component to a sound effect
 */
function addNoise(
  context: AudioContext,
  destination: GainNode,
  params: SoundParams,
  startTime: number
): void {
  const bufferSize = context.sampleRate * params.duration;
  const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  // Generate white noise
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  // Filter the noise
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;

  // Envelope for noise
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0, startTime);
  noiseGain.gain.linearRampToValueAtTime(params.volume * 0.3, startTime + params.attack);
  noiseGain.gain.linearRampToValueAtTime(0, startTime + params.duration);

  noiseSource.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(destination);

  noiseSource.start(startTime);
  noiseSource.stop(startTime + params.duration);
}


/**
 * Start ambient background audio
 * Requirements: 9.4 (ambient background audio)
 */
export function startAmbient(state: AudioManagerState): AudioManagerState {
  if (!state.initialized || !state.context || !state.ambientGain || !state.config.enabled) {
    return state;
  }

  // Stop existing ambient if playing
  const newState = stopAmbient(state);
  
  const { context: ctx, ambientGain: ambGain } = newState;
  if (!ctx || !ambGain) return newState;

  // Create a low drone oscillator for eerie atmosphere
  const droneOsc = ctx.createOscillator();
  droneOsc.type = 'sine';
  droneOsc.frequency.value = 55; // Low A note

  // Create LFO for subtle pitch modulation
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1; // Very slow modulation

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 3; // Subtle pitch variation

  lfo.connect(lfoGain);
  lfoGain.connect(droneOsc.frequency);

  // Create filter for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  filter.Q.value = 1;

  // Create gain for fade in
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0, ctx.currentTime);
  droneGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2);

  // Connect the chain
  droneOsc.connect(filter);
  filter.connect(droneGain);
  droneGain.connect(ambGain);

  // Start oscillators
  droneOsc.start();
  lfo.start();

  return {
    ...newState,
    ambientOscillator: droneOsc,
    ambientLfo: lfo,
  };
}

/**
 * Stop ambient background audio
 */
export function stopAmbient(state: AudioManagerState): AudioManagerState {
  if (state.ambientOscillator) {
    try {
      state.ambientOscillator.stop();
    } catch {
      // Oscillator may already be stopped
    }
  }
  
  if (state.ambientLfo) {
    try {
      state.ambientLfo.stop();
    } catch {
      // Oscillator may already be stopped
    }
  }

  return {
    ...state,
    ambientOscillator: null,
    ambientLfo: null,
  };
}

/**
 * Set master volume
 */
export function setMasterVolume(state: AudioManagerState, volume: number): AudioManagerState {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  
  if (state.masterGain) {
    state.masterGain.gain.value = clampedVolume;
  }

  return {
    ...state,
    config: {
      ...state.config,
      masterVolume: clampedVolume,
    },
  };
}

/**
 * Set SFX volume
 */
export function setSfxVolume(state: AudioManagerState, volume: number): AudioManagerState {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  
  if (state.sfxGain) {
    state.sfxGain.gain.value = clampedVolume;
  }

  return {
    ...state,
    config: {
      ...state.config,
      sfxVolume: clampedVolume,
    },
  };
}

/**
 * Set ambient volume
 */
export function setAmbientVolume(state: AudioManagerState, volume: number): AudioManagerState {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  
  if (state.ambientGain) {
    state.ambientGain.gain.value = clampedVolume;
  }

  return {
    ...state,
    config: {
      ...state.config,
      ambientVolume: clampedVolume,
    },
  };
}

/**
 * Enable or disable audio
 */
export function setAudioEnabled(state: AudioManagerState, enabled: boolean): AudioManagerState {
  if (!enabled) {
    // Stop ambient when disabling
    const newState = stopAmbient(state);
    if (newState.masterGain) {
      newState.masterGain.gain.value = 0;
    }
    return {
      ...newState,
      config: {
        ...newState.config,
        enabled,
      },
    };
  }

  // Restore volume when enabling
  if (state.masterGain) {
    state.masterGain.gain.value = state.config.masterVolume;
  }

  return {
    ...state,
    config: {
      ...state.config,
      enabled,
    },
  };
}

/**
 * Clean up audio resources
 */
export function disposeAudio(state: AudioManagerState): AudioManagerState {
  const newState = stopAmbient(state);
  
  if (newState.context) {
    newState.context.close();
  }

  return {
    ...newState,
    context: null,
    masterGain: null,
    sfxGain: null,
    ambientGain: null,
    initialized: false,
  };
}
