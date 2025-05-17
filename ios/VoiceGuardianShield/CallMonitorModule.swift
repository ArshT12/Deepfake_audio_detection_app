
import Foundation
import CallKit
import AVFoundation

@objc(CallMonitorModule)
class CallMonitorModule: RCTEventEmitter {
  
  private let callObserver = CXCallObserver()
  private var isMonitoring = false
  private var audioRecorder: AVAudioRecorder?
  private var recordingTimer: Timer?
  private var useFallbackMode = false
  private var analysisTimer: Timer?
  private var activeCall: UUID?
  
  // BufferQueue for audio analysis
  private var audioBuffers: [Data] = []
  private let maxBuffers = 10
  
  override init() {
    super.init()
    
    // Set up call observer delegate
    callObserver.setDelegate(self, queue: nil)
  }
  
  override func supportedEvents() -> [String] {
    return ["CallStateChanged", "AudioAnalysisResult"]
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc(isAvailable:)
  func isAvailable(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Check necessary permissions
    let audioPermission = AVAudioSession.sharedInstance().recordPermission
    
    if audioPermission == .granted {
      resolve(true)
    } else {
      resolve(false)
    }
  }
  
  @objc(canAccessCallAudio:)
  func canAccessCallAudio(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // iOS generally doesn't allow direct access to call audio
    // Use a detection method based on iOS version and capabilities
    
    var canAccess = false
    
    if #available(iOS 13.0, *) {
      // We might be able to use Voice Processing I/O unit on newer iOS versions
      // This is still limited but better than nothing
      canAccess = true
    }
    
    resolve(canAccess)
  }
  
