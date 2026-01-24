'use client';
import { MessageSquarePlus, Settings, LayoutGrid, Trash2 } from "lucide-react";
import type { ChatSession } from "../types";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onOpenSettings,
  onDeleteSession,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)]">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 md:px-4">
        <button
          onClick={onNewChat}
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
        >
          <MessageSquarePlus size={18} />
          <span>新会话</span>
        </button>
        <button className="p-2 ml-1 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] transition-colors">
          <LayoutGrid size={18} />
        </button>
      </div>

      {/* History Label */}
      <div className="px-5 pt-4 pb-2 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
        历史记录
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
        <div className="space-y-0.5">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] leading-snug transition-colors group ${
                session.id === activeSessionId
                  ? "bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-medium"
                  : "hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
              }`}
            >
              <div className="truncate flex-1">{session.title}</div>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => onDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--bg-app)] rounded-md text-[var(--text-tertiary)] hover:text-red-500 transition-all"
                title="删除会话"
              >
                <Trash2 size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 group-hover:bg-slate-300 transition-colors">
            OS
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--text-primary)]">
              Antigravity User
            </div>
            <div className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
              点击配置
            </div>
          </div>
          <Settings size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
        </button>
      </div>
    </div>
  );
};
