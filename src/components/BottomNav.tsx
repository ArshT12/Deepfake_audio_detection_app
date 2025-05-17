
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileAudio, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
      <div className="flex justify-around px-6 py-2">
        <NavLink 
          to="/" 
          className={`flex flex-col items-center py-1 px-3 ${isActive('/') ? 'text-guardian-blue' : 'text-gray-500'}`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </NavLink>
        
        <NavLink 
          to="/dashboard" 
          className={`flex flex-col items-center py-1 px-3 ${isActive('/dashboard') ? 'text-guardian-blue' : 'text-gray-500'}`}
        >
          <FileAudio size={24} />
          <span className="text-xs mt-1">History</span>
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={`flex flex-col items-center py-1 px-3 ${isActive('/settings') ? 'text-guardian-blue' : 'text-gray-500'}`}
        >
          <Settings size={24} />
          <span className="text-xs mt-1">Settings</span>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;
