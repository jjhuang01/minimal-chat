'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles, Zap, Brain } from 'lucide-react';

interface ModelOption {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
}

const MODELS: ModelOption[] = [
  { 
    id: "claude-opus-4-5-thinking", 
    name: "Claude Opus 4.5 Thinking", 
    description: "最强大的 Claude 模型 (Default)",
    icon: <Brain size={14} className="text-red-500" />
  },
  { 
    id: "gemini-3-pro-high", 
    name: "Gemini 3 Pro High", 
    description: "高性能版本，高并发备选",
    icon: <Brain size={14} className="text-purple-500" />
  },
  { 
    id: "gemini-3-flash", 
    name: "Gemini 3 Flash", 
    description: "最新一代快速模型",
    icon: <Zap size={14} className="text-blue-500" />
  },
  { 
    id: "claude-sonnet-4-5", 
    name: "Claude Sonnet 4.5", 
    description: "编程能力强，视觉理解优秀",
    icon: <Sparkles size={14} className="text-orange-500" />
  },
  { 
    id: "claude-sonnet-4-5-thinking", 
    name: "Claude Sonnet 4.5 Thinking", 
    description: "带推理链的增强版本",
    icon: <Brain size={14} className="text-orange-500" />
  }
];

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取当前模型的显示信息
  const selectedModel = MODELS.find(m => m.id === currentModel) || { 
    id: currentModel, 
    name: currentModel, 
    description: "自定义模型",
    icon: <Sparkles size={14} className="text-slate-400" />
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <span className="font-medium text-sm flex items-center gap-2">
          {selectedModel.name}
          <span className="opacity-50 text-[10px] hidden sm:inline-block font-normal truncate max-w-[100px]">
            {selectedModel.id !== selectedModel.name ? selectedModel.id : ''}
          </span>
        </span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-[var(--border-subtle)] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5">
          <div className="text-[10px] font-medium text-[var(--text-tertiary)] px-2 py-1.5 uppercase tracking-wider">
            选择模型
          </div>
          
          <div className="space-y-0.5">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-colors group ${
                  currentModel === model.id 
                    ? 'bg-slate-50' 
                    : 'hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className={`mt-0.5 ${currentModel === model.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                  {model.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium flex items-center justify-between ${
                    currentModel === model.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                  }`}>
                    {model.name}
                    {currentModel === model.id && <Check size={14} className="text-black" />}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                    {model.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 如果当前模型不在预设列表中，显示在这里 */}
          {!MODELS.some(m => m.id === currentModel) && (
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 flex items-center gap-3 cursor-default"
              >
                <Sparkles size={14} className="text-slate-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    自定义模型
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] truncate">
                    {currentModel}
                  </div>
                </div>
                <Check size={14} className="text-black" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
