import React, { useState, useRef, useEffect } from 'react';
import { Typography, Input, Button, Card, Avatar, Space, Divider, List, message, Drawer, Alert, Popconfirm, Row, Col, Collapse, Form, InputNumber, Slider, Tag, Empty, Tooltip } from 'antd';
import { SendOutlined, StopOutlined, RobotOutlined, UserOutlined, DeleteOutlined, PlusOutlined, MenuOutlined, ExclamationCircleOutlined, SettingOutlined, FileTextOutlined, CopyOutlined, GlobalOutlined, InfoCircleOutlined, SoundOutlined, PauseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { useChatSessions } from '../../hooks/useChatSessions';
import './scrollbar.scss';
import { SSEClient, SSEConnectionState } from '../../utils/sse/sse';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import KnowledgeSelector, { type KnowledgeSelectorRef } from '../../components/KnowledgeSelector';
import type { Message, UploadedFile } from '../../types/chat';
import FileUpload from './components/FileUpload';
import { MessageItem, MarkdownRenderer, defaultCopyAiMessage } from './components';

const { Title } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

/**
 * 参考文档接口
 */
interface ReferenceDocument {
  id: string;
  title: string;
  content: string;
  similarity: number;
  source: string;
  url?: string;
}

/**
 * 高级设置接口
 */
interface AdvancedSettings {
  topK: number;
  score: number;
}

const AIChat: React.FC = () => {
  // 使用聊天会话管理Hook
  const {
    currentSessionId,
    chatSessions,
    messages,
    createNewSession,
    loadSession,
    deleteSession,
    updateCurrentSession,
    setMessages,
    generateMsgId,
  } = useChatSessions();

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMessageScrolling, setIsMessageScrolling] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sessionInfoDrawerVisible, setSessionInfoDrawerVisible] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  
  // 新增状态
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>('none');
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    topK: 5,
    score: 0.7
  });
  const [referenceDocuments, setReferenceDocuments] = useState<ReferenceDocument[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [isReferenceScrolling, setIsReferenceScrolling] = useState(false);
  const knowledgeSelectorRef = useRef<KnowledgeSelectorRef>(null);
  const referenceScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 联网功能状态
  const [isNetworkEnabled, setIsNetworkEnabled] = useState(false);
  
  // SSE 连接相关状态
  const [sseClient, setSseClient] = useState<SSEClient | null>(null);
  const [connectionState, setConnectionState] = useState<SSEConnectionState>(SSEConnectionState.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState<string>('');
  
  // 文件上传相关状态
  const [currentUploadedFiles, setCurrentUploadedFiles] = useState<UploadedFile[]>([]);
  
  // 朗读功能相关状态
  const [isReading, setIsReading] = useState(false);
  const [currentReadingMsgId, setCurrentReadingMsgId] = useState<string | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // 面板隐藏状态
  const [isChatHistoryCollapsed, setIsChatHistoryCollapsed] = useState(false);
  const [isSessionInfoCollapsed, setIsSessionInfoCollapsed] = useState(false);
  
  // 响应式断点
  const { isMobile, isTablet } = useBreakpoints();
 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageScrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedMessageRef = useRef<string>('');
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 常量配置
  const MAX_RECONNECT_ATTEMPTS = 3;
  const CONNECTION_TIMEOUT = 60000; // 60秒

  // 清理SSE连接
  const cleanupSSEConnection = () => {
    if (sseClient) {
      sseClient.disconnect();
      setSseClient(null);
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    setConnectionState(SSEConnectionState.DISCONNECTED);
  };

  // 创建SSE连接
  const createSSEConnection = (question: string, sessionId: string, currentAttempt: number = 0) => {
    // 如果是第一次连接，清理之前的连接
    if (currentAttempt === 0) {
      cleanupSSEConnection();
      setReconnectAttempts(0);
    }
    
    setConnectionError(null);
    setCurrentAiMessage('');
    
    console.log(`创建SSE连接 - 第 ${currentAttempt + 1} 次尝试`);
    
    // 创建新的SSE客户端
    // 根据环境区分endpoint：本地开发使用'/chat'，Docker环境使用''
    const endpoint = process.env.NODE_ENV === 'production' ? '' : '/chat';
    const client = new SSEClient(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        id: sessionId,
        question: question,
        knowledge_name: selectedKnowledge === 'none' ? '' : selectedKnowledge,
        top_k: advancedSettings.topK,
        score: advancedSettings.score,
        is_network: isNetworkEnabled
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      autoReconnect: false, // 手动控制重连
      timeout: CONNECTION_TIMEOUT
    });

    // 设置事件监听器
    client.addEventListener('open', () => {
      console.log('SSE连接已建立');
      setConnectionState(SSEConnectionState.CONNECTED);
      setReconnectAttempts(0); // 连接成功后重置重连次数
      
      // 清除连接超时定时器
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    });

    // 重置累积消息内容
    accumulatedMessageRef.current = '';
    
    // 清理之前的更新定时器
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }

    client.addEventListener('message', (data) => {
      if (data.data === '[DONE]') {
        // 清理更新定时器
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
          updateTimerRef.current = null;
        }
        
        // 流结束，完成AI消息
        if (accumulatedMessageRef.current.trim()) {
          const aiMessage: Message = {
            id: Date.now(),
            msg_id: generateMsgId(),
            content: accumulatedMessageRef.current.trim(),
            isUser: false,
            timestamp: new Date(),
          };
          
          setMessages(prevMessages => [...prevMessages, aiMessage]);
          accumulatedMessageRef.current = '';
          setCurrentAiMessage('');
        }
        
        // 清理连接
        cleanupSSEConnection();
        setLoading(false);
      } else {
        // 累积AI回复内容到ref中
        accumulatedMessageRef.current += data.data;
        
        // 使用requestAnimationFrame优化渲染性能
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }
        
        updateTimerRef.current = setTimeout(() => {
          requestAnimationFrame(() => {
            setCurrentAiMessage(accumulatedMessageRef.current);
          });
        }, 32); // 约30fps的更新频率，平衡响应性和性能
      }
    });

    client.addEventListener('error', (data) => {
      console.error('SSE连接错误:', data.data);
      setConnectionState(SSEConnectionState.ERROR);
      
      
      // 检查是否需要重连
      if (currentAttempt < MAX_RECONNECT_ATTEMPTS) {
        const nextAttempt = currentAttempt + 1;
        setReconnectAttempts(nextAttempt);
        setConnectionError(`连接失败，正在尝试第 ${nextAttempt} 次重连...`);
        
        console.log(`连接失败，准备第 ${nextAttempt} 次重连 (最大 ${MAX_RECONNECT_ATTEMPTS} 次)`);
        
        // 延迟重连
        setTimeout(() => {
          createSSEConnection(question, sessionId, nextAttempt);
        }, 2000);
      } else {
        // 超过最大重连次数
        console.log(`已达到最大重连次数 ${MAX_RECONNECT_ATTEMPTS}，停止重连`);
        setConnectionError('连接失败，已达到最大重连次数，请稍后重试');
        setLoading(false);
        message.error('连接失败，请检查网络后重试');
        cleanupSSEConnection();
      }
    });

    client.addEventListener('stateChange', (data) => {
      setConnectionState(data.data.newState);
    });

    // 设置连接超时
    connectionTimeoutRef.current = setTimeout(() => {
      if (client.getConnectionState() === SSEConnectionState.CONNECTING) {
        console.warn('SSE连接超时');
        setConnectionError('连接超时');
        client.disconnect();
        
        // 检查是否需要重连
        if (currentAttempt < MAX_RECONNECT_ATTEMPTS) {
          const nextAttempt = currentAttempt + 1;
          setReconnectAttempts(nextAttempt);
          setConnectionError(`连接超时，正在尝试第 ${nextAttempt} 次重连...`);
          
          // console.log(`连接超时，准备第 ${nextAttempt} 次重连 (最大 ${MAX_RECONNECT_ATTEMPTS} 次)`);
          
          setTimeout(() => {
            createSSEConnection(question, sessionId, nextAttempt);
          }, 2000);
        } else {
          console.log(`连接超时，已达到最大重连次数 ${MAX_RECONNECT_ATTEMPTS}，停止重连`);
          setConnectionError('连接超时，已达到最大重连次数');
          setLoading(false);
          message.error('连接超时，请稍后重试');
          cleanupSSEConnection();
        }
      }
    }, CONNECTION_TIMEOUT);

    setSseClient(client);
    
    // 开始连接
    client.connect();
  };



  // 更新会话消息
  useEffect(() => {
    if (currentSessionId && messages.length > 1) {
      updateCurrentSession(messages);
    }
  }, [messages, currentSessionId, updateCurrentSession]);

  // 清理资源
  useEffect(() => {
    return () => {
      cleanupSSEConnection();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (messageScrollTimeoutRef.current) {
        clearTimeout(messageScrollTimeoutRef.current);
      }
    };
  }, []);

  // 聊天记录滚动事件处理
  const handleScroll = () => {
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  // 消息区域滚动事件处理
  const handleMessageScroll = () => {
    setIsMessageScrolling(true);
    if (messageScrollTimeoutRef.current) {
      clearTimeout(messageScrollTimeoutRef.current);
    }
    messageScrollTimeoutRef.current = setTimeout(() => {
      setIsMessageScrolling(false);
    }, 1000);
  };

  const handleReferenceScroll = () => {
    setIsReferenceScrolling(true);
    if (referenceScrollTimeoutRef.current) {
      clearTimeout(referenceScrollTimeoutRef.current);
    }
    referenceScrollTimeoutRef.current = setTimeout(() => {
      setIsReferenceScrolling(false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAiMessage]);

  // 处理消息点击事件
  const handleMessageClick = (msgId: string) => {
    setSelectedMsgId(msgId);
    console.log('选中消息ID:', msgId);
  };

  // 发送消息
  const handleStop = () => {
    cleanupSSEConnection();
    setLoading(false);
    setCurrentAiMessage('');
    message.info('已停止获取');
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    // 获取参考文档（仅在选择了知识库时）
    let references: ReferenceDocument[] = [];
    if (selectedKnowledge !== 'none') {
      try {
        references = await fetchReferenceDocuments(inputValue);
        setReferenceDocuments(references);
        if (references.length > 0) {
          setShowReferences(true);
        }
      } catch (error) {
        console.error('获取参考文档失败:', error);
      }
    } else {
      // 如果选择"无"知识库，清空参考文档
      setReferenceDocuments([]);
      setShowReferences(false);
    }

    const userMessage: Message = {
      id: Date.now(),
      msg_id: generateMsgId(),
      content: formatUserInput(inputValue),
      isUser: true,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const question = inputValue;
    setInputValue('');
    setLoading(true);
    setReconnectAttempts(0);
    setConnectionError(null);

    // 创建SSE连接并发送消息
    createSSEConnection(question, currentSessionId, 0); // 第一次连接，传递0作为尝试次数
    
    // 清除选中的消息ID
    setSelectedMsgId(null);
  };



  // 处理用户输入文本，针对Tauri环境优化换行处理
  const formatUserInput = (text: string) => {
    // 移除首尾空白字符
    const trimmedText = text.trim();
    
    // 如果文本为空，直接返回
    if (!trimmedText) return trimmedText;
    
    // 处理连续的换行符，避免产生过多空行
    let processedText = trimmedText
      // 将多个连续换行符替换为最多两个换行符
      .replace(/\n{3,}/g, '\n\n')
      // 移除行首行尾的空格
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n');
    
    // 检测是否在Tauri环境中
    const isTauri = typeof window !== 'undefined' && window.__TAURI__;
    
    if (isTauri) {
      // Tauri环境：使用HTML换行标签，避免Markdown换行问题
      processedText = processedText.replace(/\n/g, '<br/>');
    } else {
      // Web环境：使用Markdown换行格式
      processedText = processedText.replace(/\n/g, '  \n');
    }
    
    return processedText;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理文件上传变化
  const handleFilesChange = (files: UploadedFile[]) => {
    setCurrentUploadedFiles(files);
  };

  // 处理文件上传完成
  const handleUploadComplete = (files: UploadedFile[]) => {
    console.log('文件上传完成:', files);
    // 这里可以添加上传完成后的处理逻辑
  };

  /**
   * 处理知识库选择变化
   */
  const handleKnowledgeChange = (knowledgeId: string) => {
    setSelectedKnowledge(knowledgeId);
    console.log('选择的知识库:', knowledgeId);
  };

  /**
   * 处理高级设置变化
   */
  const handleAdvancedSettingsChange = (field: keyof AdvancedSettings, value: number) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 模拟获取参考文档
   */
  const fetchReferenceDocuments = async (query: string): Promise<ReferenceDocument[]> => {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockReferences: ReferenceDocument[] = [
      {
        id: '1',
        title: '相关文档片段 1',
        content: `这是与查询"${query}"相关的文档内容。包含了详细的技术说明和实现方案。`,
        similarity: 0.95,
        source: '技术文档.pdf',
        url: '/docs/tech-doc.pdf'
      },
      {
        id: '2',
        title: '相关文档片段 2',
        content: `另一个相关的文档片段，提供了补充信息和最佳实践建议。`,
        similarity: 0.87,
        source: '最佳实践.md',
        url: '/docs/best-practices.md'
      },
      {
        id: '3',
        title: '相关文档片段 3',
        content: `第三个相关文档，包含了具体的代码示例和配置说明。`,
        similarity: 0.82,
        source: '配置指南.txt',
        url: '/docs/config-guide.txt'
      }
    ];

    return mockReferences.filter(ref => ref.similarity >= advancedSettings.score)
                         .slice(0, advancedSettings.topK);
  };

  /**
   * 复制文档内容到剪贴板
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败');
    }
  };



  /**
   * 朗读AI回复内容
   */
  const readAloudMessage = (msgId: string, content: string) => {
    // 如果正在朗读同一条消息，则停止朗读
    if (isReading && currentReadingMsgId === msgId) {
      stopReading();
      return;
    }

    // 如果正在朗读其他消息，先停止
    if (isReading) {
      stopReading();
    }

    try {
      // 检查浏览器是否支持语音合成
      if (!('speechSynthesis' in window)) {
        message.error('您的浏览器不支持语音朗读功能');
        return;
      }

      // 处理文本内容，移除Markdown语法
      const textToRead = content
        .replace(/```[\s\S]*?```/g, '[代码块]') // 替换代码块
        .replace(/`([^`]+)`/g, '$1') // 移除行内代码标记
        .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
        .replace(/#{1,6}\s+/g, '') // 移除标题标记
        .replace(/^\s*[-*+]\s+/gm, '• ') // 替换列表标记为点号
        .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
        .replace(/\n{2,}/g, '。 ') // 将换行替换为句号和空格
        .replace(/\s+/g, ' ') // 合并多余空格
        .trim();

      if (!textToRead) {
        message.warning('没有可朗读的内容');
        return;
      }

      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      // 设置语音参数
      utterance.lang = 'zh-CN'; // 中文
      utterance.rate = 0.9; // 语速
      utterance.pitch = 1; // 音调
      utterance.volume = 1; // 音量

      // 设置事件监听器
      utterance.onstart = () => {
        setIsReading(true);
        setCurrentReadingMsgId(msgId);
        message.success('开始朗读');
      };

      utterance.onend = () => {
        setIsReading(false);
        setCurrentReadingMsgId(null);
        speechSynthesisRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('朗读出错:', event.error);
        setIsReading(false);
        setCurrentReadingMsgId(null);
        speechSynthesisRef.current = null;
        message.error('朗读失败');
      };

      // 保存引用并开始朗读
      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('朗读功能出错:', error);
      message.error('朗读功能出错');
    }
  };

  /**
   * 停止朗读
   */
  const stopReading = () => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsReading(false);
      setCurrentReadingMsgId(null);
      speechSynthesisRef.current = null;
    } catch (error) {
      console.error('停止朗读出错:', error);
    }
  };

  // 组件卸载时清理朗读
  useEffect(() => {
    return () => {
      if (isReading) {
        stopReading();
      }
    };
  }, []);

  // 渲染连接状态指示器
  const renderConnectionStatus = () => {
    if (!loading && connectionState === SSEConnectionState.DISCONNECTED) {
      return null;
    }

    let statusText = '';
    let statusColor = '';
    
    switch (connectionState) {
      case SSEConnectionState.CONNECTING:
        statusText = '正在连接...';
        statusColor = '#1890ff';
        break;
      case SSEConnectionState.CONNECTED:
        statusText = '已连接';
        statusColor = '#52c41a';
        break;
      case SSEConnectionState.RECONNECTING:
        statusText = `重连中... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`;
        statusColor = '#faad14';
        break;
      case SSEConnectionState.ERROR:
        statusText = '连接错误';
        statusColor = '#ff4d4f';
        break;
      default:
        return null;
    }

    return (
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#f0f0f0',
        borderRadius: '6px',
        marginBottom: '12px',
        fontSize: '12px',
        color: statusColor,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          animation: connectionState === SSEConnectionState.CONNECTING || 
                    connectionState === SSEConnectionState.RECONNECTING ? 
                    'pulse 1.5s infinite' : 'none'
        }} />
        {statusText}
      </div>
    );
  };

  return (
    <div style={{
      height: '85vh',
      display: 'flex',
      backgroundColor: '#ffffff',
      position: 'relative'
    }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
      
      {/* 左侧聊天记录面板 - 桌面端 */}
      {!isMobile && (
        <div style={{
          width: isChatHistoryCollapsed ? '50px' : (isTablet ? '250px' : '300px'),
          backgroundColor: '#fff',
          borderRight: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          position: 'relative'
        }}>
        {/* 隐藏伸缩按钮 */}
        <Button
          type="text"
          icon={isChatHistoryCollapsed ? <RightOutlined /> : <LeftOutlined />}
          onClick={() => setIsChatHistoryCollapsed(!isChatHistoryCollapsed)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '8px',
            zIndex: 10,
            width: '24px',
            height: '24px',
            minWidth: '24px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
          title={isChatHistoryCollapsed ? '展开聊天记录' : '收起聊天记录'}
        />
        
        {!isChatHistoryCollapsed && (
          <>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e8e8e8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingRight: '40px' // 为隐藏按钮留出空间
            }}>
              <Title level={4} style={{ margin: 0 }}>
                聊天记录
              </Title>
              <Button 
                icon={<PlusOutlined />} 
                onClick={createNewSession}
                type="primary"
                size="small"
              >
                新对话
              </Button>
            </div>
          </>
        )}
        
        {!isChatHistoryCollapsed && (
          <div 
             ref={scrollContainerRef}
             style={{ 
               flex: 1, 
               overflow: 'auto',
               scrollbarWidth: 'thin',
               scrollbarColor: isScrolling ? '#d4d4d4 transparent' : 'transparent transparent'
             }}
             className={`custom-scrollbar ${isScrolling ? 'scrolling' : ''}`}
             onScroll={handleScroll}
           >
          <List
            dataSource={chatSessions}
            renderItem={(session) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: session.id === currentSessionId ? '#e6f7ff' : 'transparent',
                  borderLeft: session.id === currentSessionId ? '3px solid #1890ff' : '3px solid transparent'
                }}
                onClick={() => loadSession(session.id)}
                actions={[
                  <Popconfirm
                    title="确认删除该会话？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={(e?: any) => {
                      e?.stopPropagation?.();
                      deleteSession(session.id);
                    }}
                    onCancel={(e?: any) => e?.stopPropagation?.()}
                  >
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      disabled={chatSessions.length === 1}
                      style={{ opacity: 0.6 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ 
                      
                      fontWeight: session.id === currentSessionId ? 600 : 400,
                      color: session.id === currentSessionId ? '#1890ff' : '#333'
                    }}>
                      {session.title}
                    </div>
                  }
                  description={
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      <div>{session.messages.length} 条消息</div>
                      <div>{session.updatedAt.toLocaleDateString()}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无聊天记录' }}
          />
          </div>
        )}
        </div>
      )}
      
      {/* 移动端抽屉菜单 */}
      <Drawer
        title="聊天记录"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <Button 
            icon={<PlusOutlined />} 
            onClick={() => {
              createNewSession();
              setDrawerVisible(false);
            }}
            type="primary"
            size="small"
            block
          >
            新对话
          </Button>
        </div>
        
        <div 
          style={{ 
            flex: 1, 
            overflow: 'auto',
            height: 'calc(100vh - 120px)'
          }}
          className="custom-scrollbar"
        >
          <List
            dataSource={chatSessions}
            renderItem={(session) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: session.id === currentSessionId ? '#e6f7ff' : 'transparent',
                  borderLeft: session.id === currentSessionId ? '3px solid #1890ff' : '3px solid transparent'
                }}
                onClick={() => {
                  loadSession(session.id);
                  setDrawerVisible(false);
                }}
                actions={[
                  <Popconfirm
                    title="确认删除该会话？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={(e?: any) => {
                      e?.stopPropagation?.();
                      deleteSession(session.id);
                    }}
                    onCancel={(e?: any) => e?.stopPropagation?.()}
                  >
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      disabled={chatSessions.length === 1}
                      style={{ opacity: 0.6 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ 
                      fontSize: isMobile ? '12px' : '13px', 
                      fontWeight: session.id === currentSessionId ? 600 : 400,
                      color: session.id === currentSessionId ? '#1890ff' : '#333'
                    }}>
                      {session.title}
                    </div>
                  }
                  description={
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      <div>{session.messages.length} 条消息</div>
                      <div>{session.updatedAt.toLocaleDateString()}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无聊天记录' }}
          />
        </div>
      </Drawer>

      {/* 主内容区域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '16px',
        padding: isMobile ? '12px' : isTablet ? '16px' : '20px'
      }}>
        {/* 聊天区域 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
        <div style={{ 
          marginBottom: isMobile ? '16px' : '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {isMobile && (
            <Button
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              type="text"
              size="large"
              style={{ padding: '4px 8px' }}
            />
          )}
          
          {isMobile && (
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => setSessionInfoDrawerVisible(true)}
              type="text"
              size="large"
              style={{ padding: '4px 8px' }}
            />
          )}
        </div>





        {/* 连接错误提示 */}
        {connectionError && (
          <Alert
            message={connectionError}
            type={reconnectAttempts >= MAX_RECONNECT_ATTEMPTS ? 'error' : 'warning'}
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: '16px' }}
            showIcon
            closable
            onClose={() => setConnectionError(null)}
          />
        )}
      
      {/* 消息列表 */}
      <Card 
        style={{ 
          flex: 1, 
          marginBottom: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
        bodyStyle={{ 
          padding: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
      >
        <div 
          ref={messageScrollContainerRef}
          style={{ 
            flex: 1,
            padding: isMobile ? '12px' : '16px',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: isMessageScrolling ? '#d4d4d4 transparent' : 'transparent transparent',
            minHeight: 0,
            maxHeight: '100%'
          }}
          className={`custom-scrollbar ${isMessageScrolling ? 'scrolling' : ''}`}
          onScroll={handleMessageScroll}
        >
          {/* 连接状态指示器 */}
          {renderConnectionStatus()}
          
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isMobile={isMobile}
              isReading={isReading}
              currentReadingMsgId={currentReadingMsgId}
              onMessageClick={handleMessageClick}
              onCopyMessage={defaultCopyAiMessage}
              onReadMessage={readAloudMessage}
            />
          ))}
          
          {/* 实时显示AI回复 */}
          {loading && currentAiMessage && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: isMobile ? '6px' : '8px',
              
              }}>
                <Avatar 
                  icon={<RobotOutlined />} 
                  style={{ backgroundColor: '#1890ff' }}
                />
                <div style={{
                  maxWidth: isMobile ? '85%' : '70%',
                  padding: isMobile ? '10px 12px' : '12px 16px',
                  borderRadius: isMobile ? '8px' : '12px',
                  backgroundColor: '#ffffff',
                  wordBreak: 'break-word',
                  overflowX: 'auto',
                  fontSize: isMobile ? '12px' : '13px',
                  border: '2px solidrgb(6, 6, 7)',
                  position: 'relative'
                }}>
                  <MarkdownRenderer
                    content={currentAiMessage}
                    fontSize={isMobile ? 12 : 13}
                    isUser={false}
                  />
                  <div style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '16px',
                    backgroundColor: '#1890ff',
                    marginLeft: '2px',
                    animation: 'blink 1s infinite'
                  }} />
                </div>
              </div>
            </div>
          )}
          
          {loading && !currentAiMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
              <Avatar 
                icon={<RobotOutlined />} 
                style={{ backgroundColor: '#1890ff' }}
              />
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
            
                color: '#999'
              }}>
                正在连接AI服务...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* 输入区域 */}
      <div style={{ 
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: '#fafafa'
      }}>
        {/* 文件上传组件 */}
        <FileUpload
          onFilesChange={handleFilesChange}
          onUploadComplete={handleUploadComplete}
          disabled={loading}
          style={{ marginBottom: currentUploadedFiles.length > 0 ? '8px' : '0' }}
        />
        
        {/* 输入框 */}
        <TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="输入你的消息... (按 Enter 发送，Shift+Enter 换行)"
          autoSize={{ minRows: 2, maxRows: 4 }}
          className="custom-scrollbar"
          style={{ 
            fontSize: isMobile ? '14px' : '16px',
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
              onChange={handleKnowledgeChange}
              style={{ width: '120px' }}
              size="small"
            />

            {/* 联网按钮 */}
            <Tooltip title={isNetworkEnabled ? "关闭联网" : "开启联网"}>
              <Button
                type="text"
                icon={<GlobalOutlined />}
                onClick={() => setIsNetworkEnabled(!isNetworkEnabled)}
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
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  color: showAdvancedSettings ? '#1890ff' : '#666',
                  fontSize: '16px'
                }}
              />
            </Tooltip>
          </div>
          
          {/* 发送/停止按钮 */}
          <div>
            {loading ? (
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={handleStop}
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
                onClick={handleSend}
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
                      onChange={(value) => handleAdvancedSettingsChange('topK', value)}
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
                      onChange={(value) => handleAdvancedSettingsChange('score', value)}
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

        </div>

        {/* 右侧会话信息面板 - 桌面端和平板端 */}
        {!isMobile && (
          <div style={{
            width: isSessionInfoCollapsed ? '50px' : (isTablet ? '240px' : '280px'),
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <Card 
              size="small" 
              title="会话信息"
              extra={
                <Button
                  type="text"
                  icon={<FileTextOutlined />}
                  onClick={() => setShowReferences(!showReferences)}
                  size="small"
                />
              }
            >
              <div style={{ fontSize: isTablet ? '11px' : '12px', color: '#666' }}>
                <div>会话ID: {currentSessionId || '未开始'}</div>
                <div>消息数: {messages.length}</div>
                <div>知识库: {selectedKnowledge === 'none' ? '无' : selectedKnowledge}</div>
                <div>联网: {isNetworkEnabled ? '已开启' : '已关闭'}</div>
                <div>参考文档: {referenceDocuments.length} 条</div>
              </div>
            </Card>

            {/* 参考文档面板 - 右侧版本 */}
            {showReferences && (
              <Card 
                size="small" 
                title="参考文档" 
                extra={
                  <Button
                    type="text"
                    size="small"
                    onClick={() => setShowReferences(false)}
                  >
                    收起
                  </Button>
                }
              >
                <div 
                  style={{ 
                    maxHeight: isTablet ? '300px' : '400px', 
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: isReferenceScrolling ? '#d4d4d4 transparent' : 'transparent transparent'
                  }}
                  className={`custom-scrollbar ${isReferenceScrolling ? 'scrolling' : ''}`}
                  onScroll={handleReferenceScroll}
                >
                  {referenceDocuments.length > 0 ? (
                    referenceDocuments.map((doc, index) => (
                      <Card
                        key={doc.id}
                        size="small"
                        style={{ marginBottom: '8px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: isTablet ? '11px' : '12px', marginBottom: '2px' }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: isTablet ? '10px' : '11px', color: '#666', marginBottom: '4px' }}>
                              <Tag color="blue" >相似度: {(doc.similarity * 100).toFixed(1)}%</Tag>
                              <Tag color="green" >来源: {doc.source}</Tag>
                            </div>
                          </div>
                          <Tooltip title="复制内容">
                            <Button
                              type="text"
                              icon={<CopyOutlined />}
                              size="small"
                              onClick={() => copyToClipboard(doc.content)}
                            />
                          </Tooltip>
                        </div>
                        <div style={{ fontSize: isTablet ? '10px' : '11px', color: '#333', lineHeight: '1.4' }}>
                          <MDEditor.Markdown
                            source={doc.content.length > (isTablet ? 60 : 80) ? doc.content.substring(0, isTablet ? 60 : 80) + '...' : doc.content}
                            style={{ backgroundColor: 'transparent', fontSize: isTablet ? '10px' : '11px' }}
                          />
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Empty 
                      description="暂无参考文档"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ margin: '20px 0' }}
                    />
                  )}
                </div>
              </Card>
            )}
            
          </div>
        )}
      </div>

      {/* 移动端会话信息抽屉 */}
      <Drawer
        title="会话信息"
        placement="right"
        onClose={() => setSessionInfoDrawerVisible(false)}
        open={sessionInfoDrawerVisible}
        width={300}
        extra={
          <Button
            type="text"
            icon={<FileTextOutlined />}
            onClick={() => setShowReferences(!showReferences)}
            size="small"
          />
          
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
            <div>会话ID: {currentSessionId || '未开始'}</div>
            <div>消息数: {messages.length}</div>
            <div>知识库: {selectedKnowledge === 'none' ? '无' : selectedKnowledge}</div>
            <div>联网: {isNetworkEnabled ? '已开启' : '已关闭'}</div>
            <div>参考文档: {referenceDocuments.length} 条</div>
          </div>
        </div>

        {/* 参考文档面板 - 移动端版本 */}
        {showReferences && (
          <div>
            <Divider style={{ margin: '12px 0' }}>参考文档</Divider>
            <div 
              style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: isReferenceScrolling ? '#d4d4d4 transparent' : 'transparent transparent'
              }}
              className={`custom-scrollbar ${isReferenceScrolling ? 'scrolling' : ''}`}
              onScroll={handleReferenceScroll}
            >
              {referenceDocuments.length > 0 ? (
                referenceDocuments.map((doc, index) => (
                  <Card
                    key={doc.id}
                    size="small"
                    style={{ marginBottom: '8px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                          <Tag color="blue">相似度: {(doc.similarity * 100).toFixed(1)}%</Tag>
                          <Tag color="green">来源: {doc.source}</Tag>
                        </div>
                      </div>
                      <Tooltip title="复制内容">
                        <Button
                          type="text"
                          icon={<CopyOutlined />}
                          size="small"
                          onClick={() => copyToClipboard(doc.content)}
                        />
                      </Tooltip>
                    </div>
                    <div style={{ fontSize: '10px', color: '#333', lineHeight: '1.4' }}>
                      <MDEditor.Markdown
                        source={doc.content.length > 60 ? doc.content.substring(0, 60) + '...' : doc.content}
                        style={{ backgroundColor: 'transparent', fontSize: '10px' }}
                      />
                    </div>
                  </Card>
                ))
              ) : (
                <Empty 
                  description="暂无参考文档"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '20px 0' }}
                />
              )}
            </div>
          </div>
        )}
      </Drawer>
      
      
    </div>
  );
};

export default AIChat;