/**
 * @fileoverview 输入区域
 * @description 负责消息输入与发送、网络开关、上传文件、语音转写及高级检索参数设置。
 */
import React from 'react';
import { Button, Form, Row, Col, Slider, Switch, Tooltip } from 'antd';
import { StopOutlined, GlobalOutlined, SettingOutlined , ReadOutlined, MessageOutlined} from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import MicRecorderButton from './MicRecorderButton';
import FileUpload from './FileUpload';
import type { UploadedFile } from '@/types/chat';

interface AdvancedSettings {
  topK: number;
  score: number;
}

interface InputAreaProps {
  inputValue: string;
  loading: boolean;
  isNetworkEnabled: boolean;
  isStudyMode: boolean;
  currentUploadedFiles: UploadedFile[];
  onVoiceTranscript?: (text: string) => void;

  onInputChange: (val: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onStop: () => void;
  onToggleNetwork: () => void;
  onFilesChange: (files: UploadedFile[]) => void;
  onUploadComplete: (files: UploadedFile[]) => void;
  onToggleStudyMode: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  inputValue,
  loading,
  isNetworkEnabled,
  currentUploadedFiles,
   isStudyMode,
  onVoiceTranscript,
  onInputChange,
  onKeyPress,
    onToggleStudyMode,
  onSend,
  onStop,
  onToggleNetwork,
  onFilesChange,
  onUploadComplete,
}) => {
  return (
    <>
      <div style={{ 
        borderRadius: '8px',
      }}>

        {/* 输入区：使用 Ant Design X Sender */}
        <Sender
          value={inputValue}
          onChange={(val) => onInputChange(val)}
          placeholder={"输入你的消息..."}
          autoSize={{ minRows: 3, maxRows: 5 }}
          loading={loading}
          submitType={'enter'}
          allowSpeech={true}
          onSubmit={(message) => {
            if (!message?.trim()) return;
            onInputChange(message);
            setTimeout(() => onSend(), 0);
          }}
          onCancel={() => onStop()}
          actions={(ori) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* 默认动作（发送/清空/语音按钮等） */}
              {ori}
              <Tooltip title={isStudyMode ? '学习模式' : '普通模式'}>
                <Switch
                  checked={isStudyMode}
                  onChange={() => onToggleStudyMode()}
                  checkedChildren={<span><ReadOutlined style={{ fontSize: 14 }} /> 学习</span>}
                  unCheckedChildren={<span><MessageOutlined style={{ fontSize: 14 }} /> 普通</span>}
                  
                />
              </Tooltip>
              {/* 联网开关 */}
              <Button
                type="text"
                icon={<GlobalOutlined />}
                onClick={onToggleNetwork}
                title={isNetworkEnabled ? '关闭联网' : '开启联网'}
                style={{ border: 'none', boxShadow: 'none', color: isNetworkEnabled ? '#1890ff' : '#666' }}
              />
              
              <FileUpload
                onFilesChange={onFilesChange}
                onUploadComplete={onUploadComplete}
                disabled={loading}
                style={{ marginBottom: currentUploadedFiles.length > 0 ? '8px' : '0' }}
              />
              {/* 语音通话（VAD） */}
              <MicRecorderButton
                disabled={loading}
                language={'auto'}
                onTranscript={(text) => onVoiceTranscript?.(text)}
              />
              
            </div>
          )}
          styles={{ content: { backgroundColor: 'transparent' } }}
        />
        
      </div>
    </>
  );
};

export default InputArea;
