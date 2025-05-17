
import { AppState, AppStateStatus, Platform } from 'react-native';
import { callMonitorModule } from '../native/CallMonitorModule';

/**
 * Service for managing background tasks for call monitoring
 */
class BackgroundService {
  private isRunning: boolean = false;
  private appStateSubscription: any = null;
  
  /**
   * Start background call monitoring service
   */
  async startBackgroundMonitoring(): Promise<boolean> {
    if (this.isRunning) {
      console.log('Background monitoring is already running');
      return true;
    }
    
    try {
      // Start native call monitoring
      const started = await callMonitorModule.startMonitoring();
      
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
      // Optionally refresh monitoring when app comes back to foreground
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      console.log('App has gone to the background');
      // Handle background state if needed
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
   * Check if background services are available on this device
   */
  async areBackgroundServicesAvailable(): Promise<boolean> {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }
}

export const backgroundService = new BackgroundService();
