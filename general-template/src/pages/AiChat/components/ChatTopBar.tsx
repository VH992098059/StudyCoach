import React from 'react';
import { Button } from 'antd';
import { MenuOutlined, InfoCircleOutlined } from '@ant-design/icons';

interface ChatTopBarProps {
  isMobile: boolean;
  onOpenSidebar: () => void;
  onOpenInfo: () => void;
}

const ChatTopBar: React.FC<ChatTopBarProps> = ({ isMobile, onOpenSidebar, onOpenInfo }) => {
  return (
    <div style={{ margin: isMobile ? "3px 0" : "12px 0", display: 'flex', alignItems: 'center', gap: 12 }}>
      {isMobile && (
        <Button icon={<MenuOutlined />} onClick={onOpenSidebar} type="text" size="large" style={{ padding: '4px 8px' }} />
      )}
      {isMobile && (
        <Button icon={<InfoCircleOutlined />} onClick={onOpenInfo} type="text" size="large" style={{ padding: '4px 8px' }} />
      )}
    </div>
  );
};

export default ChatTopBar;