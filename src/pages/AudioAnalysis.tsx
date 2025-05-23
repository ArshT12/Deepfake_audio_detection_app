
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioRecorder from '../components/AudioRecorder';
import FileAnalyzer from '../components/FileAnalyzer';
import DetectionStatus from '../components/DetectionStatus';
import CallDemo from '../components/CallDemo';
import { deepfakeApi } from '../services/deepfakeApi';
import { callMonitorService } from '../services/callMonitorService';
import { backgroundService } from '../services/backgroundService';
import { toast } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { Phone, Mic } from 'lucide-react';

const AudioAnalysis: React.FC = () => {
  const { addDetection, settings } = useApp();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<null | { isDeepfake: boolean; confidence: number }>(null);
  const [isCallMonitoring, setIsCallMonitoring] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [activeTab, setActiveTab] = useState('monitor');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Call monitor initialization
  useEffect(() => {
    const initCallMonitor = async () => {
      await callMonitorService.initialize();
      
      // Add listener for call events
      callMonitorService.addCallListener((callInfo) => {
        toast.info(`Call detected: ${callInfo.phoneNumber}`, {
          description: callInfo.isIncoming ? "Incoming call" : "Outgoing call"
        });
      });
    };
    
    initCallMonitor();
    
    return () => {
      stopCallMonitoring();
    };
  }, []);

  // Call audio monitoring setup
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
        toast.error("Failed to start call monitoring");
        setIsCallMonitoring(false);
        return;
      }
      
      // Request microphone access to monitor call audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      let chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          analyzeAudio(audioBlob);
          chunks = [];
        }
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Setup interval to analyze chunks periodically (every X seconds)
      const intervalTime = settings.analysisDuration * 1000;
      analysisIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          // Stop current recording to trigger ondataavailable and onstop
          mediaRecorderRef.current.stop();
          // Start a new recording session
          setTimeout(() => {
            if (isCallMonitoring && mediaRecorderRef.current) {
              chunks = [];
              mediaRecorderRef.current.start();
            }
          }, 100);
        }
      }, intervalTime);
      
      toast.success("Call monitoring active", {
        description: "Analyzing audio every " + settings.analysisDuration + " seconds"
      });
      
    } catch (error) {
      console.error('Error accessing microphone for call monitoring:', error);
      toast.error('Could not access microphone. Please check your permissions.');
      setIsCallMonitoring(false);
    }
  };
  
  const stopCallMonitoring = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop all tracks on the stream to release the microphone
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      mediaRecorderRef.current = null;
    }
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  };

  const analyzeAudio = async (audioData: File | Blob) => {
    setIsAnalyzing(true);
    
    try {
      // Convert Blob to File if necessary
      const audioFile = audioData instanceof File 
        ? audioData 
        : new File([audioData], "recorded-audio.wav", { type: "audio/wav" });
      
      const result = await deepfakeApi.detectAudio(audioFile);
      
      setDetectionResult({
        isDeepfake: result.isDeepfake,
        confidence: result.confidence
      });
      
      // Add to detection history
      addDetection({
        isDeepfake: result.isDeepfake,
        confidence: result.confidence,
        phoneNumber: isCallMonitoring ? 'Live Call' : 'Manual Analysis'
      });
      
      // Only show notifications if it's a deepfake or if not in call monitoring mode
      if (result.isDeepfake) {
        toast.error("Deepfake Detected!", {
          description: `Confidence: ${result.confidence.toFixed(0)}%`
        });
        
        // Optionally handle auto-actions based on settings
        if (result.isDeepfake && isCallMonitoring) {
          if (settings.autoEndCallOnDeepfake) {
            // In a real implementation, we would interface with the phone API
            // to end the call, but here we just stop monitoring
            toast.error("Call would be ended automatically", {
              description: "This feature requires phone system integration"
            });
          }
        }
      } else if (!isCallMonitoring) {
        // For manual analysis, always show authentic result
        toast.success("Voice Authentic", {
          description: `Confidence: ${result.confidence.toFixed(0)}%`
        });
      }
      
    } catch (error) {
      console.error('Error analyzing audio:', error);
      toast.error('Error analyzing audio. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecordingComplete = (audioBlob: Blob) => {
    analyzeAudio(audioBlob);
  };

  const handleFileSelected = (file: File) => {
    analyzeAudio(file);
  };
  
  const handleCallDemoResult = (isDeepfake: boolean, confidence: number, phoneNumber: string) => {
    setDetectionResult({
      isDeepfake,
      confidence
    });
    
    // Add to detection history
    addDetection({
      isDeepfake,
      confidence,
      phoneNumber
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Voice Guardian Shield" />
      
      <div className="flex-grow px-4 py-6 pb-24">
        {/* Call Monitoring Control */}
        <div className="guardian-card p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold flex items-center">
                <Phone size={20} className="mr-2" />
                Call Monitoring
              </h2>
              <p className="text-sm text-guardian-gray">
                Monitor real calls for deepfake voices
              </p>
            </div>
            <Switch 
              checked={isCallMonitoring} 
              onCheckedChange={setIsCallMonitoring}
            />
          </div>
        </div>
        
        <Tabs defaultValue="monitor" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
            <TabsTrigger value="record">Record</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          
          <div className="guardian-card p-4 mb-6">
            <TabsContent value="monitor">
              <CallDemo 
                onAnalysisResult={handleCallDemoResult} 
                isAnalyzing={isAnalyzing}
                detectionResult={detectionResult}
              />
            </TabsContent>
            
            <TabsContent value="record">
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
              
              {!isAnalyzing && detectionResult && (
                <div className="mt-6">
                  <DetectionStatus 
                    isDetecting={false} 
                    isDeepfake={detectionResult.isDeepfake}
                    confidence={detectionResult.confidence}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="upload">
              <FileAnalyzer onFileSelected={handleFileSelected} />
              
              {!isAnalyzing && detectionResult && (
                <div className="mt-6">
                  <DetectionStatus 
                    isDetecting={false} 
                    isDeepfake={detectionResult.isDeepfake}
                    confidence={detectionResult.confidence}
                  />
                </div>
              )}
            </TabsContent>
          </div>
          
          {isAnalyzing && (
            <div className="guardian-card p-4">
              <h2 className="text-lg font-bold mb-4 text-center">Detection Results</h2>
              <DetectionStatus 
                isDetecting={isAnalyzing} 
                isDeepfake={null}
                confidence={0}
              />
            </div>
          )}
        </Tabs>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default AudioAnalysis;
