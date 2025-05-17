
// Call Monitoring Service
// Handles all call-related detection and monitoring

export interface CallInfo {
  id: string;
  phoneNumber: string;
  timestamp: number;
  callType: 'incoming' | 'outgoing' | 'unknown';
  state?: CallState;
  usingDirectAudio?: boolean;
  isIncoming?: boolean;
  isDeepfake: boolean; // Changed from optional to required
  confidence: number;  // Changed from optional to required
  audioSample?: string;
}

// Define CallState enum and export it
export enum CallState {
  IDLE = 'IDLE',
  RINGING = 'RINGING',
  OFFHOOK = 'OFFHOOK',
  DISCONNECTED = 'DISCONNECTED'
}

class CallMonitorService {
  private isInitialized = false;
  private isMonitoring = false;
  private currentCallInfo: CallInfo | null = null;
  private callListeners: ((call: CallInfo) => void)[] = [];
  
  // Check if the call monitoring service is available on this device
  async isAvailable(): Promise<boolean> {
    try {
      if (window.CallMonitorModule) {
        return await window.CallMonitorModule.isAvailable();
      }
      console.log('CallMonitorModule not available in this environment');
      return false;
    } catch (error) {
      console.error('Error checking call monitor availability:', error);
      return false;
    }
  }
  
  // Check if we can directly access call audio
  async canAccessCallAudio(): Promise<boolean> {
    try {
      if (window.CallMonitorModule) {
        return await window.CallMonitorModule.canAccessCallAudio();
      }
      return false;
    } catch (error) {
      console.error('Error checking call audio access:', error);
      return false;
    }
  }
  
  // Request necessary permissions for call monitoring
  async requestPermissions(): Promise<boolean> {
    try {
      if (window.CallMonitorModule) {
        return await window.CallMonitorModule.requestPermissions();
      }
      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }
  
  // Initialize the call monitoring service
  async initialize(): Promise<boolean> {
    try {
      if (window.CallMonitorModule) {
        const result = await window.CallMonitorModule.initialize();
        this.isInitialized = result;
        return result;
      }
      return false;
    } catch (error) {
      console.error('Error initializing call monitor:', error);
      return false;
    }
  }
  
  // Start monitoring calls with optional fallback mode
  async startMonitoring(useFallback = false): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }
      
      if (window.CallMonitorModule) {
        const result = await window.CallMonitorModule.startMonitoring(useFallback);
        this.isMonitoring = result;
        return result;
      }
      return false;
    } catch (error) {
      console.error('Error starting call monitoring:', error);
      return false;
    }
  }
  
  // Optimize monitoring for background operation
  async optimizeBackgroundMonitoring(useFallback = false): Promise<boolean> {
    try {
      if (window.CallMonitorModule) {
        return await window.CallMonitorModule.optimizeBackgroundMonitoring(useFallback);
      }
      return false;
    } catch (error) {
      console.error('Error optimizing background monitoring:', error);
      return false;
    }
  }
  
  // Refresh monitoring (useful after app comes back from background)
  async refreshMonitoring(useFallback = false): Promise<boolean> {
    try {
      if (window.CallMonitorModule) {
        return await window.CallMonitorModule.refreshMonitoring(useFallback);
      }
      return false;
    } catch (error) {
      console.error('Error refreshing call monitoring:', error);
      return false;
    }
  }
  
  // Prompt user to enable loudspeaker (for fallback mode)
  async promptLoudspeaker(): Promise<boolean> {
    try {
      if (window.CallMonitorModule) {
        return await window.CallMonitorModule.promptLoudspeaker();
      }
      return false;
    } catch (error) {
      console.error('Error prompting loudspeaker:', error);
      return false;
    }
  }
  
  // Stop call monitoring
  async stopMonitoring(): Promise<boolean> {
    try {
      if (window.CallMonitorModule) {
        const result = await window.CallMonitorModule.stopMonitoring();
        if (result) this.isMonitoring = false;
        return result;
      }
      return false;
    } catch (error) {
      console.error('Error stopping call monitoring:', error);
      return false;
    }
  }
  
  // End the current call (if permissions allow)
  async endCall(): Promise<boolean> {
    try {
      if (window.CallMonitorModule) {
        return await window.CallMonitorModule.endCall();
      }
      return false;
    } catch (error) {
      console.error('Error ending call:', error);
      return false;
    }
  }
  
  // Add a listener for call events
  addCallListener(listener: (call: CallInfo) => void): void {
    this.callListeners.push(listener);
  }
  
  // Add a listener for analysis events - for AudioAnalysis page
  addAnalysisListener(listener: (call: CallInfo) => void): void {
    this.addCallListener(listener);
  }
  
  // Remove a call listener
  removeCallListener(listener: (call: CallInfo) => void): void {
    this.callListeners = this.callListeners.filter(l => l !== listener);
  }
  
  // Remove an analysis listener - alias for removeCallListener
  removeAnalysisListener(listener: (call: CallInfo) => void): void {
    this.removeCallListener(listener);
  }
  
  // Notify all listeners about a call event
  notifyCallEvent(call: CallInfo): void {
    this.currentCallInfo = call;
    this.callListeners.forEach(listener => listener(call));
  }
  
  // Start a demo call for testing purposes
  startDemoCall(): CallInfo {
    const phoneNumbers = [
      '+1 (555) 123-4567',
      '+44 20 7946 0958',
      '+61 2 8046 6789',
    ];
    
    const callInfo: CallInfo = {
      id: Date.now().toString(),
      phoneNumber: phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)],
      timestamp: Date.now(),
      callType: Math.random() > 0.5 ? 'incoming' : 'outgoing',
      state: CallState.RINGING,
      usingDirectAudio: Math.random() > 0.5,
      isIncoming: Math.random() > 0.5,
      isDeepfake: false, // Default value to satisfy the required property
      confidence: 0      // Default value to satisfy the required property
    };
    
    this.currentCallInfo = callInfo;
    setTimeout(() => {
      this.notifyCallEvent(callInfo);
    }, 1000);
    
    return callInfo;
  }
  
  // Get the current call info
  getCurrentCall(): CallInfo | null {
    return this.currentCallInfo;
  }
  
  // Check if using direct audio - needed for AudioAnalysis page
  isUsingDirectAudio(): boolean {
    return this.currentCallInfo?.usingDirectAudio ?? false;
  }
}

// Export as a singleton
export const callMonitorService = new CallMonitorService();
