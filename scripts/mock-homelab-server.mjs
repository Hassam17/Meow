import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PORT = process.env.MOCK_HOMELAB_PORT ?? 8089;
const dataPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "mock", "homelab-status.json");

const server = createServer(async (req, res) => {
  if (req.url !== "/status") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found — try /status" }));
    return;
  }

  const body = await readFile(dataPath, "utf-8");
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`Mock homelab status server listening on http://localhost:${PORT}/status`);
  console.log(`Point HOMELAB_STATUS_URL at that URL in .env.local`);
});
