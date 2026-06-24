"use client";

import { Music2 } from "lucide-react";
import { createWidgetComponent } from "@/components/widgets/framework/WidgetFactory";

export const spotifyWidgetDefinition = {
  id: "spotify",
  title: "Spotify",
  icon: Music2,
  renderContent: () => (
    <div>
      <div>No active playback</div>
      <div>Connect a player to stream metadata here.</div>
    </div>
  ),
  renderFooter: () => <span>Playback source: local</span>,
};

export const SpotifyWidget = createWidgetComponent(spotifyWidgetDefinition);