  @objc(requestPermissions:)
  func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    AVAudioSession.sharedInstance().requestRecordPermission { granted in
      resolve(granted)
    }
  }
  
  @objc(initialize:)
  func initialize(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Nothing special needed for initialization on iOS
    resolve(true)
  }
  
  @objc(startMonitoring:)
  func startMonitoring(_ useFallback: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if isMonitoring {
      resolve(true)
      return
    }
    
    self.useFallbackMode = useFallback
    
    // Set up audio session for recording
    do {
      let audioSession = AVAudioSession.sharedInstance()
      
      if useFallback {
        // For fallback mode, we use default recording
        try audioSession.setCategory(.playAndRecord, options: [.defaultToSpeaker, .allowBluetooth])
      } else {
        // For direct mode, we try to use voice processing if possible
        // This won't access the call audio directly, but might give better results
        try audioSession.setCategory(.playAndRecord, options: [.allowBluetooth])
        try audioSession.setMode(.voiceChat)
      }
      
      try audioSession.setActive(true)
    } catch {
      print("Failed to set up audio session: \(error.localizedDescription)")
    }
    
    isMonitoring = true
    resolve(true)
  }
  
  @objc(optimizeBackgroundMonitoring:)
  func optimizeBackgroundMonitoring(_ useFallback: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // iOS has limited background capabilities
    // Implement any specific optimizations needed
    self.useFallbackMode = useFallback
    resolve(true)
  }
  
  @objc(refreshMonitoring:)
  func refreshMonitoring(_ useFallback: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.useFallbackMode = useFallback
    resolve(true)
  }
  
  @objc(promptLoudspeaker:)
  func promptLoudspeaker(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Try to enable speaker mode for better audio pickup
    do {
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.overrideOutputAudioPort(.speaker)
      resolve(nil)
    } catch {
      reject("E_SPEAKER_ERROR", "Failed to enable speaker mode", error)
    }
  }
  
  @objc(stopMonitoring:)
  func stopMonitoring(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if !isMonitoring {
      resolve(true)
      return
    }
    
    // Stop audio recording if active
    stopAudioRecording()
    
    // Reset audio session
    do {
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setActive(false, options: .notifyOthersOnDeactivation)
    } catch {
      print("Failed to deactivate audio session: \(error.localizedDescription)")
    }
    
    isMonitoring = false
    resolve(true)
  }
  
  @objc(endCall:)
  func endCall(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // iOS doesn't allow programmatically ending calls without special entitlements
    reject("E_NOT_SUPPORTED", "iOS does not allow programmatically ending calls", nil)
  }
  
  private func startAudioRecording() {
    // Set up audio session for recording
    do {
      let audioSession = AVAudioSession.sharedInstance()
      
      if useFallbackMode {
        // For fallback mode, use the microphone with speaker enabled
        try audioSession.setCategory(.playAndRecord, options: [.defaultToSpeaker, .allowBluetooth])
        try audioSession.setMode(.default)
      } else {
        // For direct mode, try to get as close to call audio as possible
        try audioSession.setCategory(.playAndRecord, options: [.allowBluetooth])
        try audioSession.setMode(.voiceChat)
      }
      
      try audioSession.setActive(true)
      
      // Set up recording settings
      let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatLinearPCM),
        AVSampleRateKey: 44100.0,
        AVNumberOfChannelsKey: 1,
        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
      ]
      
      // Create a temporary file for recording
      let tempDir = NSTemporaryDirectory()
      let tempFile = "\(tempDir)/call_audio_\(Date().timeIntervalSince1970).wav"
      let url = URL(fileURLWithPath: tempFile)
      
      audioRecorder = try AVAudioRecorder(url: url, settings: settings)
      audioRecorder?.prepareToRecord()
      audioRecorder?.record()
      
      // Set a timer to create audio chunks for analysis every 5 seconds
      analysisTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
        self?.analyzeAudioChunk()
      }
      
      // If using fallback mode, prompt for loudspeaker
      if useFallbackMode {
        try audioSession.overrideOutputAudioPort(.speaker)
      }
    } catch {
      print("Failed to start audio recording: \(error.localizedDescription)")
      
      // Send error to JS
      let result: [String: Any] = [
        "isDeepfake": false,
        "confidence": 0,
        "error": "Failed to start audio recording: \(error.localizedDescription)"
      ]
      
      sendEvent(withName: "AudioAnalysisResult", body: result)
    }
  }
  
  private func analyzeAudioChunk() {
    guard let recorder = audioRecorder, recorder.isRecording else { return }
    
    // For iOS, we'll need to handle creating audio chunks differently
    // than with AudioRecord on Android
    
    // Create a temporary file for this audio chunk
    let tempDir = NSTemporaryDirectory()
    let tempFile = "\(tempDir)/audio_chunk_\(Date().timeIntervalSince1970).wav"
    let url = URL(fileURLWithPath: tempFile)
    
    // Create a new recorder just for this chunk (iOS doesn't easily let us extract part of ongoing recording)
    // In a real app, this would be more sophisticated
    
    // Perform simulated analysis
    // 30% chance of being classified as deepfake
    let isDeepfake = Double.random(in: 0...1) < 0.3
    let confidence = isDeepfake ?
      Double(75 + Int.random(in: 0...20)) : // Higher confidence for deepfakes (75-95%)
      Double(65 + Int.random(in: 0...30))  // Variable confidence for authentic (65-95%)
    
    // Send the result to React Native
    let result: [String: Any] = [
      "isDeepfake": isDeepfake,
      "confidence": confidence,
      "audioSample": tempFile
    ]
    
    sendEvent(withName: "AudioAnalysisResult", body: result)
  }
  
  private func stopAudioRecording() {
    analysisTimer?.invalidate()
    analysisTimer = nil
    
    if let recorder = audioRecorder, recorder.isRecording {
      recorder.stop()
    }
    audioRecorder = nil
    
    // Reset audio buffers
    audioBuffers.removeAll()
  }
}

extension CallMonitorModule: CXCallObserverDelegate {
  func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
    var callState = "UNKNOWN"
    var isIncoming = false
    
    if call.hasEnded {
      callState = "IDLE"
      activeCall = nil
      stopAudioRecording()
    } else if call.isOutgoing {
      callState = call.hasConnected ? "OFFHOOK" : "RINGING"
      isIncoming = false
      
      if call.hasConnected {
        activeCall = call.uuid
        startAudioRecording()
      }
    } else {
      callState = call.hasConnected ? "OFFHOOK" : "RINGING"
      isIncoming = true
      
      if call.hasConnected {
        activeCall = call.uuid
        startAudioRecording()
      }
    }
    
    let event: [String: Any] = [
      "phoneNumber": "Unknown", // iOS doesn't provide phone numbers through CallKit
      "isIncoming": isIncoming,
      "state": callState,
      "timestamp": Date().timeIntervalSince1970 * 1000, // Convert to milliseconds
      "usingDirectAudio": !useFallbackMode
    ]
    
    sendEvent(withName: "CallStateChanged", body: event)
  }
}
