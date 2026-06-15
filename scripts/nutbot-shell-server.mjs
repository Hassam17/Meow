import { WebSocketServer } from "ws";
import * as pty from "node-pty";

const PORT = Number(process.env.NUTBOT_SHELL_PORT ?? 4001);
const HOST = "127.0.0.1";
const ENABLED = process.env.NUTBOT_SHELL_ENABLED === "true";
const TOKEN = process.env.NUTBOT_SHELL_TOKEN ?? "";

if (!ENABLED || !TOKEN) {
  console.error("nutbot shell server refused to start.");
  console.error("Set NUTBOT_SHELL_ENABLED=true and NUTBOT_SHELL_TOKEN=<secret> to opt in.");
  process.exit(1);
}

const wss = new WebSocketServer({
  host: HOST,
  port: PORT,
  shouldHandle(request) {
    try {
      const url = new URL(request.url ?? "/", `ws://${HOST}:${PORT}`);
      return url.searchParams.get("token") === TOKEN;
    } catch {
      return false;
    }
  },
});

console.log("=".repeat(60));
console.log("nutbot real-shell DEMO server");
console.log(`listening on ws://${HOST}:${PORT} (localhost only)`);
console.log("");
console.log("DEV-ONLY. Anyone who connects gets a real shell on this");
console.log("machine with your user's permissions. Do not expose this");
console.log("port via Tailscale, port forwarding, or any proxy.");
console.log("=".repeat(60));

wss.on("connection", (ws, request) => {
  const url = new URL(request.url ?? "/", `ws://${HOST}:${PORT}`);
  if (url.searchParams.get("token") !== TOKEN) {
    ws.close(1008, "invalid token");
    return;
  }

  const shell = process.env.SHELL ?? "/bin/zsh";
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  });

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  });

  ptyProcess.onExit(() => {
    if (ws.readyState === ws.OPEN) ws.close();
  });

  // Messages prefixed with a NUL byte are resize control messages
  // (`{"cols":N,"rows":M}`); everything else is raw keystroke input.
  ws.on("message", (data, isBinary) => {
    if (!isBinary && data.length > 0 && data[0] === 0) {
      try {
        const { cols, rows } = JSON.parse(data.subarray(1).toString("utf8"));
        if (cols > 0 && rows > 0) ptyProcess.resize(cols, rows);
      } catch {
        // ignore malformed resize messages
      }
      return;
    }
    ptyProcess.write(data.toString("utf8"));
  });

  ws.on("close", () => {
    ptyProcess.kill();
  });
});
