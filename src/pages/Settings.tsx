
import React from 'react';
import { useApp } from '../contexts/AppContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { UserSettings } from '../types';

const Settings: React.FC = () => {
  const { settings, updateSettings, detections, clearDetections } = useApp();

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all detection history?')) {
      clearDetections();
      toast({
        title: "History Cleared",
        description: "Your detection history has been cleared.",
      });
    }
  };

  const handleSliderChange = (value: number[], name: keyof UserSettings) => {
    updateSettings({ [name]: value[0] });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Settings" showBackButton={true} />
      
      <div className="flex-grow px-4 py-6 pb-24">
        <div className="guardian-card p-4 mb-6">
          <h2 className="text-lg font-bold mb-4">Call Monitoring</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Alert on Deepfake</p>
                <p className="text-sm text-guardian-gray">Show notifications when deepfakes are detected</p>
              </div>
              <Switch 
                checked={settings.notifyOnDeepfake} 
                onCheckedChange={(checked) => updateSettings({ notifyOnDeepfake: checked })}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Vibrate on Detection</p>
                <p className="text-sm text-guardian-gray">Vibrate when a deepfake is detected</p>
              </div>
              <Switch 
                checked={settings.vibrateOnDeepfake} 
                onCheckedChange={(checked) => updateSettings({ vibrateOnDeepfake: checked })}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Auto-End Deepfake Calls</p>
                <p className="text-sm text-guardian-gray">Automatically hang up when a deepfake is detected</p>
              </div>
              <Switch 
                checked={settings.autoEndCallOnDeepfake} 
                onCheckedChange={(checked) => updateSettings({ autoEndCallOnDeepfake: checked })}
              />
            </div>
          </div>
        </div>
        
        <div className="guardian-card p-4 mb-6">
          <h2 className="text-lg font-bold mb-4">Detection Settings</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-medium">Deepfake Threshold</p>
                <p className="text-sm font-medium">{settings.deepfakeThreshold}%</p>
              </div>
              <p className="text-sm text-guardian-gray mb-4">Minimum confidence level to consider as deepfake</p>
              <Slider 
                value={[settings.deepfakeThreshold]} 
                min={50} 
                max={95} 
                step={5}
                onValueChange={(value) => handleSliderChange(value, 'deepfakeThreshold')} 
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-medium">Analysis Duration</p>
                <p className="text-sm font-medium">{settings.analysisDuration} seconds</p>
              </div>
              <p className="text-sm text-guardian-gray mb-4">Duration of audio to analyze in each sample</p>
              <Slider 
                value={[settings.analysisDuration]} 
                min={2} 
                max={15} 
                step={1}
                onValueChange={(value) => handleSliderChange(value, 'analysisDuration')} 
              />
            </div>
          </div>
        </div>
        
        <div className="guardian-card p-4">
          <h2 className="text-lg font-bold mb-4">Data Management</h2>
          
          <div>
            <p className="text-sm text-guardian-gray mb-2">
              You have {detections.length} detection records saved.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleClearHistory}
              disabled={detections.length === 0}
            >
              Clear Detection History
            </Button>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Settings;
