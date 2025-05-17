
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Vibration } from 'react-native';
import { callMonitorService } from '../services/callMonitorService';
import { backgroundService } from '../services/backgroundService';
import { deepfakeApi } from '../services/deepfakeApi';
import DetectionStatus from '../components/DetectionStatus';
import Header from '../components/Header';
import Svg, { Path } from 'react-native-svg';

// Create a sound recorder - in a real app, use react-native-audio-recorder-player 
// or similar library to handle audio recording
const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  
  const startRecording = () => {
    setIsRecording(true);
    // Simulate recording for 3 seconds then stop
    setTimeout(() => {
      setIsRecording(false);
      // Simulate detection
      Alert.alert("Recording Complete", "Recording would be analyzed here");
    }, 3000);
  };
  
  return (
    <View style={styles.recorderContainer}>
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPress={startRecording}
        disabled={isRecording}
      >
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
            fill={isRecording ? "#fff" : "none"}
            stroke={isRecording ? "#fff" : "#9b87f5"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
            stroke={isRecording ? "#fff" : "#9b87f5"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      <Text style={styles.recorderText}>
        {isRecording ? "Recording..." : "Tap to Record"}
      </Text>
    </View>
  );
};

const AudioAnalysis: React.FC = () => {
  const { addDetection, settings } = useApp();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<null | { isDeepfake: boolean; confidence: number }>(null);
  const [isCallMonitoring, setIsCallMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState('monitor');
  
  // Call monitor initialization
  useEffect(() => {
    const initCallMonitor = async () => {
      await callMonitorService.initialize();
      
      // Add listener for call events
      callMonitorService.addCallListener((callInfo) => {
        Alert.alert("Call Detected", `${callInfo.isIncoming ? "Incoming" : "Outgoing"} call: ${callInfo.phoneNumber}`);
      });
    };
    
    initCallMonitor();
    
    return () => {
      if (isCallMonitoring) {
        stopCallMonitoring();
      }
    };
  }, []);

  // Call monitoring setup
  useEffect(() => {
    if (isCallMonitoring) {
      startCallMonitoring();
      // Also start background service
      backgroundService.startBackgroundMonitoring();
    } else {
      stopCallMonitoring();
      backgroundService.stopBackgroundMonitoring();
    }
  }, [isCallMonitoring]);
  
  const startCallMonitoring = async () => {
    try {
      // Start the call monitoring service
      const started = await callMonitorService.startMonitoring();
      
      if (!started) {
        Alert.alert("Error", "Failed to start call monitoring");
        setIsCallMonitoring(false);
        return;
      }
      
      // In a real app, this would set up audio recording of calls
      
      Alert.alert("Monitoring Active", `Analyzing audio every ${settings.analysisDuration} seconds`);
      
    } catch (error) {
      console.error('Error starting call monitoring:', error);
      Alert.alert("Error", "Could not access microphone. Please check your permissions.");
      setIsCallMonitoring(false);
    }
  };
  
  const stopCallMonitoring = () => {
    // In a real app, this would stop audio recording
    callMonitorService.stopMonitoring();
  };

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // 30% chance of being classified as deepfake
      const isDeepfake = Math.random() < 0.3;
      
      // Generate a confidence between 65-95%
      const mockConfidence = isDeepfake 
        ? Math.floor(75 + Math.random() * 20) // Higher confidence for deepfakes (75-95%)
        : Math.floor(65 + Math.random() * 30); // Variable confidence for authentic (65-95%)
      
      setDetectionResult({
        isDeepfake,
        confidence: mockConfidence
      });
      
      // Add to detection history
      addDetection({
        isDeepfake,
        confidence: mockConfidence,
        phoneNumber: isCallMonitoring ? 'Live Call' : 'Demo Analysis'
      });
      
      if (isDeepfake && settings.vibrateOnDeepfake) {
        Vibration.vibrate([0, 300, 100, 300]);
      }
      
      setIsAnalyzing(false);
      
      if (isDeepfake) {
        Alert.alert(
          "Deepfake Detected!", 
          `Confidence: ${mockConfidence}%`,
          [{ text: "OK" }]
        );
      }
      
    }, 2000);
  };

  const handleDemoCall = () => {
    simulateAnalysis();
  };

  const TabButton = ({ id, label, icon }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === id && styles.activeTabButton]}
      onPress={() => setActiveTab(id)}
    >
      <Text style={[styles.tabText, activeTab === id && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'monitor':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Call Demo</Text>
            
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoCall}
              disabled={isAnalyzing}
            >
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.demoButtonText}>
                {isAnalyzing ? "Analyzing..." : "Start Demo Call"}
              </Text>
            </TouchableOpacity>
            
            {!isAnalyzing && detectionResult && (
              <View style={styles.resultContainer}>
                <DetectionStatus
                  isDetecting={false}
                  isDeepfake={detectionResult.isDeepfake}
                  confidence={detectionResult.confidence}
                />
              </View>
            )}
          </View>
        );
      case 'record':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Record Audio</Text>
            <AudioRecorder />
          </View>
        );
      case 'upload':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Upload Audio</Text>
            <Text style={styles.placeholderText}>
              Audio file upload would be implemented here
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Voice Guardian Shield" showSettings={true} />
      
      <ScrollView style={styles.scrollView}>
        {/* Call Monitoring Control */}
        <View style={styles.card}>
          <View style={styles.monitoringControl}>
            <View>
              <View style={styles.titleWithIcon}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.titleIcon}>
                  <Path
                    d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                    stroke="#9b87f5"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.cardTitle}>Call Monitoring</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Monitor real calls for deepfake voices
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.switch, isCallMonitoring && styles.switchActive]}
              onPress={() => setIsCallMonitoring(!isCallMonitoring)}
            >
              <View style={[styles.switchThumb, isCallMonitoring && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabs}>
          <TabButton id="monitor" label="Monitor" />
          <TabButton id="record" label="Record" />
          <TabButton id="upload" label="Upload" />
        </View>
        
        {/* Tab Content */}
        <View style={styles.card}>
          {renderTabContent()}
        </View>
        
        {/* Detection Results */}
        {isAnalyzing && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Detection Results</Text>
            <DetectionStatus
              isDetecting={true}
              isDeepfake={null}
              confidence={0}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F7',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monitoringControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8E9196',
    marginTop: 4,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#9b87f5',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F6F6F7',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    color: '#8E9196',
  },
  activeTabText: {
    color: '#9b87f5',
    fontWeight: '600',
  },
  tabContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9b87f5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    marginVertical: 16,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  resultContainer: {
    width: '100%',
    marginTop: 16,
  },
  recorderContainer: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#9b87f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingButton: {
    backgroundColor: '#9b87f5',
  },
  recorderText: {
    fontSize: 16,
    color: '#8E9196',
  },
  placeholderText: {
    fontSize: 16,
    color: '#8E9196',
    textAlign: 'center',
  },
});

export default AudioAnalysis;
