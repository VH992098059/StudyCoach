import React, { useState, useRef, useEffect } from 'react';
import { Typography, Button, Card, Avatar, Space, Divider, List, message, Drawer, Alert, Popconfirm, Row, Col, Collapse, Form, InputNumber, Slider, Tag, Empty, Tooltip } from 'antd';
import { SendOutlined, StopOutlined, RobotOutlined, UserOutlined, DeleteOutlined, PlusOutlined, MenuOutlined, ExclamationCircleOutlined, SettingOutlined, FileTextOutlined, CopyOutlined, GlobalOutlined, InfoCircleOutlined, SoundOutlined, PauseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { useChatSessions } from '../../hooks/useChatSessions';
import './scrollbar.scss';
import { SSEClient, SSEConnectionState } from '../../utils/sse/sse';
import KnowledgeSelector, { type KnowledgeSelectorRef } from '../../components/KnowledgeSelector';
import type { Message, UploadedFile } from '../../types/chat';
import { MessageItem, MarkdownRenderer, defaultCopyAiMessage, SessionInfoPanel, SessionInfoDrawer } from './components';
import { voiceService, type VoiceState } from '../../services/voice';
import ConnectionStatus from './components/ConnectionStatus';
import InputArea from './components/InputArea';

const { Title } = Typography;
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
  
  // 朗读功能相关状态 - 使用语音服务
  const [voiceState, setVoiceState] = useState<VoiceState>({ 
    isReading: false, 
    currentReadingMsgId: null,
    isLoading: false,
    loadingMsgId: null
  });
  
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
    await sendQuestionByText(inputValue);
  };

  // 语音/外部文本统一发送逻辑
  const sendQuestionByText = async (text: string) => {
    if (!text.trim()) return;

    // 获取参考文档（仅在选择了知识库时）
    let references: ReferenceDocument[] = [];
    if (selectedKnowledge !== 'none') {
      try {
        references = await fetchReferenceDocuments(text);
        setReferenceDocuments(references);
        if (references.length > 0) {
          setShowReferences(true);
        }
      } catch (error) {
        console.error('获取参考文档失败:', error);
      }
    } else {
      setReferenceDocuments([]);
      setShowReferences(false);
    }

    const userMessage: Message = {
      id: Date.now(),
      msg_id: generateMsgId(),
      content: formatUserInput(text),
      isUser: true,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);
    setReconnectAttempts(0);
    setConnectionError(null);

    createSSEConnection(text, currentSessionId, 0);
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
   * 切换联网状态
   */
  const handleToggleNetwork = () => {
    setIsNetworkEnabled(prev => !prev);
  };

  /**
   * 切换高级设置面板
   */
  const handleToggleAdvancedSettings = () => {
    setShowAdvancedSettings(prev => !prev);
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
   * 播放音频的辅助函数
   */
 

  /**
   * 朗读AI回复内容 - 使用语音服务
   */
  const readAloudMessage = async (msgId: string, content: string) => {
    await voiceService.readMessage(msgId, content);
  };

  /**
   * 停止朗读 - 使用语音服务
   */
  const stopReading = () => {
    voiceService.stopReading();
  };

  // 语音服务初始化和清理
  useEffect(() => {
    // 设置语音服务回调
    voiceService.setCallbacks({
      onStateChange: (state) => {
        setVoiceState(state);
      },
      onLoadStart: (msgId) => {
        // 可以在这里添加额外的加载开始逻辑
      },
      onCanPlay: () => {
        // 可以在这里添加额外的可播放逻辑
      },
      onEnded: () => {
        // 可以在这里添加额外的播放结束逻辑
      },
      onError: (error) => {
        // 可以在这里添加额外的错误处理逻辑
      },
      onAbort: () => {
        // 可以在这里添加额外的中止逻辑
      }
    });

    // 组件卸载时清理
    return () => {
      voiceService.destroy();
    };
  }, []);

  // 连接状态指示器已抽离为组件

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
          <ConnectionStatus
            loading={loading}
            connectionState={connectionState}
            reconnectAttempts={reconnectAttempts}
            maxReconnectAttempts={MAX_RECONNECT_ATTEMPTS}
          />
          
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isMobile={isMobile}
              isReading={voiceState.isReading}
              currentReadingMsgId={voiceState.currentReadingMsgId}
              isLoading={voiceState.isLoading}
              loadingMsgId={voiceState.loadingMsgId}
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
      <InputArea
        inputValue={inputValue}
        loading={loading}
        selectedKnowledge={selectedKnowledge}
        isNetworkEnabled={isNetworkEnabled}
        showAdvancedSettings={showAdvancedSettings}
        advancedSettings={advancedSettings}
        currentUploadedFiles={currentUploadedFiles}
        knowledgeSelectorRef={knowledgeSelectorRef}
        onVoiceTranscript={(text) => sendQuestionByText(text)}

        onInputChange={setInputValue}
        onKeyPress={handleKeyPress}
        onSend={handleSend}
        onStop={handleStop}
        onToggleNetwork={handleToggleNetwork}
        onToggleAdvancedSettings={handleToggleAdvancedSettings}
        onKnowledgeChange={handleKnowledgeChange}
        onFilesChange={handleFilesChange}
        onUploadComplete={handleUploadComplete}
        onAdvancedSettingsChange={handleAdvancedSettingsChange}
      />

        </div>

        {/* 右侧会话信息面板 - 桌面端和平板端 */}
        {!isMobile && (
          <div
            style={{
              width: isSessionInfoCollapsed ? '50px' : (isTablet ? '240px' : '280px'),
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <SessionInfoPanel
              isTablet={isTablet}
              currentSessionId={currentSessionId}
              messagesCount={messages.length}
              selectedKnowledge={selectedKnowledge}
              isNetworkEnabled={isNetworkEnabled}
              referenceDocuments={referenceDocuments}
              showReferences={showReferences}
              onToggleReferences={() => setShowReferences(!showReferences)}
              isReferenceScrolling={isReferenceScrolling}
              onReferenceScroll={handleReferenceScroll}
              onCopyDocumentContent={copyToClipboard}
            />
          </div>
        )}
      </div>

      {/* 移动端会话信息抽屉 */}
      <SessionInfoDrawer
        open={sessionInfoDrawerVisible}
        onClose={() => setSessionInfoDrawerVisible(false)}
        showReferences={showReferences}
        onToggleReferences={() => setShowReferences(!showReferences)}
        currentSessionId={currentSessionId}
        messagesCount={messages.length}
        selectedKnowledge={selectedKnowledge}
        isNetworkEnabled={isNetworkEnabled}
        referenceDocuments={referenceDocuments}
        isReferenceScrolling={isReferenceScrolling}
        onReferenceScroll={handleReferenceScroll}
        onCopyDocumentContent={copyToClipboard}
      />
      
      
    </div>
  );
};

export default AIChat;