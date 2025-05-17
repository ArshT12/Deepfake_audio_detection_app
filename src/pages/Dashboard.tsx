
import React from 'react';
import { BarChart, Phone, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import DetectionHistory from '../components/DetectionHistory';
import StatCard from '../components/StatCard';
import { useApp } from '../contexts/AppContext';

const Dashboard: React.FC = () => {
  const { detections } = useApp();
  
  // Calculate statistics
  const totalCalls = detections.length;
  const deepfakeCalls = detections.filter(d => d.isDeepfake).length;
  const deepfakePercentage = totalCalls > 0 
    ? Math.round((deepfakeCalls / totalCalls) * 100) 
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Voice Guardian Shield" showSettings={true} />
      
      <div className="flex-grow px-4 py-6 pb-24">
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3">Protection Statistics</h2>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <StatCard 
              title="Total Calls Analyzed" 
              value={totalCalls}
              icon={<Phone size={24} className="text-guardian-blue" />}
            />
            <StatCard 
              title="Deepfakes Detected" 
              value={deepfakeCalls}
              icon={<AlertTriangle size={24} className="text-guardian-red" />}
              color={deepfakeCalls > 0 ? "bg-red-50" : "bg-white"}
            />
          </div>
          <div className="guardian-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-guardian-gray font-medium">Deepfake Rate</p>
                <p className="text-2xl font-bold mt-1">{deepfakePercentage}%</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <BarChart size={24} className="text-guardian-blue" />
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">Recent Detections</h2>
          </div>
          <div className="guardian-card">
            <DetectionHistory 
              detections={detections} 
              emptyMessage="No calls analyzed yet. Try the Call Demo to test the detection."
            />
          </div>
        </section>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Dashboard;
