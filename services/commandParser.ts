import type { ThemeMode } from "@/lib/theme";
import type { WidgetRegistryEntry } from "@/widgets/registry";

export type ChatCommand =
  | { type: "theme"; value?: ThemeMode }
  | { type: "add-widget"; widgetId: string }
  | { type: "remove-widget"; widgetId: string }
  | { type: "show-widget"; widgetId: string }
  | { type: "hide-widget"; widgetId: string }
  | { type: "open"; target?: string };

export type CommandParseResult =
  | { kind: "command"; command: ChatCommand }
  | { kind: "message" };

export function parseCommand(input: string): CommandParseResult {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return { kind: "message" };

  const [rawName, ...rest] = trimmed.slice(1).split(/\s+/);
  const name = rawName.toLowerCase();
  const arg = rest.join(" ").trim();

  switch (name) {
    case "theme":
      return { kind: "command", command: { type: "theme", value: arg as ThemeMode | undefined } };
    case "add-widget":
      return { kind: "command", command: { type: "add-widget", widgetId: arg } };
    case "remove-widget":
      return { kind: "command", command: { type: "remove-widget", widgetId: arg } };
    case "show-widget":
      return { kind: "command", command: { type: "show-widget", widgetId: arg } };
    case "hide-widget":
      return { kind: "command", command: { type: "hide-widget", widgetId: arg } };
    case "open":
      return { kind: "command", command: { type: "open", target: arg || undefined } };
    default:
      return { kind: "message" };
  }
}

export function buildCommandHelp(registry: WidgetRegistryEntry[]) {
  return [
    "/theme [cyber|retro|glass|football-manager|mission-control|minimal]",
    "/add-widget <id>",
    "/remove-widget <id>",
    "/show-widget <id>",
    "/hide-widget <id>",
    "/open [widget|chat]",
    "",
    `Widgets: ${registry.map((w) => w.id).join(", ")}`,
  ].join("\n");
}
