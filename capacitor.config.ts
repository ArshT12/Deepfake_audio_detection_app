import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.voice.guardian.shield',
  appName: 'Voice Guardian Shield',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  ios: {
    minVersion: '14.0'  // Required for background-runner
  },
  plugins: {
    BackgroundRunner: {
      label: 'com.voiceguardian.monitoring',
      src: 'background.js',
      event: 'start',
      autoStart: true,
      ios: {
        cpuLimitInSeconds: 600  // 10 min (maximum allowed on iOS)
      }
    },
    Permissions: {
      phone: true,
      microphone: true,
      notifications: true
    }
  }
};

export default config;