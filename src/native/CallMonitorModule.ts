
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// Call state constants
export enum CallState {
  IDLE = 'IDLE',
  RINGING = 'RINGING',
  OFFHOOK = 'OFFHOOK',
  DISCONNECTED = 'DISCONNECTED'
}

export interface CallInfo {
  phoneNumber: string;
  isIncoming: boolean;
  timestamp: number;
  state: CallState;
}

// Get the native module if available
const NativeCallMonitorModule = Platform.select({
  android: NativeModules.CallMonitorModule,
  ios: NativeModules.CallMonitorModule,
  default: null,
});

// Create event emitter for native events
const callEventEmitter = NativeCallMonitorModule 
  ? new NativeEventEmitter(NativeCallMonitorModule)
  : null;

/**
 * JavaScript interface for call monitoring
 */
class CallMonitor {
  private isInitialized = false;
  private isMonitoring = false;
  private callListeners: ((callInfo: CallInfo) => void)[] = [];
  private simulatedCallInterval: NodeJS.Timeout | null = null;
  private eventSubscription: any = null;

  /**
   * Check if call monitoring is available on this device
   */
  async isAvailable(): Promise<boolean> {
    if (!NativeCallMonitorModule) {
      console.log('Call monitoring not available on this platform');
      return false;
    }
    
    try {
      return await NativeCallMonitorModule.isAvailable();
    } catch (error) {
      console.error('Error checking call monitoring availability:', error);
      return false;
    }
  }

  /**
   * Request necessary permissions for call monitoring
   * @returns true if permissions granted, false otherwise
   */
  async requestPermissions(): Promise<boolean> {
    if (!NativeCallMonitorModule) {
      console.log('Call monitoring not available on this platform');
      return false;
    }
    
    try {
      return await NativeCallMonitorModule.requestPermissions();
    } catch (error) {
      console.error('Error requesting call monitoring permissions:', error);
      return false;
    }
  }

  /**
   * Initialize the call monitor
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    if (!NativeCallMonitorModule) {
      console.log('Using simulation mode since native module is not available');
      this.isInitialized = true;
      return true;
    }
    
    try {
      const result = await NativeCallMonitorModule.initialize();
      
      // Set up event listener for call state changes
      if (callEventEmitter && !this.eventSubscription) {
        this.eventSubscription = callEventEmitter.addListener(
          'CallStateChanged',
          (callInfo: CallInfo) => {
            this.callListeners.forEach(listener => listener(callInfo));
          }
        );
      }
      
      this.isInitialized = result;
      return result;
    } catch (error) {
      console.error('Error initializing call monitor:', error);
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

    if (!NativeCallMonitorModule) {
      // In simulation mode, start occasional demo calls
      this.simulatedCallInterval = setInterval(() => {
        if (Math.random() < 0.05) {
          this.startDemoCall();
        }
      }, 60000);
      
      this.isMonitoring = true;
      return true;
    }
    
    try {
      const result = await NativeCallMonitorModule.startMonitoring();
      this.isMonitoring = result;
      return result;
    } catch (error) {
      console.error('Error starting call monitoring:', error);
      return false;
    }
  }

  /**
   * Stop monitoring calls
   */
  async stopMonitoring(): Promise<boolean> {
    if (!this.isMonitoring) return true;

    if (!NativeCallMonitorModule) {
      if (this.simulatedCallInterval) {
        clearInterval(this.simulatedCallInterval);
        this.simulatedCallInterval = null;
      }
      
      this.isMonitoring = false;
      return true;
    }
    
    try {
      const result = await NativeCallMonitorModule.stopMonitoring();
      this.isMonitoring = false;
      return result;
    } catch (error) {
      console.error('Error stopping call monitoring:', error);
      return false;
    }
  }

  /**
   * Register a listener for call events
   */
  addCallListener(listener: (callInfo: CallInfo) => void): void {
    this.callListeners.push(listener);
  }

  /**
   * Remove a listener from call events
   */
  removeCallListener(listener: (callInfo: CallInfo) => void): void {
    this.callListeners = this.callListeners.filter(l => l !== listener);
  }

  /**
   * Start a simulated call for demo purposes
   */
  startDemoCall(): CallInfo {
    const generatePhoneNumber = (): string => {
      // Generate a random phone number
      const prefix = '+1';
      // Generate 10 random digits
      const randomPart = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      // Format as +1 (XXX) XXX-XXXX
      return `${prefix} (${randomPart.substring(0, 3)}) ${randomPart.substring(3, 6)}-${randomPart.substring(6, 10)}`;
    };

    const phoneNumber = generatePhoneNumber();
    const isIncoming = Math.random() > 0.3; // 70% chance of incoming call
    
    const callInfo: CallInfo = {
      phoneNumber,
      isIncoming,
      timestamp: Date.now(),
      state: CallState.RINGING
    };

    // Notify all listeners
    this.callListeners.forEach(listener => listener(callInfo));
    
    // After a short delay, move to OFFHOOK state (call answered)
    setTimeout(() => {
      const offhookInfo = {
        ...callInfo,
        state: CallState.OFFHOOK
      };
      this.callListeners.forEach(listener => listener(offhookInfo));
      
      // After a longer delay, end the call
      setTimeout(() => {
        const disconnectedInfo = {
          ...callInfo,
          state: CallState.DISCONNECTED
        };
        this.callListeners.forEach(listener => listener(disconnectedInfo));
      }, 10000 + Math.random() * 20000); // Call duration between 10-30 seconds
    }, 2000);
    
    return callInfo;
  }

  /**
   * End a call (if supported by the platform)
   */
  async endCall(): Promise<boolean> {
    if (!NativeCallMonitorModule) {
      console.log('Simulated ending call');
      return true;
    }
    
    try {
      return await NativeCallMonitorModule.endCall();
    } catch (error) {
      console.error('Error ending call:', error);
      return false;
    }
  }

  /**
   * Clean up resources when component unmounts
   */
  cleanup() {
    if (this.eventSubscription) {
      this.eventSubscription.remove();
      this.eventSubscription = null;
    }
    
    if (this.simulatedCallInterval) {
      clearInterval(this.simulatedCallInterval);
      this.simulatedCallInterval = null;
    }
    
    this.stopMonitoring();
    this.callListeners = [];
  }
}

export const callMonitorModule = new CallMonitor();
