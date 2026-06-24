"use client";

import { motion } from "framer-motion";
import type { ComponentType, MouseEvent, KeyboardEvent, ReactNode } from "react";
import { WidgetBody } from "@/components/WidgetBody";
import { WidgetHeader } from "@/components/WidgetHeader";

const hoverMotion = {
  rest: { y: 0, scale: 1, boxShadow: "0 10px 40px rgba(0,0,0,0.3)" },
  hover: { y: -6, scale: 1.015, boxShadow: "0 20px 60px rgba(59,130,246,0.25)" },
  active: { scale: 0.99 },
};

export function WidgetContainer({
  title,
  icon,
  eyebrow,
  footer,
  children,
  className = "",
  interactive = false,
  tabIndex,
  onClick,
  onKeyDown,
}: {
  title: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  eyebrow?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  tabIndex?: number;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}) {
  return (
    <motion.article
      className={`widget-card ${className}`.trim()}
      data-interactive={interactive ? "true" : "false"}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="active"
      variants={hoverMotion}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
    >
      <WidgetHeader title={title} icon={icon} eyebrow={eyebrow} />
      <WidgetBody>{children}</WidgetBody>
      {footer && <footer className="widget-footer">{footer}</footer>}
    </motion.article>
  );
}
