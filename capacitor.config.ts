import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.964ca3d21e0e4928af6c8510be7d5ea5',
  appName: 'pocket-autotrader-hub',
  webDir: 'dist',
  server: {
    url: 'https://964ca3d2-1e0e-4928-af6c-8510be7d5ea5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    backgroundColor: '#0a0f1a'
  }
};

export default config;
