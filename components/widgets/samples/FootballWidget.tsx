"use client";

import { Goal } from "lucide-react";
import { createWidgetComponent } from "@/components/widgets/framework/WidgetFactory";

export const footballWidgetDefinition = {
  id: "football",
  title: "Football",
  icon: Goal,
  renderContent: () => (
    <div>
      <div>Next match: TBD</div>
      <div>Match stats and standings can be wired later.</div>
    </div>
  ),
  renderFooter: () => <span>Fixture source ready</span>,
};

export const FootballWidget = createWidgetComponent(footballWidgetDefinition);
