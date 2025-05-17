
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, BarChart, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-around">
      <Link 
        to="/" 
        className={`flex flex-col items-center ${isActive('/') ? 'text-guardian-blue' : 'text-guardian-gray'}`}
      >
        <BarChart size={24} />
        <span className="text-xs mt-1">Dashboard</span>
      </Link>
      
      <Link 
        to="/call-demo" 
        className={`flex flex-col items-center ${isActive('/call-demo') ? 'text-guardian-blue' : 'text-guardian-gray'}`}
      >
        <Phone size={24} />
        <span className="text-xs mt-1">Call Demo</span>
      </Link>
      
      <Link 
        to="/settings" 
        className={`flex flex-col items-center ${isActive('/settings') ? 'text-guardian-blue' : 'text-guardian-gray'}`}
      >
        <Settings size={24} />
        <span className="text-xs mt-1">Settings</span>
      </Link>
    </div>
  );
};

export default BottomNav;
