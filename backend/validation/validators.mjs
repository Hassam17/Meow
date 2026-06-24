import { InvalidThemeError } from "../core/errors.mjs";
import { WidgetSizes } from "../core/constants.mjs";

export function validateWidgetSize(size) {
  return Object.prototype.hasOwnProperty.call(WidgetSizes, size);
}

export function validatePosition(grid, widget, position) {
  return !!position && grid.canPlace(widget, position.x, position.y);
}

export function validateThemeConfig(themeConfig, allowedThemeIds = []) {
  if (!themeConfig || typeof themeConfig !== "object") {
    throw new InvalidThemeError("Theme config must be an object");
  }
  if (typeof themeConfig.id !== "string" || themeConfig.id.length === 0) {
    throw new InvalidThemeError("Theme config requires an id");
  }
  if (allowedThemeIds.length > 0 && !allowedThemeIds.includes(themeConfig.id)) {
    throw new InvalidThemeError(`Theme ${themeConfig.id} is not in the allowed set`);
  }
  return true;
}

export function isLayoutSnapshot(value) {
  return !!value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.widgets);
}
