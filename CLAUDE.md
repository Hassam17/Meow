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

> **Design system reference**: [`DESIGN_VARIATIONS.md`](./DESIGN_VARIATIONS.md) (full written spec) and [`DESIGN_VARIATIONS.html`](./DESIGN_VARIATIONS.html) (live mockup — open directly in a browser, no build step). The **"G — Chunky Blocks + Accent Border"** column, in both the Dark Mode and Light Mode sections, is the chosen direction.

**Direction**: "Chunky Blocks + Accent Border" — warm, dense, sticker/stamp-bordered cards. This deliberately replaces the earlier CRT/neon/terminal look. Both dark and light themes are first-class and fully designed; ship with a theme toggle.

| Token | Dark | Light |
|---|---|---|
| Page background | `#13100c` | `#d8cfbc` |
| Card/surface background | `#1e1a14` (`#1a1610` nested) | `#f5f0e6` (`#faf6f0` nested) |
| Border | `#3d3220` | `#7a6a52` |
| Sticker shadow | `#070604` | `#a89878` |
| Text primary | `#e8dfc8` | `#1c1810` |
| Text muted | `#4a4030` / `#3a3020` | `#9a8870` / `#b0a090` |
| Orange accent | `#ff6b2b` | `#e05a18` |
| Cyan/teal accent | `#00b4c8` | `#00768a` |

- **Layout**: A "namecard" header (logo/tagline/links left, live badge + tagline right) above a grid of "blocks". Paired modules (Now Playing/Currently Playing, Homelab/Stack) sit 2-up in a flex row; hero content (Currently Building) is a standalone full-width block with a `3px` orange-accent left border
- **Card treatment ("sticker/stamp")**: `border-radius: 12–16px`, `border: 1.5px solid` (border token), hard offset `box-shadow: 3-5px 3-5px 0` (shadow token, **no blur**)
- **Typography**: `DotGothic16` for the logo (`1.7rem`), section/field labels (`0.62rem`, uppercase, `letter-spacing: 0.14em`), and headline stat numbers (`2.2rem`, `line-height: 1` — the largest text on the page). `JetBrains Mono` for primary data values (`1.25rem`, `font-weight: 500`), sub text (`0.75rem`), and chips/pills/badges (`0.6–0.65rem`, uppercase)
- **Icons**: Lucide, 14×14px, `stroke-width: 1.75`, prefixed to section labels, links, and badges
- **Motion**: Subtle data transitions plus the hover-to-expand capsule interaction (below). No scanlines, no grain, no phosphor glow
- **Never use**: Inter, Roboto, Arial, system fonts, purple gradients, centered portfolio layouts, pure black/white, neon glow, CRT scanlines/grain, blurred shadows

---

## Interaction Pattern — Hover-to-Expand Capsules

Each block in a paired row is a flex item (`flex-grow: 1; flex-shrink: 1; flex-basis: 0%; min-width: 0`). On hover over a block:

1. Hovered block → `flex-grow: 2.5`; sibling(s) → `flex-grow: 0.65` — `transition: flex-grow 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
2. The shrunken sibling's primary value truncates with an ellipsis
3. The hovered block's border brightens to the orange accent and its sticker shadow offset increases slightly (pressed-forward feel)
4. A "more info" panel reveals below the existing content (`max-height`/`opacity` transition) with extra contextual data:
   - **Now Playing** → recently played tracks
   - **Currently Playing** → recently played games + hours
   - **Currently Building** → recent commits
   - **Homelab** → per-service uptime breakdown
   - **Stack** → what each tool is currently used for

Standalone full-width blocks (Currently Building) get steps 2–4 without the flex rearrangement — there are no siblings to shrink.

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
> 6. Apply full aesthetic per the Design System (Chunky Blocks + Accent Border, dark/light tokens, hover-to-expand capsules) — see `DESIGN_VARIATIONS.md`/`.html`
> 7. Deploy via Docker + Tailscale (see Phase 8 below)

---

## Environment Variables Needed
```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
STEAM_API_KEY=
STEAM_PROFILE_ID=76561199044933923
HOMELAB_STATUS_URL=
GITHUB_TOKEN=           # optional
```

## Deploy — Docker + Tailscale

```bash
# On the homelab machine, in this repo:
docker compose up -d --build

# Expose over Tailscale HTTPS (no domain, no cert config needed):
tailscale serve https / http://localhost:3000
# → reachable at https://nutmagcard.<tailnet>.ts.net from any tailnet device
```

Secrets are passed at runtime via `env_file: .env.local` — they are never baked into the image layer.

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
> Written under the old CRT aesthetic — re-check each against the Design System before implementing. The hover-to-expand capsule interaction (above) is now the primary interaction pattern.
- **Boot sequence intro**: brief retro-terminal "boot log" animation (dot-matrix text scrolling system checks) on first load, before the card resolves
- **Glyph-style status pulse**: thin strip of light (orange/cyan/cream) that pulses based on overall state — steady glow when everything's up, irregular flicker if a homelab service is down (Nothing Phone Glyph-inspired)
- **Personal uptime stat**: alongside homelab uptime %, a small readout like "hours since last commit" or "days running this build" — ties infra data back to the person, not just the systems

---

## Post-MVP Backlog (do not build until MVP ships)
- Shareable PNG snapshot of the card
- Visitor counter (monospace, bottom corner)
- Mobile stacked layout
- Konami code easter egg
- AI-generated daily tagline via Claude API
- Light/dark theme toggle — both fully designed (see Aesthetic section / `DESIGN_VARIATIONS.html`); wire up once core data flow ships