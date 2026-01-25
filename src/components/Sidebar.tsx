'use client';
import { MessageSquarePlus, Settings, Trash2, User, X } from "lucide-react";
import type { ChatSession } from "../types";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onClose?: () => void; // 移动端关闭侧边栏
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onOpenSettings,
  onDeleteSession,
  onClose,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)]">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 md:px-4">
        <button
          onClick={onNewChat}
          className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-surface-hover)] active:bg-[var(--bg-surface-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
        >
          <MessageSquarePlus size={18} />
          <span>新会话</span>
        </button>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 -mr-1 rounded-lg hover:bg-[var(--bg-surface-hover)] active:bg-[var(--bg-surface-active)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* History Label */}
      <div className="px-5 pt-4 pb-2 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
        历史记录
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
        <div className="space-y-0.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`relative w-full text-left px-3 py-3 md:py-2.5 rounded-lg text-[14px] md:text-[13px] leading-snug transition-colors group flex items-center justify-between cursor-pointer select-none ${
                session.id === activeSessionId
                  ? "bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-medium"
                  : "hover:bg-[var(--bg-surface-hover)] active:bg-[var(--bg-surface-active)] text-[var(--text-secondary)]"
              }`}
            >
              <div className="truncate flex-1 pr-2">{session.title}</div>
              <button
                onClick={(e) => onDeleteSession(session.id, e)}
                className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 md:p-1.5 -mr-1 md:mr-0 rounded-md text-[var(--text-tertiary)] hover:text-red-500 active:text-red-600 hover:bg-red-50 transition-all"
                title="删除会话"
              >
                <Trash2 size={16} className="md:w-[14px] md:h-[14px]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors">
            <User size={16} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--text-primary)]">
              Guest
            </div>
            <div className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
              设置
            </div>
          </div>
          <Settings size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
        </button>
      </div>
    </div>
  );
};
