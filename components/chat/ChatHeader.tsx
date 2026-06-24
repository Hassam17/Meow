"use client";

import { Maximize2, Minus, Pin, PinOff, Sparkles, X } from "lucide-react";

export type ChatDockState = "docked" | "undocked" | "minimized" | "fullscreen";

export function ChatHeader({
  title,
  dockState,
  onToggleDock,
  onMinimize,
  onFullscreen,
  onClose,
}: {
  title: string;
  dockState: ChatDockState;
  onToggleDock: () => void;
  onMinimize: () => void;
  onFullscreen: () => void;
  onClose: () => void;
}) {
  const isDocked = dockState === "docked";

  return (
    <header className="chat-header">
      <div className="chat-header-title">
        <span className="chat-header-badge">
          <Sparkles size={12} strokeWidth={1.9} />
        </span>
        <div>
          <div className="chat-header-name">{title}</div>
          <div className="chat-header-subtitle">Dashboard assistant</div>
        </div>
      </div>
      <div className="chat-header-actions">
        <button type="button" className="chat-icon-btn" onClick={onToggleDock} aria-label={isDocked ? "undock chat" : "dock chat"}>
          {isDocked ? <PinOff size={14} strokeWidth={1.9} /> : <Pin size={14} strokeWidth={1.9} />}
        </button>
        <button type="button" className="chat-icon-btn" onClick={onMinimize} aria-label="minimize chat">
          <Minus size={14} strokeWidth={1.9} />
        </button>
        <button type="button" className="chat-icon-btn" onClick={onFullscreen} aria-label="fullscreen chat">
          <Maximize2 size={14} strokeWidth={1.9} />
        </button>
        <button type="button" className="chat-icon-btn close" onClick={onClose} aria-label="close chat">
          <X size={14} strokeWidth={1.9} />
        </button>
      </div>
    </header>
  );
}
