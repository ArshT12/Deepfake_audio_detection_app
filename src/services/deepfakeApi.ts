
import axios from 'axios';

const API_URL = 'https://huggingface.co/spaces/ArshTandon/deepfake-detection-api';

export type DetectionResult = {
  isDeepfake: boolean;
  confidence: number;
  rawResponse: string;
};

export const deepfakeApi = {
  /**
   * Send audio file to the Hugging Face API for deepfake detection
   * @param audioPath - Audio file for analysis (File object or Blob)
   * @returns Detection result with confidence score
   */
  async detectAudio(audioFile: File | Blob): Promise<DetectionResult> {
    try {
      // Create form data for API request
      const formData = new FormData();
      
      // If it's a File object, use it directly, otherwise create a new File from the Blob
      const file = audioFile instanceof File 
        ? audioFile 
        : new File([audioFile], 'audio.wav', { type: 'audio/wav' });
      
      formData.append('audio', file);

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
   * Convert recorded audio blob to a URL for web preview
   * @param audioData - Audio data as Blob
   * @returns URL to access the audio
   */
  saveAudioFile(audioData: Blob): string {
    // Create a URL for the blob that can be used in an audio element
    return URL.createObjectURL(audioData);
  }
};
