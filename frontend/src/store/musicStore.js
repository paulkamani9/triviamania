import { create } from "zustand";
import { persist } from "zustand/middleware";

// Music store with persistence
export const useMusicStore = create(
  persist(
    (set, get) => ({
      isPlaying: false,
      isMuted: false,
      volume: 0.3, // Default volume (30%)
      reducedVolume: 0.12, // Reduced volume during gameplay (12%)
      isInGame: false, // Track if user is in active gameplay

      toggleMusic: () => {
        const { isPlaying } = get();
        if (isPlaying) {
          stopMusic();
        } else {
          startMusic();
        }
        set({ isPlaying: !isPlaying });
      },

      setIsInGame: (inGame) => {
        set({ isInGame: inGame });
        updateMusicVolume(inGame ? get().reducedVolume : get().volume);
      },

      setMuted: (muted) => {
        set({ isMuted: muted });
        if (muted) {
          updateMusicVolume(0);
        } else {
          const { isInGame, volume, reducedVolume } = get();
          updateMusicVolume(isInGame ? reducedVolume : volume);
        }
      },

      // Initialize music on first user interaction
      initMusic: () => {
        const { isPlaying, isMuted, volume } = get();
        if (isPlaying && !isMuted) {
          startMusic();
          updateMusicVolume(volume);
        }
      },
    }),
    {
      name: "triviamania-music",
      partialize: (state) => ({
        isPlaying: state.isPlaying,
        isMuted: state.isMuted,
      }),
    }
  )
);

// Audio element for background music
let audioElement = null;
let gainNode = null;
let audioContext = null;

function getAudioSetup() {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.loop = true;
    audioElement.preload = "auto";

    // Use a royalty-free game music URL or local file
    // For now, we'll use a data URL with a simple generated tone loop
    // In production, replace with actual music file
    audioElement.src = createMusicDataUrl();
  }
  return audioElement;
}

function startMusic() {
  try {
    const audio = getAudioSetup();
    const { volume, isMuted } = useMusicStore.getState();

    audio.volume = isMuted ? 0 : volume;

    // Play with user gesture requirement handling
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Music autoplay prevented:", error.message);
        // Will start on next user interaction
      });
    }
  } catch (e) {
    console.warn("Could not start music:", e);
  }
}

function stopMusic() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
}

function updateMusicVolume(volume) {
  if (audioElement) {
    // Smooth volume transition
    const currentVolume = audioElement.volume;
    const targetVolume = volume;
    const steps = 10;
    const stepDuration = 100; // ms
    const volumeStep = (targetVolume - currentVolume) / steps;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      audioElement.volume = Math.max(
        0,
        Math.min(1, currentVolume + volumeStep * step)
      );
      if (step >= steps) {
        clearInterval(interval);
        audioElement.volume = targetVolume;
      }
    }, stepDuration);
  }
}

/**
 * Create a simple looping background music using Web Audio API
 * This creates a chill ambient game music feel
 */
function createMusicDataUrl() {
  // Create an offline audio context to generate the music
  const sampleRate = 44100;
  const duration = 8; // 8 second loop
  const numChannels = 2;
  const numSamples = sampleRate * duration;

  // Create WAV file data
  const buffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * numChannels * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * numChannels * 2, true);

  // Generate ambient music - dreamy synth pads
  const baseFreqs = [130.81, 164.81, 196.0, 246.94]; // C3, E3, G3, B3 (Cmaj7)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // Layer multiple sine waves with slow modulation
    for (let j = 0; j < baseFreqs.length; j++) {
      const freq = baseFreqs[j];
      // Add slight vibrato
      const vibrato = 1 + 0.003 * Math.sin(2 * Math.PI * 4 * t + j);
      // Add slow volume modulation
      const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.125 * t + j * 0.5);

      sample += Math.sin(2 * Math.PI * freq * vibrato * t) * envelope * 0.15;
      // Add soft harmonic
      sample +=
        Math.sin(2 * Math.PI * freq * 2 * vibrato * t) * envelope * 0.05;
    }

    // Add subtle high shimmer
    sample +=
      Math.sin(2 * Math.PI * 523.25 * t) *
      (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t)) *
      0.03;

    // Soft limiting
    sample = Math.tanh(sample * 0.8);

    // Convert to 16-bit integer
    const intSample = Math.max(
      -32768,
      Math.min(32767, Math.floor(sample * 32767))
    );

    // Write stereo (same for both channels with slight delay for width)
    const offset = 44 + i * 4;
    view.setInt16(offset, intSample, true);
    view.setInt16(offset + 2, intSample, true);
  }

  // Convert to base64 data URL
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

// Export for use in components that need to trigger volume changes
export { startMusic, stopMusic, updateMusicVolume };
