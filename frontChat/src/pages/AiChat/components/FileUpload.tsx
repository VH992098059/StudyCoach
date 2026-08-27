/**
 * 文件上传组件（shadcn 版，设计文档 6.1：逻辑层保留，样式按新 token 重写）
 * 选择文件、列表展示、删除、上传进度、响应式布局
 * 接口（FileUploadRef / props）与旧版保持一致
 */

import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Loader2, Trash2 } from 'lucide-react';

import { useFileUpload } from '@/hooks/useFileUpload';
import { ChatHistoryService } from '@/services/chatHistory';
import { formatFileSize } from '@/utils/file';
import type { UploadedFile, FileUploadConfig } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  sessionId?: string;
  autoUpload?: boolean;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  config?: Partial<FileUploadConfig>;
  onFilesChange?: (files: UploadedFile[]) => void;
  onUploadComplete?: (files: UploadedFile[]) => void;
}

export interface FileUploadRef {
  uploadFiles: (sessionId: string) => Promise<string[]>;
  clearAllFiles: () => void;
  triggerFileSelect: () => void;
}

const uploadFn = async (sessionId: string, files: File[]): Promise<string[]> => {
  const res = await ChatHistoryService.uploadFiles(sessionId, files);
  return res.file_names || [];
};

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/** 状态色（Tailwind token） */
const statusColor = (status: UploadedFile['status']): string => {
  switch (status) {
    case 'success':
      return 'text-success';
    case 'error':
      return 'text-danger';
    case 'uploading':
      return 'text-warning';
    default:
      return 'text-text-3';
  }
};

/** 图片缩略图，管理 blob URL 生命周期（点击新窗口预览） */
const ImageThumbnail: React.FC<{ file: File; alt: string }> = ({ file, alt }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!url) return <FileText className="size-6 shrink-0 text-text-3" />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
      <img src={url} alt={alt} className="size-12 rounded-sm object-cover" />
    </a>
  );
};

export const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(
  ({ sessionId, autoUpload = false, style, className, disabled = false, config, onFilesChange, onUploadComplete }, ref) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
      uploadedFiles,
      isUploading,
      uploadProgress,
      handleFileUpload,
      removeFile,
      clearAllFiles,
      uploadFiles,
      config: fileConfig,
    } = useFileUpload({ ...config, uploadFn });

    const triggerFileSelect = React.useCallback(() => {
      if (disabled || isUploading) return;
      fileInputRef.current?.click();
    }, [disabled, isUploading]);

    useImperativeHandle(
      ref,
      () => ({
        uploadFiles: (sid: string) => uploadFiles(sid),
        clearAllFiles,
        triggerFileSelect,
      }),
      [uploadFiles, clearAllFiles, triggerFileSelect],
    );

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

    // 用 ref 保存最新回调，避免回调变化触发副作用重放
    const onFilesChangeRef = React.useRef(onFilesChange);
    const onUploadCompleteRef = React.useRef(onUploadComplete);
    React.useEffect(() => {
      onFilesChangeRef.current = onFilesChange;
    });
    React.useEffect(() => {
      onUploadCompleteRef.current = onUploadComplete;
    });

    useEffect(() => {
      onFilesChangeRef.current?.(uploadedFiles);
    }, [uploadedFiles]);

    useEffect(() => {
      const successFiles = uploadedFiles.filter((file) => file.status === 'success');
      if (successFiles.length > 0 && !isUploading) {
        onUploadCompleteRef.current?.(successFiles);
      }
    }, [uploadedFiles, isUploading]);

    // 自动上传：选择文件后若有 sessionId 则自动上传
    const pendingCount = uploadedFiles.filter((f) => f.status === 'pending').length;
    useEffect(() => {
      if (!autoUpload || !sessionId || pendingCount === 0) return;
      uploadFiles(sessionId);
    }, [autoUpload, sessionId, pendingCount, uploadFiles]);

    return (
      <div style={style} className={className}>
        <input
          ref={fileInputRef}
          type="file"
          multiple={fileConfig.allowMultiple}
          onChange={handleFileUpload}
          className="hidden"
          accept={fileConfig.acceptedTypes.join(',')}
          disabled={disabled || isUploading}
        />

        {uploadedFiles.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between text-xs text-text-3">
              <span>
                {t('chat.upload.selected')} ({uploadedFiles.length}/{fileConfig.maxFileCount})
              </span>
              {uploadedFiles.length > 1 && (
                <button
                  type="button"
                  className="cursor-pointer bg-transparent p-0 text-xs text-primary hover:underline disabled:cursor-not-allowed disabled:text-text-4"
                  onClick={clearAllFiles}
                  disabled={isUploading}
                >
                  {t('chat.upload.clearAll')}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {uploadedFiles.map((file) => {
                const isImage = IMAGE_TYPES.includes(file.file.type);
                return (
                  <div
                    key={file.id}
                    className={cn(
                      'relative flex w-full max-w-[220px] items-center gap-2 rounded-sm border bg-surface px-2 py-1.5 text-xs',
                      file.status === 'error' ? 'border-danger/60' : 'border-border',
                    )}
                  >
                    {isImage ? (
                      <ImageThumbnail file={file.file} alt={file.name} />
                    ) : (
                      <FileText className={cn('size-6 shrink-0', statusColor(file.status))} />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-text-1" title={`${file.name} (${formatFileSize(file.size)})`}>
                        {file.name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-text-4">
                        <span>{formatFileSize(file.size)}</span>
                        <span className={statusColor(file.status)}>{getFileStatusText(file.status)}</span>
                      </div>
                      {file.status === 'uploading' && file.progress !== undefined && (
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-hover">
                          <div
                            className="h-full rounded-full bg-primary transition-[width]"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {file.status !== 'uploading' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5 shrink-0 text-text-4 hover:text-danger"
                        onClick={() => removeFile(file.id)}
                        disabled={isUploading}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    ) : (
                      <Loader2 className="size-3.5 shrink-0 animate-spin text-warning" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* 总体上传进度 */}
            {isUploading && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-text-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-hover">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${Math.round(uploadProgress)}%` }}
                  />
                </div>
                <span className="font-mono">
                  {t('chat.upload.uploading')} {Math.round(uploadProgress)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

export default FileUpload;
