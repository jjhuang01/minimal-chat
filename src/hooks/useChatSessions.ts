'use client';

import { useState, useEffect } from 'react';
import type { ChatSession } from '../types';

const STORAGE_KEY = 'chat_sessions';

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Validate/Migrate if needed
      if (!Array.isArray(parsed)) return [];
      return parsed.map((s: any) => ({
        ...s,
        updatedAt: new Date(s.updatedAt) // Rehydrate Date
      }));
    } catch (e) {
      console.error('Failed to load sessions', e);
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
        // Simple logic: If we have sessions, defaulting to the first one is often good UX for this app
        // or we could persist 'last_active_session_id' separately.
        // For now, let's replicate existing behavior: try to recover state or default to empty.
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
             const parsed = JSON.parse(saved);
             if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
        }
        return '';
    } catch {
        return '';
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

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
      setActiveSessionId(''); // Or select next available
    }
    // Also cleanup messages for this session
    localStorage.removeItem(`chat_messages_${id}`);
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
