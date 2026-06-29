# UI Shell Guide

This repository now treats the dashboard as a grid-first canvas.

## Live Shell

- `components/Dashboard.tsx` renders only the grid canvas by default
- the default shell no longer mounts the left sidebar
- the default shell no longer mounts the right settings/companion rail
- the grid canvas remains the source of truth for visible widget placement

## What Still Exists In Code

- `components/Sidebar.tsx`
- `components/RightCompanionPanel.tsx`
- `components/companions/CompanionDock.tsx`

These modules still exist as reusable UI blocks, but they are not part of the default live shell.

## Why This Matters

- keeps the dashboard readable
- makes the grid the primary UI element
- reduces duplicated control surfaces
- leaves room for future shell modes without changing widget behavior

## Recommended Structure

```text
components/
  Dashboard.tsx
  GridCanvas.tsx
  Sidebar.tsx                (reusable, not mounted by default)
  RightCompanionPanel.tsx    (reusable, not mounted by default)
  companions/
  framework/
  widgets/

docs/
  ui-shell.md
  backend-architecture.md
  diagram-guide.md
```

