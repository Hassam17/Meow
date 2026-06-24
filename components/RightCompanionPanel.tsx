"use client";

import { useState } from "react";
import { Sparkles, PanelRight } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";

export function RightCompanionPanel() {
  const [open, setOpen] = useState(true);

  return (
    <aside className={`right-companion-panel${open ? " open" : " collapsed"}`}>
      <div className="right-companion-head">
        <div>
          <div className="right-companion-kicker">
            <Sparkles size={12} strokeWidth={1.9} />
            AI Assistant
          </div>
          <div className="right-companion-title">Companion Panel</div>
        </div>
        <button type="button" className="right-companion-toggle" onClick={() => setOpen((current) => !current)}>
          <PanelRight size={14} strokeWidth={1.9} />
        </button>
      </div>
      {open && (
        <div className="right-companion-body">
          <ChatWindow embedded />
          <div className="right-companion-mini" />
        </div>
      )}
    </aside>
  );
}
