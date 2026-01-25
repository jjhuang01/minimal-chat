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
  const prevSessionIdRef = useRef<string | null>(null); // 追踪上一个 sessionId
  
  // 追踪当前 session，切换时如果正在生成，强制中断，防止串台
  useEffect(() => {
    const prevId = prevSessionIdRef.current;
    const newId = activeSessionId;
    
    // 更新 refs
    prevSessionIdRef.current = newId;
    activeSessionIdRef.current = newId;
    
    // 🔧 FIX: 只有在真正的会话切换时才中断请求
    // "真正的切换" = 从一个非空 ID 切换到另一个不同的非空 ID
    // "创建新会话" = 从空/null 变为新 ID，此时不应中断（请求正在进行中）
    const isRealSwitch = prevId && newId && prevId !== newId;
    
    if (isRealSwitch && isTypingRef.current) {
        console.log('[useChatMessages] Session switched while typing, aborting current request');
        abortControllerRef.current?.abort();
        setIsTyping(false);
        isTypingRef.current = false;
    }
  }, [activeSessionId]);

  const loadedSessionIdRef = useRef<string | null>(null);

  // Load messages when session changes
  useEffect(() => {
    // CRITICAL: 如果正在发送消息，或者这个 session 已经被 sendUserMessage 接管，跳过加载
    // 这避免了 createSession + sendUserMessage 的竞态条件
    if (isTypingRef.current) {
        console.log('[useChatMessages] Skipping load - currently typing');
        return;
    }
    if (loadedSessionIdRef.current === activeSessionId) {
        console.log('[useChatMessages] Skipping load - session already loaded by sendUserMessage');
        return;
    }

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

  // 🔧 预锁定方法：在 createSession 之前调用，防止 session 切换触发中断逻辑
  const lockForSending = useCallback(() => {
    isTypingRef.current = true;
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        setIsTyping(false);
        isTypingRef.current = false;
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
    // CRITICAL: 立即标记为正在输入，阻止加载 effect 覆盖消息
    isTypingRef.current = true;

    // 使用传入的 targetSessionId（新会话场景）或当前的 activeSessionId
    const effectiveSessionId = targetSessionId || activeSessionId;
    
    // 🔧 FIX: 如果 targetSessionId 被明确传入，说明是新会话场景
    // 此时 activeSessionIdRef 可能还没同步更新，应该跳过 stale 检查
    // 只有在没有明确 targetSessionId 且 activeSessionIdRef 有值时才进行检查
    if (!targetSessionId && activeSessionIdRef.current && effectiveSessionId !== activeSessionIdRef.current) {
        console.warn('[useChatMessages] Attempted to send message to stale session');
        isTypingRef.current = false;
        return;
    }
    
    // 更新 Refs 以允许写入和正确的会话追踪
    if (effectiveSessionId) {
        loadedSessionIdRef.current = effectiveSessionId;
        activeSessionIdRef.current = effectiveSessionId; // 确保后续检查使用正确的 ID
    }

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
            // 使用 effectiveSessionId 而非闭包捕获的 activeSessionId
            if (activeSessionIdRef.current !== effectiveSessionId) return;

            setMessages(prev => prev.map(m => 
                m.id === aiMsgId 
                ? { ...m, content: data.content, reasoning: data.reasoning }
                : m
            ));
        }
      });
    } catch (error: unknown) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       
       // 自动降级逻辑 (Fallback Strategy)
       // 如果遇到 503 (Capacity Exhausted) 或 429 (Rate Limit) 且当前是默认模型
       if (
           (errorMessage.includes('503') || errorMessage.includes('429')) && 
           settings.model === 'claude-opus-4-5-thinking'
       ) {
           console.log('[Fallback] Default model failed, trying fallback model...');
           
           // CRITICAL CHECK - 使用 effectiveSessionId
           if (activeSessionIdRef.current !== effectiveSessionId) return;

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
                       if (activeSessionIdRef.current !== effectiveSessionId) return; // Double Check

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
           } catch (retryError: unknown) {
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
    lockForSending,
    setMessages
  };
}
