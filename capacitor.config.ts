
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.08e949ac2d6345bab13d0a9ec463f952',
  appName: 'Voice Guardian Shield',
  webDir: 'dist',
  server: {
    url: 'https://08e949ac-2d63-45ba-b13d-0a9ec463f952.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    // Add any Capacitor plugins configuration here
  }
};

export default config;
