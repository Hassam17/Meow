import { DuplicateWidgetError, MissingWidgetError } from "../core/errors.mjs";

export class WidgetRegistry {
  constructor(definitions = []) {
    this.definitions = new Map();
    definitions.forEach((definition) => this.register(definition));
  }

  register(definition) {
    if (!definition?.id) throw new Error("Widget definition must include an id");
    if (this.definitions.has(definition.id)) {
      throw new DuplicateWidgetError(`Widget definition ${definition.id} already exists`);
    }
    this.definitions.set(definition.id, {
      enabled: true,
      allowedSizes: ["XS", "S", "M", "L"],
      ...definition,
    });
  }

  has(widgetId) {
    return this.definitions.has(widgetId);
  }

  get(widgetId) {
    const definition = this.definitions.get(widgetId);
    if (!definition) throw new MissingWidgetError(`Widget definition ${widgetId} was not found`);
    return definition;
  }

  list() {
    return [...this.definitions.values()];
  }

  ids() {
    return [...this.definitions.keys()];
  }
}
