"use client";

import { Send } from "lucide-react";
import { useEffect, useRef } from "react";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  return (
    <form
      className="chat-input-wrap"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        ref={ref}
        className="chat-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask the dashboard assistant..."
        rows={1}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <button type="submit" className="chat-send-btn" disabled={disabled || value.trim().length === 0}>
        <Send size={14} strokeWidth={1.9} />
      </button>
    </form>
  );
}
