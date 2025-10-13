'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const WebSocketStatus = ({ className = '' }) => {
  const { isConnected, connectionStatus } = useWebSocket();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    return isConnected ? 'text-binance-green' : 'text-binance-red';
  };

  const getStatusBg = () => {
    return isConnected ? 'bg-binance-green/10' : 'bg-binance-red/10';
  };

  const getStatusText = () => {
    if (isConnected) {
      return 'Connected';
    } else if (connectionStatus.reason) {
      return `Disconnected: ${connectionStatus.reason}`;
    } else {
      return 'Connecting...';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-binance-green' : 'bg-binance-red'
        }`}></div>
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-binance-textTertiary hover:text-binance-textSecondary"
      >
        {showDetails ? 'Hide' : 'Details'}
      </button>

      {showDetails && (
        <div className="absolute top-8 right-0 bg-binance-surface border border-binance-border rounded-lg p-3 shadow-lg z-50 min-w-48">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-binance-textSecondary">Status:</span>
              <span className={getStatusColor()}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {connectionStatus.socketId && (
              <div className="flex justify-between">
                <span className="text-binance-textSecondary">Socket ID:</span>
                <span className="text-binance-textPrimary font-mono">
                  {connectionStatus.socketId.substring(0, 8)}...
                </span>
              </div>
            )}
            {connectionStatus.reconnectAttempts > 0 && (
              <div className="flex justify-between">
                <span className="text-binance-textSecondary">Reconnect Attempts:</span>
                <span className="text-binance-textPrimary">
                  {connectionStatus.reconnectAttempts}
                </span>
              </div>
            )}
            {connectionStatus.reason && (
              <div className="flex justify-between">
                <span className="text-binance-textSecondary">Reason:</span>
                <span className="text-binance-textPrimary">
                  {connectionStatus.reason}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;



