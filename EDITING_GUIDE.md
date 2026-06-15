# Editing Guide

This guide tells you what to change and where when you want to modify the project.

## First Rule

When you want to change behavior, identify which layer you are touching:

1. widget content
2. widget registration/config
3. shared state/store
4. API/integration
5. global styling/theme
6. app shell/build/security

Do not start by editing random files.

## If You Want To Change...

### 1. Add, remove, reorder, or rename widgets

Edit:

- `config/widgets.tsx`

What lives there:

- widget registry
- widget icons
- widget component wiring
- default size/orientation/expand mode
- dashboard default order

Typical changes:

- Add a new widget entry in `WIDGETS`
- Add it to `DEFAULT_ORDER`
- Set `flags`, `sizes`, `orientations`, `expandModes`, `defaults`

If the widget should not show up by default:

- leave it out of `DEFAULT_ORDER`

If a widget should be excluded from old saved layouts:

- also check `lib/layout.ts`

### 2. Change widget layout persistence or default placement

Edit:

- `lib/layout.ts`

What lives there:

- saved widget layout store
- layout sanitization
- migration behavior
- hide/show persistence

Typical changes:

- change default instance shape
- exclude old/removed widgets
- change how saved layout data is sanitized

### 3. Change the widget chrome, hover expansion, or overlay behavior

Edit:

- `components/framework/WidgetShell.tsx`
- `components/framework/WidgetOverlay.tsx`
- `components/framework/WidgetContext.tsx`
- `components/framework/WidgetSettingsPopover.tsx`

Use these when you want to change:

- card wrapper behavior
- overlay modal behavior
- widget context values
- per-widget settings UI

### 4. Change a specific widget’s content

Edit the widget component directly in `components/`.

Examples:

- football widget: `components/FootballCheckin.tsx`
- gym widget: `components/GymTracker.tsx`
- session tracker: `components/SessionTracker.tsx`
- Spotify: `components/NowPlaying.tsx`
- Steam: `components/CurrentlyPlaying.tsx`
- GitHub: `components/GitHubActivity.tsx`

What to change there:

- displayed text
- widget-specific buttons
- summary calculations
- widget-local UI flow

### 5. Change football data behavior

Edit:

- `components/FootballCheckin.tsx`
- `lib/lifestyle.ts`

Use `components/FootballCheckin.tsx` for:

- football card design
- football modal form
- upcoming/played rendering
- date/time formatting

Use `lib/lifestyle.ts` for:

- football session data model
- local persistence
- add/remove/toggle behavior

If you want to add new football fields like:

- opponent
- score
- goals
- assists
- position

Change both:

- `lib/lifestyle.ts`: add the field to `FootballEvent`, sanitization, defaults, storage mutations
- `components/FootballCheckin.tsx`: show and edit the field

### 6. Change gym plan or workout logic

Edit:

- `lib/lifestyle.ts`
- `components/GymTracker.tsx`

Use `lib/lifestyle.ts` for:

- weekly plan source of truth (`GYM_PLAN`)
- persistence helpers

Use `components/GymTracker.tsx` for:

- card UI
- per-day display
- check-in interaction

If you want to change the split:

- update `GYM_PLAN` in `lib/lifestyle.ts`

### 7. Change session tracker behavior

Edit:

- `components/SessionTracker.tsx`
- `lib/sessions.ts`

Use `components/SessionTracker.tsx` for:

- tracker UI
- report-copy prompt
- chart rendering
- manual input UX

Use `lib/sessions.ts` for:

- session store shape
- game selection
- Steam sync accumulation logic
- persistence

### 8. Change polling, refresh rate, stale/error behavior

Edit:

- `lib/usePolling.ts`

This is the shared client polling system.

Change this file if you want to:

- change polling intervals globally
- change cache behavior
- expose stale state
- alter how errors are surfaced

Important:

- `useSyncExternalStore` snapshots must remain stable/cached
- do not return fresh objects from `getSnapshot` or `getServerSnapshot` unless the store actually changed

### 9. Change Steam integration

Edit:

- `lib/steam.ts`
- `app/api/currently-playing/route.ts`
- `app/api/steam-library/route.ts`
- `components/CurrentlyPlaying.tsx`
- `components/GameLibrary.tsx`

