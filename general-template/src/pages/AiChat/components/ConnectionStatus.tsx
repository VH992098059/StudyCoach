import React from 'react';
import { SSEConnectionState } from '../../../utils/sse/sse';

interface ConnectionStatusProps {
  loading: boolean;
  connectionState: SSEConnectionState;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  loading,
  connectionState,
  reconnectAttempts,
  maxReconnectAttempts,
}) => {
  if (!loading && connectionState === SSEConnectionState.DISCONNECTED) {
    return null;
  }

  let statusText = '';
  let statusColor = '';

  switch (connectionState) {
    case SSEConnectionState.CONNECTING:
      statusText = '正在连接...';
      statusColor = '#1890ff';
      break;
    case SSEConnectionState.CONNECTED:
      statusText = '已连接';
      statusColor = '#52c41a';
      break;
    case SSEConnectionState.RECONNECTING:
      statusText = `重连中... (${reconnectAttempts}/${maxReconnectAttempts})`;
      statusColor = '#faad14';
      break;
    case SSEConnectionState.ERROR:
      statusText = '连接错误';
      statusColor = '#ff4d4f';
      break;
    default:
      return null;
  }

  return (
    <div style={{
      padding: '8px 12px',
      backgroundColor: '#f0f0f0',
      borderRadius: '6px',
      marginBottom: '12px',
      fontSize: '12px',
      color: statusColor,
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: statusColor,
        animation: connectionState === SSEConnectionState.CONNECTING || 
                  connectionState === SSEConnectionState.RECONNECTING ? 
                  'pulse 1.5s infinite' : 'none'
      }} />
      {statusText}
    </div>
  );
};

export default ConnectionStatus;