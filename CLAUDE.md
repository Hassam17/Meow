# CLAUDE.md — NutMagCard

## What this is
A living developer identity card for NutMag2469. A single webpage that shows real-time data — what I'm listening to, what game I'm playing, whether my homelab is alive, and what I'm currently building. Not a portfolio. Not a resume. A living identity artifact.

---

## Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + custom CSS variables
- **Animations**: Framer Motion
- **Deployment**: Self-hosted Docker (runs on the homelab — thematically fitting since the card reports on the same infra it lives on). Accessed via **Tailscale** (MagicDNS hostname + `tailscale serve` for automatic HTTPS within the tailnet) — no public domain purchase, no separate reverse proxy/Let's Encrypt setup, fully free and private
- **Language**: TypeScript throughout

---

## Aesthetic — never deviate from this

| Token | Value |
|---|---|
| Background | `#0d0d0f` |
| Surface | `#141416` |
| Orange accent | `#ff6b2b` |
| Cyan accent | `#00e5ff` |
| Warm accent | `#e8dfc8` — vintage keycap cream, used sparingly (panel borders, highlight/active states, "Currently Building" callout) |
| Text primary | `#f0f0f0` |
| Text muted | `#555560` |

- **Vibe**: Lofi-cyberpunk fused with retro-tech hardware (Nothing Phone dot-matrix/deconstructed design language + warm vintage-keyboard tones). Cozy but technical — like a CRT glowing on a dark desk next to a cream mechanical keyboard. 2am dual-monitor energy
- **Layout**: Asymmetric, deconstructed HUD — not a centered card
- **Typography**: `DotGothic16` (dot-matrix display face) for headers, labels, and live-indicator readouts; `JetBrains Mono` for body text and data
- **Motion**: Subtle only. Slow pulse on live indicators, smooth data transitions, grain + scanline (CRT) overlay on background, soft phosphor-glow on "live" elements
- **Never use**: Inter, Roboto, Arial, system fonts, purple gradients, centered portfolio layouts

---

## Modules

### 1. Identity Block
- Tag: `NutMag2469`
- Tagline: `"building things at 2am"` (static for now)
- Links: GitHub, homelab status
- Logo: minimal NutMag icon mark (single icon, horizontal format, orange/cyan on dark)

### 2. Now Playing 🎵
- Source: Last.fm API
- Shows: track name, artist, album art (blurred as background accent)
- Live: animated equalizer bars when track is playing
- Fallback: last played track + "X minutes ago" timestamp
- Env var: `LASTFM_API_KEY`, `LASTFM_USERNAME`

### 3. Currently Playing 🎮
- Source: Steam API (public profile)
- Shows: game name, hours this session, total hours
- Fallback: last played game + time since
- Env var: `STEAM_API_KEY`, `STEAM_PROFILE_ID`

### 4. Homelab Status 🖥️
- Source: self-hosted `/status` endpoint on homelab server
- Shows: row of service dots (green = up, red = down) + uptime %
- Cached every 60s — do not hammer the endpoint
- Env var: `HOMELAB_STATUS_URL`
- Expected response shape:
```json
{
  "services": [
    { "name": "Navidrome", "status": "up", "uptime": "99.8%" },
    { "name": "Vaultwarden", "status": "up", "uptime": "100%" }
  ],
  "last_checked": "2026-06-08T14:32:00Z"
}
```

### 5. Currently Building 🔨
- Source: hardcoded string for MVP, GitHub latest commit as stretch goal
- Update this manually in `/config/current.ts` — single exported string
- Env var (optional): `GITHUB_TOKEN` for commit pulling

### 6. Stack Chips
- Static list of pills: Unity, Python, TypeScript, Docker, Claude Code
- Max 8 chips — do not bloat this section

---

## Project Structure
```
/
├── app/
│   ├── page.tsx              # Main card page
│   ├── layout.tsx            # Root layout, fonts, metadata
│   └── api/
│       ├── now-playing/      # Last.fm proxy (hides API key)
│       ├── currently-playing/ # Steam proxy
│       └── homelab/          # Homelab status proxy
├── components/
│   ├── IdentityBlock.tsx
│   ├── NowPlaying.tsx
│   ├── CurrentlyPlaying.tsx
│   ├── HomelabStatus.tsx
│   ├── CurrentlyBuilding.tsx
│   └── StackChips.tsx
├── config/
│   └── current.ts            # "Currently building" string lives here
├── lib/
│   ├── lastfm.ts
│   ├── steam.ts
│   └── homelab.ts
├── styles/
│   └── globals.css           # CSS variables, grain overlay, base styles
├── CLAUDE.md                 # This file
└── .env.local                # All API keys — never commit this
```

---

## API Routes — always proxy, never expose keys client-side

All external API calls go through `/app/api/` routes. The client only ever calls internal Next.js endpoints. Never put API keys in client components.

Polling interval: 30s for Now Playing, 60s for everything else.

---

## Current Focus
> **MVP — get data flowing before touching UI**
> 1. Set up Next.js project, Tailwind, Framer Motion
> 2. Build Last.fm API route + NowPlaying component (data only, unstyled)
> 3. Build Steam API route + CurrentlyPlaying component (data only, unstyled)
> 4. Build homelab status endpoint on server + proxy route
> 5. Wire up all data, confirm everything returns correctly
> 6. Apply full aesthetic — layout, colors, fonts, animations, grain
> 7. Deploy to Vercel

---

## Environment Variables Needed
```
LASTFM_API_KEY=
LASTFM_USERNAME=
STEAM_API_KEY=
STEAM_PROFILE_ID=
HOMELAB_STATUS_URL=
GITHUB_TOKEN=           # optional, for latest commit
```

---

## Still to Confirm (fill these in before starting)
- [ ] Steam profile ID + confirm profile is public
- [ ] Last.fm username
- [ ] Which homelab services to show in status row (Navidrome/Vaultwarden in the example above — confirm if real or placeholder, and add the full list)
- [x] Domain for deployment — **No purchase needed**: serving over Tailscale instead (MagicDNS hostname / `tailscale serve` for HTTPS within the tailnet). Keeps the whole stack free and private; `tailscale funnel` remains an option later if public access is ever wanted
- [x] Vercel or self-hosted Docker? — **Self-hosted Docker**
- [x] Custom logo file ready or generate one? — **Generate**: minimal NutMag icon mark as inline SVG, dot-matrix-inspired, orange/cyan on dark

---

## Retro Polish & Interaction Ideas (weave in during the aesthetic pass — step 6 — or just after)
- **Boot sequence intro**: brief retro-terminal "boot log" animation (dot-matrix text scrolling system checks) on first load, before the card resolves
- **Glyph-style status pulse**: thin strip of light (orange/cyan/cream) that pulses based on overall state — steady glow when everything's up, irregular flicker if a homelab service is down (Nothing Phone Glyph-inspired)
- **Personal uptime stat**: alongside homelab uptime %, a small readout like "hours since last commit" or "days running this build" — ties infra data back to the person, not just the systems
- **CRT flicker micro-interactions**: brief scanline-glitch on hover/focus for interactive elements (links, chips), done with Framer Motion
- **Time-of-day grain intensity**: grain/scanline overlay opacity shifts subtly with local time — heavier "static" late at night, reinforcing the "2am energy"

---

## Post-MVP Backlog (do not build until MVP ships)
- Shareable PNG snapshot of the card
- Visitor counter (monospace, bottom corner)
- Mobile stacked layout
- Konami code easter egg
- AI-generated daily tagline via Claude API
- Theme toggle (orange/cyan vs all-cyan night mode)