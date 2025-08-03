import React, { useState, useRef, useEffect } from 'react';
import { Typography, Input, Button, Card, Avatar, Space, Divider, List, message, Drawer, Alert, Popconfirm } from 'antd';
import { SendOutlined, StopOutlined, RobotOutlined, UserOutlined, DeleteOutlined, PlusOutlined, MenuOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import './scrollbar.css';
import { SSEClient, SSEConnectionState } from '../../utils/sse/sse';
import ReactMarkdown from 'react-markdown';


const { Title } = Typography;
const { TextArea } = Input;

interface Message {
  id: number;
  msg_id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      msg_id: `msg_${Date.now()}_${Math.random().toString(36)}`,
      content: '你好！我是AI助手，有什么可以帮助你的吗？',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMessageScrolling, setIsMessageScrolling] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  
  // SSE 连接相关状态
  const [sseClient, setSseClient] = useState<SSEClient | null>(null);
  const [connectionState, setConnectionState] = useState<SSEConnectionState>(SSEConnectionState.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState<string>('');
  
  // 响应式断点
  const { isMobile, isTablet } = useBreakpoints();
 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageScrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const messageScrollTimeoutRef = useRef<number | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);

  // 常量配置
  const MAX_RECONNECT_ATTEMPTS = 3;
  const CONNECTION_TIMEOUT = 30000; // 30秒
  const STORAGE_KEY = 'ai_chat_sessions';

  // 生成唯一的消息ID
  const generateMsgId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36)}`;
  };

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
    const client = new SSEClient('/chat', {
      method: 'POST',
      body: JSON.stringify({
        id: sessionId,
        question: question,
        knowledge_name: 'default',
        top_k: 5,
        score: 0.2
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

    client.addEventListener('message', (data) => {
      console.log('收到SSE消息:', data.data);
      
      if (data.data === '[DONE]') {
        // 流结束，完成AI消息
        setCurrentAiMessage(prev => {
          if (prev.trim()) {
            const aiMessage: Message = {
              id: Date.now(),
              msg_id: generateMsgId(),
              content: prev.trim(),
              isUser: false,
              timestamp: new Date(),
            };
            
            setMessages(prevMessages => [...prevMessages, aiMessage]);
          }
          return '';
        });
        
        // 清理连接
        cleanupSSEConnection();
        setLoading(false);
      } else {
        // 累积AI回复内容 - 使用 += 操作符进行增量累积
        setCurrentAiMessage(prev => {
          const newContent = prev + data.data;
          console.log('累积AI消息:', newContent);
          return newContent;
        });
      }
    });

    client.addEventListener('error', (data) => {
      console.error('SSE连接错误:', data.data);
      setConnectionState(SSEConnectionState.ERROR);
      
      const errorMessage = data.data?.message || '连接错误';
      
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
          
          console.log(`连接超时，准备第 ${nextAttempt} 次重连 (最大 ${MAX_RECONNECT_ATTEMPTS} 次)`);
          
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

  // 加载聊天记录
  const loadChatSessions = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const sessions: ChatSession[] = JSON.parse(stored).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            msg_id: msg.msg_id || generateMsgId(),
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatSessions(sessions);
        // 如果存在历史会话，默认加载最新一条
        if (sessions.length > 0) {
          setCurrentSessionId(sessions[0].id);
          setMessages(sessions[0].messages);
          return;
        }
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
    // 若没有任何历史会话，则创建新会话
    createNewSession();
  };

  // 保存聊天记录
  const saveChatSessions = (sessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('保存聊天记录失败:', error);
      message.error('保存聊天记录失败');
    }
  };

  // 创建新会话
  const createNewSession = () => {
    const newSessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: newSessionId,
      title: '新对话',
      messages: [
        {
          id: 1,
          msg_id: generateMsgId(),
          content: '你好！我是AI助手，有什么可以帮助你的吗？',
          isUser: false,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);
    setCurrentSessionId(newSessionId);
    setMessages(newSession.messages);
    
    // 清理连接状态
    cleanupSSEConnection();
    setReconnectAttempts(0);
    setConnectionError(null);
  };

  // 加载指定会话
  const loadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      
      // 清理连接状态
      cleanupSSEConnection();
      setReconnectAttempts(0);
      setConnectionError(null);
    }
  };

  // 删除会话
  const deleteSession = (sessionId: string) => {
    const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);
    
    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        loadSession(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // 更新当前会话
  const updateCurrentSession = (newMessages: Message[]) => {
    if (!currentSessionId) return;
    
    const updatedSessions = chatSessions.map(session => {
      if (session.id === currentSessionId) {
        const firstUserMessage = newMessages.find(msg => msg.isUser);
        const title = firstUserMessage ? 
          firstUserMessage.content.slice(0, 20) + (firstUserMessage.content.length > 20 ? '...' : '') : 
          '新对话';
        
        return {
          ...session,
          title,
          messages: newMessages,
          updatedAt: new Date(),
        };
      }
      return session;
    });
    
    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);
  };

  // 初始化
  useEffect(() => {
    loadChatSessions();
  }, []);




  // 更新会话消息
  useEffect(() => {
    if (currentSessionId && messages.length > 1) {
      updateCurrentSession(messages);
    }
  }, [messages, currentSessionId]);

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

    const userMessage: Message = {
      id: Date.now(),
      msg_id: generateMsgId(),
      content: inputValue,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
          width: isTablet ? '250px' : '300px',
          backgroundColor: '#fff',
          borderRight: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column'
        }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
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
                      fontSize: '14px', 
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
                      fontSize: '14px', 
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

      {/* 聊天区域 */}
      <div style={{
        flex: 1,
        padding: isMobile ? '12px' : isTablet ? '16px' : '20px',
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
          <Title level={isMobile ? 3 : 2} style={{ margin: 0, flex: 1 }}>
            AI 聊天助手
          </Title>
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
            <div key={message.id} style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                {!message.isUser && (
                  <Avatar 
                    icon={<RobotOutlined />} 
                    style={{ backgroundColor: '#1890ff' }}
                  />
                )}
                <div 
                  onClick={() => handleMessageClick(message.msg_id)}
                  style={{
                    maxWidth: isMobile ? '85%' : '70%',
                    padding: isMobile ? '10px 12px' : '12px 16px',
                    borderRadius: isMobile ? '8px' : '12px',
                    backgroundColor: selectedMsgId === message.msg_id 
                      ? (message.isUser ? '#0050b3' : '#e6f7ff') 
                      : (message.isUser ? '#1890ff' : '#ffffff'),
                    color: message.isUser ? 'white' : 'black',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    fontSize: isMobile ? '14px' : '16px',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ReactMarkdown
                     
                      components={{
                        h1: ({node, ...props}) => <h1 style={{fontSize: isMobile ? '16px' : '20px', fontWeight: 600, margin: '6px 0'}} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{fontSize: isMobile ? '15px' : '18px', fontWeight: 600, margin: '6px 0'}} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{fontSize: isMobile ? '14px' : '17px', fontWeight: 600, margin: '6px 0'}} {...props} />,
                        p:  ({node, ...props}) => <p style={{fontSize: isMobile ? '13px' : '15px', margin: '4px 0'}} {...props} />,
                        ul: ({node, ...props}) => <ul style={{paddingLeft: isMobile ? '20px' : '24px', margin: '4px 0'}} {...props} />,
                        ol: ({node, ...props}) => <ol style={{paddingLeft: isMobile ? '20px' : '24px', margin: '4px 0'}} {...props} />,
                        li: ({node, ...props}) => <li style={{marginBottom: '4px'}} {...props} />,
                        blockquote: ({node, ...props}) => <blockquote style={{borderLeft:'4px solid #d9d9d9', padding:'4px 8px', color:'#555', backgroundColor:'#fafafa', margin:'6px 0'}} {...props} />,
                        a: ({node, ...props}) => <a style={{color:'#1890ff'}} target="_blank" rel="noopener noreferrer" {...props} />,
                        code: ({node, inline, className, children, ...props}) => inline ? (
                          <code style={{backgroundColor:'#ffffff', padding:'2px 4px', borderRadius:'4px', fontFamily:'monospace', fontSize: isMobile ? '12px':'14px'}} {...props}>{children}</code>
                        ) : (
                          <pre style={{backgroundColor:'#ffffff', padding: isMobile ? '8px':'12px', borderRadius:'6px', overflowX:'auto', maxWidth:'100%'}} {...props}>
                            <code style={{fontFamily:'monospace', whiteSpace:'pre', wordWrap:'break-word'}}>{children}</code>
                          </pre>
                        )
                      }}
                    >{message.content}</ReactMarkdown>

                </div>
                {message.isUser && (
                  <Avatar 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: '#52c41a' }}
                  />
                )}
              </div>
              <div style={{
                textAlign: message.isUser ? 'right' : 'left',
                fontSize: '12px',
                color: '#999',
                marginTop: '4px',
                marginLeft: message.isUser ? '0' : (isMobile ? '40px' : '48px'),
                marginRight: message.isUser ? (isMobile ? '40px' : '48px') : '0'
              }}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {/* 实时显示AI回复 */}
          {loading && currentAiMessage && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: '8px'
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
                  color: 'black',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  fontSize: isMobile ? '14px' : '16px',
                  border: '2px solid #1890ff',
                  position: 'relative'
                }}>
                  <ReactMarkdown
               
                  components={{
                    h1: ({node, ...props}) => <h1 style={{fontSize: isMobile ? '16px' : '20px', fontWeight: 600, margin: '6px 0'}} {...props} />, 
                    h2: ({node, ...props}) => <h2 style={{fontSize: isMobile ? '15px' : '18px', fontWeight: 600, margin: '6px 0'}} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{fontSize: isMobile ? '14px' : '17px', fontWeight: 600, margin: '6px 0'}} {...props} />,
                    p:  ({node, ...props}) => <p style={{fontSize: isMobile ? '13px' : '15px', margin: '4px 0'}} {...props} />,
                    ul: ({node, ...props}) => <ul style={{paddingLeft: isMobile ? '20px' : '24px', margin: '4px 0'}} {...props} />,
                    ol: ({node, ...props}) => <ol style={{paddingLeft: isMobile ? '20px' : '24px', margin: '4px 0'}} {...props} />,
                    li: ({node, ...props}) => <li style={{marginBottom: '4px'}} {...props} />,
                    blockquote: ({node, ...props}) => <blockquote style={{borderLeft:'4px solid #d9d9d9', padding:'4px 8px', color:'#555', backgroundColor:'#fafafa', margin:'6px 0'}} {...props} />,
                    a: ({node, ...props}) => <a style={{color:'#1890ff'}} target="_blank" rel="noopener noreferrer" {...props} />,
                    code: ({node, inline, className, children, ...props}) => inline ? (
                      <code style={{backgroundColor:'#f5f5f5', padding:'2px 4px', borderRadius:'4px', fontFamily:'monospace', fontSize: isMobile ? '12px':'14px'}} {...props}>{children}</code>
                    ) : (
                      <pre style={{backgroundColor:'#f5f5f5', padding: isMobile ? '8px':'12px', borderRadius:'6px', overflowX:'auto', maxWidth:'100%'}} {...props}>
                        <code style={{fontFamily:'monospace', whiteSpace:'pre', wordWrap:'break-word'}}>{children}</code>
                      </pre>
                    )
                  }}
                >{currentAiMessage}</ReactMarkdown>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar 
                icon={<RobotOutlined />} 
                style={{ backgroundColor: '#1890ff' }}
              />
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
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
        display: 'flex', 
        gap: isMobile ? '6px' : '8px', 
        alignItems: 'flex-end',
        padding: isMobile ? '8px 0 0' : '0'
      }}>
        <TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入你的消息... (按 Enter 发送，Shift+Enter 换行)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ 
            flex: 1,
            fontSize: isMobile ? '14px' : '16px'
          }}
          disabled={loading}
        />
        {loading ? (
          <Button
            type="default"
            danger
            icon={<StopOutlined />}
            onClick={handleStop}
            style={{ 
              height: 'auto', 
              minHeight: isMobile ? '36px' : '32px',
              fontSize: isMobile ? '14px' : '16px'
            }}
          >
            停止
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim()}
            style={{ 
              height: 'auto', 
              minHeight: isMobile ? '36px' : '32px',
              fontSize: isMobile ? '14px' : '16px'
            }}
          >
            发送
          </Button>
        )}
      </div>

      </div>
      
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default AIChat;