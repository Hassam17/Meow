"use client";

// Click-expansion: a centered modal with the same chunky-card chrome,
// rendered through a portal over a dimmed backdrop. Escape or backdrop
// click closes it.

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function WidgetOverlay({
  open,
  onClose,
  title,
  Icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  Icon: LucideIcon;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="overlay-card"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="overlay-head">
              <div className="block-label overlay-title">
                <Icon size={14} strokeWidth={1.75} />
                {title}
              </div>
              <button type="button" className="overlay-close" onClick={onClose} aria-label={`close ${title}`}>
                <X size={12} strokeWidth={2} />
              </button>
            </div>
            <div className="overlay-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
