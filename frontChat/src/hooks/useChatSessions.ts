/**
 * 聊天会话管理Hook
 * 负责管理聊天会话的创建、删除、切换、保存等功能
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import type { ChatSession, Message, UseChatSessionsReturn } from '../types/chat';

const STORAGE_KEY = 'ai_chat_sessions';

export const useChatSessions = (): UseChatSessionsReturn => {
  // 状态管理
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // 生成唯一的消息ID
  const generateMsgId = useCallback((): string => {
    return `msg_${Date.now()}_${Math.random().toString(36)}`;
  }, []);

  // 保存聊天记录到localStorage
  const saveChatSessions = useCallback((sessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('保存聊天记录失败:', error);
      message.error('保存聊天记录失败');
    }
  }, []);

  // 从localStorage加载聊天记录
  const loadChatSessions = useCallback(() => {
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
    // 若没有任何历史会话，则清空状态，等待用户手动创建
    setChatSessions([]);
    setCurrentSessionId('');
    setMessages([]);
  }, [generateMsgId]);

  // 创建新会话
  const createNewSession = useCallback(() => {
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
    
    setChatSessions(prevSessions => {
      const updatedSessions = [newSession, ...prevSessions];
      saveChatSessions(updatedSessions);
      return updatedSessions;
    });
    
    setCurrentSessionId(newSessionId);
    setMessages(newSession.messages);
  }, [generateMsgId, saveChatSessions]);

  // 加载指定会话
  const loadSession = useCallback((sessionId: string) => {
    setChatSessions(prevSessions => {
      const session = prevSessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSessionId(sessionId);
        setMessages(session.messages);
      }
      return prevSessions;
    });
  }, []);

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    setChatSessions(prevSessions => {
      const updatedSessions = prevSessions.filter(s => s.id !== sessionId);
      saveChatSessions(updatedSessions);
      
      if (currentSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          loadSession(updatedSessions[0].id);
        } else {
          // 已无任何会话，清空当前状态，等待用户创建新会话
          setCurrentSessionId('');
          setMessages([]);
        }
      }
      
      return updatedSessions;
    });
  }, [currentSessionId, loadSession, createNewSession, saveChatSessions]);

  // 更新当前会话
  const updateCurrentSession = useCallback((newMessages: Message[]) => {
    if (!currentSessionId) return;
    
    setChatSessions(prevSessions => {
      const updatedSessions = prevSessions.map(session => {
        if (session.id === currentSessionId) {
          const firstUserMessage = newMessages.find(msg => msg.isUser);
          const title = firstUserMessage ? 
            firstUserMessage.content.slice(0, 20) + (firstUserMessage.content.length > 20 ? '...' : '') : 
            '新对话';
          const lastMessageTs = newMessages.length > 0 ? newMessages[newMessages.length - 1].timestamp : session.updatedAt;
          
          return {
            ...session,
            title,
            messages: newMessages,
            // 仅以最后一条消息时间作为会话更新时间，避免点击切换导致时间变化
            updatedAt: lastMessageTs,
          };
        }
        return session;
      });
      
      saveChatSessions(updatedSessions);
      return updatedSessions;
    });
  }, [currentSessionId, saveChatSessions]);

  // 初始化加载会话
  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  // 当消息变化时更新会话
  useEffect(() => {
    if (currentSessionId && messages.length > 1) {
      updateCurrentSession(messages);
    }
  }, [messages, currentSessionId, updateCurrentSession]);

  return {
    // 状态
    currentSessionId,
    chatSessions,
    messages,
    
    // 操作方法
    createNewSession,
    loadSession,
    deleteSession,
    updateCurrentSession,
    setMessages,
    
    // 工具方法
    generateMsgId,
  };
};