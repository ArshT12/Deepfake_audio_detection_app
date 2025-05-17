
import React, { useState, useEffect } from 'react';
import { Phone, MicOff } from 'lucide-react';
import { callMonitorService, CallInfo } from '../services/callMonitorService';
import { useApp } from '../contexts/AppContext';
import { toast } from '@/components/ui/sonner';
import DetectionStatus from './DetectionStatus';

type CallDemoProps = {
  onAnalysisResult: (isDeepfake: boolean, confidence: number, phoneNumber: string) => void;
  isAnalyzing: boolean;
  detectionResult: { isDeepfake: boolean | null; confidence: number } | null;
};

const CallDemo: React.FC<CallDemoProps> = ({ 
  onAnalysisResult, 
  isAnalyzing,
  detectionResult
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null);
  const { settings } = useApp();

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const startCall = () => {
    setIsCallActive(true);
    
    // Start the demo call
    const callInfo = callMonitorService.startDemoCall();
    setCurrentCall(callInfo);
    
    // Start timer
    const id = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
    
    setIntervalId(id);
    
    // Simulate analysis happening
    setTimeout(() => {
      // 30% chance of deepfake in demo mode
      const isDeepfake = Math.random() < 0.3;
      // Confidence between 75-95% for deepfakes, 85-99% for authentic
      const confidence = isDeepfake 
        ? Math.floor(75 + Math.random() * 20)
        : Math.floor(85 + Math.random() * 14);
        
      onAnalysisResult(isDeepfake, confidence, callInfo.phoneNumber);
      
      if (isDeepfake && settings.autoEndCallOnDeepfake) {
        toast.error("Deepfake detected - ending call automatically", {
          description: `Based on your settings, this call would be terminated`
        });
        
        setTimeout(() => {
          endCall();
        }, 2000);
      }
    }, 5000); // Simulate 5 second analysis time
  };

  const endCall = () => {
    setIsCallActive(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setCallTimer(0);
    setCurrentCall(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center py-4">
      <h2 className="text-lg font-bold mb-4 text-center">Call Demo</h2>
      
      {isCallActive && (
        <div className="mb-4 text-center">
          <p className="font-medium">{currentCall?.phoneNumber || "Unknown"}</p>
          <p className="text-sm text-guardian-gray">Australian Mobile</p>
        </div>
      )}
      
      {(isCallActive || detectionResult) && (
        <div className="mb-6">
          <DetectionStatus 
            isDetecting={isAnalyzing} 
            isDeepfake={detectionResult?.isDeepfake ?? null}
            confidence={detectionResult?.confidence ?? 0}
          />
        </div>
      )}

      {isCallActive ? (
        <div className="flex flex-col items-center mt-4">
          <div className="text-xl mb-4">{formatTime(callTimer)}</div>
          <button 
            onClick={endCall}
            className="h-14 w-14 bg-guardian-red rounded-full flex items-center justify-center shadow-lg"
          >
            <MicOff size={32} className="text-white" />
          </button>
          <p className="text-sm text-gray-500 mt-2">
            {detectionResult?.isDeepfake 
              ? "Warning: Potential voice fraud detected" 
              : isAnalyzing 
                ? "Analyzing voice..." 
                : "Call in progress"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center mt-4">
          <button 
            onClick={startCall}
            className="h-14 w-14 bg-guardian-blue rounded-full flex items-center justify-center shadow-lg"
          >
            <Phone size={32} className="text-white" />
          </button>
          <p className="text-sm text-gray-500 mt-2">Start Demo Call</p>
        </div>
      )}
    </div>
  );
};

export default CallDemo;
