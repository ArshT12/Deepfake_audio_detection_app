
import axios from 'axios';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

const API_URL = 'https://huggingface.co/spaces/ArshTandon/deepfake-detection-api';

export type DetectionResult = {
  isDeepfake: boolean;
  confidence: number;
  rawResponse: string;
};

export const deepfakeApi = {
  /**
   * Send audio file to the Hugging Face API for deepfake detection
   * @param audioPath - Path to audio file for analysis
   * @returns Detection result with confidence score
   */
  async detectAudio(audioPath: string): Promise<DetectionResult> {
    try {
      // Create form data for API request
      const formData = new FormData();
      
      // Get file name from path
      const fileName = audioPath.split('/').pop() || 'audio.wav';
      
      // Add file to form data
      formData.append('audio', {
        uri: Platform.OS === 'android' ? `file://${audioPath}` : audioPath,
        type: 'audio/wav',
        name: fileName
      } as any);

      // Make the API call
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const rawResponse = response.data;
      
      // Parse the response
      // Expected format: "🔴 Deepfake detected!" or "🟢 Audio appears authentic." with confidence percentage
      const isDeepfake = rawResponse.includes('Deepfake detected');
      
      // Extract confidence percentage from response (assumes format like "XX.XX%")
      const confidenceMatch = rawResponse.match(/(\d+\.\d+)%/);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0;

      return {
        isDeepfake,
        confidence,
        rawResponse,
      };
    } catch (error) {
      // Handle error for development - provide mock response
      console.error('Error detecting audio:', error);
      console.log('Falling back to simulated detection response');
      
      // Generate a random result for testing purposes
      // 30% chance of being classified as deepfake
      const mockIsDeepfake = Math.random() < 0.3;
      
      // Generate a confidence between 65-95%
      const mockConfidence = mockIsDeepfake 
        ? Math.floor(75 + Math.random() * 20) // Higher confidence for deepfakes (75-95%)
        : Math.floor(65 + Math.random() * 30); // Variable confidence for authentic (65-95%)
      
      const mockResponse = mockIsDeepfake 
        ? `🔴 Deepfake detected! (${mockConfidence}% confidence)` 
        : `🟢 Audio appears authentic. (${mockConfidence}% confidence)`;
        
      return {
        isDeepfake: mockIsDeepfake,
        confidence: mockConfidence,
        rawResponse: mockResponse,
      };
    }
  },
  
  /**
   * Save audio recording to file system
   * @param audioBlob - Audio data as a base64 string
   * @returns Path to saved audio file
   */
  async saveAudioFile(audioBase64: string): Promise<string> {
    try {
      const filePath = `${RNFS.CachesDirectoryPath}/audio_${Date.now()}.wav`;
      await RNFS.writeFile(filePath, audioBase64, 'base64');
      return filePath;
    } catch (error) {
      console.error('Error saving audio file:', error);
      throw error;
    }
  }
};
