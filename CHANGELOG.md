# Changelog

This file tracks the meaningful work done on the project so far.

## Current State

- App shell, widget framework, and production build are working.
- `npm run lint` passes.
- `npm run build` passes.
- Production build uses Webpack instead of Turbopack.

## Major Changes So Far

### 1. Hydration and render-loop fixes

- Added `suppressHydrationWarning` to the `<body>` boundary to handle extension-injected attributes safely.
- Removed several render-time and unstable state patterns that were causing React 19 warnings and infinite update loops.
- Stabilized `WidgetShell` context values with memoization so widget consumers do not retrigger effects every render.
- Fixed the polling store snapshot contract so `useSyncExternalStore` no longer loops.

Files:

- `app/layout.tsx`
- `components/Dashboard.tsx`
- `components/UptimeMilestones.tsx`
- `components/framework/WidgetOverlay.tsx`
- `components/framework/WidgetShell.tsx`
- `lib/usePolling.ts`

### 2. Steam session tracker integration

- Session tracker now syncs live Steam presence into the tracker store.
- Tracker no longer hijacks the user's selected game while syncing Steam.
- Steam polling and status freshness were tightened.

Files:

- `components/SessionTracker.tsx`
- `lib/sessions.ts`
- `components/CurrentlyPlaying.tsx`
- `lib/steam.ts`
- `app/api/currently-playing/route.ts`

### 3. Spotify real-time cleanup

- Reduced server/client cache delay for now playing.
- Exposed API/polling errors instead of silently showing stale emptiness.
- Added production guardrails to playback control.

Files:

- `components/NowPlaying.tsx`
- `lib/spotify.ts`
- `app/api/now-playing/route.ts`
- `app/api/spotify-control/route.ts`

### 4. Widget removals

- Removed `homelab` and `jellyfin` from the default dashboard flow.
- Removed the `homelab` link from the identity card.
- Kept the underlying code in place for now, but stopped those widgets from appearing by default.

Files:

- `config/widgets.tsx`
- `lib/layout.ts`
- `components/IdentityBlock.tsx`

### 5. Football widget added, then upgraded

Initial version:

- Added football planning/check-in widget.

Upgraded version:

- Redesigned into a football-specific visual treatment.
- Added proper session fields:
  - date
  - start time
  - duration
  - title
  - location
  - notes
  - played state
- Added upcoming sessions, played history, monthly totals, and mini date strip.
- Replaced the cramped inline add form with a dedicated modal/popup flow.
- Reduced oversized form text/input styling.

Files:

- `components/FootballCheckin.tsx`
- `lib/lifestyle.ts`
- `styles/globals.css`

### 6. Gym tracker added and corrected

- Added weekly gym split tracker:
  - Mon chest + triceps
  - Tue back + biceps
  - Wed legs + abs
  - Thu shoulders + core
  - Fri football + conditioning
  - Sat arms + upper accessories
  - Sun recovery
- Fixed weekly logic so only today's row is actionable instead of pretending every row schedules today.

Files:

- `components/GymTracker.tsx`
- `lib/lifestyle.ts`
- `styles/globals.css`

### 7. Theme system expanded

- Added more minimalist palettes:
  - `ash`
  - `sand`
  - `ink`

Files:

- `config/themes.ts`
- `styles/globals.css`

### 8. Shell/debug security hardening

- NutBot shell server is now opt-in only.
- Added token requirement for shell websocket access.
- Client shell connection now supports the token.

Files:

- `scripts/nutbot-shell-server.mjs`
- `components/RealShell.tsx`

### 9. Build stability work

- Removed runtime dependence on Google font fetches during build for this environment.
- Switched build script to Webpack because Turbopack was failing in this project’s CSS/build path.
- Fixed type issues exposed by production build checks.

Files:

- `app/layout.tsx`
- `styles/globals.css`
- `package.json`
- `components/UptimeMilestones.tsx`
- `lib/gridCascade.ts`

## Notes

- Some removed widgets still exist in code. They were removed from default layout, not deleted outright.
- The project still has room for more cleanup, but the main shell, store, and build path are now in a much better state than the original baseline.
