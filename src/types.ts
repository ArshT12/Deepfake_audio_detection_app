
export type Detection = {
  id: string;
  timestamp: number;
  isDeepfake: boolean;
  confidence: number;
  duration?: number;
  phoneNumber?: string;
  audioSample?: string; // Base64 or URL if stored
};

export type UserSettings = {
  notifyOnDeepfake: boolean;
  vibrateOnDeepfake: boolean;
  autoRecordOnDeepfake: boolean;
  autoEndCallOnDeepfake: boolean;
  deepfakeThreshold: number; // Minimum confidence to consider as deepfake
  analysisDuration: number; // Duration in seconds to analyze
};
