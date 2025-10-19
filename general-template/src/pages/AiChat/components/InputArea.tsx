import React from 'react';
import { Button, Tooltip, Card, Form, Row, Col, Slider, Input } from 'antd';
import { SendOutlined, StopOutlined, GlobalOutlined, SettingOutlined } from '@ant-design/icons';
import MicRecorderButton from './MicRecorderButton';
import FileUpload from './FileUpload';
import KnowledgeSelector, { type KnowledgeSelectorRef } from '../../../components/KnowledgeSelector';
import type { UploadedFile } from '../../../types/chat';

const { TextArea } = Input;

interface AdvancedSettings {
  topK: number;
  score: number;
}

interface InputAreaProps {
  inputValue: string;
  loading: boolean;
  selectedKnowledge: string;
  isNetworkEnabled: boolean;
  showAdvancedSettings: boolean;
  advancedSettings: AdvancedSettings;
  currentUploadedFiles: UploadedFile[];
  knowledgeSelectorRef: React.Ref<KnowledgeSelectorRef>;
  onVoiceTranscript?: (text: string) => void;

  onInputChange: (val: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onStop: () => void;
  onToggleNetwork: () => void;
  onToggleAdvancedSettings: () => void;
  onKnowledgeChange: (id: string) => void;
  onFilesChange: (files: UploadedFile[]) => void;
  onUploadComplete: (files: UploadedFile[]) => void;
  onAdvancedSettingsChange: (field: keyof AdvancedSettings, value: number) => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  inputValue,
  loading,
  selectedKnowledge,
  isNetworkEnabled,
  showAdvancedSettings,
  advancedSettings,
  currentUploadedFiles,
  knowledgeSelectorRef,
  onVoiceTranscript,
  onInputChange,
  onKeyPress,
  onSend,
  onStop,
  onToggleNetwork,
  onToggleAdvancedSettings,
  onKnowledgeChange,
  onFilesChange,
  onUploadComplete,
  onAdvancedSettingsChange,
}) => {
  return (
    <>
      <div style={{ 
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: '#fafafa'
      }}>
        {/* 文件上传组件 */}
        <FileUpload
          onFilesChange={onFilesChange}
          onUploadComplete={onUploadComplete}
          disabled={loading}
          style={{ marginBottom: currentUploadedFiles.length > 0 ? '8px' : '0' }}
        />
        
        {/* 输入框 */}
        <TextArea
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="输入你的消息... (按 Enter 发送，Shift+Enter 换行)"
          autoSize={{ minRows: 2, maxRows: 4 }}
          className="custom-scrollbar"
          style={{ 
            fontSize: '16px',
            border: 'none',
            backgroundColor: 'transparent',
            resize: 'none'
          }}
          disabled={loading}
        />
        
        {/* 按钮区域 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
          gap: '8px'
        }}>
          {/* 左侧控制区域 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 知识库选择 */}
            <KnowledgeSelector
              ref={knowledgeSelectorRef}
              value={selectedKnowledge}
              onChange={onKnowledgeChange}
              style={{ width: '120px' }}
              size="small"
            />

            {/* 联网按钮 */}
            <Tooltip title={isNetworkEnabled ? "关闭联网" : "开启联网"}>
              <Button
                type="text"
                icon={<GlobalOutlined />}
                onClick={onToggleNetwork}
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  color: isNetworkEnabled ? '#1890ff' : '#666',
                  fontSize: '16px'
                }}
              />
        </Tooltip>

          {/* 高级设置按钮 */}
          <Tooltip title="高级设置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={onToggleAdvancedSettings}
              style={{
                border: 'none',
                boxShadow: 'none',
                color: showAdvancedSettings ? '#1890ff' : '#666',
                fontSize: '16px'
              }}
            />
          </Tooltip>

            {/* 语音输入按钮 */}
            <MicRecorderButton
              disabled={loading}
              language={'auto'}
              onTranscript={(text) => onVoiceTranscript?.(text)}
            />
          </div>
          
          {/* 发送/停止按钮 */}
          <div>
            {loading ? (
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={onStop}
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  color: '#ff4d4f',
                  fontSize: '16px'
                }}
                title="停止"
              />
            ) : (
              <Button
                type="text"
                icon={<SendOutlined />}
                onClick={onSend}
                disabled={!inputValue.trim()}
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  color: inputValue.trim() ? '#1890ff' : '#d9d9d9',
                  fontSize: '16px'
                }}
                title="发送"
              />
            )}
          </div>
        </div>

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