// Audio alert utilities for Smart Recovery Trading System

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.error('Error playing tone:', error);
  }
};

export const playBuySignalAlert = () => {
  // Rising tones for buy signal
  setTimeout(() => playTone(523, 0.15, 'sine'), 0);    // C5
  setTimeout(() => playTone(659, 0.15, 'sine'), 150);  // E5
  setTimeout(() => playTone(784, 0.3, 'sine'), 300);   // G5
};

export const playSellSignalAlert = () => {
  // Falling tones for sell signal
  setTimeout(() => playTone(784, 0.15, 'sine'), 0);    // G5
  setTimeout(() => playTone(659, 0.15, 'sine'), 150);  // E5
  setTimeout(() => playTone(523, 0.3, 'sine'), 300);   // C5
};

export const playSuccessAlert = () => {
  // Happy melody for profit/recovery
  setTimeout(() => playTone(523, 0.1, 'sine'), 0);
  setTimeout(() => playTone(659, 0.1, 'sine'), 100);
  setTimeout(() => playTone(784, 0.1, 'sine'), 200);
  setTimeout(() => playTone(1047, 0.3, 'sine'), 300);
};

export const playWarningAlert = () => {
  // Warning beep
  playTone(440, 0.5, 'square');
};

export const playErrorAlert = () => {
  // Low error tone
  setTimeout(() => playTone(220, 0.2, 'sawtooth'), 0);
  setTimeout(() => playTone(196, 0.3, 'sawtooth'), 200);
};

export const playNotificationSound = () => {
  // Simple notification
  playTone(880, 0.15, 'sine');
};

// Browser notification helper
export const sendBrowserNotification = (title: string, body: string, icon?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.png',
      badge: '/favicon.png'
    });
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Initialize audio context on user interaction
export const initializeAudio = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (error) {
    console.error('Error initializing audio:', error);
  }
};
