import { Widget } from "../domain/Widget.mjs";
import { MissingWidgetError } from "../core/errors.mjs";

export class WidgetFactory {
  constructor(widgetRegistry) {
    this.widgetRegistry = widgetRegistry;
  }

  create(widgetId, overrides = {}) {
    if (!this.widgetRegistry.has(widgetId)) {
      throw new MissingWidgetError(`Cannot create unknown widget ${widgetId}`);
    }
    const definition = this.widgetRegistry.get(widgetId);
    const size = overrides.size ?? definition.defaultSize ?? "XS";
    const settings = {
      ...(definition.defaultSettings ?? {}),
      ...(overrides.settings ?? {}),
    };
    return new Widget({
      id: overrides.id ?? widgetId,
      kind: definition.kind ?? widgetId,
      size,
      settings,
      metadata: {
        title: definition.title ?? widgetId,
        category: definition.category ?? "general",
        ...definition.metadata,
        ...overrides.metadata,
      },
    });
  }

  fromSnapshot(snapshot) {
    return Widget.deserialize(snapshot);
  }
}
