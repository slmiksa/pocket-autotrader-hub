// Audio context for notifications (shared instance)
let audioContext: AudioContext | null = null;
let audioInitialized = false;

// Initialize audio context on user interaction (required by browsers)
export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  audioInitialized = true;
  return audioContext;
};

// Ensure audio is ready (call on user interaction)
export const ensureAudioReady = () => {
  try {
    initAudioContext();
    console.log('Audio context initialized and ready');
  } catch (error) {
    console.error('Failed to initialize audio context:', error);
  }
};

// Play a melodic note with smooth envelope
const playNote = (
  frequency: number, 
  duration: number, 
  startTime: number, 
  ctx: AudioContext, 
  volume: number = 0.5,
  type: OscillatorType = 'sine'
) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  // Smooth envelope for pleasant sound
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
  gainNode.gain.setValueAtTime(volume, startTime + duration - 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

// Play chord (multiple notes together)
const playChord = (
  frequencies: number[], 
  duration: number, 
  startTime: number, 
  ctx: AudioContext, 
  volume: number = 0.3
) => {
  frequencies.forEach(freq => {
    playNote(freq, duration, startTime, ctx, volume / frequencies.length, 'sine');
  });
};

// Musical notes frequencies
const NOTES: { [key: string]: number } = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00
};

// Vibrate device for notifications (mobile only)
export const vibrateDevice = (pattern: number | number[] = [200, 100, 200]) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.error('Vibration error:', error);
  }
};

// ===== CALL Signal Sound - Beautiful ascending melody =====
export const playCallNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Beautiful ascending arpeggio with harmony - C Major chord progression
    // Duration: ~2.5 seconds
    const melody = [
      { notes: [NOTES.C5], time: 0, duration: 0.25 },
      { notes: [NOTES.E5], time: 0.2, duration: 0.25 },
      { notes: [NOTES.G5], time: 0.4, duration: 0.25 },
      { notes: [NOTES.C6], time: 0.6, duration: 0.35 },
      // Second phrase - higher
      { notes: [NOTES.E5, NOTES.G5], time: 1.0, duration: 0.3 },
      { notes: [NOTES.G5, NOTES.C6], time: 1.3, duration: 0.3 },
      { notes: [NOTES.C6, NOTES.E6], time: 1.6, duration: 0.5 },
      // Final triumphant chord
      { notes: [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6], time: 2.1, duration: 0.6 },
    ];
    
    melody.forEach(({ notes, time, duration }) => {
      if (notes.length === 1) {
        playNote(notes[0], duration, now + time, ctx, 0.5, 'sine');
      } else {
        playChord(notes, duration, now + time, ctx, 0.6);
      }
    });
    
    vibrateDevice([150, 80, 150, 80, 250]);
    console.log('CALL notification sound played');
  } catch (error) {
    console.error('Error playing CALL notification sound:', error);
  }
};

// ===== PUT Signal Sound - Elegant descending melody =====
export const playPutNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Elegant descending melody - Minor key feel
    // Duration: ~2.5 seconds
    const melody = [
      { notes: [NOTES.A5], time: 0, duration: 0.25 },
      { notes: [NOTES.F5], time: 0.2, duration: 0.25 },
      { notes: [NOTES.D5], time: 0.4, duration: 0.25 },
      { notes: [NOTES.A4], time: 0.6, duration: 0.35 },
      // Second phrase
      { notes: [NOTES.F5, NOTES.A5], time: 1.0, duration: 0.3 },
      { notes: [NOTES.D5, NOTES.F5], time: 1.3, duration: 0.3 },
      { notes: [NOTES.A4, NOTES.D5], time: 1.6, duration: 0.5 },
      // Final resolving chord
      { notes: [NOTES.D4, NOTES.F4, NOTES.A4, NOTES.D5], time: 2.1, duration: 0.6 },
    ];
    
    melody.forEach(({ notes, time, duration }) => {
      if (notes.length === 1) {
        playNote(notes[0], duration, now + time, ctx, 0.5, 'sine');
      } else {
        playChord(notes, duration, now + time, ctx, 0.6);
      }
    });
    
    vibrateDevice([150, 80, 150, 80, 250]);
    console.log('PUT notification sound played');
  } catch (error) {
    console.error('Error playing PUT notification sound:', error);
  }
};

