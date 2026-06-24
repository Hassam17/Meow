"use client";

import type { WidgetComponent } from "@/components/widgets/framework/WidgetFactory";
import { createWidgetComponent } from "@/components/widgets/framework/WidgetFactory";
import type { WidgetDefinition } from "@/components/widgets/framework/types";

export type RegisteredWidget<TData = unknown> = WidgetDefinition<TData> & {
  component: WidgetComponent<TData>;
};

export class WidgetRegistry {
  private readonly entries = new Map<string, RegisteredWidget<any>>();

  register<TData = unknown>(definition: WidgetDefinition<TData>) {
    const entry: RegisteredWidget<TData> = {
      ...definition,
      component: createWidgetComponent(definition),
    };
    this.entries.set(definition.id, entry as RegisteredWidget<any>);
    return entry.component;
  }

  get(id: string) {
    return this.entries.get(id) ?? null;
  }

  has(id: string) {
    return this.entries.has(id);
  }

  list() {
    return [...this.entries.values()];
  }

  clear() {
    this.entries.clear();
  }
}

export const frameworkWidgetRegistry = new WidgetRegistry();

export function registerWidget<TData = unknown>(definition: WidgetDefinition<TData>) {
  return frameworkWidgetRegistry.register(definition);
}

export function getWidgetDefinition(id: string) {
  return frameworkWidgetRegistry.get(id);
}

export function listWidgets() {
  return frameworkWidgetRegistry.list();
}
