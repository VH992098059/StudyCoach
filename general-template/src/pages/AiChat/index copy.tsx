import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, List, Typography, Spin, message, Skeleton, Tabs, Tag, Empty, Switch, Modal, Drawer } from 'antd';
import { SendOutlined, RobotOutlined, SearchOutlined, BookOutlined, HistoryOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { analyzeLearningRecord, getKnowledgeList, searchKnowledge } from './utils';
import { getAiModelContentStream } from '../../api/ai_model';
import './style.css';
import useWindowHeight from '../../hooks/useWindowHeight';
import InfiniteScroll from 'react-infinite-scroll-component';
import ReactMarkdown from 'react-markdown';
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

/**
 * 消息接口定义
 * @interface Message
 * @property {string} content - 消息内容
 * @property {'user' | 'ai'} type - 消息类型，用户消息或AI消息
 * @property {number} timestamp - 消息发送时间戳
 */
interface Message {
  content: string;
  type: 'user' | 'ai';
  timestamp: number;
}

/**
 * 聊天会话接口定义
 * @interface ChatSession
 * @property {string} id - 会话唯一标识
 * @property {string} title - 会话标题
 * @property {Message[]} messages - 会话消息列表
 * @property {number} createdAt - 会话创建时间戳
 * @property {number} updatedAt - 会话最后更新时间戳
 */
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 知识库条目接口定义
 * @interface KnowledgeItem
 * @property {string} id - 知识条目唯一标识
 * @property {string} title - 知识条目标题
 * @property {string} content - 知识条目内容
 * @property {string} category - 知识条目分类
 * @property {string[]} tags - 知识条目标签列表
 * @property {string} createdAt - 知识条目创建时间
 */
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
}

/**
 * AI学习助手组件
 * @component
 * @description 提供智能对话和知识库查询功能的AI助手组件。
 * 包含以下主要功能：
 * 1. 智能对话：与AI进行实时对话，获取学习建议和答疑
 * 2. 知识库查询：搜索和浏览相关学习知识
 * 3. 学习数据统计：展示用户的学习进度和成果
 * 
 * @returns {JSX.Element} 返回渲染的AI助手组件
 */
const AIAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deepThinking, setDeepThinking] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [learningStats, setLearningStats] = useState({
    wordCount: 0,
    studyTime: 0,
    correctRate: 0,
  });
  
  // 聊天会话相关状态
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 聊天会话管理函数
  const STORAGE_KEY = 'ai_chat_sessions';

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // 从localStorage加载聊天会话
  const loadChatSessions = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const sessions = JSON.parse(saved) as ChatSession[];
        setChatSessions(sessions);
        return sessions;
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
    return [];
  };

  // 保存聊天会话到localStorage
  const saveChatSessions = (sessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('保存聊天记录失败:', error);
    }
  };

  // 创建新的聊天会话
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    saveChatSessions(updatedSessions);
    return newSession;
  };

  // 切换到指定会话
  const switchToSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setHistoryDrawerVisible(false);
    }
  };

  // 更新当前会话的消息
  const updateCurrentSession = (newMessages: Message[]) => {
    if (!currentSessionId) return;
    
    const updatedSessions = chatSessions.map(session => {
      if (session.id === currentSessionId) {
        const updatedSession = {
          ...session,
          messages: newMessages,
          updatedAt: Date.now(),
          title: session.title === '新对话' && newMessages.length > 0 
            ? newMessages[0].content.slice(0, 20) + (newMessages[0].content.length > 20 ? '...' : '')
            : session.title
        };
        return updatedSession;
      }
      return session;
    });
    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);
  };

  // 删除会话
  const deleteSession = (sessionId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个对话记录吗？此操作不可恢复。',
      onOk: () => {
        const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
        setChatSessions(updatedSessions);
        saveChatSessions(updatedSessions);
        
        if (currentSessionId === sessionId) {
          if (updatedSessions.length > 0) {
            switchToSession(updatedSessions[0].id);
          } else {
            setCurrentSessionId(null);
            setMessages([]);
          }
        }
      },
    });
  };

  // 重命名会话
  const renameSession = (sessionId: string, newTitle: string) => {
    const updatedSessions = chatSessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, title: newTitle, updatedAt: Date.now() };
      }
      return session;
    });
    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // 初始化聊天会话
  useEffect(() => {
    const sessions = loadChatSessions();
    if (sessions.length > 0) {
      const latestSession = sessions[0];
      setCurrentSessionId(latestSession.id);
      setMessages(latestSession.messages);
    }
  }, []);

  // 当消息更新时，同步到当前会话
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      updateCurrentSession(messages);
    }
  }, [messages, currentSessionId]);

  useEffect(() => {
    const fetchLearningRecord = async () => {
      try {
        const record = await analyzeLearningRecord('user123');
        setLearningStats({
          wordCount: record.wordCount,
          studyTime: record.studyTime,
          correctRate: record.correctRate * 100,
        });
      } catch (error) {
        console.error('获取学习记录失败:', error);
      }
    };
    fetchLearningRecord();
  }, []);
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {

    } else if (e.key === 'Enter') {
      // 阻止默认行为
      e.preventDefault();
      handleSend();
    }
  }
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // 如果没有当前会话，创建新会话
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = createNewSession();
      sessionId = newSession.id;
    }
    
    const userMessage: Message = {
      content: input,
      type: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // 发送消息
    try {
      const aiMessage: Message = {
        content: '',
        type: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);

      let currentContent = '';
      const unsubscribe = getAiModelContentStream(
        { userId: 'user123', message: input },
        (message) => {
          currentContent += message;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.type === 'ai') {
              lastMessage.content = currentContent;
            }
            return newMessages;
          });
        },
        () => {
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );

      // 组件卸载时清理EventSource连接
      return () => {
        unsubscribe();
      };
    } catch (error) {
      message.error('发送消息失败，请稍后重试');
      setLoading(false);
    }
  };
  const windowHeight = useWindowHeight();
  const heightStyle = {
    height: `${windowHeight - 470}px`,
  }
  const heightknowledgeBase={
    height: `${windowHeight - 370}px`,
  }

  const messageContainerRef = useRef<HTMLDivElement>(null);
  // 滚动到最底部
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const knowledge = await getKnowledgeList();
        setKnowledgeList(knowledge);
      } catch (error) {
        console.error('获取知识库失败:', error);
      }
    };
    fetchKnowledge();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      const knowledge = await getKnowledgeList();
      setKnowledgeList(knowledge);
      return;
    }
    try {
      const results = await searchKnowledge(searchQuery);
      setKnowledgeList(results);
    } catch (error) {
      console.error('搜索知识库失败:', error);
    }
  };

  // 渲染历史记录抽屉
  const renderHistoryDrawer = () => (
    <Drawer
      title="聊天记录"
      placement="left"
      onClose={() => setHistoryDrawerVisible(false)}
      open={historyDrawerVisible}
      width={320}
    >
      <div className="history-header">
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={createNewSession}
          style={{ width: '100%', marginBottom: 16 }}
        >
          新建对话
        </Button>
      </div>
      
      <List
        dataSource={chatSessions}
        renderItem={(session) => (
          <List.Item
            key={session.id}
            className={`history-item ${currentSessionId === session.id ? 'active' : ''}`}
            onClick={() => switchToSession(session.id)}
            actions={[
              <Button
                key="edit"
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSessionId(session.id);
                  setEditingTitle(session.title);
                }}
              />,
              <Button
                key="delete"
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
              />,
            ]}
          >
            <List.Item.Meta
              title={
                editingSessionId === session.id ? (
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onPressEnter={() => renameSession(session.id, editingTitle)}
                    onBlur={() => renameSession(session.id, editingTitle)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <div className="session-title">{session.title}</div>
                )
              }
              description={
                <div className="session-info">
                  <div>{session.messages.length} 条消息</div>
                  <div>{new Date(session.updatedAt).toLocaleDateString()}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
      
      {chatSessions.length === 0 && (
        <Empty 
          description="暂无聊天记录" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Drawer>
  );

  // 知识库搜索
  const renderKnowledgeBase = () => (
    <div className="knowledge-base-container" style={heightknowledgeBase}>
      <div className="search-container">
        <Input
          placeholder="搜索知识库"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
          suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />}
        />
      </div>
      {knowledgeList.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={knowledgeList}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              extra={
                <div className="knowledge-tags">
                  {item.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              }
            >
              <List.Item.Meta
                title={item.title}
                description={`分类：${item.category} | 创建时间：${new Date(item.createdAt).toLocaleDateString()}`}
              />
              <div className="knowledge-content">{item.content}</div>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无相关知识" />
      )}
    </div>
  );

  return (
    <div className="ai-assistant-container">
      {renderHistoryDrawer()}
      <Card className="ai-card">
        <div className="ai-header">
          <div className="header-left">
            <Button 
              type="text" 
              icon={<HistoryOutlined />} 
              onClick={() => setHistoryDrawerVisible(true)}
              className="history-button"
            >
              历史记录
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              <RobotOutlined /> AI学习助手
            </Title>
          </div>
          <div className="header-right">
            {currentSessionId && (
              <div className="current-session">
                <span className="session-indicator">当前对话：</span>
                <span className="session-title">
                  {chatSessions.find(s => s.id === currentSessionId)?.title || '新对话'}
                </span>
                <Button 
                  type="text" 
                  size="small"
                  icon={<PlusOutlined />} 
                  onClick={createNewSession}
                  className="new-chat-button"
                >
                  新建
                </Button>
              </div>
            )}
          </div>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'chat',
              label: (
                <span>
                  <RobotOutlined /> 智能对话
                </span>
              ),
              children: (
                <div className="message-container" style={heightStyle} ref={messageContainerRef}>
          <InfiniteScroll
            dataLength={messages.length}
            next={() => {}}
            hasMore={false}
            scrollableTarget="message-container"
            loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
          >
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.type}`}>
                  <div className={`message ${msg.type}`}>
                    {msg.type === 'ai' && (
                      <div className="message-avatar">
                        <RobotOutlined />
                      </div>
                    )}
                    <div className="message-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      <div className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {msg.type === 'user' && (
                      <div className="message-avatar user-avatar">
                        <span>我</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="empty-chat">
                  <RobotOutlined style={{ fontSize: '48px', color: '#cbd5e1' }} />
                  <p style={{ color: '#64748b', marginTop: '16px' }}>开始与AI助手对话吧！</p>
                </div>
              )}
            </div>
            {loading && (
              <div className="loading-container">
                <Spin />
              </div>
            )}
          </InfiniteScroll>
        </div>
                ),
              },
              {
                key: 'knowledge',
                label: (
                  <span>
                    <BookOutlined /> 知识库
                  </span>
                ),
                children: renderKnowledgeBase(),
              },
            ]}
          />
        <div className="input-container">
          <div className="input-wrapper">
            <TextArea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="请输入你的问题，例如：帮我分析学习记录并制定计划"
              autoSize={{ minRows: 2, maxRows: 3 }}
              onKeyDown={handleKeyPress}
            />
            <div className="input-controls">
              <div className="switch-group">
                {/* <Switch
                  size="small"
                  checked={deepThinking}
                  onChange={setDeepThinking}
                />
                <span>深度思考</span> */}
                <Switch
                  size="small"
                  checked={webSearch}
                  onChange={setWebSearch}
                />
                <span>联网搜索</span>
              </div>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={loading}
                className="send-button"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistant;