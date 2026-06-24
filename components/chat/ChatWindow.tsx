"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareText, PanelRightClose, PanelRightOpen } from "lucide-react";
import { ChatHeader, type ChatDockState } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { parseCommand, type ChatCommand } from "@/services/commandParser";
import {
  buildSystemPrompt,
  createUserPayload,
  defaultAISettings,
  mockAssistantStream,
  type AISettings,
  type ChatContext,
  type ChatMessage as AIMessage,
} from "@/services/aiService";
import { useLayout } from "@/components/LayoutProvider";
import { useTheme } from "@/components/ThemeProvider";
import { widgetRegistry } from "@/widgets/registry";
import type { ThemeMode } from "@/lib/theme";

type ChatWindowState = {
  dockState: ChatDockState;
  position: { x: number; y: number };
  size: { width: number; height: number };
  settings: AISettings;
  open: boolean;
};

const STORAGE_KEY = "nutmag-chat-state";
const HISTORY_KEY = "nutmag-chat-history";

function defaultState(): ChatWindowState {
  return {
    dockState: "docked",
    position: { x: 0, y: 0 },
    size: { width: 420, height: 640 },
    settings: defaultAISettings(),
    open: true,
  };
}

function readStoredState(): ChatWindowState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<ChatWindowState>;
    return {
      ...defaultState(),
      ...parsed,
      position: {
        x: typeof parsed.position?.x === "number" ? parsed.position.x : 0,
        y: typeof parsed.position?.y === "number" ? parsed.position.y : 0,
      },
      size: {
        width: typeof parsed.size?.width === "number" ? parsed.size.width : 420,
        height: typeof parsed.size?.height === "number" ? parsed.size.height : 640,
      },
      settings: { ...defaultAISettings(), ...(parsed.settings ?? {}) },
    };
  } catch {
    return defaultState();
  }
}

function readStoredHistory(): AIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AIMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function chatContext(
  layout: { layoutMode: string; grid: { rows: number; columns: number; gap: number; debug: boolean }; widgets: Array<{ id: string; hidden: boolean }> },
  theme: string,
): ChatContext {
  return {
    theme,
    layoutMode: layout.layoutMode,
    grid: layout.grid,
    widgets: widgetRegistry.map((widget) => {
      const current = layout.widgets.find((entry) => entry.id === widget.id);
      return {
        id: widget.id,
        title: widget.title,
        enabled: current ? !current.hidden : widget.enabled,
        size: widget.size,
      };
    }),
  };
}

