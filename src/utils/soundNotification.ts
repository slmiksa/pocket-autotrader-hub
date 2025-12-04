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
const playBeep = (frequency: number, duration: number, startTime: number, ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

// Fallback using HTML5 Audio for mobile
const playMobileBeep = () => {
  try {
    // Create a simple beep using data URI (base64 encoded short beep)
    const beepDataUri = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2BgH2CfXpycH99g4KJiYqMjYuNjY2NjYuLiomIhoWEg4KCgIB/f39/gIGCg4SFhoeIiYqLjIyNjY2MjIuKiYiHhoWEg4KBgH9/fn5+f4CCg4WGh4iJiouMjI2NjYyMi4qJiIeGhYSDgoF/fn59fX5+gIGChIWGh4iKi4yMjY2NjYyLioqJh4aFhIOCgX9+fX19fn+AgYOEhYaHiYqLjIyNjY2MjIuKiYiHhoWDgoGAf359fX1+f4CCg4SFhoiJiouMjI2NjYyMi4qJiIeGhYOCgYB/fn19fX5/gIGDhIWGiImKi4yMjY2NjIyLiomIh4aFg4KBgH9+fX19fn+AgYOEhYaHiYqLjIyNjY2MjIuKiYiHhoWDgoGAf359fX1+f4CCg4SFhoiJiouMjI2NjYyMi4qJiIeGhYOCgYB/fn19fX5/gIGDhIWGiImKi4yMjY2NjIyLiomIh4aFg4KBgH9+fX19fn+AgYOEhYaHiYqLjIyNjY2MjIuKiYiHhoWEgoGAf359fX1+f4CCg4SFhoiJiouMjI2NjYyMi4qJiIeGhYSDgoGAf359fX1+f4CCg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoGAf359fX1+f4CBg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoGAf35+fX5+f4CBg4SFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoGAf35+fX5+gICCg4SFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoGAgH9+fn5+f4CCg4SFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoGAgH9+fn5/f4CCg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoGAgH9+fn5/gICCg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoGAgH9/fn5/gICCg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKAgH9/fn9/gICCg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKBgH9/f39/gICCg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKBgH9/f39/gICCg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKBgIB/f39/gICCg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKBgIB/f39/gICCg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKBgICAf39/gICBg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKBgICAf4CAgICBg4SFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKBgICAf4CAgICBgoSFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKBgICAgICAgICBgoSFhoeJiouMjI2NjYyMi4qJiIeGhYSDgoKBgICAgICAgICBgoSFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgICAgICAgIGBgoSFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgYCAgICAgIGBgoSFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgYCAgICAgIGBgoSFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgYGAgICAgIGBgoOFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgYGAgYCAgIGBgoOFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgYGAgYCBgIGBgoOFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgYGBgYCBgIGBgoOFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgYGBgYGBgYGBgoOFhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgYGBgYGBgYGBgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKBgYGBgYGBgYGBgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgYGBgYGBgYGBgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgYGBgYGBgYGCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgYGBgYGBgYGCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgYGBgYGBgYGCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgYGBgYGBgYGCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoGBgYGBgYGCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoGBgYGBgYKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoGBgYGBgYKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoGBgYGBgYKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoGBgYGCgoKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoKBgYGCgoKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoKBgYKCgoKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoKCgYKCgoKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoKCgoKCgoKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoKCgoKCgoKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSDgoKCgoKCgoKCgoKCgoOEhoeIiouMjI2NjYyMi4qJiIeGhYSEgoKCgoKCgoKCgoKCgoOEhoeIiouM';
    
    const audio = new Audio(beepDataUri);
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Mobile audio play failed:', e));
  } catch (error) {
    console.error('Mobile beep error:', error);
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

// Generic notification sound (neutral) with vibration
export const playNotificationSound = () => {
  try {
    // Vibrate device first
    vibrateDevice([200, 100, 200]);
    
    // Try mobile-friendly audio first (works better on iOS/Android)
    playMobileBeep();
    
    // Also try AudioContext if initialized
    if (audioInitialized && audioContext) {
      const ctx = audioContext;
      
      // Single pleasant beep for general notifications
      const frequency = 800; // Hz
      const duration = 0.2; // seconds
      
      playBeep(frequency, duration, ctx.currentTime, ctx);
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Fallback to mobile beep
    playMobileBeep();
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
