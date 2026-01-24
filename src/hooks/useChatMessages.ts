'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, Attachment } from '../types';
import { sendMessage } from '../lib/ai-client';

const WELCOME_MSG: Message = {
    id: 'welcome',
    role: 'assistant',
    content: '你好。我已经连接并准备就绪。',
    timestamp: new Date()
};

export function useChatMessages(activeSessionId: string) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isTypingRef = useRef(false);

  // Load messages when session changes
  useEffect(() => {
    if (isTypingRef.current) {
      console.log('[useChatMessages] Skipping message load - currently typing');
      return;
    }

    if (!activeSessionId) {
      setMessages([WELCOME_MSG]);
      return;
    }

    try {
      if (typeof window === 'undefined') {
        setMessages([WELCOME_MSG]);
        return;
      }
      const key = `chat_messages_${activeSessionId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
            setMessages(parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } else {
            setMessages([WELCOME_MSG]); 
        }
      } else {
        setMessages([WELCOME_MSG]);
      }
    } catch (e) {
      console.error('Failed to load messages', e);
      setMessages([WELCOME_MSG]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (activeSessionId && typeof window !== 'undefined') {
       localStorage.setItem(`chat_messages_${activeSessionId}`, JSON.stringify(messages));
    }
  }, [messages, activeSessionId]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        setIsTyping(false);
    }
  }, []);

  // 简化后的 sendUserMessage - 不再需要 apiKey 和 baseUrl（由服务端代理处理）
  const sendUserMessage = async (
    content: string, 
    settings: { model: string; systemPrompt?: string },
    attachments?: Attachment[]
  ) => {
    isTypingRef.current = true;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      attachments,
      timestamp: new Date()
    };

    const cleanHistory = messages.filter(m => m.id !== 'welcome');
    const newHistory = [...cleanHistory, userMsg];
    
    setMessages(newHistory);
    setIsTyping(true);

    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
    };
    
    setMessages(prev => [...prev, initialAiMsg]);

    abortControllerRef.current = new AbortController();

    try {
      await sendMessage({
        messages: newHistory,
        model: settings.model,
        systemPrompt: settings.systemPrompt,
        signal: abortControllerRef.current.signal,
        onChunk: (data) => {
            setMessages(prev => prev.map(m => 
                m.id === aiMsgId 
                ? { ...m, content: data.content, reasoning: data.reasoning }
                : m
            ));
        }
      });
    } catch (error: unknown) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       if (errorMessage !== 'Generation stopped by user') {
           setMessages(prev => prev.map(m => 
                m.id === aiMsgId 
                ? { ...m, content: m.content + `\n\n[错误: ${errorMessage}]` } 
                : m
            ));
       }
    } finally {
      setIsTyping(false);
      isTypingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  return {
    messages,
    isTyping,
    sendUserMessage,
    stopGeneration,
    setMessages
  };
}
