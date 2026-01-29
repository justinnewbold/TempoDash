import { Audio, AVPlaybackStatus } from 'expo-av';

type SoundEffect = 'jump' | 'land' | 'coin' | 'bounce' | 'death' | 'complete' | 'button';

interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

class AudioManagerClass {
  private sounds: Map<SoundEffect, Audio.Sound> = new Map();
  private music: Audio.Sound | null = null;
  private isInitialized = false;
  private settings: AudioSettings = {
    musicVolume: 0.7,
    sfxVolume: 1.0,
    musicEnabled: true,
    sfxEnabled: true,
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure audio mode for game
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  async loadSounds(): Promise<void> {
    // Sound effects will be loaded from assets
    // For now, we'll create the structure - actual audio files can be added later
    const soundFiles: Record<SoundEffect, any> = {
      jump: null, // require('../../assets/audio/jump.mp3'),
      land: null, // require('../../assets/audio/land.mp3'),
      coin: null, // require('../../assets/audio/coin.mp3'),
      bounce: null, // require('../../assets/audio/bounce.mp3'),
      death: null, // require('../../assets/audio/death.mp3'),
      complete: null, // require('../../assets/audio/complete.mp3'),
      button: null, // require('../../assets/audio/button.mp3'),
    };

    for (const [name, file] of Object.entries(soundFiles)) {
      if (file) {
        try {
          const { sound } = await Audio.Sound.createAsync(file);
          this.sounds.set(name as SoundEffect, sound);
        } catch (error) {
          console.warn(`Failed to load sound ${name}:`, error);
        }
      }
    }
  }

  async playSound(effect: SoundEffect): Promise<void> {
    if (!this.settings.sfxEnabled || this.settings.sfxVolume === 0) return;

    const sound = this.sounds.get(effect);
    if (sound) {
      try {
        await sound.setVolumeAsync(this.settings.sfxVolume);
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch (error) {
        console.warn(`Failed to play sound ${effect}:`, error);
      }
    }
  }

  async playMusic(source?: any): Promise<void> {
    if (!this.settings.musicEnabled) return;

    try {
      // Stop current music if playing
      if (this.music) {
        try {
          await this.music.stopAsync();
          await this.music.unloadAsync();
        } catch (error) {
          console.warn('Failed to stop/unload music:', error);
        } finally {
          this.music = null;
        }
      }

      if (source) {
        const { sound } = await Audio.Sound.createAsync(source, {
          isLooping: true,
          volume: this.settings.musicVolume,
        });
        // Only assign to this.music after successful creation
        this.music = sound;
        await this.music.playAsync();
      }
    } catch (error) {
      console.warn('Failed to play music:', error);
      this.music = null;
    }
  }

  async stopMusic(): Promise<void> {
    if (this.music) {
      try {
        await this.music.stopAsync();
      } catch (error) {
        console.warn('Failed to stop music:', error);
      }
    }
  }

  async pauseMusic(): Promise<void> {
    if (this.music) {
      try {
        await this.music.pauseAsync();
      } catch (error) {
        console.warn('Failed to pause music:', error);
      }
    }
  }

  async resumeMusic(): Promise<void> {
    if (this.music && this.settings.musicEnabled) {
      try {
        await this.music.playAsync();
      } catch (error) {
        console.warn('Failed to resume music:', error);
      }
    }
  }

  async setMusicVolume(volume: number): Promise<void> {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      try {
        await this.music.setVolumeAsync(this.settings.musicVolume);
      } catch (error) {
        console.warn('Failed to set music volume:', error);
      }
    }
  }

  setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  async setMusicEnabled(enabled: boolean): Promise<void> {
    this.settings.musicEnabled = enabled;
    if (!enabled) {
      await this.pauseMusic();
    } else {
      await this.resumeMusic();
    }
  }

  setSfxEnabled(enabled: boolean): void {
    this.settings.sfxEnabled = enabled;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  async cleanup(): Promise<void> {
    // Unload all sounds
    for (const sound of this.sounds.values()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.sounds.clear();

    // Unload music
    if (this.music) {
      try {
        await this.music.unloadAsync();
      } catch (error) {
        // Ignore cleanup errors
      }
      this.music = null;
    }
  }
}

// Singleton instance
export const AudioManager = new AudioManagerClass();
