
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileAudio2, Upload } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface FileAnalyzerProps {
  onFileSelected: (file: File) => void;
}

const FileAnalyzer: React.FC<FileAnalyzerProps> = ({ onFileSelected }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if file is audio file (mp3 or wav)
      if (file.type === 'audio/mp3' || file.type === 'audio/wav' || file.type === 'audio/mpeg') {
        setSelectedFile(file);
      } else {
        toast.error('Please select an MP3 or WAV audio file.');
        setSelectedFile(null);
      }
    }
  };

  const handleAnalyzeClick = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    } else {
      toast.error('Please select an audio file first.');
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center w-16 h-16 bg-guardian-blue/10 rounded-full">
        <FileAudio2 className="text-guardian-blue" size={32} />
      </div>
      
      <div className="w-full max-w-sm">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <Button
          onClick={handleBrowseClick}
          variant="outline"
          className="w-full flex items-center gap-2 mb-2"
        >
          <Upload size={20} />
          {selectedFile ? 'Change File' : 'Browse Audio Files'}
        </Button>
        
        {selectedFile && (
          <div className="text-sm text-center mb-4">
            <p className="font-medium truncate max-w-xs">{selectedFile.name}</p>
            <p className="text-guardian-gray">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        )}
        
        <Button
          onClick={handleAnalyzeClick}
          className="w-full bg-guardian-blue hover:bg-guardian-blue/80"
          disabled={!selectedFile}
        >
          Analyze Audio
        </Button>
      </div>
    </div>
  );
};

export default FileAnalyzer;
