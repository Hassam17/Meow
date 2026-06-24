"use client";

import { Github } from "lucide-react";
import { createWidgetComponent } from "@/components/widgets/framework/WidgetFactory";

export const githubWidgetDefinition = {
  id: "github",
  title: "GitHub",
  icon: Github,
  renderContent: () => (
    <div>
      <div>Latest activity unavailable.</div>
      <div>Repository and commit summaries will appear here.</div>
    </div>
  ),
  renderFooter: () => <span>Status feed ready</span>,
};

export const GitHubWidget = createWidgetComponent(githubWidgetDefinition);
