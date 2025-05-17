
import React, { useState, useEffect } from 'react';
import { Phone, MicOff } from 'lucide-react';
import { DetectionResult } from '../services/deepfakeApi';
import DetectionStatus from './DetectionStatus';

type CallSimulatorProps = {
  onCallStart: () => void;
  onCallEnd: () => void;
  detectionResult: DetectionResult | null;
  isDetecting: boolean;
};

const CallSimulator: React.FC<CallSimulatorProps> = ({ 
  onCallStart, 
  onCallEnd, 
  detectionResult, 
  isDetecting 
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const startCall = () => {
    setIsCallActive(true);
    onCallStart();
    
    const id = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
    
    setIntervalId(id);
  };

  const endCall = () => {
    setIsCallActive(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setCallTimer(0);
    onCallEnd();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8">
        <DetectionStatus 
          isDetecting={isDetecting} 
          isDeepfake={detectionResult?.isDeepfake ?? null}
          confidence={detectionResult?.confidence ?? 0}
        />
      </div>

      {isCallActive ? (
        <div className="flex flex-col items-center mt-4">
          <div className="text-xl mb-4">{formatTime(callTimer)}</div>
          <button 
            onClick={endCall}
            className="call-button call-button-decline mb-4"
          >
            <MicOff size={32} />
          </button>
          <p className="text-sm text-gray-500">
            {detectionResult?.isDeepfake 
              ? "Warning: Potential voice fraud detected" 
              : isDetecting 
                ? "Analyzing voice..." 
                : "Call in progress"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center mt-4">
          <button 
            onClick={startCall}
            className="call-button call-button-answer mb-4"
          >
            <Phone size={32} />
          </button>
          <p className="text-sm text-gray-500">Start Demo Call</p>
        </div>
      )}
    </div>
  );
};

export default CallSimulator;
