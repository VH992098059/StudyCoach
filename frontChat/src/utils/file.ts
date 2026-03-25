/**
 * 文件相关工具函数（供 useFileUpload / FileUpload 等共用）
 */
import type { UploadedFile } from '@/types/chat';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFileType = (file: File, acceptedTypes: string[]): boolean => {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return acceptedTypes.includes(ext);
};

export const validateFileSize = (file: File, maxSize: number): boolean =>
  file.size <= maxSize;

export const getFileStatusColor = (status: UploadedFile['status']): string => {
  switch (status) {
    case 'pending':   return '#1890ff';
    case 'uploading': return '#faad14';
    case 'success':   return '#52c41a';
    case 'error':     return '#ff4d4f';
    default:          return '#d9d9d9';
  }
};
