export class GridError extends Error {
  constructor(message, code = "GRID_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class CollisionError extends GridError {
  constructor(message = "Widget collides with occupied grid cells") {
    super(message, "COLLISION");
  }
}

export class InvalidPositionError extends GridError {
  constructor(message = "Widget position is outside grid bounds") {
    super(message, "INVALID_POSITION");
  }
}

export class DuplicateWidgetError extends GridError {
  constructor(message = "Widget already exists in registry or grid") {
    super(message, "DUPLICATE_WIDGET");
  }
}

export class MissingWidgetError extends GridError {
  constructor(message = "Widget does not exist") {
    super(message, "MISSING_WIDGET");
  }
}

export class InvalidThemeError extends GridError {
  constructor(message = "Theme config is invalid") {
    super(message, "INVALID_THEME");
  }
}

export class CorruptedLayoutError extends GridError {
  constructor(message = "Layout payload is corrupted or malformed") {
    super(message, "CORRUPTED_LAYOUT");
  }
}
