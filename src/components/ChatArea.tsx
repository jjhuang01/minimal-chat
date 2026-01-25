'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Bot, Check, Copy } from 'lucide-react';
import type { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';


// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
});

const Mermaid = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [id] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const render = async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(false);
      } catch (e) {
        console.error('Mermaid render error:', e);
        setError(true);
      }
    };
    render();
  }, [chart, id]);

  if (error) return <code className="text-red-500 text-sm whitespace-pre-wrap">{chart}</code>;
  
  return <div className="my-4 flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />;
};

const CodeBlock = ({ children, className, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isMermaid = language === 'mermaid';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isMermaid) {
    return <Mermaid chart={String(children).replace(/\n$/, '')} />;
  }

  return match ? (
    <div className="relative group rounded-lg overflow-hidden my-4 border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-[var(--border-subtle)]">
         <span className="text-xs font-medium text-gray-600 lowercase">{language}</span>
         <button 
           onClick={handleCopy}
           className="p-1 hover:bg-zinc-200 rounded-md transition-colors text-zinc-400 hover:text-zinc-600"
           title="Copy code"
         >
           {copied ? <Check size={14} /> : <Copy size={14} />}
         </button>
      </div>
      <div className="text-[13px]">
        <SyntaxHighlighter
          {...props}
          style={oneLight}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 0, padding: '1rem', background: '#ffffff' }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    </div>
  ) : (
    <code {...props} className="bg-zinc-100 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-pink-600 font-medium">
      {children}
    </code>
  );
};



const STARTER_PROMPTS = [
  { label: '解释量子计算', query: '请用小学生能听懂的话解释一下量子计算。' },
  { label: '写首诗', query: '写一首关于秋天程序员在这个季节的五言绝句。' },
  { label: '代码调试', query: '帮我查找这段 React 代码中的 useEffect 依赖项问题...' },
  { label: '制定计划', query: '帮我制定一个为期 3 个月的全栈工程师学习计划。' },
];

interface ChatAreaProps {
  messages: Message[];
  isTyping?: boolean;
  onSend?: (content: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isTyping, onSend }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    console.log('[ChatArea] Messages updated:', messages.length, 'isTyping:', isTyping);
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-0 py-8 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
               <Bot size={32} />
           </div>
           <p className="text-xl font-medium text-[var(--text-primary)]">你好，我是 AI 助手</p>
           <p className="text-sm text-[var(--text-tertiary)] mt-2">您可以直接在下方输入框中提问，或选择以下话题开始：</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSend?.(prompt.query)}
                        className="text-left p-3 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-active)] transition-all text-sm group"
                    >
                        <div className="font-medium text-[var(--text-primary)] mb-0.5 group-hover:text-blue-600 transition-colors">
                            {prompt.label}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] truncate">
                            {prompt.query}
                        </div>
                    </button>
                ))}
            </div>
         </div>
      ) : (
        <div className="max-w-[768px] mx-auto space-y-8">
          {messages.map((msg, idx) => (
            <div 
              key={msg.id} 
              className={`group flex gap-4 md:gap-6 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Avatar Column (AI Only) */}
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 flex items-center justify-center pt-1">
                   <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center">
                       <Bot size={14} />
                   </div>
                </div>
              )}

              {/* Message Content */}
              <div className={`max-w-[85%] min-w-0 ${
                  msg.role === 'user' ? 'bg-black text-white rounded-2xl rounded-tr-sm px-5 py-3' : 'py-1'
              }`}>
                 {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                            AI 助手
                        </span>
                    </div>
                 )}
                 
                 <div className={`text-[15px] leading-relaxed ${
                     msg.role === 'user' ? 'text-white' : 'text-[var(--text-primary)]'
                 }`}>
                    {msg.role === 'user' ? (
                        <div>
                          {/* 附件显示 */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {msg.attachments.map((att) => (
                                att.type === 'image' && att.previewUrl ? (
                                  <img 
                                    key={att.id}
                                    src={att.previewUrl} 
                                    alt={att.name}
                                    className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-white/20"
                                  />
                                ) : (
                                  <div 
                                    key={att.id}
                                    className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm"
                                  >
                                    <span className="text-white/70">📎</span>
                                    <span className="truncate max-w-[150px]">{att.name}</span>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                        </div>
                    ) : (
                        (!msg.content && !msg.reasoning && isTyping && idx === messages.length - 1) ? (
                              <div className="flex items-center gap-2 text-zinc-400 italic py-1">
                                  <span className="text-sm">思考中</span>
                                  <span className="flex gap-0.5 mt-1">
                                      <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                      <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                      <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce"></span>
                                  </span>
                              </div>
                        ) : (
                            <div className="space-y-2">
                                {msg.reasoning && (
                                    <div className="bg-zinc-50 border-l-2 border-zinc-200 pl-3 py-1 my-2 text-zinc-500 text-sm italic">
                                        <div className="font-semibold text-xs mb-1 not-italic opacity-70">
                                            思考过程
                                        </div>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.reasoning}</p>
                                    </div>
                                )}
                                <div className="markdown prose prose-neutral max-w-none">
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                                      components={{
                                        code: CodeBlock
                                      }}
                                    >
                                      {(String(msg.content || '')) + (isTyping && idx === messages.length - 1 && msg.role === 'assistant' ? ' ▍' : '')}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )
                    )}
                 </div>
              </div>
            </div>
          ))}

            {/* Removed separate loading indicator in favor of inline streaming cursor */}

            <div ref={messagesEndRef} className="h-10" />
        </div>
      )}
    </div>
  );
};
