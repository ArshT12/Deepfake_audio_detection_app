
/// <reference types="vite/client" />

interface Window {
  CallMonitorModule?: {
    isAvailable: () => Promise<boolean>;
    canAccessCallAudio: () => Promise<boolean>;
    requestPermissions: () => Promise<boolean>;
    initialize: () => Promise<boolean>;
    startMonitoring: (useFallback?: boolean) => Promise<boolean>;
    optimizeBackgroundMonitoring: (useFallback?: boolean) => Promise<boolean>;
    refreshMonitoring: (useFallback?: boolean) => Promise<boolean>;
    promptLoudspeaker: () => Promise<boolean>;
    stopMonitoring: () => Promise<boolean>;
    endCall: () => Promise<boolean>;
  };
}
