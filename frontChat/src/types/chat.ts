/**
 * 聊天相关的类型定义
 */

/**
 * 消息接口 - 与后端API交互的消息格式
 */
export interface Message {
  id: number;
  msg_id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

/**
 * 聊天会话接口 - 会话管理数据结构
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 聊天会话管理Hook的返回类型
 */
export interface UseChatSessionsReturn {
  // 状态
  currentSessionId: string;
  chatSessions: ChatSession[];
  messages: Message[];
  
  // 操作方法
  createNewSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateCurrentSession: (newMessages: Message[]) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  
  // 工具方法
  generateMsgId: () => string;
}

/**
 * 文件上传相关类型定义
 */

/**
 * 上传文件信息接口
 */
export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploadTime: Date;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

/**
 * 文件上传配置接口
 */
export interface FileUploadConfig {
  maxFileSize: number; // 最大文件大小（字节）
  maxFileCount: number; // 最大文件数量
  acceptedTypes: string[]; // 支持的文件类型
  allowMultiple: boolean; // 是否允许多选
}

/**
 * 文件上传Hook的返回类型
 */
export interface UseFileUploadReturn {
  // 状态
  uploadedFiles: UploadedFile[];
  isUploading: boolean;
  uploadProgress: number;
  
  // 操作方法
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (fileId: string) => void;
  clearAllFiles: () => void;
  uploadFiles: () => Promise<void>;
  
  // 配置
  config: FileUploadConfig;
  updateConfig: (newConfig: Partial<FileUploadConfig>) => void;
}