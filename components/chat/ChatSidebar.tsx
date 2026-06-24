"use client";

import { useMemo } from "react";
import { ChevronRight, Cpu, Palette, Plug, SlidersHorizontal, WandSparkles } from "lucide-react";
import { THEME_PACKS } from "@/config/themes";
import type { AISettings } from "@/services/aiService";
import type { ChatDockState } from "@/components/chat/ChatHeader";

export function ChatSidebar({
  settings,
  dockState,
  widgets,
  onChangeSettings,
  onThemeJump,
}: {
  settings: AISettings;
  dockState: ChatDockState;
  widgets: Array<{ id: string; title: string; enabled: boolean; size: string }>;
  onChangeSettings: (patch: Partial<AISettings>) => void;
  onThemeJump: (theme: string) => void;
}) {
  const summary = useMemo(
    () => widgets.map((widget) => `${widget.id}:${widget.enabled ? "on" : "off"}:${widget.size}`).join(" · "),
    [widgets],
  );

  return (
    <aside className={`chat-sidebar ${dockState === "fullscreen" ? "expanded" : ""}`}>
      <div className="chat-sidebar-section">
        <div className="chat-sidebar-title">
          <SlidersHorizontal size={12} strokeWidth={1.9} />
          Settings
        </div>
        <label className="chat-field">
          <span>provider</span>
          <select
            value={settings.provider}
            onChange={(e) => onChangeSettings({ provider: e.target.value as AISettings["provider"] })}
          >
            <option value="local">Local</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollama">Ollama</option>
          </select>
        </label>
        <label className="chat-field">
          <span>model</span>
          <input
            value={settings.model}
            onChange={(e) => onChangeSettings({ model: e.target.value })}
            placeholder="assistant-lite"
          />
        </label>
        <label className="chat-field">
          <span>endpoint</span>
          <input
            value={settings.endpoint ?? ""}
            onChange={(e) => onChangeSettings({ endpoint: e.target.value })}
            placeholder="optional"
          />
        </label>
      </div>

      <div className="chat-sidebar-section">
        <div className="chat-sidebar-title">
          <Palette size={12} strokeWidth={1.9} />
          Themes
        </div>
        <div className="chat-theme-grid">
          {THEME_PACKS.map((theme) => (
            <button key={theme.id} type="button" className="chat-theme-btn" onClick={() => onThemeJump(theme.id)}>
              <span className="chat-theme-swatch">
                <span style={{ background: theme.swatch[0] }} />
                <span style={{ background: theme.swatch[1] }} />
                <span style={{ background: theme.swatch[2] }} />
              </span>
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-sidebar-section">
        <div className="chat-sidebar-title">
          <Plug size={12} strokeWidth={1.9} />
          Widgets
        </div>
        <div className="chat-widget-summary">{summary}</div>
      </div>

      <div className="chat-sidebar-section chat-command-hint">
        <div className="chat-sidebar-title">
          <WandSparkles size={12} strokeWidth={1.9} />
          Commands
        </div>
        <code>/theme</code>
        <code>/add-widget</code>
        <code>/remove-widget</code>
        <code>/show-widget</code>
        <code>/hide-widget</code>
        <code>/open</code>
      </div>
    </aside>
  );
}