Use `lib/steam.ts` for:

- Steam API fetches
- cache TTL
- data normalization

Use API routes for:

- route error behavior
- route cache headers

Use components for:

- display
- empty state
- library drawer UI

### 10. Change Spotify integration

Edit:

- `lib/spotify.ts`
- `app/api/now-playing/route.ts`
- `app/api/spotify-control/route.ts`
- `components/NowPlaying.tsx`

Use `lib/spotify.ts` for:

- token refresh
- queue/recent/current normalization
- cache TTL
- playback control implementation

Use `app/api/spotify-control/route.ts` for:

- request validation
- same-origin/security checks
- production gating

### 11. Change GitHub integration

Edit:

- `lib/github.ts`
- `app/api/github-activity/route.ts`
- `app/api/github-repos/route.ts`
- `components/GitHubActivity.tsx`

### 12. Change homelab integration

Edit:

- `lib/homelab.ts`
- `app/api/homelab/route.ts`
- `app/api/homelab-v2/route.ts`
- related widgets:
  - `components/HomelabStatus.tsx`
  - `components/ServerStats.tsx`
  - `components/DiskStorage.tsx`
  - `components/NetworkStats.tsx`
  - `components/ArrStack.tsx`
  - `components/StorageApps.tsx`
  - `components/Jellyfin.tsx`
  - `components/GlyphStrip.tsx`

### 13. Change themes, colors, palette picker

Edit:

- `config/themes.ts`
- `styles/globals.css`
- `components/widgets/HubSettings.tsx`
- `lib/theme.ts`

Use `config/themes.ts` for:

- palette ids
- palette metadata
- picker swatches

Use `styles/globals.css` for:

- actual CSS token values
- `[data-palette="..."]` blocks

Use `HubSettings.tsx` for:

- picker rendering
- palette button layout

Use `lib/theme.ts` for:

- local storage
- document dataset updates

### 14. Change the global visual system

Edit:

- `styles/globals.css`
- `DESIGN_VARIATIONS.md`

`styles/globals.css` contains:

- design tokens
- card chrome
- widget styling
- football/gym planner styling
- picker styling

`DESIGN_VARIATIONS.md` explains the design direction and intended hierarchy.

### 15. Change the boot screen or app shell

Edit:

- `app/layout.tsx`
- `app/page.tsx`
- `components/BootSequence.tsx`
- `components/IdentityBlock.tsx`

Use these for:

- metadata
- global shell structure
- boot intro behavior
- identity header content

### 16. Change build or tooling behavior

Edit:

- `package.json`
- `next.config.js`
- `eslint.config.mjs`
- `tsconfig.json`
- `postcss.config.mjs`

Current note:

- `npm run build` uses `next build --webpack`

### 17. Change debug shell behavior

Edit:

- `scripts/nutbot-shell-server.mjs`
- `components/RealShell.tsx`
- `components/NutBotTerminal.tsx`

Important:

- this area is security-sensitive
- do not remove token gating casually
- do not expose it publicly

## Common Recipes

### Add a new widget

1. Create a component in `components/`
2. If it needs persistence, add a store/helper in `lib/`
3. Register it in `config/widgets.tsx`
4. Add styles to `styles/globals.css`
5. Add it to `DEFAULT_ORDER` if it should appear by default
6. Run:

```bash
npm run lint
npm run build
```

### Add a new field to a stored widget

Example: add `opponent` to football.

1. Add field to the type in `lib/lifestyle.ts`
2. Add default value and sanitization there
3. Include it in add/update helpers there
4. Add input + display in `components/FootballCheckin.tsx`
5. Run lint/build

### Change a theme

1. Update or add palette id in `config/themes.ts`
2. Add corresponding CSS token blocks in `styles/globals.css`
3. Verify the picker in `components/widgets/HubSettings.tsx`
4. Run lint/build

## Safety Checklist Before Saving a Change

Always check:

1. Did I change the right layer?
2. If I changed a persisted type, did I update sanitization/defaults too?
3. If I changed a widget, did I also update its config entry if needed?
4. If I changed polling/store logic, are snapshots stable for `useSyncExternalStore`?
5. Did I run:

```bash
npm run lint
npm run build
```
