
import { callMonitorModule, CallInfo } from '../native/CallMonitorModule';
import { Alert, Vibration } from 'react-native';

/**
 * Service for monitoring phone calls on mobile devices
 */
class CallMonitorService {
  private listeners: ((callInfo: CallInfo) => void)[] = [];
  private isInitialized = false;
  private isMonitoring = false;

  /**
   * Initialize the call monitoring service, requesting necessary permissions
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      // Check if call monitoring is available
      const isAvailable = await callMonitorModule.isAvailable();
      
      if (!isAvailable) {
        console.log('Call monitoring is not available on this device');
        // We'll still set initialized to true so we can use the simulated mode
        this.isInitialized = true;
        return true;
      }
      
      // Request needed permissions
      const hasPermissions = await callMonitorModule.requestPermissions();
      
      if (!hasPermissions) {
        console.log('Call monitoring permissions were denied');
        Alert.alert(
          'Permissions Required',
          'Voice Guardian Shield needs call monitoring permissions to detect deepfakes during calls.',
          [
            { text: 'OK' }
          ]
        );
        return false;
      }
      
      // Initialize the native module
      const initialized = await callMonitorModule.initialize();
      
      // Set up call listener
      callMonitorModule.addCallListener(this.handleCallEvent);
      
      this.isInitialized = initialized;
      return initialized;
    } catch (error) {
      console.error('Failed to initialize call monitoring service:', error);
      return false;
    }
  }
  
  /**
   * Handle incoming call events from the native module
   */
  private handleCallEvent = (callInfo: CallInfo) => {
    console.log('Call event received:', callInfo);
    
    // Notify all registered listeners
    this.notifyCallEvent(callInfo);
  };
  
  /**
   * Start monitoring calls
   */
  async startMonitoring(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }
    
    if (this.isMonitoring) return true;
    
    try {
      const result = await callMonitorModule.startMonitoring();
      this.isMonitoring = result;
      return result;
    } catch (error) {
      console.error('Failed to start call monitoring:', error);
      return false;
    }
  }
  
  /**
   * Stop monitoring calls
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;
    
    try {
      await callMonitorModule.stopMonitoring();
      this.isMonitoring = false;
    } catch (error) {
      console.error('Failed to stop call monitoring:', error);
    }
  }
  
  /**
   * Register a listener for call events
   */
  addCallListener(listener: (callInfo: CallInfo) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener from call events
   */
  removeCallListener(listener: (callInfo: CallInfo) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Notify all listeners of a call event
   */
  notifyCallEvent(callInfo: CallInfo): void {
    this.listeners.forEach(listener => listener(callInfo));
  }
  
  /**
   * Generate a random Australian phone number for demo mode
   */
  generateAustralianPhoneNumber(): string {
    // Australian mobile numbers start with 04
    const prefix = '04';
    // Generate 8 more random digits
    const randomPart = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    // Format as 04XX XXX XXX
    return `${prefix}${randomPart.substring(0, 2)} ${randomPart.substring(2, 5)} ${randomPart.substring(5, 8)}`;
  }
  
  /**
   * Start a simulated call for demo purposes
   */
  startDemoCall(): CallInfo {
    return callMonitorModule.startDemoCall();
  }
  
  /**
   * End the current call
   */
  async endCall(): Promise<boolean> {
    try {
      return await callMonitorModule.endCall();
    } catch (error) {
      console.error('Error ending call:', error);
      return false;
    }
  }
}

export const callMonitorService = new CallMonitorService();
