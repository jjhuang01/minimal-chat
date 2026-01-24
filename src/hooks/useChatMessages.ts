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

  const activeSessionIdRef = useRef(activeSessionId);
  
  // 追踪当前 session，切换时如果正在生成，强制中断，防止串台
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
    if (isTypingRef.current) {
        console.log('[useChatMessages] Session changed while typing, aborting current request');
        abortControllerRef.current?.abort();
        setIsTyping(false);
        isTypingRef.current = false;
    }
  }, [activeSessionId]);

  const loadedSessionIdRef = useRef<string | null>(null);

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([WELCOME_MSG]);
      loadedSessionIdRef.current = null;
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
      // CRITICAL: Mark this session as loaded
      loadedSessionIdRef.current = activeSessionId;
    } catch (e) {
      console.error('Failed to load messages', e);
      setMessages([WELCOME_MSG]);
      loadedSessionIdRef.current = activeSessionId; // Even on error, we claim this session
    }
  }, [activeSessionId]);

  // Persist messages
  useEffect(() => {
    // CRITICAL: Only save if the data currently in state belongs to the active session
    if (
        activeSessionId && 
        loadedSessionIdRef.current === activeSessionId && 
        typeof window !== 'undefined'
    ) {
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
  // targetSessionId: 可选，用于新建会话场景，因为 React state 是异步更新的
  const sendUserMessage = async (
    content: string, 
    settings: { model: string; systemPrompt?: string },
    attachments?: Attachment[],
    targetSessionId?: string
  ) => {
    // 使用传入的 targetSessionId（新会话场景）或当前的 activeSessionId
    const effectiveSessionId = targetSessionId || activeSessionId;
    
    // 如果没有有效的 session ID，我们仍然发送（会话可能稍后创建）
    // 但是如果 activeSessionIdRef 有值且不匹配，说明用户切换了会话
    if (activeSessionIdRef.current && effectiveSessionId !== activeSessionIdRef.current) {
        console.warn('Attempted to send message to stale session');
        return;
    }
    
    // 更新 loadedSessionIdRef 以允许写入
    if (effectiveSessionId) {
        loadedSessionIdRef.current = effectiveSessionId;
    }

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
            // CRITICAL: Ensure we are still on the same session
            if (activeSessionIdRef.current !== activeSessionId) return;

            setMessages(prev => prev.map(m => 
                m.id === aiMsgId 
                ? { ...m, content: data.content, reasoning: data.reasoning }
                : m
            ));
        }
      });
    } catch (error: any) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       
       // 自动降级逻辑 (Fallback Strategy)
       // 如果遇到 503 (Capacity Exhausted) 或 429 (Rate Limit) 且当前是默认模型
       if (
           (errorMessage.includes('503') || errorMessage.includes('429')) && 
           settings.model === 'claude-opus-4-5-thinking'
       ) {
           console.log('[Fallback] Default model failed, trying fallback model...');
           
           // CRITICAL CHECK
           if (activeSessionIdRef.current !== activeSessionId) return;

           // 更新 UI 提示正在重试
           setMessages(prev => prev.map(m => 
                m.id === aiMsgId 
                ? { ...m, content: '_(默认模型繁忙，正在切换到 Gemini 3 Pro High...)_\n\n' } 
                : m
           ));

           try {
               await sendMessage({
                   messages: newHistory,
                   model: 'gemini-3-pro-high', // 硬编码备用模型
                   systemPrompt: settings.systemPrompt,
                   signal: abortControllerRef.current?.signal,
                   onChunk: (data) => {
                       if (activeSessionIdRef.current !== activeSessionId) return; // Double Check

                       setMessages(prev => prev.map(m => 
                           m.id === aiMsgId 
                           ? { 
                               ...m, 
                               content: m.content.startsWith('_') 
                                   ? data.content // 第一次收到 chunk 时替换掉提示语
                                   : data.content,
                               reasoning: data.reasoning 
                           }
                           : m
                       ));
                   }
               });
               return; // 重试成功，直接返回
           } catch (retryError: any) {
               console.error('Fallback also failed:', retryError);
               // 如果备用模型也失败，继续向下抛出错误
           }
       }

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
