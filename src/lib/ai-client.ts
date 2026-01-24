import { createParser } from 'eventsource-parser';
import type { Message } from '../types';

interface SendMessageOptions {
  messages: Message[];
  model: string;
  systemPrompt?: string;
  onChunk: (data: { content: string; reasoning?: string }) => void;
  signal?: AbortSignal;
}

export class APIError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// 将消息转换为 OpenAI 格式
function formatMessage(msg: Message): { role: string; content: unknown } {
  const hasAttachments = msg.attachments && msg.attachments.length > 0;
  
  if (!hasAttachments) {
    return {
      role: msg.role,
      content: msg.content || ''
    };
  }

  // OpenAI Vision 格式: content 是数组
  const content: unknown[] = [];
  
  // 先添加文本
  if (msg.content) {
    content.push({ type: 'text', text: msg.content });
  }
  
  // 添加附件
  for (const att of msg.attachments!) {
    if (att.type === 'image') {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${att.mimeType};base64,${att.base64}`,
          detail: 'auto'
        }
      });
    } else if (att.type === 'pdf') {
      content.push({
        type: 'text',
        text: `[已上传 PDF 文件: ${att.name}]`
      });
    }
  }
  
  return { role: msg.role, content };
}

export async function sendMessage({
  messages,
  model,
  systemPrompt,
  onChunk,
  signal,
}: SendMessageOptions): Promise<{ content: string; reasoning?: string }> {
  // 使用我们的代理 API，不再直接请求外部服务器
  const url = '/api/chat';
  
  // 构建请求体
  let msgs = messages.map(formatMessage);
  if (systemPrompt) {
    msgs = [{ role: 'system', content: systemPrompt }, ...msgs];
  }
  
  const body = {
    model,
    messages: msgs,
    stream: true,
  };

  console.log('[AI Client] Sending request via proxy:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new APIError(`API Error ${response.status}: ${errorText}`, response.status);
    }

    if (!response.body) {
      throw new APIError('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let fullReasoning = '';

    const parser = createParser({
      onEvent: (event) => {
        const data = event.data;
        if (data === '[DONE]') return;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          const textChunk = delta?.content || '';
          const reasoningChunk = delta?.reasoning_content || '';

          if (textChunk || reasoningChunk) {
            fullText += textChunk;
            fullReasoning += reasoningChunk;
            onChunk({ content: fullText, reasoning: fullReasoning });
          }
        } catch (e) {
          console.error('[AI Client] JSON parse error', e);
        }
      }
    });

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        parser.feed(chunk);
      }
    } finally {
      reader.releaseLock();
    }

    return { content: fullText, reasoning: fullReasoning };

  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Generation stopped by user');
    }
    throw error;
  }
}
