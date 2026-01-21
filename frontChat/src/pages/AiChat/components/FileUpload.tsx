/**
 * 文件上传组件
 * 
 * 功能：
 * 1. 文件选择按钮
 * 2. 已选择文件列表显示
 * 3. 文件删除功能
 * 4. 上传进度显示
 * 5. 响应式布局
 */

import React, { useRef } from 'react';
import { Button, Progress, Tooltip, Space } from 'antd';
import { PaperClipOutlined, DeleteOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { UploadedFile, FileUploadConfig } from '@/types/chat';

/**
 * 文件上传组件属性接口
 */
interface FileUploadProps {
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 文件上传配置 */
  config?: Partial<FileUploadConfig>;
  /** 文件变化回调 */
  onFilesChange?: (files: UploadedFile[]) => void;
  /** 上传完成回调 */
  onUploadComplete?: (files: UploadedFile[]) => void;
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 获取文件状态颜色
 */
const getFileStatusColor = (status: UploadedFile['status']): string => {
  switch (status) {
    case 'pending':
      return '#1890ff';
    case 'uploading':
      return '#faad14';
    case 'success':
      return '#52c41a';
    case 'error':
      return '#ff4d4f';
    default:
      return '#d9d9d9';
  }
};

/**
 * 文件上传组件
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  style,
  className,
  disabled = false,
  config,
  onFilesChange,
  onUploadComplete,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = useBreakpoints();
  
  const {
    uploadedFiles,
    isUploading,
    uploadProgress,
    handleFileUpload,
    removeFile,
    clearAllFiles,
    uploadFiles,
    config: fileConfig,
  } = useFileUpload(config);

  const getFileStatusText = (status: UploadedFile['status']): string => {
    switch (status) {
      case 'pending':
        return t('chat.upload.pending');
      case 'uploading':
        return t('chat.upload.uploading');
      case 'success':
        return t('chat.upload.success');
      case 'error':
        return t('chat.upload.error');
      default:
        return '';
    }
  };

  // 监听文件变化
  React.useEffect(() => {
    onFilesChange?.(uploadedFiles);
  }, [uploadedFiles, onFilesChange]);

  // 监听上传完成
  React.useEffect(() => {
    const successFiles = uploadedFiles.filter(file => file.status === 'success');
    if (successFiles.length > 0 && !isUploading) {
      onUploadComplete?.(successFiles);
    }
  }, [uploadedFiles, isUploading, onUploadComplete]);

  /**
   * 触发文件选择
   */
  const triggerFileSelect = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  /**
   * 生成accept属性值
   */
  const getAcceptValue = (): string => {
    return fileConfig.acceptedTypes.join(',');
  };

  return (
    <div style={style} className={className}>
      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={fileConfig.allowMultiple}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        accept={getAcceptValue()}
        disabled={disabled || isUploading}
      />

      {/* 已选择文件列表 */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginBottom: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{t('chat.upload.selected')} ({uploadedFiles.length}/{fileConfig.maxFileCount}):</span>
            {uploadedFiles.length > 1 && (
              <Button
                type="link"
                size="small"
                onClick={clearAllFiles}
                disabled={isUploading}
                style={{ padding: 0, height: 'auto', fontSize: '12px' }}
              >
                {t('chat.upload.clearAll')}
              </Button>
            )}
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: 'wrap', 
            gap: '4px' 
          }}>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f5f5f5',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  gap: '4px',
                  border: `1px solid ${getFileStatusColor(file.status)}`,
                  minWidth: isMobile ? '100%' : 'auto',
                  maxWidth: isMobile ? '100%' : '200px',
                  position: 'relative',
                  paddingRight: file.status !== 'uploading' ? '24px' : '8px'
                }}
              >
                <FileOutlined style={{ color: getFileStatusColor(file.status) }} />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Tooltip title={`${file.name} (${formatFileSize(file.size)})`}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {file.name}
                    </div>
                  </Tooltip>
                  
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#999',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{formatFileSize(file.size)}</span>
                    <span style={{ color: getFileStatusColor(file.status) }}>
                      {getFileStatusText(file.status)}
                    </span>
                  </div>
                  
                  {/* 上传进度条 */}
                  {file.status === 'uploading' && file.progress !== undefined && (
                    <Progress
                      percent={file.progress}
                      size="small"
                      showInfo={false}
                      style={{ margin: '2px 0' }}
                    />
                  )}
                </div>

                {/* 删除按钮 */}
                {file.status !== 'uploading' && (
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeFile(file.id)}
                    disabled={isUploading}
                    style={{
                      padding: 0,
                      width: '16px',
                      height: '16px',
                      minWidth: '16px',
                      color: '#ff4d4f',
                      fontSize: '10px',
                      position: 'absolute',
                      right: '4px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                )}
                
                {/* 上传中图标 */}
                {file.status === 'uploading' && (
                  <LoadingOutlined style={{ color: '#faad14', fontSize: '12px' }} />
                )}
              </div>
            ))}
          </div>

          {/* 总体上传进度 */}
          {isUploading && (
            <div style={{ marginTop: '8px' }}>
              <Progress
                percent={Math.round(uploadProgress)}
                size="small"
                status="active"
                format={(percent) => `${t('chat.upload.uploading')} ${percent}%`}
              />
            </div>
          )}
        </div>
      )}

      {/* 文件上传按钮 */}
      <Space size="small">
        <Button
          type="text"
          icon={<PaperClipOutlined />}
          onClick={triggerFileSelect}
          disabled={disabled || isUploading || uploadedFiles.length >= fileConfig.maxFileCount}
          style={{
            border: 'none',
            boxShadow: 'none',
            color: '#666',
            fontSize: '16px'
          }}
          title={
            uploadedFiles.length >= fileConfig.maxFileCount 
              ? t('chat.upload.maxLimit', { count: fileConfig.maxFileCount })
              : t('chat.upload.select')
          }
        />

        {/* 上传按钮 */}
        {uploadedFiles.some(file => file.status === 'pending') && (
          <Button
            type="primary"
            size="small"
            onClick={uploadFiles}
            loading={isUploading}
            disabled={disabled}
            style={{ fontSize: '12px' }}
          >
            {isUploading ? t('chat.upload.btnUploading') : t('chat.upload.btn')}
          </Button>
        )}
      </Space>

      
    </div>
  );
};

export default FileUpload;