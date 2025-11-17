import React from 'react';
import { Button, Tooltip, Card, Form, Row, Col, Slider } from 'antd';
import { StopOutlined, GlobalOutlined, SettingOutlined } from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import MicRecorderButton from './MicRecorderButton';
import FileUpload from './FileUpload';
import type { UploadedFile } from '../../../types/chat';

interface AdvancedSettings {
  topK: number;
  score: number;
}

interface InputAreaProps {
  inputValue: string;
  loading: boolean;
  isNetworkEnabled: boolean;
  showAdvancedSettings: boolean;
  advancedSettings: AdvancedSettings;
  currentUploadedFiles: UploadedFile[];
  onVoiceTranscript?: (text: string) => void;

  onInputChange: (val: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onStop: () => void;
  onToggleNetwork: () => void;
  onToggleAdvancedSettings: () => void;
  onFilesChange: (files: UploadedFile[]) => void;
  onUploadComplete: (files: UploadedFile[]) => void;
  onAdvancedSettingsChange: (field: keyof AdvancedSettings, value: number) => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  inputValue,
  loading,
  isNetworkEnabled,
  showAdvancedSettings,
  advancedSettings,
  currentUploadedFiles,
  onVoiceTranscript,
  onInputChange,
  onKeyPress,
  onSend,
  onStop,
  onToggleNetwork,
  onToggleAdvancedSettings,
  onFilesChange,
  onUploadComplete,
  onAdvancedSettingsChange,
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
          onKeyDown={onKeyPress}
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
          actions={(ori) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* 默认动作（发送/清空/语音按钮等） */}
              {ori}
              {/* 联网开关 */}
              <Tooltip title={isNetworkEnabled ? '关闭联网' : '开启联网'}>
                <Button
                  type="text"
                  icon={<GlobalOutlined />}
                  onClick={onToggleNetwork}
                  style={{ border: 'none', boxShadow: 'none', color: isNetworkEnabled ? '#1890ff' : '#666' }}
                />
              </Tooltip>
              <Tooltip>
                <FileUpload
                  onFilesChange={onFilesChange}
                  onUploadComplete={onUploadComplete}
                  disabled={loading}
                  style={{ marginBottom: currentUploadedFiles.length > 0 ? '8px' : '0' }}
                />
              </Tooltip>
              {/* 高级设置 */}
              <Tooltip title="高级设置">
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={onToggleAdvancedSettings}
                  style={{ border: 'none', boxShadow: 'none', color: showAdvancedSettings ? '#1890ff' : '#666' }}
                />
              </Tooltip>
              {/* 语音通话（VAD） */}
              <MicRecorderButton
                disabled={loading}
                language={'auto'}
                onTranscript={(text) => onVoiceTranscript?.(text)}
              />
              {/* 停止按钮 */}
              {loading && (
                <Tooltip title="停止">
                  <Button
                    type="text"
                    danger
                    icon={<StopOutlined />}
                    onClick={onStop}
                    style={{ border: 'none', boxShadow: 'none', color: '#ff4d4f' }}
                  />
                </Tooltip>
              )}
            </div>
          )}
          styles={{ content: { backgroundColor: 'transparent' } }}
        />
        {/* 高级设置面板 */}
        {showAdvancedSettings && (
          <div style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            border: '1px solid #d9d9d9'
          }}>
            <Form layout="horizontal" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={`返回数量: ${advancedSettings.topK}`} style={{ marginBottom: '8px' }}>
                    <Slider
                      min={1}
                      max={10}
                      value={advancedSettings.topK}
                      onChange={(value) => onAdvancedSettingsChange('topK', value)}
                      marks={{ 1: '1', 5: '5', 10: '10' }}
                      style={{ margin: '0 8px' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={`相似度: ${advancedSettings.score}`} style={{ marginBottom: '8px' }}>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={advancedSettings.score}
                      onChange={(value) => onAdvancedSettingsChange('score', value)}
                      marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
                      style={{ margin: '0 8px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </div>
    </>
  );
};

export default InputArea;