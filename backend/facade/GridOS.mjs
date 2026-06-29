import { DefaultGridConfig, DefaultThemeId } from "../core/constants.mjs";
import { LayoutManager } from "../layout/LayoutManager.mjs";
import { WidgetRegistry } from "../registry/WidgetRegistry.mjs";
import { WidgetFactory } from "../factory/WidgetFactory.mjs";
import { ThemeManager } from "../theme/ThemeManager.mjs";
import { SettingsManager } from "../settings/SettingsManager.mjs";
import { EventBus } from "../event/EventBus.mjs";
import { FirstFitPlacementStrategy } from "../strategy/PlacementStrategy.mjs";

export class GridOS {
  constructor(options = {}) {
    const eventBus = options.eventBus ?? new EventBus();
    const registry = options.registry ?? new WidgetRegistry(options.widgets ?? []);
    const themeManager =
      options.themeManager ?? new ThemeManager({ defaultTheme: options.defaultTheme ?? DefaultThemeId, eventBus });
    const settingsManager = options.settingsManager ?? new SettingsManager(eventBus);
    const factory = options.factory ?? new WidgetFactory(registry);
    const placementStrategy = options.placementStrategy ?? new FirstFitPlacementStrategy();

    this.layout = new LayoutManager({
      rows: options.rows ?? DefaultGridConfig.rows,
      cols: options.cols ?? DefaultGridConfig.cols,
      registry,
      factory,
      themeManager,
      settingsManager,
      eventBus,
      placementStrategy,
    });
  }

  on(eventName, handler) {
    return this.layout.on(eventName, handler);
  }

  registerWidget(definition) {
    this.layout.registry.register(definition);
    return this.layout.registry.get(definition.id);
  }

  listWidgets() {
    return this.layout.registry.list();
  }

  getWidget(widgetId) {
    return this.layout.registry.get(widgetId);
  }

  addWidget(widgetId, options = {}) {
    return this.layout.addWidget(widgetId, options);
  }

  placeWidget(widget, x, y, zone = "grid") {
    return this.layout.placeWidget(widget, x, y, zone);
  }

  moveWidget(widgetId, x, y, zone = null) {
    return this.layout.moveWidget(widgetId, x, y, zone);
  }

  resizeWidget(widgetId, size) {
    return this.layout.resizeWidget(widgetId, size);
  }

  removeWidget(widgetId) {
    return this.layout.removeWidget(widgetId);
  }

  setTheme(themeId) {
    return this.layout.setTheme(themeId);
  }

  setSetting(key, value) {
    return this.layout.setGlobalSetting(key, value);
  }

  setWidgetSetting(widgetId, key, value) {
    return this.layout.setWidgetSetting(widgetId, key, value);
  }

  canPlace(widget, x, y, zone = "grid") {
    return this.layout.canPlace(widget, x, y, zone);
  }

  export(pretty = false) {
    return this.layout.exportLayout(pretty);
  }

  import(payload) {
    return this.layout.importLayout(payload);
  }

  recover(payload) {
    return this.layout.recoverLayout(payload);
  }

  reset() {
    return this.layout.reset();
  }

  snapshot() {
    return this.layout.serialize();
  }
}

export function createGridOS(options = {}) {
  return new GridOS(options);
}
