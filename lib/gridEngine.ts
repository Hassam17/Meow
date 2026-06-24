export type GridWidgetSize = "XS" | "S" | "M" | "L";

export type GridSpan = {
  width: number;
  height: number;
};

export type GridPlacement = GridSpan & {
  x: number;
  y: number;
};

export type GridConfig = {
  rows: number;
  columns: number;
  gap: number;
  debug: boolean;
  companionWidth: number;
};

export type GridOccupancy = (string | null)[][];

export type PlacementOutcome = {
  ok: boolean;
  placements: Record<string, GridPlacement>;
  placement?: GridPlacement;
  reason?: string;
};

export const GRID_SIZE_SPANS: Record<GridWidgetSize, GridSpan> = {
  XS: { width: 1, height: 1 },
  S: { width: 2, height: 1 },
  M: { width: 2, height: 2 },
  L: { width: 4, height: 2 },
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  rows: 10,
  columns: 12,
  gap: 16,
  debug: false,
  companionWidth: 380,
};

export function clonePlacements(placements: Record<string, GridPlacement>) {
  return Object.fromEntries(Object.entries(placements).map(([id, placement]) => [id, { ...placement }]));
}

export function normalizeGridConfig(raw: Partial<GridConfig> | undefined, fallback: GridConfig = DEFAULT_GRID_CONFIG): GridConfig {
  const rows = typeof raw?.rows === "number" && Number.isFinite(raw.rows) ? Math.max(1, Math.round(raw.rows)) : fallback.rows;
  const columns =
    typeof raw?.columns === "number" && Number.isFinite(raw.columns) ? Math.max(1, Math.round(raw.columns)) : fallback.columns;
  const gap = typeof raw?.gap === "number" && Number.isFinite(raw.gap) ? Math.max(0, Math.round(raw.gap)) : fallback.gap;
  const companionWidth =
    typeof raw?.companionWidth === "number" && Number.isFinite(raw.companionWidth)
      ? Math.max(280, Math.round(raw.companionWidth))
      : fallback.companionWidth;
  return {
    rows,
    columns,
    gap,
    debug: typeof raw?.debug === "boolean" ? raw.debug : fallback.debug,
    companionWidth,
  };
}

export function clampSpan(span: GridSpan, grid: Pick<GridConfig, "rows" | "columns">): GridSpan {
  return {
    width: Math.max(1, Math.min(grid.columns, Math.round(span.width))),
    height: Math.max(1, Math.min(grid.rows, Math.round(span.height))),
  };
}

export function sizeForWidget(width: number, height: number): GridWidgetSize | null {
  for (const [label, span] of Object.entries(GRID_SIZE_SPANS) as [GridWidgetSize, GridSpan][]) {
    if (span.width === width && span.height === height) return label;
  }
  return null;
}

export function normalizePlacement(
  placement: GridPlacement | undefined,
  grid: Pick<GridConfig, "rows" | "columns">,
  fallback: GridPlacement,
): GridPlacement {
  if (!placement) return { ...fallback };
  const span = clampSpan({ width: placement.width, height: placement.height }, grid);
  const maxX = Math.max(0, grid.columns - span.width);
  const maxY = Math.max(0, grid.rows - span.height);
  return {
    x: Math.max(0, Math.min(maxX, Math.round(placement.x))),
    y: Math.max(0, Math.min(maxY, Math.round(placement.y))),
    ...span,
  };
}

export function createOccupancyMatrix(
  grid: Pick<GridConfig, "rows" | "columns">,
  placements: Record<string, GridPlacement>,
  ignoreId?: string,
): GridOccupancy {
  const matrix: GridOccupancy = Array.from({ length: grid.rows }, () => Array.from({ length: grid.columns }, () => null));
  for (const [id, placement] of Object.entries(placements)) {
    if (id === ignoreId) continue;
    for (let row = placement.y; row < placement.y + placement.height; row += 1) {
      for (let column = placement.x; column < placement.x + placement.width; column += 1) {
        if (matrix[row]?.[column] === null) matrix[row][column] = id;
      }
    }
  }
  return matrix;
}

export function canPlace(
  grid: Pick<GridConfig, "rows" | "columns">,
  placements: Record<string, GridPlacement>,
  id: string,
  placement: GridPlacement,
): boolean {
  if (placement.x < 0 || placement.y < 0) return false;
  if (placement.width < 1 || placement.height < 1) return false;
  if (placement.x + placement.width > grid.columns) return false;
  if (placement.y + placement.height > grid.rows) return false;

  const occupancy = createOccupancyMatrix(grid, placements, id);
  for (let row = placement.y; row < placement.y + placement.height; row += 1) {
    for (let column = placement.x; column < placement.x + placement.width; column += 1) {
      if (occupancy[row]?.[column] !== null) return false;
    }
  }

  return true;
}

