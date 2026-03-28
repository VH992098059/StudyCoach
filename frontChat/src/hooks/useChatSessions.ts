/**
 * 聊天会话管理：创建、删除、切换、保存会话（已登录→数据库，未登录→本地存储）
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import type { ChatSession, Message, UseChatSessionsReturn } from '../types/chat';
import ChatHistoryService from '@/services/chatHistory';

/** 未登录用户的本地存储 key（与云端数据隔离） */
const STORAGE_KEY_LOCAL = 'ai_chat_sessions_local';

export const useChatSessions = (): UseChatSessionsReturn => {
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const generateMsgId = useCallback((): string => {
    return `${Date.now()}`;
  }, []);

  // 已登录保存到数据库，未登录保存到本地存储
  const saveChatSessions = useCallback(async (sessions: ChatSession[]) => {
    try {
      const token = localStorage.getItem('access_token');

      if (token) {
        // 已登录：保存到数据库
        if (currentSessionId) {
          const currentSession = sessions.find(s => s.id === currentSessionId);
          if (currentSession) {
            const apiMessages: any[] = currentSession.messages.map(msg => ({
              id: msg.id,
              msg_id: msg.msg_id,
              content: msg.content,
              isUser: msg.isUser,
              timestamp: msg.timestamp.toISOString(),
              ...(msg.reasoningContent ? { reasoningContent: msg.reasoningContent } : {}),
            }));

            const res = await ChatHistoryService.saveSession({
              id: currentSession.id,
              title: currentSession.title,
              messages: apiMessages
            });

            if (res.id && res.id !== currentSession.id) {
              const updatedSessions = sessions.map(s =>
                s.id === currentSession.id ? { ...s, id: res.id } : s
              );
              setChatSessions(updatedSessions);
              setCurrentSessionId(res.id);
            }
          }
        }
      } else {
        // 未登录：保存到本地存储
        localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('保存聊天记录失败:', error);
    }
  }, [currentSessionId]);

  // 加载聊天记录：已登录→数据库，未登录→本地存储
  const loadChatSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');

      if (token) {
        // 已登录：从数据库加载
        try {
          const res = await ChatHistoryService.getHistory();
          if (res.list && res.list.length > 0) {
            const sessions: ChatSession[] = res.list
              .map((session: any) => ({
                id: session.id,
                title: session.title,
                messages: [],
                createdAt: new Date(session.createdAt),
                updatedAt: new Date(session.updatedAt)
              }))
              .filter((s: ChatSession, i: number, arr: ChatSession[]) => arr.findIndex(x => x.id === s.id) === i);

            setChatSessions(sessions);

            const firstSessionId = sessions[0].id;
            const detailRes = await ChatHistoryService.getSession(firstSessionId);

            const fullSession: ChatSession = {
              ...sessions[0],
              messages: detailRes.messages.map((msg: any) => ({
                id: msg.id,
                msg_id: msg.msg_id,
                content: msg.content,
                isUser: msg.isUser,
                timestamp: new Date(msg.timestamp),
                ...(msg.reasoningContent ? { reasoningContent: msg.reasoningContent } : {}),
              }))
            };

            const updatedSessions = [...sessions];
            updatedSessions[0] = fullSession;
            setChatSessions(updatedSessions);
            setCurrentSessionId(firstSessionId);
            setMessages(fullSession.messages);
            return;
          }
        } catch (apiError) {
          console.error('获取云端历史记录失败:', apiError);
        }
      }

      // 未登录：从本地存储加载
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL);
      if (stored) {
        const sessions: ChatSession[] = JSON.parse(stored)
          .map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            messages: (session.messages || []).map((msg: any) => ({
              ...msg,
              msg_id: msg.msg_id || generateMsgId(),
              timestamp: new Date(msg.timestamp)
            }))
          }))
          .filter((s: ChatSession, i: number, arr: ChatSession[]) => arr.findIndex(x => x.id === s.id) === i);
        setChatSessions(sessions);
        if (sessions.length > 0) {
          setCurrentSessionId(sessions[0].id);
          setMessages(sessions[0].messages);
          return;
        }
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
    setChatSessions([]);
    setCurrentSessionId('');
    setMessages([]);
  }, [generateMsgId]);

  // 创建新会话
  const createNewSession = useCallback(async () => {
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
      // 防止重复添加（如 React Strict Mode 双次调用、快速双击等）
      if (prevSessions.some(s => s.id === newSessionId)) {
        return prevSessions;
      }
      const updatedSessions = [newSession, ...prevSessions];
      saveChatSessions(updatedSessions);
      return updatedSessions;
    });

    setCurrentSessionId(newSessionId);
    setMessages(newSession.messages);

    // 如果已登录，立即保存到后端
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        await ChatHistoryService.saveSession({
          id: newSessionId,
          title: '新对话',
          messages: newSession.messages.map(msg => ({
            id: msg.id,
            msg_id: msg.msg_id,
            content: msg.content,
            isUser: msg.isUser,
            timestamp: msg.timestamp.toISOString(),
          })),
        });
      } catch (error) {
        console.error('保存新会话到后端失败:', error);
      }
    }
  }, [generateMsgId, saveChatSessions]);

  // 加载指定会话
  const loadSession = useCallback(async (sessionId: string) => {
    // 先尝试从本地状态获取
    const localSession = chatSessions.find(s => s.id === sessionId);
    
    // 如果本地有完整消息记录，直接使用
    if (localSession && localSession.messages && localSession.messages.length > 0) {
      setCurrentSessionId(sessionId);
      setMessages(localSession.messages);
      return;
    }

    // 如果已登录且本地无消息（或消息不全），尝试从后端获取
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const detailRes = await ChatHistoryService.getSession(sessionId);
        const messages = detailRes.messages.map((msg: any) => ({
          id: msg.id,
          msg_id: msg.msg_id,
          content: msg.content,
          isUser: msg.isUser,
          timestamp: new Date(msg.timestamp),
          ...(msg.reasoningContent ? { reasoningContent: msg.reasoningContent } : {}),
        }));

        setMessages(messages);
        setCurrentSessionId(sessionId);

        // 更新本地状态缓存
        setChatSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, messages } : s
        ));
        return;
      } catch (error) {
        console.error('获取会话详情失败:', error);
      }
    }

    // 降级处理：如果还没加载到，就只设置ID（可能会显示空消息）
    if (localSession) {
      setCurrentSessionId(sessionId);
      setMessages(localSession.messages || []);
    }
  }, [chatSessions]);

  // 删除会话
  const deleteSession = useCallback(async (sessionId: string) => {
    const token = localStorage.getItem('access_token');

    setChatSessions(prevSessions => {
      const updatedSessions = prevSessions.filter(s => s.id !== sessionId);
      if (!token) {
        localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(updatedSessions));
      }
      if (sessionId === currentSessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id);
          setMessages(updatedSessions[0].messages || []);
        } else {
          setCurrentSessionId('');
          setMessages([]);
        }
      }
      return updatedSessions;
    });

    if (token) {
      try {
        await ChatHistoryService.deleteSession(sessionId);
      } catch (error) {
        console.error('删除云端会话失败:', error);
        message.warning('云端会话删除失败，请稍后重试');
      }
    }
  }, [currentSessionId]);

  const pendingSaveRef = useRef<ChatSession[] | null>(null);

  // 更新当前会话（updater 保持纯函数，副作用移至 useEffect）
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
            updatedAt: lastMessageTs,
          };
        }
        return session;
      });
      pendingSaveRef.current = updatedSessions;
      return updatedSessions;
    });
  }, [currentSessionId]);

  // 会话更新后持久化（将副作用移出 updater）
  useEffect(() => {
    if (pendingSaveRef.current) {
      saveChatSessions(pendingSaveRef.current);
      pendingSaveRef.current = null;
    }
  }, [chatSessions, saveChatSessions]);

  // 监听登录状态变化，重新加载会话（切换本地/云端数据源）
  useEffect(() => {
    loadChatSessions();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === STORAGE_KEY_LOCAL) {
        loadChatSessions();
      }
    };
    const handleAuthLogout = () => loadChatSessions();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
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