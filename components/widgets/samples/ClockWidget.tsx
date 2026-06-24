"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { createWidgetComponent } from "@/components/widgets/framework/WidgetFactory";
import type { WidgetRenderContext } from "@/components/widgets/framework/types";

function ClockContent() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div>
      <div>{now.toLocaleTimeString()}</div>
      <div>{now.toLocaleDateString()}</div>
    </div>
  );
}

export const clockWidgetDefinition = {
  id: "clock",
  title: "Clock",
  icon: Clock,
  renderContent: (_context: WidgetRenderContext) => <ClockContent />,
  renderFooter: () => <span>Time sync active</span>,
};

export const ClockWidget = createWidgetComponent(clockWidgetDefinition);
