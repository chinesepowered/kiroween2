/**
 * Audio module exports
 */

export * from './types';
export {
  DEFAULT_AUDIO_CONFIG,
  createAudioManager,
  initializeAudio,
  resumeAudio,
  playSoundEffect,
  startAmbient,
  stopAmbient,
  setMasterVolume,
  setSfxVolume,
  setAmbientVolume,
  setAudioEnabled,
  disposeAudio,
  type AudioManagerState,
} from './audioManager';
