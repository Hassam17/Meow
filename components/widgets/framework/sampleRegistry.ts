"use client";

import { frameworkWidgetRegistry, registerWidget } from "@/components/widgets/framework/WidgetRegistry";
import {
  ClockWidget,
  clockWidgetDefinition,
} from "@/components/widgets/samples/ClockWidget";
import {
  FootballWidget,
  footballWidgetDefinition,
} from "@/components/widgets/samples/FootballWidget";
import { GitHubWidget, githubWidgetDefinition } from "@/components/widgets/samples/GitHubWidget";
import { GymWidget, gymWidgetDefinition } from "@/components/widgets/samples/GymWidget";
import { SpotifyWidget, spotifyWidgetDefinition } from "@/components/widgets/samples/SpotifyWidget";
import { WeatherWidget, weatherWidgetDefinition } from "@/components/widgets/samples/WeatherWidget";

export const sampleWidgetComponents = {
  clock: ClockWidget,
  spotify: SpotifyWidget,
  github: GitHubWidget,
  weather: WeatherWidget,
  football: FootballWidget,
  gym: GymWidget,
};

export const sampleWidgetDefinitions = [
  clockWidgetDefinition,
  spotifyWidgetDefinition,
  githubWidgetDefinition,
  weatherWidgetDefinition,
  footballWidgetDefinition,
  gymWidgetDefinition,
];

for (const definition of sampleWidgetDefinitions) {
  registerWidget(definition);
}

export { frameworkWidgetRegistry };
