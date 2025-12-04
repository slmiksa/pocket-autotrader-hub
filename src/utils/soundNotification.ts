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

// Play a beep using oscillator (works on desktop)
const playBeep = (frequency: number, duration: number, startTime: number, ctx: AudioContext, volume: number = 0.5) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'square'; // square wave is louder and more attention-grabbing
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

// Create alert tone using AudioContext for mobile
const playAlertTone = () => {
  try {
    const ctx = initAudioContext();
    
    // 3 loud beeps with increasing urgency
    const beeps = [
      { freq: 880, time: 0, duration: 0.3 },
      { freq: 988, time: 0.35, duration: 0.3 },
      { freq: 1047, time: 0.7, duration: 0.4 },
    ];
    
    beeps.forEach(({ freq, time, duration }) => {
      const startTime = ctx.currentTime + time;
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'square';
      
      // Louder volume
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.02);
      gainNode.gain.setValueAtTime(0.7, startTime + duration - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  } catch (error) {
    console.error('Alert tone error:', error);
  }
};

// Vibrate device for notifications (mobile only)
export const vibrateDevice = (pattern: number | number[] = [200, 100, 200]) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
      console.log('Device vibrated');
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

// Generic notification sound (neutral) with vibration - LOUD and LONG
export const playNotificationSound = () => {
  try {
    // Strong vibration pattern: long-short-long-short-long
    vibrateDevice([400, 100, 400, 100, 600]);
    
    // Play loud alert tone
    playAlertTone();
    
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Fallback - try again
    playAlertTone();
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
