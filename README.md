# Meow

Meow is a personal dashboard built with Next.js 16 and React 19. It combines a custom widget framework with live integrations for music, gaming, GitHub activity, homelab status, and personal tracking in a single configurable interface.

## Overview

The app is designed as a modular dashboard rather than a fixed page. Widgets can expose different sizes, orientations, expansion modes, and settings, while the layout layer manages placement and persistence in the browser.

Core areas currently covered:

- layout-driven dashboard shell with left sidebar, main grid, and right companion rail
- configurable widget framework with standalone widget boundaries
- grid engine with move, resize, snap, collision detection, and layout persistence
- theme engine with CSS-variable token themes, custom theme import/export, create, clone, and preview
- companion system with AI assistant, cat companion, pet companion, and notifications
- Spotify now playing and playback controls
- Steam activity and game library data
- GitHub activity summaries
- homelab and server status widgets
- football session tracking
- gym plan tracking
- session tracking and local progress history

## Current Status

The current build is a working dashboard shell with:

- a collapsible left navigation / control sidebar
- a configurable central grid canvas
- a dedicated right-side settings and companion area
- token-only theme switching across the entire dashboard
- persistent layout, theme, and companion state in localStorage
- widget-level error isolation and framework primitives

The latest design pass is captured in:

- [NewLayout.excalidraw](./NewLayout.excalidraw)
- [CurrentSystemLayout.excalidraw](./CurrentSystemLayout.excalidraw)

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- `@dnd-kit` for layout interactions
- `xterm` for the optional NutBot shell interface

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Set only the variables needed for the integrations you want to enable.

### Spotify

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`
- `SPOTIFY_CONTROL_ENABLED=true` to enable playback control in production

### Steam

- `STEAM_API_KEY`
- `STEAM_PROFILE_ID`

### GitHub

- `GITHUB_TOKEN` optional, but recommended for higher API limits or private access

### Homelab

- `HOMELAB_STATUS_URL`
- `HOMELAB_MOCK_DATA=true` to use local mock homelab data during development

### NutBot Shell

- `NUTBOT_SHELL_ENABLED=true` to opt in to the shell server
- `NUTBOT_SHELL_TOKEN`
- `NEXT_PUBLIC_NUTBOT_SHELL_URL`
- `NEXT_PUBLIC_NUTBOT_SHELL_TOKEN`

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run mock:homelab
npm run spotify:auth
npm run nutbot:shell
```

### Script Notes

- `npm run build` uses Webpack intentionally.
- Turbopack was unstable for this project's CSS and build path in this environment.

## Verification

Use the standard checks before shipping changes:

```bash
npm run lint
npm run build
```

## Project Structure

```text
app/                    App Router pages and API routes
components/             Dashboard widgets and UI shell
components/framework/   Widget framework primitives
components/widgets/     Widget-specific wrappers
config/                 Widget registry, themes, and static configuration
lib/                    State, polling, integrations, and shared utilities
mock/                   Mock API data for local development
scripts/                Development helper scripts
styles/                 Global styling and design tokens
public/                 Static assets
```

## Documentation

- [CHANGELOG.md](./CHANGELOG.md) - major changes made so far
- [EDITING_GUIDE.md](./EDITING_GUIDE.md) - where to make specific types of changes
- [DESIGN_VARIATIONS.md](./DESIGN_VARIATIONS.md) - design system and visual direction
- [PLAN.md](./PLAN.md) - project planning notes

## Development Notes

- Layout and widget preferences are persisted locally in the browser.
- Some widgets remain in the codebase even when they are not part of the default dashboard layout.
- The widget registry in `config/widgets.tsx` is the main entry point for adding, removing, or reconfiguring widgets.
- The right rail now hosts the settings surface plus the companion system.
- Theme changes are token-based only; widgets should not own theme styling.
- The grid engine is the source of truth for placement and collision rules.

## Recent Changes

- Split the dashboard into explicit left, center, and right regions
- Added a right-side settings panel with grid, theme, widget, layout, and companion controls
- Added a persistent companion runtime with multiple companion types and animations
- Added a token-driven theme engine with custom theme workflows
- Added an updated Excalidraw design artifact for the current system direction
