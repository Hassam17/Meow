import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const PORT = 8888;

const SCOPES =
  "user-read-currently-playing user-read-playback-state user-read-recently-played user-modify-playback-state";

// ✅ FIXED ENV LOADER (ROBUST)
function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  const env = {};

  const file = readFileSync(envPath, "utf-8");

  for (const rawLine of file.split(/\r?\n/)) {
    const line = rawLine.trim();

    // skip empty lines + comments
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();

    env[key] = value;
  }

  return env;
}

const env = loadEnvLocal();

const clientId = env.SPOTIFY_CLIENT_ID;
const clientSecret = env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("\n❌ Missing Spotify credentials\n");
  console.error(
    "Fix .env.local like this:\n" +
      "SPOTIFY_CLIENT_ID=xxx\n" +
      "SPOTIFY_CLIENT_SECRET=yyy\n"
  );
  process.exit(1);
}

const authorizeUrl = new URL(
  "https://accounts.spotify.com/authorize"
);

authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("client_id", clientId);
authorizeUrl.searchParams.set("scope", SCOPES);
authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);

console.log("\n🔗 Open this URL:\n");
console.log(authorizeUrl.toString());
console.log(`\n⏳ Waiting at ${REDIRECT_URI} ...\n`);

const server = createServer(async (req, res) => {
  if (req.method !== "GET") {
    res.writeHead(405);
    res.end("Method Not Allowed");
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);

  if (url.pathname !== "/callback") {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("❌ Spotify error:", error);
    res.writeHead(400);
    res.end("Auth failed");
    server.close();
    process.exit(1);
  }

  res.writeHead(200);
  res.end("Authorized. Close this tab.");

  try {
    const basicAuth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }),
      }
    );

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("❌ Token error:", data);
      process.exit(1);
    }

    console.log("\n✅ SUCCESS!\n");
    console.log(
      "Add this to .env.local:\n"
    );
    console.log(
      `SPOTIFY_REFRESH_TOKEN=${data.refresh_token}\n`
    );
  } catch (err) {
    console.error("❌ Token exchange failed:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT);