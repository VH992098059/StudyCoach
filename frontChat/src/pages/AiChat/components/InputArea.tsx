/**
 * @fileoverview 输入区域
 * @description 负责消息输入与发送、网络开关、上传文件、语音转写及高级检索参数设置。
 */
import React from 'react';
import { Button, Switch, Tooltip, Flex, Divider, theme } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import MicRecorderButton from './MicRecorderButton';
import FileUpload from './FileUpload';
import type { UploadedFile } from '@/types/chat';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';


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
  onToggleStudyMode,
  onSend,
  onStop,
  onToggleNetwork,
  onFilesChange,
  onUploadComplete,
}) => {
  const { token } = theme.useToken();
  const { isMobile } = useBreakpoints();
  const { t } = useTranslation();
  const iconStyle = {
    fontSize: 18,
    color: token.colorText,
  };

  return (
    <div style={{ 
      borderRadius: '8px',
    }}>

      {/* 输入区：使用 Ant Design X Sender */}
      <Sender
        value={inputValue}
        onChange={(val) => onInputChange(val)}
        placeholder={t('chat.input.placeholder')}
        autoSize={{ minRows: 2, maxRows: 6 }}
        loading={loading}
        submitType={'enter'}
        allowSpeech={true}
        onSubmit={(message) => {
          if (!message?.trim() && currentUploadedFiles.length === 0) return;
          // 如果有文本，触发 input change 确保状态同步（虽然 onChange 已经触发）
          if (message) onInputChange(message);
          setTimeout(() => onSend(), 0);
        }}
        onCancel={() => onStop()}
        footer={(_, { components }) => {
            const { SendButton, LoadingButton, SpeechButton } = components;
            return (
              <Flex justify="space-between" align="center" wrap="wrap" gap="small">
                <Flex gap="small" align="center" style={{ flex: 1, overflow: 'hidden' }}>
                  {/* 文件上传 / 附件 */}
                  <FileUpload
                    onFilesChange={onFilesChange}
                    onUploadComplete={onUploadComplete}
                    disabled={loading}
                    style={{ marginBottom: 0 }} // Override default marginBottom
                  />
                  
                  <Divider orientation="vertical" style={{ margin: '0 4px' }} />
                  
                  {/* 深度思考 / 学习模式 */}
                  {!isMobile && <span style={{ fontSize: 12, color: token.colorTextSecondary }}>{t('chat.input.studyMode')}</span>}
                  <Switch
                    size="small"
                    checked={isStudyMode}
                    onChange={() => onToggleStudyMode()}
                    checkedChildren={isMobile ? t('chat.input.studyModeShort') : undefined}
                    unCheckedChildren={isMobile ? t('chat.input.studyModeShort') : undefined}
                  />
                  
                  <Divider orientation="vertical" style={{ margin: '0 4px' }} />
                  
                  {/* 联网搜索 */}
                  <Button 
                    type={isNetworkEnabled ? 'primary' : 'text'}
                    ghost={isNetworkEnabled}
                    size="small"
                    icon={<GlobalOutlined />} 
                    onClick={onToggleNetwork}
                    style={{
                        color: isNetworkEnabled ? token.colorPrimary : token.colorText,
                        padding: isMobile ? '0 4px' : undefined
                    }}
                  >
                    {isMobile ? (isNetworkEnabled ? t('chat.input.network') : '') : (isNetworkEnabled ? t('chat.input.networkEnabled') : t('chat.input.networkSearch'))}
                  </Button>
                </Flex>
                
                <Flex align="center" gap="small" style={{ flexShrink: 0 }}>
                  {/* 语音通话 (MicRecorderButton) - 使用 PhoneOutlined (Text Type) */}
                  <MicRecorderButton
                    disabled={loading}
                    language={'auto'}
                    onTranscript={(text) => onVoiceTranscript?.(text)}
                    type="text"
                    style={iconStyle}
                  />
                  
                  <Divider orientation="vertical" style={{ margin: '0 4px' }} />
                  
                  {/* 语音输入 (Sender Built-in) */}
                  <SpeechButton style={iconStyle} />
                  
                  <Divider orientation="vertical" style={{ margin: '0 4px' }} />
                  
                  {/* 发送按钮 */}
                  {loading ? (
                    <LoadingButton type="default" />
                  ) : (
                    <SendButton type="primary" disabled={!inputValue && currentUploadedFiles.length === 0} />
                  )}
                </Flex>
              </Flex>
            );
        }}
        suffix={false}
      />
      
    </div>
  );
};

export default InputArea;