function scanForFit(
  grid: Pick<GridConfig, "rows" | "columns">,
  placements: Record<string, GridPlacement>,
  id: string,
  size: GridSpan,
  start?: { x: number; y: number },
): GridPlacement | null {
  const width = Math.max(1, Math.min(grid.columns, size.width));
  const height = Math.max(1, Math.min(grid.rows, size.height));
  const maxY = Math.max(0, grid.rows - height);
  const maxX = Math.max(0, grid.columns - width);
  const occupancy = createOccupancyMatrix(grid, placements, id);
  const startY = Math.max(0, Math.min(maxY, start?.y ?? 0));
  const startX = Math.max(0, Math.min(maxX, start?.x ?? 0));

  const tryCell = (x: number, y: number) => {
    for (let row = y; row < y + height; row += 1) {
      for (let column = x; column < x + width; column += 1) {
        if (occupancy[row]?.[column] !== null) return false;
      }
    }
    return true;
  };

  for (let row = startY; row <= maxY; row += 1) {
    for (let column = row === startY ? startX : 0; column <= maxX; column += 1) {
      if (tryCell(column, row)) return { x: column, y: row, width, height };
    }
  }

  for (let row = 0; row < startY; row += 1) {
    for (let column = 0; column <= maxX; column += 1) {
      if (tryCell(column, row)) return { x: column, y: row, width, height };
    }
  }

  return null;
}

export function placeWidget(
  grid: Pick<GridConfig, "rows" | "columns">,
  placements: Record<string, GridPlacement>,
  id: string,
  placement: GridPlacement,
): PlacementOutcome {
  const nextPlacement = normalizePlacement(placement, grid, placement);
  if (canPlace(grid, placements, id, nextPlacement)) {
    return {
      ok: true,
      placement: nextPlacement,
      placements: { ...placements, [id]: nextPlacement },
    };
  }

  const fitted = scanForFit(grid, placements, id, nextPlacement, { x: nextPlacement.x, y: nextPlacement.y });
  if (fitted) {
    return {
      ok: true,
      placement: fitted,
      placements: { ...placements, [id]: fitted },
    };
  }

  return {
    ok: false,
    placements,
    reason: "No available space for widget placement",
  };
}

export function moveWidget(
  grid: Pick<GridConfig, "rows" | "columns">,
  placements: Record<string, GridPlacement>,
  id: string,
  position: { x: number; y: number },
): PlacementOutcome {
  const current = placements[id];
  if (!current) return { ok: false, placements, reason: "Missing widget placement" };
  return placeWidget(grid, placements, id, { ...current, x: position.x, y: position.y });
}

export function resizeWidget(
  grid: Pick<GridConfig, "rows" | "columns">,
  placements: Record<string, GridPlacement>,
  id: string,
  nextSize: GridSpan,
  anchor: "top-left" | "top-right" | "bottom-left" | "bottom-right" = "top-left",
): PlacementOutcome {
  const current = placements[id];
  if (!current) return { ok: false, placements, reason: "Missing widget placement" };

  const fittedSize = clampSpan(nextSize, grid);
  let x = current.x;
  let y = current.y;

  if (anchor === "top-right") x = current.x + current.width - fittedSize.width;
  if (anchor === "bottom-left") y = current.y + current.height - fittedSize.height;
  if (anchor === "bottom-right") {
    x = current.x + current.width - fittedSize.width;
    y = current.y + current.height - fittedSize.height;
  }

  return placeWidget(grid, placements, id, { x, y, ...fittedSize });
}

export function removeWidget(placements: Record<string, GridPlacement>, id: string) {
  const next = { ...placements };
  delete next[id];
  return next;
}

export function buildMatrixSummary(matrix: GridOccupancy) {
  return matrix.map((row) => row.map((cell) => (cell ? 1 : 0)));
}

export function autoPlace(
  grid: Pick<GridConfig, "rows" | "columns">,
  entries: Array<{ id: string; size: GridSpan }>,
): Record<string, GridPlacement> {
  const placements: Record<string, GridPlacement> = {};
  for (const entry of entries) {
    const fitted = scanForFit(grid, placements, entry.id, entry.size, { x: 0, y: 0 });
    if (fitted) placements[entry.id] = fitted;
  }
  return placements;
}

export function maxOccupiedRow(placements: Record<string, GridPlacement>) {
  return Object.values(placements).reduce((max, placement) => Math.max(max, placement.y + placement.height), 0);
}

