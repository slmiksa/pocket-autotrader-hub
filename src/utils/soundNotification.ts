// Audio context for notifications (shared instance)
let audioContext: AudioContext | null = null;

// Initialize audio context on user interaction (required by browsers)
export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

// Create notification sound for CALL signals (ascending - positive)
export const playCallNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Three ascending beeps for CALL (buy/up)
    const frequencies = [600, 800, 1000]; // Hz - ascending
    const duration = 0.15; // seconds per beep
    const gap = 0.05; // seconds between beeps
    
    frequencies.forEach((frequency, index) => {
      const startTime = ctx.currentTime + (index * (duration + gap));
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
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
    const duration = 0.15; // seconds per beep
    const gap = 0.05; // seconds between beeps
    
    frequencies.forEach((frequency, index) => {
      const startTime = ctx.currentTime + (index * (duration + gap));
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
  } catch (error) {
    console.error('Error playing PUT notification sound:', error);
  }
};

// Generic notification sound (neutral)
export const playNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Single pleasant beep for general notifications
    const frequency = 800; // Hz
    const duration = 0.2; // seconds
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

// Success sound (win)
export const playSuccessSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Two quick ascending beeps
    const frequencies = [800, 1200];
    const duration = 0.12;
    const gap = 0.08;
    
    frequencies.forEach((frequency, index) => {
      const startTime = ctx.currentTime + (index * (duration + gap));
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
  } catch (error) {
    console.error('Error playing success sound:', error);
  }
};

// Error sound (loss)
export const playErrorSound = () => {
  try {
    const ctx = initAudioContext();
    
    // Single low beep
    const frequency = 400;
    const duration = 0.3;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    
  } catch (error) {
    console.error('Error playing error sound:', error);
  }
};
