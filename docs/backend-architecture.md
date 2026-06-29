# Backend Architecture Guide

The backend is structured as a small OS-like service layer.
The UI should talk to one facade, while the domain modules stay isolated and testable.

## Public Entry Point

### `backend/facade/GridOS.mjs`

This is the canonical entry point for consumers that want one object instead of many modules.

Responsibilities:

- create and own the `LayoutManager`
- wire default `EventBus`, `WidgetRegistry`, `WidgetFactory`, `ThemeManager`, and `SettingsManager`
- expose `addWidget`, `moveWidget`, `resizeWidget`, `removeWidget`, `setTheme`, `import`, `export`, `recover`, and `reset`

Use this when UI code or scripts need the full system.

## Folder-by-Folder Design

### `backend/core`

Shared constants and error types.

Use this for:

- default sizes and IDs
- error classes
- system-wide enums and validation helpers

### `backend/domain`

Pure domain objects:

- `Grid`
- `GridCell`
- `Widget`
- `CompanionZone`

These should stay dependency-light and rule-focused.

### `backend/event`

Observable state changes:

- `EventBus`

Use this to broadcast changes without coupling modules directly together.

### `backend/registry`

Registry and lookup layer:

- `WidgetRegistry`

Use this for fast widget discovery and duplicate prevention.

### `backend/factory`

Object creation and wrapping:

- `WidgetFactory`

Use this to produce widget instances with the correct base behavior.

### `backend/layout`

Placement, recovery, import/export, and validation:

- `LayoutManager`

This is the source of truth for `canPlace`, move/resize/place/remove, and layout sanitization.

### `backend/recovery`

Recovery and fallback logic for corrupted or partial payloads.

Use this to rebuild safe state from broken imports or old snapshots.

### `backend/theme`

Token validation and theme management:

- `ThemeManager`

Only tokens should change here. UI styling should consume tokens, not override them.

### `backend/settings`

Global configuration:

- `SettingsManager`

Use this for persisted dashboard-wide settings that are not widget-local.

### `backend/strategy`

Swappable algorithms:

- placement strategy
- recovery strategy

This is the clean place for alternative grid heuristics later.

### `backend/validation`

Validation helpers for payloads, layouts, and theme/config inputs.

Use this as the single boundary before recovery or commit.

### `backend/tests`

Behavior tests for grid placement, recovery, and facade coverage.

## Practical Folder Map

```text
backend/
  core/
  domain/
  event/
  factory/
  facade/
  layout/
  recovery/
  registry/
  settings/
  strategy/
  tests/
  theme/
  validation/
```

## Recommended Next Backend Improvements

1. keep all sanitization in one validation boundary
2. make recovery strategy pluggable per layout mode
3. add integration tests around import/export and corrupted payload recovery
4. expose a thin persistence adapter if browser or file persistence becomes shared
