"use client";

import { Dumbbell } from "lucide-react";
import { createWidgetComponent } from "@/components/widgets/framework/WidgetFactory";

export const gymWidgetDefinition = {
  id: "gym",
  title: "Gym",
  icon: Dumbbell,
  renderContent: () => (
    <div>
      <div>Workout status: idle</div>
      <div>Reps, sets, and streaks will appear here.</div>
    </div>
  ),
  renderFooter: () => <span>Training log ready</span>,
};

export const GymWidget = createWidgetComponent(gymWidgetDefinition);
