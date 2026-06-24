"use client";

import { CloudSun } from "lucide-react";
import { createWidgetComponent } from "@/components/widgets/framework/WidgetFactory";

export const weatherWidgetDefinition = {
  id: "weather",
  title: "Weather",
  icon: CloudSun,
  renderContent: () => (
    <div>
      <div>--°</div>
      <div>Conditions will appear here.</div>
    </div>
  ),
  renderFooter: () => <span>Forecast placeholder</span>,
};

export const WeatherWidget = createWidgetComponent(weatherWidgetDefinition);
