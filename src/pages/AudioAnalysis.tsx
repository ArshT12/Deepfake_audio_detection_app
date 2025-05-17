
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioRecorder from '../components/AudioRecorder';
import FileAnalyzer from '../components/FileAnalyzer';
import DetectionStatus from '../components/DetectionStatus';
import { deepfakeApi } from '../services/deepfakeApi';
import { toast } from '@/components/ui/sonner';

const AudioAnalysis: React.FC = () => {
  const { addDetection } = useApp();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<null | { isDeepfake: boolean; confidence: number }>(null);

  const analyzeAudio = async (audioData: File | Blob) => {
    setIsAnalyzing(true);
    setDetectionResult(null);
    
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
        phoneNumber: 'Manual Analysis'
      });
      
      toast({
        title: result.isDeepfake ? "Deepfake Detected!" : "Voice Authentic",
        description: `Confidence: ${result.confidence.toFixed(0)}%`,
        variant: result.isDeepfake ? "destructive" : "default",
      });
      
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Audio Analysis" showBackButton={true} />
      
      <div className="flex-grow px-4 py-6 pb-24">
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="record">Record Audio</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>
          
          <div className="guardian-card p-4 mb-6">
            <TabsContent value="record">
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
            </TabsContent>
            
            <TabsContent value="upload">
              <FileAnalyzer onFileSelected={handleFileSelected} />
            </TabsContent>
          </div>
          
          <div className="guardian-card p-4">
            <h2 className="text-lg font-bold mb-4 text-center">Detection Results</h2>
            <DetectionStatus 
              isDetecting={isAnalyzing} 
              isDeepfake={detectionResult?.isDeepfake ?? null}
              confidence={detectionResult?.confidence ?? 0}
            />
          </div>
        </Tabs>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default AudioAnalysis;
