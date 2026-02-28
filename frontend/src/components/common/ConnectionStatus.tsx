import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function ConnectionStatus() {
  const { state } = useAppContext();

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
      state.isConnected 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {state.isConnected ? (
        <>
          <Wifi size={16} />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
}
