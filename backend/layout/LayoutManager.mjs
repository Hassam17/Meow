import { DefaultGridConfig, DefaultThemeId } from "../core/constants.mjs";
import { CorruptedLayoutError, InvalidPositionError, MissingWidgetError } from "../core/errors.mjs";
import { EventBus } from "../event/EventBus.mjs";
import { Grid } from "../domain/Grid.mjs";
import { CompanionZone } from "../domain/CompanionZone.mjs";
import { SettingsManager } from "../settings/SettingsManager.mjs";
import { ThemeManager } from "../theme/ThemeManager.mjs";
import { WidgetRegistry } from "../registry/WidgetRegistry.mjs";
import { WidgetFactory } from "../factory/WidgetFactory.mjs";
import { FirstFitPlacementStrategy, RecoveryPlacementStrategy } from "../strategy/PlacementStrategy.mjs";
import { LayoutRecovery } from "../recovery/LayoutRecovery.mjs";

export class LayoutManager {
  constructor({
    rows = DefaultGridConfig.rows,
    cols = DefaultGridConfig.cols,
    registry = new WidgetRegistry(),
    factory = null,
    themeManager = null,
    companionZone = null,
    settingsManager = null,
    eventBus = null,
    placementStrategy = null,
  } = {}) {
    this.eventBus = eventBus ?? new EventBus();
    this.registry = registry;
    this.factory = factory ?? new WidgetFactory(this.registry);
    this.grid = new Grid(rows, cols);
    this.companionZone = companionZone ?? new CompanionZone(Math.max(4, Math.floor(rows / 2)), 4);
    this.themeManager = themeManager ?? new ThemeManager({ defaultTheme: DefaultThemeId, eventBus: this.eventBus });
    this.settingsManager = settingsManager ?? new SettingsManager(this.eventBus);
    this.placementStrategy = placementStrategy ?? new FirstFitPlacementStrategy();
    this.recovery = new LayoutRecovery({
      registry: this.registry,
      factory: this.factory,
      grid: this.grid,
      companionZone: this.companionZone,
      themeManager: this.themeManager,
      settingsManager: this.settingsManager,
      placementStrategy: new RecoveryPlacementStrategy(this.placementStrategy),
    });
  }

  canPlace(widget, x, y, zone = "grid") {
    return this._zone(zone).canPlace(widget, x, y);
  }

  placeWidget(widget, x, y, zone = "grid") {
    const target = this._zone(zone);
    const placed = target.placeWidget(widget, x, y);
    this.eventBus.emit("widget:placed", { widget: placed.serialize(), zone });
    return placed;
  }

  addWidget(widgetId, options = {}) {
    const widget = this.factory.create(widgetId, options);
    const zone = options.zone === "companion" ? "companion" : "grid";
    const target = this._zone(zone);
    const placement =
      options.position ??
      this.placementStrategy.findPlacement(target, widget);

    if (!placement) throw new InvalidPositionError(`No valid placement found for widget ${widgetId}`);
    this.placeWidget(widget, placement.x, placement.y, zone);
    return widget;
  }

  removeWidget(widgetId) {
    const zone = this._findZone(widgetId);
    if (!zone) throw new MissingWidgetError(`Widget ${widgetId} not found in any zone`);
    const removed = zone.removeWidget(widgetId);
    this.settingsManager.removeWidget(widgetId);
    this.eventBus.emit("widget:removed", { widgetId, zone: zone === this.grid ? "grid" : "companion" });
    return removed;
  }

  resizeWidget(widgetId, size) {
    const zone = this._findZone(widgetId);
    if (!zone) throw new MissingWidgetError(`Widget ${widgetId} not found in any zone`);
    const resized = zone.resizeWidget(widgetId, size);
    this.eventBus.emit("widget:resized", { widgetId, size });
    return resized;
  }

  moveWidget(widgetId, x, y, zoneName = null) {
    const zone = zoneName ? this._zone(zoneName) : this._findZone(widgetId);
    if (!zone) throw new MissingWidgetError(`Widget ${widgetId} not found in any zone`);
    const moved = zone.moveWidget(widgetId, x, y);
    this.eventBus.emit("widget:moved", { widgetId, x, y, zone: zone === this.grid ? "grid" : "companion" });
    return moved;
  }

  setTheme(themeId) {
    this.themeManager.setTheme(themeId);
    return this.themeManager.getTheme();
  }

  setGlobalSetting(key, value) {
    this.settingsManager.setGlobal(key, value);
  }

  setWidgetSetting(widgetId, key, value) {
    this.settingsManager.setWidgetSetting(widgetId, key, value);
  }

  serialize() {
    return {
      version: 1,
      grid: this.grid.snapshot(),
      companionZone: this.companionZone.snapshot(),
      widgets: [
        ...this.grid.widgetIndex.values().map((widget) => ({ ...widget.serialize(), zone: "grid" })),
        ...this.companionZone.widgetIndex.values().map((widget) => ({ ...widget.serialize(), zone: "companion" })),
      ],
      theme: this.themeManager.serialize(),
      settings: this.settingsManager.serialize(),
    };
  }

  exportLayout(pretty = false) {
    return JSON.stringify(this.serialize(), null, pretty ? 2 : 0);
  }

  importLayout(payload) {
    const recovered = this.recovery.recover(payload);
    this.eventBus.emit("layout:imported", recovered);
    return recovered;
  }

  recoverLayout(payload) {
    const recovered = this.recovery.recover(payload);
    this.eventBus.emit("layout:recovered", recovered);
    return recovered;
  }

  reset() {
    this.grid.clear();
    this.companionZone.clear();
    this.themeManager.setTheme(DefaultThemeId);
    this.settingsManager.hydrate({ global: {}, widgets: {} });
    this.eventBus.emit("layout:reset", this.serialize());
  }

  on(eventName, handler) {
    return this.eventBus.on(eventName, handler);
  }

  _zone(zone) {
    if (zone === "companion") return this.companionZone;
    return this.grid;
  }

  _findZone(widgetId) {
    if (this.grid.hasWidget(widgetId)) return this.grid;
    if (this.companionZone?.hasWidget(widgetId)) return this.companionZone;
    return null;
  }

  validateThemeConfig(themeConfig) {
    return this.themeManager.validateThemeConfig(themeConfig);
  }

  static fromSnapshot(snapshot, options = {}) {
    const manager = new LayoutManager(options);
    manager.recoverLayout(snapshot);
    return manager;
  }
}
