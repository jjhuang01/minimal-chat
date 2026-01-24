'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, ChevronDown } from 'lucide-react';

const PRESET_MODELS = [
  "gemini-2.5-flash",
  "gemini-3-pro-high",
  "gemini-3-flash",
  "claude-sonnet-4-5",
  "claude-sonnet-4-5-thinking",
  "claude-opus-4-5-thinking"
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { model: string; systemPrompt?: string }) => void;
  initialSettings: { model: string; systemPrompt?: string };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [model, setModel] = useState(initialSettings.model);
  const [systemPrompt, setSystemPrompt] = useState(initialSettings.systemPrompt || '');
  const [showModelList, setShowModelList] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModel(initialSettings.model);
      setSystemPrompt(initialSettings.systemPrompt || '');
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ model, systemPrompt });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[var(--border-subtle)] animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] rounded-t-xl">
          <h3 className="font-semibold text-[var(--text-primary)]">设置</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* 提示信息 */}
          <div className="text-xs text-[var(--text-tertiary)] bg-slate-50 rounded-lg p-3">
            🔒 API 配置已由服务端安全管理，无需手动设置。
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw size={12} />
              模型 ID (Model ID)
            </label>
            <div className="relative">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                onFocus={() => setShowModelList(true)}
                onBlur={() => setTimeout(() => setShowModelList(false), 200)}
                placeholder="gemini-2.5-flash"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-white text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all pr-10"
              />
              <button 
                type="button"
                onClick={() => setShowModelList(!showModelList)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                <ChevronDown size={16} />
              </button>
              
              {showModelList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border-subtle)] rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                  {PRESET_MODELS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setModel(preset);
                        setShowModelList(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors flex items-center justify-between group"
                    >
                      {preset}
                      {model === preset && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
               系统提示词 (System Prompt)
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] h-24 resize-none transition-all"
              placeholder="例如：你是一个资深的 Python 工程师，回答要简洁..."
            />
          </div>
        </div>

        <div className="px-5 py-4 bg-[var(--bg-app)] border-t border-[var(--border-subtle)] flex justify-end gap-2 rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-black text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save size={16} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};