// ===== General Notification Sound - Pleasant chime melody =====
export const playNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Pleasant notification chime - like a doorbell but musical
    // Duration: ~2 seconds
    const melody = [
      { notes: [NOTES.G5], time: 0, duration: 0.2 },
      { notes: [NOTES.E5], time: 0.15, duration: 0.2 },
      { notes: [NOTES.C5], time: 0.3, duration: 0.25 },
      { notes: [NOTES.G5], time: 0.5, duration: 0.3 },
      // Echo/repeat
      { notes: [NOTES.G5, NOTES.E5], time: 0.9, duration: 0.25 },
      { notes: [NOTES.E5, NOTES.C5], time: 1.15, duration: 0.25 },
      { notes: [NOTES.C5, NOTES.G4, NOTES.E5], time: 1.4, duration: 0.5 },
    ];
    
    melody.forEach(({ notes, time, duration }) => {
      if (notes.length === 1) {
        playNote(notes[0], duration, now + time, ctx, 0.45, 'sine');
      } else {
        playChord(notes, duration, now + time, ctx, 0.55);
      }
    });
    
    vibrateDevice([200, 100, 200, 100, 300]);
    console.log('Notification sound played');
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

// ===== Alert Tone - Attention grabbing but melodic =====
const playAlertTone = () => {
  try {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Alert pattern - urgent but not harsh
    // Duration: ~2.5 seconds
    const pattern = [
      { freq: NOTES.A5, time: 0, duration: 0.15 },
      { freq: NOTES.E5, time: 0.18, duration: 0.15 },
      { freq: NOTES.A5, time: 0.36, duration: 0.15 },
      { freq: NOTES.E5, time: 0.54, duration: 0.15 },
      // Pause then repeat higher
      { freq: NOTES.C6, time: 0.9, duration: 0.15 },
      { freq: NOTES.G5, time: 1.08, duration: 0.15 },
      { freq: NOTES.C6, time: 1.26, duration: 0.15 },
      { freq: NOTES.G5, time: 1.44, duration: 0.15 },
      // Final attention grab
      { freq: NOTES.E6, time: 1.8, duration: 0.2 },
      { freq: NOTES.C6, time: 2.0, duration: 0.2 },
      { freq: NOTES.A5, time: 2.2, duration: 0.35 },
    ];
    
    pattern.forEach(({ freq, time, duration }) => {
      playNote(freq, duration, now + time, ctx, 0.55, 'triangle');
    });
    
    console.log('Alert tone played');
  } catch (error) {
    console.error('Alert tone error:', error);
  }
};

// ===== Price Alert Sound - Urgent but beautiful =====
export const playPriceAlertSound = () => {
  try {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Urgent price alert - attention grabbing melody
    // Duration: ~3 seconds
    const melody = [
      // First attention call
      { notes: [NOTES.C6], time: 0, duration: 0.12 },
      { notes: [NOTES.G5], time: 0.12, duration: 0.12 },
      { notes: [NOTES.C6], time: 0.24, duration: 0.12 },
      { notes: [NOTES.G5], time: 0.36, duration: 0.12 },
      // Rising urgency
      { notes: [NOTES.D6], time: 0.6, duration: 0.12 },
      { notes: [NOTES.A5], time: 0.72, duration: 0.12 },
      { notes: [NOTES.D6], time: 0.84, duration: 0.12 },
      { notes: [NOTES.A5], time: 0.96, duration: 0.12 },
      // Climax
      { notes: [NOTES.E6], time: 1.2, duration: 0.15 },
      { notes: [NOTES.B5], time: 1.35, duration: 0.15 },
      { notes: [NOTES.E6], time: 1.5, duration: 0.2 },
      // Resolving chord
      { notes: [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6], time: 1.8, duration: 0.8 },
    ];
    
    melody.forEach(({ notes, time, duration }) => {
      if (notes.length === 1) {
        playNote(notes[0], duration, now + time, ctx, 0.55, 'triangle');
      } else {
        playChord(notes, duration, now + time, ctx, 0.7);
      }
    });
    
    vibrateDevice([300, 100, 300, 100, 500]);
    console.log('Price alert sound played');
  } catch (error) {
    console.error('Price alert sound error:', error);
    playNotificationSound();
  }
};

