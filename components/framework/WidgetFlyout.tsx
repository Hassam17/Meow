"use client";

// Hover-expansion panel. Rendered through a portal with fixed positioning
// tracked from the anchor card's bounding rect, so it overlays siblings
// instead of pushing them around — the root fix for the old .more-panel /
// flex-grow clipping bugs. The card and the flyout share the shell's
// open-state handlers (with a close delay), so moving the pointer across the
// gap doesn't dismiss it.

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { ExpandDirection } from "@/config/widgets";

const GAP = 8;

export function WidgetFlyout({
  anchor,
  open,
  direction,
  onEnter,
  onLeave,
  children,
}: {
  anchor: HTMLElement | null;
  open: boolean;
  direction: ExpandDirection;
  onEnter: () => void;
  onLeave: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setRect(null);
      return;
    }
    const update = () => setRect(anchor.getBoundingClientRect());
    update();
    // capture-phase scroll catches the inner scroll containers too
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchor]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && rect && (
        <motion.div
          className="flyout"
          style={{
            left: rect.left,
            width: rect.width,
            ...(direction === "down"
              ? { top: rect.bottom + GAP }
              : { bottom: window.innerHeight - rect.top + GAP }),
          }}
          initial={{ opacity: 0, y: direction === "down" ? -6 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: direction === "down" ? -6 : 6 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
