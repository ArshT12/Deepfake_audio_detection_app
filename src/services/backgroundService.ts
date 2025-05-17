
import { AppState, AppStateStatus, Platform } from 'react-native';
import { callMonitorModule } from '../native/CallMonitorModule';

/**
 * Service for managing background tasks for call monitoring
 */
class BackgroundService {
  private isRunning: boolean = false;
  private appStateSubscription: any = null;
  private useFallbackMode: boolean = false;
  
  /**
   * Start background call monitoring service
   */
  async startBackgroundMonitoring(): Promise<boolean> {
    if (this.isRunning) {
      console.log('Background monitoring is already running');
      return true;
    }
    
    try {
      // Check if direct call audio access is available
      const directAccessAvailable = await callMonitorModule.canAccessCallAudio();
      this.useFallbackMode = !directAccessAvailable;
      
      if (this.useFallbackMode) {
        console.log('Using fallback monitoring mode (loudspeaker)');
      } else {
        console.log('Using direct call audio monitoring');
      }
      
      // Start native call monitoring
      const started = await callMonitorModule.startMonitoring(this.useFallbackMode);
      
      if (!started) {
        console.error('Failed to start call monitoring');
        return false;
      }
      
      // Set up app state listener to handle app going to background
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
      
      this.isRunning = true;
      console.log('Background call monitoring service started');
      return true;
    } catch (error) {
      console.error('Failed to start background monitoring:', error);
      return false;
    }
  }
  
  /**
   * Handle app state changes (foreground/background)
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('App has come to the foreground');
      // Refresh monitoring when app comes back to foreground
      if (this.isRunning) {
        callMonitorModule.refreshMonitoring(this.useFallbackMode);
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      console.log('App has gone to the background');
      // Ensure background monitoring continues
      if (this.isRunning) {
        callMonitorModule.optimizeBackgroundMonitoring(this.useFallbackMode);
      }
    }
  };
  
  /**
   * Stop background call monitoring service
   */
  async stopBackgroundMonitoring(): Promise<boolean> {
    if (!this.isRunning) {
      return false;
    }
    
    try {
      await callMonitorModule.stopMonitoring();
      
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
      
      this.isRunning = false;
      console.log('Background call monitoring service stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop background monitoring:', error);
      return false;
    }
  }
  
  /**
   * Check if background monitoring is currently running
   */
  isMonitoringActive(): boolean {
    return this.isRunning;
  }
  
  /**
   * Check if using fallback mode
   */
  isFallbackModeActive(): boolean {
    return this.useFallbackMode;
  }
  
  /**
   * Check if background services are available on this device
   */
  async areBackgroundServicesAvailable(): Promise<boolean> {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }
  
  /**
   * Request user to enable loudspeaker for fallback mode
   */
  async requestLoudspeakerMode(): Promise<void> {
    if (this.useFallbackMode) {
      await callMonitorModule.promptLoudspeaker();
    }
  }
}

export const backgroundService = new BackgroundService();
