
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'voice-guardian-shield' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// Get the native module
const CallMonitorModule = NativeModules.CallMonitorModule
  ? NativeModules.CallMonitorModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

// Create an event emitter for native events
const callMonitorEventEmitter = new NativeEventEmitter(CallMonitorModule);

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

/**
 * JavaScript interface for the native call monitor
 */
class CallMonitor {
  private isInitialized = false;
  private isMonitoring = false;
  private eventSubscription: any = null;
  private callListeners: ((callInfo: CallInfo) => void)[] = [];

  /**
   * Check if call monitoring is available on this device
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await CallMonitorModule.isAvailable();
    } catch (error) {
      console.error('Error checking call monitor availability:', error);
      return false;
    }
  }

  /**
   * Request necessary permissions for call monitoring
   * @returns true if permissions granted, false otherwise
   */
  async requestPermissions(): Promise<boolean> {
    try {
      return await CallMonitorModule.requestPermissions();
    } catch (error) {
      console.error('Error requesting call monitor permissions:', error);
      return false;
    }
  }

  /**
   * Initialize the call monitor
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      const available = await this.isAvailable();
      if (!available) {
        console.log('Call monitoring not available on this device');
        return false;
      }

      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('Call monitoring permissions not granted');
        return false;
      }

      const result = await CallMonitorModule.initialize();
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

    try {
      // Setup event listener before starting the monitor
      if (!this.eventSubscription) {
        this.eventSubscription = callMonitorEventEmitter.addListener(
          'CallStateChanged',
          this.handleCallStateChanged
        );
      }

      const result = await CallMonitorModule.startMonitoring();
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

    try {
      const result = await CallMonitorModule.stopMonitoring();
      
      // Remove the event listener
      if (this.eventSubscription) {
        this.eventSubscription.remove();
        this.eventSubscription = null;
      }
      
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
   * Handle call state changes from native code
   */
  private handleCallStateChanged = (event: any) => {
    const callInfo: CallInfo = {
      phoneNumber: event.phoneNumber || 'Unknown',
      isIncoming: event.isIncoming || false,
      timestamp: event.timestamp || Date.now(),
      state: event.state || CallState.IDLE
    };

    // Notify all listeners
    this.callListeners.forEach(listener => listener(callInfo));
  };

  /**
   * Start a simulated call for demo purposes when running on simulators
   * or when permissions are not available
   */
  startDemoCall(): CallInfo {
    const generateAustralianPhoneNumber = (): string => {
      // Australian mobile numbers start with 04
      const prefix = '04';
      // Generate 8 more random digits
      const randomPart = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      // Format as 04XX XXX XXX
      return `${prefix}${randomPart.substring(0, 2)} ${randomPart.substring(2, 5)} ${randomPart.substring(5, 8)}`;
    };

    const phoneNumber = generateAustralianPhoneNumber();
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
    }, 2000);
    
    return callInfo;
  }

  /**
   * End a call (only works on some Android devices)
   * On iOS this is not supported due to system limitations
   */
  async endCall(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await CallMonitorModule.endCall();
      } else {
        console.log('Ending calls not supported on this platform');
        return false;
      }
    } catch (error) {
      console.error('Error ending call:', error);
      return false;
    }
  }
}

export const callMonitorModule = new CallMonitor();
