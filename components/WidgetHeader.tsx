"use client";

import type { ComponentType, ReactNode } from "react";

export function WidgetHeader({
  title,
  icon: Icon,
  eyebrow,
  actions,
}: {
  title: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="widget-header">
      <div className="widget-header-copy">
        {eyebrow && <span className="widget-header-eyebrow">{eyebrow}</span>}
        <div className="widget-header-title-row">
          {Icon && <Icon size={14} strokeWidth={1.9} />}
          <span className="widget-header-title">{title}</span>
        </div>
      </div>
      {actions && <div className="widget-header-actions">{actions}</div>}
    </header>
  );
}
