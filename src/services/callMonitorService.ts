
import { Capacitor } from '@capacitor/core';

// Type definitions for our call monitoring service
export interface CallInfo {
  phoneNumber: string;
  isIncoming: boolean;
  timestamp: number;
}

/**
 * Service for monitoring phone calls on mobile devices
 * Platform-specific implementations will be injected via Capacitor
 */
class CallMonitorService {
  private listeners: ((callInfo: CallInfo) => void)[] = [];
  private isInitialized = false;
  private isMonitoring = false;
  private simulationMode = !Capacitor.isNativePlatform();

  /**
   * Initialize the call monitoring service, requesting necessary permissions
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    if (this.simulationMode) {
      console.log('Call Monitor running in simulation mode (no native platform detected)');
      this.isInitialized = true;
      return true;
    }
    
    try {
      // In a real implementation, this would interact with a Capacitor plugin
      // to request call monitoring permissions from the OS
      console.log('Initializing call monitoring service');
      
      // Simulated successful initialization for now
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize call monitoring service:', error);
      return false;
    }
  }
  
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
      if (this.simulationMode) {
        console.log('Started call monitoring (simulation mode)');
        this.isMonitoring = true;
        return true;
      }
      
      // In a real implementation, this would activate the native call monitoring
      console.log('Started call monitoring');
      this.isMonitoring = true;
      return true;
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
      if (this.simulationMode) {
        console.log('Stopped call monitoring (simulation mode)');
        this.isMonitoring = false;
        return;
      }
      
      // In a real implementation, this would deactivate the native call monitoring
      console.log('Stopped call monitoring');
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
   * This is used internally and by the demo mode
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
   * This will trigger a random call event with 70% chance of being authentic
   */
  startDemoCall(): CallInfo {
    const phoneNumber = this.generateAustralianPhoneNumber();
    const callInfo: CallInfo = {
      phoneNumber,
      isIncoming: Math.random() > 0.3, // 70% chance of incoming call
      timestamp: Date.now()
    };
    
    this.notifyCallEvent(callInfo);
    return callInfo;
  }
}

export const callMonitorService = new CallMonitorService();
