import { GridCell } from "./GridCell.mjs";
import { CollisionError, DuplicateWidgetError, InvalidPositionError, MissingWidgetError } from "../core/errors.mjs";

export class Grid {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => new GridCell(row, col)),
    );
    this.widgetIndex = new Map();
  }

  hasWidget(widgetId) {
    return this.widgetIndex.has(widgetId);
  }

  getWidget(widgetId) {
    return this.widgetIndex.get(widgetId) ?? null;
  }

  getCell(row, col) {
    if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) return null;
    return this.cells[row][col];
  }

  getOccupancyMatrix() {
    return this.cells.map((row) => row.map((cell) => cell.widgetId));
  }

  canPlace(widget, x, y, ignoreWidgetId = null) {
    if (!widget || typeof widget.width !== "number" || typeof widget.height !== "number") return false;
    if (x < 0 || y < 0 || x + widget.width > this.cols || y + widget.height > this.rows) return false;

    for (let row = y; row < y + widget.height; row += 1) {
      for (let col = x; col < x + widget.width; col += 1) {
        const cell = this.getCell(row, col);
        if (!cell) return false;
        if (cell.widgetId && cell.widgetId !== ignoreWidgetId) return false;
      }
    }

    return true;
  }

  placeWidget(widget, x, y) {
    if (this.widgetIndex.has(widget.id)) {
      throw new DuplicateWidgetError(`Widget ${widget.id} already exists in the grid`);
    }
    if (!this.canPlace(widget, x, y)) {
      throw this._collisionOrBounds(widget, x, y);
    }

    this._occupy(widget, x, y);
    return widget;
  }

  removeWidget(widgetId) {
    const widget = this.widgetIndex.get(widgetId);
    if (!widget) throw new MissingWidgetError(`Widget ${widgetId} was not found in the grid`);
    this._clear(widgetId);
    widget.clearPosition();
    this.widgetIndex.delete(widgetId);
    return widget;
  }

  resizeWidget(widgetId, size, validateResize = true) {
    const widget = this.widgetIndex.get(widgetId);
    if (!widget) throw new MissingWidgetError(`Widget ${widgetId} was not found in the grid`);
    const previous = widget.clone();
    const previousPosition = widget.position ? { ...widget.position } : null;

    this._clear(widgetId);
    widget.resize(size);

    if (!previousPosition || !this.canPlace(widget, previousPosition.x, previousPosition.y)) {
      if (validateResize) {
        widget.resize(previous.size);
        widget.position = previousPosition;
        if (previousPosition) this._occupy(widget, previousPosition.x, previousPosition.y);
        throw this._collisionOrBounds(widget, previousPosition?.x ?? 0, previousPosition?.y ?? 0);
      }
      return widget;
    }

    this._occupy(widget, previousPosition.x, previousPosition.y);
    return widget;
  }

  moveWidget(widgetId, x, y) {
    const widget = this.widgetIndex.get(widgetId);
    if (!widget) throw new MissingWidgetError(`Widget ${widgetId} was not found in the grid`);
    const previous = widget.position ? { ...widget.position } : null;

    this._clear(widgetId);
    if (!this.canPlace(widget, x, y)) {
      if (previous) {
        widget.moveTo(previous.x, previous.y);
        this._occupy(widget, previous.x, previous.y);
      }
      throw this._collisionOrBounds(widget, x, y);
    }

    this._occupy(widget, x, y);
    return widget;
  }

  clear() {
    for (const row of this.cells) {
      for (const cell of row) cell.clear();
    }
    this.widgetIndex.clear();
  }

  snapshot() {
    return {
      rows: this.rows,
      cols: this.cols,
      occupancy: this.getOccupancyMatrix(),
      widgets: [...this.widgetIndex.values()].map((widget) => widget.serialize()),
    };
  }

  _occupy(widget, x, y) {
    for (let row = y; row < y + widget.height; row += 1) {
      for (let col = x; col < x + widget.width; col += 1) {
        this.getCell(row, col).occupy(widget.id);
      }
    }
    widget.moveTo(x, y);
    this.widgetIndex.set(widget.id, widget);
  }

  _clear(widgetId) {
    for (const row of this.cells) {
      for (const cell of row) {
        if (cell.widgetId === widgetId) cell.clear();
      }
    }
  }

  _collisionOrBounds(widget, x, y) {
    if (x < 0 || y < 0 || x + widget.width > this.cols || y + widget.height > this.rows) {
      return new InvalidPositionError(`Widget ${widget.id} cannot be placed at (${x}, ${y})`);
    }
    return new CollisionError(`Widget ${widget.id} collides with another widget`);
  }
}
