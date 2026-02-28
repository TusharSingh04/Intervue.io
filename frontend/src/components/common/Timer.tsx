import React from 'react';
import { Clock } from 'lucide-react';
import { usePollTimer } from '../../hooks';

interface TimerProps {
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Timer({ showProgress = true, size = 'md' }: TimerProps) {
  const { formattedTime, progress, isExpired, remainingTime } = usePollTimer();

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28
  };

  // Color based on remaining time
  const getTimeColor = () => {
    if (isExpired) return 'text-red-600';
    if (remainingTime <= 10) return 'text-red-500 animate-pulse';
    if (remainingTime <= 30) return 'text-yellow-500';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (progress <= 20) return 'bg-red-500';
    if (progress <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`flex items-center gap-2 font-mono font-bold ${sizeClasses[size]} ${getTimeColor()}`}>
        <Clock size={iconSizes[size]} />
        <span>{formattedTime}</span>
      </div>
      
      {showProgress && (
        <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {isExpired && (
        <span className="mt-1 text-sm text-red-600 font-medium">Time's up!</span>
      )}
    </div>
  );
}
