
import React, { useState } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import CallSimulator from '../components/CallSimulator';
import { deepfakeApi, DetectionResult } from '../services/deepfakeApi';
import { useApp } from '../contexts/AppContext';
import { toast } from '@/components/ui/use-toast';

const CallDemo: React.FC = () => {
  const { addDetection, settings } = useApp();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  const handleCallStart = async () => {
    setIsDetecting(true);
    setDetectionResult(null);
    
    // In a real app, we would record audio here
    // For demo purposes, we'll simulate API call with a timeout
    setTimeout(async () => {
      try {
        // Simulate fake/real voice detection scenario
        // In a real app, this would use real audio data
        const isFakeVoice = Math.random() > 0.5;
        
        // For demo purposes, we're just creating a mock result
        // In real app, this would call the actual API with audio data
        const mockResult: DetectionResult = {
          isDeepfake: isFakeVoice,
          confidence: isFakeVoice 
            ? Math.round(75 + Math.random() * 20) // 75-95% for fake
            : Math.round(80 + Math.random() * 15), // 80-95% for real
          rawResponse: isFakeVoice 
            ? "🔴 Deepfake detected! Confidence: 85.7%" 
            : "🟢 Audio appears authentic. Confidence: 92.3%"
        };
        
        setDetectionResult(mockResult);
        
        // Add to history
        addDetection({
          isDeepfake: mockResult.isDeepfake,
          confidence: mockResult.confidence,
          phoneNumber: "+1 (555) 123-4567", // Demo number
          duration: 5, // 5 seconds sample
        });
        
        // Show notification if it's a deepfake
        if (mockResult.isDeepfake && settings.notifyOnDeepfake) {
          toast({
            title: "⚠️ Deepfake Voice Detected",
            description: "The caller's voice appears to be synthetically generated.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Detection error:', error);
        toast({
          title: "Detection Error",
          description: "Failed to analyze voice. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsDetecting(false);
      }
    }, 3000); // Simulate 3 seconds of analysis
  };
  
  const handleCallEnd = () => {
    // Reset detection state when call ends
    setDetectionResult(null);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Call Demo" showBackButton={true} />
      
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8 pb-24">
        <div className="w-full max-w-md">
          <div className="guardian-card p-6">
            <h2 className="text-xl font-bold mb-6 text-center">Voice Detection Demo</h2>
            
            <CallSimulator 
              onCallStart={handleCallStart}
              onCallEnd={handleCallEnd}
              detectionResult={detectionResult}
              isDetecting={isDetecting}
            />
            
            <div className="mt-8 text-sm text-guardian-gray">
              <p>
                This demonstrates how Voice Guardian Shield would analyze calls in real-time.
                In a real implementation, the app would analyze actual call audio.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default CallDemo;
