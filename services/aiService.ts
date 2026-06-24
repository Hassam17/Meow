export type AIProvider = "openai" | "anthropic" | "ollama" | "local";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type ChatContext = {
  theme: string;
  layoutMode: string;
  widgets: Array<{
    id: string;
    title: string;
    enabled: boolean;
    size: string;
  }>;
};

export type AISettings = {
  provider: AIProvider;
  model: string;
  endpoint?: string;
  apiKey?: string;
};

export function defaultAISettings(): AISettings {
  return {
    provider: "local",
    model: "assistant-lite",
    endpoint: "",
    apiKey: "",
  };
}

export function buildSystemPrompt(context: ChatContext) {
  const widgets = context.widgets
    .map((widget) => `- ${widget.id}: ${widget.title} (${widget.enabled ? "enabled" : "hidden"}, ${widget.size})`)
    .join("\n");

  return [
    "You are the dashboard assistant. Help the user manage their local dashboard, widgets, theme, and layout.",
    "Be concise, direct, and practical.",
    "When a command changes the UI, explain the result briefly.",
    "",
    `Theme: ${context.theme}`,
    `Layout: ${context.layoutMode}`,
    "Registered widgets:",
    widgets || "- none",
  ].join("\n");
}

export function createUserPayload(messages: ChatMessage[], context: ChatContext) {
  return {
    context,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };
}

export function mockAssistantStream(prompt: string) {
  const chunks = [
    "I can help manage widgets, theme, and layout.\n\n",
    "Try `/theme cyber` or `/hide-widget github`.\n\n",
    "Current request:\n",
    prompt,
  ];

  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 140));
        yield chunk;
      }
    },
  };
}