export function ChatWindow({ embedded = false }: { embedded?: boolean }) {
  const { layout, updateInstance, revealWidgetInRegion } = useLayout();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<ChatWindowState>(defaultState);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setState(readStoredState());
    setMessages(readStoredHistory());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [mounted, state]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  }, [mounted, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    function openAssistant() {
      setState((current) => ({ ...current, dockState: embedded ? current.dockState : "docked", open: true }));
    }
    window.addEventListener("nutmag-open-assistant", openAssistant as EventListener);
    return () => window.removeEventListener("nutmag-open-assistant", openAssistant as EventListener);
  }, [embedded]);

  const context = useMemo(() => chatContext(layout, theme), [layout, theme]);
  const systemPrompt = useMemo(() => buildSystemPrompt(context), [context]);

  async function streamReply(history: AIMessage[], assistantId: string) {
    const payload = createUserPayload(history, context);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        systemPrompt,
        settings: state.settings,
      }),
    });

    if (!response.ok || !response.body) {
      const fallback = mockAssistantStream(history.at(-1)?.content ?? "");
      let text = "";
      for await (const chunk of fallback) text += chunk;
      return text;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setMessages((current) =>
        current.map((message) => (message.id === assistantId ? { ...message, content: text } : message)),
      );
    }
    text += decoder.decode();
    return text;
  }

  async function handleSubmit() {
    const value = draft.trim();
    if (!value || isStreaming) return;
    setError(null);
    setDraft("");

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: value,
      createdAt: Date.now(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    const parsed = parseCommand(value);
    if (parsed.kind === "command") {
      const command = parsed.command;
      const reply = executeCommand(command);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          createdAt: Date.now(),
        },
      ]);
      return;
    }

    setIsStreaming(true);
    const assistantId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      { id: assistantId, role: "assistant", content: "", createdAt: Date.now() },
    ]);

    try {
      const text = await streamReply(nextMessages, assistantId);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, content: text || "No response returned." } : message,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "assistant request failed");
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, content: "Assistant request failed." } : message,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function executeCommand(command: ChatCommand) {
    switch (command.type) {
      case "theme": {
        const next: ThemeMode = command.value ?? "cyber";
        setTheme(next);
        return `Theme set to ${next}.`;
      }
      case "add-widget":
      case "show-widget": {
        if (!command.widgetId) return "Specify a widget id.";
        updateInstance(command.widgetId as never, { hidden: false });
        return `Widget ${command.widgetId} is visible.`;
      }
      case "remove-widget":
      case "hide-widget": {
        if (!command.widgetId) return "Specify a widget id.";
        if (command.widgetId === "hub-settings") return "The hub cannot hide itself.";
        updateInstance(command.widgetId as never, { hidden: true });
        return `Widget ${command.widgetId} is hidden.`;
      }
      case "open": {
        if (command.target === "chat" || !command.target) {
          setState((current) => ({ ...current, dockState: "fullscreen", open: true }));
          return "Chat opened in fullscreen.";
        }
        revealWidgetInRegion(command.target as never, "center");
        return `Widget ${command.target} was revealed.`;
      }
    }
  }

  function updateSettings(patch: Partial<AISettings>) {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  }

  function toggleDock() {
    setState((current) => ({
      ...current,
      dockState: current.dockState === "docked" ? "undocked" : "docked",
    }));
  }

  function minimize() {
    setState((current) => ({ ...current, dockState: "minimized", open: false }));
  }

  function fullscreen() {
    setState((current) => ({ ...current, dockState: "fullscreen", open: true }));
  }

  function close() {
    setState((current) => ({ ...current, dockState: "minimized", open: false }));
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (state.dockState !== "undocked" || event.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: event.clientX - state.position.x, y: event.clientY - state.position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging || !dragStart.current) return;
    const nextX = event.clientX - dragStart.current.x;
    const nextY = event.clientY - dragStart.current.y;
    setState((current) => ({ ...current, position: { x: nextX, y: nextY } }));
  }

  function endDrag() {
    setIsDragging(false);
    dragStart.current = null;
  }

  if (!mounted) return null;

  if (state.dockState === "minimized" && !state.open) {
    return (
      <motion.button
        type="button"
        className={`chat-launcher${embedded ? " embedded" : ""}`}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        onClick={() => setState((current) => ({ ...current, dockState: "docked", open: true }))}
      >
        <MessageSquareText size={16} strokeWidth={1.9} />
        Assistant
      </motion.button>
    );
  }

  const panelStyle = embedded
    ? {
        position: "relative" as const,
        inset: "auto",
        right: "auto",
        bottom: "auto",
        width: "100%",
        height: "100%",
        transform: "none",
      }
    : state.dockState === "fullscreen"
      ? { inset: 16 }
      : state.dockState === "undocked"
        ? {
            right: 16,
            bottom: 16,
            transform: `translate3d(${state.position.x}px, ${state.position.y}px, 0)`,
            width: state.size.width,
            height: state.size.height,
          }
        : {
            right: 16,
            bottom: 16,
            width: state.size.width,
            height: state.size.height,
          };

  return (
    <motion.section
      className={`chat-window ${state.dockState}${embedded ? " embedded" : ""}`}
      style={panelStyle}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <ChatHeader
        title="AI Assistant"
        dockState={state.dockState}
        onToggleDock={toggleDock}
        onMinimize={minimize}
        onFullscreen={fullscreen}
        onClose={close}
      />

      <div className={`chat-shell ${state.dockState === "fullscreen" ? "fullscreen" : ""}`}>
        <div className="chat-main">
          <div className="chat-scroll" role="log" aria-live="polite">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                >
                  <ChatMessage message={message} streaming={isStreaming && message.role === "assistant" && message.content === ""} />
                </motion.div>
              ))}
            </AnimatePresence>
            {isStreaming && (
              <div className="chat-typing">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && <div className="chat-error">{error}</div>}
          <ChatInput value={draft} onChange={setDraft} onSubmit={handleSubmit} disabled={isStreaming} />
        </div>

        {(state.dockState === "fullscreen" || state.dockState === "undocked") && (
          <ChatSidebar
            settings={state.settings}
            dockState={state.dockState}
            widgets={context.widgets}
            onChangeSettings={updateSettings}
            onThemeJump={(next) => setTheme(next as ThemeMode)}
          />
        )}
      </div>

      {state.dockState === "undocked" && (
        <div className="chat-drag-handle" onPointerDown={startDrag}>
          <PanelRightOpen size={12} strokeWidth={1.9} />
          Drag
          {isDragging && <PanelRightClose size={12} strokeWidth={1.9} />}
        </div>
      )}
    </motion.section>
  );
}
