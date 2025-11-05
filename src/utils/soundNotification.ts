// Create notification sound for CALL signals (ascending)
export const playCallNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Three ascending beeps for CALL (buy/up)
    const frequencies = [600, 800, 1000]; // Hz - ascending
    const duration = 0.15; // seconds per beep
    const gap = 0.05; // seconds between beeps
    
    frequencies.forEach((frequency, index) => {
      const startTime = audioContext.currentTime + (index * (duration + gap));
      
      // Create oscillator for tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
  } catch (error) {
    console.error('Error playing CALL notification sound:', error);
  }
};

// Create notification sound for PUT signals (descending)
export const playPutNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Three descending beeps for PUT (sell/down)
    const frequencies = [1000, 800, 600]; // Hz - descending
    const duration = 0.15; // seconds per beep
    const gap = 0.05; // seconds between beeps
    
    frequencies.forEach((frequency, index) => {
      const startTime = audioContext.currentTime + (index * (duration + gap));
      
      // Create oscillator for tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
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
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Single pleasant beep for general notifications
    const frequency = 800; // Hz
    const duration = 0.2; // seconds
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
    
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

// Alternative: Play system notification sound
export const playSystemSound = () => {
  try {
    // Create a simple data URL for a beep sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi7787ejTYQFHG//tCQXwwKTKP/95+JOQY0et/3z4c1CRxztP7Nj0ANCFCn4+67YhwEPI/W8LdlHAY5jdfy0HkpBSp8y/DViTYIF2fA7+uhVBELTKXq8L1mHAU4kdfy0HksBS1/y/DeizYJGWa77syeUxEMTqL/9qJRAA==');
    audio.volume = 0.5;
    audio.play().catch(err => console.error('Error playing sound:', err));
  } catch (error) {
    console.error('Error playing system sound:', error);
  }
};
