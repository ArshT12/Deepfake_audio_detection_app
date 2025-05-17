
import Foundation
import CallKit
import AVFoundation

@objc(CallMonitorModule)
class CallMonitorModule: NSObject {
  
  private let callObserver = CXCallObserver()
  private var hasListeners = false
  private var isMonitoring = false
  private var audioRecorder: AVAudioRecorder?
  private var recordingTimer: Timer?
  private var bridge: RCTBridge?
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func setBridge(_ bridge: RCTBridge!) {
    self.bridge = bridge
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
  func startMonitoring(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if isMonitoring {
      resolve(true)
      return
    }
    
    // Start observing call state changes
    callObserver.setDelegate(self, queue: nil)
    isMonitoring = true
    resolve(true)
  }
  
  @objc(stopMonitoring:)
  func stopMonitoring(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if !isMonitoring {
      resolve(true)
      return
    }
    
    // Stop audio recording if active
    stopAudioRecording()
    
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
      try audioSession.setCategory(.playAndRecord, mode: .default)
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
      recordingTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
        self?.sendAudioChunkForAnalysis()
      }
    } catch {
      print("Failed to start audio recording: \(error.localizedDescription)")
    }
  }
  
  private func stopAudioRecording() {
    recordingTimer?.invalidate()
    recordingTimer = nil
    
    if let recorder = audioRecorder, recorder.isRecording {
      recorder.stop()
    }
    audioRecorder = nil
  }
  
  private func sendAudioChunkForAnalysis() {
    guard let recorder = audioRecorder, recorder.isRecording else { return }
    
    // Create a temporary file for this audio chunk
    let tempDir = NSTemporaryDirectory()
    let tempFile = "\(tempDir)/audio_chunk_\(Date().timeIntervalSince1970).wav"
    let url = URL(fileURLWithPath: tempFile)
    
    // We would need to extract a portion of the recording here
    // For simplicity, we'll just notify JS without actual audio data
    sendEventWithName("AudioChunkReady", body: ["audioPath": tempFile])
  }
  
  @objc
  func startObserving() {
    hasListeners = true
  }
  
  @objc
  func stopObserving() {
    hasListeners = false
  }
  
  private func sendEventWithName(_ name: String, body: Any?) {
    if hasListeners {
      bridge?.eventDispatcher()?.sendDeviceEvent(withName: name, body: body)
    }
  }
}

extension CallMonitorModule: CXCallObserverDelegate {
  func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
    var callState = "UNKNOWN"
    var isIncoming = false
    
    if call.hasEnded {
      callState = "IDLE"
      stopAudioRecording()
    } else if call.isOutgoing {
      callState = call.hasConnected ? "OFFHOOK" : "RINGING"
      isIncoming = false
      
      if call.hasConnected {
        startAudioRecording()
      }
    } else {
      callState = call.hasConnected ? "OFFHOOK" : "RINGING"
      isIncoming = true
      
      if call.hasConnected {
        startAudioRecording()
      }
    }
    
    let event: [String: Any] = [
      "phoneNumber": "Unknown", // iOS doesn't provide phone numbers through CallKit
      "isIncoming": isIncoming,
      "state": callState,
      "timestamp": Date().timeIntervalSince1970 * 1000 // Convert to milliseconds
    ]
    
    sendEventWithName("CallStateChanged", body: event)
  }
}
