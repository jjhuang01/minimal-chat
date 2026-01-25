'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, ArrowUp, Square, X, FileText, File } from 'lucide-react';
import type { Attachment } from '../types';

interface InputAreaProps {
  onSend: (content: string, attachments?: Attachment[]) => void;
  onStop?: () => void;
  disabled?: boolean;
}

// 支持的文件类型
const ACCEPTED_TYPES = {
  image: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
};
const ALL_ACCEPTED = [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.pdf];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 5;

// 文件转 Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:xxx;base64, 前缀，只保留纯 base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 文件类型判断
const getFileType = (mimeType: string): 'image' | 'pdf' | 'file' => {
  if (ACCEPTED_TYPES.image.includes(mimeType)) return 'image';
  if (ACCEPTED_TYPES.pdf.includes(mimeType)) return 'pdf';
  return 'file';
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const InputArea: React.FC<InputAreaProps> = ({ onSend, onStop, disabled }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // 处理文件添加
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: Attachment[] = [];
    
    for (const file of fileArray) {
      // 检查文件数量限制
      if (attachments.length + validFiles.length >= MAX_FILES) {
        alert(`最多只能上传 ${MAX_FILES} 个文件`);
        break;
      }
      
      // 检查文件类型
      if (!ALL_ACCEPTED.includes(file.type)) {
        alert(`不支持的文件类型: ${file.name}\n支持: PNG, JPG, GIF, WebP, PDF`);
        continue;
      }
      
      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        alert(`文件太大: ${file.name}\n最大支持 20MB`);
        continue;
      }
      
      try {
        const base64 = await fileToBase64(file);
        const fileType = getFileType(file.type);
        
        const attachment: Attachment = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: fileType,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          base64,
          previewUrl: fileType === 'image' ? `data:${file.type};base64,${base64}` : undefined,
        };
        
        validFiles.push(attachment);
      } catch (e) {
        console.error('Failed to process file:', file.name, e);
        alert(`处理文件失败: ${file.name}`);
      }
    }
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }
  }, [attachments.length]);

  // 点击上传
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // 文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // 重置 input
    }
  };

  // 拖拽事件
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 检查是否真的离开了拖放区域
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // 粘贴事件
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    
    if (files.length > 0) {
      e.preventDefault();
      processFiles(files);
    }
  };

  // 删除附件
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // 发送消息
  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || disabled) return;
    onSend(input, attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
    setTimeout(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="pb-6 px-4 safe-area-bottom">
      <div className="max-w-[768px] mx-auto">
        <div 
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative flex flex-col bg-[var(--bg-app)] border ${
            isDragging 
              ? 'border-blue-400 ring-2 ring-blue-400/30 bg-blue-50/30' 
              : 'border-[var(--border-subtle)] focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400'
          } rounded-xl shadow-[var(--input-shadow)] transition-all duration-200 overflow-hidden`}
        >
          {/* 拖拽提示 */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-50/80 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
              <div className="text-blue-600 font-medium flex items-center gap-2">
                <Paperclip size={20} />
                放开以上传文件
              </div>
            </div>
          )}

          {/* 附件预览区 */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-0 border-b border-[var(--border-subtle)]">
              {attachments.map((att) => (
                <div 
                  key={att.id}
                  className="relative group flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 pr-8 max-w-[200px]"
                >
                  {/* 图标/缩略图 */}
                  {att.type === 'image' && att.previewUrl ? (
                    <img 
                      src={att.previewUrl} 
                      alt={att.name}
                      className="w-10 h-10 object-cover rounded-md"
                    />
                  ) : att.type === 'pdf' ? (
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-md flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-md flex items-center justify-center">
                      <File size={20} />
                    </div>
                  )}
                  
                  {/* 文件信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{att.name}</p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(att.size)}</p>
                  </div>
                  
                  {/* 删除按钮 */}
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-1 right-1 p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={attachments.length > 0 ? "添加描述..." : "输入消息，按回车(Enter)发送..."}
            rows={1}
            className="w-full max-h-[200px] py-3 pl-4 pr-24 bg-transparent border-none outline-none resize-none text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            style={{ minHeight: '48px' }}
          />

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALL_ACCEPTED.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {/* 上传按钮 */}
            <button 
              onClick={handleFileClick}
              disabled={disabled}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-slate-100 transition-colors rounded-md disabled:opacity-50"
              title="上传文件 (图片/PDF)"
            >
              <Paperclip size={18} />
            </button>
            
            {/* 发送/停止按钮 */}
            <button 
              onClick={disabled && onStop ? onStop : handleSend}
              disabled={!input.trim() && attachments.length === 0 && !disabled}
              className={`p-1.5 rounded-md transition-all ${
                disabled 
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : (input.trim() || attachments.length > 0)
                    ? 'bg-black text-white hover:bg-slate-800' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              {disabled ? (
                <div className="relative">
                  <Square size={16} fill="currentColor" />
                  <span className="absolute inset-0 animate-ping opacity-20 bg-white rounded-sm"></span>
                </div>
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
        
        <div className="text-center mt-3 text-[11px] text-[var(--text-tertiary)]">
            支持拖拽或粘贴图片 · 由 huangjiajian 驱动
        </div>
      </div>
    </div>
  );
};
