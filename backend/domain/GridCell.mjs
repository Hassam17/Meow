export class GridCell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.widgetId = null;
  }

  isOccupied() {
    return this.widgetId !== null;
  }

  occupy(widgetId) {
    this.widgetId = widgetId;
  }

  clear() {
    this.widgetId = null;
  }

  clone() {
    const cell = new GridCell(this.row, this.col);
    cell.widgetId = this.widgetId;
    return cell;
  }
}
