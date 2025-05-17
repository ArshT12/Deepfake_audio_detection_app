
import React from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
};

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = "bg-white" 
}) => {
  return (
    <div className={`guardian-card p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-guardian-gray font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {icon && (
          <div className="bg-gray-100 p-3 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
