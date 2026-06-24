export class FirstFitPlacementStrategy {
  findPlacement(grid, widget) {
    for (let row = 0; row <= grid.rows - widget.height; row += 1) {
      for (let col = 0; col <= grid.cols - widget.width; col += 1) {
        if (grid.canPlace(widget, col, row)) return { x: col, y: row };
      }
    }
    return null;
  }
}

export class RecoveryPlacementStrategy {
  constructor(fallback = new FirstFitPlacementStrategy()) {
    this.fallback = fallback;
  }

  findPlacement(grid, widget, preferredPosition = null) {
    if (preferredPosition && grid.canPlace(widget, preferredPosition.x, preferredPosition.y)) {
      return preferredPosition;
    }
    return this.fallback.findPlacement(grid, widget);
  }
}
