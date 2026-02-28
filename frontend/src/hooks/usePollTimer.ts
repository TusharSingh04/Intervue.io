import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

interface UsePollTimerReturn {
  remainingTime: number;
  formattedTime: string;
  progress: number;
  isExpired: boolean;
}

export function usePollTimer(): UsePollTimerReturn {
  const { state } = useAppContext();
  const [localTime, setLocalTime] = useState(state.remainingTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with server time
  useEffect(() => {
    setLocalTime(state.remainingTime);
  }, [state.remainingTime]);

  // Local countdown (smooth UI between server syncs)
  useEffect(() => {
    if (localTime > 0 && state.poll?.isActive) {
      intervalRef.current = setInterval(() => {
        setLocalTime((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [localTime > 0, state.poll?.isActive]);

  // Format time as MM:SS
  const formattedTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progress = state.poll?.duration
    ? Math.max(0, Math.min(100, (localTime / state.poll.duration) * 100))
    : 0;

  return {
    remainingTime: localTime,
    formattedTime: formattedTime(localTime),
    progress,
    isExpired: localTime <= 0
  };
}
