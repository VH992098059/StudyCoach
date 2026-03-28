/**
 * 文件上传管理：选择、验证、上传、进度跟踪、错误处理
 */

import { useState, useCallback } from 'react';
import { message } from 'antd';
import type { UploadedFile, FileUploadConfig, UseFileUploadReturn } from '../types/chat';
import { formatFileSize, validateFileType, validateFileSize } from '@/utils/file';

const DEFAULT_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFileCount: 5,
  acceptedTypes: ['.txt', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.md', '.csv'],
  allowMultiple: true,
};

// 生成唯一文件ID
const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 文件上传Hook
 */
export const useFileUpload = (initialConfig?: Partial<FileUploadConfig>): UseFileUploadReturn => {
  // 合并配置
  const [config, setConfig] = useState<FileUploadConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  // 状态管理
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * 处理文件选择
   */
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    // 检查文件数量限制
    if (uploadedFiles.length + newFiles.length > config.maxFileCount) {
      message.error(`最多只能上传 ${config.maxFileCount} 个文件`);
      return;
    }

    // 验证每个文件
    newFiles.forEach((file) => {
      // 验证文件类型
      if (!validateFileType(file, config.acceptedTypes)) {
        errors.push(`文件 "${file.name}" 类型不支持`);
        return;
      }

      // 验证文件大小
      if (!validateFileSize(file, config.maxFileSize)) {
        errors.push(`文件 "${file.name}" 大小超过限制 (${formatFileSize(config.maxFileSize)})`);
        return;
      }

      // 检查是否已存在同名文件
      const isDuplicate = uploadedFiles.some(uploadedFile => uploadedFile.name === file.name);
      if (isDuplicate) {
        errors.push(`文件 "${file.name}" 已存在`);
        return;
      }

      // 创建文件对象
      const uploadedFile: UploadedFile = {
        id: generateFileId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: new Date(),
        status: 'pending',
        progress: 0,
      };

      validFiles.push(uploadedFile);
    });

    // 显示错误信息
    if (errors.length > 0) {
      errors.forEach(error => message.error(error));
    }

    // 添加有效文件
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      message.success(`已选择 ${validFiles.length} 个文件`);
    }

    // 清空input值，允许重复选择同一文件
    event.target.value = '';
  }, [uploadedFiles, config]);

  /**
   * 移除文件
   */
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  /**
   * 清空所有文件
   */
  const clearAllFiles = useCallback(() => {
    setUploadedFiles([]);
    setUploadProgress(0);
  }, []);

  /**
   * 上传文件到服务器，返回已上传的文件名列表（含之前已成功的）
   */
  const uploadFiles = useCallback(async (sessionId: string): Promise<string[]> => {
    const pendingFiles = uploadedFiles.filter(file => file.status === 'pending');
    const successFiles = uploadedFiles.filter(file => file.status === 'success' && file.serverName);
    const existingNames = successFiles.map(f => f.serverName!);

    if (pendingFiles.length === 0) {
      return existingNames;
    }

    const uploadFn = config.uploadFn;
    if (!uploadFn) {
      message.error('未配置上传接口');
      return existingNames;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      setUploadedFiles(prev =>
        prev.map(file =>
          pendingFiles.some(pf => pf.id === file.id)
            ? { ...file, status: 'uploading' as const, progress: 0 }
            : file
        )
      );

      const fileNames = await uploadFn(sessionId, pendingFiles.map(f => f.file));

      setUploadedFiles(prev =>
        prev.map(file => {
          const idx = pendingFiles.findIndex(pf => pf.id === file.id);
          if (idx >= 0 && fileNames[idx]) {
            return { ...file, status: 'success' as const, progress: 100, serverName: fileNames[idx] };
          }
          return file;
        })
      );

      setUploadProgress(100);
      message.success('所有文件上传成功');
      return [...existingNames, ...fileNames];
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadedFiles(prev =>
        prev.map(file =>
          pendingFiles.some(pf => pf.id === file.id)
            ? { ...file, status: 'error' as const, error: '上传失败' }
            : file
        )
      );
      message.error('文件上传失败');
      return existingNames;
    } finally {
      setIsUploading(false);
    }
  }, [uploadedFiles, config.uploadFn]);

  /**
   * 更新配置
   */
  const updateConfig = useCallback((newConfig: Partial<FileUploadConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
    // 状态
    uploadedFiles,
    isUploading,
    uploadProgress,
    
    // 操作方法
    handleFileUpload,
    removeFile,
    clearAllFiles,
    uploadFiles,
    
    // 配置
    config,
    updateConfig,
  };
};

export default useFileUpload;