import { CorruptedLayoutError } from "../core/errors.mjs";
import { FirstFitPlacementStrategy, RecoveryPlacementStrategy } from "../strategy/PlacementStrategy.mjs";
import { isLayoutSnapshot } from "../validation/validators.mjs";

export class LayoutRecovery {
  constructor({ registry, factory, grid, companionZone, themeManager, settingsManager, placementStrategy = new RecoveryPlacementStrategy() }) {
    this.registry = registry;
    this.factory = factory;
    this.grid = grid;
    this.companionZone = companionZone;
    this.themeManager = themeManager;
    this.settingsManager = settingsManager;
    this.placementStrategy = placementStrategy;
  }

  recover(input) {
    const snapshot = this._normalizeSnapshot(input);
    this.grid.clear();
    this.companionZone?.clear?.();
    this.settingsManager.hydrate(snapshot.settings);
    this.themeManager.recoverTheme(snapshot.theme);

    const seen = new Set();
    const recovered = [];
    const warnings = [];

    for (const rawWidget of snapshot.widgets) {
      if (!rawWidget?.id || seen.has(rawWidget.id)) {
        warnings.push({ type: "duplicate-or-invalid", widgetId: rawWidget?.id ?? null });
        continue;
      }
      seen.add(rawWidget.id);

      if (!this.registry.has(rawWidget.id)) {
        warnings.push({ type: "missing-widget", widgetId: rawWidget.id });
        continue;
      }

      const widget = this.factory.create(rawWidget.id, {
        id: rawWidget.id,
        size: rawWidget.size,
        settings: rawWidget.settings,
        metadata: rawWidget.metadata,
      });

      const targetGrid = rawWidget.zone === "companion" ? this.companionZone : this.grid;
      const preferredPosition = rawWidget.position ?? null;
      const placement = this.placementStrategy.findPlacement(targetGrid, widget, preferredPosition);
      if (!placement) {
        warnings.push({ type: "no-space", widgetId: widget.id });
        continue;
      }

      targetGrid.placeWidget(widget, placement.x, placement.y);
      recovered.push(widget);
    }

    return {
      widgets: recovered,
      warnings,
      theme: this.themeManager.getTheme(),
      settings: this.settingsManager.serialize(),
    };
  }

  _normalizeSnapshot(input) {
    if (!input) {
      return { widgets: [], settings: {}, theme: {} };
    }

    if (typeof input === "string") {
      try {
        return this._normalizeSnapshot(JSON.parse(input));
      } catch {
        throw new CorruptedLayoutError("Layout payload is not valid JSON");
      }
    }

    if (!isLayoutSnapshot(input) && !Array.isArray(input.widgets)) {
      throw new CorruptedLayoutError("Layout payload is missing widget data");
    }

    return {
      widgets: Array.isArray(input.widgets) ? input.widgets : [],
      settings: input.settings ?? {},
      theme: input.theme ?? input.themeConfig ?? {},
    };
  }
}
