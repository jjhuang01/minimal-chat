"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { InputArea } from "@/components/InputArea";
import { SettingsModal } from "@/components/SettingsModal";
import { ModelSelector } from "@/components/ModelSelector";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useChatMessages } from "@/hooks/useChatMessages";
import type { Attachment } from "@/types";

// 客户端配置 - 只包含非敏感信息
const CLIENT_CONFIG = {
  DEFAULT_MODEL: "claude-opus-4-5-thinking",
  SETTINGS_VERSION: "v4",
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 简化的设置 - 不再需要 apiKey 和 baseUrl（由服务端代理处理）
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") {
      return { model: CLIENT_CONFIG.DEFAULT_MODEL, systemPrompt: "" };
    }
    const saved = localStorage.getItem(
      `chatSettings_${CLIENT_CONFIG.SETTINGS_VERSION}`,
    );
    return saved
      ? JSON.parse(saved)
      : {
          model: CLIENT_CONFIG.DEFAULT_MODEL,
          systemPrompt: "",
        };
  });

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    updateSessionPreview,
    deleteSession,
    clearNewChat,
  } = useChatSessions();

  const {
    messages,
    isTyping,
    sendUserMessage,
    stopGeneration,
    lockForSending,
  } = useChatMessages(activeSessionId);

  const handleSaveSettings = (newSettings: {
    model: string;
    systemPrompt?: string;
  }) => {
    setSettings(newSettings);
    localStorage.setItem(
      `chatSettings_${CLIENT_CONFIG.SETTINGS_VERSION}`,
      JSON.stringify(newSettings),
    );
  };

  const handleSend = async (content: string, attachments?: Attachment[]) => {
    // 生成预览文本
    const previewText =
      attachments && attachments.length > 0
        ? `[${attachments.length}个附件] ${content || "(仅附件)"}`
        : content;

    // 🔧 FIX: 在 createSession 之前预锁定，防止 session 变化触发的 effect 中断请求
    lockForSending();

    // Ensure session exists
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = createSession(previewText);
    } else {
      updateSessionPreview(sessionId, previewText);
    }

    // Send message via hook - 传入 sessionId 以解决 React 异步状态问题
    await sendUserMessage(content, settings, attachments, sessionId);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] md:h-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden flex">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSettings={settings}
        onSave={handleSaveSettings}
      />

      {/* Sidebar - Desktop: inline, Mobile: fixed overlay */}
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block ${sidebarOpen ? 'w-[260px]' : 'w-0'} h-full transition-all duration-300 ease-in-out relative bg-[var(--bg-sidebar)] overflow-hidden`}
      >
        <div className="w-[260px] h-full">
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewChat={clearNewChat}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onDeleteSession={(id, e) => {
              e.stopPropagation();
              if (confirm("确定要删除这个会话吗?")) {
                deleteSession(id);
              }
            }}
          />
        </div>
      </div>

      {/* Mobile Sidebar - Fixed overlay with slide animation */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar Panel */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--bg-sidebar)] shadow-xl transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={(id) => {
              setActiveSessionId(id);
              setSidebarOpen(false); // 移动端选择会话后自动关闭
            }}
            onNewChat={() => {
              clearNewChat();
              setSidebarOpen(false); // 移动端新建会话后自动关闭
            }}
            onOpenSettings={() => {
              setIsSettingsOpen(true);
              setSidebarOpen(false); // 移动端打开设置后自动关闭
            }}
            onDeleteSession={(id, e) => {
              e.stopPropagation();
              if (confirm("确定要删除这个会话吗?")) {
                deleteSession(id);
              }
            }}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full grid grid-rows-[auto_1fr_auto] relative min-w-0 bg-[var(--bg-app)]">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 sticky top-0 bg-[var(--bg-app)]/80 backdrop-blur-sm z-10 transition-all border-b border-transparent">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-md transition-colors"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>
            <ModelSelector
              currentModel={settings.model}
              onModelChange={(modelId) =>
                handleSaveSettings({ ...settings, model: modelId })
              }
            />
          </div>
          <div className="text-xs font-mono text-[var(--text-tertiary)] flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-emerald-500"
              title="Connected via proxy"
            />
            <span className="opacity-50 hidden sm:inline">v2.1</span>
          </div>
        </header>

        {/* Chat Area */}
        <div className="relative min-h-0">
          <ChatArea messages={messages} isTyping={isTyping} onSend={handleSend} />
        </div>

        {/* Input Area */}
        <div className="bg-[var(--bg-app)]">
          <InputArea
            onSend={handleSend}
            onStop={stopGeneration}
            disabled={isTyping}
          />
        </div>
      </div>
    </div>
  );
}
