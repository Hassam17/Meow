"use client";

import type { ReactNode } from "react";

export function WidgetBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`widget-body ${className}`.trim()}>{children}</div>;
}
