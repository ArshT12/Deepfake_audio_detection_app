
import { BackgroundRunner } from '@capacitor/background-runner';
import { Capacitor } from '@capacitor/core';

/**
 * Service for managing background tasks for call monitoring
 */
class BackgroundService {
  private isAvailable: boolean;
  private isRunning: boolean = false;
  
  constructor() {
    // Check if we're on a native platform and background runner is available
    this.isAvailable = Capacitor.isNativePlatform();
    
    // Initialize event listeners for background task events
    if (this.isAvailable) {
      // Use the correct event listener pattern for BackgroundRunner
      // The plugin doesn't have addListener but uses addEventListener
      document.addEventListener('backgroundEvent', (event: Event) => {
        const customEvent = event as CustomEvent;
        console.log('Background event received:', customEvent.detail);
        
        if (customEvent.detail?.event === 'heartbeat') {
          console.log('Background service is active, heartbeat received');
        }
      });
    }
  }
  
  /**
   * Start background call monitoring service
   */
  async startBackgroundMonitoring(): Promise<boolean> {
    if (!this.isAvailable) {
      console.log('Background services not available in web environment');
      return false;
    }
    
    if (this.isRunning) {
      console.log('Background monitoring is already running');
      return true;
    }
    
    try {
      // Start the background monitoring service
      await BackgroundRunner.dispatchEvent({
        label: 'com.voiceguardian.monitoring',
        event: 'start',
        details: {
          timestamp: new Date().toISOString()
        }
      });
      
      this.isRunning = true;
      console.log('Background call monitoring service started');
      return true;
    } catch (error) {
      console.error('Failed to start background monitoring:', error);
      return false;
    }
  }
  
  /**
   * Stop background call monitoring service
   */
  async stopBackgroundMonitoring(): Promise<boolean> {
    if (!this.isAvailable || !this.isRunning) {
      return false;
    }
    
    try {
      await BackgroundRunner.dispatchEvent({
        label: 'com.voiceguardian.monitoring',
        event: 'stop',
        details: {
          timestamp: new Date().toISOString()
        }
      });
      
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
  areBackgroundServicesAvailable(): boolean {
    return this.isAvailable;
  }
}

export const backgroundService = new BackgroundService();
