import { useEffect, useCallback } from 'react';
import { AudioManager } from '../systems/AudioManager';

type SoundEffect = 'jump' | 'land' | 'coin' | 'bounce' | 'death' | 'complete' | 'button';

export function useAudio() {
  useEffect(() => {
    // Initialize audio on mount
    AudioManager.initialize();
    AudioManager.loadSounds();

    return () => {
      // Don't cleanup on unmount to keep sounds loaded
    };
  }, []);

  const playSound = useCallback((effect: SoundEffect) => {
    AudioManager.playSound(effect);
  }, []);

  const playMusic = useCallback((source?: any) => {
    AudioManager.playMusic(source);
  }, []);

  const stopMusic = useCallback(() => {
    AudioManager.stopMusic();
  }, []);

  const pauseMusic = useCallback(() => {
    AudioManager.pauseMusic();
  }, []);

  const resumeMusic = useCallback(() => {
    AudioManager.resumeMusic();
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    AudioManager.setMusicVolume(volume);
  }, []);

  const setSfxVolume = useCallback((volume: number) => {
    AudioManager.setSfxVolume(volume);
  }, []);

  return {
    playSound,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    setMusicVolume,
    setSfxVolume,
  };
}

// Simple hook for just playing sound effects
export function useSoundEffect() {
  useEffect(() => {
    AudioManager.initialize();
    AudioManager.loadSounds();
  }, []);

  return useCallback((effect: SoundEffect) => {
    AudioManager.playSound(effect);
  }, []);
}
