"use client";

import { memo, useMemo, type ReactNode } from "react";
import { Bot, Code2, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/services/aiService";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlightCode(code: string, language: string) {
  const escaped = escapeHtml(code);
  if (!language) return escaped;

  const keywords: Record<string, string[]> = {
    ts: ["const", "let", "var", "function", "return", "type", "interface", "import", "from", "export", "async", "await", "if", "else"],
    tsx: ["const", "let", "var", "function", "return", "type", "interface", "import", "from", "export", "async", "await", "if", "else"],
    js: ["const", "let", "var", "function", "return", "import", "from", "export", "async", "await", "if", "else"],
    jsx: ["const", "let", "var", "function", "return", "import", "from", "export", "async", "await", "if", "else"],
    json: ["true", "false", "null"],
    css: ["display", "position", "grid", "flex", "color", "background", "border", "padding", "margin"],
    bash: ["git", "npm", "pnpm", "yarn", "cd", "ls", "cat", "curl", "docker"],
  };

  const list = keywords[language.toLowerCase()] ?? [];
  if (list.length === 0) return escaped;

  return list.reduce(
    (acc, keyword) =>
      acc.replace(
        new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"),
        `<span class="chat-token">${keyword}</span>`,
      ),
    escaped,
  );
}

function parseInline(text: string) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    if (match[1]) parts.push(<code key={`${match.index}-code`} className="chat-inline-code">{match[1]}</code>);
    else if (match[2]) parts.push(<strong key={`${match.index}-bold`}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={`${match.index}-em`}>{match[3]}</em>);
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function renderMarkdown(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const language = fence[1] ?? "";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      const code = codeLines.join("\n");
      nodes.push(
        <pre className="chat-code" key={`code-${i}`}>
          <div className="chat-code-head">
            <Code2 size={12} strokeWidth={1.8} />
            <span>{language || "code"}</span>
          </div>
          <code
            className="chat-code-body"
            dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
          />
        </pre>,
      );
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^#{1,3}/)?.[0].length ?? 1;
      const text = line.replace(/^#{1,3}\s+/, "");
      const Tag = `h${Math.min(level, 3)}` as "h1" | "h2" | "h3";
      nodes.push(<Tag className="chat-heading" key={`h-${i}`}>{parseInline(text)}</Tag>);
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i += 1;
      }
      nodes.push(
        <ul className="chat-list" key={`list-${i}`}>
          {items.map((item, idx) => (
            <li key={`${item}-${idx}`}>{parseInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraph: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^```/.test(lines[i]) && !/^#{1,3}\s+/.test(lines[i]) && !/^[-*]\s+/.test(lines[i])) {
      paragraph.push(lines[i]);
      i += 1;
    }
    nodes.push(
      <p className="chat-paragraph" key={`p-${i}`}>
        {paragraph.map((segment, idx) => (
          <span key={`${segment}-${idx}`}>
            {idx > 0 && <br />}
            {parseInline(segment)}
          </span>
        ))}
      </p>,
    );
  }

  return nodes;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  streaming = false,
}: {
  message: ChatMessageType;
  streaming?: boolean;
}) {
  const body = useMemo(() => renderMarkdown(message.content), [message.content]);

  return (
    <article className={`chat-message ${message.role}`}>
      <div className="chat-message-avatar" aria-hidden>
        {message.role === "user" ? <User size={14} strokeWidth={1.9} /> : <Bot size={14} strokeWidth={1.9} />}
      </div>
      <div className="chat-message-body">
        <div className="chat-message-meta">
          <span>{message.role}</span>
          {streaming && <span className="chat-streaming-dot" aria-hidden />}
        </div>
        <div className="chat-message-content">{body}</div>
      </div>
    </article>
  );
});
