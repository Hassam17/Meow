# Meow

Personal dashboard built with Next.js 16, React 19, and a custom widget framework.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify

```bash
npm run lint
npm run build
```

`npm run build` uses Webpack intentionally. Turbopack was unstable for this project's CSS/build path in this environment.

## Project Docs

- [CHANGELOG.md](./CHANGELOG.md): major changes made so far
- [EDITING_GUIDE.md](./EDITING_GUIDE.md): where to edit what
- [DESIGN_VARIATIONS.md](./DESIGN_VARIATIONS.md): design system and visual direction
- [PLAN.md](./PLAN.md): planning notes

## Important Env Vars

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`
- `SPOTIFY_CONTROL_ENABLED=true` for production playback control
- `STEAM_API_KEY`
- `STEAM_PROFILE_ID`
- `GITHUB_TOKEN` optional, for higher GitHub API limits/private access
- `HOMELAB_STATUS_URL`
- `HOMELAB_MOCK_DATA=true` for local mock homelab data
- `NUTBOT_SHELL_ENABLED=true` to opt in to the dev shell server
- `NUTBOT_SHELL_TOKEN`
- `NEXT_PUBLIC_NUTBOT_SHELL_URL`
- `NEXT_PUBLIC_NUTBOT_SHELL_TOKEN`

## Dev Commands

```bash
npm run dev
npm run lint
npm run build
npm run mock:homelab
npm run spotify:auth
npm run nutbot:shell
```

## Architecture

- `app/`: app router pages and API routes
- `components/`: widgets and UI shell
- `components/framework/`: widget system primitives
- `components/widgets/`: special widget wrappers
- `config/`: widget registry, themes, links
- `lib/`: stores, polling, integrations, formatting
- `styles/globals.css`: global tokens and component styling
- `scripts/`: local dev helpers
