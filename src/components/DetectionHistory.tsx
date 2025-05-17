
import React from 'react';
import { format } from 'date-fns';
import { type Detection } from '../types';

type DetectionHistoryProps = {
  detections: Detection[];
  emptyMessage?: string;
};

const DetectionHistory: React.FC<DetectionHistoryProps> = ({ 
  detections, 
  emptyMessage = "No detection history yet" 
}) => {
  if (detections.length === 0) {
    return (
      <div className="text-center py-8 text-guardian-gray">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {detections.map((detection) => (
        <div key={detection.id} className="py-4 px-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">
                {detection.phoneNumber || 'Unknown Number'}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(detection.timestamp), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            <div className="flex items-center">
              <span 
                className={detection.isDeepfake ? 'detection-badge-fake' : 'detection-badge-real'}
              >
                {detection.isDeepfake ? 'Deepfake' : 'Authentic'}
              </span>
              <span className="ml-2 text-sm font-medium">
                {detection.confidence.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DetectionHistory;
