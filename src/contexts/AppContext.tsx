
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Detection, UserSettings } from '../types';

type AppContextType = {
  detections: Detection[];
  addDetection: (detection: Omit<Detection, 'id' | 'timestamp'>) => void;
  clearDetections: () => void;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
};

const defaultSettings: UserSettings = {
  notifyOnDeepfake: true,
  vibrateOnDeepfake: true,
  autoRecordOnDeepfake: false,
  autoEndCallOnDeepfake: false,
  deepfakeThreshold: 75, // 75% confidence
  analysisDuration: 5, // 5 seconds
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load saved data from localStorage on initial load
  useEffect(() => {
    try {
      const savedDetections = localStorage.getItem('detections');
      if (savedDetections) {
        setDetections(JSON.parse(savedDetections));
      }

      const savedSettings = localStorage.getItem('settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('detections', JSON.stringify(detections));
  }, [detections]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const addDetection = (detection: Omit<Detection, 'id' | 'timestamp'>) => {
    const newDetection: Detection = {
      ...detection,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setDetections(prev => [newDetection, ...prev]);
  };

  const clearDetections = () => {
    setDetections([]);
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider value={{
      detections,
      addDetection,
      clearDetections,
      settings,
      updateSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
