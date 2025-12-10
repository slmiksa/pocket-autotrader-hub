// Simple state management using a custom event system for chart fullscreen state
let chartFullscreenState = false;
const fullscreenListeners = new Set<(value: boolean) => void>();

export const setChartFullscreen = (value: boolean) => {
  chartFullscreenState = value;
  fullscreenListeners.forEach(listener => listener(value));
};

export const getChartFullscreen = () => chartFullscreenState;

export const subscribeToChartFullscreen = (listener: (value: boolean) => void) => {
  fullscreenListeners.add(listener);
  return () => {
    fullscreenListeners.delete(listener);
  };
};
