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

// Play a beep using oscillator
const playBeep = (frequency: number, duration: number, startTime: number, ctx: AudioContext, volume: number = 0.8) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'square'; // square wave is louder and more attention-grabbing
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

// Create alert tone using AudioContext - LOUD and attention-grabbing
const playAlertTone = () => {
  try {
    const ctx = initAudioContext();
    
    // 5 loud beeps with increasing urgency for maximum attention
    const beeps = [
      { freq: 880, time: 0, duration: 0.25 },
      { freq: 988, time: 0.3, duration: 0.25 },
      { freq: 1047, time: 0.6, duration: 0.25 },
      { freq: 1175, time: 0.9, duration: 0.25 },
      { freq: 1319, time: 1.2, duration: 0.4 },
    ];
    
    beeps.forEach(({ freq, time, duration }) => {
      playBeep(freq, duration, ctx.currentTime + time, ctx, 0.9);
    });
    
    console.log('Alert tone played');
  } catch (error) {
    console.error('Alert tone error:', error);
  }
};

// Vibrate device for notifications (mobile only) - Strong pattern
export const vibrateDevice = (pattern: number | number[] = [300, 100, 300, 100, 500]) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
      console.log('Device vibrated with pattern:', pattern);
    }
  } catch (error) {
    console.error('Vibration error:', error);
  }
};

// Create notification sound for CALL signals (ascending - positive)
export const playCallNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Three ascending beeps for CALL (buy/up)
    const frequencies = [600, 800, 1000]; // Hz - ascending
    const duration = 0.2; // seconds per beep
    const gap = 0.08; // seconds between beeps
    
    frequencies.forEach((frequency, index) => {
      playBeep(frequency, duration, ctx.currentTime + (index * (duration + gap)), ctx, 0.7);
    });
    
    vibrateDevice([200, 100, 200]);
    console.log('CALL notification sound played');
  } catch (error) {
    console.error('Error playing CALL notification sound:', error);
  }
};

// Create notification sound for PUT signals (descending - negative)
export const playPutNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Three descending beeps for PUT (sell/down)
    const frequencies = [1000, 800, 600]; // Hz - descending
    const duration = 0.2; // seconds per beep
    const gap = 0.08; // seconds between beeps
    
    frequencies.forEach((frequency, index) => {
      playBeep(frequency, duration, ctx.currentTime + (index * (duration + gap)), ctx, 0.7);
    });
    
    vibrateDevice([200, 100, 200]);
    console.log('PUT notification sound played');
  } catch (error) {
    console.error('Error playing PUT notification sound:', error);
  }
};

// Generic notification sound (neutral) with vibration - LOUD and LONG
export const playNotificationSound = () => {
  try {
    // Strong vibration pattern: long-short-long-short-extra long
    vibrateDevice([400, 100, 400, 100, 600]);
    
    // Play loud alert tone
    playAlertTone();
    
    console.log('Notification sound and vibration triggered');
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Fallback - try again
    try {
      playAlertTone();
    } catch (e) {
      console.error('Fallback also failed:', e);
    }
  }
};

// Price alert specific sound - Very loud and persistent
export const playPriceAlertSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Urgent alarm-like pattern
    const pattern = [
      { freq: 1200, time: 0, duration: 0.15 },
      { freq: 800, time: 0.2, duration: 0.15 },
      { freq: 1200, time: 0.4, duration: 0.15 },
      { freq: 800, time: 0.6, duration: 0.15 },
      { freq: 1400, time: 0.8, duration: 0.3 },
    ];
    
    pattern.forEach(({ freq, time, duration }) => {
      playBeep(freq, duration, ctx.currentTime + time, ctx, 0.95);
    });
    
    // Strong vibration
    vibrateDevice([500, 100, 500, 100, 700]);
    
    console.log('Price alert sound played');
  } catch (error) {
    console.error('Price alert sound error:', error);
    playNotificationSound(); // Fallback
  }
};

// Success sound (win)
export const playSuccessSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Two quick ascending beeps
    const frequencies = [800, 1200];
    const duration = 0.15;
    const gap = 0.1;
    
    frequencies.forEach((frequency, index) => {
      playBeep(frequency, duration, ctx.currentTime + (index * (duration + gap)), ctx, 0.6);
    });
    
    vibrateDevice([100, 50, 100]);
    console.log('Success sound played');
  } catch (error) {
    console.error('Error playing success sound:', error);
  }
};

// Error sound (loss)
export const playErrorSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Single low beep
    playBeep(400, 0.4, ctx.currentTime, ctx, 0.5);
    vibrateDevice([300]);
    console.log('Error sound played');
  } catch (error) {
    console.error('Error playing error sound:', error);
  }
};

// Test sound - to verify audio is working
export const playTestSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Simple test beep
    playBeep(800, 0.3, ctx.currentTime, ctx, 0.8);
    vibrateDevice([200]);
    
    console.log('Test sound played successfully');
    return true;
  } catch (error) {
    console.error('Test sound failed:', error);
    return false;
  }
};

// Stock market refresh sound - like trading floor bell/ticker
export const playRefreshSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Stock market ticker/bell sound - quick ascending chime
    const pattern = [
      { freq: 1046.50, time: 0, duration: 0.08 },      // C6
      { freq: 1174.66, time: 0.06, duration: 0.08 },   // D6
      { freq: 1318.51, time: 0.12, duration: 0.12 },   // E6
      { freq: 1567.98, time: 0.20, duration: 0.15 },   // G6 - final bell
    ];
    
    pattern.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine'; // Clean bell-like tone
      
      const startTime = ctx.currentTime + time;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
    // Light vibration feedback
    vibrateDevice([50]);
    
    console.log('Refresh sound played');
  } catch (error) {
    console.error('Refresh sound error:', error);
  }
};
