
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.voice.guardian.shield',
  appName: 'Voice Guardian Shield',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  plugins: {
    BackgroundRunner: {
      label: 'com.voiceguardian.monitoring',
      src: 'background.js',
      event: 'start',
      autoStart: true
    },
    Permissions: {
      phone: true,
      microphone: true,
      notifications: true
    }
  }
};

export default config;