// ===== Success Sound - Celebratory =====
export const playSuccessSound = () => {
  try {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Victory fanfare - short but satisfying
    // Duration: ~1.2 seconds
    const melody = [
      { notes: [NOTES.C5], time: 0, duration: 0.12 },
      { notes: [NOTES.E5], time: 0.1, duration: 0.12 },
      { notes: [NOTES.G5], time: 0.2, duration: 0.15 },
      { notes: [NOTES.C6], time: 0.35, duration: 0.25 },
      { notes: [NOTES.E6], time: 0.6, duration: 0.35 },
      // Final victory chord
      { notes: [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6], time: 0.95, duration: 0.5 },
    ];
    
    melody.forEach(({ notes, time, duration }) => {
      if (notes.length === 1) {
        playNote(notes[0], duration, now + time, ctx, 0.45, 'sine');
      } else {
        playChord(notes, duration, now + time, ctx, 0.55);
      }
    });
    
    vibrateDevice([100, 50, 100, 50, 150]);
    console.log('Success sound played');
  } catch (error) {
    console.error('Error playing success sound:', error);
  }
};

// ===== Error Sound - Soft but noticeable =====
export const playErrorSound = () => {
  try {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Gentle error indication - not harsh
    // Duration: ~0.8 seconds
    const melody = [
      { notes: [NOTES.E5], time: 0, duration: 0.2 },
      { notes: [NOTES.C5], time: 0.2, duration: 0.25 },
      { notes: [NOTES.A4], time: 0.45, duration: 0.35 },
    ];
    
    melody.forEach(({ notes, time, duration }) => {
      playNote(notes[0], duration, now + time, ctx, 0.4, 'sine');
    });
    
    vibrateDevice([200]);
    console.log('Error sound played');
  } catch (error) {
    console.error('Error playing error sound:', error);
  }
};

// ===== Test Sound - Verify audio works =====
export const playTestSound = () => {
  try {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Simple pleasant test tone
    playNote(NOTES.C5, 0.2, now, ctx, 0.5, 'sine');
    playNote(NOTES.E5, 0.2, now + 0.15, ctx, 0.5, 'sine');
    playNote(NOTES.G5, 0.3, now + 0.3, ctx, 0.5, 'sine');
    
    vibrateDevice([100]);
    console.log('Test sound played successfully');
    return true;
  } catch (error) {
    console.error('Test sound failed:', error);
    return false;
  }
};

// ===== Refresh Sound - Stock market chime =====
export const playRefreshSound = () => {
  try {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Quick pleasant refresh chime
    const melody = [
      { freq: NOTES.G5, time: 0, duration: 0.08 },
      { freq: NOTES.C6, time: 0.06, duration: 0.08 },
      { freq: NOTES.E6, time: 0.12, duration: 0.12 },
    ];
    
    melody.forEach(({ freq, time, duration }) => {
      playNote(freq, duration, now + time, ctx, 0.35, 'sine');
    });
    
    vibrateDevice([50]);
    console.log('Refresh sound played');
  } catch (error) {
    console.error('Refresh sound error:', error);
  }
};
