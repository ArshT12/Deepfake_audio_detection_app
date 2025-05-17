
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onRecordingComplete(audioBlob);

        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Set up timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Format the recording duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center w-16 h-16 bg-guardian-blue/10 rounded-full">
        <Mic className={`text-guardian-blue ${isRecording ? 'animate-pulse' : ''}`} size={32} />
      </div>
      
      {isRecording ? (
        <div className="text-center">
          <p className="text-xl font-bold text-guardian-blue">{formatDuration(recordingDuration)}</p>
          <p className="text-sm text-guardian-gray">Recording in progress...</p>
        </div>
      ) : (
        <p className="text-guardian-gray">Ready to record</p>
      )}
      
      <div className="flex gap-4">
        {!isRecording ? (
          <Button 
            onClick={startRecording} 
            className="flex items-center gap-2 bg-guardian-blue hover:bg-guardian-blue/80"
          >
            <Mic size={20} />
            Start Recording
          </Button>
        ) : (
          <Button 
            onClick={stopRecording} 
            variant="destructive" 
            className="flex items-center gap-2"
          >
            <StopCircle size={20} />
            Stop Recording
          </Button>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
