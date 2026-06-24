"use client";

import type { ComponentType } from "react";
import { BaseWidget } from "@/components/widgets/framework/BaseWidget";
import type { WidgetComponentProps, WidgetDefinition, WidgetRenderContext } from "@/components/widgets/framework/types";

export type WidgetComponent<TData = unknown> = ComponentType<WidgetComponentProps<TData>>;

export function createWidgetComponent<TData = unknown>(definition: WidgetDefinition<TData>): WidgetComponent<TData> {
  class GeneratedWidget extends BaseWidget<TData> {
    static displayName = `${definition.id}Widget`;

    protected getDefinition() {
      return definition;
    }

    protected renderContent(context: WidgetRenderContext<TData>) {
      return definition.renderContent(context);
    }

    protected renderFooter(context: WidgetRenderContext<TData>) {
      return definition.renderFooter?.(context) ?? null;
    }
  }

  return GeneratedWidget as unknown as WidgetComponent<TData>;
}

export function createLegacyWidgetComponent<TData = unknown>(
  definition: WidgetDefinition<TData>,
  LegacyContent: ComponentType,
): WidgetComponent<TData> {
  return createWidgetComponent<TData>({
    ...definition,
    renderContent: () => <LegacyContent />,
  });
}
