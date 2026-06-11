// One-time helper to obtain SPOTIFY_REFRESH_TOKEN via the Authorization Code flow.
//
// Prerequisites:
//   1. Create an app at https://developer.spotify.com/dashboard
//   2. Add redirect URI exactly: http://127.0.0.1:8888/callback
//   3. Put the app's Client ID / Client Secret into .env.local as
//      SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET
//
// Run:  node scripts/spotify-auth.mjs
// It opens (or prints) an authorize URL, captures the redirect locally,
// exchanges the code for tokens, and prints SPOTIFY_REFRESH_TOKEN to paste
// into .env.local.

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const PORT = 8888;
const SCOPES = "user-read-currently-playing user-read-playback-state user-read-recently-played user-modify-playback-state";

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  const env = {};
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}

const env = loadEnvLocal();
const clientId = env.SPOTIFY_CLIENT_ID;
const clientSecret = env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in .env.local.\n" +
      "Create an app at https://developer.spotify.com/dashboard, add the redirect URI\n" +
      `${REDIRECT_URI}, and paste the Client ID/Secret into .env.local first.`
  );
  process.exit(1);
}

const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("client_id", clientId);
authorizeUrl.searchParams.set("scope", SCOPES);
authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);

console.log("\nOpen this URL in your browser and click Agree:\n");
console.log(authorizeUrl.toString());
console.log(`\nWaiting for the redirect to ${REDIRECT_URI} ...\n`);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== "/callback") {
    res.writeHead(404);
    res.end();
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(`Authorization failed: ${error}`);
    console.error(`Authorization failed: ${error}`);
    server.close();
    process.exit(1);
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Authorized — you can close this tab and return to the terminal.");

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", data);
      process.exit(1);
    }

    console.log("Success. Add this to .env.local:\n");
    console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}\n`);
  } catch (err) {
    console.error("Token exchange request failed:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT);
