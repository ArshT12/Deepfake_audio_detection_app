
import React, { useEffect, useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { AlertTriangle, CircleCheck } from 'lucide-react';

type DetectionStatusProps = {
  isDetecting: boolean;
  isDeepfake: boolean | null;
  confidence: number;
};

const DetectionStatus: React.FC<DetectionStatusProps> = ({ 
  isDetecting, 
  isDeepfake, 
  confidence 
}) => {
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    if (isDeepfake !== null) {
      setShowRipple(isDeepfake);
      
      // Vibration alert if deepfake detected
      if (isDeepfake && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [isDeepfake]);

  if (isDetecting) {
    return (
      <div className="flex flex-col items-center">
        <div className="h-32 w-32">
          <CircularProgressbar 
            value={70}
            text="Analyzing"
            strokeWidth={8}
            styles={buildStyles({
              textSize: '14px',
              pathColor: '#1E3A8A',
              textColor: '#1E3A8A',
              trailColor: '#E2E8F0',
              pathTransitionDuration: 0.5,
              pathTransition: 'stroke-dashoffset 0.5s ease 0s',
              rotation: 0.5,
            })}
          />
        </div>
        <p className="text-center mt-4 text-guardian-gray">
          Analyzing voice patterns...
        </p>
      </div>
    );
  }

  if (isDeepfake === null) {
    return (
      <div className="flex flex-col items-center">
        <div className="h-32 w-32 flex items-center justify-center bg-gray-100 rounded-full">
          <p className="text-gray-500">Ready</p>
        </div>
        <p className="text-center mt-4 text-guardian-gray">
          Start a call to begin detection
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="ripple-container h-32 w-32">
        {showRipple && (
          <>
            <div className={`ripple ${isDeepfake ? 'bg-guardian-red/30' : 'bg-guardian-success/30'}`} style={{ animationDelay: '0s' }}></div>
            <div className={`ripple ${isDeepfake ? 'bg-guardian-red/20' : 'bg-guardian-success/20'}`} style={{ animationDelay: '0.5s' }}></div>
          </>
        )}
        
        <div className="h-32 w-32">
          <CircularProgressbar
            value={confidence}
            text={`${confidence.toFixed(0)}%`}
            strokeWidth={8}
            styles={buildStyles({
              textSize: '20px',
              pathColor: isDeepfake ? '#DC2626' : '#16A34A',
              textColor: isDeepfake ? '#DC2626' : '#16A34A',
              trailColor: '#E2E8F0',
            })}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center">
        {isDeepfake ? (
          <>
            <AlertTriangle className="text-guardian-red mr-2" size={24} />
            <h2 className="text-guardian-red font-bold text-xl">Deepfake Detected!</h2>
          </>
        ) : (
          <>
            <CircleCheck className="text-guardian-success mr-2" size={24} />
            <h2 className="text-guardian-success font-bold text-xl">Voice Authentic</h2>
          </>
        )}
      </div>

      <p className="text-center mt-2 text-guardian-gray">
        {isDeepfake 
          ? "This voice appears to be synthetically generated."
          : "This voice appears to be from a real person."}
      </p>
    </div>
  );
};

export default DetectionStatus;
