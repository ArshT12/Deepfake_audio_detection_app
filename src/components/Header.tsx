
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  showSettings?: boolean;
};

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBackButton = false,
  showSettings = false
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-guardian-blue text-white p-4 flex items-center justify-between">
      <div className="flex items-center">
        {showBackButton && (
          <button 
            onClick={() => navigate(-1)}
            className="mr-2 p-1 rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 className="font-bold text-xl">{title}</h1>
      </div>
      
      {showSettings && (
        <button 
          onClick={() => navigate('/settings')}
          className="p-1 rounded-full hover:bg-white/10"
        >
          <Settings size={24} />
        </button>
      )}
    </header>
  );
};

export default Header;
