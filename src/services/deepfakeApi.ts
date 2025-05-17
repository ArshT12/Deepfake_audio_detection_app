
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
   * @param audioFile - Audio file for analysis
   * @returns Detection result with confidence score
   */
  async detectAudio(audioFile: File | Blob): Promise<DetectionResult> {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);

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
      console.error('Error detecting audio:', error);
      throw error;
    }
  }
};
