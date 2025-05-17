
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load saved data from AsyncStorage on initial load
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedDetections = await AsyncStorage.getItem('detections');
        if (savedDetections) {
          setDetections(JSON.parse(savedDetections));
        }

        const savedSettings = await AsyncStorage.getItem('settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    
    loadSavedData();
  }, []);

  // Save data to AsyncStorage when it changes
  useEffect(() => {
    const saveDetections = async () => {
      try {
        await AsyncStorage.setItem('detections', JSON.stringify(detections));
      } catch (error) {
        console.error('Error saving detections:', error);
      }
    };
    
    saveDetections();
  }, [detections]);

  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };
    
    saveSettings();
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
