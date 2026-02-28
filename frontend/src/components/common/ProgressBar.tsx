import React from 'react';

interface ProgressBarProps {
  percentage: number;
  label: string;
  votes: number;
  isSelected?: boolean;
  showVotes?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({
  percentage,
  label,
  votes,
  isSelected = false,
  showVotes = true,
  color = 'primary'
}: ProgressBarProps) {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  const bgColorClasses = {
    primary: 'bg-primary-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    danger: 'bg-red-100'
  };

  return (
    <div className={`relative p-4 rounded-lg transition-all duration-300 ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
          {label}
          {isSelected && <span className="ml-2 text-primary-500">✓</span>}
        </span>
        <div className="flex items-center gap-2">
          {showVotes && (
            <span className="text-sm text-gray-500">{votes} vote{votes !== 1 ? 's' : ''}</span>
          )}
          <span className={`font-bold ${isSelected ? 'text-primary-600' : 'text-gray-900'}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className={`w-full h-3 rounded-full overflow-hidden ${bgColorClasses[color]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${Math.max(percentage, 0)}%` }}
        />
      </div>
    </div>
  );
}
