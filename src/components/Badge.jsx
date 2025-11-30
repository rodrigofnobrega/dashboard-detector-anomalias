import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import './Badge.css';

const Badge = ({ status }) => {
  const isConnected = status === 'connected';
  return (
    <div className={`badge ${isConnected ? 'connected' : 'disconnected'}`}>
      {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
      {isConnected ? 'Conectado' : 'Desconectado'}
    </div>
  );
};

export default Badge;