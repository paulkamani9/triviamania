/**
 * Sound Effects for TriviaMania
 * Uses Web Audio API for crisp, low-latency sounds
 */

// Audio context (lazy-loaded to respect user interaction requirement)
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser policy)
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Play a synthesized "correct" sound - pleasant ascending tone
 */
export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create oscillator for main tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connect nodes
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configure oscillators - pleasant major chord feel
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now); // E5
    osc2.frequency.setValueAtTime(783.99, now + 0.1); // G5

    // Volume envelope - quick attack, smooth decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    // Play
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch (e) {
    console.warn("Could not play correct sound:", e);
  }
}

/**
 * Play a synthesized "wrong" sound - descending buzz
 */
export function playWrongSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create oscillator
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connect
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Buzzy descending tone
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    // Quick harsh envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    // Play
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn("Could not play wrong sound:", e);
  }
}

/**
 * Play a "timeout" sound - subtle warning beep
 */
export function playTimeoutSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two quick beeps
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now + i * 0.15);

      gainNode.gain.setValueAtTime(0, now + i * 0.15);
      gainNode.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);

      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.1);
    }
  } catch (e) {
    console.warn("Could not play timeout sound:", e);
  }
}

/**
 * Play click/select sound
 */
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    console.warn("Could not play click sound:", e);
  }
}

/**
 * Play countdown tick sound - for timer warnings (5, 4, 3, 2, 1)
 */
export function playTickSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Short, crisp tick sound
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now); // A5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    console.warn("Could not play tick sound:", e);
  }
}

export default {
  playCorrectSound,
  playWrongSound,
  playTimeoutSound,
  playClickSound,
  playTickSound,
};
