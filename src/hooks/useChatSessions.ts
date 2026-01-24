'use client';

import { useState, useEffect } from 'react';
import type { ChatSession } from '../types';

const STORAGE_KEY = 'chat_sessions';

// 安全地访问 localStorage（兼容服务端渲染）
const safeGetItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
};

const safeRemoveItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to remove from localStorage', e);
  }
};

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // 客户端 hydration - 从 localStorage 恢复状态
  useEffect(() => {
    try {
      const saved = safeGetItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hydrated = parsed.map((s: ChatSession) => ({
            ...s,
            updatedAt: new Date(s.updatedAt)
          }));
          setSessions(hydrated);
          if (hydrated.length > 0) {
            setActiveSessionId(hydrated[0].id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
    setIsHydrated(true);
  }, []);

  // 持久化 sessions 到 localStorage
  useEffect(() => {
    if (isHydrated) {
      safeSetItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, isHydrated]);

  const createSession = (preview: string) => {
    const id = Date.now().toString();
    const newSession: ChatSession = {
      id,
      title: preview.slice(0, 30) + (preview.length > 30 ? '...' : ''),
      preview,
      updatedAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(id);
    return id;
  };

  const updateSessionPreview = (id: string, preview: string) => {
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === id 
        ? { ...s, preview, updatedAt: new Date() }
        : s
      );
      return updated.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    });
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId('');
    }
    safeRemoveItem(`chat_messages_${id}`);
  };

  const clearNewChat = () => {
    setActiveSessionId('');
  };

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    updateSessionPreview,
    deleteSession,
    clearNewChat
  };
}
