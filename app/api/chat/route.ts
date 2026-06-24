import { buildSystemPrompt, type AISettings } from "@/services/aiService";

type RequestBody = {
  messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }>;
  context: { theme: string; layoutMode: string; widgets: Array<{ id: string; title: string; enabled: boolean; size: string }> };
  settings: AISettings;
  systemPrompt?: string;
};

function textStream(chunks: AsyncIterable<string>) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
      } finally {
        controller.close();
      }
    },
  });
}

async function* localStream(input: RequestBody) {
  const prompt = input.messages.at(-1)?.content ?? "dashboard";
  const response = [
    "I can see the current dashboard state.\n\n",
    `Theme: ${input.context.theme}\n`,
    `Layout: ${input.context.layoutMode}\n`,
    `Widgets: ${input.context.widgets.filter((widget) => widget.enabled).map((widget) => widget.id).join(", ")}\n\n`,
    `Request: ${prompt}`,
  ];

  for (const chunk of response) {
    await new Promise((resolve) => setTimeout(resolve, 90));
    yield chunk;
  }
}

async function streamOpenAI(input: RequestBody) {
  const apiKey = input.settings.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = input.settings.model || process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "system", content: input.systemPrompt ?? buildSystemPrompt(input.context) }, ...input.messages],
    }),
  });

  if (!response.ok || !response.body) return null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return (async function* () {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let lineBreak = buffer.indexOf("\n");
      while (lineBreak >= 0) {
        const line = buffer.slice(0, lineBreak).trim();
        buffer = buffer.slice(lineBreak + 1);
        lineBreak = buffer.indexOf("\n");
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) yield chunk;
        } catch {
          // ignore malformed chunks
        }
      }
    }
  })();
}

async function streamAnthropic(input: RequestBody) {
  const apiKey = input.settings.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = input.settings.model || process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 1024,
      system: input.systemPrompt ?? buildSystemPrompt(input.context),
      messages: input.messages.filter((message) => message.role !== "system"),
    }),
  });

  if (!response.ok || !response.body) return null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return (async function* () {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let lineBreak = buffer.indexOf("\n");
      while (lineBreak >= 0) {
        const line = buffer.slice(0, lineBreak).trim();
        buffer = buffer.slice(lineBreak + 1);
        lineBreak = buffer.indexOf("\n");
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const parsed = JSON.parse(payload) as { type?: string; delta?: { text?: string } };
          const chunk = parsed.delta?.text;
          if (chunk) yield chunk;
        } catch {
          // ignore malformed chunks
        }
      }
    }
  })();
}

async function streamOllama(input: RequestBody) {
  const baseUrl = input.settings.endpoint || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = input.settings.model || process.env.OLLAMA_MODEL || "llama3.2";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "system", content: input.systemPrompt ?? buildSystemPrompt(input.context) }, ...input.messages],
    }),
  });

  if (!response.ok || !response.body) return null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return (async function* () {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let lineBreak = buffer.indexOf("\n");
      while (lineBreak >= 0) {
        const line = buffer.slice(0, lineBreak).trim();
        buffer = buffer.slice(lineBreak + 1);
        lineBreak = buffer.indexOf("\n");
        if (!line) continue;
        try {
          const parsed = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
          if (parsed.message?.content) yield parsed.message.content;
          if (parsed.done) return;
        } catch {
          // ignore malformed chunks
        }
      }
    }
  })();
}

export async function POST(req: Request) {
  const body = (await req.json()) as RequestBody;
  const provider = body.settings.provider;

  const source =
    provider === "openai"
      ? await streamOpenAI(body)
      : provider === "anthropic"
        ? await streamAnthropic(body)
        : provider === "ollama"
          ? await streamOllama(body)
          : null;

  const stream = source ?? localStream(body);
  return new Response(textStream(stream), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
