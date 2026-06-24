import { EventBus } from "../event/EventBus.mjs";

export class SettingsManager {
  constructor(eventBus = new EventBus()) {
    this.eventBus = eventBus;
    this.globalSettings = new Map();
    this.widgetSettings = new Map();
  }

  setGlobal(key, value) {
    this.globalSettings.set(key, value);
    this.eventBus.emit("settings:global-changed", { key, value });
  }

  getGlobal(key, fallback = undefined) {
    return this.globalSettings.has(key) ? this.globalSettings.get(key) : fallback;
  }

  setWidgetSetting(widgetId, key, value) {
    if (!this.widgetSettings.has(widgetId)) this.widgetSettings.set(widgetId, new Map());
    this.widgetSettings.get(widgetId).set(key, value);
    this.eventBus.emit("settings:widget-changed", { widgetId, key, value });
  }

  getWidgetSettings(widgetId) {
    const bucket = this.widgetSettings.get(widgetId);
    if (!bucket) return {};
    return Object.fromEntries(bucket.entries());
  }

  removeWidget(widgetId) {
    this.widgetSettings.delete(widgetId);
    this.eventBus.emit("settings:widget-removed", { widgetId });
  }

  serialize() {
    return {
      global: Object.fromEntries(this.globalSettings.entries()),
      widgets: Object.fromEntries(
        [...this.widgetSettings.entries()].map(([widgetId, values]) => [widgetId, Object.fromEntries(values.entries())]),
      ),
    };
  }

  hydrate(snapshot) {
    this.globalSettings.clear();
    this.widgetSettings.clear();

    for (const [key, value] of Object.entries(snapshot?.global ?? {})) this.globalSettings.set(key, value);
    for (const [widgetId, values] of Object.entries(snapshot?.widgets ?? {})) {
      this.widgetSettings.set(widgetId, new Map(Object.entries(values ?? {})));
    }
  }
}
