import type { ComponentType, ReactNode } from "react";

export type WidgetState = "loading" | "ready" | "error" | "offline";
export type WidgetAction = "move" | "resize" | "duplicate" | "delete" | "pin" | "collapse";

export type WidgetActionPayload<TData = unknown> = {
  id: string;
  title: string;
  state: WidgetState;
  pinned: boolean;
  collapsed: boolean;
  data?: TData;
  errorMessage?: string;
};

export type WidgetActionHandler<TData = unknown> = (
  action: WidgetAction,
  payload: WidgetActionPayload<TData>,
) => void;

export type WidgetRenderContext<TData = unknown> = {
  definition: WidgetDefinition<TData>;
  data?: TData;
  state: {
    status: WidgetState;
    pinned: boolean;
    collapsed: boolean;
    errorMessage?: string;
  };
  emitAction: (action: WidgetAction) => void;
};

export type WidgetDefinition<TData = unknown> = {
  id: string;
  title: string;
  description?: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  initialData?: TData;
  renderContent: (context: WidgetRenderContext<TData>) => ReactNode;
  renderFooter?: (context: WidgetRenderContext<TData>) => ReactNode;
};

export type WidgetComponentProps<TData = unknown> = {
  definition: WidgetDefinition<TData>;
  data?: TData;
  onAction?: WidgetActionHandler<TData>;
  initiallyCollapsed?: boolean;
  initiallyPinned?: boolean;
};
