/**
 * 文件上传管理Hook
 * 
 * 功能：
 * 1. 文件选择和管理
 * 2. 文件上传状态跟踪
 * 3. 文件类型和大小验证
 * 4. 上传进度管理
 * 5. 错误处理
 */

import { useState, useCallback } from 'react';
import { message } from 'antd';
import type { UploadedFile, FileUploadConfig, UseFileUploadReturn } from '../types/chat';

/**
 * 默认文件上传配置
 */
const DEFAULT_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFileCount: 5,
  acceptedTypes: ['.txt', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.md'],
  allowMultiple: true,
};

/**
 * 生成唯一文件ID
 */
const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

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
 * 验证文件类型
 */
const validateFileType = (file: File, acceptedTypes: string[]): boolean => {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return acceptedTypes.includes(fileExtension);
};

/**
 * 验证文件大小
 */
const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
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
   * 上传文件到服务器
   */
  const uploadFiles = useCallback(async (): Promise<void> => {
    const pendingFiles = uploadedFiles.filter(file => file.status === 'pending');
    
    if (pendingFiles.length === 0) {
      message.info('没有需要上传的文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 更新文件状态为上传中
      setUploadedFiles(prev => 
        prev.map(file => 
          pendingFiles.some(pf => pf.id === file.id) 
            ? { ...file, status: 'uploading' as const, progress: 0 }
            : file
        )
      );

      // 模拟上传过程（实际项目中替换为真实的上传逻辑）
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        
        // 模拟上传进度
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 更新单个文件进度
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === file.id 
                ? { ...f, progress }
                : f
            )
          );
          
          // 更新总体进度
          const totalProgress = ((i * 100 + progress) / (pendingFiles.length * 100)) * 100;
          setUploadProgress(totalProgress);
        }

        // 标记文件上传成功
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          )
        );
      }

      message.success('所有文件上传成功');
    } catch (error) {
      console.error('文件上传失败:', error);
      
      // 标记文件上传失败
      setUploadedFiles(prev => 
        prev.map(file => 
          pendingFiles.some(pf => pf.id === file.id)
            ? { ...file, status: 'error' as const, error: '上传失败' }
            : file
        )
      );
      
      message.error('文件上传失败');
    } finally {
      setIsUploading(false);
    }
  }, [uploadedFiles]);

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